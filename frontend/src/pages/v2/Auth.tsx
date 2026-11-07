import { useEffect } from 'react';
import { clearRedirectLock } from '@/lib/redirectToAuth';
import { isJwtValid } from '@/lib/jwt.ts';

export default function AuthPage() {
  useEffect(() => { 
    console.log('🏠 Auth Page - Component mounted at:', window.location.href);
    clearRedirectLock();
    
    // Check if user is already authenticated
    const existingToken = sessionStorage.getItem('id_token');
    
    console.log('🔧 Auth Page - Auth status:', { 
      hasToken: !!existingToken,
      isAuthenticated: isAuthenticated === 'true'
    });
    
    if (existingToken && isJwtValid(existingToken)) {
      console.log('✅ Auth Page - Valid id_token detected, redirecting to homepage');
      window.location.replace('/v2/homepage');
      return;
    }

    // If token exists but is expired, clear and proceed to Cognito
    if (existingToken && !isJwtValid(existingToken)) {
      console.log('🔁 Auth Page - Expired id_token found; clearing and redirecting to Cognito');
      try {
        sessionStorage.removeItem('id_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('token_expires_in');
        sessionStorage.removeItem('isAuthenticated');
      } catch {}
    }
    
    // Not authenticated - redirect to Cognito login
    const domain = import.meta.env.VITE_COGNITO_DOMAIN as string;
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
    const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI as string;
    
    console.log('🔧 Auth Page - Environment check:', { 
      domain: domain ? 'configured' : 'missing',
      clientId: clientId ? 'configured' : 'missing',
      redirectUri 
    });
    
    if (domain && clientId) {
      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'token',
        scope: 'openid email profile',
        redirect_uri: redirectUri,
      }).toString();
      const cognitoUrl = `https://${domain}.auth.us-east-1.amazoncognito.com/oauth2/authorize?${params}`;
      
      console.log('🚀 Auth Page - Redirecting to Cognito:', cognitoUrl);
      
      // Small delay to ensure logs are captured
      setTimeout(() => {
        window.location.assign(cognitoUrl);
      }, 500);
    } else {
      console.error('❌ Auth Page - Missing Cognito environment variables');
    }
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
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
        <div>Redirecting to secure sign-in…</div>
      </div>
    </div>
  );
}
