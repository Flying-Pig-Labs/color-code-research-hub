import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SwarmDashboard from '../SwarmDashboard';
import { toast } from 'sonner';

// Mock Header component
vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="mock-header">Header</div>
}));

// Mock sonner
vi.mock('sonner');

describe('SwarmDashboard', () => {
  let originalFetch: typeof global.fetch;
  const originalEnv = import.meta.env.VITE_API_BASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    originalFetch = global.fetch;
    // Set the API base URL
    import.meta.env.VITE_API_BASE_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    import.meta.env.VITE_API_BASE_URL = originalEnv;
  });

  it('should render loading state initially', () => {
    // Mock fetch to never resolve, keeping the loading state
    global.fetch = vi.fn(() => new Promise(() => {}));
    
    render(<SwarmDashboard />);
    
    expect(screen.getByText('Loading swarm dashboard...')).toBeInTheDocument();
  });

  it('should render dashboard after data loads', async () => {
    // Mock successful API responses
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ swarms: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          system: {
            uptime: 3600000,
            memory: {
              rss: 100 * 1024 * 1024,
              heapTotal: 50 * 1024 * 1024,
              heapUsed: 30 * 1024 * 1024,
            },
            activeSwarms: 0,
            connectedClients: 0,
            totalExecutions: 0
          }
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });
    
    render(<SwarmDashboard />);
    
    // Wait for loading to finish and find the monitor command
    await waitFor(() => {
      expect(screen.getByText('$ swarm --monitor')).toBeInTheDocument();
    });
    
    // Check that header is rendered
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    
    // Check that description is shown - use getAllByText since it appears multiple times
    const descriptions = screen.getAllByText('Monitor and control all AI agent swarms');
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it('should make correct API calls', async () => {
    // Create mock responses for each API call
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ swarms: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ system: {} }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });
    
    render(<SwarmDashboard />);
    
    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByText('Loading swarm dashboard...')).not.toBeInTheDocument();
    });
    
    // Check that all required endpoints were called
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/claude-flow/swarms');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/claude-flow/system/status');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/claude-flow/logs?limit=50&level=info');
  });

  it('should handle API errors', async () => {
    // Mock console.error to prevent error logging in test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    render(<SwarmDashboard />);
    
    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch dashboard data');
    });
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('should display system metrics when loaded', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ swarms: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          system: {
            uptime: 3600, // 1 hour in seconds
            memory: {
              rss: 100 * 1024 * 1024,
              heapTotal: 50 * 1024 * 1024,
              heapUsed: 30 * 1024 * 1024,
            },
            activeSwarms: 2,
            connectedClients: 3,
            totalExecutions: 50
          }
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ logs: [] }),
      });
    
    render(<SwarmDashboard />);
    
    // Wait for data to load using waitFor - use getAllByText since it appears multiple times
    await waitFor(() => {
      const activeSwarmElements = screen.getAllByText('Active Swarms');
      expect(activeSwarmElements.length).toBeGreaterThan(0);
    });
    
    // Check metrics are displayed
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Active swarms count
    });
    
    // Check that system status cards are displayed correctly
    await waitFor(() => {
      expect(screen.getByText('Total Executions')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument(); // Total executions count
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Uptime')).toBeInTheDocument();
    });
  });
});