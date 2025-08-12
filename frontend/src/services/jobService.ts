interface JobStatus {
  id: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  teamType: string;
  repoId: string;
  repository: string;
  repoName: string;
  submittedAt: string;
  startedAt?: string;
  completedAt?: string;
  githubUrl: string;
  error?: string;
  ec2Response?: any;
}

interface JobListResponse {
  jobs: JobStatus[];
}

class JobService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  /**
   * Get status of a specific job
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ec2/status/${jobId}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  /**
   * Get all jobs, optionally filtered by team type
   */
  async getJobs(teamType?: string): Promise<JobStatus[]> {
    try {
      const url = teamType 
        ? `${this.baseUrl}/api/ec2/jobs?teamType=${teamType}`
        : `${this.baseUrl}/api/ec2/jobs`;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to get jobs: ${response.status}`);
      }
      
      const data: JobListResponse = await response.json();
      return data.jobs;
    } catch (error) {
      console.error('Error getting jobs:', error);
      throw error;
    }
  }

  /**
   * Poll for job completion with automatic retries
   */
  async pollJobUntilComplete(
    jobId: string,
    onStatusUpdate?: (status: JobStatus) => void,
    options: {
      maxAttempts?: number;
      interval?: number;
    } = {}
  ): Promise<JobStatus> {
    const { maxAttempts = 60, interval = 5000 } = options; // 5 minutes max
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getJobStatus(jobId);
      
      if (!status) {
        throw new Error('Job not found');
      }
      
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
      
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }
      
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('Job polling timeout');
  }

  /**
   * Check multiple jobs and update their status
   */
  async checkJobStatuses(jobIds: string[]): Promise<Map<string, JobStatus>> {
    const results = new Map<string, JobStatus>();
    
    // Check all jobs in parallel
    const promises = jobIds.map(async (jobId) => {
      try {
        const status = await this.getJobStatus(jobId);
        if (status) {
          results.set(jobId, status);
        }
      } catch (error) {
        console.error(`Failed to check job ${jobId}:`, error);
      }
    });
    
    await Promise.all(promises);
    return results;
  }
}

export const jobService = new JobService();
export type { JobStatus };