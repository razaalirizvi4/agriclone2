import { useCallback, useMemo, useState } from "react";
import cropService from "../../../services/crop.service";

const initialWorkflowStep = () => ({
  stepName: "",
  duration: "",
  equipmentRequired: [],
});

const createInitialFormState = () => ({
  recipe: {
    cropName: "",
    icon: "",
    description: "",
    expectedYieldValue: "",
    expectedYieldUnit: "kg/ha",
    expectedYieldAreaBasis: "Hectare",
    expectedYieldNotes: "",
  },
  temporal: {
    seedDateRangeStart: "",
    seedDateRangeEnd: "",
    harvestDateRangeStart: "",
    harvestDateRangeEnd: "",
  },
  environment: {
    soilPH: { min: "", max: "", optimal: "" },
    temperature: { min: "", max: "", optimal: "" },
    humidity: { min: "", max: "", optimal: "" },
    rainfall: { min: "", max: "", optimal: "" },
    soilType: {
      allowed: "",
      preferred: "",
      excluded: "",
    },
  },
  history: {
    preferredPreviousCrops: "",
    avoidPreviousCrops: "",
    minRotationInterval: "",
    maxConsecutiveYears: "",
    fieldRestPeriod: "",
    minDaysBeforeSowing: "",
    maxDaysBeforeSowing: "",
  },
  workflows: [initialWorkflowStep()],
});

const buildFormState = (cropName = "") => {
  const base = createInitialFormState();
  return {
    ...base,
    recipe: {
      ...base.recipe,
      cropName,
    },
  };
};

const mapRecipeToFormState = (recipe, cropName = "") => {
  if (!recipe) {
    return buildFormState(cropName);
  }

  const base = buildFormState(cropName);
  const recipeInfo = recipe.recipeInfo || {};
  const expectedYield = recipeInfo.expectedYield || {};
  const rules = recipe.recipeRules || {};
  const temporal = rules.temporalConstraints || {};
  const environmental = rules.environmentalConditions || {};
  const soilPH = environmental.soilPH || {};
  const temperature = environmental.temperature || {};
  const humidity = environmental.humidity || {};
  const rainfall = environmental.rainfall || {};
  const soilType = environmental.soilType || {};
  const historical = rules.historicalConstraints || {};
  const rotation = historical.cropRotation || {};
  const restPeriod = historical.fieldRestPeriod || {};
  const previousHarvest = historical.previousCropHarvestDate || {};

  const workflows = (recipe.recipeWorkflows || []).map((workflow) => ({
    stepName: workflow.stepName || "",
    duration: toInputString(workflow.duration),
    equipmentRequired: (workflow.equipmentRequired || []).map((equipment) => ({
      name: equipment.name || "",
      quantity: toInputString(equipment.quantity),
      optional: Boolean(equipment.optional),
    })),
  }));

  return {
    ...base,
    recipe: {
      ...base.recipe,
      description: recipeInfo.description || "",
      expectedYieldValue: toInputString(expectedYield.value),
      expectedYieldUnit: expectedYield.unit || base.recipe.expectedYieldUnit,
      expectedYieldAreaBasis:
        expectedYield.areaBasis || base.recipe.expectedYieldAreaBasis,
      expectedYieldNotes: expectedYield.notes || "",
    },
    temporal: {
      seedDateRangeStart: formatDateInput(temporal.seedDateRangeStart),
      seedDateRangeEnd: formatDateInput(temporal.seedDateRangeEnd),
      harvestDateRangeStart: formatDateInput(temporal.harvestDateRangeStart),
      harvestDateRangeEnd: formatDateInput(temporal.harvestDateRangeEnd),
    },
    environment: {
      soilPH: {
        min: toInputString(soilPH.min),
        max: toInputString(soilPH.max),
        optimal: toInputString(soilPH.optimal),
      },
      temperature: {
        min: toInputString(temperature.min),
        max: toInputString(temperature.max),
        optimal: toInputString(temperature.optimal),
      },
      humidity: {
        min: toInputString(humidity.min),
        max: toInputString(humidity.max),
        optimal: toInputString(humidity.optimal),
      },
      rainfall: {
        min: toInputString(rainfall.min),
        max: toInputString(rainfall.max),
        optimal: toInputString(rainfall.optimal),
      },
      soilType: {
        allowed: joinList(soilType.allowed),
        preferred: joinList(soilType.preferred),
        excluded: joinList(soilType.excluded),
      },
    },
    history: {
      preferredPreviousCrops: joinList(rotation.preferredPreviousCrops),
      avoidPreviousCrops: joinList(rotation.avoidPreviousCrops),
      minRotationInterval: toInputString(rotation.minRotationInterval),
      maxConsecutiveYears: toInputString(rotation.maxConsecutiveYears),
      fieldRestPeriod: toInputString(restPeriod.min),
      minDaysBeforeSowing: toInputString(previousHarvest.minDaysBeforeSowing),
      maxDaysBeforeSowing: toInputString(previousHarvest.maxDaysBeforeSowing),
    },
    workflows: workflows.length ? workflows : base.workflows,
  };
};

