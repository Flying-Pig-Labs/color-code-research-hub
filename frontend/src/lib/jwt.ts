export function parseJwt(token: string): any | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    let s = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return JSON.parse(atob(s));
  } catch {
    return null;
  }
}

export function isJwtValid(token?: string | null, leewaySeconds = 30): boolean {
  if (!token) return false;
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return Number(payload.exp) > now + leewaySeconds;
}

