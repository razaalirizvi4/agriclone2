import React, { useState } from "react";
import useMapViewModel from "../ViewModel/useMapViewModel";

const MapWizard = ({ locations, mode }) => {
  const [numberOfFields, setNumberOfFields] = useState("");
  const [isFarmDrawn, setIsFarmDrawn] = useState(false);
  
  const { 
    mapContainer, 
    showFieldsAndHideFarms, 
    drawnData,
    area 
  } = useMapViewModel({
    locations,
    mode
  });

  // Check if farm is drawn whenever drawnData changes
  React.useEffect(() => {
    if (drawnData && drawnData.features.length > 0) {
      setIsFarmDrawn(true);
    } else {
      setIsFarmDrawn(false);
    }
  }, [drawnData]);

  const handleNext = () => {
    if (!isFarmDrawn) {
      alert("Please draw a farm first!");
      return;
    }
    
    if (!numberOfFields || parseInt(numberOfFields) <= 0) {
      alert("Please enter a valid number of fields!");
      return;
    }

    // Break down farm into fields and show them
    breakdownFarmIntoFields();
    showFieldsAndHideFarms();
  };

  const handleFieldInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || (parseInt(value) > 0 && parseInt(value) <= 100)) {
      setNumberOfFields(value);
    }
  };

  // Function to break down farm into fields
  const breakdownFarmIntoFields = () => {
    if (!drawnData || !numberOfFields) return;
    
    console.log(`Breaking farm into ${numberOfFields} fields`);
    
    // TODO: Implement your field division logic here
    // This would typically:
    // 1. Take the drawn farm polygon from drawnData
    // 2. Use turf.js or similar to divide into equal parts
    // 3. Update the map source with new field geometries
    // 4. Set field properties (id, type, farm, etc.)
    
    // For now, this is a placeholder - you'll need to implement the actual division
    alert(`Farm will be divided into ${numberOfFields} fields. Implement the division logic in breakdownFarmIntoFields().`);
  };

  return (
    <div className="container" style={{ position: "relative" }}>
      <div className="map-container" ref={mapContainer}></div>
      
      {/* Instructions Panel */}
      <div style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        background: "white",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        maxWidth: "300px"
      }}>
        <h3 style={{ margin: "0 0 10px 0" }}>Farm Setup Wizard</h3>
        
        <div style={{ marginBottom: "15px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Step 1: Draw Farm</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Use the drawing tools to create your farm boundary
          </div>
          {area && (
            <div style={{ fontSize: "12px", color: "green", marginTop: "5px" }}>
              ✓ Farm Area: {area}
            </div>
          )}
          {!isFarmDrawn && (
            <div style={{ fontSize: "12px", color: "red", marginTop: "5px" }}>
              ⚠ Please draw a farm boundary
            </div>
          )}
        </div>

        <div style={{ marginBottom: "15px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Step 2: Divide into Fields</div>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
            How many fields do you want?
          </div>
          <input
            type="number"
            value={numberOfFields}
            onChange={handleFieldInputChange}
            placeholder="Enter number"
            min="1"
            max="100"
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              width: "100%",
              boxSizing: "border-box"
            }}
          />
          {!numberOfFields && (
            <div style={{ fontSize: "12px", color: "red", marginTop: "5px" }}>
              ⚠ Please enter number of fields
            </div>
          )}
        </div>

        <div>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Step 3: Review</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Click Next to see your fields
          </div>
        </div>
      </div>

      {/* Next Button */}
      <button 
        onClick={handleNext} 
        className="next-button"
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "14px"
        }}
        disabled={!isFarmDrawn || !numberOfFields}
      >
        Next - Show Fields
      </button>

      {/* Drawing Tools Info */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        background: "white",
        padding: "10px",
        borderRadius: "5px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        fontSize: "12px"
      }}>
        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Drawing Tools:</div>
        <div>• Click polygon tool to draw</div>
        <div>• Click to add points</div>
        <div>• Double-click to finish</div>
        <div>• Trash tool to delete</div>
      </div>
    </div>
  );
};

export default MapWizard;