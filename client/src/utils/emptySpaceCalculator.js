import * as turf from "@turf/turf";

/**
 * Calculate empty/uncategorized areas within a farm boundary
 * that are not covered by any field
 *
 * @param {Object} farmFeature - GeoJSON Feature of the farm boundary
 * @param {Array} fieldFeatures - Array of GeoJSON Features representing fields
 * @returns {Object} GeoJSON FeatureCollection of empty space polygons
 */
export const calculateEmptySpaces = (farmFeature, fieldFeatures = []) => {
  if (!farmFeature?.geometry) {
    return turf.featureCollection([]);
  }

  // If no fields, the entire farm is empty space
  if (!fieldFeatures || fieldFeatures.length === 0) {
    return turf.featureCollection([farmFeature]);
  }

  try {
    // Create a union of all field polygons
    let fieldsUnion = null;

    for (const fieldFeature of fieldFeatures) {
      if (!fieldFeature?.geometry) continue;

      const fieldPolygon = turf.feature(fieldFeature.geometry);

      if (!fieldsUnion) {
        fieldsUnion = fieldPolygon;
      } else {
        try {
          fieldsUnion = turf.union(fieldsUnion, fieldPolygon);
        } catch (err) {
          console.warn("Failed to union field:", err);
          // If union fails, try to continue with the next field
          continue;
        }
      }
    }

    // If no valid union was created, return empty collection
    if (!fieldsUnion || !fieldsUnion.geometry) {
      return turf.featureCollection([]);
    }

    // Calculate difference: farm boundary - fields union
    const farmPolygon = turf.feature(farmFeature.geometry);

    try {
      const emptySpaces = turf.difference(farmPolygon, fieldsUnion);

      // Handle MultiPolygon results (multiple empty areas)
      if (emptySpaces?.geometry?.type === "MultiPolygon") {
        const features = emptySpaces.geometry.coordinates.map((coords, index) =>
          turf.polygon(coords, {
            id: `empty-space-${index}`,
            type: "empty-space",
            name: `Uncategorized Area ${index + 1}`,
          })
        );
        return turf.featureCollection(features);
      } else if (emptySpaces?.geometry?.type === "Polygon") {
        // Single empty area
        return turf.featureCollection([
          turf.feature(emptySpaces.geometry, {
            id: "empty-space-0",
            type: "empty-space",
            name: "Uncategorized Area",
          }),
        ]);
      }
    } catch (err) {
      console.warn("Failed to calculate difference:", err);
      return turf.featureCollection([]);
    }
  } catch (err) {
    console.error("Error calculating empty spaces:", err);
    return turf.featureCollection([]);
  }

  return turf.featureCollection([]);
};

/**
 * Calculate the total area of empty spaces in acres
 *
 * @param {Object} emptySpacesCollection - GeoJSON FeatureCollection of empty spaces
 * @returns {number} Total area in acres
 */
export const calculateEmptySpaceArea = (emptySpacesCollection) => {
  if (!emptySpacesCollection?.features?.length) {
    return 0;
  }

  let totalAreaSqMeters = 0;

  for (const feature of emptySpacesCollection.features) {
    if (feature?.geometry) {
      totalAreaSqMeters += turf.area(feature);
    }
  }

  const totalAreaAcres = totalAreaSqMeters / 4046.8564224;
  return Math.round(totalAreaAcres * 100) / 100;
};

/**
 * Calculate area reduction for a field based on initial area
 *
 * @param {string} initialArea - Initial area string (e.g., "10 acres")
 * @param {string} currentArea - Current area string (e.g., "8 acres")
 * @returns {Object} { reduced: boolean, reductionAcres: number, reductionPercent: number }
 */
export const calculateFieldReduction = (initialArea, currentArea) => {
  const parseAcres = (areaStr) => {
    if (!areaStr || typeof areaStr !== "string") return 0;
    const match = areaStr.match(/([\d.]+)\s*acres?/i);
    return match ? parseFloat(match[1]) : 0;
  };

  const initial = parseAcres(initialArea);
  const current = parseAcres(currentArea);

  if (initial === 0)
    return { reduced: false, reductionAcres: 0, reductionPercent: 0 };

  const reductionAcres = initial - current;
  const reductionPercent = (reductionAcres / initial) * 100;

  return {
    reduced: reductionAcres > 0.01, // Consider reduction if more than 0.01 acres
    reductionAcres: Math.round(reductionAcres * 100) / 100,
    reductionPercent: Math.round(reductionPercent * 100) / 100,
  };
};

/**
 * Extract numeric area value from area string
 *
 * @param {string} areaStr - Area string (e.g., "10 acres")
 * @returns {number} Area in acres
 */
export const parseAreaToAcres = (areaStr) => {
  if (!areaStr || typeof areaStr !== "string") return 0;
  const match = areaStr.match(/([\d.]+)\s*acres?/i);
  return match ? parseFloat(match[1]) : 0;
};
