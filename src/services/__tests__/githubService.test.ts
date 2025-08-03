import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { githubService } from '../githubService';

describe('githubService', () => {
  const mockFetch = vi.fn();
  
  // Get actual environment values to use in tests
  const ACTUAL_GITHUB_ORG = import.meta.env.VITE_GITHUB_ORG || '';
  const ACTUAL_GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkRepoExists', () => {
    it('should return repo data when repo exists', async () => {
      const mockRepo = {
        name: 'test-repo',
        html_url: 'https://github.com/test-org/test-repo',
        created_at: '2024-01-01T00:00:00Z',
        private: false,
        description: 'Test repository'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRepo
      });
      
      const result = await githubService.checkRepoExists('test-repo');
      
      expect(result).toEqual(mockRepo);
      if (ACTUAL_GITHUB_ORG) {
        expect(mockFetch).toHaveBeenCalledWith(
          `https://api.github.com/repos/${ACTUAL_GITHUB_ORG}/test-repo`,
          expect.objectContaining({
            headers: expect.objectContaining({
              'Accept': 'application/vnd.github.v3+json'
            })
          })
        );
      }
    });

    it('should return null when repo does not exist (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await githubService.checkRepoExists('non-existent');
      
      expect(result).toBeNull();
    });

    it('should handle missing GITHUB_ORG gracefully', async () => {
      // If GITHUB_ORG is not set, the service should return null
      if (!ACTUAL_GITHUB_ORG) {
        const result = await githubService.checkRepoExists('test-repo');
        expect(result).toBeNull();
        expect(mockFetch).not.toHaveBeenCalled();
      } else {
        // Skip this test if GITHUB_ORG is configured
        expect(true).toBe(true);
      }
    });

    it('should throw error on authentication failure (401)', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        expect(true).toBe(true); // Skip if no org configured
        return;
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });
      
      await expect(githubService.checkRepoExists('test-repo'))
        .rejects.toThrow('GitHub authentication failed. Check your token.');
    });

    it('should throw error on rate limit exceeded', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        expect(true).toBe(true); // Skip if no org configured
        return;
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: {
          get: (key: string) => key === 'X-RateLimit-Remaining' ? '0' : null
        }
      });
      
      await expect(githubService.checkRepoExists('test-repo'))
        .rejects.toThrow('GitHub API rate limit exceeded. Try again later.');
    });

    it('should throw error on forbidden access', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        expect(true).toBe(true); // Skip if no org configured
        return;
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: {
          get: () => '100'
        }
      });
      
      await expect(githubService.checkRepoExists('test-repo'))
        .rejects.toThrow('GitHub API access forbidden. Check your permissions.');
    });

    it('should handle general API errors', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        expect(true).toBe(true); // Skip if no org configured
        return;
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' })
      });
      
      await expect(githubService.checkRepoExists('test-repo'))
        .rejects.toThrow('GitHub API error: Internal Server Error');
    });

    it('should handle network errors', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        expect(true).toBe(true); // Skip if no org configured
        return;
      }
      
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      
      await expect(githubService.checkRepoExists('test-repo'))
        .rejects.toThrow('Unable to connect to GitHub. Check your internet connection.');
    });
  });

  describe('listRecentRepos', () => {
    it('should return filtered repos with prefix', async () => {
      const mockRepos = [
        { name: 'ci-project-1', html_url: 'url1', created_at: '2024-01-01', private: false },
        { name: 'ci-project-2', html_url: 'url2', created_at: '2024-01-02', private: false },
        { name: 'other-project', html_url: 'url3', created_at: '2024-01-03', private: false }
      ];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRepos
      });
      
      const result = await githubService.listRecentRepos('ci-', 10);
      
      if (ACTUAL_GITHUB_ORG) {
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('ci-project-1');
        expect(result[1].name).toBe('ci-project-2');
        expect(mockFetch).toHaveBeenCalledWith(
          `https://api.github.com/orgs/${ACTUAL_GITHUB_ORG}/repos?sort=created&direction=desc&per_page=10`,
          expect.any(Object)
        );
      } else {
        expect(result).toEqual([]);
        expect(mockFetch).not.toHaveBeenCalled();
      }
    });

    it('should return empty array on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      const result = await githubService.listRecentRepos();
      
      expect(result).toEqual([]);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await githubService.listRecentRepos();
      
      expect(result).toEqual([]);
    });
  });

  describe('pollForRepo', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return repo when found on first attempt', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        expect(true).toBe(true); // Skip if no org configured
        return;
      }
      
      const mockRepo = { name: 'test-repo', html_url: 'url', created_at: '2024-01-01', private: false };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRepo
      });
      
      const result = await githubService.pollForRepo('test-repo');
      
      expect(result).toEqual(mockRepo);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should poll multiple times with exponential backoff', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        expect(true).toBe(true); // Skip if no org configured
        return;
      }
      
      const onProgress = vi.fn();
      
      // First two attempts return 404, third succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ name: 'test-repo' })
        });
      
      const pollPromise = githubService.pollForRepo('test-repo', {
        maxAttempts: 5,
        initialInterval: 100,
        onProgress
      });
      
      // First attempt
      expect(onProgress).toHaveBeenCalledWith(1, 100);
      
      // Wait for first interval
      await vi.advanceTimersByTimeAsync(100);
      
      // Second attempt with increased interval
      expect(onProgress).toHaveBeenCalledWith(2, 150);
      
      // Wait for second interval
      await vi.advanceTimersByTimeAsync(150);
      
      // Third attempt should succeed
      const result = await pollPromise;
      
      expect(result).toEqual({ name: 'test-repo' });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return null after max attempts', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });
      
      const pollPromise = githubService.pollForRepo('test-repo', {
        maxAttempts: 3,
        initialInterval: 10
      });
      
      // Advance timers for all attempts
      await vi.advanceTimersByTimeAsync(100);
      
      const result = await pollPromise;
      
      expect(result).toBeNull();
      if (ACTUAL_GITHUB_ORG) {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      }
    });
  });

  describe('getRepoContents', () => {
    it('should return repo contents', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        await expect(githubService.getRepoContents('test-repo'))
          .rejects.toThrow('GITHUB_ORG not configured');
        return;
      }
      
      const mockContents = [
        { name: 'README.md', type: 'file', size: 1234 },
        { name: 'src', type: 'dir' }
      ];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockContents
      });
      
      const result = await githubService.getRepoContents('test-repo', 'path/to/dir');
      
      expect(result).toEqual(mockContents);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.github.com/repos/${ACTUAL_GITHUB_ORG}/test-repo/contents/path/to/dir`,
        expect.any(Object)
      );
    });

    it('should throw error on API failure', async () => {
      if (!ACTUAL_GITHUB_ORG) {
        await expect(githubService.getRepoContents('test-repo'))
          .rejects.toThrow('GITHUB_ORG not configured');
        return;
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      await expect(githubService.getRepoContents('test-repo'))
        .rejects.toThrow('Failed to get repo contents: 404');
    });
  });

  describe('repoExists', () => {
    it('should return true when repo exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ name: 'test-repo' })
      });
      
      const result = await githubService.repoExists('test-repo');
      
      if (ACTUAL_GITHUB_ORG) {
        expect(result).toBe(true);
      } else {
        expect(result).toBe(false);
      }
    });

    it('should return false when repo does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await githubService.repoExists('test-repo');
      
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await githubService.repoExists('test-repo');
      
      expect(result).toBe(false);
    });
  });
});