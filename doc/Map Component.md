# Map Component Implementation Steps

This document outlines the steps to create a map component using Mapbox GL JS within a React application, following the Model-View-ViewModel (MVVM) architecture.

## 1. Prerequisites & Installation

- **Mapbox Account:** A Mapbox account is required to obtain an access token.
- **Installation:** Install the Mapbox GL JS library.
  ```bash
  npm install mapbox-gl
  ```

## 2. Project Structure (MVVM)

We will structure the component into three main parts:

- **View (`Map.jsx`):** The React component responsible for rendering the map container and handling user interactions. It will be a presentational component.
- **ViewModel (`useMapViewModel.js`):** A custom React hook that encapsulates the map's logic, state management, and interactions with the Mapbox API.
- **Model (`farms.js`):** The GeoJSON data representing farms and fields. This will be passed as a prop to the main component.

This structure will be located in `client/src/components/`.

```
client/src/components/
├── View/
│   └── Map.jsx
└── ViewModel/
    └── useMapViewModel.js
```

## 3. Model (GeoJSON Data)

The GeoJSON data should be a `FeatureCollection`. Each feature should have a `properties` object that includes a `type` field to distinguish between 'farm' and 'field'. Fields should also have a `farmId` property to link them to a specific farm.

**Example (`client/src/data/farms.js`):**
```javascript
export const geoJsonData = {
  "type": "FeatureCollection",
  "features": [
    // Farm Feature
    {
      "type": "Feature",
      "geometry": { ... },
      "properties": {
        "id": "farm1",
        "name": "Green Acre Farm",
        "type": "farm"
      }
    },
    // Field Features
    {
      "type": "Feature",
      "geometry": { ... },
      "properties": {
        "id": "field1a",
        "name": "North Field",
        "type": "field",
        "farmId": "farm1"
      }
    },
    {
      "type": "Feature",
      "geometry": { ... },
      "properties": {
        "id": "field1b",
        "name": "South Field",
        "type": "field",
        "farmId": "farm1"
      }
    }
  ]
};
```

## 4. ViewModel (`useMapViewModel.js`) Implementation

This hook will manage all map logic.

- **Initialization:**
  - Initialize the Mapbox map instance in a `useEffect` hook.
  - Use `useRef` to store the map container and the map instance itself.

  - Use `useState` to manage the `initialCenter` and `initialZoom` values.

  - Add the built-in `NavigationControl` to the map for user convenience.
- **Data Loading:**
  - In the `map.on('load')` event:
    - Add a single GeoJSON source with the data passed via props.
    - Create a farms layer with the ID `farms-layer`. This layer will be styled with a green fill and filtered to only show features where the type property is `farm`.

  - Create a fields layer with the ID `fields-layer`. This layer will have an orange fill and an initial filter of [`==`, `type`, `none`], making it invisible when the map first loads.

- **Farm Click Interaction:**
  - Attach a `click` event listener to the `farms-layer`.
  - When a farm is clicked, manually calculate the bounding box by iterating through the farm's geometry coordinates.

  - Use `map.fitBounds()` to animate the map to fit the calculated bounding box.

  - Dynamically apply a filter to the `fields-layer` to show only the fields whose farm property matches the name of the clicked farm.

  - Simultaneously, apply a filter to the `farms-layer` to hide the clicked farm.
- **Popup on Hover:**
  - Attach `mouseenter` and `mouseleave` event listeners to both `farms-layer` and `fields-layer`.
  - On `mouseenter`, change the cursor to a pointer. Create a new mapboxgl.Popup, set its content by looping through the feature's properties, and add it to the map.

  - On `mouseleave`, remove the popup and reset the cursor.
- **Recenter Functionality:**
  - A handleRecenter function will be created to reset the map's view.

  - This function will use map.flyTo() to return the map to its initialCenter and initialZoom.

  - It will also reset the filters on both the farms and fields layers to their original state, making all farms visible and all fields hidden.

## 5. View (`Map.jsx`) Implementation

This component is responsible for rendering the map and its UI controls.


- **Props:** It will accept the `geoJsonData` as a prop.
- **ViewModel Hook:**
  -It calls the **useMapViewModel** hook, passing the **geoJSON** data, and receives the **mapContainer** ref and the **handleRecenter** function.
- **Rendering:**
  - It renders a parent **div** with **style={{ position: `relative` }}** to correctly position child elements.

  - The map itself is rendered within a **div** that has a **ref** of **mapContainer** and the **className "map-container"**.

  - A "Recenter" button is rendered, which calls the **handleRecenter** function on click.
- **Styling:** The implementation relies on external CSS to style the **.map-container** and **.recenter-button** classes to define their dimensions and appearance.
## 6. Integration

- Import the `Map` component into a page component (e.g., `HomePage.jsx`).
- Import the `geoJsonData` from the model file.
- Render the `Map` component, passing the `geoJsonData` to it.

```jsx
// Example in a page component
import Map from '../components/View/Map';
import { geoJsonData } from '../data/farms';

function MapPage() {
  return (
    <div>
      <h1>Farms and Fields Map</h1>
      <Map geoJsonData={geoJsonData} />
    </div>
  );
}
```
