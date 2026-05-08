const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/* ─── Token store ────────────────────────────────────────────────────── */

interface TokenStore {
  accessToken: string
  refreshToken: string
  onRefreshed: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>
}

let _store: TokenStore | null = null
let _refreshing: Promise<string | null> | null = null

export function setAuth(store: TokenStore): void {
  _store = store
}

export function clearAuth(): void {
  _store = null
}

/* ─── Single-flight token refresh ───────────────────────────────────── */

async function doRefresh(): Promise<string | null> {
  if (!_store) return null

  // Deduplicate concurrent 401s — all callers wait for the same refresh
  if (_refreshing) return _refreshing

  _refreshing = (async (): Promise<string | null> => {
    try {
      const { refreshToken } = _store!
      const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      const json = (await res.json()) as {
        success: boolean
        data?: { accessToken: string; refreshToken: string }
      }
      if (!res.ok || !json.success || !json.data) return null
      _store!.accessToken = json.data.accessToken
      _store!.refreshToken = json.data.refreshToken
      await _store!.onRefreshed(json.data)
      return json.data.accessToken
    } catch {
      return null
    } finally {
      _refreshing = null
    }
  })()

  return _refreshing
}

/* ─── Core fetch with 401 retry ─────────────────────────────────────── */

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const effectiveToken = token ?? _store?.accessToken
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
    ...(init.headers as Record<string, string> | undefined ?? {}),
  }

  const res = await fetch(`${BASE}/api/v1${path}`, { ...init, headers })
  const json = await res.json()

  if (res.status === 401 && _store) {
    const newToken = await doRefresh()
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
      const retryRes = await fetch(`${BASE}/api/v1${path}`, { ...init, headers: retryHeaders })
      const retryJson = await retryRes.json()
      if (!retryRes.ok || !retryJson.success) {
        throw new Error((retryJson?.error?.message as string | undefined) ?? 'Request failed')
      }
      return retryJson.data as T
    }
  }

  if (!res.ok || !json.success) {
    throw new Error((json?.error?.message as string | undefined) ?? 'Request failed')
  }
  return json.data as T
}

/* ─── Raw fetch wrapper with 401 retry (for components using raw json) ─ */

export async function authFetch(
  url: string,
  options: RequestInit = {},
  token?: string,
): Promise<Response> {
  const effectiveToken = token ?? _store?.accessToken
  const headers: Record<string, string> = {
    ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
    ...(options.headers as Record<string, string> | undefined ?? {}),
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401 && _store) {
    const newToken = await doRefresh()
    if (newToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
      return fetch(url, { ...options, headers: retryHeaders })
    }
  }

  return res
}

/* ─── Typed API helpers ──────────────────────────────────────────────── */

export const api = {
  get: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'GET' }, token),
  post: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
  delete: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'DELETE' }, token),
}
