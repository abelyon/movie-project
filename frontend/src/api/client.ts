import axios from "axios";
import { emitAppToast } from "../utils/toastBus";

/**
 * Laravel registers `routes/api.php` under the `/api` prefix.
 * Accept either `https://api.example.com` or `https://api.example.com/api` in env.
 */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  let s = typeof raw === "string" ? raw.trim() : "";
  if (!s) {
    if (import.meta.env.DEV) {
      // Keep hostnames aligned in local dev (localhost vs 127.0.0.1) so Sanctum session cookies stay stateful.
      const localHost = window.location.hostname === "localhost" ? "localhost" : "127.0.0.1";
      return `http://${localHost}:8000/api`;
    }
    throw new Error(
      "Missing VITE_API_BASE_URL. Set it at build time (e.g. Railway Variables) to your Laravel public URL, with or without /api.",
    );
  }
  s = s.replace(/\/+$/, "");
  if (import.meta.env.DEV) {
    try {
      const parsed = new URL(s);
      const isLoopbackHost =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      const currentIsLoopback =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLoopbackHost && currentIsLoopback) {
        parsed.hostname = window.location.hostname;
        s = parsed.toString().replace(/\/+$/, "");
      }
    } catch {
      // keep original value if env URL is not parseable
    }
  }
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
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status as number | undefined;
    const message = String(error?.response?.data?.message ?? "");
    const method = String(error?.config?.method ?? "get").toLowerCase();
    const isWriteAction = method !== "get";

    if (isWriteAction && status === 403 && /verify|verified|email/i.test(message)) {
      emitAppToast({
        type: "warning",
        title: "Email verification required",
        message: "Verify your email to use this action.",
      });
    }

    return Promise.reject(error);
  },
);

export default api;
export { LARAVEL_BASE };
