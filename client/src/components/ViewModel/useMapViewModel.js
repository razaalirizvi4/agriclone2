import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const useMapViewModel = ({ geoJSON }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [initialCenter, _setInitialCenter] = useState([74.570, 31.553]);
  const [initialZoom, _setInitialZoom] = useState(13);

  const handleRecenter = () => {
    map.current.flyTo({
      center: initialCenter,
      zoom: initialZoom
    });
    map.current.setFilter('farms-layer', ['==', 'type', 'farm']);
    map.current.setFilter('fields-layer', ['==', 'type', 'none']);
  };

useEffect(() => {
  if (map.current) return;
  map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: initialCenter,
    zoom: initialZoom,
  });

  map.current.addControl(new mapboxgl.NavigationControl());

  map.current.on('load', () => {
    map.current.addSource('data', {
      type: 'geojson',
      data: geoJSON,
    });

    map.current.addLayer({
      id: 'farms-layer',
      type: 'fill',
      source: 'data',
      paint: {
        'fill-color': '#008000',
        'fill-opacity': 0.5,
      },
      filter: ['==', 'type', 'farm'],
    });

    map.current.addLayer({
      id: 'fields-layer',
      type: 'fill',
      source: 'data',
      paint: {
        'fill-color': '#FFA500',
        'fill-opacity': 0.5,
      },
      filter: ['==', 'type', 'none'],
    });

    // Handle clicking on farms
    map.current.on('click', 'farms-layer', (e) => {
      const farmName = e.features[0].properties.name;
      const coordinates = e.features[0].geometry.coordinates[0];
      const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
      for (const coord of coordinates) bounds.extend(coord);
      map.current.fitBounds(bounds, { padding: 20 });
      map.current.setFilter('fields-layer', ['==', 'farm', farmName]);
      map.current.setFilter('farms-layer', ['!=', 'name', farmName]);
    });

    // 🟩 FARM POPUPS
    let farmPopup = null;
    map.current.on('mouseenter', 'farms-layer', (e) => {
      map.current.getCanvas().style.cursor = 'pointer';
      const properties = e.features[0].properties;
      let content = '<div>';
      for (const key in properties) content += `<strong>${key}:</strong> ${properties[key]}<br>`;
      content += '</div>';
      farmPopup = new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(map.current);
    });

    map.current.on('mouseleave', 'farms-layer', () => {
      map.current.getCanvas().style.cursor = '';
      if (farmPopup) {
        farmPopup.remove();
        farmPopup = null;
      }
    });

    // 🟨 FIELD POPUPS
    let fieldPopup = null;
    map.current.on('mouseenter', 'fields-layer', (e) => {
      map.current.getCanvas().style.cursor = 'pointer';
      const properties = e.features[0].properties;
      let content = '<div>';
      for (const key in properties) content += `<strong>${key}:</strong> ${properties[key]}<br>`;
      content += '</div>';
      fieldPopup = new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(content).addTo(map.current);
    });

    map.current.on('mouseleave', 'fields-layer', () => {
      map.current.getCanvas().style.cursor = '';
      if (fieldPopup) {
        fieldPopup.remove();
        fieldPopup = null;
      }
    });
  });
}, [geoJSON, initialCenter, initialZoom]);

  return { mapContainer, handleRecenter };
}

export default useMapViewModel;
