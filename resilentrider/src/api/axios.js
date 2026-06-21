import axios from 'axios';

// Use environment variable in production, fallback to localhost in dev
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Silently handle network errors so app doesn't crash
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error — backend not available, app uses localStorage fallback
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;
