import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiEnvironment } from '../useApiEnvironment';
import { apiService, getCurrentEnvironment } from '@/services/api';

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    checkHealth: vi.fn(),
  },
  getCurrentEnvironment: vi.fn(),
}));

describe('useApiEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Mock environment variables
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('should start with checking status', () => {
    (getCurrentEnvironment as any).mockReturnValue('ec2');
    (apiService.checkHealth as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useApiEnvironment());

    expect(result.current).toEqual({
      environment: 'ec2',
      isHealthy: false,
      isChecking: true,
    });
  });

  it('should update to healthy when API check succeeds', async () => {
    (getCurrentEnvironment as any).mockReturnValue('ec2');
    (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });

    const { result } = renderHook(() => useApiEnvironment());

    await waitFor(() => {
      expect(result.current).toEqual({
        environment: 'ec2',
        isHealthy: true,
        isChecking: false,
      });
    });
  });

  it('should update to unhealthy when API check fails', async () => {
    (getCurrentEnvironment as any).mockReturnValue('ec2');
    (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));

    const { result } = renderHook(() => useApiEnvironment());

    await waitFor(() => {
      expect(result.current).toEqual({
        environment: 'ec2',
        isHealthy: false,
        isChecking: false,
      });
    });
  });

  it('should detect local environment correctly', async () => {
    (getCurrentEnvironment as any).mockReturnValue('local');
    (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));

    const { result } = renderHook(() => useApiEnvironment());

    await waitFor(() => {
      expect(result.current).toEqual({
        environment: 'local',
        isHealthy: false,
        isChecking: false,
      });
    });
  });

  it('should re-check health every 30 seconds', async () => {
    (getCurrentEnvironment as any).mockReturnValue('ec2');
    (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });

    renderHook(() => useApiEnvironment());

    await waitFor(() => {
      expect(apiService.checkHealth).toHaveBeenCalledTimes(1);
    });

    // Advance timer by 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(apiService.checkHealth).toHaveBeenCalledTimes(2);
    });

    // Advance timer by another 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(apiService.checkHealth).toHaveBeenCalledTimes(3);
    });
  });

  it('should clean up interval on unmount', async () => {
    (getCurrentEnvironment as any).mockReturnValue('ec2');
    (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });

    const { unmount } = renderHook(() => useApiEnvironment());

    await waitFor(() => {
      expect(apiService.checkHealth).toHaveBeenCalledTimes(1);
    });

    const callCountBeforeUnmount = (apiService.checkHealth as any).mock.calls.length;

    unmount();

    // Advance timer by 30 seconds after unmount
    vi.advanceTimersByTime(30000);

    // Should not have made any more calls after unmount
    expect(apiService.checkHealth).toHaveBeenCalledTimes(callCountBeforeUnmount);
  });

  it('should handle environment changes', async () => {
    (getCurrentEnvironment as any).mockReturnValue('local');
    (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));

    const { result } = renderHook(() => useApiEnvironment());

    await waitFor(() => {
      expect(result.current.environment).toBe('local');
    });

    // Mock environment change
    (getCurrentEnvironment as any).mockReturnValue('ec2');
    (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });

    // Trigger re-check after 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(result.current.environment).toBe('ec2');
      expect(result.current.isHealthy).toBe(true);
    });
  });

  it('should handle non-healthy status responses', async () => {
    (getCurrentEnvironment as any).mockReturnValue('ec2');
    (apiService.checkHealth as any).mockResolvedValue({ status: 'degraded', environment: 'production' });

    const { result } = renderHook(() => useApiEnvironment());

    await waitFor(() => {
      expect(result.current).toEqual({
        environment: 'ec2',
        isHealthy: false,
        isChecking: false,
      });
    });
  });

  it('should update isChecking state during re-check', async () => {
    (getCurrentEnvironment as any).mockReturnValue('ec2');
    
    let resolveHealth: (value: any) => void;
    (apiService.checkHealth as any).mockImplementation(() => 
      new Promise(resolve => {
        resolveHealth = resolve;
      })
    );

    const { result } = renderHook(() => useApiEnvironment());

    expect(result.current.isChecking).toBe(true);

    // Resolve the first check
    resolveHealth!({ status: 'healthy', environment: 'production' });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    // Advance timer to trigger re-check
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(result.current.isChecking).toBe(true);
    });

    // Resolve the second check
    resolveHealth!({ status: 'healthy', environment: 'production' });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });
  });
});