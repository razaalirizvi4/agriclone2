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
    key: "timeline",
    component: "Timeline",
    props: {
      timelineName: "Crop Cycle Timeline",
      events: [
        {
          date: "2023-01-15",
          icon: "https://cdn-icons-png.flaticon.com/512/2163/2163353.png",
          details: "Planted the new batch of wheat seeds for the spring season.",
          name: "Seeding",
          color: "#28a745",
        },
        {
          date: "2023-02-20",
          icon: "https://cdn-icons-png.flaticon.com/512/2163/2163353.png",
          details: "Completed the first irrigation cycle for the new crops.",
          name: "Irrigation",
          color: "#007bff",
        },
        {
          date: "2023-06-10",
          icon: "https://cdn-icons-png.flaticon.com/512/2163/2163353.png",
          details: "Harvested the first batch of wheat. Yield was above average.",
          name: "Harvesting",
          color: "#ffc107",
        },
      ],
    },
    colSpan: 8,
    order: 3,
  },
];
