import { useCallback, useEffect, useMemo, useState } from "react";
import RecipeForm from "../components/RecipeForm";
import cropService from "../services/crop.service";

const initialCropFormState = {
  name: "",
  icon: "",
  description: "",
};

const RecipeWizard = () => {
  const [crops, setCrops] = useState([]);
  const [cropsLoading, setCropsLoading] = useState(true);
  const [cropsError, setCropsError] = useState(null);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [cropForm, setCropForm] = useState(initialCropFormState);
  const [cropStatus, setCropStatus] = useState({
    saving: false,
    error: null,
    success: null,
  });

  const fetchCrops = useCallback(async () => {
    setCropsLoading(true);
    setCropsError(null);
    try {
      const { data } = await cropService.getCrops();
      setCrops(Array.isArray(data) ? data : []);
    } catch (err) {
      setCropsError(err?.response?.data?.message || err.message);
    } finally {
      setCropsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  const selectedCrop = useMemo(
    () => crops.find((crop) => crop._id === selectedCropId),
    [crops, selectedCropId]
  );

  const handleCropFormChange = (field, value) => {
    setCropForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateCrop = async (event) => {
    event.preventDefault();
    if (!cropForm.name.trim()) {
      setCropStatus({
        saving: false,
        success: null,
        error: "Crop name is required.",
      });
      return;
    }

    const payload = {
      name: cropForm.name.trim(),
    };
    if (cropForm.icon.trim()) payload.icon = cropForm.icon.trim();
    if (cropForm.description.trim()) payload.description = cropForm.description.trim();

    setCropStatus({ saving: true, success: null, error: null });
    try {
      await cropService.createCrop(payload);
      setCropStatus({ saving: false, success: "Crop created successfully.", error: null });
      setCropForm(initialCropFormState);
      await fetchCrops();
    } catch (err) {
      setCropStatus({
        saving: false,
        success: null,
        error: err?.response?.data?.message || err.message,
      });
    }
  };

  const handleCropSelect = (event) => {
    const nextId = event.target.value;
    setSelectedCropId(nextId);
    setShowRecipeForm(false);
  };

  const handleRecipeLaunch = () => {
    if (!selectedCrop) return;
    setShowRecipeForm(true);
  };

  return (
    <div className="recipe-wizard-page">
      <div className="wizard-layout">
        <section className="crop-card">
          <header>
            <h2>Create a New Crop</h2>
            <p>Add a crop record first, then attach recipes whenever you are ready.</p>
          </header>
          <form className="crop-form" onSubmit={handleCreateCrop}>
            <label>
              Crop Name *
              <input
                type="text"
                value={cropForm.name}
                onChange={(e) => handleCropFormChange("name", e.target.value)}
                placeholder="e.g., Wheat"
              />
            </label>
            <label>
              Icon URL
              <input
                type="text"
                value={cropForm.icon}
                onChange={(e) => handleCropFormChange("icon", e.target.value)}
                placeholder="https://..."
              />
            </label>
            <label>
              Notes
              <textarea
                rows="3"
                value={cropForm.description}
                onChange={(e) => handleCropFormChange("description", e.target.value)}
                placeholder="Optional description or notes for this crop"
              />
            </label>
            <button type="submit" className="primary-btn" disabled={cropStatus.saving}>
              {cropStatus.saving ? "Saving..." : "Add Crop"}
            </button>
            {cropStatus.error && <p className="form-error">{cropStatus.error}</p>}
            {cropStatus.success && <p className="form-success">{cropStatus.success}</p>}
          </form>
        </section>

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
              disabled={cropsLoading || !crops.length}
            >
              <option value="">{cropsLoading ? "Loading crops..." : "Select a crop"}</option>
              {crops.map((crop) => (
                <option key={crop._id} value={crop._id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </label>
          {cropsError && <p className="form-error">{cropsError}</p>}

          {showRecipeForm && selectedCrop ? (
            <RecipeForm key={selectedCrop._id} selectedCropName={selectedCrop.name} />
          ) : (
            <div className="recipe-placeholder">
              Choose a crop from the list, then click the plus icon to launch the recipe builder.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RecipeWizard;

