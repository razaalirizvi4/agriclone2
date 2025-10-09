// dashboardSchema.js
export const dashboardSchema = [
  {
    key: "map",
    component: "Map",
    props: { geoJSON: "farmsGeoJSON" },
    colSpan: 8,
  },
  {
    key: "weather",
    component: "Weather",
    props: {},
    colSpan: 4,
  },
  {
    key: "crop",
    component: "CropLifeCycle",
    props: {},
    colSpan: 12,
  },
];
