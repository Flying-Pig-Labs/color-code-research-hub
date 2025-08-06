/**
 * @file innovationPipelineService.ts
 * @description Service for interacting with the Innovation Pipeline API
 * 
 * This service handles starting innovation jobs that process research documents
 * to generate actionable innovation ideas and create GitHub repositories.
 */

import { toast } from 'sonner';

// Force use of new API Gateway for innovation pipeline in production
const PIPELINE_API_BASE = window.location.hostname === 'oceanstudio.io' 
  ? 'https://nke1jc944d.execute-api.us-east-1.amazonaws.com/production'
  : (import.meta.env.VITE_INNOVATION_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://nke1jc944d.execute-api.us-east-1.amazonaws.com/production');

export interface StartPipelineRequest {
  researchDocId: string;
  username: string;
}

export interface StartPipelineResponse {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  message: string;
  estimatedCompletion?: string;
  estimatedTotalMinutes?: number;
  metadata?: {
    researchDocId: string;
    startedAt: string;
    username: string;
  };
}

export interface PipelineStage {
  name: string;
  status: 'completed' | 'running' | 'pending';
  estimatedMinutes: number;
}

export interface PipelineJobStatus {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  currentStage: number;
  stageName: string;
  stageProgress: number;
  overallProgress: number;
  estimatedTotalMinutes: number;
  elapsedMinutes: number;
  estimatedRemainingMinutes: number;
  estimatedRemaining: string; // Legacy field
  metadata: {
    researchDocId: string;
    startedAt: string;
    username: string;
    jobId: string;
  };
  stages: PipelineStage[];
  results: {
    githubRepoUrl: string | null;
    githubRepoName: string | null;
    issuesCreated: number;
    analysisResults: any | null;
  };
  completedAt?: string;
  actualDurationMinutes?: number;
  error?: string;
}

class InnovationPipelineService {
  /**
   * Start a new innovation pipeline job
   * @param researchDocId - The ID of the research document to process
   * @param username - The username for the job (defaults to 'fprior')
   * @returns Promise with job details
   */
  async startPipeline(
    researchDocId: string, 
    username: string = 'user'
  ): Promise<StartPipelineResponse> {
    try {
      const response = await fetch(`${PIPELINE_API_BASE}/start-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchDocId,
          username,
        }),
      });

      const data = await response.json();

      // Handle 409 Conflict - job already exists
      if (response.status === 409) {
        toast.info('A pipeline is already running for this research', {
          description: `Stage ${data.currentStage}: ${data.stageName} (${Math.round(data.overallProgress)}%)`,
        });
        return {
          jobId: data.existingJobId,
          status: data.status,
          message: data.error || 'Pipeline already running for this research document',
          estimatedCompletion: new Date(Date.now() + data.estimatedRemainingMinutes * 60000).toISOString(),
          estimatedTotalMinutes: data.estimatedTotalMinutes,
          metadata: data.metadata,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || `Failed to start pipeline: ${response.statusText}`
        );
      }
      
      // Expected response format for new job (202 Accepted)
      return data;
    } catch (error) {
      console.error('Error starting innovation pipeline:', error);
      throw error;
    }
  }

  /**
   * Check the status of a pipeline job
   * @param jobId - The job ID to check
   * @returns Promise with job status
   */
  async checkJobStatus(jobId: string): Promise<PipelineJobStatus> {
    try {
      const response = await fetch(`${PIPELINE_API_BASE}/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to check job status: ${response.statusText}`
        );
      }

      const data = await response.json();
      
      // Return the full response from backend
      return data;
    } catch (error) {
      console.error('Error checking job status:', error);
      throw error;
    }
  }

  /**
   * Poll for job completion
   * @param jobId - The job ID to poll
   * @param onProgress - Callback for progress updates
   * @param maxAttempts - Maximum polling attempts (default: 30 for ~25 minutes)
   * @param pollInterval - Interval between polls in ms (default: 30000 for 30 seconds)
   * @returns Promise with final job status
   */
  async pollJobCompletion(
    jobId: string,
    onProgress?: (status: PipelineJobStatus) => void,
    maxAttempts: number = 50, // 50 * 30s = 25 minutes
    pollInterval: number = 30000 // 30 seconds
  ): Promise<PipelineJobStatus> {
    let attempts = 0;

    const poll = async (): Promise<PipelineJobStatus> => {
      attempts++;
      
      try {
        const status = await this.checkJobStatus(jobId);
        
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          return status;
        }

        if (attempts >= maxAttempts) {
          throw new Error('Pipeline job timed out after 25 minutes');
        }

        // Wait and poll again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return poll();
      } catch (error) {
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Retry on error
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return poll();
      }
    };

    return poll();
  }

  /**
   * Format the S3 path for a research document
   * @param username - The username
   * @param researchId - The research document ID
   * @returns The S3 path where the document should be stored
   */
  getS3Path(username: string, researchId: string): string {
    return `s3://pipeline-data-984906149037-us-east-1/users/${username}/research/${researchId}/request.json`;
  }
}

// Export singleton instance
export const innovationPipelineService = new InnovationPipelineService();