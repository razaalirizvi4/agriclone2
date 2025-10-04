import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set the access token from the environment variable
mapboxgl.accessToken =   import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoiYWJkdWxsYWhtdW5pcjY5IiwiYSI6ImNtY3ZzODFweTAxdDYyaXIycHFnNjA1aWcifQ.FJp8E0oAJqyKVkEqtAWCPg";

export const useMapViewModel = (geoJSONData) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(74.57); // Default longitude
  const [lat, setLat] = useState(31.55); // Default latitude
  const [zoom, setZoom] = useState(13);   // Default zoom
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });

    map.current.on('load', () => {
      // Add GeoJSON source
      map.current.addSource('farms-data', {
        type: 'geojson',
        data: geoJSONData,
      });

      // Add farm layer
      map.current.addLayer({
        id: 'farms-layer',
        type: 'fill',
        source: 'farms-data',
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.5,
        },
        filter: ['==', 'type', 'farm'],
      });

      // Add field layer (initially hidden)
      map.current.addLayer({
        id: 'fields-layer',
        type: 'fill',
        source: 'farms-data',
        paint: {
          'fill-color': '#ff7f50',
          'fill-opacity': 0.6,
        },
        filter: ['==', 'type', 'none'], // Initially show no fields
      });

      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      // Hover popup for farms
      map.current.on('mousemove', 'farms-layer', (e) => {
        map.current.getCanvas().style.cursor = 'pointer';
        const properties = e.features[0].properties;
        const popupContent = `<h4>${properties.name}</h4><p>Owner: ${properties.owner}</p><p>Size: ${properties.size}</p>`;
        popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map.current);
      });

      map.current.on('mouseleave', 'farms-layer', () => {
        map.current.getCanvas().style.cursor = '';
        popup.remove();
      });

      // Hover popup for fields
      map.current.on('mousemove', 'fields-layer', (e) => {
        map.current.getCanvas().style.cursor = 'pointer';
        const properties = e.features[0].properties;
        const popupContent = `<h4>${properties.name}</h4><p>Crop: ${properties.crop}</p><p>Area: ${properties.area}</p>`;
        popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(map.current);
      });

      map.current.on('mouseleave', 'fields-layer', () => {
        map.current.getCanvas().style.cursor = '';
        popup.remove();
      });

      // Click event for farms
      map.current.on('click', 'farms-layer', (e) => {
        const farmName = e.features[0].properties.name;
        const coordinates = e.features[0].geometry.coordinates[0];
        
        // Calculate the bounding box of the farm
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
            padding: 40,
            duration: 1000
        });

        // Show only the fields for the clicked farm
        map.current.setFilter('fields-layer', ['all', ['==', 'type', 'field'], ['==', 'farm', farmName]]);
        map.current.setFilter('farms-layer', ['!=', 'type', 'farm']); // Hide all farms
        setIsZoomedIn(true);
      });
    });

    // Clean up on unmount
    return () => map.current.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recenterMap = () => {
    map.current.flyTo({
      center: [74.57, 31.55],
      zoom: 13,
      duration: 1500
    });
    // Restore layer visibility
    map.current.setFilter('fields-layer', ['==', 'type', 'none']);
    map.current.setFilter('farms-layer', ['==', 'type', 'farm']);
    setIsZoomedIn(false);
  };

  return { mapContainer, isZoomedIn, recenterMap };
};
