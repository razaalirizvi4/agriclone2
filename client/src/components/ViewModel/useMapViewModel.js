import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const useMapViewModel = ({ locations = [], onFieldSelect }) => {
  console.log("data from db:", locations);

  // ✅ Only use DB data (no mock fallback)
  let farmsGeoJSON = null;

  if (locations && locations.length > 0) {
    const features = locations.map((elem) => ({
      type: "Feature",
      properties: {
        type: elem?.type?.toLowerCase(), // "farm" or "field"
        name: elem?.name,
        id: elem?._id,
        owner: elem?.owner?.name,
        size: elem?.attributes?.area,
          // If it's a field, attach its cropId for downstream selection handling
          cropId:
            elem?.type?.toLowerCase() === "field"
              ? (elem?.attributes?.cropId || elem?.attributes?.crop_id || elem?.attributes?.crop?.id || elem?.attributes?.crop?._id || null)
              : null,
        farm:
          elem?.type?.toLowerCase() === "field"
            ? locations.find((l) => l._id === elem.parentId)?.name
            : elem?.name,
      },
      geometry: {
        type: elem?.attributes?.geoJsonCords?.features?.[0]?.geometry?.type,
        coordinates:
          elem?.attributes?.geoJsonCords?.features?.[0]?.geometry?.coordinates,
      },
    }));

    farmsGeoJSON = {
      type: "FeatureCollection",
      features,
    };
    console.log("Using DB data:", farmsGeoJSON);
  } else {
    console.log("⚠️ No DB data found. Map will be empty.");
  }

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // ✅ Calculate map center only if data exists
  const calculateCenter = (geoJSON) => {
    if (!geoJSON || !geoJSON.features?.length) return null;

    let totalLng = 0,
      totalLat = 0,
      count = 0;

    geoJSON.features.forEach((feature) => {
      if (feature.geometry?.coordinates) {
        const coords = feature.geometry.coordinates[0];
        coords.forEach((coord) => {
          totalLng += coord[0];
          totalLat += coord[1];
          count++;
        });
      }
    });

    return count > 0 ? [totalLng / count, totalLat / count] : null;
  };

  const centerFromData = calculateCenter(farmsGeoJSON);
  const [initialCenter] = useState(centerFromData || [0, 0]); // fallback if empty
  const [initialZoom] = useState(centerFromData ? 10 : 2); // zoom out if no data

  const handleRecenter = () => {
    if (!map.current) return;

    const mapInstance = map.current;

    if (farmsGeoJSON && farmsGeoJSON.features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      farmsGeoJSON.features.forEach((feature) => {
        if (feature.geometry?.coordinates) {
          const coords = feature.geometry.coordinates[0];
          coords.forEach((coord) => bounds.extend(coord));
        }
      });

      mapInstance.fitBounds(bounds, { padding: 50 });

      // ✅ Reset filters to show all farms again
      mapInstance.setFilter("farms-layer", ["==", "type", "farm"]);
      mapInstance.setFilter("fields-layer", ["==", "type", "none"]);

      console.log("🔄 Recentered to all farms");
    } else {
      console.log("⚠️ No farm data available for recentering");
    }
  };

  // 🗺 Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.on("load", () => setMapLoaded(true));
  }, [initialCenter, initialZoom]);

  // 🧩 Add data layers if DB data exists
  useEffect(() => {
    if (!mapLoaded || !map.current || !farmsGeoJSON) return;

    const mapInstance = map.current;
    const source = mapInstance.getSource("data");

    if (source) {
      source.setData(farmsGeoJSON);
    } else {
      mapInstance.addSource("data", {
        type: "geojson",
        data: farmsGeoJSON,
      });

      mapInstance.addLayer({
        id: "farms-layer",
        type: "fill",
        source: "data",
        paint: {
          "fill-color": "#008000",
          "fill-opacity": 0.5,
        },
        filter: ["==", "type", "farm"],
      });

      mapInstance.addLayer({
        id: "fields-layer",
        type: "fill",
        source: "data",
        paint: {
          "fill-color": "#FFA500",
          "fill-opacity": 0.5,
        },
        filter: ["==", "type", "none"],
      });

      // 🟢 Farm click logic
      mapInstance.on("click", "farms-layer", (e) => {
        const farmName = e.features[0].properties.name;
        const coordinates = e.features[0].geometry.coordinates[0];
        const bounds = new mapboxgl.LngLatBounds(
          coordinates[0],
          coordinates[0]
        );
        for (const coord of coordinates) bounds.extend(coord);
        mapInstance.fitBounds(bounds, { padding: 20 });
        mapInstance.setFilter("fields-layer", ["==", "farm", farmName]);
        mapInstance.setFilter("farms-layer", ["==", "name", ""]);
      });
      
      mapInstance.on("click", "fields-layer", (e) => {
        const props = e.features[0].properties;
        const fieldId = props.id;
        const cropId = props.cropId || null;
        console.log("🟢 Field clicked:", { fieldId, cropId });
        if (onFieldSelect) onFieldSelect({ fieldId, cropId }); // ✅ send both IDs to Dashboard
      });

      // 🟢 Popups (Farms)
      let farmPopup = null;
      mapInstance.on("mouseenter", "farms-layer", (e) => {
        mapInstance.getCanvas().style.cursor = "pointer";
        const props = e.features[0].properties;
        let content = "<div>";
        for (const key in props)
          content += `<strong>${key}:</strong> ${props[key]}<br>`;
        content += "</div>";
        farmPopup = new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(mapInstance);
      });
      mapInstance.on("mouseleave", "farms-layer", () => {
        mapInstance.getCanvas().style.cursor = "";
        if (farmPopup) {
          farmPopup.remove();
          farmPopup = null;
        }
      });

      // 🟡 Popups (Fields)
      let fieldPopup = null;
      mapInstance.on("mouseenter", "fields-layer", (e) => {
        mapInstance.getCanvas().style.cursor = "pointer";
        const props = e.features[0].properties;
        let content = "<div>";
        for (const key in props)
          content += `<strong>${key}:</strong> ${props[key]}<br>`;
        content += "</div>";
        fieldPopup = new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(mapInstance);
      });

      mapInstance.on("click", "fields-layer", (e) => {
        console.log("field clicked", e.features[0].properties);
      });

      mapInstance.on("mouseleave", "fields-layer", () => {
        mapInstance.getCanvas().style.cursor = "";
        if (fieldPopup) {
          fieldPopup.remove();
          fieldPopup = null;
        }
      });
       mapInstance.on("click", "fields-layer", (e) => {

      });
    }
  }, [mapLoaded, farmsGeoJSON]);

  return { mapContainer, handleRecenter };
};

export default useMapViewModel;
