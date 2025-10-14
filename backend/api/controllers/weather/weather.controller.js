

const weatherService = require('../../../services/weather.service');

class WeatherController {
    async getWeather(req, res) {
        try {
            const { farmId } = req.params;
            const weatherData = await weatherService.getWeatherForFarm(farmId);
            if (!weatherData) {
                return res.status(404).json({ message: 'Weather data not found' });
            }
            res.json(weatherData);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async refreshWeather(req, res) {
        try {
            const { farmId } = req.params;
            const weatherData = await weatherService.refreshWeatherForFarm(farmId);
            res.json(weatherData);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new WeatherController();
