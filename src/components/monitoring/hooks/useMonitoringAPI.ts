import { useState, useEffect, useCallback } from 'react';
import { MonitoringData, UseMonitoringAPIReturn } from '../types';

interface UseMonitoringAPIOptions {
  pollingInterval?: number;
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
    pollingInterval = 5000,
    retryAttempts = 3,
    retryDelay = 1000,
    enabled = true
  } = options;

  const [data, setData] = useState<MonitoringData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [apiUrl, apiKey, enabled, retryCount, retryAttempts, retryDelay]);

  // Fetch individual endpoints for detailed data
  const fetchDetailedData = useCallback(async () => {
    if (!enabled || !data) return;

    try {
      const [agentsRes, tasksRes, alertsRes, metricsRes] = await Promise.all([
        fetch(`${apiUrl}/api/agents`, {
          headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        }).catch(() => null),
        fetch(`${apiUrl}/api/tasks`, {
          headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        }).catch(() => null),
        fetch(`${apiUrl}/api/alerts`, {
          headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        }).catch(() => null),
        fetch(`${apiUrl}/api/metrics`, {
          headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' }
        }).catch(() => null)
      ]);

      const updates: Partial<MonitoringData> = {};

      // Process agents data
      if (agentsRes?.ok) {
        const agentsData = await agentsRes.json();
        if (agentsData.agents) {
          updates.agents = agentsData.agents;
        }
      }

      // Process tasks data
      if (tasksRes?.ok) {
        const tasksData = await tasksRes.json();
        // Transform tasks data if needed
        updates.tasks = [];
      }

      // Process alerts data
      if (alertsRes?.ok) {
        const alertsData = await alertsRes.json();
        if (alertsData.alerts) {
          updates.alerts = alertsData.alerts;
        }
      }

      // Process detailed metrics
      if (metricsRes?.ok) {
        const metricsData = await metricsRes.json();
        if (metricsData.system && data.metrics) {
          // Update trend data
          const updatedMetrics = { ...data.metrics };
          
          Object.keys(updatedMetrics).forEach(key => {
            if (key !== 'timestamp' && metricsData.system[key] !== undefined) {
              const metric = updatedMetrics[key as keyof typeof updatedMetrics];
              if (metric && typeof metric === 'object' && 'trend' in metric) {
                metric.trend = [...metric.trend.slice(-9), metricsData.system[key]];
                metric.value = metricsData.system[key];
              }
            }
          });
          
          updates.metrics = updatedMetrics;
        }
      }

      // Update state with new data
      if (Object.keys(updates).length > 0) {
        setData(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error('Error fetching detailed monitoring data:', err);
    }
  }, [apiUrl, apiKey, enabled, data]);

  useEffect(() => {
    if (!enabled) return;

    fetchData();
    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollingInterval, enabled]);

  // Fetch detailed data less frequently
  useEffect(() => {
    if (!enabled || !data) return;

    fetchDetailedData();
    const detailedInterval = setInterval(fetchDetailedData, pollingInterval * 2);
    return () => clearInterval(detailedInterval);
  }, [fetchDetailedData, pollingInterval, enabled, data]);

  const refetch = useCallback(async () => {
    setRetryCount(0);
    await fetchData();
    await fetchDetailedData();
  }, [fetchData, fetchDetailedData]);

  return { data, error, loading, refetch };
};