/**
 * @fileoverview Auth gate hook that prevents API calls until authentication is ready.
 * 
 * This hook provides a safe way to gate API calls and component rendering until
 * the authentication state is fully hydrated and stable.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authStateManager } from '@/lib/authStateManager';

export interface AuthGateState {
  ready: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Hook to gate API calls and rendering until auth is ready.
 * 
 * @returns {AuthGateState} Auth gate state with ready flag and auth status
 */
export function useAuthGate(): AuthGateState {
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAuthReady = () => {
      if (!mounted) return;

      const authReady = authStateManager.isAuthReady();
      const hasToken = !!sessionStorage.getItem('id_token');
      
      // Auth is ready when:
      // 1. State manager says we're ready
      // 2. Auth context is initialized
      // 3. If authenticated, we have a token
      const isReady = authReady && (isAuthenticated ? hasToken : true);

      setReady(isReady);
      setIsLoading(!isReady && isAuthenticated);

      if (!isReady) {
        // Check again in 100ms if not ready
        timeoutId = setTimeout(checkAuthReady, 100);
      }
    };

    // Initial check with slight delay to allow auth context to initialize
    timeoutId = setTimeout(checkAuthReady, 50);

    // Listen for auth state changes
    const unsubscribe = authStateManager.addListener(checkAuthReady);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [isAuthenticated]);

  // Set auth manager ready state based on our determinations
  useEffect(() => {
    const hasToken = !!sessionStorage.getItem('id_token');
    const shouldBeReady = isAuthenticated ? hasToken : true;
    authStateManager.setAuthReady(shouldBeReady);
  }, [isAuthenticated]);

  return {
    ready,
    isAuthenticated,
    isLoading
  };
}