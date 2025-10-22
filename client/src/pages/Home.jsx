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

  const { locations, status, error } = useSelector((state) => state.locations);
  const { events } = useSelector((state) => state.eventStream);
  const { crops } = useSelector((state) => state.crops);

  // Fetch data
  useEffect(() => {
    dispatch(getEvents());
    dispatch(getLocations());
    dispatch(getCrops());
  }, [dispatch]);

  // Log locations status
  useEffect(() => {
    if (status === "succeeded") {
      console.log("✅ Fetched locations:", locations);
    } else if (status === "failed") {
      console.error("❌ Error fetching locations:", error);
    }
let firstField=locations.find((loc)=>loc.type==="Field")
  if (firstField && !selectedFieldId) {

      setSelectedFieldId(firstField._id);}



    
  }, [selectedFieldId,status, locations, error]);

  // Callback to handle field selection
  const callbacks = {
    onFieldSelect: ({ fieldId, cropId }) => {
      console.log("🟢 Field selected:", fieldId);
      console.log("🟢 Crop selected:", cropId);

      setSelectedFieldId(fieldId);
      dispatch(setSelectedCropId(cropId));
    },
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
            typeof value === "function"
              ? value(
                  data,
                  selectedFieldId 
                )
              : value;
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
