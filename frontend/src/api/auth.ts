import axios from "axios";
import api, { LARAVEL_BASE } from "./client";

export type User = {
  id: number;
  public_user_id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

function xsrfHeader(): Record<string, string> {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  if (!match) return {};
  return { "X-XSRF-TOKEN": decodeURIComponent(match[1]) };
}

export async function getCsrfCookie(): Promise<void> {
  await axios.get("/sanctum/csrf-cookie", {
    withCredentials: true,
    baseURL: LARAVEL_BASE || undefined,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  await getCsrfCookie();
  const { data } = await api.post<{ user: User }>(
    `${LARAVEL_BASE}/login`,
    { email, password },
    { headers: xsrfHeader() },
  );
  return data;
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export async function register(input: RegisterInput): Promise<{ user: User }> {
  await getCsrfCookie();
  const { data } = await api.post<{ user: User }>(
    `${LARAVEL_BASE}/register`,
    input,
    { headers: xsrfHeader() },
  );
  return data;
}

export async function logout(): Promise<void> {
  await api.post(
    `${LARAVEL_BASE}/logout`,
    undefined,
    { headers: xsrfHeader() },
  );
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<User>("/user");
    return data;
  } catch {
    return null;
  }
}
