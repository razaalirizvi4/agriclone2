// src/pages/FieldsPage.js
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import * as turf from "@turf/turf";
import FieldDetailsForm, { CropAssignmentForm } from "../components/View/FieldDetailsForm";
import MapWizard from "../components/View/MapWizard";

const FieldsPage = () => {
  const {
    wizardData,
    onFieldSelect,
    onFieldInfoUpdate,
    onFieldGeometryUpdate,
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
  const lastValidFieldGeometryRef = useRef(null);

  const farmFeature = useMemo(() => {
    const farmBoundaries = wizardData.farmBoundaries;
    if (!farmBoundaries) return null;

    const geoJson =
      farmBoundaries?.attributes?.geoJsonCords ||
      (farmBoundaries.type === "FeatureCollection" ? farmBoundaries : null);

    const feature = geoJson?.features?.[0] || farmBoundaries?.features?.[0];

    if (!feature?.geometry) return null;

    return {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        id: feature.properties?.id || farmBoundaries?._id || "farm-boundary",
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

  const selectedFieldArea = selectedFieldFeature?.properties?.area || null;

  // Helpers to compute area in acres and the remaining (uncategorized) area
  const parseAcres = (value) => {
    if (value === null || value === undefined) return 0;
    const numeric = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const farmAreaAcres = useMemo(() => {
    // Priority 1: Calculate from geometry if available (most accurate)
    if (farmFeature?.geometry) {
      try {
        const areaSqMeters = turf.area(farmFeature);
        const areaAcres = areaSqMeters / 4046.8564224;
        if (areaAcres > 0) {
          return areaAcres;
        }
      } catch (error) {
        console.error("Error calculating farm area from geometry:", error);
      }
    }

    // Priority 2: Try to get area from labels
    const areaLabel =
      wizardData.farmArea ||
      wizardData.farmDetails?.area ||
      wizardData.farmBoundaries?.attributes?.area ||
      farmFeature?.properties?.area;

    if (areaLabel) {
      const parsed = parseAcres(areaLabel);
      if (parsed > 0) {
        return parsed;
      }
    }

    return 0;
  }, [farmFeature, wizardData.farmArea, wizardData.farmDetails, wizardData.farmBoundaries]);

  const totalFieldAreaAcres = useMemo(() => {
    // Prefer calculating from field geometries for accuracy; fallback to labeled areas
    if (fieldFeatures.length) {
      return fieldFeatures.reduce((sum, feature) => {
        let areaAcres = 0;

        if (feature.geometry) {
          try {
            areaAcres = turf.area(feature) / 4046.8564224;
          } catch (err) {
            console.error("Error calculating field area from geometry:", err);
          }
        }

        if (!areaAcres && feature.properties?.area) {
          areaAcres = parseAcres(feature.properties.area);
        }

        return sum + (Number.isFinite(areaAcres) ? areaAcres : 0);
      }, 0);
    }

    return (wizardData.fieldsInfo || []).reduce(
      (sum, field) => sum + parseAcres(field.area),
      0
    );
  }, [fieldFeatures, wizardData.fieldsInfo]);

  const uncategorizedAreaAcres = Math.max(
    0,
    parseFloat((farmAreaAcres - totalFieldAreaAcres).toFixed(2))
  );
  const uncategorizedAreaLabel = `${uncategorizedAreaAcres.toFixed(2)} acres`;

  const handleFieldSelect = (fieldInfo) => {
    const fieldId = fieldInfo.fieldId;
    setSelectedField(fieldId);
    onFieldSelect(fieldId);
  };

  const handleMapAreaUpdate = useCallback(
    (areaLabel, _center, feature) => {
      if (!feature?.geometry) return;

      if (!selectedField) return;

      const featureId = feature.properties?.id || selectedField;
      if (featureId !== selectedField) return;

      // Prevent field geometry from leaving the farm boundary (with small tolerance)
      if (farmFeature?.geometry) {
        const fieldFeature = {
          type: "Feature",
          properties: feature.properties || {},
          geometry: feature.geometry,
        };

        let insideFarm = false;
        try {
          const bufferedFarm = turf.buffer(farmFeature, 0.5, { units: "meters" });
          insideFarm =
            turf.booleanWithin(fieldFeature, bufferedFarm) ||
            turf.booleanContains(bufferedFarm, fieldFeature);
        } catch (err) {
          console.error("Geometry validation failed:", err);
          insideFarm = turf.booleanWithin(fieldFeature, farmFeature);
        }

        if (!insideFarm) {
          const lastValidGeometry = lastValidFieldGeometryRef.current;
          
          if (lastValidGeometry && mapApiRef.current?.setDrawnDataProgrammatically) {
            const validFeature = {
              type: "Feature",
              properties: feature.properties || {},
              geometry: lastValidGeometry,
            };
            
            setTimeout(() => {
              mapApiRef.current.setDrawnDataProgrammatically(validFeature);
            }, 0);
          }
          
          alert("Field boundary must stay within the farm boundary. Please adjust the shape.");
          return;
        }
      }

      // Store the valid geometry for future reverts
      lastValidFieldGeometryRef.current = feature.geometry;

      const updatedArea =
        typeof areaLabel === "string" && areaLabel.length
          ? areaLabel
          : selectedFieldArea || "0 acres";

      onFieldGeometryUpdate(selectedField, feature.geometry, updatedArea);
    },
    [
      onFieldGeometryUpdate,
      selectedField,
      selectedFieldArea,
      farmFeature,
      selectedFieldFeature,
    ]
  );

  useEffect(() => {
    if (!selectedField || !wizardData.selectedFieldId) return;
    if (wizardData.selectedFieldId !== selectedField) {
      setSelectedField(wizardData.selectedFieldId);
    }
  }, [wizardData.selectedFieldId, selectedField]);

  // Store the last valid geometry when selected field changes
  useEffect(() => {
    if (selectedFieldFeature?.geometry) {
      lastValidFieldGeometryRef.current = selectedFieldFeature.geometry;
    }
  }, [selectedFieldFeature]);

  useEffect(() => {
    if (
      !mapReady ||
      !selectedField ||
      !selectedFieldFeature ||
      !mapApiRef.current
    )
      return;
    mapApiRef.current.showFieldsAndHideFarms();
    mapApiRef.current.focusOnFeature(selectedFieldFeature);
  }, [mapReady, selectedField, selectedFieldFeature]);

  const handleFieldInfoSubmit = (fieldData) => {
    if (selectedField) {
      onFieldInfoUpdate(selectedField, fieldData);
      alert("Field details updated successfully!");
    }
  };

  const getSelectedFieldInfo = () => {
    const fieldInfo = (wizardData.fieldsInfo || []).find(
      (field) => field.id === selectedField
    );
    const fieldData = wizardData.fieldsData?.features.find(
      (f) => f.properties.id === selectedField
    )?.properties;

    return {
      ...fieldData,
      ...fieldInfo,
    };
  };

  const handleBack = () => {
    navigate("/wizard");
  };

  const handleCompleteRegistration = () => {
    navigate("/wizard/review");
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
    <div className="recipe-wizard-page">
      <div className="wizard-layout">
        {/* Left Side - Field Management Panel */}
        <div className="crop-card fields-panel">
          {/* Header */}
          <div className="fields-panel__header">
            <h3 className="fields-panel__title">Farm Overview</h3>
            <p className="fields-panel__subtitle">
              Farm Name: {wizardData.farmDetails?.name}
            </p>
            <p className="fields-panel__subtitle">
              Address: {wizardData.farmDetails?.address}
            </p>
            <p className="fields-panel__subtitle">
              Farm Size:{wizardData.farmDetails.area}
            </p>
            <p className="fields-panel__meta">
              Total Fields: {(wizardData.fieldsInfo || []).length || 0}
            </p>
          </div>

          {/* Left content: Field details + Crop assignment toggle */}
          <div className="fields-panel__content">
            {selectedField ? (
              <div className="fields-section">
                <div className="fields-detail__header">
                  <h4>Editing: {currentFieldInfo?.name}</h4>
                  <button
                    onClick={() => centerMapOnField(selectedField)}
                    className="fields-mini-button"
                    type="button"
                  >
                    🔍 Re-center
                  </button>
                </div>

                {/* Toggle for Field Details / Crop Assignment */}
                <div className="fields-panel__tabs">
                  <button
                    onClick={() => setActiveTab("fields")}
                    className={`fields-tab ${
                      activeTab === "fields" ? "fields-tab--active" : ""
                    }`}
                  >
                    Field Details
                  </button>
                  <button
                    onClick={() => setActiveTab("crops")}
                    className={`fields-tab ${
                      activeTab === "crops" ? "fields-tab--active" : ""
                    }`}
                  >
                    Crop Assignment
                  </button>
                </div>

                {activeTab === "fields" && (
                  <FieldDetailsForm
                    field={currentFieldInfo}
                    onSubmit={handleFieldInfoSubmit}
                  />
                )}

                {activeTab === "crops" && (
                  <CropAssignmentForm
                    field={currentFieldInfo}
                    onSubmit={handleFieldInfoSubmit}
                    fieldName={currentFieldInfo?.name}
                    onViewMap={() => centerMapOnField(selectedField)}
                  />
                )}
              </div>
            ) : (
              <div className="fields-empty-state">
                <div className="fields-empty-state__icon">🗺️</div>
                <p>Select a field to view and edit details.</p>
              </div>
            )}
          </div>
          {/* Bottom Actions */}
          <div className="fields-actions">
            <div className="fields-actions__row">
              <button
                onClick={handleBack}
                className="secondary-button"
                style={{ flex: 1 }}
              >
                Back to Farm
              </button>
              <button
                onClick={handleCompleteRegistration}
                disabled={(wizardData.fieldsInfo || []).length === 0}
                className="primary-button"
                style={{
                  flex: 1,
                  opacity: (wizardData.fieldsInfo || []).length === 0 ? 0.6 : 1,
                  cursor:
                    (wizardData.fieldsInfo || []).length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Review Information
              </button>
            </div>
          </div>
        </div>
        {/* Right Side - Map with Fields table below */}
        <div className="recipe-card fields-map-card">
          <div className="fields-map-wrapper">
            <MapWizard
              locations={mapGeoJSON}
              mode="wizard"
              shouldInitialize={true}
              onAreaUpdate={handleMapAreaUpdate}
              onFieldSelect={handleFieldSelect}
              selectedFieldId={selectedField}
              validateGeometry={(feature) => {
                // Validate that field geometry stays within farm boundary (with small tolerance)
                if (!farmFeature?.geometry || !feature?.geometry) return true;
                
                const fieldFeature = {
                  type: "Feature",
                  properties: feature.properties || {},
                  geometry: feature.geometry,
                };
                
                try {
                  const bufferedFarm = turf.buffer(farmFeature, 0.5, { units: "meters" });
                  return (
                    turf.booleanWithin(fieldFeature, bufferedFarm) ||
                    turf.booleanContains(bufferedFarm, fieldFeature)
                  );
                } catch (err) {
                  console.error("Geometry validation failed:", err);
                  return turf.booleanWithin(fieldFeature, farmFeature);
                }
              }}
              onMapReady={(api) => {
                mapApiRef.current = api;
                setMapReady(true);
              }}
            />

            {/* Fields selection table below the map */}
            <div className="fields-section">
              <div className="fields-section__header">
                <h4 className="fields-section__title">
                  Fields{" "}
                  {(wizardData.fieldsInfo || []).length > 0 && (
                    <span>({(wizardData.fieldsInfo || []).length})</span>
                  )}
                </h4>
                <small className="fields-section__hint">
                  Click a field to select
                </small>
              </div>

              <div
                style={{
                  marginBottom: "8px",
                  padding: "8px 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: uncategorizedAreaAcres > 0 ? "#fef3c7" : "#f9fafb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                <div>
                  <strong>Uncategorized area:</strong> {uncategorizedAreaLabel}
                  {farmAreaAcres > 0 && (
                    <span style={{ marginLeft: "8px", fontSize: "12px", color: "#6b7280" }}>
                      (Farm: {farmAreaAcres.toFixed(2)} acres, Fields: {totalFieldAreaAcres.toFixed(2)} acres)
                    </span>
                  )}
                </div>
                <span style={{ color: "#6b7280" }}>
                  Farm area not covered by any field
                </span>
              </div>

              {(wizardData.fieldsInfo || []).length > 0 ? (
                <div className="fields-table">
                  {(wizardData.fieldsInfo || []).map((field) => {
                    const isSelected = selectedField === field.id;
                    return (
                      <button
                        key={field.id}
                        type="button"
                        className={`fields-row ${
                          isSelected ? "fields-row--selected" : ""
                        }`}
                        onClick={() => handleFieldSelect({ fieldId: field.id })}
                      >
                        <div className="fields-row__body">
                          <div className="fields-row__name">
                            {field.name}
                            {isSelected && (
                              <span className="fields-row__pill">
                                ● Selected
                              </span>
                            )}
                          </div>
                          <div className="fields-row__meta">
                            Area: {field.area}
                          </div>
                        </div>
                        <span
                          className={`fields-row__indicator ${
                            isSelected ? "fields-row__indicator--active" : ""
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="fields-empty-state">
                  <div className="fields-empty-state__icon">🌾</div>
                  <p>
                    No fields created yet. Click "Start Drawing Fields" to
                    begin.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldsPage;
