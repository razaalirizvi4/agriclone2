
function cleanWeatherData(data) {
    const { location, current, forecast } = data;

    const cleaned = {
        location: {
            name: `${location.name}, ${location.country}`,
            lat: location.lat,
            lon: location.lon
        },
        current: {
            temperature: current.temp_c,
            condition: current.condition.text,
            humidity: current.humidity,
            timestamp: new Date(current.last_updated_epoch * 1000).toISOString()
        },
        nextHours: forecast.forecastday[0].hour.map(hour => ({
            time: new Date(hour.time_epoch * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            temperature: hour.temp_c,
            windSpeed: hour.wind_kph,
            condition: hour.condition.text,
        })),
        forecast3Days: forecast.forecastday.map(day => ({
            day: new Date(day.date_epoch * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
            condition: day.day.condition.text,
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
