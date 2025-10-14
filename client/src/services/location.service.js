
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/locations';

const getLocations = () => {
  return axios.get(API_URL);
};

const createLocation = (locationData) => {
  return axios.post(API_URL, locationData);
};

const updateLocation = (id, locationData) => {
  return axios.put(`${API_URL}/${id}`, locationData);
};

const deleteLocation = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

export default {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
