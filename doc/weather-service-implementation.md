
# Weather Service Implementation Plan

This document outlines the steps to implement the Weather Service component as described in the prompt.

## 1. Overview

The Weather Service will be responsible for fetching, storing, and providing weather information to the system. It will use an external API (e.g., OpenWeatherMap) to get weather data and store it in the existing `EventStream` collection.

## 2. Data Model

Weather data will be stored as a new `EventStream` entry.

- **`Feature_Type`**: "Weather"
- **`Module_Action`**: "API_Fetch"
- **`Meta_Data`**: Contains the detailed weather information, including current weather, hourly forecast, and a 3-day forecast.
- **`RelationIds`**: Will contain the `farmId` to associate the weather data with a specific farm.


### Example Structure:

```json
{
  "Feature_Type": "Weather",
  "Module_Action": "API_Fetch",
  "Date": "2025-10-09T10:00:00Z",
  "State": "Completed",
  "Meta_Data": {
    "location": {
      "name": "Lahore, Pakistan",
      "lat": 31.5497,
      "lon": 74.3436
    },
    "current": {
      "temperature": 32,
      "condition": "Sunny",
      "humidity": 65,
      "icon": "☀️",
      "timestamp": "2025-10-09T09:00:00Z"
    },
    "nextHours": [
      { "time": "11AM", "temperature": 33, "windSpeed": 8, "condition": "Sunny", "icon": "☀️" }
    ],
    "forecast3Days": [
      { "day": "Today", "condition": "Sunny", "temperature": { "high": 36, "low": 24 }, "icon": "☀️" },
      { "day": "Tomorrow", "condition": "Cloudy", "temperature": { "high": 34, "low": 23 }, "icon": "☁️" },
      { "day": "Sunday", "condition": "Rainy", "temperature": { "high": 30, "low": 22 }, "icon": "🌧" }
    ],
    "source": "OpenWeatherMap",
    "lastUpdated": "2025-10-09T10:00:00Z"
  },
  "RelationIds": { "farmId": "farm_01" }
}
```

## 3. Backend Implementation

The backend will be implemented in three layers: Data Layer, Service Layer, and Controller/Routes.

### 3.1. Data Layer

- **File:** `backend/api/dataLayer/weather.dataLayer.js`
- **Purpose:** Handles direct interaction with the database and external weather API.

#### Methods:

- **`fetchWeatherFromAPI(location)`**:
  - Fetches live weather and a 3-day forecast from an external API like OpenWeatherMap.
  - The API key should be stored in a `.env` file.
- **`saveWeatherEvent(weatherData, relationIds)`**:
  - Saves the fetched weather data into the `EventStream` collection with `Feature_Type: "Weather"`.
  - It should update an existing entry for the same farm/location if one is found.
- **`getLatestWeather(farmId)`**: 
  - Retrieves the most recent weather event for a given `farmId`.

### 3.2. Service Layer

- **File:** `backend/services/weather.service.js`
- **Purpose:** Contains the business logic and orchestrates the data layer.

#### Methods:

- **`updateWeatherData()`**:
  - Retrieves a list of all farms or locations from the database.
  - For each farm, it calls `weather.dataLayer.fetchWeatherFromAPI()` to get new weather data.
  - It then calls `weather.dataLayer.saveWeatherEvent()` to store the data.
  - This service method will be automatically called by a cron job (every 2 hours).
- **`getWeatherForFarm(farmId)`**:
  - Takes a `farmId` from the controller.
  - Calls `weather.dataLayer.getLatestWeather(farmId)` to get the latest weather data.
  - Returns the data to the controller.

### 3.3. Controller

- **File:** `backend/api/controllers/weather/weather.controller.js`
- **Purpose:** Handles incoming HTTP requests and sends responses.

#### Methods:

- **`getWeather(req, res)`**:
  - Handles the `GET /api/weather/:farmId` endpoint.
  - Fetches and returns the latest stored weather data for the given `farmId`.
- **`refreshWeather(req, res)`**:
  - Handles the `POST /api/weather/refresh/:farmId` endpoint.
  - Forces an immediate fetch and update of weather data for the given `farmId`.

### 3.4. Routes

- **File:** `backend/api/routes/weather/weather.routes.js`
- **Purpose:** Defines the API endpoints and maps them to the controller methods.

#### Endpoints:

- `GET /api/weather/:farmId`: Mapped to `weatherController.getWeather`.
- `POST /api/weather/refresh/:farmId`: Mapped to `weatherController.refreshWeather`.

### 3.5. Scheduler

- A scheduler (e.g., `node-cron`) will be used to periodically update the weather data.
- The scheduler will call the `weatherService.updateWeatherData()` method every 2 hours.

#### Example Cron Job:

```javascript
const cron = require('node-cron');
const weatherService = require('../../services/weather.service');

// Schedule a job to run every 2 hours
cron.schedule('0 */2 * * *', async () => {
  console.log('Updating weather data...');
  await weatherService.updateWeatherData();
  console.log('Weather data updated.');
});
```

## 4. File Structure

The following new files will be created:

```
backend/
├── api/
│   ├── controllers/
│   │   └── weather/
│   │       └── weather.controller.js
│   ├── dataLayer/
│   │   └── weather.dataLayer.js
│   └── routes/
│       └── weather/
│           └── weather.routes.js
└── services/
    └── weather.service.js
```
