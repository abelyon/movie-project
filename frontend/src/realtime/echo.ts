import Echo from "laravel-echo";
import Pusher from "pusher-js";
import api, { LARAVEL_BASE } from "../api/client";

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

function readCookie(name: string): string | null {
  const key = `${name}=`;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(key)) {
      const value = part.slice(key.length);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

export function createEcho(token?: string): Echo<"reverb"> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
  const csrfToken = readCookie("XSRF-TOKEN");
  if (csrfToken) {
    headers["X-XSRF-TOKEN"] = csrfToken;
  }
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
    authEndpoint: `${LARAVEL_BASE}/api/broadcasting/auth`,
    auth: {
      headers,
    },
    authorizer: (channel) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, data: Pusher.ChannelAuthorizationData | null) => void,
      ) => {
        void api
          .post(
            `${LARAVEL_BASE}/api/broadcasting/auth`,
            {
              socket_id: socketId,
              channel_name: channel.name,
            },
            {
              headers,
            },
          )
          .then(({ data }) => callback(null, data as Pusher.ChannelAuthorizationData))
          .catch((error: unknown) => {
            callback(error instanceof Error ? error : new Error("Broadcast authorization failed"), null);
          });
      },
    }),
    withCredentials: true,
  });
}
