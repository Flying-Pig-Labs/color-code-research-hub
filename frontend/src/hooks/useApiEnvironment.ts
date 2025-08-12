import { useState, useEffect } from 'react';
import { apiService, getCurrentEnvironment } from '@/services/api';

interface ApiEnvironmentStatus {
  environment: 'local' | 'unknown';
  isHealthy: boolean;
  isChecking: boolean;
}

export function useApiEnvironment() {
  const [status, setStatus] = useState<ApiEnvironmentStatus>({
    environment: getCurrentEnvironment(),
    isHealthy: false,
    isChecking: true,
  });

  useEffect(() => {
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
        setStatus({
          environment: getCurrentEnvironment(),
          isHealthy: false,
          isChecking: false,
        });
      }
    };

    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return status;
}