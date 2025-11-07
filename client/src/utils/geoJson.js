// utils/geojsonUtils.js
export const translateDrawnDataToSystemFormat = (
  drawnData,
  mode = null,
  ownerName = null,
  areaValue = null
) => {
  if (!drawnData?.features?.length) return null;

  const features = drawnData.features.map((feature, index) => ({
    type: "Feature",
    properties: {
      type: mode || "farm", // fallback if mode is null
      name: `${mode === "field" ? "New Field" : "New Farm"} ${index + 1}`,
      id: feature.properties?.id || `wizard-${Date.now()}`,
      owner: ownerName,
      cropId: null,
      area: areaValue ? `${areaValue}` : null, // ✅ now includes area
      farm: mode === "field" ? "New Farm" : "New Farm",
    },
    geometry: feature.geometry,
  }));

  return { type: "FeatureCollection", features };
};
