import { useState, useEffect, useRef, useCallback } from 'react';
import { UseSSEReturn } from '../types';

type SSEStatus = 'connecting' | 'connected' | 'error' | 'closed';

interface UseSSEOptions {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  enabled?: boolean;
}

export const useSSE = (
  url: string, 
  apiKey: string,
  options: UseSSEOptions = {}
): UseSSEReturn => {
  const {
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    enabled = true
  } = options;

  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<SSEStatus>('connecting');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    closeConnection();

    try {
      setStatus('connecting');
      
      // Build URL with API key
      const sseUrl = new URL(url);
      sseUrl.searchParams.set('apiKey', apiKey);
      
      const eventSource = new EventSource(sseUrl.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!mountedRef.current) return;
        console.log('SSE connection established');
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const parsedData = JSON.parse(event.data);
          
          // Handle connection confirmation
          if (parsedData.type === 'connected') {
            console.log('SSE connection confirmed');
            return;
          }

          setData(parsedData);
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (error) => {
        if (!mountedRef.current) return;
        
        console.error('SSE error:', error);
        setStatus('error');
        eventSource.close();
        
        // Exponential backoff reconnection
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          const delay = Math.min(
            reconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 
            30000
          );
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log(`Attempting to reconnect SSE... (attempt ${reconnectAttemptsRef.current})`);
              connect();
            }
          }, delay);
        } else {
          setStatus('closed');
          console.log('SSE connection permanently closed after max reconnection attempts');
        }
      };

      // Custom event handlers for different message types
      eventSource.addEventListener('agent-update', (event: any) => {
        if (!mountedRef.current) return;
        
        try {
          const agentData = JSON.parse(event.data);
          setData((prev: any) => ({
            ...prev,
            agents: agentData,
            timestamp: new Date().toISOString()
          }));
        } catch (err) {
          console.error('Error parsing agent update:', err);
        }
      });

      eventSource.addEventListener('task-update', (event: any) => {
        if (!mountedRef.current) return;
        
        try {
          const taskData = JSON.parse(event.data);
          setData((prev: any) => ({
            ...prev,
            tasks: taskData,
            timestamp: new Date().toISOString()
          }));
        } catch (err) {
          console.error('Error parsing task update:', err);
        }
      });

      eventSource.addEventListener('metrics', (event: any) => {
        if (!mountedRef.current) return;
        
        try {
          const metricsData = JSON.parse(event.data);
          setData((prev: any) => ({
            ...prev,
            metrics: metricsData,
            timestamp: new Date().toISOString()
          }));
        } catch (err) {
          console.error('Error parsing metrics update:', err);
        }
      });

      eventSource.addEventListener('alert', (event: any) => {
        if (!mountedRef.current) return;
        
        try {
          const alertData = JSON.parse(event.data);
          setData((prev: any) => ({
            ...prev,
            alerts: [...(prev?.alerts || []), alertData],
            timestamp: new Date().toISOString()
          }));
        } catch (err) {
          console.error('Error parsing alert:', err);
        }
      });

    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error('Error creating EventSource:', err);
      setStatus('error');
    }
  }, [url, apiKey, enabled, reconnectAttempts, reconnectDelay, closeConnection]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      closeConnection();
    };
  }, [enabled, connect, closeConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      closeConnection();
    };
  }, [closeConnection]);

  return { data, status };
};