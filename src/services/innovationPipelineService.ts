/**
 * @file innovationPipelineService.ts
 * @description Service for interacting with the Innovation Pipeline API
 * 
 * This service handles starting innovation jobs that process research documents
 * to generate actionable innovation ideas and create GitHub repositories.
 */

import { toast } from 'sonner';

const PIPELINE_API_BASE = import.meta.env.VITE_INNOVATION_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://nke1jc944d.execute-api.us-east-1.amazonaws.com/production';

export interface StartPipelineRequest {
  researchDocId: string;
  username: string;
}

export interface StartPipelineResponse {
  jobId: string;
  message: string;
  estimatedCompletionTime?: string;
}

export interface PipelineJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStep?: string;
  githubUrl?: string;
  error?: string;
  completedAt?: string;
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
    username: string = 'fprior'
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Failed to start pipeline: ${response.statusText}`
        );
      }

      const data = await response.json();
      
      // Expected response format
      return {
        jobId: data.jobId,
        message: data.message || 'Pipeline started successfully',
        estimatedCompletionTime: data.estimatedCompletionTime || '22 minutes',
      };
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
      
      return {
        jobId: data.jobId,
        status: data.status,
        progress: data.progress,
        currentStep: data.currentStep,
        githubUrl: data.githubUrl,
        error: data.error,
        completedAt: data.completedAt,
      };
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

        if (status.status === 'completed' || status.status === 'failed') {
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