import React, { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import FarmDetailsForm from "../components/View/FarmDetailsForm";
import MapWizard from "../components/View/MapWizard";
import { processFarmDivision, createFieldsInfo } from "../utils/fieldDivision";

const FarmDrawPage = () => {
  const {
    wizardData,
    onFarmDetailsSubmit,
    updateFarmArea,
    onCreateDefaultSquare,
    onFieldDivisionComplete
  } = useOutletContext();

  const navigate = useNavigate();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [farmCenter, setFarmCenter] = useState(null);
  const [farmSize, setFarmSize] = useState(null);
  const [fieldsGenerated, setFieldsGenerated] = useState(false);
  const polygonInitializedRef = useRef(false);
  const mapApiRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [drawnData, setDrawnData] = useState(null);

  const savedBoundaryFeature =
    wizardData.farmBoundaries?.type === "FeatureCollection"
      ? wizardData.farmBoundaries.features?.[0]
      : wizardData.farmBoundaries?.attributes?.geoJsonCords?.features?.[0];
  const hasSavedBoundary = !!savedBoundaryFeature;

  // Geocode address and create polygon when farm details are submitted
  useEffect(() => {
    if (
      wizardData.farmDetails?.address &&
      showMap &&
      farmSize &&
      !hasSavedBoundary &&
      !polygonInitializedRef.current &&
      mapReady &&
      mapApiRef.current
    ) {
      geocodeAddressAndCreatePolygon(wizardData.farmDetails.address, farmSize);
      polygonInitializedRef.current = true;
    }
  }, [
    wizardData.farmDetails?.address,
    showMap,
    farmSize,
    hasSavedBoundary,
    mapReady,
  ]);

  useEffect(() => {
    if (wizardData.farmDetails) {
      setShowMap(true);
      if (!farmSize) {
        const size = parseFloat(
          wizardData.farmDetails.size ?? wizardData.farmDetails.area ?? ""
        );
        if (!Number.isNaN(size)) {
          setFarmSize(size);
        }
      }
    }
  }, [wizardData.farmDetails, farmSize]);

  useEffect(() => {
    if (
      !showMap ||
      !hasSavedBoundary ||
      polygonInitializedRef.current ||
      !mapReady ||
      !mapApiRef.current
    )
      return;

    mapApiRef.current.setDrawnDataProgrammatically(savedBoundaryFeature);
    polygonInitializedRef.current = true;

    if (wizardData.fieldsData?.features?.length) {
      setFieldsGenerated(true);
    }

    const savedLat =
      wizardData.farmBoundaries?.attributes?.lat ??
      wizardData.farmBoundaries?.centerCoordinates?.lat;
    const savedLng =
      wizardData.farmBoundaries?.attributes?.lon ??
      wizardData.farmBoundaries?.centerCoordinates?.lng;

    if (
      typeof savedLat === "number" &&
      typeof savedLng === "number" &&
      !farmCenter
    ) {
      const center = { lat: savedLat, lng: savedLng };
      setFarmCenter(center);
      mapApiRef.current.setMapCenter(savedLng, savedLat);
    }
  }, [
    showMap,
    hasSavedBoundary,
    savedBoundaryFeature,
    wizardData.fieldsData,
    farmCenter,
    mapReady,
  ]);

  useEffect(() => {
    if (wizardData.fieldsData?.features?.length && !fieldsGenerated) {
      setFieldsGenerated(true);
    }
  }, [wizardData.fieldsData, fieldsGenerated]);

  // Reset fields generated status when farm boundary changes
  useEffect(() => {
    if (drawnData && drawnData.features.length > 0) {
      setFieldsGenerated(false);
    }
  }, [drawnData]);

  // Handle farm details form submission and show map
  const handleFarmDetailsSubmit = (farmDetails) => {
    const normalizedSize = farmDetails.size ?? farmDetails.area ?? "";
    const normalizedNumberOfFields =
      farmDetails.numberOfFields ?? farmDetails.fields ?? "";

    const payload = {
      ...farmDetails,
      ...(normalizedSize && { size: normalizedSize, area: normalizedSize }),
      ...(normalizedNumberOfFields && {
        numberOfFields: normalizedNumberOfFields,
      }),
    };

    onFarmDetailsSubmit(payload);
    setFarmSize(parseFloat(normalizedSize));
    setShowMap(true);
    polygonInitializedRef.current = false;
  };

  const geocodeAddressAndCreatePolygon = async (address, size) => {
    if (!address || !size) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          address
        )}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        if (mapApiRef.current) {
          mapApiRef.current.setMapCenter(lng, lat);
        }
        setFarmCenter({ lat, lng });

        // Create default square polygon based on farm size
        const squareData = onCreateDefaultSquare([lng, lat], size);

        // Update the map with the created polygon
        if (mapApiRef.current) {
          mapApiRef.current.setDrawnDataProgrammatically(
            squareData.features[0]
          );
        }
        
      } else {
        alert("Address not found. Please try a different address.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Error geocoding address.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle field generation (uses drawnData captured from MapWizard)
  const handleGenerateFields = () => {
    // Check if we're in edit mode and already have fields
    const isEditMode = wizardData.farmBoundaries?._id;
    const hasExistingFields = wizardData.fieldsData?.features?.length > 0;

    // If editing and fields already exist, skip regeneration and navigate to fields page
    if (isEditMode && hasExistingFields) {
      console.log("Edit mode: Fields already exist, skipping regeneration");
      navigate("/wizard/fields");
      return;
    }

    if (!drawnData || drawnData.features.length === 0) {
      alert("Please wait for the farm boundary to be created first!");
      return;
    }

    if (!wizardData.numberOfFields || wizardData.numberOfFields <= 0) {
      alert("Please specify the number of fields in the farm details form!");
      return;
    }

    try {
      const fieldsData = processFarmDivision(
        drawnData,
        wizardData.numberOfFields,
        wizardData.farmDetails
      );

      const fieldsInfo = createFieldsInfo(fieldsData);

      if (fieldsData && fieldsData.features && fieldsData.features.length > 0) {
        const completeData = {
          farmBoundaries: drawnData,
          fieldsData,
          fieldsInfo,
          numberOfFields: wizardData.numberOfFields,
          centerCoordinates: farmCenter
        };

        onFieldDivisionComplete(completeData);
        setFieldsGenerated(true);
        navigate("/wizard/fields");
      } else {
        alert("Unexpected error: Could not generate fields. Please try refreshing the page.");
      }
    } catch (error) {
      console.error("❌ Error generating fields:", error);
      alert("Error generating fields. Please check the console for details.");
    }
  };


  return (
    <div className="recipe-wizard-page">
      <div className="wizard-layout">
        {/* Left Side - Farm Details Form & Controls */}
        <div className="crop-card">
          <FarmDetailsForm
            onSubmit={handleFarmDetailsSubmit}
            initialValues={wizardData.farmDetails || {}}
          />
          
          {/* Farm Summary */}
          {wizardData.farmDetails && (
            <div className="wizard-farm-summary">
              <h4>Farm Summary</h4>
              <div className="wizard-farm-summary-content">
                <div>
                  <strong>Name:</strong> {wizardData.farmDetails.name}
                </div>
                <div>
                  <strong>Address:</strong> {wizardData.farmDetails.address}
                </div>
                <div>
                  <strong>Size:</strong>{" "}
                  {wizardData.farmArea && wizardData.farmArea !== "0 acres"
                    ? wizardData.farmArea
                    : farmSize
                    ? `${farmSize} Acre`
                    : null}
                </div>
                <div>
                  <strong>Number of Fields:</strong>{" "}
                  {wizardData.farmDetails.numberOfFields}
                </div>
                {farmCenter && (
                  <div>
                    <strong>Location:</strong> Lat: {farmCenter.lat.toFixed(6)},
                    Lng: {farmCenter.lng.toFixed(6)}
                  </div>
                )}
                {wizardData.farmArea && wizardData.farmArea !== "0 acres" && (
                  <div>
                    <strong>Calculated Area:</strong> {wizardData.farmArea}
                  </div>
                )}
                {fieldsGenerated && wizardData.fieldsData && (
                  <div className="status-success">
                    <strong>✓ Fields Generated:</strong>{" "}
                    {wizardData.fieldsData.features?.length || 0} fields created
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Map */}
        <div className="recipe-card">
          {showMap ? (
            <MapWizard
              locations={null}
              mode="wizard"
              shouldInitialize={showMap}
              onAreaUpdate={(area, centerCoordinates, feature) => {
                updateFarmArea(area, centerCoordinates, feature);
                if (centerCoordinates) {
                  setFarmCenter(centerCoordinates);
                }
              }}
              onMapReady={(api) => {
                mapApiRef.current = api;
                setMapReady(true);
              }}
              onDrawnDataChange={setDrawnData}
            />
          ) : (
            <div className="recipe-placeholder">
              <div className="wizard-placeholder-content">
                <div className="wizard-placeholder-icon">🗺️</div>
                <h3>Map Area</h3>
                <p>Fill out the farm details first to proceed</p>
              </div>
            </div>
          )}
          {/* Map Controls (shown after form submission) */}

          {showMap && (
            <div className="wizard-map-controls">
              <h4>Map Status</h4>

              {/* Location Status */}
              <div className="control-section">
                <div className="control-label">Farm Location</div>
                {isGeocoding ? (
                  <div className="status-info">
                    🔍 Creating farm boundary at:{" "}
                    {wizardData.farmDetails?.address}
                  </div>
                ) : farmCenter ? (
                  <div className="status-success">
                    ✓ Location set: Lat {farmCenter.lat.toFixed(6)}, Lng{" "}
                    {farmCenter.lng.toFixed(6)}
                  </div>
                ) : (
                  <div className="status-warning">
                    Creating farm boundary...
                  </div>
                )}
              </div>

              {/* Farm Boundaries */}
              <div className="control-section">
                <div className="control-label">Farm Boundaries</div>
                <div className="instruction">
                  A {farmSize}-acre farm boundary has been automatically created
                  around your location. You can adjust the boundary by dragging
                  the corners.
                </div>
                {wizardData.farmArea && wizardData.farmArea !== "0 acres" && (
                  <div className="status-success" style={{ marginTop: "10px" }}>
                    ✓ Current Area: {wizardData.farmArea}
                  </div>
                )}
              </div>

              {/* Generate Fields and Navigate Button */}
              <div className="control-section">
                <div className="control-label">Field Generation</div>
                <div className="instruction">
                  Click the button below to automatically divide your farm into{" "}
                  {wizardData.numberOfFields} fields and proceed to
                  customization.
                </div>
                <button
                  onClick={handleGenerateFields}
                  disabled={
                    !drawnData ||
                    drawnData.features.length === 0 ||
                    !wizardData.numberOfFields ||
                    isGeocoding
                  }
                  className="primary-button"
                  style={{ width: "20%", marginTop: "10px",  float:"right" }}
                >
                  Generate {wizardData.numberOfFields} Fields & Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmDrawPage;