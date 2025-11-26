import * as turf from "@turf/turf";

/**
 * Splits a farm polygon into a specified number of smaller field polygons.
 * This function divides the bounding box of the farm into equal parts and
 * calculates the intersection of each part with the farm polygon.
 *
 * @param {object} farmFeature - The GeoJSON feature of the farm (must be a Polygon or MultiPolygon).
 * @param {number} numFields - The number of fields to divide the farm into.
 * @returns {object} A GeoJSON FeatureCollection of the resulting field polygons.
 */
export const splitFarmIntoFields = (farmFeature, numFields) => {
  if (
    !farmFeature ||
    !farmFeature.geometry ||
    (farmFeature.geometry.type !== "Polygon" &&
      farmFeature.geometry.type !== "MultiPolygon")
  ) {
    console.error("Invalid farm feature provided.");
    return turf.featureCollection([]);
  }

  if (numFields <= 1) {
    return turf.featureCollection([farmFeature]);
  }

  const bbox = turf.bbox(farmFeature);
  const [minX, minY, maxX, maxY] = bbox;

  const width = maxX - minX;
  const height = maxY - minY;

  const fields = [];
  const isHorizontalSplit = width > height;

  for (let i = 0; i < numFields; i++) {
    let slicer;
    if (isHorizontalSplit) {
      // Vertical slices
      const sliceWidth = width / numFields;
      const x1 = minX + i * sliceWidth;
      const x2 = minX + (i + 1) * sliceWidth;
      slicer = turf.bboxPolygon([x1, minY, x2, maxY]);
    } else {
      // Horizontal slices
      const sliceHeight = height / numFields;
      const y1 = minY + i * sliceHeight;
      const y2 = minY + (i + 1) * sliceHeight;
      slicer = turf.bboxPolygon([minX, y1, maxX, y2]);
    }

    const intersection = turf.intersect(farmFeature, slicer);

    if (intersection) {
      // Assign properties to the new field
      intersection.properties = {
        ...farmFeature.properties,
        id: `${farmFeature.properties?.id || "field"}_${i}`,
        type: "field",
        farm: farmFeature.properties?.name || "new_farm",
      };
      fields.push(intersection);
    }
  }

  return turf.featureCollection(fields);
};
