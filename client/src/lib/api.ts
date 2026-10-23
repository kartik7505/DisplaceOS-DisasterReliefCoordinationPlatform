import { useAuthStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { user, token } = useAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Live Supabase authentication
  if (token && token !== "demo-token") {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (user) {
    // Development / Demo authentication headers matching backend auth middleware
    headers["x-user-id"] = user.id;
    headers["x-user-role"] = user.role;
    if (user.region_id) headers["x-user-region"] = user.region_id;
    if (user.camp_id) headers["x-user-camp"] = user.camp_id;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
