# Field Selection Implementation Plan

This document outlines the approach and implementation steps to dynamically update the Weather, Events, and Crop components based on the user's selection of a field within a farm.

## 1. High-Level Approach

The core of the solution is to manage the currently selected field in a centralized state management system. Given the project's use of Redux, we will create a new slice to store the `selectedFieldId`. Components that display field-specific data (Weather, EventStream, Crop) will subscribe to this state. When the user selects a different field, an action will be dispatched to update the `selectedFieldId`, causing the subscribed components to re-fetch and display the data for the newly selected field.

## 2. Implementation Steps

### Step 1: Create a new Redux Slice for Dashboard/Farm State

We need a new slice to manage the state of the dashboard, primarily for tracking the selected field.

**File:** `client/src/features/dashboard/dashboard.slice.js`

```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedFieldId: null, // Or set a default field ID if applicable
  status: 'idle',
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedFieldId: (state, action) => {
      state.selectedFieldId = action.payload;
    },
  },
});

export const { setSelectedFieldId } = dashboardSlice.actions;

export const selectSelectedFieldId = (state) => state.dashboard.selectedFieldId;

export default dashboardSlice.reducer;
```

### Step 2: Integrate the new Slice into the Root Reducer

Add the new `dashboardSlice` to the existing root reducer.

**File:** `client/src/app/rootReducer.js`

```javascript
import { combineReducers } from '@reduxjs/toolkit';
// ... other imports
import dashboardReducer from '../features/dashboard/dashboard.slice';

const rootReducer = combineReducers({
  // ... other reducers
  dashboard: dashboardReducer,
});

export default rootReducer;
```

### Step 3: Create a Field Selector Component

This component will be responsible for rendering the field selection UI (e.g., buttons, dropdown) and dispatching the action to update the selected field. It will fetch the available fields from the `location.service.js`.

**File:** `client/src/components/View/FieldSelector.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedFieldId, selectSelectedFieldId } from '../../features/dashboard/dashboard.slice';
import { getLocations } from '../../services/location.service'; // Assuming a service to fetch locations

const FieldSelector = () => {
  const dispatch = useDispatch();
  const selectedFieldId = useSelector(selectSelectedFieldId);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setLoading(true);
        // Assuming getLocations can be filtered by type
        const response = await getLocations({ type: 'Field' });
        setFields(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch fields.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  // Set a default field on initial render if none is selected
  useEffect(() => {
    if (!selectedFieldId && fields.length > 0) {
      dispatch(setSelectedFieldId(fields[0]._id));
    }
  }, [dispatch, selectedFieldId, fields]);

  const handleFieldChange = (fieldId) => {
    dispatch(setSelectedFieldId(fieldId));
  };

  if (loading) return <div>Loading fields...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h3>Select a Field</h3>
      {fields.map((field) => (
        <button
          key={field._id}
          onClick={() => handleFieldChange(field._id)}
          style={{ fontWeight: selectedFieldId === field._id ? 'bold' : 'normal' }}
        >
          {field.name}
        </button>
      ))}
    </div>
  );
};

export default FieldSelector;
```

### Step 4: Update Data-Displaying Components

Modify the `Weather`, `EventStream`, and `Crop` components to use the `selectedFieldId` from the Redux store to fetch their data.

**Example for the `Weather` component:**

**File:** `client/src/components/View/Weather.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectSelectedFieldId } from '../../features/dashboard/dashboard.slice';
import { getLocationById } from '../../services/location.service'; // Assuming a service to fetch a single location

const Weather = () => {
  const selectedFieldId = useSelector(selectSelectedFieldId);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!selectedFieldId) return;

      try {
        setLoading(true);
        const response = await getLocationById(selectedFieldId);
        setWeatherData(response.data.weather); // Assuming the location object has a 'weather' property
        setError(null);
      } catch (err) {
        setError('Failed to fetch weather data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [selectedFieldId]);

  if (!selectedFieldId) return <div>Select a field to see the weather.</div>;
  if (loading) return <div>Loading Weather...</div>;
  if (error) return <div>{error}</div>;
  if (!weatherData) return <div>No weather data available for this field.</div>;

  return (
    <div>
      <h2>Weather for {selectedFieldId}</h2>
      {/* Render weather data from weatherData object */}
      <p>Temperature: {weatherData.current.temp}</p>
      <p>Condition: {weatherData.current.condition}</p>
    </div>
  );
};

export default Weather;
```

### Step 5: Update Other Components (EventStream, Crop)

Apply a similar pattern to the `EventStream` and `Crop` components.

*   **`EventStream.jsx`**:
    *   Use `useSelector(selectSelectedFieldId)` to get the current field ID.
    *   Use a `useEffect` hook that depends on `selectedFieldId` to trigger a data fetch.
    *   Call a service function, e.g., `getEventsByFieldId(selectedFieldId)`, which will fetch events where `RelationIds.Field_id` matches the selected field's ID.

*   **`Crop.jsx`**:
    *   Use `useSelector(selectSelectedFieldId)` to get the current field ID.
    *   First, fetch the location data for the selected field using `getLocationById(selectedFieldId)`.
    *   The location data will contain a `crop_id` in its `attributes`.
    *   Use this `crop_id` to fetch the crop details using a service function like `getCropById(crop_id)`.
    *   Display the details of the fetched crop.

### Step 6: Integrate `FieldSelector` into the Dashboard

Finally, add the `FieldSelector` component to your main dashboard page.

**File:** `client/src/pages/Dashboard.jsx` (or equivalent)

```javascript
import React from 'react';
import FieldSelector from '../components/View/FieldSelector';
import Weather from '../components/View/Weather';
import EventStream from '../components/EventStream';
import Crop from '../components/View/Crop';
// ... other imports

const Dashboard = () => {
  return (
    <div>
      <h1>Farm Dashboard</h1>
      <FieldSelector />
      <hr />
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <Weather />
        <Crop />
      </div>
      <EventStream />
    </div>
  );
};

export default Dashboard;
```
