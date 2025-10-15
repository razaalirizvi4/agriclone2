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
    props: { weather: "weatherData" }, // Pass the data source key
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
    // 🟢 Icon for Seeding (Planting Seed)
    icon: "https://cdn-icons-png.flaticon.com/512/3074/3074366.png", 
    details: "Planted the new batch of wheat seeds for the spring season.",
    name: "Seeding",
    color: "#4CAF50", // A bright, standard Green for planting
  },
  {
    date: "2024-03-20",
    // 🔵 Icon for Nutrient Application (Fertilizer Bag)
    icon: "https://cdn-icons-png.flaticon.com/512/3067/3067822.png", 
    details: "Applied high-nitrogen fertilizer (Urea) to North and West Fields. Monitor soil absorption.",
    name: "Nutrient Application",
    // 🌟 Changed color from green to blue for differentiation
    color: "#2196F3", // A distinct Blue for chemical/nutrient application
  }, 
  {
    date: "2023-02-20",
    // 💧 Icon for Irrigation (Water Drop/Sprinkler)
    icon: "https://cdn-icons-png.flaticon.com/512/2809/2809618.png", 
    details: "Completed the first irrigation cycle for the new crops.",
    name: "Irrigation",
    color: "#17a2b8", // Cyan/Water Blue
  },
  {
    date: "2024-04-05",
    // 🔴 Icon for Pest Control (Bug/Pesticide)
    icon: "https://cdn-icons-png.flaticon.com/512/619/619089.png", 
    details: "Bi-weekly scouting completed. Applied organic insecticide to South Field to manage aphids.",
    name: "Pest Control",
    color: "#dc3545", // Danger Red for caution/critical action
  },
  {
    date: "2023-06-10",
    // 🟡 Icon for Harvesting (Wheat/Scythe)
    icon: "https://cdn-icons-png.flaticon.com/512/476/476127.png", 
    details: "Harvested the first batch of wheat. Yield was above average.",
    name: "Harvesting",
    color: "#ffc107", // Harvest Yellow
  },
      ],
    },
    colSpan: 8,
    order: 3,
  },
];
