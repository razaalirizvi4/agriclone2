import * as turf from "@turf/turf";

/**
 * Utility functions for creating different geometric shapes
 */

/**
 * Create a circle feature from center point and radius
 * @param {Array} center - [lng, lat] coordinates
 * @param {number} radius - radius in meters
 * @returns {Object} GeoJSON Feature
 */
export const createCircle = (center, radius = 100) => {
  const circle = turf.circle(center, radius, { units: 'meters' });
  return {
    ...circle,
    properties: {
      ...circle.properties,
      shapeType: 'circle',
      radius: radius
    }
  };
};

/**
 * Create a square feature from center point and side length
 * @param {Array} center - [lng, lat] coordinates
 * @param {number} sideLength - side length in meters
 * @returns {Object} GeoJSON Feature
 */
export const createSquare = (center, sideLength = 100) => {
  const halfSide = sideLength / 2;
  
  // Convert meters to degrees (approximate)
  const metersToLat = 1 / 111320;
  const metersToLng = 1 / (111320 * Math.cos(center[1] * Math.PI / 180));
  
  const latOffset = halfSide * metersToLat;
  const lngOffset = halfSide * metersToLng;
  
  const coordinates = [[
    [center[0] - lngOffset, center[1] - latOffset], // bottom-left
    [center[0] + lngOffset, center[1] - latOffset], // bottom-right
    [center[0] + lngOffset, center[1] + latOffset], // top-right
    [center[0] - lngOffset, center[1] + latOffset], // top-left
    [center[0] - lngOffset, center[1] - latOffset]  // close the polygon
  ]];
  
  return {
    type: 'Feature',
    properties: {
      shapeType: 'square',
      sideLength: sideLength
    },
    geometry: {
      type: 'Polygon',
      coordinates: coordinates
    }
  };
};

/**
 * Create a triangle feature from center point and size
 * @param {Array} center - [lng, lat] coordinates
 * @param {number} size - size in meters (distance from center to vertex)
 * @returns {Object} GeoJSON Feature
 */
export const createTriangle = (center, size = 100) => {
  // Convert meters to degrees (approximate)
  const metersToLat = 1 / 111320;
  const metersToLng = 1 / (111320 * Math.cos(center[1] * Math.PI / 180));
  
  const latOffset = size * metersToLat;
  const lngOffset = size * metersToLng;
  
  // Create equilateral triangle
  const height = size * Math.sqrt(3) / 2;
  const heightLat = height * metersToLat;
  
  const coordinates = [[
    [center[0], center[1] + heightLat * 2/3], // top vertex
    [center[0] - lngOffset, center[1] - heightLat * 1/3], // bottom-left
    [center[0] + lngOffset, center[1] - heightLat * 1/3], // bottom-right
    [center[0], center[1] + heightLat * 2/3] // close the polygon
  ]];
  
  return {
    type: 'Feature',
    properties: {
      shapeType: 'triangle',
      size: size
    },
    geometry: {
      type: 'Polygon',
      coordinates: coordinates
    }
  };
};

/**
 * Create a custom polygon feature (for freehand drawing)
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @returns {Object} GeoJSON Feature
 */
export const createCustomPolygon = (coordinates) => {
  // Ensure the polygon is closed
  const coords = [...coordinates];
  if (coords.length > 0 && 
      (coords[0][0] !== coords[coords.length - 1][0] || 
       coords[0][1] !== coords[coords.length - 1][1])) {
    coords.push(coords[0]);
  }
  
  return {
    type: 'Feature',
    properties: {
      shapeType: 'polygon'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [coords]
    }
  };
};

/**
 * Calculate the area of a shape in acres
 * @param {Object} feature - GeoJSON Feature
 * @returns {string} Area in acres with unit
 */
export const calculateShapeArea = (feature) => {
  try {
    const areaSqMeters = turf.area(feature);
    const areaAcres = areaSqMeters / 4046.8564224;
    const rounded = Math.round(areaAcres * 100) / 100;
    return `${rounded} acres`;
  } catch (error) {
    console.error('Error calculating area:', error);
    return '0 acres';
  }
};

/**
 * Get the center point of a shape
 * @param {Object} feature - GeoJSON Feature
 * @returns {Array} [lng, lat] coordinates
 */
export const getShapeCenter = (feature) => {
  try {
    const center = turf.center(feature);
    return center.geometry.coordinates;
  } catch (error) {
    console.error('Error getting center:', error);
    return [0, 0];
  }
};