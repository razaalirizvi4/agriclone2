const {
  getEvents: getEventsData,
  updateEventStatus: updateEventStatusData,
  pushEvent: pushEventData,
  deleteEventsByFieldIds: deleteEventsByFieldIdsData
} = require('../api/dataLayer/eventStream.dataLayer.js');
const Crop = require('../api/models/cropModule/crop.model.js');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toStringId = (value) => (value ? value.toString() : undefined);

const addDays = (date, days) => new Date(date.getTime() + days * DAY_IN_MS);

const sortWorkflows = (workflows = []) => {
  return [...workflows].sort((a, b) => {
    const seqA = Number.isFinite(a.sequence) ? a.sequence : 0;
    const seqB = Number.isFinite(b.sequence) ? b.sequence : 0;
    if (seqA === seqB) return 0;
    return seqA < seqB ? -1 : 1;
  });
};

// Crop stages in order
const CROP_STAGES = ['Land_Prep', 'Seeding', 'Irrigation', 'Disease', 'Fertilizer', 'Harvesting'];

// Helper to check if a workflow step name matches a crop stage
const matchesCropStage = (stepName, cropStage) => {
  if (!stepName || !cropStage) {
    return false;
  }
  const normalizedStepName = String(stepName).trim();
  const normalizedCropStage = String(cropStage).trim();
  
  // Direct match
  if (normalizedStepName === normalizedCropStage) {
    return true;
  }
  
  // Case-insensitive match
  if (normalizedStepName.toLowerCase() === normalizedCropStage.toLowerCase()) {
    return true;
  }
  
  // Check if step name contains crop stage (e.g., "Land Preparation" matches "Land_Prep")
  const stepNameLower = normalizedStepName.toLowerCase().replace(/[_\s-]/g, '');
  const cropStageLower = normalizedCropStage.toLowerCase().replace(/[_\s-]/g, '');
  if (stepNameLower.includes(cropStageLower) || cropStageLower.includes(stepNameLower)) {
    return true;
  }
  
  return false;
};

// Helper to determine event state based on crop stage
const getEventState = (stepName, selectedCropStage, stepIndex, totalSteps) => {
  if (!selectedCropStage) {
    return 'Pending'; // Default state if no crop stage selected
  }
  
  // Find the index of the selected crop stage
  const selectedStageIndex = CROP_STAGES.indexOf(selectedCropStage);
  if (selectedStageIndex === -1) {
    return 'Pending'; // Invalid crop stage, default to Pending
  }
  
  // Check if this step matches the selected crop stage or any stage before it
  let stepStageIndex = -1;
  for (let i = 0; i < CROP_STAGES.length; i++) {
    if (matchesCropStage(stepName, CROP_STAGES[i])) {
      stepStageIndex = i;
      break;
    }
  }
  
  // If step doesn't match any crop stage, use position-based logic
  if (stepStageIndex === -1) {
    // Approximate: divide steps into crop stages proportionally
    const stepsPerStage = totalSteps / CROP_STAGES.length;
    const approximateStageIndex = Math.floor(stepIndex / stepsPerStage);
    stepStageIndex = Math.min(approximateStageIndex, CROP_STAGES.length - 1);
  }
  
  // Mark events before selected stage as Completed, from selected stage onwards as Pending
  const state = stepStageIndex < selectedStageIndex ? 'Completed' : 'Pending';
  
  return state;
};

const buildRecipeWorkflowEvents = (cropDoc, recipeDoc, fieldId, baselineDate, selectedCropStage = null) => {
  const workflows = sortWorkflows(recipeDoc?.recipeWorkflows || []);

  if (!workflows.length) {
    throw new Error(`Recipe "${recipeDoc?.id || recipeDoc?._id}" does not contain any workflow steps.`);
  }

  if (!fieldId) {
    throw new Error('fieldId is required to assign events to a field.');
  }

  let cursorDate = new Date(baselineDate);

  const events = workflows.map((workflow, index) => {
    const stepName = workflow.stepName || workflow.name || `Workflow Step ${index + 1}`;
    const durationDays = Number(workflow.duration) || 0;
    const eventDate = new Date(cursorDate);
    cursorDate = addDays(cursorDate, durationDays);

    // Determine state based on crop stage
    const eventState = getEventState(stepName, selectedCropStage, index, workflows.length);

    return {
      Feature_Type: stepName,
      Module_Action: 'RecipeWorkflow',
      Date: eventDate,
      State: eventState,
      Meta_Data: {
        cropName: cropDoc.name,
        recipeDescription: recipeDoc.recipeInfo?.description,
        workflowSequence: workflow.sequence ?? index + 1,
        workflowDurationDays: durationDays,
        equipmentRequired: workflow.equipmentRequired || []
      },
      RelationIds: {
        Crop_id: toStringId(cropDoc._id),
        Field_id: toStringId(fieldId),
        Recipe_id: recipeDoc.id || toStringId(recipeDoc._id),
        Workflow_id: toStringId(workflow._id)
      }
    };
  });
  
  return events;
};

const createFieldLifeCycleEvents = async ({
  cropId,
  recipeId,
  fieldId,
  startDate = new Date(),
  cropStage = null,
  save = true
}) => {
  if (!cropId || !recipeId || !fieldId) {
    throw new Error('cropId, recipeId, and fieldId are required to create lifecycle events.');
  }

  const crop = await Crop.findById(cropId).lean();
  if (!crop) {
    throw new Error(`Crop with id "${cropId}" was not found.`);
  }
  
  const recipe =
    (crop.recipes || []).find((rec) => {
      const recId = rec.id || toStringId(rec._id);
      return recId === recipeId;
    }) ||
    (crop.recipes || []).find((rec) => toStringId(rec._id) === recipeId);

  if (!recipe) {
    throw new Error(`Recipe "${recipeId}" was not found inside crop "${crop.name}".`);
  }

  const events = buildRecipeWorkflowEvents(crop, recipe, fieldId, startDate, cropStage);

  if (!save) {
    return { events, savedEvents: [] };
  }

  const savedEvents = [];
  for (const event of events) {
    const saved = await pushEventData(event);
    savedEvents.push(saved);
  }

  return { events, savedEvents };
};

const getEvents = async (queryParams) => {
  return await getEventsData(queryParams);
};

const updateEventStatus = async (eventId, userId, status) => {
  return await updateEventStatusData(eventId, userId, status);
};

const pushEvent = async (eventData) => {
  return await pushEventData(eventData);
};

const deleteEventsByFieldIds = async (fieldIds) => {
  return await deleteEventsByFieldIdsData(fieldIds);
};

module.exports = {
  getEvents,
  updateEventStatus,
  pushEvent: pushEventData,
  createFieldLifeCycleEvents,
  buildRecipeWorkflowEvents,
  deleteEventsByFieldIds,
  CROP_STAGES // Export for use in other modules
};