import axios from "axios";
import api, { API_BASE_URL, LARAVEL_BASE } from "./client";

export type User = {
  id: number;
  public_user_id: string;
  name: string;
  email: string;
  country_code: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Readable XSRF cookie → header (needed where axios options bypass automatic CSRF merge). */
export function xsrfHeader(): Record<string, string> {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  if (!match) return {};
  return { "X-XSRF-TOKEN": decodeURIComponent(match[1]) };
}

export async function getCsrfCookie(): Promise<void> {
  const root = LARAVEL_BASE.replace(/\/+$/, "");
  // Always hit `/sanctum/csrf-cookie` on the Laravel origin — never under `/api` (axios baseURL + `/sanctum/...` would break).
  await axios.get(`${root}/sanctum/csrf-cookie`, {
    withCredentials: true,
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

/**
 * GET /api/user using a plain axios call (no shared 401 interceptor).
 * Use after login/register to confirm the session cookie is actually stored before navigating.
 */
export async function fetchVerifiedSessionUser(): Promise<User | null> {
  try {
    const { data } = await axios.get<User>(`${API_BASE_URL.replace(/\/+$/, "")}/user`, {
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    return data;
  } catch {
    return null;
  }
}

export async function updateProfile(input: {
  name: string;
  country_code?: string | null;
}): Promise<User> {
  await getCsrfCookie();
  const { data } = await api.patch<{ user: User }>(
    "/user/profile",
    input,
    { headers: xsrfHeader() },
  );
  return data.user;
}

export async function forgotPassword(email: string): Promise<void> {
  await getCsrfCookie();
  await api.post(
    `${LARAVEL_BASE}/forgot-password`,
    { email },
    { headers: xsrfHeader() },
  );
}

export async function resetPassword(input: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await getCsrfCookie();
  await api.post(
    `${LARAVEL_BASE}/reset-password`,
    input,
    { headers: xsrfHeader() },
  );
}

export async function getEmailVerificationStatus(): Promise<{ verified: boolean }> {
  const { data } = await api.get<{ verified: boolean }>("/email/verification-status");
  return data;
}

export async function resendVerificationEmail(): Promise<{ sent: boolean; already_verified?: boolean }> {
  await getCsrfCookie();
  const { data } = await api.post<{ sent: boolean; already_verified?: boolean }>(
    "/email/verification-notification",
    undefined,
    { headers: xsrfHeader() },
  );
  return data;
}
