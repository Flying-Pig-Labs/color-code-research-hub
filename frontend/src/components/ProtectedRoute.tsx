/**
 * @fileoverview Protected route wrapper component for authentication control.
 * 
 * This component implements route-level authentication by checking the user's
 * authentication status. It NEVER navigates - only gates UI rendering.
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import UserOnboarding from '@/components/UserOnboarding';

/**
 * Props interface for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const AUTH_DISABLED = (import.meta as any)?.env?.VITE_AUTH_DISABLED === 'true';

/**
 * Protected route component that gates UI based on authentication.
 * NEVER navigates - only shows appropriate UI state.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { needsOnboarding, isLoading: userLoading } = useUser();

  if (AUTH_DISABLED) {
    return <>{children}</>;
  }

  // Check if we have a valid token
  const hasValidToken = !!sessionStorage.getItem('id_token');

  // Show loading while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated (API layer will redirect)
  if (!isAuthenticated || !hasValidToken) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Please log in to continue.
      </div>
    );
  }

  // Show onboarding if user needs to complete profile
  if (needsOnboarding) {
    return <UserOnboarding />;
  }

  // Render protected content if authenticated and profile complete
  return <>{children}</>;
};

export default ProtectedRoute;
