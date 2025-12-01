// src/pages/FieldsPage.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import FieldDetailsForm from "../components/View/FieldDetailsForm";
import MapWizard from "../components/View/MapWizard";

const FieldsPage = () => {
  const { 
    wizardData, 
    onFieldSelect, 
    onFieldInfoUpdate, 
    onAddField,
    onWizardComplete,
    onFieldGeometryUpdate
  } = useOutletContext();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("fields");
  const [selectedField, setSelectedField] = useState(
    wizardData.selectedFieldId ||
    wizardData.fieldsInfo?.[0]?.id ||
    wizardData.fieldsData?.features?.[0]?.properties?.id ||
    null
  );
  const [mapReady, setMapReady] = useState(false);
  const mapApiRef = useRef(null);

  const farmFeature = useMemo(() => {
    const farmBoundaries = wizardData.farmBoundaries;
    if (!farmBoundaries) return null;

    const geoJson =
      farmBoundaries?.attributes?.geoJsonCords ||
      (farmBoundaries.type === "FeatureCollection" ? farmBoundaries : null);

    const feature =
      geoJson?.features?.[0] ||
      farmBoundaries?.features?.[0];

    if (!feature?.geometry) return null;

    return {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        id:
          feature.properties?.id ||
          farmBoundaries?._id ||
          "farm-boundary",
        type: "farm",
        name:
          wizardData.farmDetails?.name ||
          farmBoundaries?.name ||
          feature.properties?.name ||
          "Farm",
        area:
          farmBoundaries?.attributes?.area ||
          wizardData.farmArea ||
          feature.properties?.area ||
          "",
      },
    };
  }, [wizardData.farmBoundaries, wizardData.farmDetails, wizardData.farmArea]);

  const fieldFeatures = useMemo(() => {
    return (wizardData.fieldsData?.features || []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties || {}),
        id: feature.properties?.id || feature.id,
        type: "field",
        farm:
          wizardData.farmDetails?.name ||
          feature.properties?.farm ||
          wizardData.farmBoundaries?.name ||
          "Farm",
      },
    }));
  }, [wizardData.fieldsData, wizardData.farmDetails, wizardData.farmBoundaries]);

  const mapGeoJSON = useMemo(() => {
    const features = [];
    if (farmFeature) features.push(farmFeature);
    if (fieldFeatures.length) features.push(...fieldFeatures);
    return features.length ? { type: "FeatureCollection", features } : null;
  }, [farmFeature, fieldFeatures]);

  const selectedFieldFeature = useMemo(() => {
    if (!selectedField) return null;
    return fieldFeatures.find(
      (feature) => feature.properties?.id === selectedField
    );
  }, [fieldFeatures, selectedField]);

  const selectedFieldArea =
    selectedFieldFeature?.properties?.area || null;

  // Define handleFieldSelect BEFORE using it in useMapViewModel
  const handleFieldSelect = (fieldInfo) => {
    const fieldId = fieldInfo.fieldId;
    setSelectedField(fieldId);
    onFieldSelect(fieldId);
  };

  const handleMapAreaUpdate = useCallback(
    (areaLabel, _center, feature) => {
      if (!feature?.geometry) return;

      const cleanedArea =
        typeof areaLabel === "string"
          ? areaLabel.replace(/ acres/i, "").trim()
          : areaLabel?.toString() || "";

      if (!selectedField) return;

      const featureId = feature.properties?.id || selectedField;
      if (featureId !== selectedField) return;

      const updatedArea =
        typeof areaLabel === "string" && areaLabel.length
          ? areaLabel
          : selectedFieldArea || "0 acres";

      onFieldGeometryUpdate(
        selectedField,
        feature.geometry,
        updatedArea
      );
    },
    [
      onAddField,
      onFieldGeometryUpdate,
      selectedField,
      selectedFieldArea
    ]
  );

  useEffect(() => {
    if (!selectedField || !wizardData.selectedFieldId) return;
    if (wizardData.selectedFieldId !== selectedField) {
      setSelectedField(wizardData.selectedFieldId);
    }
  }, [wizardData.selectedFieldId, selectedField]);

  useEffect(() => {
    if (!mapReady || !selectedField || !selectedFieldFeature || !mapApiRef.current) return;
    mapApiRef.current.showFieldsAndHideFarms();
    mapApiRef.current.focusOnFeature(selectedFieldFeature);
  }, [mapReady, selectedField, selectedFieldFeature]);

  const handleFieldInfoSubmit = (fieldData) => {
    if (selectedField) {
      onFieldInfoUpdate(selectedField, fieldData);
      alert("Field details updated successfully!");
    }
  };

  const handleCropAssignment = (fieldId, cropId) => {
    onFieldInfoUpdate(fieldId, { cropId });
  };

  const getSelectedFieldInfo = () => {
    const fieldInfo = wizardData.fieldsInfo.find(field => field.id === selectedField);
    const fieldData = wizardData.fieldsData?.features.find(f => f.properties.id === selectedField)?.properties;
    
    return {
      ...fieldData,
      ...fieldInfo
    };
  };

  const handleBack = () => {
    navigate("/wizard");
  };

  useEffect(() => {
    if (!selectedFieldFeature || !mapApiRef.current) return;
    mapApiRef.current.setDrawnDataProgrammatically(selectedFieldFeature);
  }, [selectedFieldFeature]);

  useEffect(() => {
    if (!mapReady || !mapApiRef.current?.setFarmBoundaryOverlay) return;
    mapApiRef.current.setFarmBoundaryOverlay(farmFeature);
  }, [farmFeature, mapReady]);

  const centerMapOnField = (fieldId) => {
    const fieldFeature = fieldFeatures.find(
      (feature) => feature.properties?.id === fieldId
    );

    if (fieldFeature && mapApiRef.current) {
      mapApiRef.current.focusOnFeature(fieldFeature);
    }
  };

  const currentFieldInfo = getSelectedFieldInfo();

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh",
      position: "relative" 
    }}>
      {/* Left Side - Field Management Panel */}
      <div style={{ 
        width: "400px",
        background: "white",
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000
      }}>
        {/* Header */}
        <div style={{ 
          padding: "15px", 
          borderBottom: "1px solid #e0e0e0",
          background: "#f8f9fa"
        }}>
          <h3 style={{ margin: "0 0 5px 0" }}>Field Management</h3>
          <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
            Farm: {wizardData.farmDetails?.name}
          </p>
          <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "12px" }}>
            Total Fields: {wizardData.fieldsInfo?.length || 0}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          borderBottom: "1px solid #e0e0e0",
          background: "#f8f9fa"
        }}>
          <button
            onClick={() => setActiveTab("fields")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "fields" ? "white" : "transparent",
              border: "none",
              borderBottom: activeTab === "fields" ? "2px solid #007bff" : "none",
              cursor: "pointer",
              fontWeight: activeTab === "fields" ? "bold" : "normal"
            }}
          >
            Field Details
          </button>
          <button
            onClick={() => setActiveTab("crops")}
            style={{
              flex: 1,
              padding: "12px",
              background: activeTab === "crops" ? "white" : "transparent",
              border: "none",
              borderBottom: activeTab === "crops" ? "2px solid #007bff" : "none",
              cursor: "pointer",
              fontWeight: activeTab === "crops" ? "bold" : "normal"
            }}
          >
            Crop Assignment
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "15px" }}>
          {activeTab === "fields" && (
            <div>
              <h3 style={{ margin: "0 0 15px 0" }}>Field Management</h3>
              
              {/* Fields Table */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "10px" 
                }}>
                  <h4 style={{ margin: 0 }}>Fields ({wizardData.fieldsInfo?.length || 0})</h4>
                  <small style={{ color: '#666' }}>Click a field to select</small>
                </div>
                
                {wizardData.fieldsInfo.length > 0 ? (
                  <div style={{ 
                    maxHeight: "200px", 
                    overflow: "auto",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px"
                  }}>
                    {wizardData.fieldsInfo.map((field, index) => (
                      <div
                        key={field.id}
                        onClick={() => handleFieldSelect({ fieldId: field.id })}
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #f0f0f0",
                          background: selectedField === field.id ? "#e3f2fd" : "white",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (selectedField !== field.id) {
                            e.target.style.background = "#f8f9fa";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedField !== field.id) {
                            e.target.style.background = "white";
                          }
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                            {field.name}
                            {selectedField === field.id && (
                              <span style={{ 
                                marginLeft: "8px", 
                                color: "#007bff",
                                fontSize: "12px"
                              }}>
                                ● Selected
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                            Area: {field.area}
                          </div>
                        </div>
                        <div style={{ 
                          width: "12px", 
                          height: "12px", 
                          borderRadius: "50%",
                          background: selectedField === field.id ? "#007bff" : "#ccc",
                          border: selectedField === field.id ? "2px solid #0056b3" : "none"
                        }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: "center", 
                    color: "#666", 
                    padding: "20px",
                    background: "#f8f9fa",
                    borderRadius: "4px",
                    border: "1px dashed #dee2e6"
                  }}>
                    <div style={{ fontSize: "24px", marginBottom: "10px" }}>🌾</div>
                    <div style={{ fontSize: "14px" }}>
                      No fields created yet. Click "Start Drawing Fields" to begin.
                    </div>
                  </div>
                )}
              </div>

              {/* Field Details Form */}
              {selectedField ? (
                <div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "15px" 
                  }}>
                    <h4 style={{ margin: 0 }}>
                      Editing: {currentFieldInfo?.name}
                    </h4>
                    <button
                      onClick={() => centerMapOnField(selectedField)}
                      style={{
                        padding: "6px 12px",
                        background: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      🔍 Re-center
                    </button>
                  </div>
                  <FieldDetailsForm 
                    field={currentFieldInfo}
                    onSubmit={handleFieldInfoSubmit}
                  />
                </div>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  color: "#666", 
                  padding: "20px",
                  background: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px dashed #dee2e6"
                }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>🗺️</div>
                  <div style={{ fontSize: "14px" }}>
                    Select a field to view and edit details
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "crops" && (
            <div>
              <h3 style={{ margin: "0 0 15px 0" }}>Crop Assignment</h3>
              
              {selectedField ? (
                <div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "15px" 
                  }}>
                    <h4>Assign Crop to {currentFieldInfo?.name}</h4>
                    <button
                      onClick={() => centerMapOnField(selectedField)}
                      style={{
                        padding: "6px 12px",
                        background: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      🔍 View on Map
                    </button>
                  </div>
                  
                  {/* Existing Crops */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                      Select Crop:
                    </label>
                    <select
                      value={currentFieldInfo?.cropId || ""}
                      onChange={(e) => handleCropAssignment(selectedField, e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                      }}
                    >
                      <option value="">Select a crop</option>
                      {wizardData.crops.map(crop => (
                        <option key={crop.id} value={crop.id}>
                          {crop.name}
                        </option>
                      ))}
                    </select>
                    {currentFieldInfo?.cropId && (
                      <div style={{ marginTop: "8px", color: "#28a745", fontSize: "14px" }}>
                        ✓ Assigned: {wizardData.crops.find(c => c.id === currentFieldInfo.cropId)?.name}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  color: "#666", 
                  padding: "20px",
                  background: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px dashed #dee2e6"
                }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>🌱</div>
                  <div style={{ fontSize: "14px" }}>
                    Select a field to assign crops
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div style={{ 
          padding: "15px", 
          borderTop: "1px solid #e0e0e0",
          background: "#f8f9fa"
        }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={handleBack}
              style={{
                padding: "10px 16px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                flex: 1
              }}
            >
              Back to Farm
            </button>
            <button 
              onClick={onWizardComplete}
              disabled={wizardData.fieldsInfo.length === 0}
              style={{
                padding: "10px 16px",
                background: wizardData.fieldsInfo.length === 0 ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: wizardData.fieldsInfo.length === 0 ? "not-allowed" : "pointer",
                flex: 1
              }}
            >
              Complete Registration
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapWizard
          locations={mapGeoJSON}
          mode="wizard"
          shouldInitialize={true}
          onAreaUpdate={handleMapAreaUpdate}
          onFieldSelect={handleFieldSelect}
          selectedFieldId={selectedField}
          onMapReady={(api) => {
            mapApiRef.current = api;
            setMapReady(true);
          }}
        />

        {/* Map overlay */}
        <div style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "14px",
          fontWeight: "bold",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          zIndex: 1000
        }}>
          Field Management
        </div>

      </div>
    </div>
  );
};

export default FieldsPage;