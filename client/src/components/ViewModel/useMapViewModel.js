import { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { MAP_CONFIG } from "../../utils/mapConstants";
import { LAYER_IDS } from "../../utils/mapConstants";
import { COLORS } from "../../utils/mapConstants";
import { buildGeoJSON } from "../../utils/mapUtils";
import { calculateMapCenter } from "../../utils/mapUtils";
import { createFarmLayers } from "../../utils/mapLayers";
import { createFieldLayers } from "../../utils/mapLayers";
import { createGeometryLayers } from "../../utils/mapLayers";
import { toast } from "react-toastify";
import { createCircle, createSquare, createTriangle, createCustomPolygon } from "../../utils/shapeUtils";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const FARM_OVERLAY_SOURCE = "farm-boundary-overlay-source";

  // Main Hook
const useMapViewModel = ({
  locations = [],
  crops,
  onFieldSelect,
  selectedFieldId: externalSelectedFieldId,
  mode = null,
  shouldInitialize = true,
  onAreaUpdate,
  validateGeometry = null, // Optional validation callback: (feature) => boolean
  onShapeDrawn = null, // Optional callback when a shape is drawn: (shape) => void
  multiSelectIds = [], // New prop for multi-selection
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const hoverPopupRef = useRef(null);
  const activeLayerRef = useRef(null);
  const drawRef = useRef(null);
  const onAreaUpdateRef = useRef(onAreaUpdate);
  const validateGeometryRef = useRef(validateGeometry);
  const onShapeDrawnRef = useRef(onShapeDrawn);
  const lastValidDrawDataRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFields, setShowFields] = useState(true);
  const [selectedFieldId, setSelectedFieldId] = useState(
    externalSelectedFieldId || null
  );
  const farmsGeoJSON = buildGeoJSON(locations);
  const [drawnData, setDrawnData] = useState(null);
  
  // Shape drawing state
  const [isShapeDrawingMode, setIsShapeDrawingMode] = useState(false);
  const [activeShapeType, setActiveShapeType] = useState(null);
  const [pendingShape, setPendingShape] = useState(null);

  useEffect(() => {
    onAreaUpdateRef.current = onAreaUpdate;
  }, [onAreaUpdate]);

  useEffect(() => {
    validateGeometryRef.current = validateGeometry;
  }, [validateGeometry]);

  useEffect(() => {
    onShapeDrawnRef.current = onShapeDrawn;
  }, [onShapeDrawn]);

  // Sync external selectedFieldId from parent whenever it changes
  useEffect(() => {
    if (externalSelectedFieldId && externalSelectedFieldId !== selectedFieldId) {
      setSelectedFieldId(externalSelectedFieldId);
    }
  }, [externalSelectedFieldId]);

  // SHAPE DRAWING FUNCTIONS
  const enableShapeDrawing = useCallback((shapeType) => {
    setIsShapeDrawingMode(true);
    setActiveShapeType(shapeType);
    
    if (map.current) {
      map.current.getCanvas().style.cursor = 'crosshair';
    }

    // Activate MapboxDraw for polygon
    if (shapeType === 'polygon' && drawRef.current) {
      drawRef.current.changeMode('draw_polygon');
    }
  }, []);

  const disableShapeDrawing = useCallback(() => {
    setIsShapeDrawingMode(false);
    setActiveShapeType(null);
    setPendingShape(null);
    
    if (map.current) {
      map.current.getCanvas().style.cursor = '';
    }
  }, []);

  const handleMapClickForShape = useCallback((e) => {
    if (!isShapeDrawingMode || !activeShapeType) return;

    const center = [e.lngLat.lng, e.lngLat.lat];
    let shape = null;

    try {
      switch (activeShapeType) {
        case 'circle':
          shape = createCircle(center, 50); // 50 meter radius
          break;
        case 'square':
          shape = createSquare(center, 100); // 100 meter side
          break;
        case 'polygon':
          // For polygon, users should use the MapboxDraw control
          return;
        default:
          return;
      }

      if (shape) {
        // Validate that the shape is within farm boundary if validation is provided
        if (validateGeometryRef.current) {
          const isValid = validateGeometryRef.current(shape);
          if (!isValid) {
            toast.error('Land addition must be within the farm boundary. Please try a different location.');
            return;
          }
        }

        // Add the shape to the draw control so it appears on the map
        if (drawRef.current) {
          drawRef.current.add(shape);
        }

        setPendingShape(shape);
        
        // Notify parent component
        if (onShapeDrawnRef.current) {
          onShapeDrawnRef.current(shape);
        }
        
        // Disable drawing mode
        disableShapeDrawing();
      }
    } catch (error) {
      console.error('Error creating shape:', error);
      toast.error('Failed to create shape. Please try again.');
    }
  }, [isShapeDrawingMode, activeShapeType, disableShapeDrawing]);

  const clearPendingShape = useCallback(() => {
    setPendingShape(null);
    // For polygon drawing, we clear the drawn polygon from the draw control
    if (drawRef.current) {
      drawRef.current.deleteAll();
    }
  }, []);

  // MAP INITIALIZATION - SINGLE UNIFIED EFFECT
  useEffect(() => {
    if (!shouldInitialize || map.current || !mapContainer.current) return;

    let center;
    let zoom = MAP_CONFIG.zoom;

    if (mode === "dashboard") {
      if (locations.length) {
        center = calculateMapCenter(farmsGeoJSON);
      }
      if (!center) {
        center = [69.3451, 30.3753];
      }
    } else if (mode === "wizard") {
      const hasLocations = locations?.length > 0;
      center = hasLocations
        ? calculateMapCenter({
            type: "FeatureCollection",
            features: locations,
          })
        : [69.3451, 30.3753];
    } else {
      center = [69.3451, 30.3753];
    }

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAP_CONFIG.style,
        center: center || [69.3451, 30.3753],
        zoom: zoom,
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      map.current.on("load", () => {
        setMapLoaded(true);
        console.log("Map loaded in mode:", mode);
      });
    }

  }, [locations, mode, farmsGeoJSON, shouldInitialize]);

  // Function to set map center (for geocoding)
  const setMapCenter = useCallback((lng, lat, zoom = 14) => {
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: zoom,
        essential: true
      });
    }
  }, []);

  // HOVER POPUP HANDLERS
  const showHoverPopup = useCallback(
    (e, layerId) => {
      const props = e.features[0].properties || {};
      const geom = e.features[0].geometry || {};
      const type = geom.type || props.type || "Unknown";

      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
      }
      activeLayerRef.current = layerId;
      let cropName = null;
      if (props.cropId) {
        const crop = crops.find((c) => c._id === props.cropId);
        cropName = crop?.name || null;
      }
      if (!cropName && props.cropName) {
        cropName = props.cropName;
      }

      let content = `<div style="font-size:13px; line-height:1.4;">`;
      content += `<strong>Type:</strong> ${props.type || type}<br>`;
      if (props.name) content += `<strong>Name:</strong> ${props.name}<br>`;
      if (props.owner) content += `<strong>Owner:</strong> ${props.owner}<br>`;
      if (props.farm) content += `<strong>Farm:</strong> ${props.farm}<br>`;
      if (cropName) content += `<strong>Crop:</strong> ${cropName}<br>`;
      if (props.area) content += `<strong>Size:</strong> ${props.area}<br>`;
      content += "</div>";

      hoverPopupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      })
        .setLngLat(e.lngLat)
        .setHTML(content)
        .addTo(map.current);
    },
    [crops]
  );

  const hideHoverPopup = useCallback((layerId) => {
    if (activeLayerRef.current === layerId) {
      map.current.getCanvas().style.cursor = "";
      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
        hoverPopupRef.current = null;
      }
      activeLayerRef.current = null;
    }
  }, []);

  // EXTRACTED FUNCTION TO SHOW FIELDS AND HIDE FARMS
  const showFieldsAndHideFarms = useCallback(() => {
    if (!map.current) return;

    const mapInstance = map.current;
    const applyVisibility = () => {
      if (!mapInstance.getLayer) return;
      if (mapInstance.getLayer(LAYER_IDS.FARMS)) {
        mapInstance.setLayoutProperty(
          LAYER_IDS.FARMS,
          "visibility",
          "none"
        );
      }
      if (mapInstance.getLayer(LAYER_IDS.FIELDS)) {
        mapInstance.setLayoutProperty(
          LAYER_IDS.FIELDS,
          "visibility",
          "visible"
        );
      }
      setShowFields(true);
    };

    if (!mapInstance.isStyleLoaded()) {
      mapInstance.once("render", applyVisibility);
      return;
    }

    applyVisibility();
  }, []);

  // CLICK HANDLERS
  const handleFarmClick = useCallback((e) => {
    const farmName = e.features[0].properties.name;
    const coords = e.features[0].geometry.coordinates[0];
    const bounds = new mapboxgl.LngLatBounds();
    coords.forEach((c) => bounds.extend(c));
    map.current.fitBounds(bounds, { padding: 20 });

    // Show fields of this farm only
    map.current.setFilter(LAYER_IDS.FIELDS, [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "field"],
      ["==", ["get", "farm"], farmName],
    ]);

    showFieldsAndHideFarms();
  }, [showFieldsAndHideFarms]);

  const handleFieldClick = useCallback(
    (e) => {
      const props = e.features[0].properties;
      const fieldId = props.id;
      const cropId = props.cropId || null;

      setSelectedFieldId(fieldId);
      if (onFieldSelect) onFieldSelect({ fieldId, cropId });
    },
    [onFieldSelect]
  );

  const handleMapClick = useCallback((e) => {
    // Handle shape drawing 
    if (isShapeDrawingMode) {
      if (activeShapeType !== 'polygon') {
         handleMapClickForShape(e);
      }
      // If polygon, mapbox-draw handles it, but we still want to prevent field selection
      return;
    }

    const features = map.current.queryRenderedFeatures(e.point, {
      layers: [LAYER_IDS.FIELDS, LAYER_IDS.FARMS],
    });

    if (!features.length) {
      map.current.setLayoutProperty(LAYER_IDS.FIELDS, "visibility", "none");
      map.current.setLayoutProperty(LAYER_IDS.FARMS, "visibility", "visible");
      setShowFields(false);
    }
  }, [isShapeDrawingMode, activeShapeType, handleMapClickForShape]);

  // LAYER SETUP & UPDATES
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const mapInstance = map.current;

    // Add source for regular data if doesn't exist
    if (!mapInstance.getSource("data") && farmsGeoJSON) {
      mapInstance.addSource("data", { type: "geojson", data: farmsGeoJSON });

      // Add all layers
      [
        ...createFarmLayers(),
        ...createFieldLayers(selectedFieldId),
        ...createGeometryLayers(),
      ].forEach((layer) => {
        if (!mapInstance.getLayer(layer.id)) {
          mapInstance.addLayer(layer);
        }
      });

      // Add click handlers for specific layers (these don't change)
      mapInstance.on("click", LAYER_IDS.FARMS, handleFarmClick);
      mapInstance.on("click", LAYER_IDS.FIELDS, handleFieldClick);

      // Add hover handlers
      [
        LAYER_IDS.FARMS,
        LAYER_IDS.FIELDS,
        LAYER_IDS.ROADS,
        LAYER_IDS.POINTS,
      ].forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.on("mouseenter", layerId, (e) => {
            mapInstance.getCanvas().style.cursor = "pointer";
            showHoverPopup(e, layerId);
          });
          mapInstance.on("mouseleave", layerId, () => hideHoverPopup(layerId));
        }
      });
    }

    // Add temporary shape source and layers for shape drawing (not needed for polygon drawing)
    // Polygon drawing uses the MapboxDraw control which has its own styling

    // Update data source
    if (mapInstance.getSource("data") && farmsGeoJSON) {
      mapInstance.getSource("data").setData(farmsGeoJSON);
    }

    // Update field colors based on selection
    if (mapInstance.getLayer(LAYER_IDS.FIELDS)) {
      mapInstance.setPaintProperty(LAYER_IDS.FIELDS, "fill-color", [
        "case",
        ["any", ["==", ["get", "id"], selectedFieldId], ["in", ["get", "id"], ["literal", multiSelectIds]]],
        COLORS.FIELD_SELECTED,
        COLORS.FIELD_DEFAULT,
      ]);
    }

    if (mapInstance.getLayer(LAYER_IDS.FIELDS_OUTLINE)) {
      mapInstance.setPaintProperty(LAYER_IDS.FIELDS_OUTLINE, "line-color", [
        "case",
        ["any", ["==", ["get", "id"], selectedFieldId], ["in", ["get", "id"], ["literal", multiSelectIds]]],
        COLORS.FIELD_OUTLINE_SELECTED,
        COLORS.FIELD_OUTLINE_DEFAULT,
      ]);
      mapInstance.setPaintProperty(LAYER_IDS.FIELDS_OUTLINE, "line-width", [
        "case",
        ["any", ["==", ["get", "id"], selectedFieldId], ["in", ["get", "id"], ["literal", multiSelectIds]]],
        3,
        1.5,
      ]);
    }

    // Update visibility based on showFields state
    const fieldLayers = [
      LAYER_IDS.FIELDS,
      LAYER_IDS.FIELDS_OUTLINE,
      LAYER_IDS.FIELDS_LABELS,
    ];
    const farmLayers = [
      LAYER_IDS.FARMS,
      LAYER_IDS.FARMS_OUTLINE,
      LAYER_IDS.FARMS_LABELS,
    ];

    fieldLayers.forEach((layerId) => {
      if (mapInstance.getLayer(layerId)) {
        mapInstance.setLayoutProperty(
          layerId,
          "visibility",
          showFields ? "visible" : "none"
        );
      }
    });

    farmLayers.forEach((layerId) => {
      if (mapInstance.getLayer(layerId)) {
        mapInstance.setLayoutProperty(
          layerId,
          "visibility",
          showFields ? "none" : "visible"
        );
      }
    });
  }, [
    mapLoaded,
    farmsGeoJSON,
    selectedFieldId,
    showFields,
    handleFarmClick,
    handleFieldClick,
    showHoverPopup,
    hideHoverPopup,
    mode,
    multiSelectIds,
  ]);

  // Separate effect for general map click handler that needs to be reactive to shape drawing state
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const mapInstance = map.current;

    // Remove existing general click handler
    mapInstance.off("click", handleMapClick);
    
    // Add updated click handler
    mapInstance.on("click", handleMapClick);

    return () => {
      if (mapInstance) {
        mapInstance.off("click", handleMapClick);
      }
    };
  }, [mapLoaded, handleMapClick]);

  // Update drawn data source when drawnData changes
  useEffect(() => {
    if (!mapLoaded || !map.current || mode !== "wizard") return;

    const mapInstance = map.current;
    const drawnSource = mapInstance.getSource("drawn-data");

    if (drawnSource && drawnData) {
      drawnSource.setData(drawnData);
    } else if (drawnSource) {
      // Clear the drawn data
      drawnSource.setData({
        type: "FeatureCollection",
        features: []
      });
    }
  }, [drawnData, mapLoaded, mode]);

