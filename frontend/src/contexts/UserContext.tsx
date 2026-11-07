/**
 * @fileoverview User context provider for managing user profile data.
 * 
 * Provides user information throughout the application including name,
 * email, and profile management functionality. Works alongside the
 * authentication context to provide complete user state management.
 * 
 * @author truflr.ai Team
 * @version 1.0.0
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * User profile interface.
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * User context interface defining available operations.
 */
interface UserContextType {
  /** Current user profile data */
  user: UserProfile | null;
  /** Whether user data is currently loading */
  isLoading: boolean;
  /** Update user profile */
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  /** Refresh user data from server */
  refreshUser: () => Promise<void>;
  /** Complete user profile setup (for new users) */
  completeProfile: (name: string) => Promise<void>;
  /** Check if user needs onboarding */
  needsOnboarding: boolean;
}

/**
 * User context - provides user state to all child components.
 */
const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Custom hook to access user context.
 * 
 * @throws {Error} When used outside of UserProvider
 * @returns {UserContextType} User context containing state and methods
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

/**
 * Base64URL decode utility for JWT tokens.
 */
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const decoded = atob(base64 + pad);
  try {
    return decoded;
  } catch {
    return decoded;
  }
}

/**
 * Extract user info from Cognito JWT token.
 */
const extractUserFromToken = (): { id: string; email: string; name?: string } | null => {
  const idToken = sessionStorage.getItem('id_token');
  if (!idToken) return null;

  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const payloadJson = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadJson);

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || null,
    };
  } catch (error) {
    console.error('Failed to extract user from token:', error);
    return null;
  }
};

/**
 * User Provider component that manages user profile state.
 * 
 * Features:
 * - Automatic user data loading on authentication
 * - Profile update functionality
 * - Loading states for async operations
 * - Error handling for API calls
 * - Persistent storage integration
 */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  /**
   * Load user profile data.
   * Checks if user has completed profile setup, or needs onboarding.
   */
  const loadUser = async () => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    
    try {
      // Get user data from Cognito token
      const tokenUser = extractUserFromToken();
      if (!tokenUser) {
        // No token data - should not happen if authenticated
        setUser(null);
        return;
      }
      
      // Check if we have a complete user profile stored
      const storedUser = localStorage.getItem('userProfile');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Verify the stored user has required fields and matches current token user
          if (parsedUser.id === tokenUser.id && parsedUser.name && parsedUser.email) {
            // Update email from token in case it changed
            parsedUser.email = tokenUser.email;
            setUser(parsedUser);
            setNeedsOnboarding(false);
            return;
          }
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          localStorage.removeItem('userProfile');
        }
      }
      
      // User needs to complete their profile
      setUser(null);
      setNeedsOnboarding(true);
      
      // Store incomplete user data for onboarding component to use
      sessionStorage.setItem('incompleteUser', JSON.stringify({
        id: tokenUser.id,
        email: tokenUser.email,
        name: tokenUser.name || null,
      }));
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile.
   * 
   * @param updates - Partial user profile updates
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Simulate API call to update user data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser: UserProfile = {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // Update local state
      setUser(updatedUser);
      
      // Persist to localStorage
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));
      
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user data from server.
   */
  const refreshUser = async () => {
    await loadUser();
  };

  /**
   * Complete user profile setup for new users.
   * 
   * @param name - Full name provided by the user
   */
  const completeProfile = async (name: string) => {
    const incompleteUserData = sessionStorage.getItem('incompleteUser');
    if (!incompleteUserData) {
      throw new Error('No incomplete user data found');
    }

    const incompleteUser = JSON.parse(incompleteUserData);
    
    const completeUser: UserProfile = {
      id: incompleteUser.id,
      name: name.trim(),
      email: incompleteUser.email,
      avatarUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store complete user profile
    localStorage.setItem('userProfile', JSON.stringify(completeUser));
    
    // Clear incomplete user data
    sessionStorage.removeItem('incompleteUser');
    
    // Update state
    setUser(completeUser);
    setNeedsOnboarding(false);
  };

  /**
   * Load user data when authentication state changes.
   */
  useEffect(() => {
    loadUser();
  }, [isAuthenticated]);

  /**
   * Clear user data when logging out.
   */
  useEffect(() => {
    if (!isAuthenticated && user) {
      setUser(null);
      localStorage.removeItem('userProfile');
    }
  }, [isAuthenticated, user]);

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      updateProfile,
      refreshUser,
      completeProfile,
      needsOnboarding,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;