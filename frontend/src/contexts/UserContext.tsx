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
 * Default user profile for authenticated users.
 * In a real application, this would be fetched from an API.
 */
const createDefaultUser = (): UserProfile => ({
  id: 'user-001',
  name: 'Beta User',
  email: 'beta@truflr.ai',
  avatarUrl: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

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

  /**
   * Load user profile data.
   * In a real application, this would fetch from an API.
   */
  const loadUser = async () => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call to load user data
      // In real implementation, this would be an actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we have stored user data in localStorage
      const storedUser = localStorage.getItem('userProfile');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user data:', error);
          setUser(createDefaultUser());
        }
      } else {
        // Create default user and store it
        const defaultUser = createDefaultUser();
        localStorage.setItem('userProfile', JSON.stringify(defaultUser));
        setUser(defaultUser);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Fallback to default user
      setUser(createDefaultUser());
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
    }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;