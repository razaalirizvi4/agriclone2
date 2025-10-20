import React from "react";
import useMapViewModel from "../ViewModel/useMapViewModel";

const Map = ({ locations, onFieldSelect }) => {
  const { mapContainer, handleRecenter } = useMapViewModel({
    locations,
    onFieldSelect, // ✅ forward callback
  });




  return (
    <div style={{ position: "relative" }}>
      <div ref={mapContainer} className="map-container" />
      <button onClick={handleRecenter} className="recenter-button">
        Recenter
      </button>
    </div>
  );
};

export default Map;
