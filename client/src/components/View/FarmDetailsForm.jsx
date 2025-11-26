// FarmDetailsForm.jsx
import React, { useState } from "react";

const FarmDetailsForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    owner: "",
    size: "" // Add size field
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.address && formData.size) {
      onSubmit(formData);
    } else {
      alert("Please fill all required fields including farm size");
    }
  };

  return (
    <div className="wizard-form-container">
      <h3>Farm Details</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Farm Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter farm name"
            required
          />
        </div>

        <div className="form-group">
          <label>Address *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter farm address"
            required
          />
        </div>

        <div className="form-group">
          <label>Owner Name *</label>
          <input
            type="text"
            name="owner"
            value={formData.owner}
            onChange={handleChange}
            placeholder="Enter owner name"
            required
          />
        </div>

        {/* Add Farm Size Input */}
        <div className="form-group">
          <label>Farm Size (acres) *</label>
          <input
            type="number"
            name="size"
            value={formData.size}
            onChange={handleChange}
            placeholder="Enter farm size in acres"
            min="1"
            max="10000"
            step="0.1"
            required
          />
        </div>

        <button type="submit" className="btn-primary">
          Save Farm Details & Continue
        </button>
      </form>
    </div>
  );
};

export default FarmDetailsForm;