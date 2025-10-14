const weatherDataLayer = require('../api/dataLayer/weather.dataLayer');
const { cleanWeatherData } = require('../utils/weatherDataCleaner');

class WeatherService {
    async updateWeatherData() {
        // const farms = await farmDataLayer.getAllFarms(); // Real implementation
        const farms = [{ _id: 'default_farm', location: 'Lahore, Pakistan' }]; // Hardcoded for now
        for (const farm of farms) {
            const weatherData = await weatherDataLayer.fetchWeatherFromAPI(farm.location);
            const cleanedData = cleanWeatherData(weatherData);
            await weatherDataLayer.saveWeatherEvent(cleanedData, { farmId: farm._id });
        }
    }

    async getWeatherForFarm(farmId) {
        return await weatherDataLayer.getLatestWeather(farmId);
    }

//     async getWeatherForFarm(farmId) {
//     const data = await weatherDataLayer.getLatestWeather(farmId);
//     if (data) return data;

//     console.log("⚠️ No weather data found in DB. Returning mock data.");

//     // Mock data for testing
//     return {
//         farmId,
//         location: "Lahore, Pakistan",
//         temperature: 29,
//         humidity: 63,
//         windSpeed: 8,
//         condition: "Sunny",
//         updatedAt: new Date().toISOString(),
//         source: "mock",
//     };
// }


    async refreshWeatherForFarm(farmId) {
        // const farm = await farmDataLayer.getFarmById(farmId); // Real implementation
        const farm = { _id: farmId, location: 'Lahore, Pakistan' }; // Hardcoded location for now
        const weatherData = await weatherDataLayer.fetchWeatherFromAPI(farm.location);
        const cleanedData = cleanWeatherData(weatherData);
        return await weatherDataLayer.saveWeatherEvent(cleanedData, { farmId: farm._id });
    }
}

module.exports = new WeatherService();
