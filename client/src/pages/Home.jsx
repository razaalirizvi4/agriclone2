import React from "react";
import { dashboardSchema } from "../data/dashboardSchema";
import { componentMapper } from "../components/componentMapper";
import { dataSources } from "../data/dataSources";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { getLocations } from "../features/location/location.slice";
import { getEvents } from "../features/eventStream/eventStream.slice";



function Home() {
  const dispatch = useDispatch();

  // ✅ Access Redux state
  const { locations, status, error } = useSelector((state) => state.locations);
  const { events } = useSelector((state) => state.eventStream);

  useEffect(() => {
     dispatch(getEvents());
    dispatch(getLocations());
  }, [dispatch]);

  // ✅ Log data when fetched
  useEffect(() => {
    if (status === "succeeded") {
      console.log("Fetched locations from MongoDB:", locations);
      console.log("Fetched events from MongoDB:", events);
    } else if (status === "failed") {
      console.error("Error fetching locations:", error);
    }
  }, [events, status, locations, error]);


  const sortedSchema = [...dashboardSchema].sort((a, b) => a.order - b.order);

  return (
    <div className="dashboard-grid">
      {sortedSchema.map((item) => {
        const Component = componentMapper[item.key];
        if (!Component) {
          return <div key={item.key}>Component not found</div>;
        }

        const props = Object.entries(item.props).reduce(
          (acc, [key, value]) => {
            acc[key] = dataSources[value] || value;
            return acc;
          },
          {}
        );

        const gridStyle = {
          gridColumn: `span ${item.colSpan}`,
        };

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