import { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// CONSTANTS
const MAP_CONFIG = {
  style: "mapbox://styles/mapbox/standard-satellite",
  zoom: 15,
};

const LAYER_IDS = {
  FARMS: "farms-layer",
  FARMS_OUTLINE: "farms-outline",
  FARMS_LABELS: "farms-labels",
  FIELDS: "fields-layer",
  FIELDS_OUTLINE: "fields-outline",
  FIELDS_LABELS: "fields-labels",
  ROADS: "roads-layer",
  POINTS: "points-layer",
};

const COLORS = {
  FARM_FILL: "#008000",
  FARM_OUTLINE: "#004d00",
  FIELD_SELECTED: "#0047AB",
  FIELD_DEFAULT: "#FFA500",
  FIELD_OUTLINE_SELECTED: "#0000FF",
  FIELD_OUTLINE_DEFAULT: "#CC7000",
  ROAD: "#444",
  POINT: "#FF0000",
};

// UTILITY FUNCTIONS
const buildGeoJSON = (locations) => {
  if (!locations?.length) return null;

  const features = locations.map((elem) => ({
    type: "Feature",
    properties: {
      type: elem?.type?.toLowerCase(),
      name: elem?.name,
      id: elem?._id,
      owner: elem?.owner?.name,
      cropId:
        elem?.type?.toLowerCase() === "field"
          ? elem?.attributes?.crop_id
          : null,
      area: elem?.attributes?.area || null,
      farm:
        elem?.type?.toLowerCase() === "field"
          ? locations.find((l) => l._id === elem.parentId)?.name
          : elem?.name,
    },
    geometry: elem?.attributes?.geoJsonCords?.features?.[0]?.geometry,
  }));

  return { type: "FeatureCollection", features };
};

const calculateGeometryCenter = (geometry) => {
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

const calculateMapCenter = (geoJSON, selectedFieldId = null) => {
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

// LAYER DEFINITIONS
const createFarmLayers = () => [
  {
    id: LAYER_IDS.FARMS,
    type: "fill",
    source: "data",
    paint: { "fill-color": COLORS.FARM_FILL, "fill-opacity": 0.5 },
    filter: [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "farm"],
    ],
    layout: { visibility: "none" },
  },
  {
    id: LAYER_IDS.FARMS_OUTLINE,
    type: "line",
    source: "data",
    paint: { "line-color": COLORS.FARM_OUTLINE, "line-width": 2 },
    filter: [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "farm"],
    ],
    layout: { visibility: "none" },
  },
  {
    id: LAYER_IDS.FARMS_LABELS,
    type: "symbol",
    source: "data",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 14,
      "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
      "text-offset": [0, 0],
      "text-anchor": "center",
      "text-allow-overlap": true,
      "symbol-placement": "point",
      visibility: "visible",
    },
    paint: {
      "text-color": "#FFFFFF",
      "text-halo-color": COLORS.FARM_OUTLINE,
      "text-halo-width": 3,
      "text-halo-blur": 0.5,
    },
    filter: [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "farm"],
    ],
  },
];

const createFieldLayers = (selectedFieldId) => [
  {
    id: LAYER_IDS.FIELDS,
    type: "fill",
    source: "data",
    paint: {
      "fill-color": [
        "case",
        ["==", ["get", "id"], selectedFieldId],
        COLORS.FIELD_SELECTED,
        COLORS.FIELD_DEFAULT,
      ],
      "fill-opacity": 0.6,
    },
    filter: [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "field"],
    ],
    layout: { visibility: "visible" },
  },
  {
    id: LAYER_IDS.FIELDS_OUTLINE,
    type: "line",
    source: "data",
    paint: {
      "line-color": [
        "case",
        ["==", ["get", "id"], selectedFieldId],
        COLORS.FIELD_OUTLINE_SELECTED,
        COLORS.FIELD_OUTLINE_DEFAULT,
      ],
      "line-width": ["case", ["==", ["get", "id"], selectedFieldId], 3, 1.5],
    },
    filter: [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "field"],
    ],
    layout: { visibility: "visible" },
  },
  {
    id: LAYER_IDS.FIELDS_LABELS,
    type: "symbol",
    source: "data",
    layout: {
      "text-field": ["get", "name"],
      "text-size": 13,
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-offset": [0, 0],
      "text-anchor": "center",
      "text-allow-overlap": true,
      visibility: "visible",
    },
    paint: {
      "text-color": "#FFFFFF",
      "text-halo-color": "#000000",
      "text-halo-width": 1.5,
    },
    filter: [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "field"],
    ],
  },
];

const createGeometryLayers = () => [
  {
    id: LAYER_IDS.ROADS,
    type: "line",
    source: "data",
    paint: { "line-color": COLORS.ROAD, "line-width": 3 },
    filter: ["==", ["geometry-type"], "LineString"],
  },
  {
    id: LAYER_IDS.POINTS,
    type: "circle",
    source: "data",
    paint: {
      "circle-radius": 6,
      "circle-color": COLORS.POINT,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
    filter: ["==", ["geometry-type"], "Point"],
  },
];

// MAIN HOOK
const useMapViewModel = ({
  locations = [],
  crops,
  onFieldSelect,
  selectedFieldId: externalSelectedFieldId,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const hoverPopupRef = useRef(null);
  const activeLayerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFields, setShowFields] = useState(true);
  const [selectedFieldId, setSelectedFieldId] = useState(
    externalSelectedFieldId || null
  );

  // Sync external selectedFieldId from parent whenever it changes
  useEffect(() => {
    if (
      externalSelectedFieldId &&
      externalSelectedFieldId !== selectedFieldId
    ) {
      setSelectedFieldId(externalSelectedFieldId);
    }
  }, [externalSelectedFieldId]);

  const farmsGeoJSON = buildGeoJSON(locations);

  // MAP INITIALIZATION
  useEffect(() => {
    if (!locations.length || map.current) return;
    const center = calculateMapCenter(farmsGeoJSON);
    if (!center) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center,
      zoom: MAP_CONFIG.zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.on("load", () => setMapLoaded(true));
  }, [locations]);

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

    map.current.setLayoutProperty(LAYER_IDS.FARMS, "visibility", "none");
    map.current.setLayoutProperty(LAYER_IDS.FIELDS, "visibility", "visible");
    setShowFields(true);
  }, []);

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
    console.log(farmsGeoJSON);

    if (!mapLoaded || !map.current || !farmsGeoJSON) return;

    const mapInstance = map.current;

    // Add source if doesn't exist
    if (!mapInstance.getSource("data")) {
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
    if (mapInstance.getSource("data")) {
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
  ]);

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

  return { mapContainer, handleRecenter };
};

export default useMapViewModel;
