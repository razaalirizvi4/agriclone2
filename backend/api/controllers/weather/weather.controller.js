const weatherService = require('../../../services/weather.service');

class WeatherController {
    // GET /api/weather/:locationId
    async getWeather(req, res) {
        try {
            const { locationId } = req.params;
            const weatherData = await weatherService.getWeather(locationId);

            if (!weatherData || Object.keys(weatherData).length === 0) {
                return res.status(404).json({ message: 'Weather data not found for this location.' });
            }

            res.status(200).json({
                message: 'Weather data fetched successfully.',
                data: weatherData,
            });
        } catch (error) {
            console.error('Error fetching weather data:', error);
            res.status(500).json({ message: 'Failed to fetch weather data.', error: error.message });
        }
    }

    // PUT /api/weather/refresh/:locationId
    async refreshWeather(req, res) {
        try {
            const { locationId } = req.params;
            const updatedWeather = await weatherService.refreshWeather(locationId);

            res.status(200).json({
                message: 'Weather data refreshed and updated successfully.',
                data: updatedWeather,
            });
        } catch (error) {
            console.error('Error refreshing weather data:', error);
            res.status(500).json({ message: 'Failed to refresh weather data.', error: error.message });
        }
    }
}

module.exports = new WeatherController();
