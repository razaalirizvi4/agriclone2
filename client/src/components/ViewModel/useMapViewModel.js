import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const useMapViewModel = ({ locations = [], onFieldSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [showFields, setShowFields] = useState(true);

  // ✅ Build GeoJSON from DB
  let farmsGeoJSON = null;
  if (locations?.length > 0) {
    const features = locations.map((elem) => ({
      type: "Feature",
      properties: {
        type: elem?.type?.toLowerCase(),
        name: elem?.name,
        id: elem?._id,
        owner: elem?.owner?.name,
        cropId:
          elem?.type?.toLowerCase() === "field"
            ? elem?.attributes?.cropId ||
              elem?.attributes?.crop_id ||
              elem?.attributes?.crop?._id ||
              null
            : null,
        farm:
          elem?.type?.toLowerCase() === "field"
            ? locations.find((l) => l._id === elem.parentId)?.name
            : elem?.name,
      },
      geometry: elem?.attributes?.geoJsonCords?.features?.[0]?.geometry,
    }));

    farmsGeoJSON = { type: "FeatureCollection", features };
  }

  // ✅ Utility to calculate map center
  const calculateCenter = (geoJSON, selectedFieldId = null) => {
    if (!geoJSON?.features?.length) return null;

    if (selectedFieldId) {
      const selected = geoJSON.features.find(
        (f) => f.properties?.id === selectedFieldId
      );
      if (selected?.geometry?.coordinates) {
        const coords = selected.geometry.coordinates[0];
        const lng =
          coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
        const lat =
          coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
        return [lng, lat];
      }
    }

    // average center of all features
    let totalLng = 0,
      totalLat = 0,
      count = 0;
    geoJSON.features.forEach((f) => {
      if (f.geometry?.coordinates) {
        const ring = f.geometry.coordinates[0];
        ring.forEach(([lng, lat]) => {
          totalLng += lng;
          totalLat += lat;
          count++;
        });
      }
    });
    return count ? [totalLng / count, totalLat / count] : null;
  };

  // 🗺 Initialize map once
  useEffect(() => {
    if (!locations.length || map.current) return;

    const farmsGeoJSON = {
      type: "FeatureCollection",
      features: locations.map((elem) => ({
        type: "Feature",
        geometry: elem?.attributes?.geoJsonCords?.features?.[0]?.geometry,
      })),
    };

    const center = calculateCenter(farmsGeoJSON);
    if (!center) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl());
    map.current.on("load", () => setMapLoaded(true));
  }, [locations]);

  // ✅ Auto-select first field when data loads
  useEffect(() => {
    if (!locations.length || selectedFieldId) return;

    const firstField = locations.find((l) => l.type === "Field");
    if (firstField) {
      setSelectedFieldId(firstField._id);
      if (onFieldSelect)
        onFieldSelect({
          fieldId: firstField._id,
          cropId:
            firstField?.attributes?.cropId ||
            firstField?.attributes?.crop_id ||
            null,
        });
    }
  }, [locations, selectedFieldId, onFieldSelect]);

  // ✅ Add layers + click + hover logic
  useEffect(() => {
    if (!mapLoaded || !map.current || !farmsGeoJSON) return;

    const mapInstance = map.current;

    if (!mapInstance.getSource("data")) {
      mapInstance.addSource("data", { type: "geojson", data: farmsGeoJSON });

      // Farms
      mapInstance.addLayer({
        id: "farms-layer",
        type: "fill",
        source: "data",
        paint: { "fill-color": "#008000", "fill-opacity": 0.5 },
        filter: ["==", "type", "farm"],
      });

      // Fields
      mapInstance.addLayer({
        id: "fields-layer",
        type: "fill",
        source: "data",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "id"], selectedFieldId],
            "#0047AB",
            "#FFA500",
          ],
          "fill-opacity": 0.6,
        },
        filter: ["==", "type", "field"],
      });

      // --- 🟢 Click on farm: zoom to farm, show its fields ---
      mapInstance.on("click", "farms-layer", (e) => {
        const farmName = e.features[0].properties.name;
        const coords = e.features[0].geometry.coordinates[0];
        const bounds = new mapboxgl.LngLatBounds();
        coords.forEach((c) => bounds.extend(c));
        mapInstance.fitBounds(bounds, { padding: 20 });
        mapInstance.setFilter("fields-layer", ["==", "farm", farmName]);
        setShowFields(true);
      });

      // --- 🟠 Click on field: highlight + callback ---
      mapInstance.on("click", "fields-layer", (e) => {
        const props = e.features[0].properties;
        const fieldId = props.id;
        const cropId = props.cropId || null;

        setSelectedFieldId(fieldId);
        if (onFieldSelect) onFieldSelect({ fieldId, cropId });
      });

      // --- 🟣 Hover popup for farms ---
      let farmPopup = null;
      mapInstance.on("mouseenter", "farms-layer", (e) => {
        mapInstance.getCanvas().style.cursor = "pointer";
        const props = e.features[0].properties;
        let content = "<div>";
        for (const key in props)
          content += `<strong>${key}:</strong> ${props[key]}<br>`;
        content += "</div>";

        farmPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        })
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

      // --- 🟠 Hover popup for fields ---
      let fieldPopup = null;
      mapInstance.on("mouseenter", "fields-layer", (e) => {
        mapInstance.getCanvas().style.cursor = "pointer";
        const props = e.features[0].properties;
        let content = "<div>";
        for (const key in props)
          content += `<strong>${key}:</strong> ${props[key]}<br>`;
        content += "</div>";

        fieldPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        })
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(mapInstance);
      });
      mapInstance.on("mouseleave", "fields-layer", () => {
        mapInstance.getCanvas().style.cursor = "";
        if (fieldPopup) {
          fieldPopup.remove();
          fieldPopup = null;
        }
      });
    }

    // Update data + field highlight dynamically
    if (mapInstance.getSource("data"))
      mapInstance.getSource("data").setData(farmsGeoJSON);

    if (mapInstance.getLayer("fields-layer")) {
      mapInstance.setPaintProperty("fields-layer", "fill-color", [
        "case",
        ["==", ["get", "id"], selectedFieldId],
        "#0047AB", // selected
        "#FFA500", // normal
      ]);
      mapInstance.setLayoutProperty(
        "fields-layer",
        "visibility",
        showFields ? "visible" : "none"
      );
    }
  }, [mapLoaded, farmsGeoJSON, selectedFieldId, showFields, onFieldSelect]);

  // ✅ Recenter logic (hide fields)
  const handleRecenter = () => {
    if (!map.current) return;
    const mapInstance = map.current;

    if (farmsGeoJSON?.features?.length) {
      const bounds = new mapboxgl.LngLatBounds();
      farmsGeoJSON.features
        .filter((f) => f.properties?.type === "farm")
        .forEach((f) => {
          const coords = f.geometry?.coordinates?.[0] || [];
          coords.forEach((c) => bounds.extend(c));
        });
      mapInstance.fitBounds(bounds, { padding: 50 });
      setShowFields(false); // hide fields
    }
  };

  return { mapContainer, handleRecenter };
};

export default useMapViewModel;
