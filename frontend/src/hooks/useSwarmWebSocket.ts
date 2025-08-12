import { useEffect, useRef, useState, useCallback } from 'react';

interface SwarmEvent {
  type: string;
  swarmId?: string;
  objective?: string;
  status?: string;
  timestamp: string;
  message?: string;
  agentId?: string;
  level?: 'info' | 'debug' | 'warn' | 'error';
  metadata?: any;
}

interface UseSwarmWebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  onEvent?: (event: SwarmEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useSwarmWebSocket(options: UseSwarmWebSocketOptions = {}) {
  const {
    autoReconnect = true,
    reconnectInterval = 5000,
    onEvent,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<SwarmEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get WebSocket URL from EC2 endpoint
  const getWebSocketUrl = () => {
    // Replace http with ws and use the EC2 endpoint
    const ec2Endpoint = 'http://18.209.36.58:3456';
    return ec2Endpoint.replace('http://', 'ws://') + '/ws';
  };

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(getWebSocketUrl());
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected to swarm coordinator');
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SwarmEvent;
          
          // Add to events array
          setEvents(prev => [...prev, data]);
          
          // Call event handler
          onEvent?.(data);
          
          // Log based on event type
          console.log(`[${data.type}] ${data.message || data.objective || 'Event received'}`, data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket disconnected');
        onDisconnect?.();
        
        // Auto-reconnect if enabled
        if (autoReconnect && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [autoReconnect, reconnectInterval, onConnect, onDisconnect, onError, onEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const getEventsBySwarm = useCallback((swarmId: string) => {
    return events.filter(event => event.swarmId === swarmId);
  }, [events]);

  const getEventsByType = useCallback((type: string) => {
    return events.filter(event => event.type === type);
  }, [events]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    events,
    clearEvents,
    getEventsBySwarm,
    getEventsByType,
    connect,
    disconnect
  };
}

// Event type constants
export const SWARM_EVENTS = {
  SWARM_CREATED: 'swarm.created',
  SWARM_PROGRESS: 'swarm.progress',
  SWARM_AGENT_ASSIGNED: 'swarm.agent.assigned',
  SWARM_AGENT_COMPLETED: 'swarm.agent.completed',
  SWARM_COMPLETED: 'swarm.completed',
  SWARM_FAILED: 'swarm.failed',
  SWARM_STOPPED: 'swarm.stopped',
  SYSTEM_METRICS: 'system.metrics',
  LOG_ENTRY: 'log.entry'
};