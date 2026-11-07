/**
 * @fileoverview Job service for managing long-running research and processing tasks.
 * 
 * Provides task management capabilities for the Color Code Research Hub including:
 * - Job status tracking and polling
 * - Team-based job filtering
 * - Parallel job status checking
 * - Automatic retry and timeout handling
 * 
 * Used primarily for EC2-based processing jobs that can take several minutes
 * to complete, requiring status polling and progress updates.
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { apiFetch } from '@/lib/apiFetch';

/**
 * Interface defining the structure of a job status response.
 * Represents the lifecycle state of a long-running task.
 */
interface JobStatus {
  /** Unique job identifier */
  id: string;
  /** Current processing status */
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  /** Team type that initiated the job */
  teamType: string;
  /** Repository identifier */
  repoId: string;
  /** Full repository name with owner */
  repository: string;
  /** Repository name only */
  repoName: string;
  /** Job submission timestamp */
  submittedAt: string;
  /** Processing start timestamp (optional) */
  startedAt?: string;
  /** Job completion timestamp (optional) */
  completedAt?: string;
  /** GitHub repository URL */
  githubUrl: string;
  /** Error message if job failed (optional) */
  error?: string;
  /** Raw EC2 response data (optional) */
  ec2Response?: any;
}

/**
 * Response interface for job list endpoints.
 */
interface JobListResponse {
  jobs: JobStatus[];
}

/**
 * Service class for managing job lifecycle operations.
 * Provides methods for job tracking, polling, and status management.
 */
class JobService {
  private baseUrl: string;

  /**
   * Initialize job service with environment-based API URL.
   * Defaults to localhost for development, production URL for deployed environments.
   */
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  /**
   * Retrieve the current status of a specific job.
   * 
   * Fetches job information from the EC2 processing endpoint.
   * Returns null if the job is not found (404 response).
   * 
   * @param {string} jobId - Unique identifier for the job
   * @returns {Promise<JobStatus | null>} Job status object or null if not found
   * @throws {Error} When the API request fails or returns an error status
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      return await apiFetch(`/api/ec2/status/${jobId}`);
    } catch (error) {
      // Handle job not found gracefully
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('404')) {
        return null;
      }
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  /**
   * Retrieve all jobs with optional team-based filtering.
   * 
   * Fetches a list of all jobs from the system, with optional filtering
   * by team type (red, black, white). Useful for team-specific dashboards
   * and administrative overview.
   * 
   * @param {string} [teamType] - Optional team filter (red, black, white)
   * @returns {Promise<JobStatus[]>} Array of job status objects
   * @throws {Error} When the API request fails or returns an error status
   */
  async getJobs(teamType?: string): Promise<JobStatus[]> {
    try {
      const path = teamType 
        ? `/api/ec2/jobs?teamType=${teamType}`
        : `/api/ec2/jobs`;
        
      const data: JobListResponse = await apiFetch(path);
      return data.jobs;
    } catch (error) {
      console.error('Error getting jobs:', error);
      throw error;
    }
  }

  /**
   * Poll for job completion with configurable retry logic.
   * 
   * Continuously checks job status until completion or failure, with configurable
   * polling interval and maximum attempts. Provides real-time status updates
   * through callback function.
   * 
   * Default configuration:
   * - Maximum attempts: 60 (5 minutes at 5-second intervals)
   * - Polling interval: 5000ms (5 seconds)
   * 
   * @param {string} jobId - Unique identifier for the job to poll
   * @param {Function} [onStatusUpdate] - Optional callback for status updates
   * @param {Object} [options] - Polling configuration options
   * @param {number} [options.maxAttempts=60] - Maximum polling attempts
   * @param {number} [options.interval=5000] - Milliseconds between polls
   * @returns {Promise<JobStatus>} Final job status when completed or failed
   * @throws {Error} When job is not found or polling times out
   */
  async pollJobUntilComplete(
    jobId: string,
    onStatusUpdate?: (status: JobStatus) => void,
    options: {
      maxAttempts?: number;
      interval?: number;
    } = {}
  ): Promise<JobStatus> {
    const { maxAttempts = 60, interval = 5000 } = options; // 5 minutes max by default
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getJobStatus(jobId);
      
      if (!status) {
        throw new Error('Job not found');
      }
      
      // Notify callback of status update
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
      
      // Job has reached a terminal state
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }
      
      // Wait before next poll (except on last attempt)
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('Job polling timeout');
  }

  /**
   * Check the status of multiple jobs concurrently.
   * 
   * Efficiently retrieves status for multiple jobs in parallel, handling
   * individual failures gracefully. Useful for dashboard updates and
   * bulk status checks.
   * 
   * Failed job status checks are logged but don't affect other jobs.
   * Only successfully retrieved statuses are included in the result.
   * 
   * @param {string[]} jobIds - Array of job IDs to check
   * @returns {Promise<Map<string, JobStatus>>} Map of jobId to JobStatus
   */
  async checkJobStatuses(jobIds: string[]): Promise<Map<string, JobStatus>> {
    const results = new Map<string, JobStatus>();
    
    // Check all jobs in parallel for efficiency
    const promises = jobIds.map(async (jobId) => {
      try {
        const status = await this.getJobStatus(jobId);
        if (status) {
          results.set(jobId, status);
        }
      } catch (error) {
        console.error(`Failed to check job ${jobId}:`, error);
        // Continue processing other jobs even if one fails
      }
    });
    
    await Promise.all(promises);
    return results;
  }
}

/**
 * Singleton instance of the JobService for application-wide use.
 * Provides a consistent interface for job management across components.
 */
export const jobService = new JobService();

/**
 * Export JobStatus interface for type safety in consuming components.
 */
export type { JobStatus };