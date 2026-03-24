import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...headers, ...(options.headers as object) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}
