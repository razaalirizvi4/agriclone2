
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/crops'; // Placeholder, will verify

const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const getCrops = (params = {}) => {
  return axios.get(API_URL, { params, headers: getAuthHeader() });
};

const getCropByName = (name) => {
  return getCrops({ name });
};

const createCrop = (cropData) => {
  return axios.post(API_URL, cropData,{ headers: getAuthHeader() });
};

const updateCrop = (id, cropData) => {
  return axios.put(`${API_URL}/${id}`, cropData,{ headers: getAuthHeader() });
};

const deleteCrop = (id) => {
  return axios.delete(`${API_URL}/${id}`,{ headers: getAuthHeader() });
};

export default {
  getCrops,
  getCropByName,
  createCrop,
  updateCrop,
  deleteCrop,
};
