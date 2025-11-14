# Type API Implementation Plan

This document outlines the implementation plan for the dynamic Type API.

## 1. Type Model
Create a Mongoose schema and model for `Type` based on the provided example schema. This will be located in `backend/api/models/typeModule/type.model.js`.

```javascript
const TypeSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  attributes: [
    {
      key: { type: String, required: true },
      valueType: { type: String, required: true }, // string | number | boolean | geojson | array | object
      required: { type: Boolean, default: false }
    }
  ]
});

module.exports = mongoose.model("Type", TypeSchema);
```

## 2. Type Service
Implement the following functions in `backend/services/type.service.js`:
- `createType(typeData)`: Creates a new type.
- `updateType(id, typeData)`: Updates an existing type.
- `deleteType(id)`: Deletes a type.
- `getTypes(query)`: Retrieves all types, with optional filtering by category.
- `getTypeById(id)`: Retrieves a single type by ID.

## 3. Type Controller
Implement the following controller functions in `backend/api/controllers/typeModule/type.controller.js`:
- `createTypeController(req, res)`: Handles POST /api/types/.
- `getTypesController(req, res)`: Handles GET /api/types/ and GET /api/types?category=farm.
- `getTypeByIdController(req, res)`: Handles GET /api/types/:id.
- `updateTypeController(req, res)`: Handles PUT /api/types/:id.
- `deleteTypeController(req, res)`: Handles DELETE /api/types/:id.

These functions will parse request bodies, validate structures, and call the appropriate TypeService functions.

## 4. Express Routes
Define the API routes in `backend/api/routes/typeModule/type.routes.js`. These routes will be protected by `auth.middleware.js` and `role.middleware.js`.
- `POST /api/types/`
- `GET /api/types/`
- `GET /api/types/:id`
- `PUT /api/types/:id`
- `DELETE /api/types/:id`

These routes will map to the respective controller functions.

## 5. Integration with Farm Wizard (Future Step)
This step will involve modifying the `farmSetup()` function to fetch Type by ID, validate dynamic attributes, and use the Type to dynamically parse request data, passing related stage info to the event generator. This will be addressed after the core Type API is implemented and tested.
