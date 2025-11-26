# useMapViewModel Hook Refactor for Multi-Mode Map Interaction

This document outlines the implementation plan for refactoring the `useMapViewModel` hook to support multiple map interaction modes: `dashboard` and `wizard`.

## 1. Overview of Changes

The primary goal is to extend the `useMapViewModel` hook to handle not just displaying farm/field data, but also to provide tools for creating and editing farm and field geometries directly on the map. This will be accomplished by introducing a `mode` prop that can be one of `"dashboard"` or `"wizard"`.

-   **`dashboard` mode:** No changes to the existing functionality. The map will display farms and fields with hover popups and click interactions, exactly as it is currently doing. client\src\components\View\Map.jsx
-   **`wizard` mode:** This map (client\src\components\View\MapWizard.jsx) will provide a drawing tool to draw, edit, and delete farm polygons. It will also calculate and display the area of the drawn polygon. After a farm is drawn and the user proceeds (e.g., by pressing a "next" button), the farm layer will be hidden, and a fields layer will be displayed, allowing the user to draw and edit fields within the boundaries of the previously defined farm.

## 2. State and Ref Management

To manage the drawing functionality, we will introduce the following:

-   **`drawRef`:** A `useRef` to hold the instance of the `MapboxDraw` control. This will allow us to interact with the draw control programmatically.
-   **`drawnData`:** A `useState` variable to store the GeoJSON `FeatureCollection` of the features drawn on the map.
-   **`area`:** A `useState` variable to store the calculated area of the drawn polygon(s).

```javascript
const drawRef = useRef(null);
const [drawnData, setDrawnData] = useState(null);
const [area, setArea] = useState(null);
```

## 3. Map Initialization and Mode Handling

The main map initialization `useEffect` will be updated to handle all three modes.

-   The `useEffect` will now run when `mode` is `"dashboard"` or `"wizard"`.

```javascript
//  Map Initialization for all modes
useEffect(() => {
    // This will run for both modes to setup the basic map
    if (map.current) return;

    map.current = new mapboxgl.Map({ ... });

    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.on("load", () => setMapLoaded(true));

}, [mode]); // Simplified dependency array


// Initialize Draw Tool based on mode
useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (mode === "wizard") {
        initializeDrawTool(mode);
    }

    // Cleanup function to remove draw control
    return () => {
        if (drawRef.current) {
            map.current.removeControl(drawRef.current);
            drawRef.current = null;
        }
    };
}, [mapLoaded, mode]);
```

## 4. Drawing Functionality

### `initializeDrawTool(mode)`

This function will be responsible for setting up the `MapboxDraw` control.

-   It will create a new `MapboxDraw` instance with polygon and trash controls.
-   The instance will be stored in `drawRef.current`.
-   The draw control will be added to the map.
-   Event listeners for `draw.create`, `draw.update`, and `draw.delete` will be added to the map. These listeners will call `updateDrawnData`.

### `updateDrawnData(mode)`

This function will be responsible for updating the state when the user draws on the map. It will be wrapped in `useCallback`.

-   It will get all drawn features using `drawRef.current.getAll()`.
-   It will update the `drawnData` state with the new `FeatureCollection`.
-   It will use `@turf/area` to calculate the total area of all drawn polygons and update the `area` state.
-   **Farm Drawing and Splitting (`wizard` mode):** When a farm polygon is drawn or updated, the `drawnData` and `area` states will be updated. After the user finishes drawing a farm and proceeds (e.g., by pressing a 'next' button in the UI), the farm layer will be hidden. The map will then display a fields layer, allowing the user to draw and edit individual field polygons within the bounds of the drawn farm. This mode will also support functionality for the user to specify the number of fields they wish to break the farm into. When a user splits a polygon, `MapboxDraw` fires `draw.update`. We can inspect the features and handle the split.

## 5. Hook Return Value

The `useMapViewModel` hook will be updated to return the new state variables and the `drawRef`.

```javascript
return {
  mapContainer,
  handleRecenter,
  area,
  drawnData,
  drawRef, // Expose drawRef to allow parent components to interact with the draw instance
};
```

## 6. Component Interaction

The parent component (e.g., `MapWizardFarm`) will use the hook like this:

```jsx
const { mapContainer, area, drawnData } = useMapViewModel({
  mode: "wizard",
  onDrawComplete: (data) => console.log(data), // Callback to handle draw events
});

return (
  <div>
    <div ref={mapContainer} className="map-container" />
    {area && <div>Area: {area.toFixed(2)} sqm</div>}
  </div>
);
```

The component will receive `drawnData` and `area` from the hook and can use them to display information to the user. The `onDrawComplete` callback will be called whenever the drawn data changes.
