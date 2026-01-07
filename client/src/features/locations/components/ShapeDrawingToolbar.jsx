import React from 'react';

const ShapeDrawingToolbar = ({ 
  onShapeSelect,
  activeShape,
  onCancel, 
  isDrawing = false 
}) => {
  const shapes = [
    { id: 'circle', name: 'Circle', icon: '⭕' },
    { id: 'square', name: 'Square', icon: '⬜' },
    { id: 'polygon', name: 'Polygon', icon: '⬟' }
  ];

  return (
    <div className="shape-drawing-toolbar">
      <div className="shape-toolbar-header">
        <h4>Add Land to Field</h4>
        <p className="shape-toolbar-hint">
          {isDrawing 
            ? `Click on the map to place your ${activeShape}` 
            : 'Select a shape to draw, or use the polygon tool (⬟) in the top-left corner'
          }
        </p>
      </div>
      
      <div className="shape-buttons">
        {shapes.map((shape) => (
          <button
            key={shape.id}
            type="button"
            className={`shape-button ${activeShape === shape.id ? 'shape-button--active' : ''}`}
            onClick={() => onShapeSelect(shape.id)}
            disabled={isDrawing && activeShape !== shape.id}
          >
            <span className="shape-icon">{shape.icon}</span>
            <span className="shape-name">{shape.name}</span>
          </button>
        ))}
      </div>
      
      <div className="shape-toolbar-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          {isDrawing ? 'Cancel Drawing' : 'Done Adding Land'}
        </button>
      </div>
    </div>
  );
};

export default ShapeDrawingToolbar;