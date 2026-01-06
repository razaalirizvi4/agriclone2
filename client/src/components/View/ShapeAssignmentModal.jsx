import React, { useState } from 'react';
import { calculateShapeArea } from '../../utils/shapeUtils';

const ShapeAssignmentModal = ({ 
  shape, 
  fields, 
  onAssign, 
  onCancel, 
  isVisible 
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [shapeName, setShapeName] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [radius, setRadius] = useState('');

  if (!isVisible || !shape) return null;

  const shapeType = shape.properties?.shapeType; // 'square', 'circle', or undefined (polygon)
  const isSquare = shapeType === 'square';
  const isCircle = shapeType === 'circle';

  const handleAssign = () => {
    if (!selectedFieldId || !shapeName.trim()) {
      alert('Please select a field and enter a name for this land addition');
      return;
    }

    onAssign({
      fieldId: selectedFieldId,
      shapeName: shapeName.trim(),
      shape: shape,
      length: isSquare ? length : null,
      width: isSquare ? width : null,
      radius: isCircle ? radius : null
    });

    // Reset form
    setSelectedFieldId('');
    setShapeName('');
    setLength('');
    setWidth('');
    setRadius('');
  };

  const shapeArea = calculateShapeArea(shape);

  return (
    <div className="modal-overlay">
      <div className="modal-content shape-assignment-modal">
        <div className="modal-header">
          <h3>Add Land to Field</h3>
          <button 
            type="button" 
            className="modal-close" 
            onClick={onCancel}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="shape-info">
            <h4>Land Addition Details</h4>
            <p><strong>Shape:</strong> {shapeType ? (shapeType.charAt(0).toUpperCase() + shapeType.slice(1)) : 'Polygon'}</p>
            <p><strong>Area:</strong> {shapeArea}</p>
            <p className="shape-info-note">
              This area will be added to the selected field.
            </p>
          </div>
          
          <div className="form-group">
            <label htmlFor="shapeName">Description:</label>
            <input
              id="shapeName"
              type="text"
              value={shapeName}
              onChange={(e) => setShapeName(e.target.value)}
              placeholder="e.g., 'North extension', 'Additional plot'"
              className="form-input"
            />
          </div>

          {isSquare && (
            <div style={{display: 'flex', gap: '1rem'}}>
              <div className="form-group" style={{flex: 1}}>
                <label htmlFor="shapeLength">Length (m):</label>
                <input
                  id="shapeLength"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="Length"
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{flex: 1}}>
                <label htmlFor="shapeWidth">Width (m):</label>
                <input
                  id="shapeWidth"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Width"
                  className="form-input"
                />
              </div>
            </div>
          )}

          {isCircle && (
            <div className="form-group">
              <label htmlFor="shapeRadius">Radius (m):</label>
              <input
                id="shapeRadius"
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="Radius"
                className="form-input"
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="fieldSelect">Add to Field:</label>
            <select
              id="fieldSelect"
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              className="form-select"
            >
              <option value="">Select a field...</option>
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.name} ({field.area})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleAssign}
            disabled={!selectedFieldId || !shapeName.trim()}
          >
            Add to Field
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShapeAssignmentModal;