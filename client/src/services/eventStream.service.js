import axios from "axios";

const API_URL = "http://localhost:5000/api/eventstream";

// ✅ Helper to attach token
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

// ✅ Get all events (with token)
const getEvents = (params = {}) => {
  return axios.get(API_URL, {
    params,
    headers: getAuthHeader(),
  });
};

// ✅ Update event status (with token)
const updateEventStatus = (eventId, data) => {
  return axios.put(`${API_URL}/pull/${eventId}`, data, {
    headers: getAuthHeader(),
  });
};

// ✅ Create field lifecycle events
const createFieldEvents = (data) => {
  return axios.post(`${API_URL}/field-events`, data, {
    headers: getAuthHeader(),
  });
};

// ✅ Delete events by field IDs
const deleteEventsByFieldIds = (fieldIds) => {
  return axios.delete(`${API_URL}/field-events`, {
    data: { fieldIds },
    headers: getAuthHeader(),
  });
};

const eventStreamService = {
  getEvents,
  updateEventStatus,
  createFieldEvents,
  deleteEventsByFieldIds,
};

export default eventStreamService;
