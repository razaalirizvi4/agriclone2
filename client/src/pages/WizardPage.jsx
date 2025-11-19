import React, { useState } from "react";
import MapWizard from "../components/View/MapWizard";

const WizardPage = () => {
  const [locations, setLocations] = useState(null); // will hold drawn data

  const handleDrawComplete = (data) => {
    console.log("Translated GeoJSON for system:", data);
    setLocations(data); // 👈 feed it back into MapWizard
  };

  return (
    <div className="map-page-container">
      <h1>Registration Wizard</h1>
      <MapWizard
        mode="wizard"
        locations={locations}      // 👈 pass the stored data
        onDrawComplete={handleDrawComplete}
      />
    </div>
  );
};

export default WizardPage;
