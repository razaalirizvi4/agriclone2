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
    ]
  };