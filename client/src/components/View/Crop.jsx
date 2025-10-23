import React from "react";
import { formatDateYYYYMMDD } from "../../utils/date";
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
              {formatDateYYYYMMDD(data.seedDateRangeStart)} -{" "}
              {formatDateYYYYMMDD(data.seedDateRangeEnd)}
            </p>
            <p>
              <strong>Harvest Period:</strong>{" "}
              {formatDateYYYYMMDD(data.harvestDateRangeStart)} -{" "}
              {formatDateYYYYMMDD(data.harvestDateRangeEnd)}
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
