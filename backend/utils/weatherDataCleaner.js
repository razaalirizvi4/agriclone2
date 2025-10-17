function cleanWeatherData(data) {
  const { current, forecast } = data;

  // Map uncommon condition names to simpler ones for frontend
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

  const normalizeCondition = (cond) => {
    const cleaned = cond?.trim() || '';
    return conditionMap[cleaned] || cleaned;
  };

  const cleaned = {
    weather: {
      current: {
        temp: `${current.temp_c}°C`,
        humid: `${current.humidity}%`,
        precipitation: `${current.precip_mm}mm`,
        condition: normalizeCondition(current.condition.text),
        maxTemp: `${forecast.forecastday[0].day.maxtemp_c}°C`,
        minTemp: `${forecast.forecastday[0].day.mintemp_c}°C`,
        date: new Date(current.last_updated_epoch * 1000).toISOString(),
      },
      forecast: forecast.forecastday.map((day) => ({
        maxTemp: `${day.day.maxtemp_c}°C`,
        minTemp: `${day.day.mintemp_c}°C`,
        date: new Date(day.date_epoch * 1000).toLocaleDateString(),
        condition: normalizeCondition(day.day.condition.text),
      })),
    },
  };

  return cleaned;
}

module.exports = { cleanWeatherData };
