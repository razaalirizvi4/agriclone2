# Crop Management Module Implementation Plan

This document outlines the plan to implement a crop management module.

## 1. Data Model (Mongoose Schema)

A new collection `crops` will be created.

**File:** `backend/api/models/cropModule/crop.model.js`

```javascript
const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Wheat", "Corn"
  variety: { type: String }, // e.g., "Spring Red"
  plantingDate: { type: Date, required: true },
  expectedHarvestDate: { type: Date },
  actualHarvestDate: { type: Date },
  status: {
    type: String,
    enum: ['Planted', 'Growing', 'Harvested', 'Failed'],
    default: 'Planted',
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location', // Assuming 'Location' is the name of your location model
    required: true,
  },
  yield: {
    amount: { type: Number }, // e.g., 1000
    unit: { type: String }, // e.g., "kg", "bushels"
  },
  notes: { type: String },
}, { timestamps: true });

const Crop = mongoose.model('Crop', cropSchema);

module.exports = Crop;
```

## 2. Backend Implementation

### Data Layer

**File:** `backend/api/dataLayer/crop.dataLayer.js`

- `createCrop(cropData)`: Adds a new crop to the database.
- `getCropsByLocation(locationId)`: Retrieves all crops for a specific location.
- `getCropById(cropId)`: Retrieves a single crop by its ID.
- `updateCrop(cropId, updateData)`: Updates a crop's details.
- `deleteCrop(cropId)`: Deletes a crop.

### Service Layer

**File:** `backend/services/crop.service.js`

- `addCrop(data)`: Handles business logic for creating a crop.
- `findCropsByLocation(locationId)`: Handles logic for fetching crops.
- `findCropById(cropId)`: Handles logic for fetching a single crop.
- `updateCropDetails(cropId, data)`: Handles logic for updating a crop.
- `removeCrop(cropId)`: Handles logic for deleting a crop.

### Controller

**File:** `backend/api/controllers/cropModule/crop.controller.js`

- `add(req, res)`: Handles `POST /api/crops`
- `getByLocation(req, res)`: Handles `GET /api/crops/location/:locationId`
- `getById(req, res)`: Handles `GET /api/crops/:cropId`
- `update(req, res)`: Handles `PUT /api/crops/:cropId`
- `remove(req, res)`: Handles `DELETE /api/crops/:cropId`

### Routes

**File:** `backend/api/routes/cropModule/crop.routes.js`

- `POST /`: Create a new crop.
- `GET /location/:locationId`: Get all crops for a location.
- `GET /:cropId`: Get a single crop by ID.
- `PUT /:cropId`: Update a crop.
- `DELETE /:cropId`: Delete a crop.

## 3. Frontend Implementation

### API Service

**File:** `client/src/services/crop.service.js`

- `createCrop(cropData)`
- `fetchCropsByLocation(locationId)`
- `updateCrop(cropId, data)`
- `deleteCrop(cropId)`

### Redux Slice

**File:** `client/src/features/crops/crop.slice.js`

- **State:** `{ crops: [], loading: false, error: null }`
- **Actions:** `fetchCropsStart`, `fetchCropsSuccess`, `fetchCropsFailure`, `addCrop`, `updateCrop`, `removeCrop`.
- **Reducers:** To handle the state updates for these actions.

### Component & ViewModel

**Component File:** `client/src/components/View/Crops.jsx`
**ViewModel File:** `client/src/components/ViewModel/useCropViewModel.js`

- The `Crops` component will display a list of crops in cards or a table.
- It will include buttons for adding, editing, and deleting crops.
- The `useCropViewModel` will manage the component's state, fetch data from the Redux store, and handle user interactions.

### Dashboard Integration

1.  **Component Mapper:** Add the new `Crops` component to `client/src/components/componentMapper.js`.
2.  **Dashboard Schema:** Add an entry for the `Crops` component in `client/src/data/dashboardSchema.js` to make it appear on the dashboard.

```javascript
// client/src/data/dashboardSchema.js (Example Entry)
{
  key: "crops",
  component: "Crops",
  props: { locationId: "some_default_or_selected_location_id" }, // This will need to be dynamic
  colSpan: 12,
  order: 4
}
```

Please review this plan. Once you approve, I will begin the implementation.
