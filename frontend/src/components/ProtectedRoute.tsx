/**
 * @fileoverview Protected route wrapper component for authentication control.
 * 
 * This component implements route-level authentication by checking the user's
 * authentication status and redirecting to login if not authenticated.
 * 
 * Used to wrap any routes that require user authentication, providing
 * automatic redirection to the login page for unauthenticated users.
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import UserOnboarding from '@/components/UserOnboarding';

/**
 * Props interface for the ProtectedRoute component.
 * 
 * @interface ProtectedRouteProps
 * @property {React.ReactNode} children - The components to render if authenticated
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route component that enforces authentication and onboarding requirements.
 * 
 * Checks the current authentication status and user profile completion:
 * - Redirects to login page if not authenticated
 * - Shows onboarding flow if authenticated but profile incomplete
 * - Renders protected content if authenticated and profile complete
 * 
 * @param {ProtectedRouteProps} props - Component props
 * @param {React.ReactNode} props.children - Content to render if authenticated and onboarded
 * @returns {JSX.Element} Either the protected content, onboarding flow, or redirect to login
 * 
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
const AUTH_DISABLED = (import.meta as any)?.env?.VITE_AUTH_DISABLED === 'true';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { needsOnboarding, isLoading } = useUser();

  if (AUTH_DISABLED) {
    return <>{children}</>;
  }

  // Redirect to Cognito login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/v2/auth" replace />;
  }

  // Show loading state while user data is being loaded
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-pulse">Loading...</div>
        </div>
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
