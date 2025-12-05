// UTILITY FUNCTIONS
import { processFarmDivision } from "./fieldDivision";
import * as turf from "@turf/turf";

/**
 * Re-divides fields when farm location changes, preserving existing field data
 * @param {Object} newFarmFeature - GeoJSON Feature representing the new farm boundary
 * @param {Array} existingFieldsInfo - Array of existing field info objects (preserves names, crop_id, etc.)
 * @param {Object} farmDetails - Farm details object (name, etc.)
 * @returns {Object} Object with fieldsData (FeatureCollection) and fieldsInfo (array)
 */
export const redivideFieldsForNewFarmLocation = (
  newFarmFeature,
  existingFieldsInfo = [],
  farmDetails = {}
) => {
  if (!newFarmFeature || !newFarmFeature.geometry) {
    console.warn("redivideFieldsForNewFarmLocation: Invalid farm feature provided");
    return {
      fieldsData: { type: "FeatureCollection", features: [] },
      fieldsInfo: [],
    };
  }

  // Create FeatureCollection from the new farm feature
  const farmData = {
    type: "FeatureCollection",
    features: [newFarmFeature],
  };

  // Get number of fields from existing fields or default to 1
  const numberOfFields = existingFieldsInfo.length || 1;

  // Use processFarmDivision to create new field geometries
  const newFieldsData = processFarmDivision(
    farmData,
    numberOfFields,
    farmDetails
  );

  if (!newFieldsData || !newFieldsData.features || newFieldsData.features.length === 0) {
    console.warn("Failed to divide farm into fields");
    return {
      fieldsData: { type: "FeatureCollection", features: [] },
      fieldsInfo: existingFieldsInfo,
    };
  }

  // Preserve existing field data (names, crop_id, _id, etc.) and map to new geometries
  const preservedFieldsData = newFieldsData.features.map((newField, index) => {
    // Find corresponding existing field by index
    const existingField = existingFieldsInfo[index] || {};

    // Preserve all existing field properties
    return {
      ...newField,
      properties: {
        ...newField.properties,
        // Preserve existing field ID if available
        id: existingField.id || existingField._id || newField.properties.id,
        // Preserve existing field name
        name: existingField.name || newField.properties.name,
        // Preserve crop_id
        crop_id: existingField.crop_id || null,
        // Preserve _id for API updates
        ...(existingField._id && { _id: existingField._id }),
        // Preserve all other existing field attributes
        ...Object.keys(existingField).reduce((acc, key) => {
          // Don't overwrite geometry-related properties
          if (!["id", "name", "area", "crop_id", "_id", "geometry", "geoJsonCords"].includes(key)) {
            acc[key] = existingField[key];
          }
          return acc;
        }, {}),
        // Update area based on new geometry
        area: newField.properties.area,
      },
    };
  });

  // Create updated fieldsInfo array preserving all existing data
  const preservedFieldsInfo = preservedFieldsData.map((field, index) => {
    const existingField = existingFieldsInfo[index] || {};
    
    return {
      // Preserve existing field ID
      id: existingField.id || existingField._id || field.properties.id,
      // Preserve _id for API updates
      ...(existingField._id && { _id: existingField._id }),
      // Preserve existing name
      name: existingField.name || field.properties.name,
      // Update area based on new geometry
      area: field.properties.area,
      // Preserve crop_id
      crop_id: existingField.crop_id || null,
      // Preserve parentId
      ...(existingField.parentId && { parentId: existingField.parentId }),
      // Preserve all other existing attributes
      ...Object.keys(existingField).reduce((acc, key) => {
        if (!["id", "_id", "name", "area", "crop_id", "parentId", "geometry", "geoJsonCords"].includes(key)) {
          acc[key] = existingField[key];
        }
        return acc;
      }, {}),
    };
  });

  console.log("Fields re-divided for new farm location:", {
    numberOfFields: preservedFieldsData.length,
    preservedData: preservedFieldsInfo.map(f => ({ id: f.id, name: f.name, crop_id: f.crop_id })),
  });

  return {
    fieldsData: {
      type: "FeatureCollection",
      features: preservedFieldsData,
    },
    fieldsInfo: preservedFieldsInfo,
  };
};

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