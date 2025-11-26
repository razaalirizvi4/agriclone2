# Setup Wizard Implementation Plan

This document outlines the implementation plan for the Farm and Field Details Setup Wizard, based on the provided prompt.

## 1. Wizard Structure

The wizard Page will consist of two sub pages: Farm Details and Field Management.

### 1.1. First Page: Farm Details

This page will focus on capturing overall farm information and defining its boundaries.

#### UI Components:
*   **Farm Details Form:**
    *  First Take Input fields for:
        *   Farm Name (text input)
        *   Address (text input, find those coordinates to drop pin there)
        <!-- *   Area (numeric input with unit selection, e.g., acres, hectares) -->
    * After form submit, then show Map on right.
*   **Map Section (Mapbox Integration):**
    *   Interactive Mapbox map.
    *   Functionality for users to:
        *   Drag pin point.
        <!-- *   Go to farm's central location. -->
        *   Draw and Edit farm boundaries (polygon drawing tool).
        *   Import GeoJSON files to define Farm boundaries.
        *   Export current Farm boundaries as GeoJSON.
*   
*   **Number of Fields Input:**
    *   Numeric input for the user to specify how many fields they want to divide the farm into. This will determine the initial number of field entities created.

#### Logic:
*   On form submission, validate all inputs.
<!-- *   Perform address verification. -->
*   Store farm details, location, and boundaries in the application's state(parent wizard page state).
*   Generate initial field entities based on the "Number of Fields" input, associating them with the newly created farm ID.

### 1.2. Second Page: Field Management

This page will allow users to manage individual fields within the defined farm.

#### UI Components:
*   **Map Section (Mapbox Integration):**
    *   The Mapbox map will persist from the first page hiding farm layer and showing fields layer only now.
    <!-- *   Overlay showing all fields as distinct polygons. -->
    *   Ability to select a field from map and a table (see below) and highlight it on the map.
    *   Tools to resize or edit the boundaries of the selected field directly on the map.
        * Resize a field, split field, delete field. no new field drawing.
*   **Fields Table Overlay:**
    *   A table displaying a list of all fields belonging to the current farm.
    *   Each row will represent a field and allow selection.
    *   Columns might include Field Name, Area, Crop, etc.


*   **Details Form:**
    * 1st case: Take field info
        - Soil PH
        - Soil Type
        - Field History
        - Show Field Area (automatically for what field is selected)
    * 2nd Case: Take Crop Info
        ->Existing crop:
                        * take crop name.
                        * Stage.
        -> New crop:
                    * Suggestion for crop, take input for crop.
                    



    <!-- *   Form section to manage crop details for the selected field.
    *   Dropdown list of available crops (fetched from `crops` collection in the data model).
    *   When a crop is selected, its `cropId` will be stored in the selected field's object.
    *   Option to specify if it's an "existing crop" or "new crop" (though the prompt implies selection from a predefined list, this might be a future enhancement). -->
<!-- *   **Field Events Section:**
    *   Interface to record various events for the selected field.
    *   Event types: Sowing, Fertilizer Application, Irrigation, Pesticide Spraying, Harvesting, Land Preparation.
    *   Each event entry will include:
        *   Date (date picker).
        *   Details (text input for type and quantity, e.g., "Urea, 50kg"). -->

#### Logic:
*   When a field is selected from the table, its details if existing (boundaries, cropId, events) are loaded into the respective forms otherwise empty form and highlighted on the map
*   Updates to field boundaries on the map will update the field's `boundaries` data.
*   Crop selection will update the `cropId` of the selected field.
*   Adding/editing events will update the `events` array for the selected field.

## 2. Data Model

All farm and field data will be stored as a single structured object, managed within the application's state.

```javascript
{
  entities: [
    {
      id: "farm1",
      name: "Maarij’s Farm",
      parentId: null, // Farms have parentId: null
      area: "120 acres",
      boundaries: { /* GeoJSON object for farm boundaries */ },
      location: { lat: 33.684, lng: 73.047 } // Pinned location
    },
    {
      id: "field1",
      name: "North Field",
      parentId: "farm1", // Fields have parentId equal to their farm’s ID
      cropId: "crop1", // Each field can contain a cropId
      events: [ // And a list of events
        { eventType: "Sowing", date: "2025-01-10", details: "Wheat, 100kg" },
        { eventType: "Irrigation", date: "2025-02-01", details: "Drip irrigation" }
      ],
      boundaries: { /* GeoJSON object for field boundaries */ }
    }
  ],
  crops: [ // A collection of available crops
    { id: "crop1", name: "Wheat" },
    { id: "crop2", name: "Rice" },
    { id: "crop3", name: "Corn" }
  ]
}
```

## 3. Technical Requirements

### 3.1. State Management

*   **State handling from Farm to field page:** A state management solution on wizard parent page will be implemented to handle all farm, field, crop, and event data. Given the project structure.
    *   Wizard Page will have this state for storing data temporarily

### 3.2. Mapbox Integration

*   Utilize the `react-map-gl` library (or similar React wrapper for Mapbox GL JS) for seamless integration.
*   Implement Mapbox GL JS drawing tools (e.g., `@mapbox/mapbox-gl-draw`) for boundary creation and editing.

### 3.3. GeoJSON Import/Export

*   **Import:**
    *   Implement file input components to allow users to upload GeoJSON files.
    *   Parse GeoJSON directly into map layers/data.
*   **Export:**
    *   Convert current farm/field boundary data (stored as GeoJSON) into downloadable GeoJSON files.

### 3.4. Folder Structure

Adhere to a clean, organized folder structure, separating concerns:

<!-- *   **`client/src/features/farmWizard`:**
    *   `farmWizard.slice.js` (Redux slice for state management)
    *   `farmWizard.sagas.js` (if using Redux Saga for async operations) -->
*   **`client/src/components/Wizard`:**
    *   `WizardContainer.jsx` (main wizard component)
    *   `FarmDetailsPage.jsx`
    *   `FieldManagementPage.jsx`
    *   `WizardMapComponent.jsx` (reusable Mapbox component with drawing tools)
    *   `FieldTable.jsx`
    *   `FielInfoForm.jsx`
*   **`client/src/utils/geoUtils.js`:** (for GeoJSON parsing and conversion)
*   **`client/src/services/farmWizard.service.js`:** (for API interactions if data needs to be persisted to a backend)



This plan provides a clear roadmap for implementing the Setup Wizard, ensuring all requirements from the prompt are addressed with a structured and maintainable approach.
