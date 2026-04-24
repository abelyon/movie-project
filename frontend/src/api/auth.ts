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

export async function getCsrfCookie(): Promise<void> {
  await axios.get("/sanctum/csrf-cookie", {
    withCredentials: true,
    baseURL: LARAVEL_BASE || undefined,
  });
}

export async function login(email: string, password: string): Promise<{ user: User }> {
  await getCsrfCookie();
  const { data } = await api.post<{ user: User }>(`${LARAVEL_BASE}/login`, { email, password });
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
  const { data } = await api.post<{ user: User }>(`${LARAVEL_BASE}/register`, input);
  return data;
}

export async function logout(): Promise<void> {
  await api.post(`${LARAVEL_BASE}/logout`);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<User>("/user");
    return data;
  } catch {
    return null;
  }
}
