import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../features/location/location.slice';

const LocationPage = () => {
  const dispatch = useDispatch();
  const { locations, status } = useSelector((state) => state.locations);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Farm',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentLocationId, setCurrentLocationId] = useState(null);

  useEffect(() => {
    dispatch(getLocations());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      dispatch(updateLocation({ id: currentLocationId, locationData: formData }));
    } else {
      dispatch(createLocation(formData));
    }
    setFormData({ name: '', type: 'Farm' });
    setIsEditing(false);
    setCurrentLocationId(null);
  };

  const handleEdit = (location) => {
    setIsEditing(true);
    setCurrentLocationId(location._id);
    setFormData({ name: location.name, type: location.type });
  };

  const handleDelete = (id) => {
    dispatch(deleteLocation(id));
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Location Management</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Location Name"
          required
        />
        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="Farm">Farm</option>
          <option value="Field">Field</option>
          <option value="Building">Building</option>
          <option value="Road">Road</option>
          <option value="Truck">Truck</option>
        </select>
        <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
      </form>
      <ul>
        {locations.map((location) => (
          <li key={location._id}>
            {location.name} ({location.type})
            <button onClick={() => handleEdit(location)}>Edit</button>
            <button onClick={() => handleDelete(location._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LocationPage;