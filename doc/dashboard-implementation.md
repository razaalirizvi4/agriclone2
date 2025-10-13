# Dashboard Implementation Details

This document outlines the implementation of a generic dashboard using a 12-column grid system.

## 1. Generic Dashboard Layout (`Home.jsx`)

The home page is designed as a generic, dynamic dashboard. Its layout and components are defined in a configuration file, allowing for easy customization. The layout is based on a 12-column grid, providing flexibility for component placement and sizing.

### Structure:

-   **`dashboardSchema.js`**: This configuration file at `client/src/data/dashboardSchema.js` defines the components to be rendered on the dashboard. It will contain an array of component configurations. Each configuration object will specify the component's `key`, `name`, any `props` it requires, a `colSpan` to define its size on the grid, and an `order` property for sorting.

-   **`componentMapper.js`**: A file at `client/src/components/componentMapper.js` will map component names (as strings from the layout configuration) to the actual React components. This is necessary for dynamically rendering components.

-   **`Home.jsx`**: The `Home.jsx` component will read the `dashboardSchema` configuration. It will sort the components based on the `order` property, then iterate over them, use the `componentMapper` to get the component, and render it within a `div` whose style is determined by the `colSpan` configuration.

### CSS for 12-Column Grid Layout:

A CSS Grid will be used to create the 12-column layout.

```css
/* In a dedicated dashboard stylesheet e.g. src/pages/Dashboard.css */

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  padding: 20px;
}
```

### Example `dashboardSchema.js`:

```javascript
// dashboardSchema.js
export const dashboardSchema = [
  {
    key: "map",
    component: "Map",
    props: { geoJSON: "farmsGeoJSON" },
    colSpan: 8,
    order: 1,
  },
  {
    key: "weather",
    component: "Weather",
    props: {},
    colSpan: 4,
    order: 2,
  },
  {
    key: "crop",
    component: "CropLifeCycle",
    props: {},
    colSpan: 12,
    order: 3,
  },
];
```

### Implementation Steps:

1.  **Add `order` to Schema**: Add a numerical `order` property to each component object in `client/src/data/dashboardSchema.js`.
2.  **Sort Components**: In the component that renders the dashboard (likely `Dashboard.jsx` or a similar component), import `dashboardSchema`. Before mapping over the schema to render components, sort the array based on the `order` property.
    ```javascript
    import { dashboardSchema } from '../data/dashboardSchema';

    const sortedComponents = [...dashboardSchema].sort((a, b) => a.order - b.order);
    ```
3.  **Render Sorted Components**: Map over the `sortedComponents` array to render the dashboard items in the desired order.

This approach allows for a highly flexible and configurable dashboard where the order of components can be easily changed by modifying the `dashboardSchema.js` file.

Please let me know if this revised implementation plan meets your approval.
