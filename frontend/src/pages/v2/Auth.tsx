import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

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
  
  // State for password manager compatibility form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Handle form submission - redirects to appropriate Cognito URL
  const handleSubmit = (e: React.FormEvent, mode: 'signin' | 'signup') => {
    e.preventDefault();
    const url = mode === 'signin' ? signInUrl : signUpUrl;
    if (url) {
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Welcome to truflr.ai</h1>
          <p className="text-muted-foreground">Sign in to your account or create a new one</p>
        </div>

        {/* Password manager compatible form */}
        {!missingEnv && (
          <div className="bg-card border border-border rounded-lg shadow-card p-6">
            <form onSubmit={(e) => handleSubmit(e, isSignUp ? 'signup' : 'signin')} className="space-y-4">
              {/* Toggle between Sign In / Sign Up */}
              <div className="flex rounded-md bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                    !isSignUp 
                      ? 'bg-background text-foreground shadow' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                    isSignUp 
                      ? 'bg-background text-foreground shadow' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Email field for password managers */}
              <div className="space-y-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent"
                />
              </div>

              {/* Password field for password managers */}
              <div className="space-y-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent"
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-card hover:shadow-elevated transition-all"
              >
                {isSignUp ? (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="text-xs text-center text-muted-foreground">
                Secure authentication powered by AWS Cognito
              </div>
            </form>
          </div>
        )}

        {/* Fallback: Direct links if form doesn't work */}
        {!missingEnv && (
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-2">
              Having trouble? Use direct links:
            </div>
            <div className="flex gap-2 justify-center">
              <a 
                href={signInUrl} 
                className="text-xs text-accent hover:underline"
              >
                Sign In
              </a>
              <span className="text-xs text-muted-foreground">•</span>
              <a 
                href={signUpUrl} 
                className="text-xs text-accent hover:underline"
              >
                Sign Up
              </a>
            </div>
          </div>
        )}

        {/* Missing environment variables error */}
        {missingEnv && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-destructive text-sm">
              Authentication configuration missing. Please check environment variables.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
