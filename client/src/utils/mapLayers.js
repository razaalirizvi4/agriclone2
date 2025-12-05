import { LAYER_IDS, COLORS } from "./mapConstants";

// LAYER DEFINITIONS
export const createFarmLayers = () => [
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

export const createFieldLayers = (selectedFieldId) => [
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

export const createEmptySpaceLayers = () => [
  {
    id: LAYER_IDS.EMPTY_SPACES,
    type: "fill",
    source: "empty-spaces-data",
    paint: {
      "fill-color": COLORS.EMPTY_SPACE_FILL,
      "fill-opacity": 0.4,
    },
    layout: { visibility: "visible" },
  },
  {
    id: LAYER_IDS.EMPTY_SPACES_OUTLINE,
    type: "line",
    source: "empty-spaces-data",
    paint: {
      "line-color": COLORS.EMPTY_SPACE_OUTLINE,
      "line-width": 2,
      "line-dasharray": [2, 2],
    },
    layout: { visibility: "visible" },
  },
];

export const createGeometryLayers = () => [
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
