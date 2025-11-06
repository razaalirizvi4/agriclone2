import React from "react";
import useMapViewModel from "../ViewModel/useMapViewModel";
// import "./Map.css"

const Map = ({ componentName,locations,crops, onFieldSelect,selectedFieldId  }) => {
  const { mapContainer, handleRecenter,area } = useMapViewModel({
    locations,
    crops,
    onFieldSelect, // ✅ forward callback
    selectedFieldId,
  });


return (
  <div className="container" style={{ position: "relative" }}>
    <h3>{componentName}</h3>
    <div className="map-container" ref={mapContainer}></div>
    <button onClick={handleRecenter} className="recenter-button">
      Recenter
    </button>
    <div>area is {area}</div>
  </div>
);
};

export default Map;
