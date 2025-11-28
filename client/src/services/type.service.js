import axios from "axios";

const API_URL = "http://localhost:5000/api/types"; // Assuming a /api/types endpoint

// Helper to attach token for authenticated requests
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

// Get all types
const getTypes = (params = {}) => {
  return axios.get(API_URL, {
    params,
    headers: getAuthHeader(),
  });
};

// Create a new type
const createType = (typeData) => {
  return axios.post(API_URL, typeData, {
    headers: getAuthHeader(),
  });
};

// Update an existing type
const updateType = (typeId, typeData) => {
  return axios.put(`${API_URL}/${typeId}`, typeData, {
    headers: getAuthHeader(),
  });
};

// Delete a type
const deleteType = (typeId) => {
  return axios.delete(`${API_URL}/${typeId}`, {
    headers: getAuthHeader(),
  });
};

const typeService = {
  getTypes,
  createType,
  updateType,
  deleteType,
};

export default typeService;
