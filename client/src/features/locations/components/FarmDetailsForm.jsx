// FarmDetailsForm.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getTypes } from "../../type/type.slice";

const FarmDetailsForm = ({
  onSubmit,
  initialValues = {},
  onImportGeoJSONClick,
  onImportWktClick,
}) => {
  const dispatch = useDispatch();
  const {
    types = [],
    loading = false,
    error = null,
  } = useSelector((state) => state.types || {});

  const [attributes, setAttributes] = useState([]);
  const [formData, setFormData] = useState({});

  // Fetch types from Redux store
  useEffect(() => {
    dispatch(getTypes({ type: "farm" }));
  }, [dispatch]);

  // Initialize attributes and formData when types are loaded
  useEffect(() => {
    if (types.length > 0) {
      const farmType = types.find((t) => t.type === "farm");
      const farmAttributes = farmType?.attributes || [];

      // Filter out Mapbox attributes (handled separately in map component)
      const nonMapboxAttributes = farmAttributes.filter(
        (attr) => !attr.modules || !attr.modules.includes("mapbox")
      );

      setAttributes(nonMapboxAttributes);

      // Initialize formData
      const initialFormData = {};
      nonMapboxAttributes.forEach((attr) => {
        initialFormData[attr.key] =
          initialValues[attr.key] !== undefined ? initialValues[attr.key] : "";
      });

      setFormData(initialFormData);
    }
  }, [types, initialValues]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check required fields
    const requiredFields = attributes.filter((attr) => attr.required);
    const isFormValid = requiredFields.every((field) => formData[field.key]);

    if (isFormValid) {
      onSubmit(formData);
    } else {
      alert("Please fill all required fields");
    }
  };

  if (loading) return <div>Loading farm details...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <form onSubmit={handleSubmit}>
      <h2>Farm Details</h2>
      {attributes.map((attr) => {
        const isAddressField = attr.key === "address";

        return (
          <div key={attr.key} className={isAddressField ? "address-field" : ""}>
            <label htmlFor={attr.key}>{attr.label}</label>
            <div className={isAddressField ? "input-action-row" : ""}>
              <input
                type="text"
                id={attr.key}
                {...{
                  value: formData[attr.key],
                  onChange: (e) => handleChange(attr.key, e.target.value),
                  required: attr.required,
                  placeholder: attr.inputHint || "",
                }}
              />
              {isAddressField && onImportGeoJSONClick && (
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={onImportGeoJSONClick}
                    style={{ marginLeft: "8px", whiteSpace: "nowrap" }}
                  >
                    Import Farm GeoJSON
                  </button>
                  {onImportWktClick && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={onImportWktClick}
                      style={{ marginLeft: "8px", whiteSpace: "nowrap" }}
                    >
                      Import Farm WKT
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      <button type="submit" className="primary-button">
        Submit
      </button>
    </form>
  );
};

export default FarmDetailsForm;
