import React from 'react';
import useWeatherViewModel from '../ViewModel/useWeatherViewModel';
import './Weather.css';

const Weather = (props) => {
  const { currentWeather, forecast } = useWeatherViewModel(props);

  if (!currentWeather || !forecast) return <div>Loading weather data...</div>;

  return (
    <div className="weather-widget">
      <h3 className="weather-title">Weather</h3>

      {/* Current Weather */}
      <div className="current-weather">
        <div className="weather-icon-container">
          <img
            src={currentWeather.icon}
            alt={currentWeather.condition}
            className="weather-icon"
          />
        </div>
        <div className="temperature-details">
          <div className="current-temp">{currentWeather.temperature}°C</div>
          <div className="high-low">
            H: {currentWeather.high}° / L: {currentWeather.low}°
          </div>
          <div className="current-condition">{currentWeather.condition}</div>
          <div className="current-humidity">Humidity: {currentWeather.humidity}%</div>
        </div>
      </div>

      {/* Forecast */}
      <div className="forecast-section">
        <h4 className="forecast-title">3-Day Forecast</h4>
        <ul className="forecast-list">
          {forecast.map((item, index) => (
            <li key={index} className="forecast-item">
              <span className="forecast-day">{item.day}</span>
              <span className="forecast-condition">{item.condition}</span>
              <span className="forecast-temp">{item.high}° / {item.low}°</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Weather;
