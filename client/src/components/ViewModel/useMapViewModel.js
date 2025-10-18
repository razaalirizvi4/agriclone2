import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { farmsGeoJSON as mockFarmsGeoJSON } from '../../data/farms.js';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const useMapViewModel = ({ locations = [] }) => {
  console.log("data from db:", locations);
  
  // Convert DB data to farms.js GeoJSON format
  let farmsGeoJSON;
  
  if (locations && locations.length > 0) {
    // Use DB data
    let wholeStructure = locations.map((elem) => {
      return {
        type: "Feature",
        properties: {
          type: elem?.type?.toLowerCase(), // "farm" or "field"
          name: elem?.name,
          owner: elem?.owner?.name,
          size: elem?.attributes?.area,
          farm: elem?.type?.toLowerCase() === "field" ? 
            locations.find(l => l._id === elem.parentId)?.name : elem?.name
        },
        geometry: {
          type: elem?.attributes?.geoJsonCords?.features?.[0]?.geometry?.type,
          coordinates: elem?.attributes?.geoJsonCords?.features?.[0]?.geometry?.coordinates,
        },
      };
    });

    farmsGeoJSON = {
      type: "FeatureCollection",
      features: wholeStructure,
    };
    console.log("Using DB data:", farmsGeoJSON);
  } else {
    // Fallback to mock data
    farmsGeoJSON = mockFarmsGeoJSON;
    console.log("Using mock data:", farmsGeoJSON);
  }

  const mapContainer = useRef(null);
  const map = useRef(null);
  
  // Calculate center based on data
  const calculateCenter = (geoJSON) => {
    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
      console.log("No features found, using default center:", [74.564, 31.5495]);
      return [74.564, 31.5495]; // Default to mock data center
    }
    
    let totalLng = 0, totalLat = 0, count = 0;
    
    geoJSON.features.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates[0]; // First polygon ring
        coords.forEach(coord => {
          totalLng += coord[0];
          totalLat += coord[1];
          count++;
        });
      }
    });
    
    const center = count > 0 ? [totalLng / count, totalLat / count] : [74.564, 31.5495];
    console.log("Calculated center:", center[0], center[1], "from", count, "coordinates");
    return center;
  };
  
  const [initialCenter, _setInitialCenter] = useState(() => calculateCenter(farmsGeoJSON));
  const [initialZoom, _setInitialZoom] = useState(10);

  const handleRecenter = () => {
    console.log("Recenter clicked, current farmsGeoJSON:", farmsGeoJSON);
    
    if (farmsGeoJSON && farmsGeoJSON.features && farmsGeoJSON.features.length > 0) {
      // Calculate bounds to fit all features
      const bounds = new mapboxgl.LngLatBounds();
      
      farmsGeoJSON.features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
          const coords = feature.geometry.coordinates[0]; // First polygon ring
          coords.forEach(coord => {
            bounds.extend(coord);
          });
        }
      });
      
      console.log("Fitting bounds to show all farms");
      map.current.fitBounds(bounds, { padding: 50 });
    } else {
      // Fallback to center and zoom
      const center = calculateCenter(farmsGeoJSON);
      console.log("Flying to center:", center[0], center[1]);
      map.current.flyTo({
        center: center,
        zoom: initialZoom,
      });
    }
    
    map.current.setFilter("farms-layer", ["==", "type", "farm"]);
    map.current.setFilter("fields-layer", ["==", "type", "none"]);
  };

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    map.current.on("load", () => {
      map.current.addSource("data", {
        type: "geojson",
        data: farmsGeoJSON,
      });

      map.current.addLayer({
        id: "farms-layer",
        type: "fill",
        source: "data",
        paint: {
          "fill-color": "#008000",
          "fill-opacity": 0.5,
        },
        filter: ["==", "type", "farm"],
      });

      map.current.addLayer({
        id: "fields-layer",
        type: "fill",
        source: "data",
        paint: {
          "fill-color": "#FFA500",
          "fill-opacity": 0.5,
        },
        filter: ["==", "type", "none"],
      });

      // Handle clicking on farms
      map.current.on("click", "farms-layer", (e) => {
        const farmName = e.features[0].properties.name;
        const coordinates = e.features[0].geometry.coordinates[0];
        const bounds = new mapboxgl.LngLatBounds(
          coordinates[0],
          coordinates[0]
        );
        for (const coord of coordinates) bounds.extend(coord);
        map.current.fitBounds(bounds, { padding: 20 });
        map.current.setFilter("fields-layer", ["==", "farm", farmName]);
        map.current.setFilter("farms-layer", ["!=", "name", farmName]);
      });

      // 🟩 FARM POPUPS
      let farmPopup = null;
      map.current.on("mouseenter", "farms-layer", (e) => {
        map.current.getCanvas().style.cursor = "pointer";
        const properties = e.features[0].properties;
        let content = "<div>";
        for (const key in properties)
          content += `<strong>${key}:</strong> ${properties[key]}<br>`;
        content += "</div>";
        farmPopup = new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(map.current);
      });

      map.current.on("mouseleave", "farms-layer", () => {
        map.current.getCanvas().style.cursor = "";
        if (farmPopup) {
          farmPopup.remove();
          farmPopup = null;
        }
      });

      // 🟨 FIELD POPUPS
      let fieldPopup = null;
      map.current.on("mouseenter", "fields-layer", (e) => {
        map.current.getCanvas().style.cursor = "pointer";
        const properties = e.features[0].properties;
        let content = "<div>";
        for (const key in properties)
          content += `<strong>${key}:</strong> ${properties[key]}<br>`;
        content += "</div>";
        fieldPopup = new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(map.current);
      });

      map.current.on("mouseleave", "fields-layer", () => {
        map.current.getCanvas().style.cursor = "";
        if (fieldPopup) {
          fieldPopup.remove();
          fieldPopup = null;
        }
      });
    });
  }, [farmsGeoJSON, initialCenter, initialZoom]);

  return { mapContainer, handleRecenter };
};

export default useMapViewModel;
