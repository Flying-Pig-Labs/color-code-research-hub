import { useEffect } from 'react';
import { clearRedirectLock } from '@/lib/redirectToAuth';

export default function AuthPage() {
  useEffect(() => { 
    clearRedirectLock(); 
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
        <div>Authenticating…</div>
      </div>
    </div>
  );
}
