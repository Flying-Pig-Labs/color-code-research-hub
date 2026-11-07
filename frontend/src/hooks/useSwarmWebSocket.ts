/**
 * @fileoverview WebSocket hook for real-time swarm coordination and monitoring.
 * 
 * Provides real-time communication with AI swarm coordinator via WebSocket connection.
 * Handles automatic reconnection, event filtering, and comprehensive logging for
 * swarm operations including agent assignments, progress updates, and completions.
 * 
 * Features:
 * - Automatic reconnection with configurable intervals
 * - Event filtering by swarm ID and type
 * - Structured event logging with severity levels
 * - Connection state management
 * - Error handling and recovery
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Interface defining swarm event structure from WebSocket messages.
 * Represents real-time updates from the swarm coordination system.
 */
interface SwarmEvent {
  /** Event type identifier */
  type: string;
  /** Associated swarm identifier (optional) */
  swarmId?: string;
  /** Swarm objective description (optional) */
  objective?: string;
  /** Current status of the swarm/agent (optional) */
  status?: string;
  /** Event timestamp */
  timestamp: string;
  /** Human-readable event message (optional) */
  message?: string;
  /** Specific agent identifier (optional) */
  agentId?: string;
  /** Log severity level (optional) */
  level?: 'info' | 'debug' | 'warn' | 'error';
  /** Additional event metadata (optional) */
  metadata?: any;
}

/**
 * Configuration options for the WebSocket hook.
 * Provides customizable behavior for connection management and event handling.
 */
interface UseSwarmWebSocketOptions {
  /** Enable automatic reconnection on disconnect */
  autoReconnect?: boolean;
  /** Milliseconds between reconnection attempts */
  reconnectInterval?: number;
  /** Callback for incoming events */
  onEvent?: (event: SwarmEvent) => void;
  /** Callback for successful connection */
  onConnect?: () => void;
  /** Callback for disconnection */
  onDisconnect?: () => void;
  /** Callback for connection errors */
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