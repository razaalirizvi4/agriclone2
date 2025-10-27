import React from "react";
import useWeatherViewModel from "../ViewModel/useWeatherViewModel";
import "./Weather.css";

const Weather = (props) => {
  let weatherIcon = {
    Sunny: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
    Cloudy: "https://cdn-icons-png.flaticon.com/512/414/414825.png",
    Rainy: "https://cdn-icons-png.flaticon.com/512/1163/1163624.png",
    Stormy: "https://cdn-icons-png.flaticon.com/512/1146/1146860.png",
  };
  let name=props.componentName

  const { currentWeather, forecast } = useWeatherViewModel(props);

  if (!currentWeather || !forecast) return <div>Loading weather data...</div>;

  return (
    <div className="container">
      <h3>{name}</h3>

      {/* Current Weather */}
      <div className="current-weather">
        <div className="weather-icon-container">
          <img
            src={weatherIcon[currentWeather.condition]}
            alt={currentWeather.condition}
            className="weather-icon"
          />
        </div>
        <div className="temperature-details">
          <div className="current-temp">{currentWeather.temp}</div>
          <div className="high-low">
            H: {currentWeather.maxTemp}° / L: {currentWeather.minTemp}°
          </div>
          <div className="current-condition">{currentWeather.condition}</div>
          <div className="current-humidity">
            Humidity: {currentWeather.humid}
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="forecast-section">
        <h4 className="forecast-title">3-Day Forecast</h4>
        <ul className="forecast-list">
          {forecast.map((item, index) => (
            <li key={index} className="forecast-item">
              <span className="forecast-day">{item.date}</span>
              <span className="forecast-condition">{item.condition}</span>
              <span className="forecast-temp">
                {item.maxTemp}° / {item.minTemp}°
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Weather;
