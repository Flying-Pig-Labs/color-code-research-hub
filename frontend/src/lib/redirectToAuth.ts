// src/lib/redirectToAuth.ts
const LOCK_KEY = 'auth_redirect_lock';
const LOCK_TTL_MS = 5000;
function hasRecentLock(): boolean {
  try { const raw = sessionStorage.getItem(LOCK_KEY); if (!raw) return false;
    const ts = Number(raw); return Number.isFinite(ts) && Date.now() - ts < LOCK_TTL_MS; } catch { return false; }
}
function setLock() { try { sessionStorage.setItem(LOCK_KEY, String(Date.now())); } catch {} }
export function redirectToAuthOnce(url = '/v2/auth') {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/v2/auth')) return;
  if (hasRecentLock()) return;
  setLock();
  window.location.assign(url);
}
export function clearRedirectLock() { try { sessionStorage.removeItem(LOCK_KEY); } catch {} }