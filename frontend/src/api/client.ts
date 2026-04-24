import axios from "axios";

/**
 * Laravel registers `routes/api.php` under the `/api` prefix.
 * Accept either `https://api.example.com` or `https://api.example.com/api` in env.
 */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  let s = typeof raw === "string" ? raw.trim() : "";
  if (!s) {
    if (import.meta.env.DEV) return "http://127.0.0.1:8000/api";
    throw new Error(
      "Missing VITE_API_BASE_URL. Set it at build time (e.g. Railway Variables) to your Laravel public URL, with or without /api.",
    );
  }
  s = s.replace(/\/+$/, "");
  if (!s.endsWith("/api")) {
    s = `${s}/api`;
  }
  return s;
}

const API_BASE_URL = resolveApiBaseUrl();
const LARAVEL_BASE =
  API_BASE_URL.replace(/\/api\/?$/, "") || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(match[1]);
  }
  return config;
});

export default api;
export { LARAVEL_BASE };
