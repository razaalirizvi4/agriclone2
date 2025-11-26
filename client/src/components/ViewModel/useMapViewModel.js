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

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// MAIN HOOK
const useMapViewModel = ({
  locations = [],
  crops,
  onFieldSelect,
  selectedFieldId: externalSelectedFieldId,
  mode = null,
  shouldInitialize = true,
  onAreaUpdate
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const hoverPopupRef = useRef(null);
  const activeLayerRef = useRef(null);
  const drawRef = useRef(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFields, setShowFields] = useState(true);
  const [selectedFieldId, setSelectedFieldId] = useState(
    externalSelectedFieldId || null
  );
  const farmsGeoJSON = buildGeoJSON(locations);
  const [drawnData, setDrawnData] = useState(null);

  // Sync external selectedFieldId from parent whenever it changes
  useEffect(() => {
    if (externalSelectedFieldId && externalSelectedFieldId !== selectedFieldId) {
      setSelectedFieldId(externalSelectedFieldId);
    }
  }, [externalSelectedFieldId]);

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

    map.current.setLayoutProperty(LAYER_IDS.FARMS, "visibility", "none");
    map.current.setLayoutProperty(LAYER_IDS.FIELDS, "visibility", "visible");
    setShowFields(true);
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
    const features = map.current.queryRenderedFeatures(e.point, {
      layers: [LAYER_IDS.FIELDS, LAYER_IDS.FARMS],
    });

    if (!features.length) {
      map.current.setLayoutProperty(LAYER_IDS.FIELDS, "visibility", "none");
      map.current.setLayoutProperty(LAYER_IDS.FARMS, "visibility", "visible");
      setShowFields(false);
    }
  }, []);

  // LAYER SETUP & UPDATES
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const mapInstance = map.current;

    // Add source for drawn data in wizard mode
    if (mode === "wizard" && !mapInstance.getSource("drawn-data")) {
      mapInstance.addSource("drawn-data", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: []
        }
      });

      // Add layer for drawn farm boundaries
      if (!mapInstance.getLayer("drawn-farm-fill")) {
        mapInstance.addLayer({
          id: "drawn-farm-fill",
          type: "fill",
          source: "drawn-data",
          paint: {
            "fill-color": "#4CAF50",
            "fill-opacity": 0.5
          }
        });
      }

      if (!mapInstance.getLayer("drawn-farm-outline")) {
        mapInstance.addLayer({
          id: "drawn-farm-outline",
          type: "line",
          source: "drawn-data",
          paint: {
            "line-color": "#2E7D32",
            "line-width": 2
          }
        });
      }
    }

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

      // Add click handlers
      mapInstance.on("click", LAYER_IDS.FARMS, handleFarmClick);
      mapInstance.on("click", LAYER_IDS.FIELDS, handleFieldClick);
      mapInstance.on("click", handleMapClick);

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

    // Update data source
    if (mapInstance.getSource("data") && farmsGeoJSON) {
      mapInstance.getSource("data").setData(farmsGeoJSON);
    }

    // Update field colors based on selection
    if (mapInstance.getLayer(LAYER_IDS.FIELDS)) {
      mapInstance.setPaintProperty(LAYER_IDS.FIELDS, "fill-color", [
        "case",
        ["==", ["get", "id"], selectedFieldId],
        COLORS.FIELD_SELECTED,
        COLORS.FIELD_DEFAULT,
      ]);
    }

    if (mapInstance.getLayer(LAYER_IDS.FIELDS_OUTLINE)) {
      mapInstance.setPaintProperty(LAYER_IDS.FIELDS_OUTLINE, "line-color", [
        "case",
        ["==", ["get", "id"], selectedFieldId],
        COLORS.FIELD_OUTLINE_SELECTED,
        COLORS.FIELD_OUTLINE_DEFAULT,
      ]);
      mapInstance.setPaintProperty(LAYER_IDS.FIELDS_OUTLINE, "line-width", [
        "case",
        ["==", ["get", "id"], selectedFieldId],
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
    handleMapClick,
    showHoverPopup,
    hideHoverPopup,
    mode,
  ]);

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

  // Create draw control with simple_select mode for edit functionality
  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: { 
      polygon: true, 
      trash: true 
    },
    defaultMode: "simple_select", // This enables edit functionality
  });
  
  map.current.addControl(draw);
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

  // Prevent double-click zoom conflict
  map.current.on("dblclick", () => {
    if (draw.getMode && draw.getMode() === "draw_polygon") {
      map.current.doubleClickZoom.disable();
      draw.changeMode("simple_select");
      setTimeout(() => map.current.doubleClickZoom.enable(), 200);
    }
  });

  const updateArea = () => {
    const data = draw.getAll();
    
    // Update the drawn data source to show on map
    if (map.current.getSource('drawn-data')) {
      map.current.getSource('drawn-data').setData(data);
    }
    
    if (data.features.length > 0) {
      const feature = data.features[data.features.length - 1];
      
      // Calculate center coordinates for the farm
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
      if (onAreaUpdate) {
        onAreaUpdate(calculatedArea, centerCoordinates);
      }
      
      setDrawnData(data);
    } else {
      // Call the callback with null when no area
      if (onAreaUpdate) {
        onAreaUpdate(null, null);
      }
      setDrawnData(null);
    }
  };

  // Add event listeners
  map.current.on("draw.create", updateArea);
  map.current.on("draw.delete", updateArea);
  map.current.on("draw.update", updateArea);

  return () => {
    if (map.current) {
      map.current.off("draw.create", updateArea);
      map.current.off("draw.delete", updateArea);
      map.current.off("draw.update", updateArea);
      map.current.off("dblclick");
      
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
}, [mapLoaded, mode, onAreaUpdate]);


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
const setDrawnDataProgrammatically = useCallback((feature) => {
  if (!map.current) return;
  
  const featureCollection = {
    type: "FeatureCollection",
    features: [feature]
  };
  
  setDrawnData(featureCollection);
  
  // Also add to Mapbox Draw if in wizard mode
  if (mode === "wizard" && drawRef.current) {
    drawRef.current.deleteAll();
    drawRef.current.add(featureCollection);
  }
}, [mode]);






  return { 
    mapContainer, 
    handleRecenter, 
    showFieldsAndHideFarms, 
    drawnData, 
    mapLoaded, 
    setMapCenter,
    setDrawnDataProgrammatically
  };
};

export default useMapViewModel;