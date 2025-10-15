
# Weather Component Implementation Plan

This document outlines the implementation details for the `Weather.jsx` component, following the MVVM (Model-View-ViewModel) architecture used in this project.

## 1. Data Structure (Model)

Following the pattern in `client/src/data/farms.js` and `client/src/data/dashboardSchema.js`, we will create a new file for weather data and integrate it into the schema.

### `client/src/data/weatherData.js`

This new file will contain sample data for the weather component.

```javascript
// client/src/data/weatherData.js
export const weatherData = {
  current: {
    temperature: 28,
    condition: "Sunny",
    humidity: 65,
    icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png", // Sun icon
  },
  forecast: [
    {
      day: "Today",
      icon: "https://cdn-icons-png.flaticon.com/512/869/869869.png", // Sun icon
      high: 30,
      low: 22,
    },
    {
      day: "Tomorrow",
      icon: "https://cdn-icons-png.flaticon.com/512/1163/1163624.png", // Cloud icon
      high: 27,
      low: 20,
    },
    {
      day: "Sunday",
      icon: "https://cdn-icons-png.flaticon.com/512/1146/1146860.png", // Rain icon
      high: 25,
      low: 19,
    },
  ],
};
```

### `client/src/data/dataSources.js`

The `weatherData` will be imported and exported from `dataSources.js` to be accessible by the dashboard.

```javascript
// client/src/data/dataSources.js
export { farmsGeoJSON } from "./farms";
export { weatherData } from "./weatherData"; // Add this line
```

### `client/src/data/dashboardSchema.js`

The schema will be updated to pass the `weatherData` object key to the component's props.

```javascript
// client/src/data/dashboardSchema.js
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
    props: { weather: "weatherData" }, // Pass the data source key
    colSpan: 4,
    order: 2,
  },
  // ... other components
];
```

## 2. Business Logic (ViewModel)

A new ViewModel will be created to handle the logic for the Weather component.

### `client/src/components/ViewModel/useWeatherViewModel.js`

This hook will manage the weather data and any related logic. For now, it will simply receive and return the props.

```javascript
// client/src/components/ViewModel/useWeatherViewModel.js
import { useState, useEffect } from 'react';

const useWeatherViewModel = ({ weather }) => {
  // In the future, this hook could fetch live data,
  // handle state, etc. For now, it passes static data.
  const [currentWeather, setCurrentWeather] = useState(weather.current);
  const [forecast, setForecast] = useState(weather.forecast);

  useEffect(() => {
    // This effect would re-run if the weather prop changes
    setCurrentWeather(weather.current);
    setForecast(weather.forecast);
  }, [weather]);

  return {
    currentWeather,
    forecast,
  };
};

export default useWeatherViewModel;
```

## 3. UI (View)

The `Weather.jsx` component will be responsible for rendering the UI based on the data from the ViewModel.

### `client/src/components/View/Weather.jsx`

```javascript
// client/src/components/View/Weather.jsx
import React from 'react';
import useWeatherViewModel from '../ViewModel/useWeatherViewModel';
import './Weather.css';

const Weather = (props) => {
  const { currentWeather, forecast } = useWeatherViewModel(props);

  return (
    <div className="weather-widget">
      <h3 className="weather-title">Weather</h3>
      <div className="current-weather">
        <div className="weather-icon-container">
          <img src={currentWeather.icon} alt={currentWeather.condition} className="weather-icon" />
        </div>
        <div className="temperature-details">
          <div className="current-temp">{currentWeather.temperature}°C</div>
          <div className="current-condition">{currentWeather.condition}</div>
          <div className="current-humidity">Humidity: {currentWeather.humidity}%</div>
        </div>
      </div>
      <div className="forecast-section">
        <h4 className="forecast-title">3-Day Forecast</h4>
        <ul className="forecast-list">
          {forecast.map((item, index) => (
            <li key={index} className="forecast-item">
              <img src={item.icon} alt="" className="forecast-icon" />
              <span className="forecast-day">{item.day}</span>
              <span className="forecast-temp">{item.high}° / {item.low}°</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Weather;
```

### `client/src/components/View/Weather.css`

A new CSS file will be created to style the component.

```css
/* client/src/components/View/Weather.css */
.weather-widget {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.weather-title {
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.current-weather {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.weather-icon-container {
  background-color: #ffeb3b; /* Yellow for sunny */
  border-radius: 50%;
  width: 70px;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.weather-icon {
  width: 45px;
  height: 45px;
}

.temperature-details {
  display: flex;
  flex-direction: column;
}

.current-temp {
  font-size: 2.5rem;
  font-weight: 700;
  color: #222;
  line-height: 1;
}

.current-condition {
  font-size: 1rem;
  color: #666;
  margin-top: 4px;
}

.current-humidity {
  font-size: 0.85rem;
  color: #777;
  margin-top: 6px;
}

.forecast-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}

.forecast-title {
  margin: 0 0 10px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #444;
}

.forecast-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forecast-item {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

.forecast-icon {
  width: 28px;
  height: 28px;
  margin-right: 12px;
}

.forecast-day {
  color: #555;
  flex-grow: 1;
}

.forecast-temp {
  font-weight: 600;
  color: #333;
}
```

## 4. Component Registration

Finally, the new `Weather` component needs to be registered in the `componentMapper.js` to be dynamically rendered on the dashboard.

### `client/src/components/componentMapper.js`

```javascript
// client/src/components/componentMapper.js
import Map from "./View/Map";
import Timeline from "./View/Timeline";
import Weather from "./View/Weather"; // Import the new component

const componentMapper = {
  Map,
  Timeline,
  Weather, // Add the new component
};

export default componentMapper;
```
