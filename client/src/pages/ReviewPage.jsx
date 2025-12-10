import React, { useMemo, useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import eventStreamService from "../services/eventStream.service";
import MapWizard from "../components/View/MapWizard";
import {
  normalizeFieldsForExport,
  exportFeatureCollection,
} from "../utils/geoJson";
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
      alert("Farm boundary is missing; cannot export.");
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
      alert("No fields available to export.");
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

    addLine("", 12, 6);
    addLine("Crop Summary", 14, 8);
    if (Object.keys(cropSummary).length === 0) {
      addLine("No crops have been assigned to fields yet.");
    } else {
      Object.entries(cropSummary).forEach(([name, count]) => {
        addLine(`${name}: ${count} field${count > 1 ? "s" : ""}`, 12, 6);
      });
    }

    doc.save("farm-fields-summary.pdf");
  };

  // Derive crop name directly from field info (no global crops list in wizardData)
  const getCropName = (field) => {
    if (!field) return null;
    return field.cropName ?? field.attributes?.cropName ?? null;
  };

  // Build a simple summary of how many fields use each crop
  const cropSummary = fieldsInfo.reduce((acc, field) => {
    const name = getCropName(field) || "Unassigned";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const handleDownloadAndComplete = () => {
    if (isSavingWizard || isCreatingEvents) {
      return;
    }
    toast.success("Downloading PDF...");
    generatePdfSummary();
    handleCompleteAndCreateEvents();
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
      const eventPromises = [];

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

          eventPromises.push(
            eventStreamService
              .createFieldEvents(eventData)
              .then((result) => result)
              .catch((error) => {
                console.error(
                  `Failed to create events for field ${field.name}:`,
                  error
                );
                // Don't throw - continue with other fields
                return null;
              })
          );
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

      // Wait for all events to be created
      await Promise.all(eventPromises);
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f7",
        padding: "32px 16px",
        display: "flex",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          padding: "24px 28px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "16px",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Review &amp; Verification
          </h2>
          <p
            style={{
              margin: "8px 0 0 0",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Please confirm the farm and fields information below before
            completing registration.
          </p>
        </div>

        {/* Map Preview */}
        <section
          style={{
            marginBottom: "24px",
            padding: "0 0 12px 0",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              fontWeight: 600,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🗺️</span> <span>Farm & Fields Preview</span>
          </h3>
          <div
            style={{
              height: "360px",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}
          >
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
              marginTop: "12px",
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={handleExportAll}
              disabled={!farmFeature}
            >
              Export Farm & Fields
            </button>
          </div>
        </section>

        {/* Farm Information */}
        <section
          style={{
            marginBottom: "24px",
            padding: "16px 18px",
            borderRadius: "10px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: 600,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🏡</span> <span>Farm Information</span>
          </h3>

          {wizardData.farmDetails ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px 18px",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Farm Name
                </div>
                <div style={{ fontWeight: 500 }}>{farmDetails.name || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Address
                </div>
                <div style={{ fontWeight: 500 }}>
                  {farmDetails.address || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Farm Size
                </div>
                <div style={{ fontWeight: 500 }}>
                  {wizardData.farmArea ||
                    farmDetails.size ||
                    farmDetails.area ||
                    "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  Number of Fields
                </div>
                <div style={{ fontWeight: 500 }}>
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
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Latitude
                    </div>
                    <div style={{ fontWeight: 500 }}>
                      {wizardData.farmBoundaries.attributes.lat ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>
                      Longitude
                    </div>
                    <div style={{ fontWeight: 500 }}>
                      {wizardData.farmBoundaries.attributes.lon ?? "—"}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              No farm information available.
            </div>
          )}
        </section>

        {/* Fields Information */}
        <section
          style={{
            marginBottom: "24px",
            padding: "16px 18px",
            borderRadius: "10px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: 600,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🌾</span> <span>Fields Information</span>
          </h3>

          {fieldsInfo.length ? (
            <>
              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Total Fields:{" "}
                <span style={{ fontWeight: 600, color: "#111827" }}>
                  {fieldsInfo.length}
                </span>
              </div>
              <div
                style={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1.5fr",
                    gap: "8px",
                    padding: "10px 12px",
                    backgroundColor: "#f3f4f6",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#4b5563",
                  }}
                >
                  <div>Field Name</div>
                  <div>Area</div>
                  <div>Assigned Crop</div>
                </div>
                {fieldsInfo.map((field, index) => {
                  const extraEntries = Object.entries(field).filter(
                    ([key]) =>
                      ![
                        "id",
                        "name",
                        "area",
                        "cropName",
                        "cropStage",
                        "selectedRecipe",
                      ].includes(key)
                  );

                  return (
                    <div
                      key={field.id}
                      style={{
                        padding: "10px 12px",
                        fontSize: "13px",
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f9fafb",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1.5fr",
                          gap: "8px",
                          marginBottom: extraEntries.length ? "6px" : 0,
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>
                          {field.name || `Field ${index + 1}`}
                        </div>
                        <div>{field.area || "—"}</div>
                        <div>{getCropName(field) || "Not assigned"}</div>
                      </div>

                      {extraEntries.length > 0 && (
                        <div
                          style={{
                            marginTop: "4px",
                            paddingTop: "4px",
                            borderTop: "1px dashed #e5e7eb",
                            fontSize: "12px",
                            color: "#4b5563",
                          }}
                        >
                          {extraEntries.map(([key, value]) => (
                            <div key={key}>
                              <span
                                style={{
                                  fontWeight: 500,
                                  textTransform: "capitalize",
                                }}
                              >
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
            <div
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              No fields have been created yet.
            </div>
          )}
        </section>

        {/* Crop Summary */}
        <section
          style={{
            marginBottom: "24px",
            padding: "16px 18px",
            borderRadius: "10px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: "12px",
              fontSize: "16px",
              fontWeight: 600,
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🌱</span> <span>Crop Summary</span>
          </h3>

          {Object.keys(cropSummary).length ? (
            <div
              style={{
                marginTop: "8px",
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "8px 16px",
                fontSize: "14px",
                color: "#374151",
              }}
            >
              {Object.entries(cropSummary).map(([name, count]) => (
                <React.Fragment key={name}>
                  <div style={{ fontWeight: 500 }}>{name}</div>
                  <div>
                    {count} field
                    {count > 1 ? "s" : ""}
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: "4px",
                fontSize: "14px",
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              No crops have been assigned to fields yet.
            </div>
          )}
        </section>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/wizard/fields")}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              color: "#111827",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Back to Fields
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={
              !wizardData.farmDetails ||
              !fieldsInfo.length ||
              isSavingWizard ||
              isCreatingEvents
            }
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              backgroundColor:
                !wizardData.farmDetails ||
                !fieldsInfo.length ||
                isSavingWizard ||
                isCreatingEvents
                  ? "#9ca3af"
                  : "#16a34a",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor:
                !wizardData.farmDetails ||
                !fieldsInfo.length ||
                isSavingWizard ||
                isCreatingEvents
                  ? "not-allowed"
                  : "pointer",
              boxShadow: "0 4px 10px rgba(22, 163, 74, 0.3)",
              transition: "background-color 0.15s ease",
            }}
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
          description="This will save the farm and recreate events for fields with assigned recipes."
          confirmLabel="Yes, confirm and create events"
          loading={isSavingWizard || isCreatingEvents}
          disableConfirm={
            !wizardData.farmDetails ||
            !fieldsInfo.length ||
            isSavingWizard ||
            isCreatingEvents
          }
          showCancelButton={false}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={handleCompleteAndCreateEvents}
          extraAction={{
            label: "Download PDF",
            onClick: handleDownloadAndComplete,
            loading: isSavingWizard || isCreatingEvents,
            disabled:
              !wizardData.farmDetails ||
              !fieldsInfo.length ||
              isSavingWizard ||
              isCreatingEvents,
          }}
        >
          <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: 1.5 }}>
            <div>
              <strong>Fields:</strong> {fieldsInfo.length || 0}
            </div>
            <div>
              <strong>Events will be regenerated for:</strong>{" "}
              {
                fieldsInfo.filter(
                  (field) =>
                    field.selectedRecipe &&
                    (field.crop_id ||
                      field.attributes?.crop_id ||
                      field.selectedRecipe?.cropId ||
                      field.cropName)
                ).length
              }{" "}
              field(s) with a recipe and crop assigned.
            </div>
            <div style={{ marginTop: "6px", color: "#6b7280" }}>
              Existing events for those fields will be removed before creating
              new ones.
            </div>
          </div>
        </ConfirmationModal>
      </div>
    </div>
  );
};

export default ReviewPage;
