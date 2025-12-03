// UTILITY FUNCTIONS
export const buildGeoJSON = (locations) => {
  if (!locations) return null;

  if (locations.type === "FeatureCollection" && locations.features?.length) {
    return {
      type: "FeatureCollection",
      features: locations.features.map((feature, index) => ({
        type: "Feature",
        properties: {
          ...feature.properties,
          id:
            feature.properties?.id ||
            feature.id ||
            `feature-${index}`,
          type:
            feature.properties?.type ||
            feature.geometry?.type?.toLowerCase() ||
            "unknown",
        },
        geometry: feature.geometry,
      })),
    };
  }

  if (!locations.length) return null;

  const features = locations.map((elem) => {
    const isField = elem?.type?.toLowerCase() === "field";
    const attrs = elem?.attributes || {};
    const nestedAttrs =
      attrs?.geoJsonCords?.features?.[0]?.properties?.attributes || {};

    const cropId = isField ? attrs?.crop_id || nestedAttrs?.crop_id || null : null;
    const cropName = isField
      ? attrs?.cropName || nestedAttrs?.cropName || null
      : null;

    return {
      type: "Feature",
      properties: {
        type: elem?.type?.toLowerCase(),
        name: elem?.name,
        id: elem?._id,
        owner: elem?.owner?.name,
        cropId,
        cropName,
        area: attrs?.area || null,
        farm: isField
          ? locations.find((l) => l._id === elem.parentId)?.name || attrs?.farm
          : elem?.name,
      },
      geometry: attrs?.geoJsonCords?.features?.[0]?.geometry,
    };
  });

  return { type: "FeatureCollection", features };
};

export const calculateGeometryCenter = (geometry) => {
  if (!geometry?.coordinates) return null;

  switch (geometry.type) {
    case "Polygon": {
      const coords = geometry.coordinates[0];
      const lng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      const lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      return [lng, lat];
    }
    case "LineString": {
      const mid = Math.floor(geometry.coordinates.length / 2);
      return geometry.coordinates[mid];
    }
    case "Point":
      return geometry.coordinates;
    default:
      return null;
  }
};

export const calculateMapCenter = (geoJSON, selectedFieldId = null) => {
  if (!geoJSON?.features?.length) return null;

  // If field selected, center on it
  if (selectedFieldId) {
    const selected = geoJSON.features.find(
      (f) => f.properties?.id === selectedFieldId
    );
    if (selected?.geometry) {
      return calculateGeometryCenter(selected.geometry);
    }
  }

  // Otherwise, calculate average center of all features
  let totalLng = 0,
    totalLat = 0,
    count = 0;

  geoJSON.features.forEach((f) => {
    const geom = f.geometry;
    if (!geom?.coordinates) return;

    switch (geom.type) {
      case "Polygon":
        geom.coordinates[0].forEach(([lng, lat]) => {
          totalLng += lng;
          totalLat += lat;
          count++;
        });
        break;
      case "LineString":
        geom.coordinates.forEach(([lng, lat]) => {
          totalLng += lng;
          totalLat += lat;
          count++;
        });
        break;
      case "Point": {
        const [lng, lat] = geom.coordinates;
        totalLng += lng;
        totalLat += lat;
        count++;
        break;
      }
    }
  });

  return count ? [totalLng / count, totalLat / count] : null;
};