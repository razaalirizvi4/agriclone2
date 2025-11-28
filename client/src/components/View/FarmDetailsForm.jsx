// FarmDetailsForm.jsx
import React, { useState } from "react";

const FarmDetailsForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    owner: "",
    size: "", // Farm size in acres
    numberOfFields: "" // Add number of fields field
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.address && formData.size && formData.numberOfFields) {
      onSubmit(formData);
    } else {
      alert("Please fill all required fields including farm size and number of fields");
    }
  };

  // Get owner name from local storage
  const getOwnerFromLocalStorage = () => {
    // You can modify this based on how you store user data in your app
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.name || user.username || "Farm Owner";
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    }
    return "Farm Owner";
  };

  // Set owner name from local storage when component mounts
  React.useEffect(() => {
    const ownerName = getOwnerFromLocalStorage();
    setFormData(prev => ({
      ...prev,
      owner: ownerName
    }));
  }, []);

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
          <label>Owner Name</label>
          <input
            type="text"
            name="owner"
            value={formData.owner}
            onChange={handleChange}
            placeholder="Owner name"
            readOnly // Make it read-only since we're getting it from localStorage
            className="readonly-input"
          />
          <small className="input-hint">Automatically filled from your profile</small>
        </div>

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

        <div className="form-group">
          <label>Number of Fields *</label>
          <input
            type="number"
            name="numberOfFields"
            value={formData.numberOfFields}
            onChange={handleChange}
            placeholder="How many fields in this farm?"
            min="1"
            max="50"
            required
          />
          <small className="input-hint">Enter the total number of fields you want to create</small>
        </div>

        <button type="submit" className="btn-primary">
          Save Farm Details & Continue
        </button>
      </form>
    </div>
  );
};

export default FarmDetailsForm;