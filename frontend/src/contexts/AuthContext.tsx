/**
 * @fileoverview Authentication context provider for the Color Code Research Hub.
 * 
 * Provides authentication state management throughout the application using React Context.
 * Currently implements a simple hardcoded authentication system for beta access.
 * Session persistence is handled via sessionStorage.
 * 
 * Features:
 * - Session-based authentication state
 * - Persistent login across browser refreshes
 * - Simple login/logout functionality
 * - Global authentication state access via useAuth hook
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Optional: disable auth guards entirely for demo/public mode
const AUTH_DISABLED = (import.meta as any)?.env?.VITE_AUTH_DISABLED === 'true';

/**
 * Authentication context interface defining available auth operations.
 * 
 * @interface AuthContextType
 * @property {boolean} isAuthenticated - Current authentication status
 * @property {function} login - Authenticate user with credentials
 * @property {function} logout - Clear authentication state
 */
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

/**
 * Authentication context - provides auth state to all child components.
 * Initialized as undefined to enforce proper provider usage.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to access authentication context.
 * 
 * Provides type-safe access to authentication state and operations.
 * Must be used within an AuthProvider component tree.
 * 
 * @throws {Error} When used outside of AuthProvider
 * @returns {AuthContextType} Authentication context containing state and methods
 * 
 * @example
 * ```tsx
 * const { isAuthenticated, login, logout } = useAuth();
 * if (!isAuthenticated) {
 *   return <LoginForm onLogin={login} />;
 * }
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider component that manages auth state for the entire application.
 * 
 * Features:
 * - Persistent authentication across browser sessions via sessionStorage
 * - Hardcoded beta credentials for initial access control
 * - Automatic session restoration on page reload
 * - Clean logout with session cleanup
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with auth context
 * @returns {JSX.Element} Provider component wrapping children with auth context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /**
   * Authentication state with session persistence.
   * Initializes from sessionStorage on component mount to maintain login across refreshes.
   */
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (AUTH_DISABLED) return true;
    // Require a Cognito ID token for V2 protected routes to avoid 401s
    const hasIdToken = !!sessionStorage.getItem('id_token');
    return hasIdToken;
  });

  /**
   * Synchronize authentication state with sessionStorage.
   * Ensures persistent login state across browser sessions.
   */
  useEffect(() => {
    // Update sessionStorage when auth state changes
    if (AUTH_DISABLED) return;
    // Reflect the current token-backed auth state; do not allow flag-only auth
    if (isAuthenticated) sessionStorage.setItem('isAuthenticated', 'true');
    else sessionStorage.removeItem('isAuthenticated');
  }, [isAuthenticated]);

  /**
   * Authenticate user with provided credentials.
   * 
   * Currently uses hardcoded credentials for beta access.
   * In production, this would validate against a proper authentication service.
   * 
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {boolean} True if authentication successful, false otherwise
   */
  const login = (username: string, password: string): boolean => {
    // Hardcoded credentials for beta access
    // TODO: Replace with proper authentication service in production
    if (username === 'beta' && password === 'f@stf@shion') {
      // Legacy fallback no longer grants API access; guide user to Cognito
      // Keep UX flow working, but force Cognito acquisition of id_token
      setIsAuthenticated(false);
      if (typeof window !== 'undefined') {
        window.location.assign('/v2/auth');
      }
      return false;
    }
    return false;
  };

  /**
   * Clear authentication state and session data.
   * Navigation to login page is handled by the calling component.
   */
  const logout = () => {
    setIsAuthenticated(false);
    // Clear any Cognito tokens/groups if present
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_expires_in');
    sessionStorage.removeItem('cognitoGroups');
    sessionStorage.removeItem('isAuthenticated');
    // Navigation will be handled by the component that calls logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
