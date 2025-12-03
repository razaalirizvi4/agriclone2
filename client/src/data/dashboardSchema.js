// dashboardSchema.js
export const dashboardSchema = [
  {
    key: "map",
    component: "Map",
    props: {
      componentName:"Areas/Zones",
      locations: (d) => {
        return d.dloc;
      },
            crops: (d) => {
        return d.crops;
      },
      selectedFieldId: (d) => d.selectedFieldId, // ✅ add this line

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
        const foundevents = d.dEv.filter(
          (event) => event?.RelationIds?.Field_id === selectedFieldId
        );

        if (foundevents.length) {
          return foundevents.map((event) => ({
            date: event.Date,
            icon: event.Meta_Data.icon,
            details: event.Meta_Data.details,
            name: event.Feature_Type,
            color: event.Meta_Data.color,
            State: event.State, // Add State field for timeline circle colors
          }));
        }

        // Fallback for wizard-created fields: derive simple events from selectedRecipe
        const loc = d.dloc.find((l) => l._id === selectedFieldId);
        const workflows =
          loc?.attributes?.selectedRecipe?.recipeWorkflows || [];

        if (!workflows.length) {
          return [];
        }

        const today = new Date();
        return workflows.map((step, idx) => ({
          date: new Date(
            today.getTime() + (idx || 0) * 24 * 60 * 60 * 1000
          ).toISOString(),
          icon: "", // let Timeline ViewModel/asset handle default icon
          details: `${step.stepName || "Task"} • Duration: ${
            step.duration ?? "N/A"
          }`,
          name: step.stepName || `Step ${idx + 1}`,
          color: "#60a5fa",
          State: "Pending",
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
        const locfound = d.dloc.find((loc) => loc._id === selectedFieldId);
        if (!locfound) return null;

        const attrs = locfound.attributes || {};

        // Primary path: existing crop_id + crops collection
        if (attrs.crop_id && Array.isArray(d.crops)) {
          const cropfound = d.crops.find(
            (crop) => crop._id === attrs.crop_id
          );
          if (cropfound) {
            return cropfound;
          }
        }

        // Fallback path for wizard-created fields: build a lightweight crop view
        const selectedRecipe = attrs.selectedRecipe || {};
        const expectedYield = selectedRecipe?.recipeInfo?.expectedYield || {};
        const env = selectedRecipe?.recipeRules?.environmentalConditions || {};

        const temp = env.temperature || {};
        const humid = env.humidity || {};

        const yieldValue =
          expectedYield.value && expectedYield.unit
            ? `${expectedYield.value} ${expectedYield.unit}`
            : "N/A";

        // Use today's date as a neutral placeholder range
        const today = new Date();
        const in90 = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

        return {
          // Fields used by Crop.jsx
          name: attrs.cropName || locfound.name || "Field Crop",
          icon: "🌾",
          yield: yieldValue,
          seedDateRangeStart: today.toISOString(),
          harvestDateRangeEnd: in90.toISOString(),
          tempRangeStart:
            typeof temp.min === "number" ? temp.min : 0,
          tempRangeEnd:
            typeof temp.max === "number" ? temp.max : 0,
          humidRangeStart:
            typeof humid.min === "number" ? humid.min : 0,
          humidRangeEnd:
            typeof humid.max === "number" ? humid.max : 0,
        };
      },
    }, // refers to your mock data from dataSources.js
    colSpan: 4, // width — adjust as needed
    order: 4, // controls vertical placement — higher number = lower position
  },
];
