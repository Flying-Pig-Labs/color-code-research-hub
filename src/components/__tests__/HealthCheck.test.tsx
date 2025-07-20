import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { HealthCheck } from '../HealthCheck';
import { apiService, getCurrentEnvironment } from '@/services/api';

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    checkHealth: vi.fn(),
  },
  getCurrentEnvironment: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className?: string }) => <div data-testid="check-icon" className={className} />,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-icon" className={className} />,
  RefreshCw: ({ className }: { className?: string }) => <div data-testid="refresh-icon" className={className} />,
}));

describe('HealthCheck', () => {
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

  it('should show checking status initially', () => {
    (apiService.checkHealth as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    (getCurrentEnvironment as any).mockReturnValue('ec2');

    render(<HealthCheck />);

    expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    expect(screen.getByText('Checking connection...')).toBeInTheDocument();
  });

  it('should show healthy status when API is connected', async () => {
    (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });
    (getCurrentEnvironment as any).mockReturnValue('ec2');

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.getByText('Connected to EC2 (ec2)')).toBeInTheDocument();
    });
  });

  it('should show local status when running locally', async () => {
    (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));
    (getCurrentEnvironment as any).mockReturnValue('local');

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Running locally (no backend)')).toBeInTheDocument();
    });
  });

  it('should show error status when EC2 connection fails', async () => {
    (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));
    (getCurrentEnvironment as any).mockReturnValue('ec2');

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.getByText('EC2 connection failed')).toBeInTheDocument();
    });
  });

  it('should show retry button on error', async () => {
    (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));
    (getCurrentEnvironment as any).mockReturnValue('ec2');

    render(<HealthCheck />);

    await waitFor(() => {
      const retryButton = screen.getByRole('button');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });
  });

  it('should retry health check when retry button is clicked', async () => {
    (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));
    (getCurrentEnvironment as any).mockReturnValue('ec2');

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    // Now mock successful response
    (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });

    const retryButton = screen.getByRole('button');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.getByText('Connected to EC2 (ec2)')).toBeInTheDocument();
    });
  });

  it('should disable retry button while checking', async () => {
    (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));
    (getCurrentEnvironment as any).mockReturnValue('ec2');

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });

    // Mock a slow response
    (apiService.checkHealth as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    const retryButton = screen.getByRole('button');
    fireEvent.click(retryButton);

    // Button should be disabled while checking
    expect(retryButton).toBeDisabled();
  });

  it('should re-check health every 30 seconds', async () => {
    (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });
    (getCurrentEnvironment as any).mockReturnValue('ec2');

    render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    expect(apiService.checkHealth).toHaveBeenCalledTimes(1);

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
    (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });
    (getCurrentEnvironment as any).mockReturnValue('ec2');

    const { unmount } = render(<HealthCheck />);

    await waitFor(() => {
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });

    const callCountBeforeUnmount = (apiService.checkHealth as any).mock.calls.length;

    unmount();

    // Advance timer by 30 seconds after unmount
    vi.advanceTimersByTime(30000);

    // Should not have made any more calls after unmount
    expect(apiService.checkHealth).toHaveBeenCalledTimes(callCountBeforeUnmount);
  });

  describe('Tooltip Content', () => {
    it('should show healthy tooltip content', async () => {
      (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });
      (getCurrentEnvironment as any).mockReturnValue('ec2');

      render(<HealthCheck />);

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });

      // The tooltip content is rendered but hidden by default
      // We can check for the trigger element
      const statusText = screen.getByText('Connected to EC2 (ec2)');
      expect(statusText).toBeInTheDocument();
    });

    it('should show local mode tooltip content', async () => {
      (apiService.checkHealth as any).mockRejectedValue(new Error('Connection failed'));
      (getCurrentEnvironment as any).mockReturnValue('local');

      render(<HealthCheck />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      });

      const statusText = screen.getByText('Running locally (no backend)');
      expect(statusText).toBeInTheDocument();
    });
  });

  describe('Icon Styling', () => {
    it('should apply correct styles to icons', async () => {
      (apiService.checkHealth as any).mockResolvedValue({ status: 'healthy', environment: 'production' });
      (getCurrentEnvironment as any).mockReturnValue('ec2');

      render(<HealthCheck />);

      await waitFor(() => {
        const checkIcon = screen.getByTestId('check-icon');
        expect(checkIcon).toHaveClass('text-green-500');
      });
    });

    it('should apply animation to refresh icon', async () => {
      (apiService.checkHealth as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      (getCurrentEnvironment as any).mockReturnValue('ec2');

      render(<HealthCheck />);

      const refreshIcon = screen.getByTestId('refresh-icon');
      expect(refreshIcon).toHaveClass('animate-spin');
    });
  });
});