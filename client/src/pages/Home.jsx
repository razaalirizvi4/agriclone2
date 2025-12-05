import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getLocations } from "../features/location/location.slice";
import { getEvents } from "../features/eventStream/eventStream.slice";
import { getCrops, setSelectedCropId } from "../features/cropModule/crop.slice";
import { dashboardSchema } from "../data/dashboardSchema";
import { componentMapper } from "../components/componentMapper";
// import "./Dashboard.css";

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
const getLocationTypeName = (typeValue) => {
  if (!typeValue) {
    return "";
  }
  if (typeof typeValue === "string") {
    return typeValue;
  }
  return typeValue.name || typeValue.type || "";
};

function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedFieldId, setSelectedFieldId] = useState(null);

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
      const fields = locations.filter(
        (loc) => getLocationTypeName(loc.type) === "Field"
      );
      if (fields.length > 0) {
        const fieldIds = fields.map((f) => f._id);
        const cropIds = fields.map((f) => f.attributes.crop_id).filter(Boolean);

        dispatch(getEvents({ field_Ids: fieldIds.join(",") }));
        dispatch(getCrops({ ids: cropIds.join(",") }));

        // Set default field
        if (!selectedFieldId) {
          const firstField = fields[0];
          if (firstField) {
            setSelectedFieldId(firstField._id);
            handleFieldSelect(firstField._id, firstField.crop_id);
          } else {
            console.warn(
              "Field does not exist. No default field will be selected."
            );
            setSelectedFieldId(null);
          }
        }
      }
    }
  }, [selectedFieldId, status, locations]);

  const handleFieldSelect = (fieldId, cropId) => {
    // Only handle field selection updates
    setSelectedFieldId(fieldId);
    dispatch(setSelectedCropId(cropId));
    // Data filtering (events, crops, weather) is handling inside dashboardSchema
  };

  // Callback to handle field selection
  const callbacks = {
    onFieldSelect: ({ fieldId, cropId }) => handleFieldSelect(fieldId, cropId),
  };

  // Prepare data for schema functions
  const data = {
    dloc: locations,
    dEv: events,
    crops,
  };

  // Sort schema by order
  const sortedSchema = [...dashboardSchema].sort((a, b) => a.order - b.order);

  // Show loading state
  if (status === "loading") {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh'
      }}>
        <div style={{ fontSize: '18px', color: '#6c757d' }}>Loading dashboard...</div>
      </div>
    );
  }

  const farm = locations.find(
    (loc) => getLocationTypeName(loc.type) === "Farm"
  );

  return (
    <div className="dashboard-grid">
      {/* Edit Farm button at top of dashboard */}
      <div style={{ gridColumn: "span 12", marginBottom: "8px" }}>
        {/* <button
          type="button"
          onClick={() => farm && navigate("/wizard", { state: { farmId: farm._id } })}
          disabled={!farm}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: farm ? "#4a5d23" : "#cbd5e1",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: farm ? "pointer" : "not-allowed",
          }}
        >
          {farm ? "Edit Farm in Wizard" : "No farm available to edit"}
        </button> */}
      </div>
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
