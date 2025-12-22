import axios from "axios";

const API_URL = "http://localhost:5000/api/users";

// Helper to attach token for authenticated requests
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

const getUsers = (params = {}) => {
  return axios.get(API_URL, {
    params,
    headers: getAuthHeader(),
  });
};

const createUser = (payload) => {
  return axios.post(API_URL, payload, {
    headers: getAuthHeader(),
  });
};

const updateUser = (id, payload) => {
  return axios.put(`${API_URL}/${id}`, payload, {
    headers: getAuthHeader(),
  });
};

const deleteUser = (id) => {
  return axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeader(),
  });
};

const userService = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;
