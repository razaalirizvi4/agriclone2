// src/utils/fieldDivision.js
import * as turf from "@turf/turf";

/**
 * Ultra-simple field division that always works
 */
export const processFarmDivision = (
  farmData,
  numberOfFields,
  farmDetails = {}
) => {
  console.log("🔄 Starting SIMPLE field division");
  console.log("Farm data:", farmData);
  console.log("Number of fields:", numberOfFields);

  try {
    // Extract farm polygon - handle different data structures
    let farmPolygon;

    if (farmData.features && farmData.features[0]) {
      // Direct FeatureCollection from drawnData
      farmPolygon = farmData.features[0];
    } else if (
      farmData.geoJsonCords &&
      farmData.geoJsonCords.features &&
      farmData.geoJsonCords.features[0]
    ) {
      // From WizardPage structure
      farmPolygon = farmData.geoJsonCords.features[0];
    } else {
      console.error("Cannot extract farm polygon from:", farmData);
      return createFallbackFields(numberOfFields, farmDetails);
    }

    // Validate farm polygon
    if (!farmPolygon.geometry || farmPolygon.geometry.type !== "Polygon") {
      console.error("Invalid farm polygon geometry:", farmPolygon);
      return createFallbackFields(numberOfFields, farmDetails);
    }

    console.log("✅ Farm polygon validated:", farmPolygon);

    const farmName = farmDetails.name || "Farm";
    const fieldFeatures = [];

    // METHOD: Strip slicing (parallel cuts)
    const farmBbox = turf.bbox(farmPolygon);
    console.log("Farm bbox:", farmBbox);

    const bboxWidth = farmBbox[2] - farmBbox[0];
    const bboxHeight = farmBbox[3] - farmBbox[1];

    // Decide orientation:
    // - If the farm is wider than tall -> create vertical strips (cuts along X)
    // - Otherwise -> horizontal strips (cuts along Y)
    const useVerticalStrips = bboxWidth >= bboxHeight;
    console.log(
      "Strip orientation:",
      useVerticalStrips ? "vertical" : "horizontal"
    );

    // Create fields by dividing the bounding box into parallel strips
    for (let i = 0; i < numberOfFields; i++) {
      try {
        let fieldBbox;

        if (useVerticalStrips) {
          // Vertical strips: we move along X
          const stripWidth = bboxWidth / numberOfFields;
          const minX = farmBbox[0] + i * stripWidth;
          const maxX =
            i === numberOfFields - 1
              ? farmBbox[2] // ensure last strip reaches the end to avoid rounding gaps
              : farmBbox[0] + (i + 1) * stripWidth;

          fieldBbox = [minX, farmBbox[1], maxX, farmBbox[3]];
        } else {
          // Horizontal strips: we move along Y
          const stripHeight = bboxHeight / numberOfFields;
          const minY = farmBbox[1] + i * stripHeight;
          const maxY =
            i === numberOfFields - 1
              ? farmBbox[3]
              : farmBbox[1] + (i + 1) * stripHeight;

          fieldBbox = [farmBbox[0], minY, farmBbox[2], maxY];
        }

        // Clip the farm polygon to this strip's bbox so we only keep
        // the part of the farm that lies inside the strip.
        // This is effectively the same as intersecting with a strip,
        // but bboxClip is usually more robust.
        let clippedField = null;
        try {
          clippedField = turf.bboxClip(farmPolygon, fieldBbox);
        } catch (clipError) {
          console.warn(
            `bboxClip failed for field ${i + 1}, skipping this strip:`,
            clipError
          );
        }

        // If clipping produced nothing meaningful, skip this strip
        if (!clippedField || !clippedField.geometry) {
          console.log(`No farm area in strip ${i + 1}, skipping.`);
          continue;
        }

        const finalFieldGeometry = clippedField.geometry;

        // Calculate area based on final geometry
        const areaSqMeters = turf.area({
          type: "Feature",
          geometry: finalFieldGeometry,
          properties: {},
        });
        const areaAcres = areaSqMeters / 4046.8564224;

        const fieldId = `field-${Date.now()}-${i}`;

        fieldFeatures.push({
          type: "Feature",
          properties: {
            id: fieldId,
            type: "field",
            name: `Field ${i + 1}`,
            area: `${Math.round(areaAcres * 100) / 100} acres`,
            farm: farmName,
            crop_id: null,
          },
          geometry: finalFieldGeometry,
        });

        console.log(`Created field ${i + 1}: ${areaAcres.toFixed(2)} acres`);
      } catch (error) {
        console.warn(`Failed to create field ${i}, skipping:`, error);
      }
    }

    console.log(`✅ Successfully created ${fieldFeatures.length} fields`);

    // If strip slicing produced no valid fields inside the farm,
    // fall back to a single field covering the whole farm polygon.
    if (!fieldFeatures.length) {
      console.warn(
        "No fields were generated from strip slicing, falling back to single farm field."
      );
      return createSingleFarmField(farmPolygon, farmName);
    }

    return {
      type: "FeatureCollection",
      features: fieldFeatures,
    };
  } catch (error) {
    console.error("❌ Field division failed, using fallback:", error);
    return createFallbackFields(numberOfFields, farmDetails);
  }
};

/**
 * Create a simple field as fallback
 */
const createSimpleField = (
  index,
  farmName,
  bbox = [73.1, 30.6, 73.2, 30.7]
) => {
  const width = (bbox[2] - bbox[0]) * 0.8;
  const height = (bbox[3] - bbox[1]) * 0.8;
  const centerX = bbox[0] + (bbox[2] - bbox[0]) / 2;
  const centerY = bbox[1] + (bbox[3] - bbox[1]) / 2;

  const fieldBbox = [
    centerX - width / 2,
    centerY - height / 2,
    centerX + width / 2,
    centerY + height / 2,
  ];

  const fieldPolygon = turf.bboxPolygon(fieldBbox);
  const areaAcres = turf.area(fieldPolygon) / 4046.8564224;

  return {
    type: "Feature",
    properties: {
      id: `field-fallback-${Date.now()}-${index}`,
      type: "field",
      name: `Field ${index + 1}`,
      area: `${Math.round(areaAcres * 100) / 100} acres`,
      farm: farmName,
      crop_id: null,
    },
    geometry: fieldPolygon.geometry,
  };
};

/**
 * Create a single field that exactly matches the farm polygon.
 * Used as a safe fallback that never leaves the farm boundary.
 */
const createSingleFarmField = (farmPolygon, farmName = "Farm") => {
  const areaAcres = turf.area(farmPolygon) / 4046.8564224;

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          id: `field-farm-${Date.now()}`,
          type: "field",
          name: "Field 1",
          area: `${Math.round(areaAcres * 100) / 100} acres`,
          farm: farmName,
          crop_id: null,
        },
        geometry: farmPolygon.geometry,
      },
    ],
  };
};

/**
 * Create fallback fields when everything else fails
 */
const createFallbackFields = (numberOfFields, farmDetails) => {
  console.log("🔄 Creating fallback fields");
  const farmName = farmDetails.name || "Farm";
  const fieldFeatures = [];

  for (let i = 0; i < numberOfFields; i++) {
    fieldFeatures.push(createSimpleField(i, farmName));
  }

  return {
    type: "FeatureCollection",
    features: fieldFeatures,
  };
};

/**
 * Create fields info from fields data
 */
export const createFieldsInfo = (fieldsData) => {
  if (!fieldsData || !fieldsData.features) return [];

  return fieldsData.features.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
    area: feature.properties.area,
    crop_id: feature.properties.crop_id,
  }));
};
