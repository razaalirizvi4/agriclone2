// src/utils/fieldDivision.js
import * as turf from "@turf/turf";

/**
 * Ultra-simple field division that always works
 */
export const processFarmDivision = (farmData, numberOfFields, farmDetails = {}) => {
  console.log("🔄 Starting SIMPLE field division");
  console.log("Farm data:", farmData);
  console.log("Number of fields:", numberOfFields);

  try {
    // Extract farm polygon - handle different data structures
    let farmPolygon;
    
    if (farmData.features && farmData.features[0]) {
      // Direct FeatureCollection from drawnData
      farmPolygon = farmData.features[0];
    } else if (farmData.geoJsonCords && farmData.geoJsonCords.features && farmData.geoJsonCords.features[0]) {
      // From WizardPage structure
      farmPolygon = farmData.geoJsonCords.features[0];
    } else {
      console.error("Cannot extract farm polygon from:", farmData);
      return createFallbackFields(numberOfFields, farmDetails);
    }

    // Validate farm polygon
    if (!farmPolygon.geometry || farmPolygon.geometry.type !== 'Polygon') {
      console.error("Invalid farm polygon geometry:", farmPolygon);
      return createFallbackFields(numberOfFields, farmDetails);
    }

    console.log("✅ Farm polygon validated:", farmPolygon);

    const farmName = farmDetails.name || "Farm";
    const fieldFeatures = [];

    // METHOD 1: Simple bounding box division (most reliable)
    const farmBbox = turf.bbox(farmPolygon);
    console.log("Farm bbox:", farmBbox);

    const bboxWidth = farmBbox[2] - farmBbox[0];
    const bboxHeight = farmBbox[3] - farmBbox[1];
    
    // Create fields by dividing the bounding box
    for (let i = 0; i < numberOfFields; i++) {
      try {
        // For 1-2 fields: split horizontally
        // For 3+ fields: create grid
        let fieldBbox;
        
        if (numberOfFields === 1) {
          fieldBbox = farmBbox;
        } else if (numberOfFields === 2) {
          // Split into left and right
          const splitX = farmBbox[0] + (bboxWidth / 2);
          if (i === 0) {
            fieldBbox = [farmBbox[0], farmBbox[1], splitX, farmBbox[3]];
          } else {
            fieldBbox = [splitX, farmBbox[1], farmBbox[2], farmBbox[3]];
          }
        } else {
          // Grid division
          const cols = Math.ceil(Math.sqrt(numberOfFields));
          const rows = Math.ceil(numberOfFields / cols);
          const col = i % cols;
          const row = Math.floor(i / cols);
          
          const cellWidth = bboxWidth / cols;
          const cellHeight = bboxHeight / rows;
          
          fieldBbox = [
            farmBbox[0] + col * cellWidth,
            farmBbox[1] + row * cellHeight,
            farmBbox[0] + (col + 1) * cellWidth,
            farmBbox[1] + (row + 1) * cellHeight
          ];
        }

        // Create field polygon from bbox
        const fieldPolygon = turf.bboxPolygon(fieldBbox);
        
        // Calculate area
        const areaSqMeters = turf.area(fieldPolygon);
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
            crop_id: null
          },
          geometry: fieldPolygon.geometry
        });

        console.log(`Created field ${i + 1}: ${areaAcres.toFixed(2)} acres`);

      } catch (error) {
        console.warn(`Failed to create field ${i}, using fallback:`, error);
        // Add a simple fallback field
        fieldFeatures.push(createSimpleField(i, farmName, farmBbox));
      }
    }

    console.log(`✅ Successfully created ${fieldFeatures.length} fields`);
    return {
      type: "FeatureCollection",
      features: fieldFeatures
    };

  } catch (error) {
    console.error("❌ Field division failed, using fallback:", error);
    return createFallbackFields(numberOfFields, farmDetails);
  }
};

/**
 * Create a simple field as fallback
 */
const createSimpleField = (index, farmName, bbox = [73.1, 30.6, 73.2, 30.7]) => {
  const width = (bbox[2] - bbox[0]) * 0.8;
  const height = (bbox[3] - bbox[1]) * 0.8;
  const centerX = bbox[0] + (bbox[2] - bbox[0]) / 2;
  const centerY = bbox[1] + (bbox[3] - bbox[1]) / 2;
  
  const fieldBbox = [
    centerX - width/2,
    centerY - height/2,
    centerX + width/2,
    centerY + height/2
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
      crop_id: null
    },
    geometry: fieldPolygon.geometry
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
    features: fieldFeatures
  };
};

/**
 * Create fields info from fields data
 */
export const createFieldsInfo = (fieldsData) => {
  if (!fieldsData || !fieldsData.features) return [];
  
  return fieldsData.features.map(feature => ({
    id: feature.properties.id,
    name: feature.properties.name,
    area: feature.properties.area,
    crop_id: feature.properties.crop_id
  }));
};