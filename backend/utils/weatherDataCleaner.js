function cleanWeatherData(data) {
    const { location, current, forecast } = data;

    // ✅ Map uncommon condition names to simpler ones for frontend
    const conditionMap = {
        Mist: 'Cloudy',
        Fog: 'Cloudy',
        Overcast: 'Cloudy',
        Clear: 'Sunny',
        'Partly cloudy': 'Cloudy',
        'Patchy rain possible': 'Rainy',
        Rain: 'Rainy',
        Drizzle: 'Rainy',
        Thunderstorm: 'Stormy',
        Snow: 'Snowy'
    };

    // Helper to normalize condition
    const normalizeCondition = (cond) => {
        const cleaned = cond.trim();
        return conditionMap[cleaned] || cleaned;
    };

    // ✅ Current hour in local time of the location
    const now = new Date();

    // ✅ Filter next 3 hours from forecast data
    const next3Hours = forecast.forecastday[0].hour
        .filter(hour => new Date(hour.time_epoch * 1000) > now)
        .slice(0, 3)
        .map(hour => ({
            time: new Date(hour.time_epoch * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            temperature: hour.temp_c,
            windSpeed: hour.wind_kph,
            condition: normalizeCondition(hour.condition.text),
        }));

    const cleaned = {
        location: {
            name: `${location.name}, ${location.country}`,
            lat: location.lat,
            lon: location.lon
        },
        current: {
            temperature: current.temp_c,
            condition: normalizeCondition(current.condition.text),
            humidity: current.humidity,
            timestamp: new Date(current.last_updated_epoch * 1000).toISOString()
        },
        next3Hours, // ✅ updated key and logic
        forecast3Days: forecast.forecastday.map(day => ({
            day: new Date(day.date_epoch * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
            condition: normalizeCondition(day.day.condition.text),
            temperature: {
                high: day.day.maxtemp_c,
                low: day.day.mintemp_c
            },
        })),
        source: 'WeatherAPI.com',
        lastUpdated: new Date().toISOString()
    };

    return cleaned;
}

module.exports = { cleanWeatherData };
