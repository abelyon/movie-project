import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const LARAVEL_BASE = API_BASE_URL.replace(/\/api\/?$/, "") || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Send Laravel CSRF token from cookie on API requests
api.interceptors.request.use((config) => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(match[1]);
  }
  return config;
});

export default api;
export { LARAVEL_BASE };