import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwarmWebSocket, SWARM_EVENTS } from '../useSwarmWebSocket';

// Simple mock WebSocket
let mockWebSocketConstructor: jest.Mock;
let mockWebSocketInstance: any;

beforeEach(() => {
  mockWebSocketInstance = {
    readyState: 0,
    close: vi.fn(),
    send: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  mockWebSocketConstructor = vi.fn().mockReturnValue(mockWebSocketInstance);
  global.WebSocket = mockWebSocketConstructor as any;
  global.WebSocket.CONNECTING = 0;
  global.WebSocket.OPEN = 1;
  global.WebSocket.CLOSING = 2;
  global.WebSocket.CLOSED = 3;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useSwarmWebSocket', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should establish WebSocket connection on mount', () => {
    const onConnect = vi.fn();
    renderHook(() => useSwarmWebSocket({ onConnect }));

    expect(mockWebSocketConstructor).toHaveBeenCalledWith('ws://18.209.36.58:3456/ws');
    expect(mockWebSocketInstance.onopen).toBeDefined();
    expect(mockWebSocketInstance.onmessage).toBeDefined();
    expect(mockWebSocketInstance.onerror).toBeDefined();
    expect(mockWebSocketInstance.onclose).toBeDefined();
  });

  it('should handle connection open', () => {
    const onConnect = vi.fn();
    const { result } = renderHook(() => useSwarmWebSocket({ onConnect }));

    expect(result.current.isConnected).toBe(false);

    // Simulate connection open
    act(() => {
      mockWebSocketInstance.readyState = 1;
      mockWebSocketInstance.onopen();
    });

    expect(result.current.isConnected).toBe(true);
    expect(onConnect).toHaveBeenCalled();
  });

  it('should handle incoming messages', () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() => useSwarmWebSocket({ onEvent }));

    const testEvent = {
      type: SWARM_EVENTS.SWARM_CREATED,
      swarmId: 'swarm-123',
      objective: 'Test objective',
      timestamp: new Date().toISOString(),
    };

    act(() => {
      mockWebSocketInstance.onmessage({
        data: JSON.stringify(testEvent)
      });
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toEqual(testEvent);
    expect(onEvent).toHaveBeenCalledWith(testEvent);
  });

  it('should handle connection errors', () => {
    const onError = vi.fn();
    renderHook(() => useSwarmWebSocket({ onError }));

    const errorEvent = new Event('error');
    act(() => {
      mockWebSocketInstance.onerror(errorEvent);
    });

    expect(onError).toHaveBeenCalledWith(errorEvent);
  });

  it('should handle disconnection', () => {
    const onDisconnect = vi.fn();
    const { result } = renderHook(() => useSwarmWebSocket({ onDisconnect }));

    // First connect
    act(() => {
      mockWebSocketInstance.readyState = 1;
      mockWebSocketInstance.onopen();
    });

    expect(result.current.isConnected).toBe(true);

    // Then disconnect
    act(() => {
      mockWebSocketInstance.readyState = 3;
      mockWebSocketInstance.onclose();
    });

    expect(result.current.isConnected).toBe(false);
    expect(onDisconnect).toHaveBeenCalled();
  });

  it('should clear events', () => {
    const { result } = renderHook(() => useSwarmWebSocket());

    // Add some events
    act(() => {
      mockWebSocketInstance.onmessage({
        data: JSON.stringify({ type: 'event1', timestamp: new Date().toISOString() })
      });
      mockWebSocketInstance.onmessage({
        data: JSON.stringify({ type: 'event2', timestamp: new Date().toISOString() })
      });
    });

    expect(result.current.events).toHaveLength(2);

    act(() => {
      result.current.clearEvents();
    });

    expect(result.current.events).toHaveLength(0);
  });

  it('should filter events by swarm ID', () => {
    const { result } = renderHook(() => useSwarmWebSocket());

    const events = [
      { type: 'event1', swarmId: 'swarm-1', timestamp: new Date().toISOString() },
      { type: 'event2', swarmId: 'swarm-2', timestamp: new Date().toISOString() },
      { type: 'event3', swarmId: 'swarm-1', timestamp: new Date().toISOString() },
    ];

    act(() => {
      events.forEach(event => {
        mockWebSocketInstance.onmessage({
          data: JSON.stringify(event)
        });
      });
    });

    const swarm1Events = result.current.getEventsBySwarm('swarm-1');
    expect(swarm1Events).toHaveLength(2);
    expect(swarm1Events.every(e => e.swarmId === 'swarm-1')).toBe(true);
  });

  it('should filter events by type', () => {
    const { result } = renderHook(() => useSwarmWebSocket());

    const events = [
      { type: SWARM_EVENTS.SWARM_CREATED, timestamp: new Date().toISOString() },
      { type: SWARM_EVENTS.SWARM_PROGRESS, timestamp: new Date().toISOString() },
      { type: SWARM_EVENTS.SWARM_CREATED, timestamp: new Date().toISOString() },
    ];

    act(() => {
      events.forEach(event => {
        mockWebSocketInstance.onmessage({
          data: JSON.stringify(event)
        });
      });
    });

    const createdEvents = result.current.getEventsByType(SWARM_EVENTS.SWARM_CREATED);
    expect(createdEvents).toHaveLength(2);
    expect(createdEvents.every(e => e.type === SWARM_EVENTS.SWARM_CREATED)).toBe(true);
  });

  it('should handle manual disconnect', () => {
    const { result } = renderHook(() => useSwarmWebSocket());

    act(() => {
      result.current.disconnect();
    });

    expect(mockWebSocketInstance.close).toHaveBeenCalled();
  });

  it('should handle manual connect when already connected', () => {
    const { result } = renderHook(() => useSwarmWebSocket());

    // Simulate already connected
    mockWebSocketInstance.readyState = 1;

    act(() => {
      result.current.connect();
    });

    // Should not create a new connection
    expect(mockWebSocketConstructor).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid JSON messages', () => {
    const onEvent = vi.fn();
    const { result } = renderHook(() => useSwarmWebSocket({ onEvent }));

    act(() => {
      mockWebSocketInstance.onmessage({
        data: 'invalid json'
      });
    });

    expect(console.error).toHaveBeenCalledWith(
      'Failed to parse WebSocket message:', 
      expect.any(Error)
    );
    expect(onEvent).not.toHaveBeenCalled();
    expect(result.current.events).toHaveLength(0);
  });

  it('should handle WebSocket creation errors', () => {
    mockWebSocketConstructor.mockImplementation(() => {
      throw new Error('WebSocket creation failed');
    });

    renderHook(() => useSwarmWebSocket());

    expect(console.error).toHaveBeenCalledWith(
      'Failed to create WebSocket connection:', 
      expect.any(Error)
    );
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useSwarmWebSocket());

    unmount();

    expect(mockWebSocketInstance.close).toHaveBeenCalled();
  });

  it('should handle auto-reconnect', () => {
    vi.useFakeTimers();
    
    const onConnect = vi.fn();
    renderHook(() => useSwarmWebSocket({ 
      autoReconnect: true, 
      reconnectInterval: 1000,
      onConnect 
    }));

    // Clear initial call
    mockWebSocketConstructor.mockClear();

    // Simulate disconnection
    act(() => {
      mockWebSocketInstance.onclose();
    });

    // Fast forward past reconnect interval
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should create new connection
    expect(mockWebSocketConstructor).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should not auto-reconnect when disabled', () => {
    vi.useFakeTimers();
    
    renderHook(() => useSwarmWebSocket({ autoReconnect: false }));

    // Clear initial call
    mockWebSocketConstructor.mockClear();

    // Simulate disconnection
    act(() => {
      mockWebSocketInstance.onclose();
    });

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should not reconnect
    expect(mockWebSocketConstructor).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should cancel reconnect timeout on manual disconnect', () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useSwarmWebSocket({ 
      autoReconnect: true, 
      reconnectInterval: 5000 
    }));

    // Clear initial call
    mockWebSocketConstructor.mockClear();

    // Close connection to trigger reconnect timer
    act(() => {
      mockWebSocketInstance.onclose();
    });

    // Immediately disconnect manually
    act(() => {
      result.current.disconnect();
    });

    // Fast forward past reconnect interval
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should not have reconnected
    expect(mockWebSocketConstructor).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});