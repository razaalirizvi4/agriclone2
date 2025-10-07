import axios from 'axios';

const API_URL = 'http://localhost:5000/api/eventstream';

const getEvents = (params, token) => {
  return axios.get(API_URL, {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const updateEventStatus = (eventId, data, token) => {
  return axios.put(`${API_URL}/pull/${eventId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

const eventStreamService = {
  getEvents,
  updateEventStatus
};

export default eventStreamService;
