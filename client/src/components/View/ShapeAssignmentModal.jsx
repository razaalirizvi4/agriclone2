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

  if (!isVisible || !shape) return null;

  const handleAssign = () => {
    if (!selectedFieldId || !shapeName.trim()) {
      alert('Please select a field and enter a name for this land addition');
      return;
    }

    onAssign({
      fieldId: selectedFieldId,
      shapeName: shapeName.trim(),
      shape: shape
    });

    // Reset form
    setSelectedFieldId('');
    setShapeName('');
  };

  const shapeArea = calculateShapeArea(shape);
  const shapeType = shape.properties?.shapeType || 'unknown';

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
            <p><strong>Shape:</strong> Polygon</p>
            <p><strong>Area:</strong> {shapeArea}</p>
            <p className="shape-info-note">
              This polygon will be added as a separate area belonging to the selected field.
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