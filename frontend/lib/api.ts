import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};

  // If token expires within 60 seconds, refresh it
  const expiresAt = session.expires_at ?? 0;
  const needsRefresh = expiresAt - Math.floor(Date.now() / 1000) < 60;

  if (needsRefresh) {
    const { data } = await supabase.auth.refreshSession();
    if (data.session?.access_token) {
      return { Authorization: `Bearer ${data.session.access_token}` };
    }
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...headers, ...(options.headers as object) },
  });

  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}
