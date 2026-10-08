import axios from 'axios';

// In production, always use the deployed backend.
// In local dev, use localhost.
const API_URL = import.meta.env.DEV
  ? 'http://localhost:8000/api/'
  : 'https://codeassess-backend-i1ec.onrender.com/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    }
    return Promise.reject(err);
  }
);

export default api;