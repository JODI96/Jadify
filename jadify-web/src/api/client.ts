const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

let isRefreshing = false
let pendingRefresh: Promise<string | null> | null = null

function getToken() {
  return localStorage.getItem('jadify_token')
}

function clearAuth() {
  localStorage.removeItem('jadify_token')
  localStorage.removeItem('jadify_refresh')
  localStorage.removeItem('jadify_business_id')
  localStorage.removeItem('jadify_email')
  localStorage.removeItem('jadify_business_type')
  localStorage.removeItem('jadify_slug')
  window.dispatchEvent(new Event('jadify:logout'))
}

async function tryRefresh(): Promise<string | null> {
  if (isRefreshing && pendingRefresh) return pendingRefresh

  const refreshToken = localStorage.getItem('jadify_refresh')
  if (!refreshToken) { clearAuth(); return null }

  isRefreshing = true
  pendingRefresh = fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async res => {
      if (!res.ok) { clearAuth(); return null }
      const data = await res.json()
      localStorage.setItem('jadify_token', data.accessToken)
      localStorage.setItem('jadify_refresh', data.refreshToken)
      return data.accessToken as string
    })
    .catch(() => { clearAuth(); return null })
    .finally(() => { isRefreshing = false; pendingRefresh = null })

  return pendingRefresh
}

async function request<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (res.status === 401 && !isRetry) {
    const newToken = await tryRefresh()
    if (newToken) return request<T>(path, init, true)
    throw new Error('Session abgelaufen. Bitte erneut anmelden.')
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
