# Map Component Implementation Steps

1.  **Install `mapbox-gl`:** The core library for the map was installed using `npm install mapbox-gl`.
2.  **Create `src/data/farms.js`:** A new file was created to store the `farmsGeoJSON` data.
3.  **Create `src/components/Map.jsx`:** A reusable React component was created to encapsulate the map's functionality. This component is designed to be generic, accepting GeoJSON data as a prop.
4.  **Add Mapbox CSS:** The Mapbox CSS file was added to `index.html` to ensure the map renders correctly.
5.  **Style the Map Container:** A CSS class (`.map-container`) was added to `App.css` to define the map's height, and `App.css` was imported into `main.jsx`.
6.  **Integrate into `Home.jsx`:** The `Map` component was imported into `Home.jsx`, and the `farmsGeoJSON` data was passed to it as a prop.
7.  **Add Zoom Controls:** Added `mapboxgl.NavigationControl()` to the map instance to provide zoom in, zoom out, and compass controls for easier map navigation.
8.  **Implement Separate Field Popup:** Created a distinct `mapboxgl.Popup` instance (`fieldPopup`) specifically for the 'fields-layer'. This prevents conflicts with the farm popup by ensuring that hovering over a field creates a new popup without interfering with the one for the farm layer, and vice-versa. Each layer now manages its own popup lifecycle independently.

