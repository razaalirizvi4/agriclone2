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
import FieldDetailsForm from "../components/View/FieldDetailsForm";
import { CropAssignmentForm } from "../components/View/cropAssignmentForm";
import MapWizard from "../components/View/MapWizard";
import ShapeDrawingToolbar from "../components/View/ShapeDrawingToolbar";
import ShapeAssignmentModal from "../components/View/ShapeAssignmentModal";
import { normalizeFieldsFeatureCollection,
} from "../utils/geoJson";
import { wktToGeoJSON } from "../utils/wkt";
import { toast } from "react-toastify";

const FieldsPage = () => {
  const {
    wizardData,
    onFieldSelect,
    onFieldInfoUpdate,
    onFieldGeometryUpdate,
    onImportFieldsData,
  } = useOutletContext();

  const navigate = useNavigate();

  // Validate that required wizard data exists, redirect if not
  useEffect(() => {
    // Check if farm boundary is required but missing
    if (!wizardData?.farmBoundaries) {
      // Redirect to the first step of the wizard
      navigate("/wizard", { replace: true });
      toast.warning("Please complete the farm boundary step first.");
      return;
    }
  }, [wizardData, navigate]);
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
  const fieldsFileInputRef = useRef(null);
  const fieldsWktInputRef = useRef(null);

  // Shape drawing state
  const [showShapeDrawing, setShowShapeDrawing] = useState(false);
  const [pendingShapeAssignment, setPendingShapeAssignment] = useState(null);
  const [isShapeDrawingMode, setIsShapeDrawingMode] = useState(false);
  const [activeShapeType, setActiveShapeType] = useState(null);

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

  // Shape drawing handlers
  const handleShapeSelect = useCallback((shapeType) => {
    if (mapApiRef.current?.enableShapeDrawing) {
      mapApiRef.current.enableShapeDrawing(shapeType);
      setIsShapeDrawingMode(true);
      setActiveShapeType(shapeType);
    }
  }, []);

  const handleShapeDrawn = useCallback((shape) => {
    setPendingShapeAssignment(shape);
    setIsShapeDrawingMode(false);
    setActiveShapeType(null);
  }, []);

  const handleShapeAssignment = useCallback((assignmentData) => {
    const { fieldId, shapeName, shape } = assignmentData;
    
    // Find the field to update
    const fieldInfo = wizardData.fieldsInfo?.find(f => f.id === fieldId);
    const fieldFeature = wizardData.fieldsData?.features?.find(f => f.properties?.id === fieldId);
    
    if (!fieldFeature) {
      toast.error('Field not found');
      return;
    }

    try {
      let newGeometry;
      
      // Create a MultiPolygon that includes both the original field and the new shape
      if (fieldFeature.geometry.type === 'Polygon') {
        // Convert single polygon to MultiPolygon and add the new shape
        newGeometry = {
          type: 'MultiPolygon',
          coordinates: [
            fieldFeature.geometry.coordinates, // Original field
            shape.geometry.coordinates        // New shape
          ]
        };
      } else if (fieldFeature.geometry.type === 'MultiPolygon') {
        // Add to existing MultiPolygon
        newGeometry = {
          type: 'MultiPolygon',
          coordinates: [
            ...fieldFeature.geometry.coordinates, // Existing polygons
            shape.geometry.coordinates             // New shape
          ]
        };
      } else {
        toast.error('Unsupported field geometry type');
        return;
      }

      // Calculate the total area of all polygons
      const tempFeature = {
        type: 'Feature',
        geometry: newGeometry,
        properties: {}
      };
      
      const newAreaSqMeters = turf.area(tempFeature);
      const newAreaAcres = newAreaSqMeters / 4046.8564224;
      const newAreaLabel = `${Math.round(newAreaAcres * 100) / 100} acres`;

      // Update the field geometry to the new MultiPolygon
      onFieldGeometryUpdate(fieldId, newGeometry, newAreaLabel);
      
      // Clear pending assignment and shape drawing
      setPendingShapeAssignment(null);
      if (mapApiRef.current?.clearPendingShape) {
        mapApiRef.current.clearPendingShape();
      }
      
      // Remove the drawn polygon from the draw control
      if (mapApiRef.current?.drawRef && shape.id) {
        mapApiRef.current.drawRef.delete(shape.id);
      }
      
      toast.success(`Land area "${shapeName}" added to field "${fieldInfo?.name || fieldId}". New total area: ${newAreaLabel}`);
    } catch (error) {
      console.error('Error adding shape to field:', error);
      toast.error('Failed to add land area to field. Please try again.');
    }
  }, [wizardData.fieldsInfo, wizardData.fieldsData, onFieldGeometryUpdate]);

  const handleCancelShapeAssignment = useCallback(() => {
    setPendingShapeAssignment(null);
    if (mapApiRef.current?.clearPendingShape) {
      mapApiRef.current.clearPendingShape();
    }
  }, []);

  const handleCancelShapeDrawing = useCallback(() => {
    if (mapApiRef.current?.disableShapeDrawing) {
      mapApiRef.current.disableShapeDrawing();
    }
    // Also clear any drawn polygons
    if (mapApiRef.current?.clearPendingShape) {
      mapApiRef.current.clearPendingShape();
    }
    setIsShapeDrawingMode(false);
    setActiveShapeType(null);
  }, []);

  const validateFieldsWithinFarm = useCallback(
    (features) => {
      if (!farmFeature?.geometry) {
        toast.error("Import the farm boundary first before importing fields.");
        return false;
      }

      let bufferedFarm = farmFeature;
      try {
        bufferedFarm = turf.buffer(farmFeature, 0.5, { units: "meters" });
      } catch (error) {
        console.warn("Failed to buffer farm boundary, using original geometry", error);
      }

      const invalid = features.filter((feature) => {
        try {
          return !(
            turf.booleanWithin(feature, bufferedFarm) ||
            turf.booleanContains(bufferedFarm, feature)
          );
        } catch (error) {
          console.error("Validation failed for feature:", error);
          return true;
        }
      });

      if (invalid.length) {
        toast.error(
          "All imported fields must lie within the farm boundary. Please adjust the file and try again."
        );
        return false;
      }

      return true;
    },
    [farmFeature]
  );

  const handleFieldsFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const normalized = normalizeFieldsFeatureCollection(
        json,
        wizardData.farmDetails?.name ||
          wizardData.farmBoundaries?.name ||
          "Farm"
      );

      if (!normalized) {
        toast.error("Invalid GeoJSON. Please provide polygon field features.");
        return;
      }

      if (!validateFieldsWithinFarm(normalized.fieldsData.features)) {
        return;
      }

      onImportFieldsData(normalized.fieldsData, normalized.fieldsInfo);
      const firstFieldId =
        normalized.fieldsInfo?.[0]?.id ||
        normalized.fieldsData.features?.[0]?.properties?.id ||
        null;

      if (firstFieldId) {
        setSelectedField(firstFieldId);
        onFieldSelect(firstFieldId);
      }

      if (mapApiRef.current?.focusOnFeature) {
        mapApiRef.current.focusOnFeature(normalized.fieldsData.features[0]);
      }
    } catch (error) {
      console.error("Failed to import fields:", error);
      toast.error("Unable to import fields. Ensure the file is valid GeoJSON.");
    } finally {
      event.target.value = "";
    }
  };

  const handleFieldsWktChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const geoJsonGeometry = wktToGeoJSON(text);
      if (!geoJsonGeometry) {
        toast.error("Invalid WKT file.");
        return;
      }

      let features = [];

      // If MultiPolygon, split into individual Polygons so they become separate fields
      if (geoJsonGeometry.type === "MultiPolygon") {
        features = geoJsonGeometry.coordinates.map((coords) => ({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: coords,
          },
        }));
      } else {
        // Wrap single geometry in a feature
        features = [
          {
            type: "Feature",
            properties: {},
            geometry: geoJsonGeometry,
          },
        ];
      }

      if (!validateFieldsWithinFarm(features)) {
        return;
      }

      const normalized = normalizeFieldsFeatureCollection(
        { type: "FeatureCollection", features },
        wizardData.farmDetails?.name ||
          wizardData.farmBoundaries?.name ||
          "Farm"
      );

      if (!normalized) {
        toast.error("Invalid geometry from WKT.");
        return;
      }

      onImportFieldsData(normalized.fieldsData, normalized.fieldsInfo);
      const firstFieldId =
        normalized.fieldsInfo?.[0]?.id ||
        normalized.fieldsData.features?.[0]?.properties?.id ||
        null;

      if (firstFieldId) {
        setSelectedField(firstFieldId);
        onFieldSelect(firstFieldId);
      }

      if (mapApiRef.current?.focusOnFeature) {
        mapApiRef.current.focusOnFeature(normalized.fieldsData.features[0]);
      }
    } catch (error) {
      console.error("Failed to import WKT:", error);
      toast.error("Unable to import WKT file.");
    } finally {
      event.target.value = "";
    }
  };

  const triggerFieldsImport = () => {
    fieldsFileInputRef.current?.click();
  };

  const triggerFieldsWktImport = () => {
    fieldsWktInputRef.current?.click();
  };

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
        // Allow MultiPolygon geometries without validation (they are created from valid polygons)
        if (feature.geometry.type === 'MultiPolygon') {
          insideFarm = true;
        } else {
          try {
            const bufferedFarm = turf.buffer(farmFeature, 0.5, { units: "meters" });
            insideFarm =
              turf.booleanWithin(fieldFeature, bufferedFarm) ||
              turf.booleanContains(bufferedFarm, fieldFeature);
          } catch (err) {
            console.error("Geometry validation failed:", err);
            try {
              insideFarm = turf.booleanWithin(fieldFeature, farmFeature);
            } catch (fallbackErr) {
              console.error("Fallback validation also failed:", fallbackErr);
              insideFarm = true; // Allow if validation fails
            }
          }
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
      toast.success("Field details updated successfully!");
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
    if (!selectedFieldFeature || !mapApiRef.current?.setDrawnDataProgrammatically || !mapReady) return;
    
    // Add a small delay to ensure draw control is ready
    setTimeout(() => {
      mapApiRef.current.setDrawnDataProgrammatically(selectedFieldFeature);
    }, 100);
  }, [selectedFieldFeature, mapReady]);

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
      <input
        ref={fieldsFileInputRef}
        type="file"
        accept=".json,.geojson,application/geo+json,application/json"
        style={{ display: "none" }}
        onChange={handleFieldsFileChange}
      />
      <input
        ref={fieldsWktInputRef}
        type="file"
        accept=".wkt,.txt"
        style={{ display: "none" }}
        onChange={handleFieldsWktChange}
      />
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
                  <>
                    <FieldDetailsForm
                      field={currentFieldInfo}
                      onSubmit={handleFieldInfoSubmit}
                    />
                    
                    {selectedField && (
                      <div className="field-geometry-edit">
                        <h5>Edit Field Geometry</h5>
                        <p className="field-edit-hint">
                          The field boundary is loaded in the map editor. You can:
                        </p>
                        <ul className="field-edit-instructions">
                          <li>Click and drag vertices to reshape boundaries</li>
                          <li>Click on edges to add new vertices</li>
                          <li>Select and delete individual areas with the trash tool</li>
                          <li>Add new areas using the drawing tools above</li>
                        </ul>
                      </div>
                    )}
                  </>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="secondary-button" onClick={triggerFieldsImport}>
                Import Fields GeoJSON
              </button>
              <button type="button" className="secondary-button" onClick={triggerFieldsWktImport}>
                Import Fields WKT
              </button>
            </div>
            <button 
              type="button" 
              className={`secondary-button ${showShapeDrawing ? 'shape-toggle-button--active' : ''}`}
              onClick={() => setShowShapeDrawing(!showShapeDrawing)}
            >
              {showShapeDrawing ? '✕ Close Land Tools' : '+ Add Land'}
            </button>
          </div>
          
          {showShapeDrawing && (
            <ShapeDrawingToolbar
              onShapeSelect={handleShapeSelect}
              activeShape={activeShapeType}
              onCancel={handleCancelShapeDrawing}
              isDrawing={isShapeDrawingMode}
            />
          )}
          
          <div className="fields-map-wrapper" style={{ position: 'relative' }}>
            {isShapeDrawingMode && activeShapeType !== 'polygon' && (
              <div className="shape-drawing-instructions">
                Click on the map to place your {activeShapeType}
              </div>
            )}
            
            <MapWizard
              locations={mapGeoJSON}
              mode="wizard"
              shouldInitialize={true}
              onAreaUpdate={handleMapAreaUpdate}
              onFieldSelect={handleFieldSelect}
              selectedFieldId={selectedField}
              onShapeDrawn={handleShapeDrawn}
              validateGeometry={(feature) => {
                // Skip validation during editing of existing fields to avoid MultiPolygon issues
                // Only validate new shapes being added
                if (!feature?.geometry) return true;
                
                // If this is a MultiPolygon being reconstructed from editing, skip validation
                if (feature.geometry.type === 'MultiPolygon') {
                  return true; // Allow MultiPolygon edits without validation
                }
                
                // Only validate single polygons (new shapes being added)
                if (!farmFeature?.geometry) return true;
                
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
                  try {
                    return turf.booleanWithin(fieldFeature, farmFeature);
                  } catch (fallbackErr) {
                    console.error("Fallback validation also failed:", fallbackErr);
                    return true; // Allow if validation fails
                  }
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
      
      {/* Shape Assignment Modal */}
      <ShapeAssignmentModal
        shape={pendingShapeAssignment}
        fields={wizardData.fieldsInfo || []}
        onAssign={handleShapeAssignment}
        onCancel={handleCancelShapeAssignment}
        isVisible={!!pendingShapeAssignment}
      />
    </div>
  );
};

export default FieldsPage;
