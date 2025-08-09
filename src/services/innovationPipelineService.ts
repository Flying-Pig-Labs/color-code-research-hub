/**
 * @file innovationPipelineService.ts
 * @description Service for interacting with the Innovation Pipeline API
 * 
 * This service handles starting innovation jobs that process research documents
 * to generate actionable innovation ideas and create GitHub repositories.
 */

import { toast } from 'sonner';

// Use AWS Batch Pipeline API for innovation pipeline
// The API Gateway at 9hv22ga3uh provides the multi-step LLM pipeline running on AWS Batch
const PIPELINE_API_BASE = import.meta.env.VITE_BATCH_PIPELINE_URL || 'https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod';

export interface StartPipelineRequest {
  researchDocId: string;
  username: string;
}

export interface StartPipelineResponse {
  jobId: string;
  jobName: string;
  status: string;
  message?: string;
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

// AWS Batch Log Entry
export interface BatchLogEntry {
  timestamp: number; // Unix timestamp in milliseconds
  message: string;
}

// AWS Batch Job Status Response from /logs/{researchId}
export interface BatchJobStatus {
  jobId: string;
  researchId: string;
  status: 'SUBMITTED' | 'PENDING' | 'RUNNABLE' | 'STARTING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
  logs: BatchLogEntry[];
  logStreamUrl?: string;
}

// Adapted interface for UI compatibility
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
  // Raw batch status for debugging
  batchStatus?: BatchJobStatus;
}

class InnovationPipelineService {
  /**
   * Start a new innovation pipeline job using AWS Batch
   * @param researchDocId - The ID of the research document to process
   * @param username - The username for the job (not used by Batch API)
   * @param team - The team (red/black/white) to help locate the research in S3
   * @returns Promise with job details
   */
  async startPipeline(
    researchDocId: string, 
    username: string = 'user',
    team?: string
  ): Promise<StartPipelineResponse> {
    try {
      const response = await fetch(`${PIPELINE_API_BASE}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchId: researchDocId, // Batch API expects 'researchId' not 'researchDocId'
          team: team, // Include team to help backend construct correct S3 path
        }),
      });

      // Try to parse JSON response regardless of status
      const data = await response.json().catch(() => ({ error: response.statusText }));

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          // Research not found - provide clear message
          throw new Error(
            data?.error === 'Research not found' 
              ? `Research report with ID '${researchDocId}' not found. Please ensure the report exists and has been processed.`
              : data?.error || 'Research report not found'
          );
        }
        if (response.status === 409) {
          toast.info('A pipeline job may already be running for this research', {
            description: 'Check the status to see current progress',
          });
        }
        if (response.status === 400) {
          // Bad request - likely missing researchId
          throw new Error(
            data?.error || 'Invalid request. Please ensure the research ID is valid.'
          );
        }
        // Generic error for other status codes
        throw new Error(
          data?.error || data?.message || `Failed to start pipeline: ${response.statusText} (${response.status})`
        );
      }
      
      // AWS Batch API returns: { jobId, jobName, status }
      // Adapt to expected format
      return {
        jobId: data.jobId,
        jobName: data.jobName,
        status: data.status,
        message: `Pipeline job ${data.jobName} submitted successfully`,
        estimatedTotalMinutes: 15, // AWS Batch pipelines typically take 10-15 minutes
        metadata: {
          researchDocId: researchDocId,
          startedAt: new Date().toISOString(),
          username: username,
        },
      };
    } catch (error) {
      console.error('Error starting innovation pipeline:', error);
      throw error;
    }
  }

  /**
   * Check the status of a pipeline job using AWS Batch logs endpoint
   * Note: We need the researchId, not the jobId for the Batch API
   * @param researchIdOrJobId - The research ID (for Batch) or job ID (for compatibility)
   * @returns Promise with job status adapted for UI
   */
  async checkJobStatus(researchIdOrJobId: string): Promise<PipelineJobStatus> {
    try {
      // For AWS Batch, we need to use the research ID in the logs endpoint
      const response = await fetch(`${PIPELINE_API_BASE}/logs/${researchIdOrJobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 404) {
          throw new Error('No job found for this research');
        }
        throw new Error(
          errorData?.error || errorData?.message || `Failed to check job status: ${response.statusText}`
        );
      }

      const batchData: BatchJobStatus = await response.json();
      
      // Convert AWS Batch status to UI-compatible format
      return this.adaptBatchStatusToUI(batchData);
    } catch (error) {
      console.error('Error checking job status:', error);
      throw error;
    }
  }

