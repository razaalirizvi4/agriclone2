import React from "react";
import "./Crop.css";

const Crop = (props) => {
  let data = props.crop;

  if (!data) {
    return <div>Loading crop data...</div>;
  }

 
    return (
      <div className="crop-wrapper">
        <div className="crop-container">
          <h2 className="crop-title">
            {data.icon} {data.name}
          </h2>

          <div className="crop-details">
            <p>
              <strong>Seeding Period:</strong>{" "}
              {new Date(data.seedDateRangeStart).toLocaleDateString()} -{" "}
              {new Date(data.seedDateRangeEnd).toLocaleDateString()}
            </p>
            <p>
              <strong>Harvest Period:</strong>{" "}
              {new Date(data.harvestDateRangeStart).toLocaleDateString()} -{" "}
              {new Date(data.harvestDateRangeEnd).toLocaleDateString()}
            </p>
            <p>
              <strong>Temperature Range:</strong> {data.tempRangeStart}°C -{" "}
              {data.tempRangeEnd}°C
            </p>
            <p>
              <strong>Humidity Range:</strong> {data.humidRangeStart}% -{" "}
              {data.humidRangeEnd}%
            </p>
            <p>
              <strong>Expected Yield:</strong> {data.yield}
            </p>
          </div>
        </div>
      </div>
    );

};

export default Crop;
