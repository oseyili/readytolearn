const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const KEY = "rtl_token_v1";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) || "";
}
export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, token);
}
export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export async function apiGet(path: string, token?: string) {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path: string, body: any, token?: string) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export { API };
