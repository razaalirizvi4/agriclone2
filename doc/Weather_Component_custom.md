# Custom Weather Component Implementation Plan

This document outlines the plan to fetch real field data from the database, display it on the map, and update the weather component based on the selected field.

## 1. Backend Changes (Completed)

The backend has been updated to support fetching field data.

## 2. Frontend Changes (Initial Setup Completed)

The initial frontend setup, including the location service, Redux slice, and root reducer, is complete.

### Now, I will implement the remaining frontend changes:

### 2.4. Map Component (`client/src/components/View/Map.jsx`)

-   Dispatch the `getFields` action when the component mounts to fetch the field data.
-   Use the `fields` from the Redux store to display markers on the map.
-   When a marker is clicked, dispatch the `setSelectedField` action to update the selected field in the Redux store.

### 2.5. Weather Component (`client/src/components/View/Weather.jsx`)

-   Get the `selectedField` from the Redux store.
-   If a field is selected, display its weather data. Otherwise, show a default message.

### 2.6. `useWeatherViewModel.js`

-   Update the view model to take the `selectedField` as a prop and extract the weather data from it.

This plan will replace the mock data with data from the database and enable dynamic weather updates based on user interaction with the map.

### 3. Highlighting Selected Field on Map

-   **Objective:** When the map initializes, the currently selected field should be highlighted with a distinct style, such as a darker shade or a prominent border, to draw the user's attention.

-   **Implementation Steps:**

    1.  **CSS for Highlighting:**
        -   Create or update a CSS file for the `Map` component (`client/src/components/View/Map.css`).
        -   Define a new CSS class, for example, `.selected-field`, that applies the desired highlighting style (e.g., a different fill color, opacity, or a border).

    2.  **Update Map Component (`client/src/components/View/Map.jsx`):**
        -   In the `Map` component, get the `selectedField` from the Redux store.
        -   When rendering the fields (polygons) on the map, check if the current field matches the `selectedField`.
        -   If it matches, apply the `.selected-field` CSS class to that specific polygon. This can be done by conditionally adding the class name to the polygon element.

    3.  **Update `Home.jsx` (`client/src/pages/Home.jsx`):**
        -   Ensure that a default field is selected when the `Home` component mounts. This can be done by dispatching the `setSelectedField` action with a default field from the list of fields fetched from the database. This will ensure that a field is highlighted when the map is first loaded.

    4.  **Ensure Visibility:**
        -   The map should automatically adjust its view (zoom and center) to ensure the highlighted field is properly visible. This might involve using a library like Leaflet's `fitBounds` method, passing the coordinates of the selected field's polygon.