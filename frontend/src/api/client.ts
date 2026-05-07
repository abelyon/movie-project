import axios, { type AxiosError } from "axios";

function resolvedRequestUrl(config: {
  baseURL?: string;
  url?: string;
}): string {
  const url = config.url ?? "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const base = (config.baseURL ?? "").replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

function isBroadcastingAuthRequest(error: AxiosError): boolean {
  const cfg = error.config;
  if (!cfg) return false;
  return resolvedRequestUrl(cfg).includes("/broadcasting/auth");
}

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

/** Origin for Fortify + `/sanctum/csrf-cookie` (never ends with `/api`). Strip repeated `/api` segments from typos like `.../api/api`. */
function laravelOriginFromApiBaseUrl(apiBaseUrl: string): string {
  const trimmed = apiBaseUrl.replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    const segments = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    while (segments.length && segments[segments.length - 1].toLowerCase() === "api") {
      segments.pop();
    }
    url.pathname = segments.length ? `/${segments.join("/")}` : "";
    const out = `${url.origin}${url.pathname}`.replace(/\/+$/, "");
    return out || url.origin;
  } catch {
    let fallback = trimmed;
    while (/\/api$/i.test(fallback)) {
      fallback = fallback.replace(/\/api$/i, "").replace(/\/+$/, "");
    }
    return fallback || "http://127.0.0.1:8000";
  }
}

const API_BASE_URL = resolveApiBaseUrl();
const LARAVEL_BASE = laravelOriginFromApiBaseUrl(API_BASE_URL);

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

let onAuthExpired: (() => void) | null = null;

export function setAuthExpiredHandler(handler: (() => void) | null): void {
  onAuthExpired = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if ((status === 401 || status === 419) && !isBroadcastingAuthRequest(error)) {
      onAuthExpired?.();
    }
    return Promise.reject(error);
  },
);

export default api;
export { LARAVEL_BASE };
