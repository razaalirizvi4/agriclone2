// dashboardSchema.js
export const dashboardSchema = [
  {
    key: "map",
    component: "Map",
    props: {
      componentName:"Map",
      locations: (d) => {
        return d.dloc;
      },
      // (d) => {
      //   return d.dloc.filter((lc) => lc.type === "field");
      // },
    },
    colSpan: 8,
    order: 1,
  },
  {
    key: "weather",
    component: "Weather",
    props: {
      componentName:"Weather Details",
      weather: (d, selectedFieldId) => {
        let found = d.dloc.find((loc) => loc._id === selectedFieldId);
        // return d.dloc[0] && d.dloc[0].weather;
        return found && found.weather;
      },
    }, // Pass the data source key
    colSpan: 4,
    order: 2,
  },

  {
    key: "timeline",
    component: "Timeline",
    props: {
      componentName: "Event Time Line",
      events: (d, selectedFieldId) => {
        let foundevents = d.dEv.filter(
          (event) => event?.RelationIds?.Field_id === selectedFieldId
        );
        return foundevents.map((event) => ({
          date: event.Date,
          icon: event.Meta_Data.icon,
          details: event.Meta_Data.details,
          name: event.Meta_Data.name,
          color: event.Meta_Data.color,
          State: event.State, // Add State field for timeline circle colors
        }));
      },
    },
    colSpan: 8,
    order: 3,
  },
  {
    key: "crop",
    component: "Crop",
    props: {
      componentName:"Crop Details",
      crop: (d, selectedFieldId) => {
        let locfound = d.dloc.find((loc) => loc._id === selectedFieldId);

        let cropfound = d.crops.find(
          (crop) => crop._id === locfound?.attributes?.crop_id
        );

        return cropfound;
      },
    }, // refers to your mock data from dataSources.js
    colSpan: 4, // width — adjust as needed
    order: 4, // controls vertical placement — higher number = lower position
  },
];
