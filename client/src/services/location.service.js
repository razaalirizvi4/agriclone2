
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/locations';

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const getLocations = () => {
  return axios.get(API_URL , { headers: getAuthHeader() });
};

const createLocation = (locationData) => {
  return axios.post(API_URL, locationData, { headers: getAuthHeader() });
};

const updateLocation = (id, locationData) => {
  return axios.put(`${API_URL}/${id}`, locationData, { headers: getAuthHeader() });
};

const deleteLocation = (id) => {
  return axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
};

export default {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
};
