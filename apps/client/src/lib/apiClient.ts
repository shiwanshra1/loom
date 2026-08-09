const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// Kept in memory rather than localStorage — an XSS payload that can read
// localStorage can also just call the API directly, but this at least avoids
// leaving the token sitting around after the tab closes. The refresh token
// lives in an httpOnly cookie the JS layer never touches (see auth.controller.ts).
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

/** Uses the httpOnly refresh cookie to mint a new access token. */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      setAccessToken(null);
      return false;
    }

    const data = (await response.json()) as { accessToken: string };
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: buildHeaders(),
      credentials: 'include',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

  let response = await doFetch();

  // One retry after a silent refresh — covers the common case of an expired
  // 15-minute access token without forcing the user to log in again.
  if (response.status === 401 && path !== '/api/auth/refresh') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await doFetch();
    }
  }

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      payload?.message ?? 'Request failed',
      payload?.details
    );
  }

  return payload as T;
}
