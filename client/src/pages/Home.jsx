import React from 'react';
import Map from '../components/View/Map';
import { farmsGeoJSON } from '../data/farms';

function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the home page!</p>
      <Map geoJSON={farmsGeoJSON} />
    </div>
  );
}

export default Home;
