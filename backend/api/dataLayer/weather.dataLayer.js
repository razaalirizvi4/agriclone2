const axios = require('axios');
const Location = require('../models/locationModule/location.model.js');
const { cleanWeatherData } = require('../../utils/weatherDataCleaner.js');

class WeatherDataLayer {
    async fetchWeatherFromAPI(lat, lon) {
        const apiKey = process.env.WEATHER_API_KEY;
        const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=3`;
        const response = await axios.get(url);
        return response.data;
    }

    async saveWeatherEvent(locationId,rawWeatherData) {
    try {
      // Clean the API data
      const cleanedData = cleanWeatherData(rawWeatherData);

      // Save cleaned data into location's attributes
      await Location.findByIdAndUpdate(
        locationId,
        { $set: { 'weather': cleanedData.weather } },
        { new: true }
      );

      console.log(`Weather data updated successfully for location ${locationId}`);
    } catch (error) {
      console.error('Error saving weather data:', error.message);
      throw error;
    }

    }

    async getLatestWeather(locationId) {
        const location = await Location.findById(locationId).lean();
        return location?.weather || null;
    }
}

module.exports = new WeatherDataLayer();

