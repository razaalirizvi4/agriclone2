import React, { useEffect } from "react";
import useMapViewModel from "../ViewModel/useMapViewModel";
import { translateDrawnDataToSystemFormat } from "../../utils/geoJson";

const MapWizard = ({ mode = "wizard", locations, onDrawComplete }) => {
  const { mapContainer, handleRecenter, area, drawnData } = useMapViewModel({
    mode,
    locations, // ✅ now reused for showing pre-existing polygons
  });

  useEffect(() => {
    if (onDrawComplete && drawnData) {
      const translated = translateDrawnDataToSystemFormat(
        drawnData,
        null,
        null,
        area
      );
      onDrawComplete(translated);
    }
  }, [drawnData, area]);

  useEffect(() => {
    console.log("After drawing", locations);
  }, [locations]);

  return (
    <div className="container" style={{ position: "relative" }}>
      <h3>{mode === "farm" ? "Draw Farm Boundary" : "Draw Field Boundary"}</h3>
      <div className="map-container" ref={mapContainer}></div>
      <button onClick={handleRecenter} className="recenter-button">
        Recenter
      </button>
      {area && <div>Area: {area}</div>}
    </div>
  );
};

export default MapWizard;
