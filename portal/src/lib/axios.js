//portal/src/lib/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://fireemergency.up.railway.app/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include authToken
api.interceptors.request.use((config) => {
  const authToken = localStorage.getItem("authToken");
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
