// src/pages/FieldsPage.js
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import FieldDetailsForm from "../components/View/FieldDetailsForm";
import { CropAssignmentForm } from "../components/View/cropAssignmentForm";
import MapWizard from "../components/View/MapWizard";
import {
  calculateEmptySpaces,
  calculateEmptySpaceArea,
  calculateFieldReduction,
} from "../utils/emptySpaceCalculator";

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
  }, [
    wizardData.fieldsData,
    wizardData.farmDetails,
    wizardData.farmBoundaries,
  ]);

  // Calculate empty spaces
  const emptySpaces = useMemo(() => {
    if (!farmFeature || !fieldFeatures.length) return null;
    return calculateEmptySpaces(farmFeature, fieldFeatures);
  }, [farmFeature, fieldFeatures]);

  const emptySpaceArea = useMemo(() => {
    if (!emptySpaces) return 0;
    return calculateEmptySpaceArea(emptySpaces);
  }, [emptySpaces]);

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

      const updatedArea =
        typeof areaLabel === "string" && areaLabel.length
          ? areaLabel
          : selectedFieldArea || "0 acres";

      onFieldGeometryUpdate(selectedField, feature.geometry, updatedArea);
    },
    [onFieldGeometryUpdate, selectedField, selectedFieldArea]
  );

  useEffect(() => {
    if (!selectedField || !wizardData.selectedFieldId) return;
    if (wizardData.selectedFieldId !== selectedField) {
      setSelectedField(wizardData.selectedFieldId);
    }
  }, [wizardData.selectedFieldId, selectedField]);

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

  // Calculate uncategorized areas from field reductions
  const uncategorizedAreas = useMemo(() => {
    return (wizardData.fieldsInfo || [])
      .map((field) => {
        const fieldFeature = wizardData.fieldsData?.features?.find(
          (f) => f.properties?.id === field.id
        );
        const initialArea =
          field.initialArea || fieldFeature?.properties?.initialArea;
        const reduction = initialArea
          ? calculateFieldReduction(initialArea, field.area)
          : null;

        if (reduction?.reduced) {
          return {
            id: `uncategorized-${field.id}`,
            name: `Uncategorized Area`,
            area: `${reduction.reductionAcres} acres`,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [wizardData.fieldsInfo, wizardData.fieldsData]);

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
            {emptySpaceArea > 0 && (
              <p className="fields-panel__meta" style={{ color: "#FF6B6B" }}>
                Unassigned Area: {emptySpaceArea} acres
              </p>
            )}
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
              emptySpaces={emptySpaces}
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

              {(wizardData.fieldsInfo || []).length > 0 ? (
                <div className="fields-table">
                  {/* Render all fields normally */}
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

                  {/* Render uncategorized areas as new entries */}
                  {uncategorizedAreas.map((uncategorizedArea, index) => (
                    <button
                      key={uncategorizedArea.id}
                      type="button"
                      className="fields-row"
                      onClick={(e) => e.preventDefault()}
                      style={{ cursor: "default" }}
                    >
                      <div className="fields-row__body">
                        <div className="fields-row__name">
                          {uncategorizedArea.name} ({index + 1})
                        </div>
                        <div className="fields-row__meta">
                          Area: {uncategorizedArea.area}
                        </div>
                      </div>
                      <span className="fields-row__indicator" />
                    </button>
                  ))}
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