const stepsMeta = [
  "Recipe Info",
  "Temporal",
  "Environment",
  "History",
  "Workflow",
  "Review",
];

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const toDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const splitList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;

const formatDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const toInputString = (value) =>
  value === null || value === undefined ? "" : `${value}`;

const joinList = (value) =>
  Array.isArray(value) && value.length ? value.join(", ") : "";

const cleanObject = (obj) => {
  if (Array.isArray(obj)) {
    const cleaned = obj
      .map((item) => cleanObject(item))
      .filter((item) =>
        typeof item === "object"
          ? Object.keys(item).length > 0
          : item !== undefined
      );
    return cleaned.length ? cleaned : undefined;
  }

  if (typeof obj !== "object" || obj === null) {
    return obj === undefined ? undefined : obj;
  }

  const entries = Object.entries(obj)
    .map(([key, value]) => {
      const cleanedValue = cleanObject(value);
      return cleanedValue === undefined ? null : [key, cleanedValue];
    })
    .filter(Boolean);

  if (!entries.length) return undefined;
  return Object.fromEntries(entries);
};

const useRecipeFormViewModel = () => {
  const [form, setForm] = useState(() => createInitialFormState());
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState({
    saving: false,
    success: false,
    error: null,
  });
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  const updateSection = useCallback((section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }, []);

  const updateNestedSection = useCallback((section, group, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [group]: {
          ...prev[section][group],
          [field]: value,
        },
      },
    }));
  }, []);

  const updateWorkflowStep = useCallback((index, field, value) => {
    setForm((prev) => {
      const nextWorkflows = [...prev.workflows];
      nextWorkflows[index] = {
        ...nextWorkflows[index],
        [field]: value,
      };
      return { ...prev, workflows: nextWorkflows };
    });
  }, []);

  const addWorkflowStep = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      workflows: [...prev.workflows, initialWorkflowStep()],
    }));
  }, []);

  const removeWorkflowStep = useCallback((index) => {
    setForm((prev) => ({
      ...prev,
      workflows: prev.workflows.filter((_, i) => i !== index),
    }));
  }, []);

  const addEquipment = useCallback((stepIndex) => {
    setForm((prev) => {
      const nextWorkflows = [...prev.workflows];
      const stepData = nextWorkflows[stepIndex];
      nextWorkflows[stepIndex] = {
        ...stepData,
        equipmentRequired: [
          ...(stepData.equipmentRequired || []),
          { name: "", quantity: "", optional: false },
        ],
      };
      return { ...prev, workflows: nextWorkflows };
    });
  }, []);

  const updateEquipment = useCallback((stepIndex, equipmentIndex, field, value) => {
    setForm((prev) => {
      const nextWorkflows = [...prev.workflows];
      const equipment = [...(nextWorkflows[stepIndex].equipmentRequired || [])];
      equipment[equipmentIndex] = {
        ...equipment[equipmentIndex],
        [field]: value,
      };
      nextWorkflows[stepIndex] = {
        ...nextWorkflows[stepIndex],
        equipmentRequired: equipment,
      };
      return { ...prev, workflows: nextWorkflows };
    });
  }, []);

  const removeEquipment = useCallback((stepIndex, equipmentIndex) => {
    setForm((prev) => {
      const nextWorkflows = [...prev.workflows];
      nextWorkflows[stepIndex] = {
        ...nextWorkflows[stepIndex],
        equipmentRequired: nextWorkflows[stepIndex].equipmentRequired.filter(
          (_, i) => i !== equipmentIndex
        ),
      };
      return { ...prev, workflows: nextWorkflows };
    });
  }, []);

  const goToStep = useCallback((nextStep) => {
    setStep((current) =>
      Math.max(0, Math.min(stepsMeta.length - 1, nextStep))
    );
  }, []);

  const nextStep = useCallback(() => {
    goToStep(step + 1);
  }, [goToStep, step]);

  const previousStep = useCallback(() => {
    goToStep(step - 1);
  }, [goToStep, step]);

  const buildRecipeEntry = useCallback(() => {
    const recipeYieldValue = toNumber(form.recipe.expectedYieldValue);
    const workflows = form.workflows
      .map((workflow, index) => ({
        stepName: workflow.stepName || `Step ${index + 1}`,
        sequence: index + 1,
        duration: toNumber(workflow.duration),
        equipmentRequired: cleanObject(
          (workflow.equipmentRequired || []).map((equipment) => ({
            name: equipment.name,
            quantity: toNumber(equipment.quantity),
            optional: equipment.optional,
          }))
        ),
      }))
      .filter((workflow) => workflow.stepName);

    return cleanObject({
      id: editingRecipeId || `recipe-${Date.now()}`,
      recipeInfo: cleanObject({
        description: form.recipe.description,
        expectedYield: recipeYieldValue
          ? {
              value: recipeYieldValue,
              unit: form.recipe.expectedYieldUnit,
              areaBasis: form.recipe.expectedYieldAreaBasis,
              notes: form.recipe.expectedYieldNotes,
            }
          : undefined,
      }),
      recipeRules: cleanObject({
        temporalConstraints: {
          seedDateRangeStart: toDate(form.temporal.seedDateRangeStart),
          seedDateRangeEnd: toDate(form.temporal.seedDateRangeEnd),
          harvestDateRangeStart: toDate(form.temporal.harvestDateRangeStart),
          harvestDateRangeEnd: toDate(form.temporal.harvestDateRangeEnd),
        },
        environmentalConditions: {
          soilPH: {
            min: toNumber(form.environment.soilPH.min),
            max: toNumber(form.environment.soilPH.max),
            optimal: toNumber(form.environment.soilPH.optimal),
            unit: "pH",
          },
          temperature: {
            min: toNumber(form.environment.temperature.min),
            max: toNumber(form.environment.temperature.max),
            optimal: toNumber(form.environment.temperature.optimal),
            unit: "Celsius",
          },
          humidity: {
            min: toNumber(form.environment.humidity.min),
            max: toNumber(form.environment.humidity.max),
            optimal: toNumber(form.environment.humidity.optimal),
            unit: "%",
          },
          rainfall: {
            min: toNumber(form.environment.rainfall.min),
            max: toNumber(form.environment.rainfall.max),
            optimal: toNumber(form.environment.rainfall.optimal),
            unit: "mm/season",
          },
          soilType: cleanObject({
            allowed: splitList(form.environment.soilType.allowed),
            preferred: splitList(form.environment.soilType.preferred),
            excluded: splitList(form.environment.soilType.excluded),
          }),
        },
        historicalConstraints: cleanObject({
          cropRotation: {
            avoidPreviousCrops: splitList(form.history.avoidPreviousCrops),
            preferredPreviousCrops: splitList(
              form.history.preferredPreviousCrops
            ),
            minRotationInterval: toNumber(form.history.minRotationInterval),
            maxConsecutiveYears: toNumber(form.history.maxConsecutiveYears),
          },
          fieldRestPeriod: {
            min: toNumber(form.history.fieldRestPeriod),
            unit: "months",
          },
          previousCropHarvestDate: {
            minDaysBeforeSowing: toNumber(form.history.minDaysBeforeSowing),
            maxDaysBeforeSowing: toNumber(form.history.maxDaysBeforeSowing),
          },
        }),
      }),
      recipeWorkflows: cleanObject(workflows) || [],
    });
  }, [editingRecipeId, form]);

  const buildCreatePayload = useCallback(() => {
    const recipeEntry = buildRecipeEntry();
    return cleanObject({
      name: form.recipe.cropName,
      icon: form.recipe.icon,
      recipes: recipeEntry ? [recipeEntry] : undefined,
    });
  }, [buildRecipeEntry, form.recipe.cropName, form.recipe.icon]);

  const resetStatus = useCallback(() => {
    setStatus({
      saving: false,
      success: false,
      error: null,
    });
  }, []);

  const initializeForm = useCallback((cropName = "") => {
    setForm(() => buildFormState(cropName));
    setStep(0);
    setEditingRecipeId(null);
  }, []);

  const loadRecipeForEditing = useCallback((recipe, cropName = "") => {
    setForm(() => mapRecipeToFormState(recipe, cropName));
    setStep(0);
    setEditingRecipeId(recipe?.id || null);
    setStatus({
      saving: false,
      success: false,
      error: null,
    });
  }, []);

  const cancelEditing = useCallback(
    (cropName = form.recipe.cropName) => {
      initializeForm(cropName);
    },
    [form.recipe.cropName, initializeForm]
  );

  const hasValue = useCallback(
    (value) => value !== null && value !== undefined && `${value}`.trim() !== "",
    []
  );

  const validateRecipeInfo = useCallback(() => {
    if (!hasValue(form.recipe.cropName)) return "Crop name is required.";
    if (!hasValue(form.recipe.expectedYieldValue))
      return "Expected yield is required.";
    if (!hasValue(form.recipe.expectedYieldUnit))
      return "Select a yield unit.";
    if (!hasValue(form.recipe.expectedYieldAreaBasis))
      return "Select an area basis.";
    return null;
  }, [form.recipe, hasValue]);

  const validateTemporal = useCallback(() => {
    const fields = [
      "seedDateRangeStart",
      "seedDateRangeEnd",
      "harvestDateRangeStart",
      "harvestDateRangeEnd",
    ];
    for (const field of fields) {
      if (!hasValue(form.temporal[field])) {
        return "All temporal date fields are required.";
      }
    }
    return null;
  }, [form.temporal, hasValue]);

  const validateEnvironment = useCallback(() => {
    const rangeFields = ["min", "max", "optimal"];
    for (const key of rangeFields) {
      if (!hasValue(form.environment.soilPH[key])) {
        return "Please complete soil pH values.";
      }
    }

    const groups = [
      { key: "temperature", label: "temperature" },
      { key: "humidity", label: "humidity" },
      { key: "rainfall", label: "rainfall" },
    ];

    for (const group of groups) {
      for (const field of rangeFields) {
        if (!hasValue(form.environment[group.key][field])) {
          return `Please complete ${group.label} ${field} value.`;
        }
      }
    }

    if (!hasValue(form.environment.soilType.allowed))
      return "Allowed soil types are required.";
    if (!hasValue(form.environment.soilType.preferred))
      return "Preferred soil types are required.";
    if (!hasValue(form.environment.soilType.excluded))
      return "Excluded soil types are required.";

    return null;
  }, [form.environment, hasValue]);

  const validateHistory = useCallback(() => {
    const fields = [
      "preferredPreviousCrops",
      "avoidPreviousCrops",
      "minRotationInterval",
      "maxConsecutiveYears",
      "fieldRestPeriod",
      "minDaysBeforeSowing",
      "maxDaysBeforeSowing",
    ];
    for (const field of fields) {
      if (!hasValue(form.history[field])) {
        return "All historical constraint fields are required.";
      }
    }
    return null;
  }, [form.history, hasValue]);

  const validateWorkflow = useCallback(() => {
    if (!form.workflows.length) {
      return "Add at least one workflow step.";
    }

    for (const [index, workflow] of form.workflows.entries()) {
      if (!hasValue(workflow.stepName)) {
        return `Workflow step ${index + 1} requires a name.`;
      }
      if (!hasValue(workflow.duration)) {
        return `Workflow step ${index + 1} requires a duration.`;
      }
      for (const [eqIndex, equipment] of (
        workflow.equipmentRequired || []
      ).entries()) {
        if (!hasValue(equipment.name) || !hasValue(equipment.quantity)) {
          return `Equipment ${eqIndex + 1} in step ${
            index + 1
          } must include name and quantity.`;
        }
      }
    }
    return null;
  }, [form.workflows, hasValue]);

  const validateStep = useCallback(
    (targetStep = step) => {
      switch (targetStep) {
        case 0:
          return validateRecipeInfo();
        case 1:
          return validateTemporal();
        case 2:
          return validateEnvironment();
        case 3:
          return validateHistory();
        case 4:
          return validateWorkflow();
        default:
          return null;
      }
    },
    [
      step,
      validateEnvironment,
      validateHistory,
      validateRecipeInfo,
      validateTemporal,
      validateWorkflow,
    ]
  );

  const handleSubmit = useCallback(
    async ({ onSuccess } = {}) => {
      const cropName = form.recipe.cropName?.trim();
      const recipeEntry = buildRecipeEntry();

      if (!cropName) {
        setStatus({
          saving: false,
          success: false,
          error: "Crop name is required before saving.",
        });
        return;
      }

      if (!recipeEntry) {
        setStatus({
          saving: false,
          success: false,
          error: "Please complete recipe details before saving.",
        });
        return;
      }

      const createPayload = buildCreatePayload();
      setStatus({ saving: true, success: false, error: null });
      try {
        const { data: crops } = await cropService.getCropByName(cropName);
        const existingCrop = (crops || []).find(
          (crop) => crop.name?.toLowerCase() === cropName.toLowerCase()
        );

        if (existingCrop) {
          const nextRecipes = [...(existingCrop.recipes || [])];
          if (editingRecipeId) {
            const targetIndex = nextRecipes.findIndex(
              (recipe) => recipe.id === editingRecipeId
            );
            if (targetIndex === -1) {
              nextRecipes.push(recipeEntry);
            } else {
              nextRecipes[targetIndex] = recipeEntry;
            }
          } else {
            nextRecipes.push(recipeEntry);
          }
          await cropService.updateCrop(existingCrop._id, { recipes: nextRecipes });
        } else {
          await cropService.createCrop(createPayload);
        }

        initializeForm(form.recipe.cropName);
        setStatus({ saving: false, success: true, error: null });
        onSuccess?.();
      } catch (err) {
        setStatus({
          saving: false,
          success: false,
          error: err?.response?.data?.message || err.message,
        });
      }
    },
    [
      buildCreatePayload,
      buildRecipeEntry,
      editingRecipeId,
      form.recipe.cropName,
      initializeForm,
    ]
  );

  const reviewSummary = useMemo(() => {
    const { recipe, temporal, environment, history, workflows } = form;
    return {
      recipe,
      temporal,
      environment,
      history,
      workflows,
    };
  }, [form]);

  return {
    form,
    step,
    stepsMeta,
    status,
    updateSection,
    updateNestedSection,
    updateWorkflowStep,
    addWorkflowStep,
    removeWorkflowStep,
    addEquipment,
    updateEquipment,
    removeEquipment,
    nextStep,
    previousStep,
    goToStep,
    handleSubmit,
    initializeForm,
    resetStatus,
    reviewSummary,
    loadRecipeForEditing,
    cancelEditing,
    isEditing: Boolean(editingRecipeId),
    editingRecipeId,
    validateStep,
  };
};

export default useRecipeFormViewModel;

