import { useState, useEffect, useCallback } from 'react';

interface UseMonitoringAPIOptions {
  pollingInterval?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useMonitoringAPI = (
  apiUrl: string,
  apiKey: string,
  options: UseMonitoringAPIOptions = {}
) => {
  const {
    pollingInterval = 5000,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/dashboard`, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
      setRetryCount(0);
    } catch (err) {
      console.error('Monitoring API error:', err);
      setError(err as Error);
      
      // Retry logic
      if (retryCount < retryAttempts) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchData, retryDelay * Math.pow(2, retryCount));
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl, apiKey, retryCount, retryAttempts, retryDelay]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollingInterval]);

  return { data, error, loading, refetch: fetchData };
};