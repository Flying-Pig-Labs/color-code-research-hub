/**
 * @fileoverview Custom hook for monitoring API environment health and connectivity.
 * 
 * Provides real-time monitoring of the backend API service with automatic health checks
 * and environment detection. Essential for displaying connection status to users and
 * handling offline/online states gracefully.
 * 
 * Features:
 * - Automatic health check polling every 30 seconds
 * - Environment detection (local vs production)
 * - Connection status tracking
 * - Error handling for network failures
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { apiService, getCurrentEnvironment } from '@/services/api';

/**
 * Interface defining the API environment status information.
 * Provides comprehensive health and connectivity information.
 */
interface ApiEnvironmentStatus {
  /** Detected environment type */
  environment: 'local' | 'unknown';
  /** Whether the API is responding to health checks */
  isHealthy: boolean;
  /** Whether a health check is currently in progress */
  isChecking: boolean;
}

/**
 * Custom hook for monitoring API environment health and connectivity.
 * 
 * Automatically performs health checks on mount and at regular intervals
 * to maintain real-time connection status. Handles failures gracefully
 * and provides immediate feedback for UI state management.
 * 
 * @returns {ApiEnvironmentStatus} Current API health and environment status
 * 
 * @example
 * ```tsx
 * function ConnectionStatus() {
 *   const { environment, isHealthy, isChecking } = useApiEnvironment();
 *   
 *   return (
 *     <div>
 *       Environment: {environment}
 *       Status: {isHealthy ? 'Connected' : 'Disconnected'}
 *       {isChecking && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useApiEnvironment() {
  /**
   * Initialize status state with default values.
   * Assumes unhealthy until first health check completes.
   */
  const [status, setStatus] = useState<ApiEnvironmentStatus>({
    environment: getCurrentEnvironment(),
    isHealthy: false,
    isChecking: true,
  });

  useEffect(() => {
    /**
     * Perform API health check and update status.
     * Handles both successful responses and error conditions gracefully.
     */
    const checkHealth = async () => {
      setStatus(prev => ({ ...prev, isChecking: true }));
      try {
        const health = await apiService.checkHealth();
        setStatus({
          environment: getCurrentEnvironment(),
          isHealthy: health.status === 'healthy',
          isChecking: false,
        });
      } catch (error) {
        // Handle network errors or API failures
        setStatus({
          environment: getCurrentEnvironment(),
          isHealthy: false,
          isChecking: false,
        });
      }
    };

    // Immediate health check on mount
    checkHealth();
    
    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return status;
}