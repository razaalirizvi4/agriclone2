import React from "react";
import { dashboardSchema } from "../data/dashboardSchema";
import { componentMapper } from "../components/componentMapper";
import { dataSources } from "../data/dataSources";

function Home() {
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