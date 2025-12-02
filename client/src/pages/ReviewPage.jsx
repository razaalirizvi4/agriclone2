import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

const ReviewPage = () => {
  const { wizardData, onWizardComplete } = useOutletContext();
  const navigate = useNavigate();

  const farmDetails = wizardData.farmDetails || {};
  const fieldsInfo = wizardData.fieldsInfo || [];
  const crops = wizardData.crops || [];

  const getCropName = (cropId) => {
    if (!cropId) return null;
    const crop = crops.find((c) => c.id === cropId);
    return crop ? crop.name : cropId;
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
                    ([key]) => !["id", "name", "area", "cropId"].includes(key)
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
                        <div>{getCropName(field.cropId) || "Not assigned"}</div>
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
            onClick={onWizardComplete}
            disabled={!wizardData.farmDetails || !fieldsInfo.length}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              backgroundColor:
                !wizardData.farmDetails || !fieldsInfo.length
                  ? "#9ca3af"
                  : "#16a34a",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 600,
              cursor:
                !wizardData.farmDetails || !fieldsInfo.length
                  ? "not-allowed"
                  : "pointer",
              boxShadow: "0 4px 10px rgba(22, 163, 74, 0.3)",
              transition: "background-color 0.15s ease",
            }}
          >
            Confirm &amp; Complete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
