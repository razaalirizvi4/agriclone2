// dashboardSchema.js
export const dashboardSchema = [
  {
    key: "map",
    component: "Map",
    props: {
      geoJSON: (d) => {
        return d.dloc.filter((lc) => lc.type === "field");
      },
    },
    colSpan: 8,
    order: 1,
  },
  {
    key: "weather",
    component: "Weather",
    props: {
      weather: (d) => {
        return d.dloc[0] && d.dloc[0].weather;
      },
    }, // Pass the data source key
    colSpan: 4,
    order: 2,
  },

  {
    key: "timeline",
    component: "Timeline",
    props: {
      timelineName: "Event Time Line",
      events: (d) => {
        return d.dEv.map((event) => ({
          date: event.Date,
          icon: event.Meta_Data.icon,
          details: event.Meta_Data.details,
          name: event.Meta_Data.name,
          color: event.Meta_Data.color,
        }));
      },
    },
    colSpan: 8,
    order: 3,
  },
  {
    key: "crop",
    component: "Crop",
    props: { crop: "crop" }, // refers to your mock data from dataSources.js
    colSpan: 4, // width — adjust as needed
    order: 4, // controls vertical placement — higher number = lower position
  },
];
