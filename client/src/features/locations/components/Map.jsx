import React from "react";
import useMapViewModel from "../hooks/useMapViewModel";
// import "./Map.css"

const Map = ({ componentName,locations,crops, onFieldSelect,selectedFieldId,mode = "dashboard"  }) => {
  const { mapContainer, handleRecenter } = useMapViewModel({
    locations,
    crops,
    onFieldSelect, // ✅ forward callback
    selectedFieldId,
    mode
  });


return (
  <div className="container" style={{ position: "relative" }}>
    <h3>{componentName}</h3>
    <div className="map-container" ref={mapContainer}></div>
    <button onClick={handleRecenter} className="recenter-button">
      Recenter
    </button>
  </div>
);
};

export default Map;
