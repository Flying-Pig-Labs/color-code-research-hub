import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService, ApiError, ApiErrorType, getCurrentEnvironment, showApiError } from '../api';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
    // Reset environment variables
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_WEBHOOK_URL', 'http://webhook.test');
    vi.stubEnv('VITE_API_TIMEOUT', '300000');
    vi.stubEnv('VITE_POLL_INTERVAL', '2000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('ApiError', () => {
    it('should create an ApiError with proper properties', () => {
      const error = new ApiError(
        ApiErrorType.NETWORK_ERROR,
        'Network failed',
        { code: 'NETWORK_ERROR' }
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ApiErrorType.NETWORK_ERROR);
      expect(error.message).toBe('Network failed');
      expect(error.details).toEqual({ code: 'NETWORK_ERROR' });
      expect(error.name).toBe('ApiError');
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status when API responds successfully', async () => {
      const mockResponse = { status: 'healthy', environment: 'production' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await apiService.checkHealth();
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key',
            'Accept': 'application/json',
          }),
          credentials: 'include',
        })
      );
    });

    it('should return error status when API fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await apiService.checkHealth();
      
      expect(result).toEqual({
        status: 'error',
        environment: 'unknown',
      });
    });

    it('should handle timeout errors', async () => {
      // Mock an AbortError
      (global.fetch as any).mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      const result = await apiService.checkHealth();
      
      expect(result).toEqual({
        status: 'error',
        environment: 'unknown',
      });
    });
  });

  describe('getTeams', () => {
    it('should fetch teams successfully', async () => {
      const mockTeams = ['red', 'black', 'white'];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTeams,
      });

      const result = await apiService.getTeams();
      
      expect(result).toEqual(mockTeams);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/teams',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw ApiError on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiService.getTeams()).rejects.toThrow(ApiError);
      await expect(apiService.getTeams()).rejects.toMatchObject({
        type: ApiErrorType.NETWORK_ERROR,
        message: expect.stringContaining('Unable to connect to the server'),
      });
    });
  });

  describe('getTeamFields', () => {
    it('should fetch team fields successfully', async () => {
      const mockFields = [
        { name: 'task', type: 'text', required: true },
        { name: 'priority', type: 'select', options: ['high', 'medium', 'low'] },
      ];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFields,
      });

      const result = await apiService.getTeamFields('red');
      
      expect(result).toEqual(mockFields);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/teams/red/fields',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle 401 authentication errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(apiService.getTeamFields('red')).rejects.toThrow(ApiError);
      await expect(apiService.getTeamFields('red')).rejects.toMatchObject({
        type: ApiErrorType.AUTH_ERROR,
        message: 'Authentication failed. Please check your API key.',
      });
    });

    it('should handle server errors with custom messages', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });

      await expect(apiService.getTeamFields('red')).rejects.toThrow(ApiError);
      await expect(apiService.getTeamFields('red')).rejects.toMatchObject({
        type: ApiErrorType.SERVER_ERROR,
        message: 'Internal server error',
      });
    });
  });

  describe('submitResearch', () => {
    it('should submit research successfully', async () => {
      const mockResponse = { jobId: '12345' };
      const submission = {
        teamType: 'red' as const,
        fields: { task: 'Test task', priority: 'high' },
        webhookUrl: 'http://custom.webhook',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await apiService.submitResearch(submission);
      
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/research/submit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(submission),
        })
      );
    });

    it('should use default webhook URL when not provided', async () => {
      const mockResponse = { jobId: '12345' };
      const submission = {
        teamType: 'red' as const,
        fields: { task: 'Test task', priority: 'high' },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      await apiService.submitResearch(submission);
      
      const expectedBody = {
        ...submission,
        webhookUrl: 'http://webhook.test',
      };
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/research/submit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(expectedBody),
        })
      );
    });
  });

  describe('pollJobCompletion', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should poll until job is completed', async () => {
      const jobId = '12345';
      const mockStatuses = [
        { jobId, status: 'pending', createdAt: '2024-01-01' },
        { jobId, status: 'processing', createdAt: '2024-01-01' },
        { jobId, status: 'completed', createdAt: '2024-01-01', completedAt: '2024-01-02' },
      ];
      const mockResult = { data: 'result' };

      let callCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/status/')) {
          const response = mockStatuses[Math.min(callCount++, mockStatuses.length - 1)];
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => response,
          });
        } else if (url.includes('/results/')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockResult,
          });
        }
      });

      const onProgress = vi.fn();
      const resultPromise = apiService.pollJobCompletion(jobId, onProgress);

      // Advance through polling intervals
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(3000); // exponential backoff
      await vi.advanceTimersByTimeAsync(4500); // more backoff

      const result = await resultPromise;

      expect(result).toEqual(mockResult);
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenNthCalledWith(1, mockStatuses[0]);
      expect(onProgress).toHaveBeenNthCalledWith(2, mockStatuses[1]);
      expect(onProgress).toHaveBeenNthCalledWith(3, mockStatuses[2]);
    });

    it('should handle job failure', async () => {
      const jobId = '12345';
      const failedStatus = {
        jobId,
        status: 'failed',
        createdAt: '2024-01-01',
        error: 'Job processing failed',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => failedStatus,
      });

      await expect(apiService.pollJobCompletion(jobId)).rejects.toThrow(ApiError);
      await expect(apiService.pollJobCompletion(jobId)).rejects.toMatchObject({
        type: ApiErrorType.SERVER_ERROR,
        message: 'Job processing failed',
      });
    });

    it('should timeout after max attempts', async () => {
      const jobId = '12345';
      const pendingStatus = {
        jobId,
        status: 'pending',
        createdAt: '2024-01-01',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => pendingStatus,
      });

      const resultPromise = apiService.pollJobCompletion(jobId);

      // Fast-forward through all polling attempts
      await vi.advanceTimersByTimeAsync(300000); // 5 minutes

      await expect(resultPromise).rejects.toThrow(ApiError);
      await expect(resultPromise).rejects.toMatchObject({
        type: ApiErrorType.TIMEOUT_ERROR,
        message: 'Job polling timed out after 5 minutes',
      });
    });

    it('should continue polling on network errors', async () => {
      const jobId = '12345';
      let callCount = 0;

      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new TypeError('Failed to fetch'));
        } else if (callCount === 2) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ jobId, status: 'completed', createdAt: '2024-01-01' }),
          });
        } else {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ data: 'result' }),
          });
        }
      });

      const resultPromise = apiService.pollJobCompletion(jobId);

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(3000);

      const result = await resultPromise;
      expect(result).toEqual({ data: 'result' });
    });
  });

  describe('getCurrentEnvironment', () => {
    it('should detect local environment', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
      expect(getCurrentEnvironment()).toBe('local');

      vi.stubEnv('VITE_API_BASE_URL', 'http://127.0.0.1:3001');
      expect(getCurrentEnvironment()).toBe('local');
    });

    it('should detect non-local environment as unknown', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://ec2-12-34-56-78.compute-1.amazonaws.com');
      expect(getCurrentEnvironment()).toBe('unknown');

      vi.stubEnv('VITE_API_BASE_URL', 'http://192.168.1.100:3001');
      expect(getCurrentEnvironment()).toBe('unknown');
    });

    it('should return unknown for unrecognized URLs', () => {
      vi.stubEnv('VITE_API_BASE_URL', 'http://custom-domain.com');
      expect(getCurrentEnvironment()).toBe('unknown');
    });
  });

  describe('showApiError', () => {
    it('should show network error toast', () => {
      const error = new ApiError(
        ApiErrorType.NETWORK_ERROR,
        'Network failed'
      );

      showApiError(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Connection failed',
        expect.objectContaining({
          description: expect.stringContaining('Unable to reach the server'),
          action: expect.objectContaining({
            label: 'Setup Help',
          }),
        })
      );
    });

    it('should show CORS error toast', () => {
      const error = new ApiError(
        ApiErrorType.CORS_ERROR,
        'CORS blocked'
      );

      showApiError(error);

      expect(toast.error).toHaveBeenCalledWith(
        'CORS Error',
        expect.objectContaining({
          description: expect.stringContaining('Cross-origin requests are blocked'),
        })
      );
    });

    it('should show auth error toast', () => {
      const error = new ApiError(
        ApiErrorType.AUTH_ERROR,
        'Invalid API key'
      );

      showApiError(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Authentication Failed',
        expect.objectContaining({
          description: expect.stringContaining('check your API key'),
        })
      );
    });

    it('should show timeout error toast', () => {
      const error = new ApiError(
        ApiErrorType.TIMEOUT_ERROR,
        'Request timed out'
      );

      showApiError(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Request Timeout',
        expect.objectContaining({
          description: expect.stringContaining('taking too long to respond'),
        })
      );
    });

    it('should show generic error for unknown types', () => {
      const error = new ApiError(
        ApiErrorType.UNKNOWN_ERROR,
        'Something went wrong'
      );

      showApiError(error);

      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });
});