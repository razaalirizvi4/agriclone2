# Location Farm Wizard API Implementation

## POST /api/location/farm-wizard/

This API endpoint handles the creation and updating of farm and field location data, along with generating initial lifecycle events for new fields.

### Request Body Structure

The API expects an array of location objects, which can represent either a farm or a field.

```javascript
var locations = [
  {
    // Farm object
    typeId: "<FarmTypeId>",
    name: "Green Valley Farm",
    attributes: {
      geometry: { /* ...GeoJSON... */ },
      area_ha: 25,
      soilType: "Loamy"
    }
  },
  {
    // Field objects (one or multiple)
    typeId: "<FieldTypeId>",
    parentId: "<farm_id or null if new>",
    name: "Field 1",
    attributes: {
      geometry: { /* ...GeoJSON... */ },
      cropType: "Wheat",
      soilType: "Sandy",
      lifecycle: "2025-01-01 to 2025-06-30"
    },
    fieldEventsInfo: {
      // contains related stage info for event generation
      stage: "Sowing",
      expectedYield: 50,
      irrigationFrequency: "Weekly"
    }
  }
];
```

### Controller: `location.controller.js`

A new function `farmWizard` will be added to `location.controller.js` to handle the incoming POST request. This function will extract the `locations` array from the request body and pass it to the `farmSetup` method in `location.service.js`.

```javascript
// In api/controllers/locationModule/location.controller.js

const locationService = require('../../services/location.service');
const { apiResponse } = require('../../../utils/apiResponse');

exports.farmWizard = async (req, res) => {
  try {
    const locations = req.body;
    const result = await locationService.farmSetup(locations);
    return apiResponse.success(res, result, 'Farm setup processed successfully');
  } catch (error) {
    return apiResponse.error(res, error.message, error.statusCode || 500);
  }
};
```

### Service: `location.service.js`

The `farmSetup` method in `location.service.js` will contain the core logic for processing the `locations` array.

```javascript
// In services/location.service.js

const Location = require('../api/models/locationModule/location.model');
const eventStreamService = require('./eventStream.service'); // Assuming this service exists for event generation

exports.farmSetup = async (locations) => {
  const results = [];

  for (const item of locations) {
    if (item.typeId === "<FarmTypeId>") { // Assuming a way to identify a farm
      // Farm object
      if (item._id) {
        // Edit Mode: Update existing Farm
        const updatedFarm = await Location.findByIdAndUpdate(item._id, item, { new: true });
        results.push({ type: 'farm', mode: 'edit', data: updatedFarm });
      } else {
        // Add Mode: Create new Farm
        const newFarm = new Location(item);
        await newFarm.save();
        results.push({ type: 'farm', mode: 'add', data: newFarm });

        // Store farmId for subsequent fields
        item._id = newFarm._id;
      }
    } else if (item.typeId === "<FieldTypeId>") { // Assuming a way to identify a field
      // Field object
      if (item._id) {
        // Edit Mode: Update existing Field
        const updatedField = await Location.findByIdAndUpdate(item._id, item, { new: true });
        results.push({ type: 'field', mode: 'edit', data: updatedField });
      } else {
        // Add Mode: Create new Field
        // Ensure parentId is set from the newly created farm or existing farm
        if (!item.parentId && locations[0] && locations[0]._id) {
          item.parentId = locations[0]._id; // Assuming the first item in the array is the farm
        }

        const newField = new Location(item);
        await newField.save();
        results.push({ type: 'field', mode: 'add', data: newField });

        // Generate lifecycle events for the new field
        if (item.fieldEventsInfo) {
          await eventStreamService.createFieldLifeCycleEvents(newField, item.fieldEventsInfo);
        }
      }
    }
  }
  return results;
};
```

### Helper Function: `createFieldLifeCycleEvents()`

This function will be responsible for generating lifecycle events for a newly created field. It will likely reside in `eventStream.service.js`.

```javascript
// In services/eventStream.service.js (or a new file if more appropriate)

const Event = require('../api/models/eventStream/eventStream.model'); // Assuming an Event model

exports.createFieldLifeCycleEvents = async (field, fieldEventsInfo) => {
  // Example: Generate a 'Sowing' event
  const sowingEvent = new Event({
    locationId: field._id,
    eventType: 'Sowing',
    description: `Sowing of ${field.attributes.cropType} in ${field.name}`,
    eventDate: new Date(), // Or derive from fieldEventsInfo
    details: fieldEventsInfo,
  });
  await sowingEvent.save();

  // Add more events based on fieldEventsInfo (e.g., irrigation, harvesting)
  // This part would involve more complex logic based on the lifecycle and crop type.
  // For now, a basic sowing event is shown.
};
```

### Routes: `location.routes.js`

The new API endpoint will be added to `location.routes.js`.

```javascript
// In api/routes/locationModule/location.routes.js

const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/locationModule/location.controller');
const auth = require('../../middleware/auth.middleware'); // Assuming authentication middleware
const permission = require('../../middleware/permission.middleware'); // Assuming permission middleware

// ... other location routes ...

router.post('/farm-wizard', auth, permission(['admin', 'farmer']), locationController.farmWizard);

module.exports = router;
```
