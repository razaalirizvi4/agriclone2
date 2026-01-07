import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTypes } from "../../type/type.slice";
import { getCrops } from "../../crops/slices/crop.slice";
import cropService from "../../../services/crop.service";

const SIMILARITY_WEIGHTS = {
  soilType: 0.3,
  soilPH: 0.3,
  temperature: 0.2,
  humidity: 0.2
};

const normalizeText = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

const parseNumber = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const match = value.match(/-?\d+(\.\d+)?/g);
    if (match?.length) {
      const nums = match.map((v) => parseFloat(v)).filter((n) => !isNaN(n));
      if (nums.length === 1) return nums[0];
      if (nums.length >= 2) return (nums[0] + nums[1]) / 2; // use avg of first two if range
    }
  }
  return undefined;
};

const parsePhValue = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const numeric = value.match(/(\d+(\.\d+)?)/g);
    if (Array.isArray(numeric) && numeric.length > 0) {
      const numbers = numeric.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
      if (numbers.length === 1) return numbers[0];
      if (numbers.length === 2) return (numbers[0] + numbers[1]) / 2;
    }
  }
  return undefined;
};

const scoreSoilType = (soilTypeRule, fieldSoilType) => {
  if (!soilTypeRule || !fieldSoilType) return 0;

  const fieldSoil = normalizeText(fieldSoilType);
  const inList = (list) => (list || []).map(normalizeText).includes(fieldSoil);

  if (inList(soilTypeRule.excluded)) return 0;
  if (inList(soilTypeRule.preferred)) return 1;
  if (inList(soilTypeRule.allowed)) return 0.8;

  if (
    !soilTypeRule.allowed?.length &&
    !soilTypeRule.preferred?.length &&
    !soilTypeRule.excluded?.length
  ) {
    return 0.5;
  }

  return 0.2;
};

const scoreSoilPh = (soilPhRule, fieldPhValue) => {
  if (!soilPhRule || fieldPhValue === undefined) return 0;

  const { min, max, optimal } = soilPhRule;
  const clampScore = (val) => Math.max(0, Math.min(1, val));

  if (optimal !== undefined) {
    const diff = Math.abs(fieldPhValue - optimal);
    return clampScore(1 - diff / 4);
  }

  if (min !== undefined && max !== undefined) {
    if (fieldPhValue >= min && fieldPhValue <= max) return 1;
    const distance = fieldPhValue < min ? min - fieldPhValue : fieldPhValue - max;
    return clampScore(1 - distance / 4);
  }

  if (min !== undefined) {
    return clampScore(fieldPhValue >= min ? 1 : 1 - (min - fieldPhValue) / 4);
  }

  if (max !== undefined) {
    return clampScore(fieldPhValue <= max ? 1 : 1 - (fieldPhValue - max) / 4);
  }

  return 0;
};

const scoreRange = (rangeRule, currentValue) => {
  if (!rangeRule || currentValue === undefined) return 0;
  const { min, max, optimal } = rangeRule;
  const clampScore = (val) => Math.max(0, Math.min(1, val));

  if (optimal !== undefined) {
    const diff = Math.abs(currentValue - optimal);
    return clampScore(1 - diff / (Math.abs(optimal) + 10 || 10));
  }

  if (min !== undefined && max !== undefined) {
    if (currentValue >= min && currentValue <= max) return 1;
    const distance = currentValue < min ? min - currentValue : currentValue - max;
    return clampScore(1 - distance / (Math.abs(max - min) + 10 || 10));
  }

  if (min !== undefined) {
    return clampScore(currentValue >= min ? 1 : 1 - (min - currentValue) / 10);
  }

  if (max !== undefined) {
    return clampScore(currentValue <= max ? 1 : 1 - (currentValue - max) / 10);
  }

  return 0;
};

