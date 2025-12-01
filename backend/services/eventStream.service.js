const {
  getEvents: getEventsData,
  updateEventStatus: updateEventStatusData,
  pushEvent: pushEventData
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

const buildRecipeWorkflowEvents = (cropDoc, recipeDoc, fieldId, baselineDate) => {
  const workflows = sortWorkflows(recipeDoc?.recipeWorkflows || []);

  if (!workflows.length) {
    throw new Error(`Recipe "${recipeDoc?.id || recipeDoc?._id}" does not contain any workflow steps.`);
  }

  if (!fieldId) {
    throw new Error('fieldId is required to assign events to a field.');
  }

  let cursorDate = new Date(baselineDate);

  return workflows.map((workflow, index) => {
    const stepName = workflow.stepName || workflow.name || `Workflow Step ${index + 1}`;
    const durationDays = Number(workflow.duration) || 0;
    const eventDate = new Date(cursorDate);
    cursorDate = addDays(cursorDate, durationDays);

    return {
      Feature_Type: stepName,
      Module_Action: 'RecipeWorkflow',
      Date: eventDate,
      State: 'Scheduled',
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
};

const createFieldLifeCycleEvents = async ({
  cropId,
  recipeId,
  fieldId,
  startDate = new Date(),
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

  const events = buildRecipeWorkflowEvents(crop, recipe, fieldId, startDate);

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

module.exports = {
  getEvents,
  updateEventStatus,
  pushEvent: pushEventData,
  createFieldLifeCycleEvents,
  buildRecipeWorkflowEvents
};