  /**
   * Adapt AWS Batch status response to UI-compatible format
   */
  private adaptBatchStatusToUI(batchStatus: BatchJobStatus): PipelineJobStatus {
    // Map Batch status to UI status
    let uiStatus: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    switch (batchStatus.status) {
      case 'SUBMITTED':
      case 'PENDING':
      case 'RUNNABLE':
        uiStatus = 'QUEUED';
        break;
      case 'STARTING':
      case 'RUNNING':
        uiStatus = 'RUNNING';
        break;
      case 'SUCCEEDED':
        uiStatus = 'COMPLETED';
        break;
      case 'FAILED':
        uiStatus = 'FAILED';
        break;
      default:
        uiStatus = 'QUEUED';
    }

    // Parse logs to estimate progress
    const logMessages = batchStatus.logs.map(l => l.message);
    const currentStage = this.detectCurrentStage(logMessages);
    
    // Calculate elapsed time
    const startTime = new Date(batchStatus.createdAt).getTime();
    const elapsedMs = Date.now() - startTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    
    // Pass elapsed minutes to calculateProgress for better estimation
    const overallProgress = this.calculateProgressWithTime(batchStatus.status, currentStage, elapsedMinutes);

    return {
      jobId: batchStatus.jobId,
      status: uiStatus,
      currentStage: currentStage,
      stageName: this.getStageName(currentStage),
      stageProgress: this.getStageProgress(currentStage, logMessages),
      overallProgress: overallProgress,
      estimatedTotalMinutes: 15, // 10-15 minutes typical
      elapsedMinutes: elapsedMinutes,
      estimatedRemainingMinutes: Math.max(0, 15 - elapsedMinutes),
      estimatedRemaining: `${Math.max(0, 15 - elapsedMinutes)} minutes`,
      metadata: {
        researchDocId: batchStatus.researchId,
        startedAt: batchStatus.createdAt,
        username: 'user',
        jobId: batchStatus.jobId,
      },
      stages: this.generateStages(currentStage),
      results: {
        githubRepoUrl: this.extractGitHubUrl(logMessages),
        githubRepoName: this.extractGitHubRepoName(logMessages),
        issuesCreated: this.countIssuesCreated(logMessages),
        analysisResults: null,
      },
      completedAt: uiStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
      actualDurationMinutes: uiStatus === 'COMPLETED' ? elapsedMinutes : undefined,
      error: uiStatus === 'FAILED' ? this.extractError(logMessages) : undefined,
      batchStatus: batchStatus, // Include raw status for debugging
    };
  }

  // Helper methods for parsing logs and extracting information
  private detectCurrentStage(logs: string[]): number {
    // Look for stage indicators in logs (search from most recent)
    let highestStage = 1;
    
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i].toLowerCase();
      
      // Look for explicit stage markers
      if (log.includes('stage 5') || log.includes('creating issues') || log.includes('github issues')) {
        highestStage = Math.max(highestStage, 5);
      } else if (log.includes('stage 4') || log.includes('github repository') || log.includes('creating repo')) {
        highestStage = Math.max(highestStage, 4);
      } else if (log.includes('stage 3') || log.includes('concept') || log.includes('developing')) {
        highestStage = Math.max(highestStage, 3);
      } else if (log.includes('stage 2') || log.includes('innovation') || log.includes('ideation')) {
        highestStage = Math.max(highestStage, 2);
      } else if (log.includes('stage 1') || log.includes('research') || log.includes('analyzing')) {
        highestStage = Math.max(highestStage, 1);
      }
      
