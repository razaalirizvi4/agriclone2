import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTypes } from "../../features/type/type.slice";
import "../../App.css";

const FieldDetailsForm = ({ field = {}, onSubmit }) => {
  const dispatch = useDispatch();
  const {
    types = [],
    loading = false,
    error = null
  } = useSelector((state) => state.types || {});

  const [attributes, setAttributes] = useState([]);
  const [formData, setFormData] = useState({});

  // Fetch field type metadata once on mount
  useEffect(() => {
    dispatch(getTypes({ type: "field" }));
  }, [dispatch]);

  // Memoize the currently selected field type definition
  const fieldTypeDefinition = useMemo(
    () => types.find((type) => type.type === "field"),
    [types]
  );

  // Sync attributes + form data whenever metadata or field changes
  useEffect(() => {
    if (!fieldTypeDefinition) {
      setAttributes([]);
      setFormData({});
      return;
    }

    const nonMapboxAttributes =
      fieldTypeDefinition.attributes?.filter(
        (attr) => !attr.modules || !attr.modules.includes("mapbox")
      ) || [];

    setAttributes(nonMapboxAttributes);

    const initialFormValues = {};
    nonMapboxAttributes.forEach((attr) => {
      const existingValue =
        field?.[attr.key] ??
        field?.attributes?.[attr.key] ??
        "";
      initialFormValues[attr.key] = existingValue;
    });

    setFormData(initialFormValues);
  }, [fieldTypeDefinition, field]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!attributes.length) {
      alert("No field attributes available to update.");
      return;
    }

    const missingRequired = attributes
      .filter((attr) => attr.required)
      .some((attr) => {
        const value = formData[attr.key];
        return value === undefined || value === null || value === "";
      });

    if (missingRequired) {
      alert("Please fill all required fields.");
      return;
    }

    onSubmit(formData);
  };

  const renderInput = (attr) => {
    const commonProps = {
      id: attr.key,
      name: attr.key,
      value: formData[attr.key] ?? "",
      onChange: (e) => handleChange(attr.key, e.target.value),
      required: attr.required,
      placeholder: attr.inputHint || "",
      style: {
        width: "100%",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px"
      }
    };

    if (attr.valueType === "number") {
      return <input type="number" step="any" {...commonProps} />;
    }

    if (attr.valueType === "textarea") {
      return <textarea rows={3} {...commonProps} />;
    }

    return <input type="text" {...commonProps} />;
  };

  if (loading && !attributes.length) {
    return <div>Loading field details...</div>;
  }

  if (error) {
    return <div>Error loading field attributes: {error}</div>;
  }

  if (!attributes.length) {
    return <div>No field attributes configured yet.</div>;
  }

  return (
    <form className="field-form" onSubmit={handleSubmit}>
      <h4 className="field-title">Field Details</h4>

      {attributes.map((attr) => (
        <div className="field-group" key={attr.key}>
          <label htmlFor={attr.key}>
            {attr.label}
            {attr.required ? " *" : ""}
          </label>
          {renderInput(attr)}
        </div>
      ))}

      <button
        className="field-next-btn"
        type="submit"
        style={{ marginTop: "15px" }}
      >
        Update Field Details
      </button>
    </form>
  );
};

export default FieldDetailsForm;