const calculateRecipeSimilarity = (field, recipe, weights = SIMILARITY_WEIGHTS) => {
  const fieldAttrs = field?.attributes || {};
  const soilType = field?.soilType ?? fieldAttrs?.soilType;
  const soilPh = parsePhValue(field?.soilph ?? fieldAttrs?.soilph);
  const weather = field?.weather?.current || {};
  const tempValue =
    parseNumber(weather.temp) ??
    (weather.maxTemp !== undefined && weather.minTemp !== undefined
      ? parseNumber(weather.maxTemp) + parseNumber(weather.minTemp) / 2
      : parseNumber(weather.maxTemp ?? weather.minTemp));
  const humidityValue = parseNumber(weather.humid ?? weather.humidity);
  const env = recipe?.recipeRules?.environmentalConditions || {};

  let totalWeight = 0;
  let score = 0;

  if (weights.soilType && env.soilType) {
    totalWeight += weights.soilType;
    score += weights.soilType * scoreSoilType(env.soilType, soilType);
  }

  if (weights.soilPH && env.soilPH) {
    const phScore = scoreSoilPh(env.soilPH, soilPh);
    if (phScore > 0 || soilPh !== undefined) {
      totalWeight += weights.soilPH;
      score += weights.soilPH * phScore;
    }
  }

  if (weights.temperature && env.temperature) {
    const tempScore = scoreRange(env.temperature, tempValue);
    if (tempScore > 0 || tempValue !== undefined) {
      totalWeight += weights.temperature;
      score += weights.temperature * tempScore;
    }
  }

  if (weights.humidity && env.humidity) {
    const humidityScore = scoreRange(env.humidity, humidityValue);
    if (humidityScore > 0 || humidityValue !== undefined) {
      totalWeight += weights.humidity;
      score += weights.humidity * humidityScore;
    }
  }

  return totalWeight > 0 ? score / totalWeight : 0;
};

