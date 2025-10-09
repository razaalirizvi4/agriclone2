// import React from 'react';
// import Map from '../components/View/Map';
// import { farmsGeoJSON } from '../data/farms';

// function Home() {
//   return (
//     <div>
//       <h1>Home Page</h1>
//       <p>Welcome to the home page!</p>
//       <Map geoJSON={farmsGeoJSON} />
//     </div>
//   );
// }

// export default Home;

import React from "react";
import Map from "../components/View/Map";
import Weather from "../components/View/Weather";
import CropLifeCycle from "../components/View/CropLifeCycle";
import { farmsGeoJSON } from "../data/farms";

function Home() {
  return (
    <div className="dashboard">
      {/* Top Section */}
      <div className="top-section">
        <div className="map-section">
          <Map geoJSON={farmsGeoJSON} />
        </div>

        <div className="weather-section">
          <Weather />
        </div>
      </div>

      {/* Bottom Section */}
<CropLifeCycle/>
    </div>
  );
}

export default Home;
