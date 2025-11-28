import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import useMapViewModel from "../components/ViewModel/useMapViewModel";
import FarmDetailsForm from "../components/View/FarmDetailsForm";
import { processFarmDivision,createFieldsInfo } from "../utils/fieldDivision";

const FarmDrawPage = () => {
  const { 
    wizardData, 
    onFarmDetailsSubmit, 
    onFarmComplete,
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

  const { 
    mapContainer, 
    drawnData,
    setMapCenter,
    setDrawnDataProgrammatically
  } = useMapViewModel({
    locations: null,
    mode: "wizard",
    shouldInitialize: showMap,
    onAreaUpdate: (area, centerCoordinates) => {
      updateFarmArea(area);
      if (centerCoordinates) {
        setFarmCenter(centerCoordinates);
      }
    }
  });

  // Geocode address and create polygon when farm details are submitted
  useEffect(() => {
    if (wizardData.farmDetails?.address && showMap && farmSize) {
      geocodeAddressAndCreatePolygon(wizardData.farmDetails.address, farmSize);
    }
  }, [wizardData.farmDetails?.address, showMap, farmSize]);

  // Reset fields generated status when farm boundary changes
  useEffect(() => {
    if (drawnData && drawnData.features.length > 0) {
      setFieldsGenerated(false);
    }
  }, [drawnData]);

  // Handle farm details form submission and show map
  const handleFarmDetailsSubmit = (farmDetails) => {
    onFarmDetailsSubmit(farmDetails);
    setFarmSize(parseFloat(farmDetails.size));
    setShowMap(true);
  };

  const geocodeAddressAndCreatePolygon = async (address, size) => {
    if (!address || !size) return;
    
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setMapCenter(lng, lat);
        setFarmCenter({ lat, lng });
        
        // Create default square polygon based on farm size
        const squareData = onCreateDefaultSquare([lng, lat], size);
        
        // Update the map with the created polygon
        setDrawnDataProgrammatically(squareData.features[0]);
        
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

  // Handle field generation
const handleGenerateFields = () => {
  if (!drawnData || drawnData.features.length === 0) {
    alert("Please wait for the farm boundary to be created first!");
    return;
  }

  if (!wizardData.numberOfFields || wizardData.numberOfFields <= 0) {
    alert("Please specify the number of fields in the farm details form!");
    return;
  }

  try {
    console.log("=== FIELD GENERATION DEBUG ===");
    console.log("1. Drawn Data:", JSON.stringify(drawnData, null, 2));
    console.log("2. Number of Fields:", wizardData.numberOfFields);
    console.log("3. Farm Details:", wizardData.farmDetails);

    // Use the drawnData directly
    const fieldsData = processFarmDivision(
      drawnData,
      wizardData.numberOfFields,
      wizardData.farmDetails
    );

    console.log("4. Fields Data Result:", fieldsData);
    console.log("5. Number of features created:", fieldsData.features.length);

    const fieldsInfo = createFieldsInfo(fieldsData);

    // Store the generated fields in wizard state
    if (fieldsData && fieldsData.features && fieldsData.features.length > 0) {
      const completeData = {
        farmBoundaries: drawnData,
        fieldsData: fieldsData,
        fieldsInfo: fieldsInfo,
        numberOfFields: wizardData.numberOfFields,
        centerCoordinates: farmCenter
      };
      
      onFieldDivisionComplete(completeData);
      setFieldsGenerated(true);
      
      console.log(`✅ Generated ${fieldsData.features.length} fields successfully!`);
      alert(`Successfully generated ${fieldsData.features.length} fields! You can now proceed to the next step.`);
    } else {
      console.error("❌ No fields were generated - this should not happen with fallback");
      console.log("Fields data:", fieldsData);
      alert("Unexpected error: Could not generate fields. Please try refreshing the page.");
    }

  } catch (error) {
    console.error("❌ Error generating fields:", error);
    alert("Error generating fields. Please check the console for details.");
  }
};

  const handleNext = () => {
    if (!drawnData || drawnData.features.length === 0) {
      alert("Please wait for the farm boundary to be created!");
      return;
    }

    if (!fieldsGenerated) {
      alert("Please generate fields first using the 'Generate Fields' button!");
      return;
    }

    // Navigate to fields management page
    navigate("/wizard/fields");
  };

  return (
    <div className="recipe-wizard-page">
      <div className="wizard-layout">
        {/* Left Side - Farm Details Form & Controls */}
        <div className="crop-card">
          <FarmDetailsForm onSubmit={handleFarmDetailsSubmit} />
          
          {/* Farm Summary */}
          {wizardData.farmDetails && (
            <div className="wizard-farm-summary">
              <h4>Farm Summary</h4>
              <div className="wizard-farm-summary-content">
                <div><strong>Name:</strong> {wizardData.farmDetails.name}</div>
                <div><strong>Address:</strong> {wizardData.farmDetails.address}</div>
                <div><strong>Size:</strong> {wizardData.farmDetails.size} acres</div>
                <div><strong>Number of Fields:</strong> {wizardData.farmDetails.numberOfFields}</div>
                {farmCenter && (
                  <div><strong>Location:</strong> Lat: {farmCenter.lat.toFixed(6)}, Lng: {farmCenter.lng.toFixed(6)}</div>
                )}
                {wizardData.farmArea && wizardData.farmArea !== "0 acres" && (
                  <div><strong>Calculated Area:</strong> {wizardData.farmArea}</div>
                )}
                {fieldsGenerated && wizardData.fieldsData && (
                  <div className="status-success">
                    <strong>✓ Fields Generated:</strong> {wizardData.fieldsData.features?.length || 0} fields created
                  </div>
                )}
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
                    🔍 Creating farm boundary at: {wizardData.farmDetails?.address}
                  </div>
                ) : farmCenter ? (
                  <div className="status-success">
                    ✓ Location set: Lat {farmCenter.lat.toFixed(6)}, Lng {farmCenter.lng.toFixed(6)}
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
                  A {farmSize}-acre farm boundary has been automatically created around your location.
                  You can adjust the boundary by dragging the corners.
                </div>
                {wizardData.farmArea && wizardData.farmArea !== "0 acres" && (
                  <div className="status-success" style={{marginTop: '10px'}}>
                    ✓ Current Area: {wizardData.farmArea}
                  </div>
                )}
              </div>

              {/* Generate Fields Button */}
              <div className="control-section">
                <div className="control-label">Field Generation</div>
                <div className="instruction">
                  Click the button below to automatically divide your farm into {wizardData.numberOfFields} fields.
                  This will create the field boundaries that you can then customize in the next step.
                </div>
                <button 
                  onClick={handleGenerateFields}
                  disabled={!drawnData || drawnData.features.length === 0 || !wizardData.numberOfFields || isGeocoding}
                  className="secondary-button"
                  style={{width: '100%', marginTop: '10px'}}
                >
                  {fieldsGenerated ? '✓ Fields Generated' : `Generate ${wizardData.numberOfFields} Fields`}
                </button>
                {fieldsGenerated && wizardData.fieldsData && (
                  <div className="status-success" style={{marginTop: '10px'}}>
                    ✓ Ready to proceed! {wizardData.fieldsData.features?.length || 0} fields created.
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button 
                onClick={handleNext}
                disabled={!drawnData || drawnData.features.length === 0 || !fieldsGenerated || isGeocoding}
                className="primary-button"
              >
                Next: Customize {wizardData.numberOfFields} Fields
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Map */}
        <div className="recipe-card">
          {showMap ? (
            <div 
              className="map-container" 
              ref={mapContainer}
              style={{ height: "400px", width: "100%" }}
            ></div>
          ) : (
            <div className="recipe-placeholder">
              <div className="wizard-placeholder-content">
                <div className="wizard-placeholder-icon">🗺️</div>
                <h3>Map Area</h3>
                <p>Fill out the farm details first to proceed</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmDrawPage;