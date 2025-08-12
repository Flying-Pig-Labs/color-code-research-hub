import { useState, useEffect, useRef } from 'react';

type SSEStatus = 'connecting' | 'connected' | 'error' | 'closed';

export const useSSE = (url: string, apiKey: string) => {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<SSEStatus>('connecting');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    const connect = () => {
      try {
        setStatus('connecting');
        const eventSource = new EventSource(`${url}?apiKey=${apiKey}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('SSE connection established');
          setStatus('connected');
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE error:', error);
          setStatus('error');
          eventSource.close();
          
          // Exponential backoff reconnection
          if (reconnectAttemptsRef.current < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectAttemptsRef.current++;
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect... (attempt ${reconnectAttemptsRef.current})`);
              connect();
            }, delay);
          }
        };

        // Custom event handlers
        eventSource.addEventListener('agent-update', (event: any) => {
          const agentData = JSON.parse(event.data);
          setData(prev => ({
            ...prev,
            agents: agentData
          }));
        });

        eventSource.addEventListener('task-update', (event: any) => {
          const taskData = JSON.parse(event.data);
          setData(prev => ({
            ...prev,
            tasks: taskData
          }));
        });

        eventSource.addEventListener('alert', (event: any) => {
          const alertData = JSON.parse(event.data);
          setData(prev => ({
            ...prev,
            alerts: [...(prev?.alerts || []), alertData]
          }));
        });

      } catch (err) {
        console.error('Error creating EventSource:', err);
        setStatus('error');
      }
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url, apiKey]);

  return { data, status };
};