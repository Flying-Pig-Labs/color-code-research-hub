import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService, ApiError, ApiErrorType } from '../api';

describe('API Service - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Mock environment variables
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubEnv('VITE_API_KEY', 'test-api-key');
    vi.stubEnv('VITE_API_TIMEOUT', '300000');
    vi.stubEnv('VITE_POLL_INTERVAL', '2000');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle malformed JSON responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiService.getTeams()).rejects.toThrow(ApiError);
      await expect(apiService.getTeams()).rejects.toMatchObject({
        type: ApiErrorType.SERVER_ERROR,
        message: 'Server error: 500',
      });
    });

    it('should handle empty response bodies', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      });

      await expect(apiService.getTeams()).rejects.toThrow();
    });

    it('should handle network timeouts gracefully', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      (global.fetch as any).mockRejectedValueOnce(abortError);

      await expect(apiService.getTeams()).rejects.toThrow(ApiError);
      await expect(apiService.getTeams()).rejects.toMatchObject({
        type: ApiErrorType.TIMEOUT_ERROR,
        message: expect.stringContaining('timed out'),
      });
    });

    it('should handle CORS errors with specific messages', async () => {
      const corsError = new TypeError('Failed to fetch');
      corsError.message = 'CORS policy blocked request';
      (global.fetch as any).mockRejectedValueOnce(corsError);

      await expect(apiService.getTeams()).rejects.toThrow(ApiError);
      await expect(apiService.getTeams()).rejects.toMatchObject({
        type: ApiErrorType.CORS_ERROR,
        message: expect.stringContaining('CORS error'),
      });
    });

    it('should handle undefined error messages', async () => {
      const error = new Error();
      error.message = undefined as any;
      (global.fetch as any).mockRejectedValueOnce(error);

      await expect(apiService.getTeams()).rejects.toThrow(ApiError);
      await expect(apiService.getTeams()).rejects.toMatchObject({
        type: ApiErrorType.UNKNOWN_ERROR,
        message: 'An unexpected error occurred',
      });
    });

    it('should handle non-Error objects thrown by fetch', async () => {
      (global.fetch as any).mockRejectedValueOnce('String error');

      await expect(apiService.getTeams()).rejects.toThrow(ApiError);
      await expect(apiService.getTeams()).rejects.toMatchObject({
        type: ApiErrorType.UNKNOWN_ERROR,
      });
    });

    it('should handle null responses', async () => {
      (global.fetch as any).mockResolvedValueOnce(null);

      await expect(apiService.getTeams()).rejects.toThrow(TypeError);
    });

    it('should handle responses with ok=true but error status codes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 500, // This shouldn't happen but testing edge case
        json: async () => ({ error: 'Server error' }),
      });

      const result = await apiService.getTeams();
      expect(result).toEqual({ error: 'Server error' });
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      const mockResponse = ['red', 'black', 'white'];
      let callCount = 0;
      
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: async () => mockResponse,
            });
          }, Math.random() * 100); // Random delay
        });
      });

      // Make multiple concurrent requests
      const promises = Array(10).fill(null).map(() => apiService.getTeams());
      const results = await Promise.all(promises);

      expect(callCount).toBe(10);
      results.forEach(result => {
        expect(result).toEqual(mockResponse);
      });
    });

    it('should handle mixed success and failure in concurrent requests', async () => {
      let callCount = 0;
      
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ['success'],
          });
        } else {
          return Promise.reject(new Error('Network error'));
        }
      });

      // Make multiple concurrent requests
      const promises = Array(6).fill(null).map(() => 
        apiService.getTeams().catch(err => err)
      );
      const results = await Promise.all(promises);

      expect(callCount).toBe(6);
      expect(results.filter(r => Array.isArray(r))).toHaveLength(3);
      expect(results.filter(r => r instanceof ApiError)).toHaveLength(3);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle very large response payloads', async () => {
      const largeArray = Array(10000).fill({ 
        id: 1, 
        name: 'test', 
        data: 'x'.repeat(1000) 
      });
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => largeArray,
      });

      const result = await apiService.getTeams();
      expect(result).toHaveLength(10000);
    });

    it('should cleanup aborted requests properly', async () => {
      const controllers: AbortController[] = [];
      
      // Mock AbortController to track instances
      const originalAbortController = global.AbortController;
      global.AbortController = class MockAbortController {
        signal = { aborted: false };
        abort() {
          this.signal.aborted = true;
        }
        constructor() {
          controllers.push(this as any);
        }
      } as any;

      // Set a very short timeout
      vi.stubEnv('VITE_API_TIMEOUT', '10');
      
      (global.fetch as any).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      try {
        await apiService.getTeams();
      } catch (error) {
        // Expected to fail with timeout
      }

      // Check that abort was called
      expect(controllers).toHaveLength(1);
      expect(controllers[0].signal.aborted).toBe(true);

      // Restore
      global.AbortController = originalAbortController;
      vi.unstubAllEnvs();
    });
  });

  describe('Environment Variable Edge Cases', () => {
    it('should handle missing environment variables', async () => {
      vi.stubEnv('VITE_API_BASE_URL', '');
      vi.stubEnv('VITE_API_KEY', '');
      vi.stubEnv('VITE_API_TIMEOUT', '');
      vi.stubEnv('VITE_POLL_INTERVAL', '');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ['test'],
      });

      const result = await apiService.getTeams();
      expect(result).toEqual(['test']);
      
      // Should use defaults
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/teams',
        expect.any(Object)
      );
    });

    it('should handle invalid timeout values', async () => {
      vi.stubEnv('VITE_API_TIMEOUT', 'invalid');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ['test'],
      });

      // Should not throw, should use default timeout
      const result = await apiService.getTeams();
      expect(result).toEqual(['test']);
    });
  });

  describe('Special Response Cases', () => {
    it('should handle 204 No Content responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      // 204 responses have no body, so json() will fail
      await expect(apiService.getTeams()).rejects.toThrow();
    });

    it('should handle redirect responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 302,
        json: async () => ({ message: 'Redirect' }),
      });

      await expect(apiService.getTeams()).rejects.toThrow(ApiError);
      await expect(apiService.getTeams()).rejects.toMatchObject({
        type: ApiErrorType.SERVER_ERROR,
        message: expect.stringContaining('Redirect'),
      });
    });

    it('should handle rate limiting (429) responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ 
          message: 'Too many requests',
          retryAfter: 60 
        }),
      });

      await expect(apiService.getTeams()).rejects.toThrow(ApiError);
      await expect(apiService.getTeams()).rejects.toMatchObject({
        type: ApiErrorType.SERVER_ERROR,
        message: 'Too many requests',
        details: expect.objectContaining({
          data: expect.objectContaining({
            retryAfter: 60
          })
        })
      });
    });
  });
});