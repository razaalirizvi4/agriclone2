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
        // Get events from eventstreams database filtered by selectedFieldId
        // Normalize both IDs to strings for comparison (handles ObjectId and string types)
        const selectedFieldIdString = String(selectedFieldId);
        const foundevents = d.dEv.filter(
          (event) => {
            const eventFieldId = event?.RelationIds?.Field_id;
            // Compare as strings to handle both ObjectId and string types
            return String(eventFieldId) === selectedFieldIdString;
          }
        );

        // Helper function to get color based on event type
        const getEventColor = (eventName) => {
          const name = String(eventName || '').toLowerCase();
          if (name.includes('land') || name.includes('prep') || name.includes('preparation')) {
            return '#8B4513'; // Brown for land preparation
          }
          if (name.includes('seed') || name.includes('plant') || name.includes('sow')) {
            return '#4CAF50'; // Green for seeding
          }
          if (name.includes('irrigat') || name.includes('water') || name.includes('watering')) {
            return '#2196F3'; // Blue for irrigation
          }
          if (name.includes('fertiliz') || name.includes('nutrient') || name.includes('feed')) {
            return '#FF9800'; // Orange for fertilizer
          }
          if (name.includes('disease') || name.includes('pest') || name.includes('spray')) {
            return '#F44336'; // Red for disease/pest control
          }
          if (name.includes('harvest') || name.includes('pick') || name.includes('collect')) {
            return '#FFC107'; // Yellow/Amber for harvesting
          }
          if (name.includes('weed')) {
            return '#9C27B0'; // Purple for weed control
          }
          return '#60a5fa'; // Default blue
        };

        // Helper function to get icon based on event type
        const getEventIcon = (eventName, metaIcon) => {
          if (metaIcon) return metaIcon;
          const name = String(eventName || '').toLowerCase();
          if (name.includes('land') || name.includes('prep')) return '🌱';
          if (name.includes('seed') || name.includes('plant')) return '🌾';
          if (name.includes('irrigat') || name.includes('water')) return '💧';
          if (name.includes('fertiliz') || name.includes('nutrient')) return '🌿';
          if (name.includes('disease') || name.includes('pest')) return '🐛';
          if (name.includes('harvest')) return '🚜';
          if (name.includes('weed')) return '🌿';
          return '📋';
        };

        // Helper function to get detailed information based on event type
        const getEventDetails = (event, eventName) => {
          // If details exist in Meta_Data, use them
          if (event.Meta_Data?.details) {
            return event.Meta_Data.details;
          }

          const name = String(eventName || '').toLowerCase();
          const duration = event.Meta_Data?.workflowDurationDays || '';
          const sequence = event.Meta_Data?.workflowSequence || '';
          const equipment = event.Meta_Data?.equipmentRequired || [];
          
          // Hardcoded information for common agricultural steps
          if (name.includes('land') || name.includes('prep')) {
            return `Land preparation step ${sequence || ''}. ${duration ? `Duration: ${duration} days.` : ''} ${equipment.length ? `Equipment: ${equipment.map(e => e.name || e).join(', ')}` : ''}`.trim() || 'Prepare the land for planting. Clear debris, till soil, and ensure proper drainage.';
          }
          if (name.includes('seed') || name.includes('plant')) {
            return `Planting step ${sequence || ''}. ${duration ? `Duration: ${duration} days.` : ''} ${equipment.length ? `Equipment: ${equipment.map(e => e.name || e).join(', ')}` : ''}`.trim() || 'Sow seeds at recommended depth and spacing. Ensure proper soil moisture.';
          }
          if (name.includes('irrigat') || name.includes('water')) {
            return `Irrigation step ${sequence || ''}. ${duration ? `Duration: ${duration} days.` : ''} ${equipment.length ? `Equipment: ${equipment.map(e => e.name || e).join(', ')}` : ''}`.trim() || 'Water the crops according to schedule. Monitor soil moisture levels.';
          }
          if (name.includes('fertiliz') || name.includes('nutrient')) {
            return `Fertilization step ${sequence || ''}. ${duration ? `Duration: ${duration} days.` : ''} ${equipment.length ? `Equipment: ${equipment.map(e => e.name || e).join(', ')}` : ''}`.trim() || 'Apply fertilizers to provide essential nutrients. Follow recommended dosage.';
          }
          if (name.includes('disease') || name.includes('pest')) {
            return `Pest/Disease control step ${sequence || ''}. ${duration ? `Duration: ${duration} days.` : ''} ${equipment.length ? `Equipment: ${equipment.map(e => e.name || e).join(', ')}` : ''}`.trim() || 'Monitor and treat for pests and diseases. Apply appropriate treatments.';
          }
          if (name.includes('harvest')) {
            return `Harvesting step ${sequence || ''}. ${duration ? `Duration: ${duration} days.` : ''} ${equipment.length ? `Equipment: ${equipment.map(e => e.name || e).join(', ')}` : ''}`.trim() || 'Harvest crops at optimal maturity. Handle produce carefully to maintain quality.';
          }
          if (name.includes('weed')) {
            return `Weed control step ${sequence || ''}. ${duration ? `Duration: ${duration} days.` : ''} ${equipment.length ? `Equipment: ${equipment.map(e => e.name || e).join(', ')}` : ''}`.trim() || 'Remove weeds to prevent competition for nutrients and water.';
          }
          
          // Default fallback
          return `Step ${sequence || ''}: ${eventName}. ${duration ? `Duration: ${duration} days.` : ''} ${equipment.length ? `Equipment: ${equipment.map(e => e.name || e).join(', ')}` : ''}`.trim() || `Agricultural activity: ${eventName}`;
        };

        return foundevents.map((event) => {
          const eventName = event.Feature_Type;
          const color = event.Meta_Data?.color || getEventColor(eventName);
          const icon = getEventIcon(eventName, event.Meta_Data?.icon);
          const details = getEventDetails(event, eventName);
          
          return {
            date: event.Date,
            icon: icon,
            details: details,
            name: eventName,
            color: color,
            State: event.State,
            // Add additional metadata for enhanced display
            duration: event.Meta_Data?.workflowDurationDays,
            sequence: event.Meta_Data?.workflowSequence,
            equipment: event.Meta_Data?.equipmentRequired || [],
          };
        });
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
        if (!locfound) {
          return null;
        }

        const attrs = locfound.attributes || {};

        // Primary path: existing crop_id + crops collection
        // Normalize both IDs to strings for comparison (handles ObjectId and string types)
        if (attrs.crop_id && Array.isArray(d.crops) && d.crops.length > 0) {
          const cropIdString = String(attrs.crop_id);
          
          const cropfound = d.crops.find(
            (crop) => String(crop._id) === cropIdString
          );
          
          if (cropfound) {
            // Transform crop data to match Crop component expectations
            // Try to get data from the first recipe, or use defaults
            const firstRecipe = cropfound.recipes?.[0];
            const recipeInfo = firstRecipe?.recipeInfo || {};
            const recipeRules = firstRecipe?.recipeRules || {};
            const temporalConstraints = recipeRules.temporalConstraints || {};
            const env = recipeRules.environmentalConditions || {};
            const temp = env.temperature || {};
            const humid = env.humidity || {};
            const expectedYield = recipeInfo.expectedYield || {};
            
            // Build yield string
            const yieldValue = expectedYield.value && expectedYield.unit
              ? `${expectedYield.value} ${expectedYield.unit}`
              : cropfound.actualYield 
                ? `${cropfound.actualYield} kg`
                : "N/A";
            
            // Get date ranges
            const seedDateRangeStart = temporalConstraints.seedDateRangeStart 
              ? new Date(temporalConstraints.seedDateRangeStart).toISOString()
              : new Date().toISOString();
            const harvestDateRangeEnd = temporalConstraints.harvestDateRangeEnd
              ? new Date(temporalConstraints.harvestDateRangeEnd).toISOString()
              : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
            
            return {
              name: cropfound.name || attrs.cropName || "Field Crop",
              icon: cropfound.icon || "🌾",
              yield: yieldValue,
              seedDateRangeStart,
              harvestDateRangeEnd,
              tempRangeStart: typeof temp.min === "number" ? temp.min : 0,
              tempRangeEnd: typeof temp.max === "number" ? temp.max : 0,
              humidRangeStart: typeof humid.min === "number" ? humid.min : 0,
              humidRangeEnd: typeof humid.max === "number" ? humid.max : 0,
            };
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
