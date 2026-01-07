import { useState } from "react";
import cropService from "../../../services/crop.service";

const initialCropFormState = {
  name: "",
  icon: "",
  description: "",
};

const CropCreationCard = ({ onCropCreated }) => {
  const [cropForm, setCropForm] = useState(initialCropFormState);
  const [status, setStatus] = useState({
    saving: false,
    error: null,
    success: null,
  });

  const handleChange = (field, value) => {
    setCropForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!cropForm.name.trim()) {
      setStatus({
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
    if (cropForm.description.trim()) {
      payload.description = cropForm.description.trim();
    }

    setStatus({ saving: true, success: null, error: null });
    try {
      await cropService.createCrop(payload);
      setStatus({ saving: false, success: "Crop created successfully.", error: null });
      setCropForm(initialCropFormState);
      onCropCreated?.();
    } catch (err) {
      setStatus({
        saving: false,
        success: null,
        error: err?.response?.data?.message || err.message,
      });
    }
  };

  return (
    <section className="crop-card">
      <header>
        <h2>Create a New Crop</h2>
        <p>Add a crop record first, then attach recipes whenever you are ready.</p>
      </header>
      <form className="crop-form" onSubmit={handleSubmit}>
        <label>
          Crop Name *
          <input
            type="text"
            value={cropForm.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g., Wheat"
          />
        </label>
        <label>
          Icon URL
          <input
            type="text"
            value={cropForm.icon}
            onChange={(e) => handleChange("icon", e.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          Notes
          <textarea
            rows="3"
            value={cropForm.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Optional description or notes for this crop"
          />
        </label>
        <button type="submit" className="primary-btn" disabled={status.saving}>
          {status.saving ? "Saving..." : "Add Crop"}
        </button>
        {status.error && <p className="form-error">{status.error}</p>}
        {status.success && <p className="form-success">{status.success}</p>}
      </form>
    </section>
  );
};

export default CropCreationCard;