// --- MAPBOX DRAW & AREA MEASUREMENT --- (Wizard mode only)
useEffect(() => {
  if (!mapLoaded || !map.current || mode !== "wizard") return;

  // Remove existing draw control if it exists
  if (drawRef.current) {
    map.current.removeControl(drawRef.current);
  }

  // Create draw control with all drawing tools enabled
  const draw = new MapboxDraw({
    displayControlsDefault: false,
    defaultMode: "simple_select",
    controls: {
      polygon: true,
      line_string: true,
      point: true,
      trash: true
    }
  });
  
  map.current.addControl(draw, 'top-left');
  drawRef.current = draw;

  // Add source for drawn data if it doesn't exist
  if (!map.current.getSource('drawn-data')) {
    map.current.addSource('drawn-data', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  // Add layer for drawn polygon fill if it doesn't exist - USE CORRECT LAYER IDS
  if (!map.current.getLayer('drawn-farm-fill')) {
    map.current.addLayer({
      id: 'drawn-farm-fill',
      type: 'fill',
      source: 'drawn-data',
      paint: {
        'fill-color': '#4CAF50',
        'fill-opacity': 0.3
      }
    });
  }

  if (!map.current.getLayer('drawn-farm-outline')) {
    map.current.addLayer({
      id: 'drawn-farm-outline',
      type: 'line',
      source: 'drawn-data',
      paint: {
        'line-color': '#4CAF50',
        'line-width': 2
      }
    });
  }

  const updateArea = () => {
    const data = draw.getAll();
    
    if (data.features.length > 0) {
      // If we have multiple features, we need to reconstruct the MultiPolygon
      if (data.features.length > 1) {
        // Create a MultiPolygon from all the individual polygons
        const coordinates = data.features.map(feature => feature.geometry.coordinates);
        const multiPolygonFeature = {
          type: 'Feature',
          properties: data.features[0].properties || {},
          geometry: {
            type: 'MultiPolygon',
            coordinates: coordinates
          }
        };
        
        // Validate geometry if validation callback is provided
        if (validateGeometryRef.current) {
          const isValid = validateGeometryRef.current(multiPolygonFeature);
          
          if (!isValid) {
            toast.error("Field boundary must stay within the farm boundary. Please adjust the shape.");
            
            // Revert to last valid data if available
            if (lastValidDrawDataRef.current && map.current.getSource('drawn-data')) {
              map.current.getSource('drawn-data').setData(lastValidDrawDataRef.current);
              // Restore the draw control to the last valid state
              if (drawRef.current && lastValidDrawDataRef.current.features.length > 0) {
                drawRef.current.deleteAll();
                lastValidDrawDataRef.current.features.forEach(feature => {
                  drawRef.current.add(feature);
                });
              }
            }
            return;
          }
        }
        
        // Store valid data for future reverts
        lastValidDrawDataRef.current = JSON.parse(JSON.stringify(data));
        
        // Update the drawn data source to show on map
        if (map.current.getSource('drawn-data')) {
          map.current.getSource('drawn-data').setData(data);
        }
        
        // Calculate center coordinates for the MultiPolygon
        const center = turf.center(multiPolygonFeature);
        const centerCoordinates = {
          lat: center.geometry.coordinates[1],
          lng: center.geometry.coordinates[0]
        };

        // Calculate total area in acres
        const areaSqMeters = turf.area(multiPolygonFeature);
        const areaAcres = areaSqMeters / 4046.8564224;
        const rounded = Math.round(areaAcres * 100) / 100;
        const calculatedArea = `${rounded} acres`;
        
        // Call the callback with the MultiPolygon feature
        onAreaUpdateRef.current?.(calculatedArea, centerCoordinates, multiPolygonFeature);
        
        setDrawnData(data);
      } else {
        // Single feature - handle normally
        const feature = data.features[0];
        
        // Validate geometry if validation callback is provided
        if (validateGeometryRef.current) {
          const isValid = validateGeometryRef.current(feature);
          
          if (!isValid) {
            toast.error("Field boundary must stay within the farm boundary. Please adjust the shape.");
            
            // Revert to last valid data if available
            if (lastValidDrawDataRef.current && map.current.getSource('drawn-data')) {
              map.current.getSource('drawn-data').setData(lastValidDrawDataRef.current);
              // Restore the draw control to the last valid state
              if (drawRef.current && lastValidDrawDataRef.current.features.length > 0) {
                drawRef.current.deleteAll();
                lastValidDrawDataRef.current.features.forEach(feature => {
                  drawRef.current.add(feature);
                });
              }
            }
            return;
          }
        }
        
        // Store valid data for future reverts
        lastValidDrawDataRef.current = JSON.parse(JSON.stringify(data));
        
        // Update the drawn data source to show on map
        if (map.current.getSource('drawn-data')) {
          map.current.getSource('drawn-data').setData(data);
        }
        
        // Calculate center coordinates for the feature
        const center = turf.center(feature);
        const centerCoordinates = {
          lat: center.geometry.coordinates[1],
          lng: center.geometry.coordinates[0]
        };

        // Calculate in acres
        const areaSqMeters = turf.area(feature);
        const areaAcres = areaSqMeters / 4046.8564224;
        const rounded = Math.round(areaAcres * 100) / 100;
        const calculatedArea = `${rounded} acres`;
        
        // Call the callback with both area and center coordinates
        onAreaUpdateRef.current?.(calculatedArea, centerCoordinates, feature);
        
        setDrawnData(data);
      }
    } else {
      // Call the callback with null when no area
      onAreaUpdateRef.current?.(null, null, null);
      setDrawnData(null);
      lastValidDrawDataRef.current = null;
    }
  };

  const handleFeatureCreate = (e) => {
    const feature = e.features[0];
    
    // Validate that the feature is within farm boundary if validation is provided
    if (validateGeometryRef.current && feature.geometry.type === 'Polygon') {
      const isValid = validateGeometryRef.current(feature);
      if (!isValid) {
        toast.error('Land addition must be within the farm boundary. Please try a different location.');
        // Remove the invalid feature
        draw.delete(feature.id);
        return;
      }
    }

    // Only handle polygons for field assignment
    if (feature.geometry.type === 'Polygon') {
      setPendingShape(feature);
      
      // Notify parent component
      if (onShapeDrawnRef.current) {
        onShapeDrawnRef.current(feature);
      } else {
        // Regular field drawing mode
        updateArea();
      }
    }
  };

  const handleFeatureDelete = (e) => {
    // When features are deleted, update the area calculation
    updateArea();
  };

  // Add event listeners
  map.current.on("draw.update", updateArea);
  map.current.on("draw.create", handleFeatureCreate);
  map.current.on("draw.delete", handleFeatureDelete);

  return () => {
    if (map.current) {
      map.current.off("draw.update", updateArea);
      map.current.off("draw.create", handleFeatureCreate);
      map.current.off("draw.delete", handleFeatureDelete);
      
      // FIXED: Use the correct layer IDs that were actually added
      if (map.current.getLayer('drawn-farm-fill')) {
        map.current.removeLayer('drawn-farm-fill');
      }
      if (map.current.getLayer('drawn-farm-outline')) {
        map.current.removeLayer('drawn-farm-outline');
      }
      if (map.current.getSource('drawn-data')) {
        map.current.removeSource('drawn-data');
      }
      
      // Remove draw control
      if (drawRef.current) {
        map.current.removeControl(drawRef.current);
        drawRef.current = null;
      }
    }
  };
}, [mapLoaded, mode]);


  // RECENTER FUNCTION
  const handleRecenter = useCallback(() => {
    if (!map.current || !farmsGeoJSON?.features?.length) return;

    const mapInstance = map.current;
    const bounds = new mapboxgl.LngLatBounds();

    farmsGeoJSON.features
      .filter((f) => f.properties?.type === "farm")
      .forEach((f) => {
        const coords = f.geometry?.coordinates?.[0] || [];
        coords.forEach((c) => bounds.extend(c));
      });

    mapInstance.fitBounds(bounds, { padding: 50 });

    // Reset field filter to show none
    if (mapInstance.getLayer(LAYER_IDS.FIELDS)) {
      mapInstance.setFilter(LAYER_IDS.FIELDS, [
        "all",
        ["==", ["geometry-type"], "Polygon"],
        ["==", ["get", "type"], "field"],
        ["==", ["get", "farm"], ""],
      ]);
      mapInstance.setLayoutProperty(LAYER_IDS.FIELDS, "visibility", "none");
    }

    // Show farms
    if (mapInstance.getLayer(LAYER_IDS.FARMS)) {
      mapInstance.setLayoutProperty(LAYER_IDS.FARMS, "visibility", "visible");
    }

    setShowFields(false);
  }, [farmsGeoJSON]);


// Add this function to programmatically set drawn data
const setDrawnDataProgrammatically = useCallback(
  (feature) => {
    if (!feature) {
      setDrawnData(null);
      if (drawRef.current) {
        drawRef.current.deleteAll();
      }
      return;
    }

    const normalizedFeature =
      feature.type === "Feature"
        ? feature
        : feature.type === "FeatureCollection"
        ? feature.features?.[0]
        : null;

    if (!normalizedFeature) return;

    // Handle MultiPolygon by converting to individual polygon features
    if (normalizedFeature.geometry.type === 'MultiPolygon') {
      const polygonFeatures = normalizedFeature.geometry.coordinates.map((coords, index) => ({
        type: 'Feature',
        properties: {
          ...normalizedFeature.properties,
          polygonIndex: index
        },
        geometry: {
          type: 'Polygon',
          coordinates: coords
        }
      }));

      const featureCollection = {
        type: "FeatureCollection",
        features: polygonFeatures,
      };

      setDrawnData(featureCollection);

      if (mode === "wizard" && drawRef.current) {
        drawRef.current.deleteAll();
        polygonFeatures.forEach((polygonFeature) => {
          drawRef.current.add(polygonFeature);
        });
        
        // Store as last valid data
        lastValidDrawDataRef.current = JSON.parse(JSON.stringify(featureCollection));
      }
    } else {
      // Handle single polygon normally
      const featureCollection = {
        type: "FeatureCollection",
        features: [normalizedFeature],
      };

      setDrawnData(featureCollection);

      if (mode === "wizard" && drawRef.current) {
        drawRef.current.deleteAll();
        drawRef.current.add(normalizedFeature);
        
        // Store as last valid data
        lastValidDrawDataRef.current = JSON.parse(JSON.stringify(featureCollection));
        
        // Switch to direct_select mode for immediate editing
        setTimeout(() => {
          const currentFeatures = drawRef.current.getAll()?.features || [];
          const addedFeature = currentFeatures[0];
          if (addedFeature?.id) {
            drawRef.current.changeMode("direct_select", {
              featureId: addedFeature.id,
            });
          }
        }, 100);
      }
    }
  },
  [mode]
);

  const focusOnFeature = useCallback((feature, options = {}) => {
    if (!map.current || !feature?.geometry) return;

    const bounds = new mapboxgl.LngLatBounds();
    const addCoords = (coords) => {
      coords.forEach((coord) => {
        if (Array.isArray(coord[0])) {
          addCoords(coord);
        } else {
          bounds.extend(coord);
        }
      });
    };

    switch (feature.geometry.type) {
      case "Polygon":
        addCoords([feature.geometry.coordinates[0]]);
        break;
      case "MultiPolygon":
        addCoords(feature.geometry.coordinates.map((poly) => poly[0]));
        break;
      case "LineString":
        addCoords([feature.geometry.coordinates]);
        break;
      case "Point":
        bounds.extend(feature.geometry.coordinates);
        break;
      default:
        return;
    }

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 40,
        duration: 800,
        ...options,
      });
    }
  }, []);

  const setFarmBoundaryOverlay = useCallback((feature) => {
    if (!map.current) return;
    const mapInstance = map.current;

    const removeOverlay = () => {
      if (mapInstance.getLayer(LAYER_IDS.FARM_BOUNDARY_OVERLAY)) {
        mapInstance.removeLayer(LAYER_IDS.FARM_BOUNDARY_OVERLAY);
      }
      if (mapInstance.getSource(FARM_OVERLAY_SOURCE)) {
        mapInstance.removeSource(FARM_OVERLAY_SOURCE);
      }
    };

    if (!feature?.geometry) {
      removeOverlay();
      return;
    }

    const overlayData = {
      type: "FeatureCollection",
      features: [feature],
    };

    if (!mapInstance.getSource(FARM_OVERLAY_SOURCE)) {
      mapInstance.addSource(FARM_OVERLAY_SOURCE, {
        type: "geojson",
        data: overlayData,
      });
    } else {
      mapInstance.getSource(FARM_OVERLAY_SOURCE).setData(overlayData);
    }

    if (!mapInstance.getLayer(LAYER_IDS.FARM_BOUNDARY_OVERLAY)) {
      mapInstance.addLayer({
        id: LAYER_IDS.FARM_BOUNDARY_OVERLAY,
        type: "line",
        source: FARM_OVERLAY_SOURCE,
        paint: {
          "line-color": COLORS.FARM_OUTLINE,
          "line-width": 2,
          "line-dasharray": [1.2, 1.2],
          "line-opacity": 0.9,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
      });
    }
  }, []);

  // Disables map interactions while keeping layer clicks intact
  const disableInteractions = useCallback(() => {
    if (!map.current) return;
    const m = map.current;
    if (m.scrollZoom) m.scrollZoom.disable();
    if (m.boxZoom) m.boxZoom.disable();
    if (m.dragPan) m.dragPan.disable();
    if (m.dragRotate) m.dragRotate.disable();
    if (m.keyboard) m.keyboard.disable();
    if (m.doubleClickZoom) m.doubleClickZoom.disable();
    if (m.touchZoomRotate) m.touchZoomRotate.disable();
  }, []);

  return { 
    mapContainer, 
    handleRecenter, 
    showFieldsAndHideFarms, 
    drawnData, 
    mapLoaded, 
    setMapCenter,
    setDrawnDataProgrammatically,
    focusOnFeature,
    setFarmBoundaryOverlay,
    disableInteractions,
    // Shape drawing functions
    enableShapeDrawing,
    disableShapeDrawing,
    isShapeDrawingMode,
    activeShapeType,
    pendingShape,
    clearPendingShape,
    drawRef
  };
};

export default useMapViewModel;