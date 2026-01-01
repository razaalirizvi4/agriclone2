/**
 * WKT (Well-Known Text) <-> GeoJSON Conversion Utilities
 * Supports: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon
 */

// Helper: Parse a coordinate pair "x y" into [x, y]
const parseCoord = (str) => {
  const parts = str.trim().split(/\s+/);
  return parts.map(parseFloat);
};

// Helper: Parse a list of coordinates "x y, x y, ..." into [[x, y], [x, y], ...]
const parseCoordList = (str) => {
  return str.split(',').map(parseCoord);
};

// Helper: Parse a list of coordinate lists (rings) "(x y, ...), (x y, ...)"
const parseRingList = (str) => {
  // Split by closing parenthesis followed by comma and opening parenthesis
  // This regex approach handles simple cases. For robust nested parsing, a tokenizer is better,
  // but for standard WKT this split works for single depth nesting of rings.
  // Actually, a better way is to strip outer parens and use a regex to find (...) groups.
  const rings = [];
  const regex = /\(([^()]+)\)/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    rings.push(parseCoordList(match[1]));
  }
  return rings;
};

// Helper: Parse MultiPolygon contents "((...)), ((...))"
const parseMultiPolygon = (str) => {
  // This is tricky with regex. We need to split by "), (" but handle the nesting.
  // A simple state machine or finding split points is safer.
  const polygons = [];
  let depth = 0;
  let start = 0;
  
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    
    // We are at the comma between polygons if depth returns to 0 (conceptually, though strictly it might be 1 depending on outer parens)
    // In WKT: MULTIPOLYGON(((...)), ((...)))
    // Inner content is ((...)), ((...))
    // So we split on ',' where depth is 0 relative to the list.
    
    if (str[i] === ',' && depth === 0) {
      polygons.push(parseRingList(str.substring(start, i).trim()));
      start = i + 1;
    }
  }
  polygons.push(parseRingList(str.substring(start).trim()));
  return polygons;
};

/**
 * Converts a WKT string to a GeoJSON Geometry object
 * @param {string} wkt - The WKT string (e.g., "POINT(30 10)")
 * @returns {object|null} GeoJSON Geometry object or null if invalid
 */
export const wktToGeoJSON = (wkt) => {
  if (!wkt) return null;
  
  // Normalize: trim and uppercase type
  const cleanWkt = wkt.trim();
  const typeMatch = cleanWkt.match(/^([A-Z]+)\s*\((.*)\)$/i);
  
  if (!typeMatch) return null;
  
  const type = typeMatch[1].toUpperCase();
  const content = typeMatch[2];
  
  switch (type) {
    case 'POINT':
      return {
        type: 'Point',
        coordinates: parseCoord(content)
      };
      
    case 'LINESTRING':
      return {
        type: 'LineString',
        coordinates: parseCoordList(content)
      };
      
    case 'POLYGON':
      return {
        type: 'Polygon',
        coordinates: parseRingList(content)
      };
      
    case 'MULTIPOINT':
      // Handle both MULTIPOINT(10 10, 20 20) and MULTIPOINT((10 10), (20 20))
      const cleanedContent = content.replace(/\(/g, '').replace(/\)/g, '');
      return {
        type: 'MultiPoint',
        coordinates: parseCoordList(cleanedContent)
      };
      
    case 'MULTILINESTRING':
      return {
        type: 'MultiLineString',
        coordinates: parseRingList(content) // Structure is similar to Polygon rings
      };
      
    case 'MULTIPOLYGON':
      return {
        type: 'MultiPolygon',
        coordinates: parseMultiPolygon(content)
      };
      
    default:
      console.warn(`Unsupported WKT type: ${type}`);
      return null;
  }
};

/**
 * Converts a GeoJSON Geometry object to a WKT string
 * @param {object} geometry - GeoJSON Geometry (Point, Polygon, etc.)
 * @returns {string} WKT string
 */
export const geoJSONToWkt = (geometry) => {
  if (!geometry || !geometry.type || !geometry.coordinates) return '';
  
  const coords = geometry.coordinates;
  
  const formatPoint = (c) => `${c[0]} ${c[1]}`;
  const formatRing = (r) => `(${r.map(formatPoint).join(', ')})`;
  const formatPolys = (p) => `(${p.map(formatRing).join(', ')})`;
  
  switch (geometry.type) {
    case 'Point':
      return `POINT (${formatPoint(coords)})`;
      
    case 'LineString':
      return `LINESTRING (${coords.map(formatPoint).join(', ')})`;
      
    case 'Polygon':
      return `POLYGON (${coords.map(r => r.map(formatPoint).join(', ')).map(s => `(${s})`).join(', ')})`;
      
    case 'MultiPoint':
      return `MULTIPOINT (${coords.map(formatPoint).join(', ')})`;
      
    case 'MultiLineString':
      return `MULTILINESTRING (${coords.map(r => `(${r.map(formatPoint).join(', ')})`).join(', ')})`;
      
    case 'MultiPolygon':
      // coords is [[[x,y],...], [[x,y],...]]
      // structure: MULTIPOLYGON (((x y, ...)), ((x y, ...)))
      return `MULTIPOLYGON (${coords.map(poly => 
        `(${poly.map(ring => 
          `(${ring.map(formatPoint).join(', ')})`
        ).join(', ')})`
      ).join(', ')})`;
      
    default:
      console.warn(`Unsupported GeoJSON type: ${geometry.type}`);
      return '';
  }
};
