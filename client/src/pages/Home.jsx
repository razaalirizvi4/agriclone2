import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLocations } from "../features/location/location.slice";
import { getEvents } from "../features/eventStream/eventStream.slice";
import { getCrops, setSelectedCropId } from "../features/cropModule/crop.slice";
import { dashboardSchema } from "../data/dashboardSchema";
import { componentMapper } from "../components/componentMapper";

// prepare ids for events and crops
// 1. first filter location for field:
// 1.1 prepare fieldIds through looping
// 1.1.1 prepare cropsIds
// 1.2 getEvents(Fieldids=id1,id2)
// 1.3 getCrops(ids=id1,id2)

// 2. set first for selected field
// 2.1. field[0] -> store in function (setSelectedField)
// 2.2. selected field -> onclik eventlistner get field id
// 2.2. according to that field id the crops and events will change
function Home() {
  const dispatch = useDispatch();
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [weather, setWeather] = useState({});

  const { locations, status } = useSelector((state) => state.locations);
  const { events } = useSelector((state) => state.eventStream);
  const { crops } = useSelector((state) => state.crops);

  // Fetch data
  useEffect(() => {
    dispatch(getLocations());
  }, []);

  // Log locations status
  useEffect(() => {
    if (status === "succeeded" && locations.length > 0) {
      const fields = locations.filter((loc) => loc.type === "Field");
      if (fields.length > 0) {
        const fieldIds = fields.map((f) => f._id);
        const cropIds = fields.map((f) => f.attributes.crop_id).filter(Boolean);

        dispatch(getEvents({ field_Ids: fieldIds.join(",") }));
        dispatch(getCrops({ ids: cropIds.join(",") }));

        // Set default field
        if (!selectedFieldId) {
          const firstField = fields[0];
          setSelectedFieldId(firstField._id);
          handleFieldSelect(firstField._id, firstField.crop_id);
        }
      }
    }
  }, [selectedFieldId, status, locations]);

  const handleFieldSelect = (fieldId, cropId) => {
    setSelectedFieldId(fieldId);
    dispatch(setSelectedCropId(cropId));

    // Filter events for this field
    const eventsForField = events.filter((ev) => ev.field_id === fieldId);
    setFilteredEvents(eventsForField);

    // Find crop for this field
    const cropForField = crops.find((c) => c._id === cropId);
    setSelectedCrop(cropForField);

    // Get weather from selected field
    const selectedField = locations.find((f) => f._id === fieldId);
    setWeather(selectedField?.weather || {});
  };

  // Callback to handle field selection
  const callbacks = {
    onFieldSelect: ({ fieldId, cropId }) => handleFieldSelect(fieldId, cropId),
  };

  // Prepare data for schema functions
  const data = {
    dloc: locations,
    dEv: filteredEvents.length ? filteredEvents : events,
    crops: selectedCrop ? [selectedCrop] : crops,
    weather,
  };

  // Sort schema by order
  const sortedSchema = [...dashboardSchema].sort((a, b) => a.order - b.order);

  return (
    <div className="dashboard-grid">
      {sortedSchema.map((item) => {
        const Component = componentMapper[item.key];
        if (!Component) {
          return <div key={item.key}>Component not found: {item.key}</div>;
        }

        // Generate props from schema
        const props = Object.entries(item.props).reduce((acc, [key, value]) => {
          acc[key] =
            typeof value === "function" ? value(data, selectedFieldId) : value;
          return acc;
        }, {});

        // ✅ Inject callback only into map
        if (item.key === "map") {
          props.onFieldSelect = callbacks.onFieldSelect;
          props.selectedFieldId = selectedFieldId;
        }

        const gridStyle = { gridColumn: `span ${item.colSpan}` };

        return (
          <div key={item.key} style={gridStyle}>
            <Component {...props} />
          </div>
        );
      })}
    </div>
  );
}

export default Home;
