import { useState, useEffect, useRef } from "react";
import useRecipeFormViewModel from "./ViewModel/useRecipeFormViewModel";

const cropOptions = [
  "Wheat",
  "Corn",
  "Rice",
  "Soybean",
  "Barley",
  "Oats",
  "Sorghum",
  "Millet",
  "Canola",
  "Cotton",
  "Potato",
  "Tomato",
  "Peanut",
  "Sugarcane",
  "Sunflower",
  "Lentil",
  "Chickpea",
  "Pea",
  "Cassava",
  "Quinoa",
];

const soilTypeOptions = [
  "Sandy",
  "Loamy",
  "Clay",
  "Silt",
  "Peaty",
  "Chalky",
  "Sandy Loam",
  "Clay Loam",
  "Silty Clay",
  "Silty Loam",
  "Loam",
  "Sandy Clay",
  "Gravelly",
  "Laterite",
  "Alluvial",
  "Black Soil",
  "Red Soil",
  "Volcanic",
  "Saline",
  "Calcareous",
];

const RecipeForm = ({
  selectedCropName,
  initialRecipe = null,
  onRecipeSaved,
  onCancelEdit,
}) => {
  const {
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
    isEditing,
    validateStep,
  } = useRecipeFormViewModel();
  const [validationError, setValidationError] = useState(null);

  const parseMultiValue = (value) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const formatLabel = (label = "") =>
    label
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (char) => char.toUpperCase());

  const renderSummaryValue = (value, depth = 0) => {
    if (value === null || value === undefined) {
      return <span className="review-summary-empty">—</span>;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? (
        <span>{trimmed}</span>
      ) : (
        <span className="review-summary-empty">—</span>
      );
    }

    if (typeof value === "number") {
      return <span>{value}</span>;
    }

    if (typeof value === "boolean") {
      return <span>{value ? "Yes" : "No"}</span>;
    }

    if (Array.isArray(value)) {
      if (!value.length) {
        return <span className="review-summary-empty">—</span>;
      }
      const containsObjects = value.some(
        (item) => typeof item === "object" && item !== null
      );
      if (containsObjects) {
        return (
          <div className="review-summary-collection">
            {value.map((item, index) => (
              <div key={index} className="review-summary-card">
                <span className="review-summary-card-title">
                  {`Item ${index + 1}`}
                </span>
                {renderSummaryValue(item, depth + 1)}
              </div>
            ))}
          </div>
        );
      }
      return <span>{value.join(", ")}</span>;
    }

    if (typeof value === "object") {
      const entries = Object.entries(value);
      if (!entries.length) {
        return <span className="review-summary-empty">—</span>;
      }
      return (
        <div className="review-summary-list">
          {entries.map(([key, nested]) => (
            <div key={key} className="review-summary-row">
              <span className="review-summary-term">{formatLabel(key)}</span>
              <div className="review-summary-value">
                {renderSummaryValue(nested, depth + 1)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span>{`${value}`}</span>;
  };

  useEffect(() => {
    if (!selectedCropName) return;
    if (initialRecipe) {
      loadRecipeForEditing(initialRecipe, selectedCropName);
    } else {
      initializeForm(selectedCropName);
    }
    setValidationError(null);
    resetStatus();
  }, [
    initialRecipe,
    initializeForm,
    loadRecipeForEditing,
    resetStatus,
    selectedCropName,
  ]);

  const MultiSelectDropdown = ({
    label,
    options,
    value,
    onChange,
    placeholder = "Select options",
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedValues = parseMultiValue(value);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    const toggleOption = (option) => {
      const isSelected = selectedValues.includes(option);
      const updatedValues = isSelected
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option];
      onChange(updatedValues.join(", "));
    };

    return (
      <div className="multi-select" ref={dropdownRef}>
        {label && <span className="multi-select-label">{label}</span>}
        <button
          type="button"
          className={`multi-select-trigger ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {selectedValues.length ? (
            <div className="multi-select-values">
              {selectedValues.map((item) => (
                <span key={item} className="multi-select-badge">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <span className="multi-select-placeholder">{placeholder}</span>
          )}
          <span className="multi-select-caret">▾</span>
        </button>
        {isOpen && (
          <div className="multi-select-menu">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  type="button"
                  key={option}
                  className={`multi-select-option ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => toggleOption(option)}
                >
                  <input type="checkbox" readOnly checked={isSelected} />
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getSelectValues = (event) =>
    Array.from(event.target.selectedOptions || []).map((option) => option.value);

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    nextStep();
  };

  const handleStepClick = (targetStep) => {
    if (targetStep <= step || isEditing) {
      setValidationError(null);
      goToStep(targetStep);
      return;
    }
    const error = validateStep(step);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    goToStep(targetStep);
  };

  const handleCancelEditing = () => {
    cancelEditing(selectedCropName);
    setValidationError(null);
    resetStatus();
    onCancelEdit?.();
  };

  const handleSaveRecipe = () =>
    handleSubmit({
      onSuccess: () => {
        onRecipeSaved?.();
      },
    });

  const reviewSections = [
    { key: "recipe", label: "Recipe Information", step: 0 },
    { key: "temporal", label: "Temporal Constraints", step: 1 },
    { key: "environment", label: "Environmental Conditions", step: 2 },
    { key: "history", label: "Historical Constraints", step: 3 },
    { key: "workflows", label: "Workflow Steps", step: 4 },
  ];

  const renderStepIndicators = () => (
    <div className="wizard-steps">
      {stepsMeta.map((label, index) => (
        <button
          key={label}
          className={`wizard-step ${index === step ? "active" : ""} ${
            index < step ? "completed" : ""
          }`}
          onClick={() => handleStepClick(index)}
          type="button"
        >
          <span className="wizard-step-index">{index + 1}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );

  const renderRecipeInfo = () => (
    <section className="recipe-section">
      <div className="section-header">
        <h2>Recipe Information</h2>
        <p>Basic details and expected yield for this crop recipe</p>
      </div>
      <div className="form-grid two">
        <label>
          Crop Name *
          <input
            type="text"
            value={form.recipe.cropName}
            onChange={(e) => updateSection("recipe", "cropName", e.target.value)}
            placeholder="e.g., Wheat"
            disabled={Boolean(selectedCropName)}
          />
        </label>
        <label>
          Icon URL
          <input
            type="text"
            value={form.recipe.icon}
            onChange={(e) => updateSection("recipe", "icon", e.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>
      <label>
        Recipe Description
        <textarea
          rows="4"
          value={form.recipe.description}
          onChange={(e) => updateSection("recipe", "description", e.target.value)}
          placeholder="e.g., Standard workflow for winter wheat cultivation in temperate regions"
        />
      </label>
      <div className="form-grid three">
        <label>
          Expected Yield *
          <input
            type="number"
            value={form.recipe.expectedYieldValue}
            onChange={(e) =>
              updateSection("recipe", "expectedYieldValue", e.target.value)
            }
            placeholder="e.g., 4500"
          />
        </label>
        <label>
          Yield Unit *
          <select
            value={form.recipe.expectedYieldUnit}
            onChange={(e) =>
              updateSection("recipe", "expectedYieldUnit", e.target.value)
            }
          >
            <option value="kg/ha">kg/ha</option>
            <option value="ton/ha">ton/ha</option>
            <option value="bushel/acre">bushel/acre</option>
          </select>
        </label>
        <label>
          Area Basis
          <select
            value={form.recipe.expectedYieldAreaBasis}
            onChange={(e) =>
              updateSection("recipe", "expectedYieldAreaBasis", e.target.value)
            }
          >
            <option value="Hectare">Hectare</option>
            <option value="Acre">Acre</option>
          </select>
        </label>
      </div>
      <label>
        Notes
        <input
          type="text"
          value={form.recipe.expectedYieldNotes}
          onChange={(e) =>
            updateSection("recipe", "expectedYieldNotes", e.target.value)
          }
          placeholder="Optional notes about expected yield"
        />
      </label>
    </section>
  );

  const renderTemporal = () => (
    <section className="recipe-section">
      <div className="section-header">
        <h2>Temporal Constraints</h2>
        <p>Define seeding and harvest date ranges</p>
      </div>
      <div className="form-grid four">
        <label>
          Seed Date Range Start *
          <input
            type="date"
            value={form.temporal.seedDateRangeStart}
            onChange={(e) =>
              updateSection("temporal", "seedDateRangeStart", e.target.value)
            }
          />
        </label>
        <label>
          Seed Date Range End *
          <input
            type="date"
            value={form.temporal.seedDateRangeEnd}
            onChange={(e) =>
              updateSection("temporal", "seedDateRangeEnd", e.target.value)
            }
          />
        </label>
        <label>
          Harvest Date Range Start *
          <input
            type="date"
            value={form.temporal.harvestDateRangeStart}
            onChange={(e) =>
              updateSection("temporal", "harvestDateRangeStart", e.target.value)
            }
          />
        </label>
        <label>
          Harvest Date Range End *
          <input
            type="date"
            value={form.temporal.harvestDateRangeEnd}
            onChange={(e) =>
              updateSection("temporal", "harvestDateRangeEnd", e.target.value)
            }
          />
        </label>
      </div>
    </section>
  );

  const renderEnvironment = () => (
    <section className="recipe-section">
      <div className="section-header">
        <h2>Environmental Conditions</h2>
        <p>Set soil, temperature, humidity, and rainfall requirements</p>
      </div>
      <div className="form-grid three">
        {["min", "max", "optimal"].map((field) => (
          <label key={`soil-${field}`}>
            {field === "min"
              ? "Min pH *"
              : field === "max"
              ? "Max pH *"
              : "Optimal pH"}
            <input
              type="number"
              value={form.environment.soilPH[field]}
              onChange={(e) =>
                updateNestedSection("environment", "soilPH", field, e.target.value)
              }
            />
          </label>
        ))}
      </div>
      {["temperature", "humidity", "rainfall"].map((group) => (
        <div key={group} className="form-grid three">
          {["min", "max", "optimal"].map((field) => (
            <label key={`${group}-${field}`}>
              {`${field === "min"
                ? "Min"
                : field === "max"
                ? "Max"
                : "Optimal"} ${
                group === "temperature"
                  ? "Temp (°C)"
                  : group === "humidity"
                  ? "Humidity (%)"
                  : "Rainfall (mm/season)"
              }`}
              <input
                type="number"
                value={form.environment[group][field]}
                onChange={(e) =>
                  updateNestedSection("environment", group, field, e.target.value)
                }
              />
            </label>
          ))}
        </div>
      ))}
      <MultiSelectDropdown
        label="Allowed Soil Types *"
        placeholder="Select allowed soil types"
        options={soilTypeOptions}
        value={form.environment.soilType.allowed}
        onChange={(selected) =>
          updateNestedSection("environment", "soilType", "allowed", selected)
        }
      />
      <div className="form-grid two">
        <MultiSelectDropdown
          label="Preferred Soil Types *"
          placeholder="Select preferred soil types"
          options={soilTypeOptions}
          value={form.environment.soilType.preferred}
          onChange={(selected) =>
            updateNestedSection("environment", "soilType", "preferred", selected)
          }
        />
        <MultiSelectDropdown
          label="Excluded Soil Types *"
          placeholder="Select excluded soil types"
          options={soilTypeOptions}
          value={form.environment.soilType.excluded}
          onChange={(selected) =>
            updateNestedSection("environment", "soilType", "excluded", selected)
          }
        />
      </div>
    </section>
  );

  const renderHistory = () => (
    <section className="recipe-section">
      <div className="section-header">
        <h2>Historical Constraints</h2>
        <p>Define crop rotation and field history requirements</p>
      </div>
      <MultiSelectDropdown
        label="Preferred Previous Crops *"
        placeholder="Select preferred crops"
        options={cropOptions}
        value={form.history.preferredPreviousCrops}
        onChange={(selected) =>
          updateSection("history", "preferredPreviousCrops", selected)
        }
      />
      <MultiSelectDropdown
        label="Avoid Previous Crops *"
        placeholder="Select crops to avoid"
        options={cropOptions}
        value={form.history.avoidPreviousCrops}
        onChange={(selected) =>
          updateSection("history", "avoidPreviousCrops", selected)
        }
      />
      <div className="form-grid four">
        <label>
          Min Rotation Interval (years)
          <input
            type="number"
            value={form.history.minRotationInterval}
            onChange={(e) =>
              updateSection("history", "minRotationInterval", e.target.value)
            }
          />
        </label>
        <label>
          Max Consecutive Years
          <input
            type="number"
            value={form.history.maxConsecutiveYears}
            onChange={(e) =>
              updateSection("history", "maxConsecutiveYears", e.target.value)
            }
          />
        </label>
        <label>
          Field Rest Period (months)
          <input
            type="number"
            value={form.history.fieldRestPeriod}
            onChange={(e) =>
              updateSection("history", "fieldRestPeriod", e.target.value)
            }
          />
        </label>
        <label>
          Previous Crop Harvest Window (days)
          <div className="inline-inputs">
            <input
              type="number"
              value={form.history.minDaysBeforeSowing}
              onChange={(e) =>
                updateSection("history", "minDaysBeforeSowing", e.target.value)
              }
              placeholder="Min"
            />
            <input
              type="number"
              value={form.history.maxDaysBeforeSowing}
              onChange={(e) =>
                updateSection("history", "maxDaysBeforeSowing", e.target.value)
              }
              placeholder="Max"
            />
          </div>
        </label>
      </div>
    </section>
  );

  const renderWorkflow = () => (
    <section className="recipe-section">
      <div className="section-header">
        <h2>Workflow Steps</h2>
        <p>Define the step-by-step workflow with equipment</p>
      </div>
      {form.workflows.map((workflow, index) => (
        <div key={`workflow-${index}`} className="workflow-card">
          <div className="workflow-header">
            <h3>Step {index + 1}</h3>
            <div>
              <button type="button" className="ghost-btn" onClick={() => addEquipment(index)}>
                + Add Equipment
              </button>
              {form.workflows.length > 1 && (
                <button
                  type="button"
                  className="ghost-btn danger"
                  onClick={() => removeWorkflowStep(index)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="form-grid two">
            <label>
              Step Name *
              <input
                type="text"
                value={workflow.stepName}
                onChange={(e) =>
                  updateWorkflowStep(index, "stepName", e.target.value)
                }
                placeholder="e.g., Land_Prep"
              />
            </label>
            <label>
              Duration (days) *
              <input
                type="number"
                value={workflow.duration}
                onChange={(e) =>
                  updateWorkflowStep(index, "duration", e.target.value)
                }
              />
            </label>
          </div>
          {(workflow.equipmentRequired || []).map((equipment, equipmentIndex) => (
            <div key={`equipment-${equipmentIndex}`} className="equipment-row">
              <div className="form-grid three">
                <label>
                  Equipment Name
                  <input
                    type="text"
                    value={equipment.name}
                    onChange={(e) =>
                      updateEquipment(index, equipmentIndex, "name", e.target.value)
                    }
                  />
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    value={equipment.quantity}
                    onChange={(e) =>
                      updateEquipment(index, equipmentIndex, "quantity", e.target.value)
                    }
                  />
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={equipment.optional}
                    onChange={(e) =>
                      updateEquipment(index, equipmentIndex, "optional", e.target.checked)
                    }
                  />
                  Optional
                </label>
              </div>
              <button
                type="button"
                className="ghost-btn danger"
                onClick={() => removeEquipment(index, equipmentIndex)}
              >
                Remove Equipment
              </button>
            </div>
          ))}
        </div>
      ))}
      <button type="button" className="primary-ghost" onClick={addWorkflowStep}>
        + Add Step
      </button>
    </section>
  );

  const renderReview = () => (
    <section className="recipe-section">
      <div className="section-header">
        <h2>Review Recipe</h2>
        <p>Review all details before submitting. Click edit to modify any section.</p>
      </div>
      <div className="review-grid">
        {reviewSections.map(({ key, label, step: sectionStep }) => (
          <div key={key} className="review-card">
            <div className="review-card-header">
              <h3>{label}</h3>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => goToStep(sectionStep)}
              >
                Edit
              </button>
            </div>
            <div className="review-summary-content">
              {renderSummaryValue(reviewSummary[key])}
            </div>
          </div>
        ))}
      </div>
      {status.error && <p className="form-error">{status.error}</p>}
      {status.success && (
        <p className="form-success">Recipe saved successfully!</p>
      )}
      <button
        type="button"
        className="primary-btn"
        onClick={handleSaveRecipe}
        disabled={status.saving}
      >
        {status.saving ? "Saving..." : "Save Recipe"}
      </button>
    </section>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return renderRecipeInfo();
      case 1:
        return renderTemporal();
      case 2:
        return renderEnvironment();
      case 3:
        return renderHistory();
      case 4:
        return renderWorkflow();
      case 5:
      default:
        return renderReview();
    }
  };

  return (
    <div className="recipe-form-wrapper">
      {isEditing && (
        <div className="form-alert editing-alert">
          <span>You are editing an existing recipe.</span>
          <button
            type="button"
            className="ghost-btn"
            onClick={handleCancelEditing}
            disabled={status.saving}
          >
            Cancel Edit
          </button>
        </div>
      )}
      {renderStepIndicators()}
      <form className="recipe-form" onSubmit={(e) => e.preventDefault()}>
        {renderCurrentStep()}
        {validationError && <p className="form-error">{validationError}</p>}
        {step < stepsMeta.length - 1 && (
          <div className="form-navigation">
            <button
              type="button"
              className="ghost-btn"
              onClick={previousStep}
              disabled={step === 0}
            >
              Previous
            </button>
            <button type="button" className="primary-btn" onClick={handleNext}>
              Next
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default RecipeForm;

