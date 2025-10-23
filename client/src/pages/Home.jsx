import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLocations } from "../features/location/location.slice";
import { getEvents } from "../features/eventStream/eventStream.slice";
import { getCrops, setSelectedCropId } from "../features/cropModule/crop.slice";
import { dashboardSchema } from "../data/dashboardSchema";
import { componentMapper } from "../components/componentMapper";

function Home() {
  const dispatch = useDispatch();
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  const { locations, status } = useSelector((state) => state.locations);
  const { events } = useSelector((state) => state.eventStream);
  const { crops } = useSelector((state) => state.crops);

  // Fetch data
  useEffect(() => {
     dispatch(getEvents());
    dispatch(getLocations());
    //  dispatch(getCrops());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log locations status
  useEffect(() => {
    if (status === "succeeded" && locations.length > 0) {
      const fields = locations.filter((loc) => loc.type === "Field");
      if (fields.length > 0) {
        const fieldIds = fields.map((f) => f._id);
        const cropIds = fields.map((f) => f.attributes.crop_id).filter(Boolean);

        console.log("Field Id's",fieldIds) //remove this after sending fieldIds in dispatch.
          // dispatch(getEvents(fieldIds));
          dispatch(getCrops(cropIds));

        // Set default field
        if (!selectedFieldId) {
          const firstField = fields[0];
          setSelectedFieldId(firstField._id);

          // Trigger same logic as manual selection
          handleFieldSelect(firstField._id, firstField.crop_id);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFieldId, status, locations]);

  const handleFieldSelect = (fieldId, cropId) => {
    console.log("🟢 Field selected:", fieldId);
    console.log("🟢 Crop selected:", cropId);

    setSelectedFieldId(fieldId);
    dispatch(setSelectedCropId(cropId));

    // Filter events for this field
    const filteredEvents = events.filter((ev) => ev.field_id === fieldId);

    // Filter crop object for this field
    const selectedCrop = crops.find((c) => c._id === cropId);

    // Prepare weather object from selected field
    const selectedField = locations.find((f) => f._id === fieldId);
    const weather = selectedField?.weather || {};

    console.log("🌾 Selected crop:", selectedCrop);
    console.log("📅 Filtered events:", filteredEvents);
    console.log("☀️ Weather:", weather);

    // You can now store this filtered data in local state or
    // directly pass it to dashboard components
  };

  // Callback to handle field selection
  const callbacks = {
    onFieldSelect: ({ fieldId, cropId }) => handleFieldSelect(fieldId, cropId),
  };

  // Prepare data for schema functions
  const data = { dloc: locations, dEv: events, crops: crops };

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
