import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const decoded = atob(base64 + pad);
  try {
    // decodeURIComponent requires percent-encoding; atob is fine for JWT payloads
    return decoded;
  } catch {
    return decoded;
  }
}

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Cognito Hosted UI returns tokens in URL hash fragment for response_type=token
      const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
      const params = new URLSearchParams(hash);
      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');
      const expiresIn = params.get('expires_in');

      if (idToken) {
        sessionStorage.setItem('id_token', idToken);
        if (accessToken) sessionStorage.setItem('access_token', accessToken);
        if (expiresIn) sessionStorage.setItem('token_expires_in', expiresIn);

        // Decode JWT payload to extract groups claim
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payloadJson = base64UrlDecode(parts[1]);
          try {
            const payload = JSON.parse(payloadJson);
            const groups = payload['cognito:groups'] || [];
            sessionStorage.setItem('cognitoGroups', JSON.stringify(groups));
          } catch {
            // ignore parse errors
          }
        }

        // Mark app as authenticated for current simple guard
        sessionStorage.setItem('isAuthenticated', 'true');

        // Redirect into app
        navigate('/v2/projects', { replace: true });
        return;
      }
    } catch {
      // fall through to redirect
    }
    // If no token present, go back to auth start
    navigate('/v2/auth', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Signing you in…</h1>
        <p className="text-muted-foreground">Processing credentials from Cognito…</p>
      </div>
    </div>
  );
};

export default AuthCallback;

