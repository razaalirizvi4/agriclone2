// src/pages/FieldsPage.js
import React, { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import useMapViewModel from "../components/ViewModel/useMapViewModel";
import FieldDetailsForm from "../components/View/FieldDetailsForm";
import mapboxgl from "mapbox-gl";

const FieldsPage = () => {
  const { 
    wizardData, 
    onFieldSelect, 
    onFieldInfoUpdate, 
    onAddField,
    onWizardComplete
  } = useOutletContext();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("fields");
  const [selectedField, setSelectedField] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Define handleFieldSelect BEFORE using it in useMapViewModel
  const handleFieldSelect = (fieldInfo) => {
    const fieldId = fieldInfo.fieldId;
    setSelectedField(fieldId);
    onFieldSelect(fieldId);
  };

  // Use map view model for field drawing
  const { 
    mapContainer, 
    drawnData,
    setMapCenter
  } = useMapViewModel({
    locations: wizardData.fieldsData,
    mode: "wizard",
    shouldInitialize: true,
    onAreaUpdate: (area) => {
      // This will be used when creating new fields
      if (drawnData && drawnData.features.length > 0 && isDrawingMode) {
        const latestFeature = drawnData.features[drawnData.features.length - 1];
        const fieldId = onAddField(latestFeature.geometry, area.replace(' acres', ''));
        setSelectedField(fieldId);
        setIsDrawingMode(false);
      }
    },
    onFieldSelect: handleFieldSelect // Use the function defined above
  });

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

  const handleStartDrawing = () => {
    setIsDrawingMode(true);
    // The drawing will be handled by the useMapViewModel hook
  };

  const centerMapOnField = (fieldId) => {
    const fieldFeature = wizardData.fieldsData?.features.find(
      feature => feature.properties.id === fieldId
    );
    
    if (fieldFeature && fieldFeature.geometry) {
      const coordinates = fieldFeature.geometry.coordinates[0];
      const bounds = new mapboxgl.LngLatBounds();
      
      coordinates.forEach(coord => {
        bounds.extend([coord[0], coord[1]]);
      });
      
      // We'll need to access the map instance - you might need to modify useMapViewModel to expose it
      // For now, we'll use a simple approach
      if (window.mapInstance) {
        window.mapInstance.fitBounds(bounds, {
          padding: 50,
          duration: 1000
        });
      }
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

        {/* Drawing Controls */}
        <div style={{ 
          padding: "15px", 
          borderBottom: "1px solid #e0e0e0",
          background: "#e8f5e8"
        }}>
          <h4 style={{ margin: "0 0 10px 0" }}>Draw Fields</h4>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
            Click the button below to start drawing fields on the map
          </div>
          <button 
            onClick={handleStartDrawing}
            disabled={isDrawingMode}
            style={{
              width: "100%",
              padding: "10px",
              background: isDrawingMode ? "#6c757d" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isDrawingMode ? "not-allowed" : "pointer",
              fontSize: "14px"
            }}
          >
            {isDrawingMode ? "Drawing Mode Active - Draw on Map" : "Start Drawing Fields"}
          </button>
          {isDrawingMode && (
            <div style={{ fontSize: "12px", color: "#dc3545", marginTop: "8px" }}>
              💡 Click the polygon tool on the map to draw fields
            </div>
          )}
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
        <div 
          ref={mapContainer}
          style={{ width: "100%", height: "100%" }}
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

        {/* Drawing Instructions */}
        {isDrawingMode && (
          <div style={{
            position: "absolute",
            top: "50px",
            left: "10px",
            background: "#fff3cd",
            padding: "10px",
            borderRadius: "4px",
            fontSize: "12px",
            border: "1px solid #ffeaa7",
            zIndex: 1000,
            maxWidth: "300px"
          }}>
            <strong>Drawing Mode Active</strong>
            <div style={{ marginTop: "5px" }}>
              • Click the polygon tool on the map<br/>
              • Draw your field boundary<br/>
              • Double-click to complete<br/>
              • Field will be automatically added
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldsPage;