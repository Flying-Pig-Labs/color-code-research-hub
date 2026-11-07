// src/lib/apiFetch.ts
import { redirectToAuthOnce } from './redirectToAuth';
import { envConfig } from '@/config/environment';
import { isJwtValid } from '@/lib/jwt.ts';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const idToken = sessionStorage.getItem('id_token') || sessionStorage.getItem('idToken') || '';
  const accessToken = sessionStorage.getItem('access_token') || '';
  const candidates = Array.from(new Set([idToken, accessToken].filter(Boolean)));

  // Always include JSON header unless explicitly overridden
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  // Try with each candidate token before redirecting to auth
  let lastResponse: Response | null = null;
  for (let i = 0; i < Math.max(1, candidates.length); i++) {
    const token = candidates[i] || '';
    const headers = { ...baseHeaders } as Record<string, string>;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${envConfig.apiBaseUrl}${path}`, { ...options, headers });
    lastResponse = res;

    if (res.status === 401) {
      // Try next token if available
      continue;
    }
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  // If we reach here, all attempts resulted in 401
  if (lastResponse && lastResponse.status === 401) {
    // If the stored id_token is expired, clear before redirect so /v2/auth proceeds to Cognito
    try {
      const t = sessionStorage.getItem('id_token');
      if (t && !isJwtValid(t)) {
        sessionStorage.removeItem('id_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('token_expires_in');
        sessionStorage.removeItem('isAuthenticated');
      }
    } catch {}
    redirectToAuthOnce('/v2/auth');
    throw new Error('UNAUTHORIZED');
  }

  // Fallback safety
  throw new Error(`API ${(lastResponse && lastResponse.status) || 'error'}`);
}

// Same as apiFetch but with explicit base URL override
export async function apiFetchWithBase(baseUrl: string, path: string, options: RequestInit = {}) {
  const idToken = sessionStorage.getItem('id_token') || sessionStorage.getItem('idToken') || '';
  const accessToken = sessionStorage.getItem('access_token') || '';
  const candidates = Array.from(new Set([idToken, accessToken].filter(Boolean)));

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  let lastResponse: Response | null = null;
  for (let i = 0; i < Math.max(1, candidates.length); i++) {
    const token = candidates[i] || '';
    const headers = { ...baseHeaders } as Record<string, string>;
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
    lastResponse = res;

    if (res.status === 401) {
      continue;
    }
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  if (lastResponse && lastResponse.status === 401) {
    try {
      const t = sessionStorage.getItem('id_token');
      if (t && !isJwtValid(t)) {
        sessionStorage.removeItem('id_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('token_expires_in');
        sessionStorage.removeItem('isAuthenticated');
      }
    } catch {}
    redirectToAuthOnce('/v2/auth');
    throw new Error('UNAUTHORIZED');
  }

  throw new Error(`API ${(lastResponse && lastResponse.status) || 'error'}`);
}
