import React from 'react';
import useMapViewModel from '../ViewModel/useMapViewModel';

const Map = ({ geoJSON }) => {
  const { mapContainer, handleRecenter } = useMapViewModel({ geoJSON });

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapContainer} className="map-container" />
      <button onClick={handleRecenter} className="recenter-button">Recenter</button>
    </div>
  );
}

export default Map;
