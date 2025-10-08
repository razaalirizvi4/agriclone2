export const farmsGeoJSON = {
    type: "FeatureCollection",
    features: [
      // Farm 1 - Green Valley Farm
      {
        type: "Feature",
        properties: {
          type: "farm",
          name: "Green Valley Farm",
          owner: "John Doe",
          size: "50 acres"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [74.560, 31.547],  // bottom-left
            [74.568, 31.547],  // bottom-right
            [74.568, 31.552],  // top-right
            [74.560, 31.552],  // top-left
            [74.560, 31.547]   // close polygon
          ]]
        }
      },
      {
        type: "Feature",
        properties: {
          type: "field",
          name: "Field A1",
          crop: "Wheat",
          area: "10 acres",
          farm: "Green Valley Farm"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [74.561, 31.548],
            [74.564, 31.548],
            [74.564, 31.551],
            [74.561, 31.551],
            [74.561, 31.548]
          ]]
        }
      },
      {
        type: "Feature",
        properties: {
          type: "field",
          name: "Field A2",
          crop: "Corn",
          area: "15 acres",
          farm: "Green Valley Farm"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [74.564, 31.548],
            [74.567, 31.548],
            [74.567, 31.551],
            [74.564, 31.551],
            [74.564, 31.548]
          ]]
        }
      },
  
      // Farm 2 - Sunny Acres Farm
      {
        type: "Feature",
        properties: {
          type: "farm",
          name: "Sunny Acres Farm",
          owner: "Jane Smith",
          size: "70 acres"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [74.570, 31.553],  // bottom-left
            [74.578, 31.553],  // bottom-right
            [74.578, 31.558],  // top-right
            [74.570, 31.558],  // top-left
            [74.570, 31.553]   // close polygon
          ]]
        }
      },
      {
        type: "Feature",
        properties: {
          type: "field",
          name: "Field B1",
          crop: "Rice",
          area: "20 acres",
          farm: "Sunny Acres Farm"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [74.571, 31.554],
            [74.574, 31.554],
            [74.574, 31.557],
            [74.571, 31.557],
            [74.571, 31.554]
          ]]
        }
      },
      {
        type: "Feature",
        properties: {
          type: "field",
          name: "Field B2",
          crop: "Sugarcane",
          area: "25 acres",
          farm: "Sunny Acres Farm"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [74.574, 31.554],
            [74.577, 31.554],
            [74.577, 31.557],
            [74.574, 31.557],
            [74.574, 31.554]
          ]]
        }
      }
    ]
  };