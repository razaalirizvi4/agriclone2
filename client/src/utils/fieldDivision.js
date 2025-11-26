// src/utils/fieldDivision.js
import * as turf from "@turf/turf";

export const dividePolygonIntoFields = (farmPolygon, numberOfFields, farmName = "Farm") => {
  if (!farmPolygon || !farmPolygon.features?.[0]) {
    console.error("Invalid farm polygon data");
    return null;
  }
  
  const farmFeature = farmPolygon.features[0];
  
  try {
    const farmBbox = turf.bbox(farmFeature);
    
    // Create grid-based division
    const gridSize = Math.ceil(Math.sqrt(numberOfFields));
    const width = (farmBbox[2] - farmBbox[0]) / gridSize;
    const height = (farmBbox[3] - farmBbox[1]) / gridSize;
    
    const fieldFeatures = [];
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (fieldFeatures.length >= numberOfFields) break;
        
        const minX = farmBbox[0] + col * width;
        const maxX = farmBbox[0] + (col + 1) * width;
        const minY = farmBbox[1] + row * height;
        const maxY = farmBbox[1] + (row + 1) * height;
        
        const gridCell = turf.bboxPolygon([minX, minY, maxX, maxY]);
        
        // Intersect with farm boundary
        try {
          const intersection = turf.intersect(gridCell, farmFeature);
          if (intersection && intersection.geometry) {
            const areaSqMeters = turf.area(intersection);
            const areaAcres = areaSqMeters / 4046.8564224;
            const roundedArea = Math.round(areaAcres * 100) / 100;
            
            // Only add fields with significant area
            if (roundedArea > 0.01) {
              fieldFeatures.push({
                type: "Feature",
                properties: {
                  id: `field-${Date.now()}-${fieldFeatures.length}`,
                  type: "field",
                  name: `Field ${fieldFeatures.length + 1}`,
                  area: `${roundedArea} acres`,
                  farm: farmName
                },
                geometry: intersection.geometry
              });
            }
          }
        } catch (error) {
          console.warn("Could not create field:", error);
        }
      }
    }
    
    return {
      type: "FeatureCollection",
      features: fieldFeatures
    };
  } catch (error) {
    console.error("Error dividing polygon:", error);
    return null;
  }
};