import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import eventStreamService from "../services/eventStream.service";
import MapWizard from "../components/View/MapWizard";
import {
  normalizeFieldsForExport,
  exportFeatureCollection,
} from "../utils/geoJson";
import { geoJSONToWkt } from "../utils/wkt";
import { toast } from "react-toastify";
import ConfirmationModal from "../components/View/confirmationModal";

const ReviewPage = () => {
  const { wizardData, onWizardComplete, isSavingWizard } = useOutletContext();
  const navigate = useNavigate();
  const [isCreatingEvents, setIsCreatingEvents] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Validate that required wizard data exists, redirect if not
  useEffect(() => {
    // Check if required data is missing
    if (!wizardData?.farmDetails || !wizardData?.farmBoundaries) {
      // Redirect to the first step of the wizard
      navigate("/wizard", { replace: true });
      toast.warning("Please complete the farm setup first.");
      return;
    }

    // If no fields exist, redirect to fields page
    if (!wizardData?.fieldsInfo || wizardData.fieldsInfo.length === 0) {
      navigate("/wizard/fields", { replace: true });
      toast.warning("Please create at least one field first.");
      return;
    }
  }, [wizardData, navigate]);
  const farmDetails = wizardData.farmDetails || {};
  const fieldsInfo = wizardData.fieldsInfo || [];
  const farmName =
    farmDetails.name || wizardData.farmBoundaries?.name || "Farm";

  const farmFeature = useMemo(() => {
    const boundaries = wizardData.farmBoundaries;
    if (!boundaries) return null;

    const geoJson =
      boundaries?.attributes?.geoJsonCords ||
      (boundaries.type === "FeatureCollection" ? boundaries : null);

    const feature = geoJson?.features?.[0] || boundaries?.features?.[0];
    if (!feature?.geometry) return null;

    return {
      ...feature,
      properties: {
        ...(feature.properties || {}),
        id: feature.properties?.id || boundaries?._id || "farm-boundary",
        type: "farm",
        name: farmName,
        area:
          boundaries?.attributes?.area ||
          wizardData.farmArea ||
          feature.properties?.area ||
          "",
      },
    };
  }, [wizardData.farmBoundaries, wizardData.farmArea, farmName]);

  const fieldFeatures = useMemo(() => {
    return (wizardData.fieldsData?.features || []).map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties || {}),
        id: feature.properties?.id || feature.id,
        type: "field",
        farm: farmName,
      },
    }));
  }, [wizardData.fieldsData, farmName]);

  const mapGeoJSON = useMemo(() => {
    const features = [];
    if (farmFeature) features.push(farmFeature);
    if (fieldFeatures.length) features.push(...fieldFeatures);
    return features.length ? { type: "FeatureCollection", features } : null;
  }, [farmFeature, fieldFeatures]);

  // Exports farm boundary and fields as separate GeoJSON files
  const handleExportAll = () => {
    if (!farmFeature?.geometry) {
      toast.error("Farm boundary is missing; cannot export.");
      return;
    }

    const farmExportable = {
      ...farmFeature,
      properties: {
        ...(farmFeature.properties || {}),
        type: "farm",
        name: farmName,
        id: farmFeature.properties?.id || "farm-boundary",
      },
    };

    exportFeatureCollection(farmExportable, `${farmName || "farm"}-boundary`);

    const fieldsData = wizardData.fieldsData || {
      type: "FeatureCollection",
      features: [],
    };
    const normalizedFields = normalizeFieldsForExport(fieldsData, farmName);

    if (normalizedFields?.features?.length) {
      exportFeatureCollection(normalizedFields, `${farmName || "farm"}-fields`);
    } else {
      toast.error("No fields available to export.");
    }
  };


  const handleExportWktAll = () => {
    if (!farmFeature?.geometry) {
      toast.error("Farm boundary is missing; cannot export.");
      return;
    }

    // Export Farm Boundary
    const farmWkt = geoJSONToWkt(farmFeature.geometry);
    if (farmWkt) {
      const blob = new Blob([farmWkt], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${farmName || "farm"}-boundary.wkt`;
      link.click();
      URL.revokeObjectURL(url);
    }

    // Export Fields
    const fieldsData = wizardData.fieldsData || {
      type: "FeatureCollection",
      features: [],
    };
    
    // We want to combine all field polygons into a single MultiPolygon for WKT export
    // or just export them if they are already valid.
    const polygons = [];
    
    fieldsData.features.forEach(f => {
      if (!f.geometry) return;
      if (f.geometry.type === 'Polygon') {
        polygons.push(f.geometry.coordinates);
      } else if (f.geometry.type === 'MultiPolygon') {
        f.geometry.coordinates.forEach(poly => polygons.push(poly));
      }
    });

    if (polygons.length > 0) {
      const multiPoly = {
        type: 'MultiPolygon',
        coordinates: polygons
      };
      const fieldsWkt = geoJSONToWkt(multiPoly);
      
      if (fieldsWkt) {
        const blob = new Blob([fieldsWkt], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${farmName || "farm"}-fields.wkt`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
       // If no fields or no polygons, maybe just warn or skip
       if (fieldsData.features.length > 0) {
          toast.warn("No polygon fields to export to WKT.");
       }
    }
  };

  const formatRecipeInfo = (recipe) => {
    if (!recipe) return "Not selected";
    const parts = [];
    if (recipe.name) parts.push(recipe.name);
    if (recipe.id) parts.push(`ID: ${recipe.id}`);
    if (recipe.version) parts.push(`Version: ${recipe.version}`);
    if (recipe.cropId) parts.push(`Crop ID: ${recipe.cropId}`);
    return parts.join(" | ") || "Not selected";
  };

  const generatePdfSummary = () => {
    const doc = new jsPDF();
    let y = 16;

    const addLine = (text, fontSize = 12, spacing = 8, indent = 0) => {
      doc.setFontSize(fontSize);
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
      doc.text(String(text), 14 + indent, y);
      y += spacing;
    };

    addLine("Farm & Fields Summary", 18, 10);
    addLine(`Generated: ${new Date().toLocaleString()}`, 10, 12);

    addLine("Farm Information", 14, 8);
    addLine(`Name: ${farmDetails.name || "—"}`);
    addLine(`Address: ${farmDetails.address || "—"}`);
    addLine(
      `Size: ${
        wizardData.farmArea || farmDetails.size || farmDetails.area || "—"
      }`
    );
    addLine(
      `Number of Fields: ${
        farmDetails.numberOfFields ??
        wizardData.numberOfFields ??
        fieldsInfo.length ??
        "—"
      }`
    );

    if (wizardData.farmBoundaries?.attributes) {
      addLine(
        `Latitude: ${
          wizardData.farmBoundaries.attributes.lat ?? "—"
        } | Longitude: ${wizardData.farmBoundaries.attributes.lon ?? "—"}`
      );
    }

    addLine("", 12, 6);
    addLine("Fields", 14, 8);
    if (fieldsInfo.length === 0) {
      addLine("No fields have been created yet.");
    } else {
      fieldsInfo.forEach((field, index) => {
        addLine(`${index + 1}. ${field.name || `Field ${index + 1}`}`, 12, 6);
        addLine(`Area: ${field.area || "—"}`, 11, 6, 4);
        addLine(`Crop: ${getCropName(field) || "Not assigned"}`, 11, 6, 4);
        const soilType =
          field.soilType ||
          field.attributes?.soilType ||
          field.attributes?.soil_type ||
          null;
        const soilPH =
          field.soilPH ||
          field.soilPh ||
          field.soil_pH ||
          field.attributes?.soilPH ||
          field.attributes?.soilPh ||
          field.attributes?.soil_pH ||
          null;
        if (soilType) {
          addLine(`Soil Type: ${soilType}`, 10, 6, 4);
        }
        if (soilPH || soilPH === 0) {
          addLine(`Soil pH: ${soilPH}`, 10, 6, 4);
        }
        if (field.selectedRecipe) {
          addLine(
            `Recipe: ${formatRecipeInfo(field.selectedRecipe)}`,
            11,
            6,
            4
          );
          if (field.selectedRecipe?.recipeInfo?.description) {
            addLine(
              `Description: ${field.selectedRecipe.recipeInfo.description}`,
              10,
              6,
              8
            );
          }
          if (
            Array.isArray(field.selectedRecipe.recipeWorkflows) &&
            field.selectedRecipe.recipeWorkflows.length > 0
          ) {
            addLine("Workflow Steps:", 11, 6, 4);
            field.selectedRecipe.recipeWorkflows.forEach((workflow, wfIdx) => {
              addLine(
                `${wfIdx + 1}. ${workflow.stepName || `Step ${wfIdx + 1}`}`,
                10,
                6,
                8
              );
              if (workflow.duration) {
                addLine(`Duration: ${workflow.duration} days`, 10, 6, 12);
              }
              if (
                Array.isArray(workflow.equipmentRequired) &&
                workflow.equipmentRequired.length > 0
              ) {
                addLine("Equipment:", 10, 6, 12);
                workflow.equipmentRequired.forEach((equipment, eqIdx) => {
                  const name = equipment?.name || `Item ${eqIdx + 1}`;
                  const qty =
                    equipment?.quantity || equipment?.quantity === 0
                      ? equipment.quantity
                      : "—";
                  const optional = equipment?.optional ? " (Optional)" : "";
                  addLine(`- ${name} (Qty: ${qty}${optional})`, 10, 6, 16);
                });
              }
              if (workflow.notes) {
                addLine(`Notes: ${workflow.notes}`, 10, 8, 12);
              } else {
                y += 2;
              }
            });
          }
        } else {
          addLine("Recipe: Not selected", 11, 6, 4);
        }
        if (field.cropStage) {
          addLine(`Crop Stage: ${field.cropStage}`, 11, 8, 4);
        } else {
          y += 4;
        }
      });
    }

    doc.save("farm-fields-summary.pdf");
  };

  // Derive crop name directly from field info (no global crops list in wizardData)
  const getCropName = (field) => {
    if (!field) return null;
    return field.cropName ?? field.attributes?.cropName ?? null;
  };

  const FIELD_META_KEYS = ["_id", "ParentId", "crop_id"];

  const filteredFieldsInfo = fieldsInfo.filter(
    (field) =>
      !FIELD_META_KEYS.some(
        (key) => key in field && Object.keys(field).length === 1
      )
  );

  const handleDownloadAndComplete = () => {
    if (isSavingWizard || isCreatingEvents) {
      return;
    }
    toast.success("Downloading PDF...");
    generatePdfSummary();
  };

  const handleCompleteAndCreateEvents = async () => {
    if (isSavingWizard || isCreatingEvents) {
      return;
    }

    setShowConfirmModal(false);

    try {
      // Set loading state for the entire process
      setIsCreatingEvents(true);

      // First complete the wizard and get saved locations
      const response = await onWizardComplete();

      // Extract saved fields from response
      // Response structure: [{ type: 'farm', data: {...} }, { type: 'field', data: {...} }, ...]
      const savedFields =
        response?.data?.filter((item) => item.type === "field" && item.data) ||
        [];

      // Create a map of field names to saved field IDs for lookup
      const fieldIdMap = new Map();
      savedFields.forEach((item) => {
        if (item.data && item.data.name) {
          fieldIdMap.set(item.data.name, item.data._id);
        }
      });

      // Collect field IDs and prepare event data for fields that will have events created
      const fieldIdsForEvents = [];
      const eventsToCreate = [];

      for (let i = 0; i < fieldsInfo.length; i++) {
        const field = fieldsInfo[i];
        const selectedRecipe = field.selectedRecipe;
        const cropStage = field.cropStage;

        // Try to get cropId from various possible locations
        let cropId = field.crop_id || field.attributes?.crop_id;

        // If no cropId but we have cropName, try to find it in saved fields
        if (!cropId && field.cropName) {
          const savedField = savedFields[i]?.data;
          if (savedField?.attributes?.crop_id) {
            cropId = savedField.attributes.crop_id;
          }
        }

        // Also check if cropId is in the selectedRecipe
        if (!cropId && selectedRecipe?.cropId) {
          cropId = selectedRecipe.cropId;
        }

        // Get the saved field ID
        const savedFieldId =
          fieldIdMap.get(field.name) ||
          savedFields[i]?.data?._id ||
          field._id ||
          field.id;

        // Only process fields that have a recipe and crop
        if (selectedRecipe && cropId && selectedRecipe.id && savedFieldId) {
          // Add to field IDs list for deletion
          fieldIdsForEvents.push(savedFieldId);

          // Prepare event creation promise
          const eventData = {
            cropId,
            recipeId: selectedRecipe.id,
            fieldId: savedFieldId,
            startDate: new Date().toISOString(),
            cropStage: cropStage || null,
          };

          eventsToCreate.push(eventData);
        }
      }

      // Delete existing events for these field IDs before creating new ones
      if (fieldIdsForEvents.length > 0) {
        try {
          const deleteResponse =
            await eventStreamService.deleteEventsByFieldIds(fieldIdsForEvents);
          console.log(
            `Deleted ${deleteResponse.data.deletedCount} existing events for field IDs:`,
            fieldIdsForEvents
          );
        } catch (deleteError) {
          console.error("Error deleting existing events:", deleteError);
          // Continue with event creation even if deletion fails
        }
      }

      // Create events after deletions complete
      if (eventsToCreate.length > 0) {
        await Promise.all(
          eventsToCreate.map((eventData) =>
            eventStreamService
              .createFieldEvents(eventData)
              .catch((error) => {
                console.error(
                  `Failed to create events for field ${eventData.fieldId}:`,
                  error
                );
                // Don't throw - continue with other fields
                return null;
              })
          )
        );
      }
    toast.dismiss();

      toast.success("Farm registration and events created successfully!");
      navigate("/"); // Navigate to dashboard after everything is done
    } catch (error) {
      console.error("Error during wizard completion or event creation:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to complete wizard or create events. Please try again.";
      toast.error(message);
    } finally {
      setIsCreatingEvents(false);
    }
  };

  return (
    <div className="recipe-wizard-page review-page">
      <div className="review-shell">
        <div className="review-header">
          <h2>Review &amp; Verification</h2>
          <p>
            Please confirm the farm and fields information below before
            completing registration.
          </p>
        </div>

        <section className="review-card">
          <h3 className="section-title">
            <span>🗺️</span> <span>Farm &amp; Fields Preview</span>
          </h3>
          <div className="review-map-frame">
            <MapWizard
              locations={mapGeoJSON}
              mode="dashboard"
              shouldInitialize={true}
              onMapReady={(api) => {
                api.disableInteractions();
                // Recenter to the farm; fallback to first field
                if (farmFeature) {
                  api.focusOnFeature(farmFeature, { padding: 40 });
                } else if (fieldFeatures?.[0]) {
                  api.focusOnFeature(fieldFeatures[0], { padding: 40 });
                }
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={handleDownloadAndComplete}
              disabled={
                !wizardData.farmDetails ||
                !fieldsInfo.length ||
                isSavingWizard ||
                isCreatingEvents
              }
            >
              <span role="img" aria-label="PDF" style={{ marginRight: "6px" }}>
                📄
              </span>
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleExportAll}
              disabled={!farmFeature}
            >
              Export Farm &amp; Fields GeoJSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleExportWktAll}
              disabled={!farmFeature}
            >
              Export Farm &amp; Fields WKT
            </button>
          </div>
        </section>

        <section className="review-card review-info-card">
          <h3 className="section-title">
            <span>🏡</span> <span>Farm Information</span>
          </h3>

          {wizardData.farmDetails ? (
            <div className="review-info-grid">
              <div>
                <div className="review-info-label">Farm Name</div>
                <div className="review-info-value">
                  {farmDetails.name || "—"}
                </div>
              </div>
              <div>
                <div className="review-info-label">Address</div>
                <div className="review-info-value">
                  {farmDetails.address || "—"}
                </div>
              </div>
              <div>
                <div className="review-info-label">Farm Size</div>
                <div className="review-info-value">
                  {wizardData.farmArea ||
                    farmDetails.size ||
                    farmDetails.area ||
                    "—"}
                </div>
              </div>
              <div>
                <div className="review-info-label">Number of Fields</div>
                <div className="review-info-value">
                  {(() => {
                    const value =
                      farmDetails.numberOfFields ??
                      wizardData.numberOfFields ??
                      fieldsInfo.length;
                    return value || value === 0 ? value : "—";
                  })()}
                </div>
              </div>
              {wizardData.farmBoundaries?.attributes && (
                <>
                  <div>
                    <div className="review-info-label">Latitude</div>
                    <div className="review-info-value">
                      {wizardData.farmBoundaries.attributes.lat ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="review-info-label">Longitude</div>
                    <div className="review-info-value">
                      {wizardData.farmBoundaries.attributes.lon ?? "—"}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="review-empty">No farm information available.</div>
          )}
        </section>

        <section className="review-card review-info-card">
          <h3 className="section-title">
            <span>🌾</span> <span>Fields Information</span>
          </h3>

          {fieldsInfo.length ? (
            <>
              <div className="review-metadata">
                Total Fields:{" "}
                <span className="review-total">{fieldsInfo.length}</span>
              </div>
              <div className="review-table">
                <div className="review-table-head">
                  <div>Field Name</div>
                  <div>Area</div>
                  <div>Assigned Crop</div>
                </div>
                {filteredFieldsInfo.map((field, index) => {
                  const extraEntries = Object.entries(field).filter(
                    ([key]) =>
                      ![
                        "id",
                        "_id",
                        "name",
                        "area",
                        "cropName",
                        "cropStage",
                        "selectedRecipe",
                        "parentId",
                        "parent_id",
                        "ParentId",
                        "cropId",
                        "crop_id",
                        "Crop Id",
                        "CropId",
                      ].includes(key)
                  );

                  return (
                    <div className="review-table-row" key={field.id || index}>
                      <div className="review-info-value">
                        {field.name || `Field ${index + 1}`}
                      </div>
                      <div>{field.area || "—"}</div>
                      <div>{getCropName(field) || "Not assigned"}</div>

                      {extraEntries.length > 0 && (
                        <div className="review-extra">
                          {extraEntries.map(([key, value]) => (
                            <div key={key}>
                              <span className="review-extra-label">
                                {key.replace(/_/g, " ")}:
                              </span>{" "}
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="review-empty">No fields have been created yet.</div>
          )}
        </section>

        <div className="review-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/wizard/fields")}
          >
            Back to Fields
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowConfirmModal(true)}
            disabled={
              !wizardData.farmDetails ||
              !fieldsInfo.length ||
              isSavingWizard ||
              isCreatingEvents
            }
          >
            {isSavingWizard
              ? "Saving..."
              : isCreatingEvents
              ? "Creating Events..."
              : "Confirm & Complete"}
          </button>
        </div>
        <ConfirmationModal
          isOpen={showConfirmModal}
          title="Confirm registration"
          description="Save the farm and recreate events for fields with assigned recipes."
          confirmLabel="Yes, confirm"
          loading={isSavingWizard || isCreatingEvents}
          disableConfirm={
            !wizardData.farmDetails ||
            !fieldsInfo.length ||
            isSavingWizard ||
            isCreatingEvents
          }
          cancelLabel="Cancel"
          showCancelButton
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleCompleteAndCreateEvents}
        />
      </div>
    </div>
  );
};

export default ReviewPage;
