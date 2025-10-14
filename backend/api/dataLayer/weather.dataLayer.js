const axios = require('axios');
const EventStream = require('../models/eventStream/eventStream.model');

class WeatherDataLayer {
    async fetchWeatherFromAPI(location) {
        const apiKey = process.env.WEATHER_API_KEY;
        const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=3`;
        const response = await axios.get(url);
        return response.data;
    }

    async saveWeatherEvent(weatherData, relationIds) {
        const filter = {
            'RelationIds.farmId': relationIds.farmId,
            Feature_Type: 'Weather'
        };
        const update = {
            Feature_Type: 'Weather',
            Module_Action: 'API_Fetch',
            Date: new Date(),
            State: 'ActionTaken',
            Meta_Data: weatherData,
            RelationIds: relationIds
        };
        const options = { upsert: true, new: true };
        return await EventStream.findOneAndUpdate(filter, update, options);
    }

    async getLatestWeather(farmId) {
        return await EventStream.findOne({ 'RelationIds.farmId': farmId, Feature_Type: 'Weather' }).sort({ Date: -1 });
    }
}

module.exports = new WeatherDataLayer();
