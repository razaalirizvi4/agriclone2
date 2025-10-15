// client/src/components/ViewModel/useWeatherViewModel.js
import { useState, useEffect } from 'react';

const useWeatherViewModel = ({ weather }) => {
  // In the future, this hook could fetch live data,
  // handle state, etc. For now, it passes static data.
  const [currentWeather, setCurrentWeather] = useState(weather.current);
  const [forecast, setForecast] = useState(weather.forecast);

  useEffect(() => {
    // This effect would re-run if the weather prop changes
    setCurrentWeather(weather.current);
    setForecast(weather.forecast);
  }, [weather]);

  return {
    currentWeather,
    forecast,
  };
};

export default useWeatherViewModel;
