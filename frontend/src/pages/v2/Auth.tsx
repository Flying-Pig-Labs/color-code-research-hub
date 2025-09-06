import React, { useMemo } from 'react';

function buildAuthorizeUrl(screenHint?: 'signup' | 'signin') {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;
  const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI as string | undefined;
  if (!domain || !clientId || !redirectUri) return undefined;
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'token',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
  });
  if (screenHint) params.set('screen_hint', screenHint);
  return `https://${domain}/oauth2/authorize?${params.toString()}`;
}

const Auth: React.FC = () => {
  const signInUrl = useMemo(() => buildAuthorizeUrl('signin'), []);
  const signUpUrl = useMemo(() => buildAuthorizeUrl('signup'), []);
  const missingEnv = !signInUrl || !signUpUrl;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Welcome</h1>
          <p className="text-muted-foreground">Sign in or create an account</p>
        </div>

        {missingEnv ? (
          <div className="rounded-md border border-border p-4 text-sm">
            <p className="font-medium mb-1">Cognito not configured</p>
            <p>
              Set VITE_COGNITO_DOMAIN, VITE_COGNITO_CLIENT_ID, and VITE_COGNITO_REDIRECT_URI in your .env.local.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <a href={signInUrl} className="inline-flex w-full items-center justify-center rounded-md bg-accent px-4 py-2 text-accent-foreground hover:bg-accent/90">
              Continue with Cognito
            </a>
            <a href={signUpUrl} className="inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-2 hover:bg-muted">
              Create account
            </a>
          </div>
        )}

        <div className="text-xs text-center text-muted-foreground">
          Using Cognito Hosted UI (no Amplify dependency)
        </div>
      </div>
    </div>
  );
};

export default Auth;
