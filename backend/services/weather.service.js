const weatherDataLayer = require('../api/dataLayer/weather.dataLayer');
const Location = require('../api/models/locationModule/location.model.js');

class WeatherService {
    async updateWeatherData() {
        try {
            const farms = await Location.find({ type: 'Farm' }).lean();

            for (const farm of farms) {
                const lat = farm.attributes?.lat;
                const lon = farm.attributes?.lon;

                if (!lat || !lon) {
                    console.warn(`Skipping farm ${farm._id}: Missing lat/lon`);
                    continue;
                }

                const weatherData = await weatherDataLayer.fetchWeatherFromAPI(lat, lon);
                await weatherDataLayer.saveWeatherEvent(farm._id, weatherData);

                console.log(`Weather updated for farm: ${farm.name || farm._id}`);
            }
        } catch (err) {
            console.error('Error updating weather for all farms:', err.message);
        }
    }

    async getWeather(locationId) {
        const location = await Location.findById(locationId).select('weather');
        return location?.weather || {}; // weather field
    }

    async refreshWeather(locationId) {
        try {
            const location = await Location.findById(locationId);
            if (!location) throw new Error('Location not found');

            const lat = location.attributes?.lat;
            const lon = location.attributes?.lon;
            if (!lat || !lon) throw new Error('Missing latitude or longitude');

            const rawData = await weatherDataLayer.fetchWeatherFromAPI(lat, lon);
            await weatherDataLayer.saveWeatherEvent(locationId, rawData);

            console.log(`Weather refreshed for ${location.name}`);
            
            const updatedLocation = await Location.findById(locationId).select('weather');
            return updatedLocation.weather;
        } catch (error) {
            console.error('Error refreshing weather:', error.message);
            throw error;
        }
    }
}

module.exports = new WeatherService();