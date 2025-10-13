// dashboardSchema.js
export const dashboardSchema = [
  {
    key: "map",
    component: "Map",
    props: { geoJSON: "farmsGeoJSON" },
    colSpan: 8,
    order: 1,
  },
  {
    key: "weather",
    component: "Weather",
    props: {},
    colSpan: 4,
    order: 2,
  },
  {
    key: "crop",
    component: "CropLifeCycle",
    props: {},
    colSpan: 12,
    order: 3,
  },
];