      // Also look for completion markers
      if (log.includes('completed stage')) {
        const match = log.match(/completed stage (\d)/);
        if (match) {
          const completedStage = parseInt(match[1]);
          // If a stage is completed, we're at least at the next stage
          highestStage = Math.max(highestStage, completedStage + 1);
        }
      }
    }
    
    return Math.min(highestStage, 5); // Cap at 5 stages
  }

  private getStageName(stage: number): string {
    const stages = [
      'Initialization',
      'Research Analysis',
      'Innovation Ideation',
      'GitHub Setup',
      'Issue Creation',
    ];
    return stages[Math.min(stage - 1, stages.length - 1)] || 'Processing';
  }

  private getStageProgress(stage: number, logs: string[]): number {
    // Estimate progress within current stage based on log patterns
    return Math.min(100, (logs.length % 20) * 5);
  }

  private calculateProgress(status: string, stage: number): number {
    if (status === 'SUCCEEDED') return 100;
    if (status === 'FAILED') return 0;
    if (status === 'SUBMITTED' || status === 'PENDING') return 5; // Show small progress to indicate it's queued
    if (status === 'RUNNABLE') return 10; // Ready to run
    if (status === 'STARTING') return 15; // Starting up
    
    // Running - calculate based on stage (5 stages total)
    if (status === 'RUNNING') {
      // Base progress for running status
      const baseProgress = 20;
      // Each stage represents 15% of progress (5 stages = 75% total)
      const stageProgress = (stage - 1) * 15;
      // Fixed progress within stage
      const currentStageProgress = 7;
      
      return Math.min(95, baseProgress + stageProgress + currentStageProgress);
    }
    
    return 0;
  }

  private calculateProgressWithTime(status: string, stage: number, elapsedMinutes: number): number {
    if (status === 'SUCCEEDED') return 100;
    if (status === 'FAILED') return 0;
    if (status === 'SUBMITTED' || status === 'PENDING') return 5;
    if (status === 'RUNNABLE') return 10;
    if (status === 'STARTING') return 15;
    
    // Running - use time-based estimation
    if (status === 'RUNNING') {
      // Assume 15 minutes total runtime
      const expectedTotalMinutes = 15;
      
      // Time-based progress (up to 80%)
      const timeProgress = Math.min(80, (elapsedMinutes / expectedTotalMinutes) * 80);
      
      // Stage-based adjustment (adds up to 15%)
      const stageBonus = Math.min(15, stage * 3);
      
      // Combine time and stage progress
      const totalProgress = Math.floor(timeProgress + stageBonus);
      
      // Cap at 95% to show it's still running
      return Math.min(95, Math.max(20, totalProgress));
    }
    
    return 0;
  }

  private generateStages(currentStage: number): PipelineStage[] {
    const stageNames = [
      'Research Analysis',
      'Innovation Ideation', 
      'Concept Development',
      'GitHub Repository Setup',
      'Issue Creation',
    ];

    return stageNames.map((name, index) => ({
      name,
      status: index < currentStage - 1 ? 'completed' : 
              index === currentStage - 1 ? 'running' : 'pending',
      estimatedMinutes: 3,
    }));
  }

  private extractGitHubUrl(logs: string[]): string | null {
    for (const log of logs) {
      const match = log.match(/https:\/\/github\.com\/[\w-]+\/[\w-]+/);
      if (match) return match[0];
    }
    return null;
  }

  private extractGitHubRepoName(logs: string[]): string | null {
    const url = this.extractGitHubUrl(logs);
    if (url) {
      const parts = url.split('/');
      return parts[parts.length - 1];
    }
    return null;
  }

  private countIssuesCreated(logs: string[]): number {
    let count = 0;
    for (const log of logs) {
      if (log.toLowerCase().includes('issue created') || 
          log.toLowerCase().includes('created issue')) {
        count++;
      }
    }
    return count;
  }

  private extractError(logs: string[]): string {
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].toLowerCase().includes('error') || 
          logs[i].toLowerCase().includes('failed')) {
        return logs[i];
      }
    }
    return 'Pipeline failed - check logs for details';
  }

  /**
   * Poll for job completion
   * @param researchIdOrJobId - The research ID (for AWS Batch) or job ID to poll
   * @param onProgress - Callback for progress updates
   * @param maxAttempts - Maximum polling attempts (default: 180 for ~15 minutes with 5s intervals)
   * @param pollInterval - Interval between polls in ms (default: 5000 for 5 seconds as recommended)
   * @returns Promise with final job status
   */
  async pollJobCompletion(
    researchIdOrJobId: string,
    onProgress?: (status: PipelineJobStatus) => void,
    maxAttempts: number = 180, // 180 * 5s = 15 minutes
    pollInterval: number = 5000 // 5 seconds as recommended for AWS Batch
  ): Promise<PipelineJobStatus> {
    let attempts = 0;

    const poll = async (): Promise<PipelineJobStatus> => {
      attempts++;
      
      try {
        const status = await this.checkJobStatus(researchIdOrJobId);
        
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          return status;
        }

        if (attempts >= maxAttempts) {
          throw new Error('Pipeline job timed out after 15 minutes');
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