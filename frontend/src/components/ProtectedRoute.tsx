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
 * Protected route component that enforces authentication requirements.
 * 
 * Checks the current authentication status and either renders the protected
 * content or redirects to the login page. Uses React Router's Navigate
 * component with replace flag to prevent back button issues.
 * 
 * @param {ProtectedRouteProps} props - Component props
 * @param {React.ReactNode} props.children - Content to render if authenticated
 * @returns {JSX.Element} Either the protected content or a redirect to login
 * 
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  // replace=true prevents the protected route from appearing in browser history
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
};

export default ProtectedRoute;