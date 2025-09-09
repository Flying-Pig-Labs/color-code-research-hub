import React, { useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const AUTH_DISABLED = (import.meta as any)?.env?.VITE_AUTH_DISABLED === 'true';
  const signInUrl = useMemo(() => buildAuthorizeUrl('signin'), []);
  const signUpUrl = useMemo(() => buildAuthorizeUrl('signup'), []);
  const missingEnv = !signInUrl || !signUpUrl;
  
  // Debug URLs
  console.log('Auth - Sign In URL:', signInUrl);
  console.log('Auth - Sign Up URL:', signUpUrl);

  // Redirect authenticated users to the app; avoid auto-redirect loops for unauthenticated
  useEffect(() => {
    if (AUTH_DISABLED || isAuthenticated) {
      navigate("/v2/projects", { replace: true });
      return;
    }
  }, [isAuthenticated, navigate, signInUrl, missingEnv]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              truflr.ai
            </h1>
            <img 
              src="/logo-light.png"
              alt="truflr.ai Logo" 
              className="w-12 h-12 md:w-16 md:h-16"
            />
          </div>
          
          <h2 className="text-2xl font-semibold">Secure sign-in</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
          <p className="text-muted-foreground">Use the buttons below to continue.</p>
        </div>

        {/* Manual options if auto-redirect doesn't work */}
        {!missingEnv && (
          <div className="bg-card border border-border rounded-lg shadow-card p-6 text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              If you're not redirected automatically:
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href={signUpUrl}
                className="flex-1 inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-accent-foreground hover:bg-accent/90 transition-colors"
                id="create-account-btn"
              >
                Create Account
              </a>
              <a 
                href={signInUrl}
                className="flex-1 inline-flex items-center justify-center rounded-md border border-border px-4 py-2 hover:bg-muted transition-colors"
                id="sign-in-btn"
              >
                Sign In
              </a>
            </div>
          </div>
        )}

        {/* Missing environment variables error */}
        {missingEnv && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-destructive text-sm font-medium">
              Authentication Error
            </p>
            <p className="text-destructive text-xs mt-1">
              Configuration missing. Please contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
