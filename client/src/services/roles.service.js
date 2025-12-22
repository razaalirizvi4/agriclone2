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

const getRoles = (params = {}) => {
  return axios.get(`${API_URL}/roles`, {
    params,
    headers: getAuthHeader(),
  });
};

const rolesService = {
  getRoles,
};

export default rolesService;