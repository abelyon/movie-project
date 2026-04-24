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

const authClient = axios.create({
  baseURL: LARAVEL_BASE,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
  withCredentials: true,
});

authClient.interceptors.request.use((config) => {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    config.headers["X-XSRF-TOKEN"] = decodeURIComponent(match[1]);
  }
  return config;
});

export async function getCsrfCookie(): Promise<void> {
  await authClient.get("/sanctum/csrf-cookie");
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  await getCsrfCookie();
  const { data } = await authClient.post<{ user: User }>("/login", { email, password });
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
  const { data } = await authClient.post<{ user: User }>("/register", input);
  return data;
}

export async function logout(): Promise<void> {
  await authClient.post("/logout");
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<User>("/user");
    return data;
  } catch {
    return null;
  }
}
