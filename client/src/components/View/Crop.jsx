import React from "react";
import { crop } from "../../data/crop";
import "./Crop.css";

const Crop = (cropdata) => {
  console.log("in crop component:",cropdata)
  return (
    <div className="crop-wrapper">
      <div className="crop-container">
        <h2 className="crop-title">
          {crop.icon} {crop.name}
        </h2>

        <div className="crop-details">
          <p><strong>Seeding Period:</strong> {new Date(crop.seedDateRangeStart).toLocaleDateString()} - {new Date(crop.seedDateRangeEnd).toLocaleDateString()}</p>
          <p><strong>Harvest Period:</strong> {new Date(crop.harvestDateRangeStart).toLocaleDateString()} - {new Date(crop.harvestDateRangeEnd).toLocaleDateString()}</p>
          <p><strong>Temperature Range:</strong> {crop.tempRangeStart}°C - {crop.tempRangeEnd}°C</p>
          <p><strong>Humidity Range:</strong> {crop.humidRangeStart}% - {crop.humidRangeEnd}%</p>
          <p><strong>Expected Yield:</strong> {crop.yield}</p>
        </div>
      </div>
    </div>
  );
};

export default Crop;
