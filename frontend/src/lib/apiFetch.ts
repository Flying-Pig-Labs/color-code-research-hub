// src/lib/apiFetch.ts
import { redirectToAuthOnce } from './redirectToAuth';
import { envConfig } from '@/config/environment';
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('id_token') || sessionStorage.getItem('idToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${envConfig.apiBaseUrl}${path}`, { ...options, headers });
  if (res.status === 401) { redirectToAuthOnce('/v2/auth'); throw new Error('UNAUTHORIZED'); }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.status === 204 ? null : res.json();
}