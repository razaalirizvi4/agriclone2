// CONSTANTS
export const MAP_CONFIG = {
  // style: "mapbox://styles/mapbox/streets-v12",
  style: "mapbox://styles/mapbox/satellite-streets-v12",
  zoom: 15,
};

export const LAYER_IDS = {
  FARMS: "farms-layer",
  FARMS_OUTLINE: "farms-outline",
  FARMS_LABELS: "farms-labels",
  FARM_BOUNDARY_OVERLAY: "farm-boundary-overlay",
  FIELDS: "fields-layer",
  FIELDS_OUTLINE: "fields-outline",
  FIELDS_LABELS: "fields-labels",
  EMPTY_SPACES: "empty-spaces-layer",
  EMPTY_SPACES_OUTLINE: "empty-spaces-outline",
  ROADS: "roads-layer",
  POINTS: "points-layer",
};

export const COLORS = {
  FARM_FILL: "#008000",
  FARM_OUTLINE: "#004d00",
  FIELD_SELECTED: "#0047AB",
  FIELD_DEFAULT: "#FFA500",
  FIELD_OUTLINE_SELECTED: "#0000FF",
  FIELD_OUTLINE_DEFAULT: "#CC7000",
  EMPTY_SPACE_FILL: "#FFE5E5",
  EMPTY_SPACE_OUTLINE: "#FF6B6B",
  ROAD: "#444",
  POINT: "#FF0000",
};
