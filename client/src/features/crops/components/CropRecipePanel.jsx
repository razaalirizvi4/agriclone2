import { useCallback, useMemo, useState } from "react";
import RecipeForm from "./RecipeForm";
import cropService from "../../../services/crop.service";

const CropRecipePanel = ({ crops, loading, error, onRefreshCrops }) => {
  const [selectedCropId, setSelectedCropId] = useState("");
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [recipeStatus, setRecipeStatus] = useState({
    deleting: null,
    error: null,
  });

  const selectedCrop = useMemo(
    () => crops.find((crop) => crop._id === selectedCropId),
    [crops, selectedCropId]
  );
  const selectedRecipes = selectedCrop?.recipes || [];

  const handleCropSelect = (event) => {
    const nextId = event.target.value;
    setSelectedCropId(nextId);
    setShowRecipeForm(false);
    setActiveRecipe(null);
    setRecipeStatus({ deleting: null, error: null });
  };

  const handleRecipeLaunch = () => {
    if (!selectedCrop) return;
    setActiveRecipe(null);
    setShowRecipeForm(true);
  };

  const handleRecipeEdit = (recipe) => {
    setActiveRecipe(recipe);
    setShowRecipeForm(true);
  };

  const handleRecipeEditCancel = () => {
    setActiveRecipe(null);
    setShowRecipeForm(false);
  };

  const handleRecipeSaved = useCallback(async () => {
    await onRefreshCrops?.();
    setActiveRecipe(null);
    setShowRecipeForm(false);
  }, [onRefreshCrops]);

  const handleRecipeDelete = async (recipe) => {
    if (!selectedCrop || !recipe) return;
    const recipeLabel =
      recipe?.recipeInfo?.description?.trim() || recipe.id || "this recipe";
    const confirmDelete = window.confirm(
      `Delete ${recipeLabel}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    setRecipeStatus({ deleting: recipe.id, error: null });
    try {
      const remaining = (selectedCrop.recipes || []).filter(
        (item) => item.id !== recipe.id
      );
      await cropService.updateCrop(selectedCrop._id, { recipes: remaining });
      setRecipeStatus({ deleting: null, error: null });
      if (activeRecipe?.id === recipe.id) {
        setActiveRecipe(null);
        setShowRecipeForm(false);
      }
      await onRefreshCrops?.();
    } catch (err) {
      setRecipeStatus({
        deleting: null,
        error: err?.response?.data?.message || err.message,
      });
    }
  };

  const renderRecipeMeta = (recipe) => {
    const expected = recipe?.recipeInfo?.expectedYield;
    const yieldSummary = expected?.value
      ? `${expected.value}${expected.unit ? ` ${expected.unit}` : ""}`
      : "—";
    const stepsCount = recipe?.recipeWorkflows?.length || 0;
    return `Yield: ${yieldSummary} • Steps: ${stepsCount}`;
  };

  return (
    <section className="recipe-card">
      <div className="recipe-card-header">
        <div>
          <h2>Attach Recipe to Crop</h2>
          <p>Select an existing crop, then tap the plus icon to start a recipe.</p>
        </div>
        <button
          type="button"
          className="recipe-add-trigger"
          onClick={handleRecipeLaunch}
          disabled={!selectedCrop}
          title={selectedCrop ? `Add recipe for ${selectedCrop.name}` : "Select a crop first"}
        >
          +
        </button>
      </div>
      <label className="recipe-select">
        <span>Crop Library</span>
        <select
          value={selectedCropId}
          onChange={handleCropSelect}
          disabled={loading || !crops.length}
        >
          <option value="">{loading ? "Loading crops..." : "Select a crop"}</option>
          {crops.map((crop) => (
            <option key={crop._id} value={crop._id}>
              {crop.name}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="form-error">{error}</p>}

      {selectedCrop ? (
        <>
          <div className="recipe-library">
            <div className="recipe-library-header">
              <h3>Recipes for {selectedCrop.name}</h3>
              <span>
                {selectedRecipes.length
                  ? `${selectedRecipes.length} ${
                      selectedRecipes.length === 1 ? "recipe" : "recipes"
                    }`
                  : "No recipes yet"}
              </span>
            </div>
            {selectedRecipes.length ? (
              <ul className="recipe-library-list">
                {selectedRecipes.map((recipe) => (
                  <li
                    key={recipe.id}
                    className={`recipe-library-item ${
                      activeRecipe?.id === recipe.id ? "active" : ""
                    }`}
                  >
                    <div className="recipe-library-details">
                      <h4>
                        {recipe?.recipeInfo?.description?.trim() ||
                          recipe.id ||
                          "Untitled Recipe"}
                      </h4>
                      <p>{renderRecipeMeta(recipe)}</p>
                    </div>
                    <div className="recipe-library-actions">
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => handleRecipeEdit(recipe)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ghost-btn danger"
                        onClick={() => handleRecipeDelete(recipe)}
                        disabled={recipeStatus.deleting === recipe.id}
                      >
                        {recipeStatus.deleting === recipe.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="recipe-placeholder">
                No recipes yet. Click the plus icon to add the first one.
              </div>
            )}
            {recipeStatus.error && <p className="form-error">{recipeStatus.error}</p>}
          </div>
          {showRecipeForm ? (
            <RecipeForm
              key={selectedCrop._id}
              selectedCropName={selectedCrop.name}
              initialRecipe={activeRecipe}
              onRecipeSaved={handleRecipeSaved}
              onCancelEdit={handleRecipeEditCancel}
            />
          ) : (
            <div className="recipe-placeholder">
              Select a recipe to edit above or click the plus icon to start a new recipe.
            </div>
          )}
        </>
      ) : (
        <div className="recipe-placeholder">
          Choose a crop from the list, then click the plus icon to launch the recipe builder.
        </div>
      )}
    </section>
  );
};

export default CropRecipePanel;


