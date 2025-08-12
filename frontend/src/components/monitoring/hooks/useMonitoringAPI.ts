import { useState, useEffect, useCallback } from 'react';
import { MonitoringData, UseMonitoringAPIReturn } from '../types';

interface UseMonitoringAPIOptions {
  interval?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enabled?: boolean;
}

export const useMonitoringAPI = (
  apiUrl: string,
  apiKey: string,
  options: UseMonitoringAPIOptions = {}
): UseMonitoringAPIReturn => {
  const {
    interval = 5000,
    retryAttempts = 3,
    retryDelay = 1000,
    enabled = true
  } = options;

  const [data, setData] = useState<MonitoringData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsLoading(true);
      const response = await fetch(apiUrl, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const monitoringData = await response.json();
      
      setData(monitoringData);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Monitoring API error:', err);
      setError(err as Error);
      
      // Retry logic with exponential backoff
      if (retryCount < retryAttempts) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchData, retryDelay * Math.pow(2, retryCount));
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, apiKey, enabled, retryCount, retryAttempts, retryDelay]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const intervalId = setInterval(fetchData, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, interval, enabled]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    refresh
  };
};