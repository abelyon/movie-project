import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { LARAVEL_BASE } from "../api/client";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

function resolveWsHost(): string {
  const configured = import.meta.env.VITE_REVERB_HOST;
  if (configured && configured.trim().length > 0) {
    return configured.trim();
  }

  return new URL(LARAVEL_BASE).hostname;
}

function resolveWsPort(): number {
  const configured = Number(import.meta.env.VITE_REVERB_PORT);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  return import.meta.env.PROD ? 443 : 8080;
}

const scheme = import.meta.env.VITE_REVERB_SCHEME ?? (import.meta.env.PROD ? "https" : "http");
const forceTLS = scheme === "https";

export function createEcho(token?: string): Echo<"reverb"> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: resolveWsHost(),
    wsPort: resolveWsPort(),
    wssPort: resolveWsPort(),
    forceTLS,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${LARAVEL_BASE}/broadcasting/auth`,
    auth: {
      headers,
    },
    withCredentials: true,
  });
}
