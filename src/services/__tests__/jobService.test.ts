import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { jobService } from '../jobService';

describe('jobService', () => {
  const mockFetch = vi.fn();
  const mockBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getJobStatus', () => {
    it('should return job status when job exists', async () => {
      const mockJob = {
        id: 'job-123',
        status: 'processing',
        teamType: 'red',
        repoId: 'repo-456',
        repository: 'org/repo',
        repoName: 'repo',
        submittedAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:01:00Z',
        githubUrl: 'https://github.com/org/repo'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockJob
      });
      
      const result = await jobService.getJobStatus('job-123');
      
      expect(result).toEqual(mockJob);
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/api/ec2/status/job-123`);
    });

    it('should return null when job does not exist (404)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await jobService.getJobStatus('non-existent');
      
      expect(result).toBeNull();
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      await expect(jobService.getJobStatus('job-123'))
        .rejects.toThrow('Failed to get job status: 500');
    });

    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(jobService.getJobStatus('job-123'))
        .rejects.toThrow('Network error');
    });
  });

  describe('getJobs', () => {
    const mockJobs = [
      {
        id: 'job-1',
        status: 'completed',
        teamType: 'red',
        repoId: 'repo-1',
        repository: 'org/repo1',
        repoName: 'repo1',
        submittedAt: '2024-01-01T00:00:00Z',
        githubUrl: 'https://github.com/org/repo1'
      },
      {
        id: 'job-2',
        status: 'processing',
        teamType: 'black',
        repoId: 'repo-2',
        repository: 'org/repo2',
        repoName: 'repo2',
        submittedAt: '2024-01-01T00:10:00Z',
        githubUrl: 'https://github.com/org/repo2'
      }
    ];

    it('should return all jobs when no team type specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ jobs: mockJobs })
      });
      
      const result = await jobService.getJobs();
      
      expect(result).toEqual(mockJobs);
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/api/ec2/jobs`);
    });

    it('should return filtered jobs when team type specified', async () => {
      const redJobs = mockJobs.filter(j => j.teamType === 'red');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ jobs: redJobs })
      });
      
      const result = await jobService.getJobs('red');
      
      expect(result).toEqual(redJobs);
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/api/ec2/jobs?teamType=red`);
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });
      
      await expect(jobService.getJobs())
        .rejects.toThrow('Failed to get jobs: 500');
    });

    it('should handle empty jobs list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ jobs: [] })
      });
      
      const result = await jobService.getJobs();
      
      expect(result).toEqual([]);
    });
  });

  describe('pollJobUntilComplete', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return immediately when job is already completed', async () => {
      const completedJob = {
        id: 'job-123',
        status: 'completed' as const,
        teamType: 'red',
        repoId: 'repo-456',
        repository: 'org/repo',
        repoName: 'repo',
        submittedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:05:00Z',
        githubUrl: 'https://github.com/org/repo'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => completedJob
      });
      
      const result = await jobService.pollJobUntilComplete('job-123');
      
      expect(result).toEqual(completedJob);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should poll until job completes', async () => {
      const onStatusUpdate = vi.fn();
      
      const processingJob = {
        id: 'job-123',
        status: 'processing' as const,
        teamType: 'red',
        repoId: 'repo-456',
        repository: 'org/repo',
        repoName: 'repo',
        submittedAt: '2024-01-01T00:00:00Z',
        githubUrl: 'https://github.com/org/repo'
      };
      
      const completedJob = {
        ...processingJob,
        status: 'completed' as const,
        completedAt: '2024-01-01T00:05:00Z'
      };
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => processingJob
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => processingJob
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => completedJob
        });
      
      const pollPromise = jobService.pollJobUntilComplete('job-123', onStatusUpdate, {
        interval: 1000
      });
      
      // Let the first call happen
      await vi.advanceTimersByTimeAsync(0);
      
      // First check - processing
      expect(onStatusUpdate).toHaveBeenCalledWith(processingJob);
      
      // Wait for first interval
      await vi.advanceTimersByTimeAsync(1000);
      
      // Second check - still processing
      expect(onStatusUpdate).toHaveBeenCalledTimes(2);
      
      // Wait for second interval
      await vi.advanceTimersByTimeAsync(1000);
      
      // Third check - completed
      const result = await pollPromise;
      
      expect(result).toEqual(completedJob);
      expect(onStatusUpdate).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle job failure', async () => {
      const failedJob = {
        id: 'job-123',
        status: 'failed' as const,
        teamType: 'red',
        repoId: 'repo-456',
        repository: 'org/repo',
        repoName: 'repo',
        submittedAt: '2024-01-01T00:00:00Z',
        githubUrl: 'https://github.com/org/repo',
        error: 'Something went wrong'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => failedJob
      });
      
      const result = await jobService.pollJobUntilComplete('job-123');
      
      expect(result).toEqual(failedJob);
      expect(result.status).toBe('failed');
    });

    it('should throw error when job not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      await expect(jobService.pollJobUntilComplete('non-existent'))
        .rejects.toThrow('Job not found');
    });

    it('should throw error on timeout', async () => {
      const processingJob = {
        id: 'job-123',
        status: 'processing' as const,
        teamType: 'red',
        repoId: 'repo-456',
        repository: 'org/repo',
        repoName: 'repo',
        submittedAt: '2024-01-01T00:00:00Z',
        githubUrl: 'https://github.com/org/repo'
      };
      
      // Always return processing status
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => processingJob
      });
      
      const pollPromise = jobService.pollJobUntilComplete('job-123', undefined, {
        maxAttempts: 3,
        interval: 100
      });
      
      // Advance through all attempts
      await vi.advanceTimersByTimeAsync(300);
      
      await expect(pollPromise).rejects.toThrow('Job polling timeout');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('checkJobStatuses', () => {
    it('should check multiple jobs in parallel', async () => {
      const jobs = {
        'job-1': {
          id: 'job-1',
          status: 'completed' as const,
          teamType: 'red',
          repoId: 'repo-1',
          repository: 'org/repo1',
          repoName: 'repo1',
          submittedAt: '2024-01-01T00:00:00Z',
          githubUrl: 'https://github.com/org/repo1'
        },
        'job-2': {
          id: 'job-2',
          status: 'processing' as const,
          teamType: 'black',
          repoId: 'repo-2',
          repository: 'org/repo2',
          repoName: 'repo2',
          submittedAt: '2024-01-01T00:10:00Z',
          githubUrl: 'https://github.com/org/repo2'
        }
      };
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => jobs['job-1']
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => jobs['job-2']
        });
      
      const result = await jobService.checkJobStatuses(['job-1', 'job-2']);
      
      expect(result.size).toBe(2);
      expect(result.get('job-1')).toEqual(jobs['job-1']);
      expect(result.get('job-2')).toEqual(jobs['job-2']);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle missing jobs gracefully', async () => {
      const job1 = {
        id: 'job-1',
        status: 'completed' as const,
        teamType: 'red',
        repoId: 'repo-1',
        repository: 'org/repo1',
        repoName: 'repo1',
        submittedAt: '2024-01-01T00:00:00Z',
        githubUrl: 'https://github.com/org/repo1'
      };
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => job1
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        })
        .mockRejectedValueOnce(new Error('Network error'));
      
      const result = await jobService.checkJobStatuses(['job-1', 'job-2', 'job-3']);
      
      expect(result.size).toBe(1);
      expect(result.get('job-1')).toEqual(job1);
      expect(result.has('job-2')).toBe(false);
      expect(result.has('job-3')).toBe(false);
    });

    it('should handle empty job list', async () => {
      const result = await jobService.checkJobStatuses([]);
      
      expect(result.size).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});