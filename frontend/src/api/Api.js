import axios from "axios";

// 1. Get the root URL for images (e.g., http://192.168.0.37:5555)
export const IMAGE_BASE_URL = process.env.REACT_APP_BASE_URL;

// 2. Get the API URL for requests (e.g., http://192.168.0.37:5555/api/v1)
const baseURL = process.env.REACT_APP_API_URL;

if (!baseURL || !IMAGE_BASE_URL) {
  console.error("CRITICAL ERROR: Environment variables are not defined.");
}

const api = axios.create({
  baseURL,
});

// 🔐 Attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("driverToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handler
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;