# Crop Data Layer Implementation Plan

This document outlines the plan to create a data layer for the Crop module, separating database logic from the service layer.

## 1. Current Situation

Currently, the `crop.service.js` file contains both business logic and direct database access using the Mongoose `Crop` model. This makes the service tightly coupled to the database implementation.

## 2. Proposed Architecture

A new data layer will be introduced for the Crop module. This will be consistent with other modules like Location and EventStream.

### 2.1. New File: `crop.dataLayer.js`

A new file will be created at `backend/api/dataLayer/crop.dataLayer.js`. This file will be responsible for all direct interactions with the `Crop` collection in the database.

The `crop.dataLayer.js` will export the following functions:

- `createCrop(cropData)`: Creates a new crop document in the database.
- `listCrops(filter)`: Retrieves a list of crop documents based on a filter.
- `getCropById(id)`: Retrieves a single crop document by its ID.
- `updateCropById(id, update)`: Updates a crop document by its ID.
- `deleteCropById(id)`: Deletes a crop document by its ID.

### 2.2. Refactoring `crop.service.js`

The `crop.service.js` file will be refactored to use the new `crop.dataLayer.js`. It will no longer interact directly with the `Crop` model. Instead, it will call the functions from the data layer to perform CRUD operations.

This will decouple the service from the database, making the code cleaner, more modular, and easier to maintain and test.

## 3. Implementation Steps

1.  Create the `backend/api/dataLayer/crop.dataLayer.js` file.
2.  Implement the `createCrop`, `listCrops`, `getCropById`, `updateCropById`, and `deleteCropById` functions in the data layer file. These functions will contain the Mongoose queries.
3.  Update `crop.service.js` to import the functions from `crop.dataLayer.js`.
4.  Refactor the functions in `crop.service.js` to call the corresponding functions in the data layer.
5.  The `Crop` model will no longer be imported in `crop.service.js`.
6.  Update the `crop.controller.js` to ensure it continues to work with the refactored service. (Self-correction: The controller should not need changes if the service interface remains the same).

## 4. Code Snippets

### `backend/api/dataLayer/crop.dataLayer.js` (New File)

```javascript
const Crop = require('../models/cropModule/crop.model');

async function createCrop(input) {
    const crop = await Crop.create(input);
    return crop;
}

async function listCrops(filter = {}) {
    const query = {};

    if (filter.name) {
        query.name = { $regex: filter.name, $options: 'i' };
    }

    if (filter.ids) {
        const idArray = filter.ids.split(',').map(id => id.trim());
        query._id = { $in: idArray };
    }

    return Crop.find(query).sort({ createdAt: -1 });
}

async function getCropById(id) {
    return Crop.findById(id);
}

async function updateCropById(id, update) {
    return Crop.findByIdAndUpdate(id, update, { new: true });
}

async function deleteCropById(id) {
    return Crop.findByIdAndDelete(id);
}

module.exports = {
    createCrop,
    listCrops,
    getCropById,
    updateCropById,
    deleteCropById
};
```

### `backend/services/crop.service.js` (Refactored)

```javascript
const cropDataLayer = require('../api/dataLayer/crop.dataLayer');

async function createCrop(input) {
    return cropDataLayer.createCrop(input);
}

async function listCrops(filter = {}) {
    return cropDataLayer.listCrops(filter);
}

async function getCropById(id) {
    return cropDataLayer.getCropById(id);
}

async function updateCropById(id, update) {
    return cropDataLayer.updateCropById(id, update);
}

async function deleteCropById(id) {
    return cropDataLayer.deleteCropById(id);
}

module.exports = {
    createCrop,
    listCrops,
    getCropById,
    updateCropById,
    deleteCropById
};
```
