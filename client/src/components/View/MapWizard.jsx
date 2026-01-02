import React, { useEffect } from "react";
import useMapViewModel from "../ViewModel/useMapViewModel";

/**
 * Thin wrapper around useMapViewModel for wizard steps.
 *
 * Responsibilities:
 * - Own the Mapbox map instance for wizard (farm + fields)
 * - Expose map helpers to parent via onMapReady
 * - Notify parent when drawnData changes (onDrawnDataChange)
 * - Delegate all business logic (field division, form updates, etc.) to pages
 */
const MapWizard = ({
  locations,
  mode = "wizard",
  shouldInitialize = true,
  onAreaUpdate,
  onFieldSelect,
  selectedFieldId,
  onMapReady,
  onDrawnDataChange,
  validateGeometry,
  onShapeDrawn,
  className,
  style,
}) => {
  const api = useMapViewModel({
    locations,
    mode,
    shouldInitialize,
    onAreaUpdate,
    onFieldSelect,
    selectedFieldId,
    validateGeometry,
    onShapeDrawn,
  });

  // Expose map helpers once ready
  useEffect(() => {
    if (api.mapLoaded && onMapReady) {
      onMapReady(api);
    }
  }, [api.mapLoaded, onMapReady, api]);

  // Notify about drawn data changes (for farm boundary in farm step)
  useEffect(() => {
    if (onDrawnDataChange) {
      onDrawnDataChange(api.drawnData);
    }
  }, [api.drawnData, onDrawnDataChange]);

  return (
    <div
      className={className || "map-container"}
      style={style}
      ref={api.mapContainer}
    />
  );
};

export default MapWizard;