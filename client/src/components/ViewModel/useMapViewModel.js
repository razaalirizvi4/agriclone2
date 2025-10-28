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
            ?elem?.attributes?.crop_id
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
        const geom = selected.geometry;
        switch (geom.type) {
          case "Polygon": {
            const coords = geom.coordinates[0];
            const lng =
              coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
            const lat =
              coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
            return [lng, lat];
          }
          case "LineString": {
            const mid = Math.floor(geom.coordinates.length / 2);
            return geom.coordinates[mid];
          }
          case "Point":
            return geom.coordinates;

          default:
            return null;
        }
      }
    }

    // average center of all features
    let totalLng = 0,
      totalLat = 0,
      count = 0;
    geoJSON.features.forEach((f) => {
      const geom = f.geometry;
      if (!geom?.coordinates) return;

      switch (geom.type) {
        case "Polygon": {
          const ring = geom.coordinates[0];
          ring.forEach(([lng, lat]) => {
            totalLng += lng;
            totalLat += lat;
            count++;
          });
          break;
        }

        case "LineString": {
          geom.coordinates.forEach(([lng, lat]) => {
            totalLng += lng;
            totalLat += lat;
            count++;
          });
          break;
        }
        case "Point": {
          const [lng, lat] = geom.coordinates;
          totalLng += lng;
          totalLat += lat;
          count++;
          break;
        }
        default:
          break;
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
      // style: "mapbox://styles/mapbox/standard",
  style: "mapbox://styles/mapbox/standard-satellite", 
  // use this for satellite view
      center,
      zoom: 15,
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
        filter: [
          "all",
          ["==", ["geometry-type"], "Polygon"],
          ["==", ["get", "type"], "farm"], // ✅ ensure only farms
        ],
        layout: { visibility: "none" },
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
        filter: [
          "all",
          ["==", ["geometry-type"], "Polygon"],
          ["==", ["get", "type"], "field"], // ✅ ensure only fields
        ],
        layout: { visibility: "visible" },
      });

      // --- ROADS (LineString) ---
      mapInstance.addLayer({
        id: "roads-layer",
        type: "line",
        source: "data",
        paint: { "line-color": "#444", "line-width": 3 },
        filter: ["==", ["geometry-type"], "LineString"],
      });

      // --- POINTS (Point) ---
      mapInstance.addLayer({
        id: "points-layer",
        type: "circle",
        source: "data",
        paint: {
          "circle-radius": 6,
          "circle-color": "#FF0000",
          "circle-stroke-width": 1,
          "circle-stroke-color": "#fff",
        },
        filter: ["==", ["geometry-type"], "Point"],
      });

      // --- 🟢 Click on farm: zoom + show its fields ---
      mapInstance.on("click", "farms-layer", (e) => {
        const farmName = e.features[0].properties.name;
        const coords = e.features[0].geometry.coordinates[0];
        const bounds = new mapboxgl.LngLatBounds();
        coords.forEach((c) => bounds.extend(c));
        mapInstance.fitBounds(bounds, { padding: 20 });

        // ✅ Show fields of only this farm
        mapInstance.setFilter("fields-layer", [
          "all",
          ["==", ["geometry-type"], "Polygon"],
          ["==", ["get", "type"], "field"],
          ["==", ["get", "farm"], farmName],
        ]);

        // ✅ Hide farms
        mapInstance.setLayoutProperty("farms-layer", "visibility", "none");

        // ✅ Show fields
        mapInstance.setLayoutProperty("fields-layer", "visibility", "visible");
        setShowFields(true);
      });

      // --- 🟠 Click on field ---
      mapInstance.on("click", "fields-layer", (e) => {
        const props = e.features[0].properties;
        const fieldId = props.id;
        const cropId = props.cropId || null;

        setSelectedFieldId(fieldId);
        if (onFieldSelect) onFieldSelect({ fieldId, cropId });
      });

      // --- 🔙 Click empty map: hide fields, show farms ---
      mapInstance.on("click", (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ["fields-layer", "farms-layer"],
        });
        if (!features.length) {
          mapInstance.setLayoutProperty("fields-layer", "visibility", "none");
          mapInstance.setLayoutProperty("farms-layer", "visibility", "visible");
          setShowFields(false);
        }
      });

      // --- Hover popup (unchanged) ---
      let hoverPopup = null;
      let activeLayer = null;
      const showHoverPopup = (e, layerId) => {
        const props = e.features[0].properties || {};
        const geom = e.features[0].geometry || {};
        const type = geom.type || props.type || "Unknown";

        if (hoverPopup) {
          hoverPopup.remove();
          hoverPopup = null;
        }
        activeLayer = layerId;

        let content = `<div style="font-size:13px; line-height:1.4;">`;
        content += `<strong>Type:</strong> ${props.type || type}<br>`;
        if (props.name) content += `<strong>Name:</strong> ${props.name}<br>`;
        if (props.owner)
          content += `<strong>Owner:</strong> ${props.owner}<br>`;
        if (props.farm) content += `<strong>Farm:</strong> ${props.farm}<br>`;
        if (props.cropId)
          content += `<strong>Crop ID:</strong> ${props.cropId}<br>`;
        content += "</div>";

        hoverPopup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        })
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(mapInstance);
      };

      const hideHoverPopup = (layerId) => {
        if (activeLayer === layerId) {
          mapInstance.getCanvas().style.cursor = "";
          if (hoverPopup) {
            hoverPopup.remove();
            hoverPopup = null;
          }
          activeLayer = null;
        }
      };

      ["farms-layer", "fields-layer", "roads-layer", "points-layer"].forEach(
        (layerId) => {
          if (mapInstance.getLayer(layerId)) {
            mapInstance.on("mouseenter", layerId, (e) => {
              mapInstance.getCanvas().style.cursor = "pointer";
              showHoverPopup(e, layerId);
            });
            mapInstance.on("mouseleave", layerId, () =>
              hideHoverPopup(layerId)
            );
          }
        }
      );
    }

    // --- Update dynamic data ---
    if (mapInstance.getSource("data"))
      mapInstance.getSource("data").setData(farmsGeoJSON);

    // --- Highlight field + visibility sync ---
    if (mapInstance.getLayer("fields-layer")) {
      mapInstance.setPaintProperty("fields-layer", "fill-color", [
        "case",
        ["==", ["get", "id"], selectedFieldId],
        "#0047AB",
        "#FFA500",
      ]);
      mapInstance.setLayoutProperty(
        "fields-layer",
        "visibility",
        showFields ? "visible" : "none"
      );
    }

    // ✅ Hide farms when fields visible, show otherwise
    if (mapInstance.getLayer("farms-layer")) {
      mapInstance.setLayoutProperty(
        "farms-layer",
        "visibility",
        showFields ? "none" : "visible"
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

      // ✅ Reset field filter so none show
      if (mapInstance.getLayer("fields-layer")) {
        mapInstance.setFilter("fields-layer", [
          "all",
          ["==", ["geometry-type"], "Polygon"],
          ["==", ["get", "type"], "field"],
          ["==", ["get", "farm"], ""], // no match
        ]);
        mapInstance.setLayoutProperty("fields-layer", "visibility", "none");
      }

      // ✅ Show farms
      if (mapInstance.getLayer("farms-layer")) {
        mapInstance.setLayoutProperty("farms-layer", "visibility", "visible");
      }

      setShowFields(false);
    }
  };

  return { mapContainer, handleRecenter };
};

export default useMapViewModel;
