### Weather Service Component

## We are going to define one main component for it:
Weather Service, which will be responsible for fetching, storing, and providing weather information to the system.

Models and Structures
EventStream (Already Exists)

Weather data will be stored as a new EventStream entry with the following structure:

<!-- {
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
      "timestamp": "2025-10-09T09:00:00Z"
    },
    "nextHours": [
      { "time": "11AM", "temperature": 33, "windSpeed": 8, "condition": "Sunny" }
    ],
    "forecast3Days": [
      { "day": "Today", "condition": "Sunny", "temperature": { "high": 36, "low": 24 } },
      { "day": "Tomorrow", "condition": "Cloudy", "temperature": { "high": 34, "low": 23 } },
      { "day": "Sunday", "condition": "Rainy", "temperature": { "high": 30, "low": 22 } }
    ],
    "source": "OpenWeatherMap",
    "lastUpdated": "2025-10-09T10:00:00Z"
  },
  "RelationIds": { "farmId": "farm_01" }
  ]
} -->

## Backend Implementation

Backend will consist of three layers:

# Data Layer
# Service Layer
# Controller + Routes

## 1. Data Layer (backend/api/dataLayer/weather.dataLayer.js)

Will handle direct database  external API operations.

## Methods:

# fetchWeatherFromAPI(location)
Fetches live weather + 3-day forecast from external API (e.g., OpenWeatherMap).
API key stored in .env.
# saveWeatherEvent(weatherData, relationIds)
Saves the fetched weather data into the EventStream collection with Feature_Type: Weather.
Replaces existing entry for same farm/location if found.
# getLatestWeather(farmId)
Retrieves the latest weather event for given farm/location.

## 2. Service Layer (backend/services/weather.service.js)

Will handle logic between controller and data layer.

## Methods:

# updateWeatherData()
Get a list of all farms or locations from the DB.
For each farm, call the data layer’s fetchWeatherFromAPI() to get new weather.
Then call data layer’s saveWeatherEvent() to store it.
It’s the one your cron job (every 2 hours) will call automatically.

# getWeatherForFarm(farmId)
Take the farm’s ID from the controller (when a frontend requests it).
Call the data layer’s getLatestWeather(farmId) to fetch the most recent weather event.
Return that data to the controller → controller sends it to frontend.

## 3. Controller (backend/api/controllers/weather.controller.js)

## Methods:

# getWeather(req, res)
Fetches and returns latest stored weather data from DB.
Endpoint: GET /api/weather/:farmId

# refreshWeather(req, res)
Forces immediate API fetch and update for that farm.
Endpoint: POST /api/weather/refresh/:farmId

## 4. Routes (backend/api/routes/weather.routes.js)

Define routes and link them to the controller.

router.get('/api/weather/:farmId', weatherController.getWeather);
router.post('/api/weather/refresh/:farmId', weatherController.refreshWeather);

## 5. Scheduler

Use setTimeout function to update weather every 2 hours automatically.