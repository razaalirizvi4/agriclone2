import React from "react";
import useMapViewModel from "../ViewModel/useMapViewModel";
// import "./Map.css"

const Map = ({ componentName,locations, onFieldSelect }) => {
  const { mapContainer, handleRecenter } = useMapViewModel({
    locations,
    onFieldSelect, // ✅ forward callback
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
