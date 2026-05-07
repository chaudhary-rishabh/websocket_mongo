const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined ?? {}),
  }
  const res = await fetch(`${BASE}/api/v1${path}`, { ...init, headers })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error((json?.error?.message as string | undefined) ?? 'Request failed')
  }
  return json.data as T
}

export const api = {
  get:   <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'GET' }, token),
  post:  <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
}
