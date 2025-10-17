
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/crops'; // Placeholder, will verify

const getCrops = () => {
  return axios.get(API_URL);
};

const createCrop = (cropData) => {
  return axios.post(API_URL, cropData);
};

const updateCrop = (id, cropData) => {
  return axios.put(`${API_URL}/${id}`, cropData);
};

const deleteCrop = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

export default {
  getCrops,
  createCrop,
  updateCrop,
  deleteCrop,
};