export const CropAssignmentForm = ({ field = {}, onSubmit, fieldName, onViewMap }) => {
    const dispatch = useDispatch();
    const {
      types = [],
      loading = false,
      error = null
    } = useSelector((state) => state.types || {});
    const {
      crops: cropOptions = []
    } = useSelector((state) => state.crops || {});
  
    const [cropAssignmentData, setCropAssignmentData] = useState({
      cropName: "",
      crop_id: "",
      cropStage: "",
      selectedRecipe: null
    });
    const [recipesState, setRecipesState] = useState({
      recipes: [],
      loading: false
    });
    const [viewingRecipeDetails, setViewingRecipeDetails] = useState(null);
  
    // Fetch field type metadata and crop options once on mount
    useEffect(() => {
      dispatch(getTypes({ type: "field" }));
      dispatch(getCrops());
    }, [dispatch]);
  
    // Memoize the currently selected field type definition
    const fieldTypeDefinition = useMemo(
      () => types.find((type) => type.type === "field"),
      [types]
    );
  
    const cropNameAttr = useMemo(
      () => fieldTypeDefinition?.attributes?.find(attr => attr.key === "cropName"),
      [fieldTypeDefinition]
    );
  
    const cropStageAttr = useMemo(
      () => fieldTypeDefinition?.attributes?.find(attr => attr.key === "cropStage"),
      [fieldTypeDefinition]
    );
  
    // Initialize crop assignment data from field
    useEffect(() => {
      if (field) {
        setCropAssignmentData({
          cropName: field?.cropName ?? "",
          crop_id: field?.crop_id ?? field?.attributes?.crop_id ?? "",
          cropStage: field?.cropStage ?? "",
          selectedRecipe: field?.selectedRecipe ?? null
        });
      }
    }, [field]);
  
    // Fetch recipes when cropName changes
    useEffect(() => {
      const fetchRecipes = async () => {
        if (!cropAssignmentData.cropName) {
          setRecipesState({ recipes: [], loading: false });
          // Clear selected recipe when crop changes
          setCropAssignmentData((prev) => ({ ...prev, selectedRecipe: null }));
          return;
        }
  
        setRecipesState((prev) => ({ ...prev, loading: true }));
        try {
          const { data: crops } = await cropService.getCropByName(
            cropAssignmentData.cropName
          );
          const selectedCrop = Array.isArray(crops)
            ? crops.find(
                (crop) =>
                  crop.name?.toLowerCase() ===
                  cropAssignmentData.cropName.toLowerCase()
              )
            : null;
  
          // Update crop_id if we found the crop but don't have it stored yet
          if (selectedCrop?._id && !cropAssignmentData.crop_id) {
            setCropAssignmentData((prev) => ({
              ...prev,
              crop_id: selectedCrop._id
            }));
          }
  
          const recipes = selectedCrop?.recipes || [];
          setRecipesState({ recipes, loading: false });
        } catch (err) {
          console.error("Error fetching recipes:", err);
          setRecipesState({ recipes: [], loading: false });
        }
      };
  
      fetchRecipes();
    }, [cropAssignmentData.cropName]);

    const recipesWithSimilarity = useMemo(() => {
      const recipes = Array.isArray(recipesState.recipes)
        ? recipesState.recipes
        : [];

      return recipes
        .map((recipe) => ({
          ...recipe,
          similarityScore: calculateRecipeSimilarity(field, recipe)
        }))
        .sort(
          (a, b) =>
            (b.similarityScore ?? 0) - (a.similarityScore ?? 0)
        );
    }, [recipesState.recipes, field]);
  
    const handleChange = (key, value) => {
      if (key === "cropName") {
        // When cropName changes, also find and store the crop_id
        const selectedCrop = cropOptions.find(
          (crop) => crop.name === value
        );
        
        
        setCropAssignmentData((prev) => ({
          ...prev,
          cropName: value,
          crop_id: selectedCrop?._id || "",
          // Clear selected recipe when crop changes
          selectedRecipe: null
        }));
      } else {
        setCropAssignmentData((prev) => ({
          ...prev,
          [key]: value
        }));
      }
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(cropAssignmentData);
    };
  
    if (loading && !cropNameAttr && !cropStageAttr) {
      return <div>Loading crop assignment fields...</div>;
    }
  
    if (error) {
      return <div>Error loading crop assignment fields: {error}</div>;
    }
  
    return (
      <div>
        <h3 style={{ margin: "0 0 15px 0" }}>Crop Assignment</h3>
  
        <div>
          <div style={{ 
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            marginBottom: "15px" 
          }}>
            <h4>Assign Crop to {fieldName}</h4>
            {onViewMap (
            )}
          </div>
  
          <form onSubmit={handleSubmit}>
            {cropNameAttr && (
              <div style={{ marginBottom: "15px" }}>
                <label htmlFor="cropName" style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                  {cropNameAttr.label}
                  {cropNameAttr.required ? " *" : ""}
                </label>
                <select
                  id="cropName"
                  name="cropName"
                  value={cropAssignmentData.cropName || ""}
                  onChange={(e) => handleChange("cropName", e.target.value)}
                  required={cropNameAttr.required}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                  }}
                >
                  <option value="">
                    {cropNameAttr.inputHint || "Select an option"}
                  </option>
                  {Array.isArray(cropOptions) &&
                    cropOptions.map((crop) => (
                      <option key={crop._id} value={crop.name}>
                        {crop.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
  
            {cropStageAttr && (
              <div style={{ marginBottom: "15px" }}>
                <label
                  htmlFor="cropStage"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                  }}
                >
                  {cropStageAttr.label}
                  {cropStageAttr.required ? " *" : ""}
                </label>
                <select
                  id="cropStage"
                  name="cropStage"
                  value={cropAssignmentData.cropStage || ""}
                  onChange={(e) => handleChange("cropStage", e.target.value)}
                  required={cropStageAttr.required}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  <option value="">
                    {cropStageAttr.inputHint || "Select an option"}
                  </option>
                  {cropStageAttr.inputConfig?.enum?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
  
            <button
              type="submit"
          className="primary-button"
            >
              Update Crop Assignment
            </button>
          </form>
  
          {/* Display Recipes */}
          {cropAssignmentData.cropName && (
            <div style={{ marginTop: "20px" }}>
              <h4
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                Recipes for {cropAssignmentData.cropName}
              </h4>
              {recipesState.loading ? (
                <div
                  style={{ padding: "10px", textAlign: "center", color: "#666" }}
                >
                  Loading recipes...
                </div>
              ) : recipesWithSimilarity.length > 0 ? (
                <div
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {recipesWithSimilarity.map((recipe, index) => {
                    const recipeId = recipe.id || `recipe-${index}`;
                    const isSelected =
                      cropAssignmentData.selectedRecipe?.id === recipeId;
                    const similarityPercent = Math.round(
                      (recipe.similarityScore ?? 0) * 100
                    );
  
                    return (
                      <div
                        key={recipeId}
                        onClick={() => handleChange("selectedRecipe", recipe)}
                        style={{
                          padding: "12px",
                          borderBottom:
                            index < recipesWithSimilarity.length - 1
                              ? "1px solid #f0f0f0"
                              : "none",
                          background: isSelected
                            ? "#e3f2fd"
                            : index % 2 === 0
                            ? "#fff"
                            : "#f8f9fa",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          borderLeft: isSelected
                            ? "3px solid #007bff"
                            : "3px solid transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = "#f0f7ff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background =
                              index % 2 === 0 ? "#fff" : "#f8f9fa";
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "4px",
                          }}
                        >
                          <input
                            type="radio"
                            name="selectedRecipe"
                            checked={isSelected}
                            onChange={() =>
                              handleChange("selectedRecipe", recipe)
                            }
                            style={{ marginRight: "8px", cursor: "pointer" }}
                          />
                          <div style={{ fontWeight: "bold", flex: 1 }}>
                            {recipe?.recipeInfo?.description?.trim() ||
                              recipe.id ||
                              `Recipe ${index + 1}`}
                          </div>
                          <div style={{ fontSize: "11px", color: "#555" }}>
                            Similarity: {similarityPercent}%
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChange("selectedRecipe", recipe);
                              setViewingRecipeDetails(recipe);
                            }}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              background: "#17a2b8",
                              color: "white",
                              border: "none",
                              borderRadius: "3px",
                              cursor: "pointer",
                              marginLeft: "8px",
                            }}
                          >
                            View Details
                          </button>
                        </div>
                        {recipe?.recipeInfo?.expectedYield && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginBottom: "4px",
                              marginLeft: "24px",
                            }}
                          >
                            Expected Yield:{" "}
                            {recipe.recipeInfo.expectedYield.value}{" "}
                            {recipe.recipeInfo.expectedYield.unit}
                          </div>
                        )}
                        {recipe?.recipeWorkflows &&
                          recipe.recipeWorkflows.length > 0 && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666",
                                marginLeft: "24px",
                              }}
                            >
                              Workflow Steps: {recipe.recipeWorkflows.length}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#666",
                    background: "#f8f9fa",
                    borderRadius: "4px",
                    border: "1px dashed #dee2e6",
                  }}
                >
                  No recipes found for this crop.
                </div>
              )}
            </div>
          )}
  
          {/* Recipe Details Modal/View */}
          {viewingRecipeDetails && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
              }}
              onClick={() => setViewingRecipeDetails(null)}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "8px",
                  maxWidth: "800px",
                  width: "100%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  padding: "20px",
                  position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setViewingRecipeDetails(null)}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
  
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: "20px",
                    fontWeight: "bold",
                  }}
                >
                  {viewingRecipeDetails?.recipeInfo?.description?.trim() ||
                    viewingRecipeDetails?.id ||
                    "Recipe Details"}
                </h3>
  
                {/* Recipe Info */}
                {viewingRecipeDetails?.recipeInfo && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#007bff",
                      }}
                    >
                      Recipe Information
                    </h4>
                    <div
                      style={{
                        padding: "10px",
                        background: "#f8f9fa",
                        borderRadius: "4px",
                      }}
                    >
                      {viewingRecipeDetails.recipeInfo.description && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Description:</strong>{" "}
                          {viewingRecipeDetails.recipeInfo.description}
                        </div>
                      )}
                      {viewingRecipeDetails.recipeInfo.expectedYield && (
                        <div>
                          <strong>Expected Yield:</strong>{" "}
                          {viewingRecipeDetails.recipeInfo.expectedYield.value}{" "}
                          {viewingRecipeDetails.recipeInfo.expectedYield.unit}
                          {viewingRecipeDetails.recipeInfo.expectedYield
                            .areaBasis && (
                            <span>
                              {" "}
                              per{" "}
                              {
                                viewingRecipeDetails.recipeInfo.expectedYield
                                  .areaBasis
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeInfo.expectedYield
                            .notes && (
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#666",
                              }}
                            >
                              Notes:{" "}
                              {
                                viewingRecipeDetails.recipeInfo.expectedYield
                                  .notes
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
  
                {/* Temporal Constraints */}
                {viewingRecipeDetails?.recipeRules?.temporalConstraints && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#007bff",
                      }}
                    >
                      Temporal Constraints
                    </h4>
                    <div
                      style={{
                        padding: "10px",
                        background: "#f8f9fa",
                        borderRadius: "4px",
                      }}
                    >
                      {viewingRecipeDetails.recipeRules.temporalConstraints
                        .seedDateRangeStart && (
                        <div style={{ marginBottom: "4px" }}>
                          <strong>Seed Date Range:</strong>{" "}
                          {new Date(
                            viewingRecipeDetails.recipeRules.temporalConstraints.seedDateRangeStart
                          ).toLocaleDateString()}
                          {viewingRecipeDetails.recipeRules.temporalConstraints
                            .seedDateRangeEnd && (
                            <span>
                              {" - "}
                              {new Date(
                                viewingRecipeDetails.recipeRules.temporalConstraints.seedDateRangeEnd
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                      {viewingRecipeDetails.recipeRules.temporalConstraints
                        .harvestDateRangeStart && (
                        <div>
                          <strong>Harvest Date Range:</strong>{" "}
                          {new Date(
                            viewingRecipeDetails.recipeRules.temporalConstraints.harvestDateRangeStart
                          ).toLocaleDateString()}
                          {viewingRecipeDetails.recipeRules.temporalConstraints
                            .harvestDateRangeEnd && (
                            <span>
                              {" - "}
                              {new Date(
                                viewingRecipeDetails.recipeRules.temporalConstraints.harvestDateRangeEnd
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
  
                {/* Environmental Conditions */}
                {viewingRecipeDetails?.recipeRules?.environmentalConditions && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#007bff",
                      }}
                    >
                      Environmental Conditions
                    </h4>
                    <div
                      style={{
                        padding: "10px",
                        background: "#f8f9fa",
                        borderRadius: "4px",
                      }}
                    >
                      {viewingRecipeDetails.recipeRules.environmentalConditions
                        .soilPH && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Soil pH:</strong>{" "}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.soilPH.min && (
                            <span>
                              Min:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.soilPH.min
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.soilPH.max && (
                            <span>
                              {" "}
                              Max:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.soilPH.max
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.soilPH.optimal && (
                            <span>
                              {" "}
                              Optimal:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.soilPH.optimal
                              }
                            </span>
                          )}
                        </div>
                      )}
                      {viewingRecipeDetails.recipeRules.environmentalConditions
                        .temperature && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Temperature (°C):</strong>{" "}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.temperature.min && (
                            <span>
                              Min:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.temperature.min
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.temperature.max && (
                            <span>
                              {" "}
                              Max:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.temperature.max
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.temperature.optimal && (
                            <span>
                              {" "}
                              Optimal:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.temperature.optimal
                              }
                            </span>
                          )}
                        </div>
                      )}
                      {viewingRecipeDetails.recipeRules.environmentalConditions
                        .humidity && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Humidity (%):</strong>{" "}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.humidity.min && (
                            <span>
                              Min:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.humidity.min
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.humidity.max && (
                            <span>
                              {" "}
                              Max:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.humidity.max
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.humidity.optimal && (
                            <span>
                              {" "}
                              Optimal:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.humidity.optimal
                              }
                            </span>
                          )}
                        </div>
                      )}
                      {viewingRecipeDetails.recipeRules.environmentalConditions
                        .rainfall && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Rainfall (mm/season):</strong>{" "}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.rainfall.min && (
                            <span>
                              Min:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.rainfall.min
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.rainfall.max && (
                            <span>
                              {" "}
                              Max:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.rainfall.max
                              }
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.rainfall.optimal && (
                            <span>
                              {" "}
                              Optimal:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .environmentalConditions.rainfall.optimal
                              }
                            </span>
                          )}
                        </div>
                      )}
                      {viewingRecipeDetails.recipeRules.environmentalConditions
                        .soilType && (
                        <div>
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.soilType.allowed?.length >
                            0 && (
                            <div style={{ marginBottom: "4px" }}>
                              <strong>Allowed Soil Types:</strong>{" "}
                              {viewingRecipeDetails.recipeRules.environmentalConditions.soilType.allowed.join(
                                ", "
                              )}
                            </div>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.soilType.preferred?.length >
                            0 && (
                            <div style={{ marginBottom: "4px" }}>
                              <strong>Preferred Soil Types:</strong>{" "}
                              {viewingRecipeDetails.recipeRules.environmentalConditions.soilType.preferred.join(
                                ", "
                              )}
                            </div>
                          )}
                          {viewingRecipeDetails.recipeRules
                            .environmentalConditions.soilType.excluded?.length >
                            0 && (
                            <div>
                              <strong>Excluded Soil Types:</strong>{" "}
                              {viewingRecipeDetails.recipeRules.environmentalConditions.soilType.excluded.join(
                                ", "
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
  
                {/* Historical Constraints */}
                {viewingRecipeDetails?.recipeRules?.historicalConstraints && (
                  <div style={{ marginBottom: "20px" }}>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#007bff",
                      }}
                    >
                      Historical Constraints
                    </h4>
                    <div
                      style={{
                        padding: "10px",
                        background: "#f8f9fa",
                        borderRadius: "4px",
                      }}
                    >
                      {viewingRecipeDetails.recipeRules.historicalConstraints
                        .cropRotation && (
                        <div style={{ marginBottom: "8px" }}>
                          {viewingRecipeDetails.recipeRules.historicalConstraints
                            .cropRotation.preferredPreviousCrops?.length > 0 && (
                            <div style={{ marginBottom: "4px" }}>
                              <strong>Preferred Previous Crops:</strong>{" "}
                              {viewingRecipeDetails.recipeRules.historicalConstraints.cropRotation.preferredPreviousCrops.join(
                                ", "
                              )}
                            </div>
                          )}
                          {viewingRecipeDetails.recipeRules.historicalConstraints
                            .cropRotation.avoidPreviousCrops?.length > 0 && (
                            <div style={{ marginBottom: "4px" }}>
                              <strong>Avoid Previous Crops:</strong>{" "}
                              {viewingRecipeDetails.recipeRules.historicalConstraints.cropRotation.avoidPreviousCrops.join(
                                ", "
                              )}
                            </div>
                          )}
                          {viewingRecipeDetails.recipeRules.historicalConstraints
                            .cropRotation.minRotationInterval && (
                            <div style={{ marginBottom: "4px" }}>
                              <strong>Min Rotation Interval:</strong>{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .historicalConstraints.cropRotation
                                  .minRotationInterval
                              }{" "}
                              years
                            </div>
                          )}
                          {viewingRecipeDetails.recipeRules.historicalConstraints
                            .cropRotation.maxConsecutiveYears && (
                            <div>
                              <strong>Max Consecutive Years:</strong>{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .historicalConstraints.cropRotation
                                  .maxConsecutiveYears
                              }
                            </div>
                          )}
                        </div>
                      )}
                      {viewingRecipeDetails.recipeRules.historicalConstraints
                        .fieldRestPeriod && (
                        <div style={{ marginBottom: "8px" }}>
                          <strong>Field Rest Period:</strong>{" "}
                          {
                            viewingRecipeDetails.recipeRules.historicalConstraints
                              .fieldRestPeriod.min
                          }{" "}
                          {viewingRecipeDetails.recipeRules.historicalConstraints
                            .fieldRestPeriod.unit || "months"}
                        </div>
                      )}
                      {viewingRecipeDetails.recipeRules.historicalConstraints
                        .previousCropHarvestDate && (
                        <div>
                          <strong>Previous Crop Harvest Window:</strong>{" "}
                          {viewingRecipeDetails.recipeRules.historicalConstraints
                            .previousCropHarvestDate.minDaysBeforeSowing && (
                            <span>
                              Min:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .historicalConstraints.previousCropHarvestDate
                                  .minDaysBeforeSowing
                              }{" "}
                              days
                            </span>
                          )}
                          {viewingRecipeDetails.recipeRules.historicalConstraints
                            .previousCropHarvestDate.maxDaysBeforeSowing && (
                            <span>
                              {" "}
                              Max:{" "}
                              {
                                viewingRecipeDetails.recipeRules
                                  .historicalConstraints.previousCropHarvestDate
                                  .maxDaysBeforeSowing
                              }{" "}
                              days
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
  
                {/* Workflow Steps */}
                {viewingRecipeDetails?.recipeWorkflows &&
                  viewingRecipeDetails.recipeWorkflows.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "#007bff",
                        }}
                      >
                        Workflow Steps (
                        {viewingRecipeDetails.recipeWorkflows.length})
                      </h4>
                      <div
                        style={{
                          padding: "10px",
                          background: "#f8f9fa",
                          borderRadius: "4px",
                        }}
                      >
                        {viewingRecipeDetails.recipeWorkflows.map(
                          (workflow, idx) => (
                            <div
                              key={idx}
                              style={{
                                marginBottom:
                                  idx <
                                  viewingRecipeDetails.recipeWorkflows.length - 1
                                    ? "15px"
                                    : "0",
                                padding: "10px",
                                background: "white",
                                borderRadius: "4px",
                                border: "1px solid #e0e0e0",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: "bold",
                                  marginBottom: "6px",
                                }}
                              >
                                Step {workflow.sequence || idx + 1}:{" "}
                                {workflow.stepName || `Step ${idx + 1}`}
                              </div>
                              {workflow.duration && (
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#666",
                                    marginBottom: "6px",
                                  }}
                                >
                                  Duration: {workflow.duration} days
                                </div>
                              )}
                              {workflow.equipmentRequired &&
                                workflow.equipmentRequired.length > 0 && (
                                  <div
                                    style={{ fontSize: "12px", color: "#666" }}
                                  >
                                    <strong>Equipment:</strong>
                              <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                                {workflow.equipmentRequired.map((equipment, eqIdx) => (
                                          <li key={eqIdx}>
                                            {equipment.name} (Qty:{" "}
                                            {equipment.quantity}
                                            {equipment.optional
                                              ? ", Optional"
                                              : ""}
                                            )
                                          </li>
                                ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                      ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };