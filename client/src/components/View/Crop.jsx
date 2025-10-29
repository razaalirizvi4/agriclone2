import React from "react";
import "./Crop.css";

const Crop = (props) => {
  const data = props.crop;
  const name = props.componentName;

  if (!data) {
    return <div>Loading crop data...</div>;
  }

  const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <div className="crop-container">
      <div className="crop-wrapper">
        <div className="container">
          <div className="crop-header">
            <h3 className="comp-name">{name}</h3>
            <div className="crop-icon-box">
              <span className="crop-icon">{data.icon}</span>
            </div>
          </div>
          <div className="crop-title-box">
            <h2 className="crop-title">{data.name}</h2>
          </div>

          {/* 4 Info Boxes in 2x2 Grid */}
          <div className="crop-info-grid">
            <div className="crop-info-box">
              <div className="crop-info-icon-small">Yield</div>
              <div className="crop-info-value">{data.yield}</div>
            </div>

            <div className="crop-info-box">
              <div className="crop-info-icon-small">Harvest Period</div>
              <div className="crop-info-label">
                {formatShortDate(data.seedDateRangeStart)} -{" "}
                {formatShortDate(data.harvestDateRangeEnd)}
              </div>
            </div>

            <div className="crop-info-box">
              <div className="crop-info-icon-small">Temperature Range</div>
              <div className="crop-info-value-inline">
                {data.tempRangeStart}°C - {data.tempRangeEnd}°C
              </div>
            </div>

            <div className="crop-info-box">
              <div className="crop-info-icon-small">Humidity Range</div>
              <div className="crop-info-value-inline">
                {data.humidRangeStart}% - {data.humidRangeEnd}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Crop;
