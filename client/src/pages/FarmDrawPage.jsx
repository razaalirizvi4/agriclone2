import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import useMapViewModel from "../components/ViewModel/useMapViewModel";
import FarmDetailsForm from "../components/View/FarmDetailsForm";

const FarmDrawPage = () => {
  const { 
    wizardData, 
    onFarmDetailsSubmit, 
    onFarmComplete,
    updateFarmArea,
    onCreateDefaultSquare
  } = useOutletContext();
  
  const navigate = useNavigate();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [farmCenter, setFarmCenter] = useState(null);
  const [farmSize, setFarmSize] = useState(null);

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

  const handleNext = () => {
    if (!drawnData || drawnData.features.length === 0) {
      alert("Please wait for the farm boundary to be created!");
      return;
    }

    // Store farm boundaries in wizardPage
    onFarmComplete(drawnData, 0, farmCenter);
    
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
                {farmCenter && (
                  <div><strong>Location:</strong> Lat: {farmCenter.lat.toFixed(6)}, Lng: {farmCenter.lng.toFixed(6)}</div>
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
              </div>

              {/* Next Button */}
              <button 
                onClick={handleNext}
                disabled={!drawnData || drawnData.features.length === 0 || isGeocoding}
                className="primary-button"
              >
                Next: Draw Fields
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