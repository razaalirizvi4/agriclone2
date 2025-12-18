import axios from "axios";

const API_URL = "http://localhost:5000/api/permissions";

// Helper to attach token for authenticated requests
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

const getPermissions = (params = {}) => {
  return axios.get(API_URL, {
    params,
    headers: getAuthHeader(),
  });
};

const createPermission = (payload) => {
  return axios.post(API_URL, payload, {
    headers: getAuthHeader(),
  });
};

const updatePermission = (id, payload) => {
  return axios.put(`${API_URL}/${id}`, payload, {
    headers: getAuthHeader(),
  });
};

const deletePermission = (id) => {
  return axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });
};

const permissionsService = {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
};

export default permissionsService;
