import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import eventStreamService from "../services/eventStream.service";

const ReviewPage = () => {
  const { wizardData, onWizardComplete, isSavingWizard } = useOutletContext();
  const navigate = useNavigate();
  const [isCreatingEvents, setIsCreatingEvents] = useState(false);

  const farmDetails = wizardData.farmDetails || {};
  const fieldsInfo = wizardData.fieldsInfo || [];

  // Derive crop name directly from field info (no global crops list in wizardData)
  const getCropName = (field) => {
    if (!field) return null;
    return (
      field.cropName ??
      field.attributes?.cropName ??
      null
    );
  };

  // Build a simple summary of how many fields use each crop
  const cropSummary = fieldsInfo.reduce((acc, field) => {
    const name = getCropName(field) || "Unassigned";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

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
            onClick={async () => {
              if (isSavingWizard || isCreatingEvents) {
                return;
              }
              
              try {
                // First complete the wizard and get saved locations
                const response = await onWizardComplete();
                
                // Extract saved fields from response
                // Response structure: [{ type: 'farm', data: {...} }, { type: 'field', data: {...} }, ...]
                const savedFields = response?.data?.filter(item => item.type === 'field' && item.data) || [];
                
                // Create a map of field names to saved field IDs for lookup
                const fieldIdMap = new Map();
                savedFields.forEach(item => {
                  if (item.data && item.data.name) {
                    fieldIdMap.set(item.data.name, item.data._id);
                  }
                });
                
                // Collect all field IDs (both existing _id and newly saved _id)
                const allFieldIds = [];
                fieldsInfo.forEach(field => {
                  // Check if field has _id (existing field from edit mode)
                  if (field._id) {
                    allFieldIds.push(field._id);
                  }
                });
                // Also add newly saved field IDs
                savedFields.forEach(item => {
                  if (item.data?._id && !allFieldIds.includes(item.data._id)) {
                    allFieldIds.push(item.data._id);
                  }
                });
                
                // In edit mode, delete existing events for these fields before creating new ones
                setIsCreatingEvents(true);
                if (allFieldIds.length > 0) {
                  try {
                    await eventStreamService.deleteEventsByFieldIds(allFieldIds);
                    console.log(`Deleted events for ${allFieldIds.length} field(s)`);
                  } catch (deleteError) {
                    console.error("Error deleting existing events:", deleteError);
                    // Continue even if deletion fails - we'll still create new events
                  }
                }
                
                // Then create events for each field that has a recipe
                const eventPromises = [];
                
                for (let i = 0; i < fieldsInfo.length; i++) {
                  const field = fieldsInfo[i];
                  const selectedRecipe = field.selectedRecipe;
                  const cropStage = field.cropStage;
                  
                  // Try to get cropId from various possible locations
                  let cropId = field.crop_id || field.attributes?.crop_id;
                  
                  // If no cropId but we have cropName, try to find it in saved fields
                  if (!cropId && field.cropName) {
                    // Check if saved field has crop_id in attributes
                    const savedField = savedFields[i]?.data;
                    
                    if (savedField?.attributes?.crop_id) {
                      cropId = savedField.attributes.crop_id;
                    }
                  }
                  
                  // Also check if cropId is in the selectedRecipe (some recipes might have crop reference)
                  if (!cropId && selectedRecipe?.cropId) {
                    cropId = selectedRecipe.cropId;
                  }
                  
                  // Get the saved field ID from the map (prefer by name, fallback to index)
                  const savedFieldId = fieldIdMap.get(field.name) || savedFields[i]?.data?._id || field._id || field.id;
                  
                  // Only create events if field has a recipe and crop
                  if (selectedRecipe && cropId && selectedRecipe.id && savedFieldId) {
                    const eventData = {
                      cropId,
                      recipeId: selectedRecipe.id,
                      fieldId: savedFieldId,
                      startDate: new Date().toISOString(),
                      cropStage: cropStage || null,
                    };
                    
                    eventPromises.push(
                      eventStreamService.createFieldEvents(eventData)
                        .then(result => result)
                        .catch(error => {
                          console.error(`Failed to create events for field ${field.name}:`, error);
                          // Don't throw - continue with other fields
                          return null;
                        })
                    );
                  }
                }
                
                // Wait for all events to be created
                await Promise.all(eventPromises);
                
                alert("Farm registration and events created successfully!");
                navigate("/"); // Navigate to dashboard after everything is done
              } catch (error) {
                console.error("Error during wizard completion or event creation:", error);
                const message =
                  error?.response?.data?.message ||
                  error?.message ||
                  "Failed to complete wizard or create events. Please try again.";
                alert(message);
              } finally {
                setIsCreatingEvents(false);
              }
            }}
            disabled={
              !wizardData.farmDetails || !fieldsInfo.length || isSavingWizard || isCreatingEvents
            }
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              backgroundColor:
                !wizardData.farmDetails || !fieldsInfo.length || isSavingWizard || isCreatingEvents
                  ? "#9ca3af"
                  : "#16a34a",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor:
                !wizardData.farmDetails || !fieldsInfo.length || isSavingWizard || isCreatingEvents
                  ? "not-allowed"
                  : "pointer",
              boxShadow: "0 4px 10px rgba(22, 163, 74, 0.3)",
              transition: "background-color 0.15s ease",
            }}
          >
            {isSavingWizard ? "Saving..." : isCreatingEvents ? "Creating Events..." : "Confirm & Complete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
