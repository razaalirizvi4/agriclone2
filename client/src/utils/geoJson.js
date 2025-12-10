import * as turf from "@turf/turf";

// Extracts the first polygon/multipolygon feature from GeoJSON input
export const normalizeFarmFeatureFromFile = (data) => {
  if (!data) return null;

  if (data.type === "Feature") {
    return data.geometry ? data : null;
  }

  if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
    return data.features.find(
      (feature) =>
        feature?.geometry &&
        ["Polygon", "MultiPolygon"].includes(feature.geometry.type)
    );
  }

  return null;
};

// Normalizes incoming fields GeoJSON; returns FeatureCollection and fieldsInfo list
export const normalizeFieldsFeatureCollection = (data, farmName = "Farm") => {
  if (!data) return null;

  let featureCollection = null;
  if (data.type === "FeatureCollection") {
    featureCollection = data;
  } else if (data.type === "Feature") {
    featureCollection = { type: "FeatureCollection", features: [data] };
  }

  if (!featureCollection?.features?.length) {
    return null;
  }

  const normalizedFeatures = featureCollection.features
    .filter(
      (feature) =>
        feature?.geometry &&
        ["Polygon", "MultiPolygon"].includes(feature.geometry.type)
    )
    .map((feature, idx) => {
      const id = feature.properties?.id || feature.id || `field-${Date.now()}-${idx}`;
      const name = feature.properties?.name || `Field ${idx + 1}`;
      let areaLabel = feature.properties?.area;

      if (!areaLabel) {
        const areaAcres = turf.area(feature) / 4046.8564224;
        const roundedArea = Math.max(0, Math.round(areaAcres * 100) / 100);
        areaLabel = `${roundedArea.toFixed(2)} acres`;
      }

      return {
        ...feature,
        properties: {
          ...(feature.properties || {}),
          id,
          name,
          type: "field",
          farm: farmName,
          area: areaLabel,
        },
      };
    });

  if (!normalizedFeatures.length) {
    return null;
  }

  const fieldsInfo = normalizedFeatures.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    area: feature.properties.area,
  }));

  return {
    fieldsData: { type: "FeatureCollection", features: normalizedFeatures },
    fieldsInfo,
  };
};

// Tags each field with type/farm/name/id before exporting
export const normalizeFieldsForExport = (featureCollection, farmName = "Farm") => {
  if (!featureCollection?.features?.length) return null;
  const features = featureCollection.features
    .filter(
      (f) =>
        f?.geometry && ["Polygon", "MultiPolygon"].includes(f.geometry.type)
    )
    .map((f, idx) => {
      const id = f.properties?.id || f.id || `field-${idx + 1}`;
      const name = f.properties?.name || `Field ${idx + 1}`;
      const areaLabel = f.properties?.area;
      return {
        ...f,
        properties: {
          ...(f.properties || {}),
          id,
          name,
          type: "field",
          farm: f.properties?.farm || farmName,
          area: areaLabel,
        },
      };
    });

  if (!features.length) return null;

  return { type: "FeatureCollection", features };
};

// Downloads a Feature or FeatureCollection as a .geojson file
export const exportFeatureCollection = (featureOrCollection, filenameBase = "export") => {
  if (!featureOrCollection) return;

  const featureCollection =
    featureOrCollection.type === "FeatureCollection"
      ? featureOrCollection
      : { type: "FeatureCollection", features: [featureOrCollection] };

  const blob = new Blob([JSON.stringify(featureCollection, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenameBase}.geojson`;
  link.click();
  URL.revokeObjectURL(url);
};
