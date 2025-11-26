import React, { useState, useEffect } from "react";
import "../../App.css";

const FieldDetailsForm = ({ field, onSubmit }) => {
  const [form, setForm] = useState({
    soilPH: "",
    soilType: "",
    fieldHistory: "",
    area: ""
  });

  // Update form when field changes
  useEffect(() => {
    if (field) {
      setForm({
        soilPH: field.soilPH || "",
        soilType: field.soilType || "",
        fieldHistory: field.fieldHistory || "",
        area: field.area || ""
      });
    }
  }, [field]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSubmit(form);
    alert("Field details updated successfully!");
  };

  const soilTypes = [
    "Sandy", "Clay", "Silt", "Loam", "Peaty", "Chalky", "Saline"
  ];

  return (
    <div className="field-form">
      <h4 className="field-title">Field Details</h4>

      <div className="field-group">
        <label>Field Area (acres)</label>
        <input
          name="area"
          type="number"
          value={form.area}
          onChange={handleChange}
          placeholder="Automatically calculated"
          step="0.1"
          min="0"
        />
        <small style={{ color: '#666', fontSize: '12px' }}>
          This will be auto-calculated from the field boundaries
        </small>
      </div>

      <div className="field-group">
        <label>Soil pH</label>
        <input
          name="soilPH"
          type="number"
          value={form.soilPH}
          onChange={handleChange}
          placeholder="e.g., 6.5"
          step="0.1"
          min="0"
          max="14"
        />
      </div>

      <div className="field-group">
        <label>Soil Type</label>
        <select
          name="soilType"
          value={form.soilType}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px"
          }}
        >
          <option value="">Select soil type</option>
          {soilTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label>Field History</label>
        <textarea
          name="fieldHistory"
          value={form.fieldHistory}
          onChange={handleChange}
          placeholder="Previous crops, treatments, notes..."
          rows="3"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            resize: "vertical"
          }}
        />
      </div>

      <button 
        className="field-next-btn" 
        onClick={handleSubmit}
        style={{ marginTop: "15px" }}
      >
        Update Field Details
      </button>
    </div>
  );
};

export default FieldDetailsForm;