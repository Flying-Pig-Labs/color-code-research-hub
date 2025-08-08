// AWS Batch Pipeline API Service
// This service integrates with the multi-step LLM pipeline running on AWS Batch

const BATCH_API_URL = import.meta.env.VITE_INNOVATION_API_BASE_URL || 'https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod';

export interface BatchJobSubmission {
  jobId: string;
  jobName: string;
  status: string;
}

export interface PipelineLogEntry {
  timestamp: string;
  message: string;
}

export interface PipelineStatus {
  status: 'SUBMITTED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  logs: PipelineLogEntry[];
  logStreamUrl?: string;
}

export const batchPipelineApi = {
  /**
   * Submit a new batch job for the pipeline
   * @param researchId - The research document ID to process
   * @returns Job submission details including jobId, jobName, and status
   */
  async submitJob(researchId: string): Promise<BatchJobSubmission> {
    try {
      const response = await fetch(`${BATCH_API_URL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit job: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting batch job:', error);
      throw error;
    }
  },

  /**
   * Get logs and status for a pipeline job
   * @param researchId - The research document ID to get logs for
   * @returns Job status and log messages
   */
  async getJobLogs(researchId: string): Promise<PipelineStatus> {
    try {
      const response = await fetch(`${BATCH_API_URL}/logs/${researchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get job logs: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting job logs:', error);
      throw error;
    }
  },

  /**
   * Poll job status until completion
   * @param researchId - The research document ID to monitor
   * @param onProgress - Callback for status updates
   * @param maxAttempts - Maximum number of polling attempts (default: 60)
   * @param pollInterval - Interval between polls in milliseconds (default: 5000)
   * @returns Final job status
   */
  async pollJobStatus(
    researchId: string,
    onProgress?: (status: PipelineStatus) => void,
    maxAttempts: number = 60,
    pollInterval: number = 5000
  ): Promise<PipelineStatus> {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const status = await this.getJobLogs(researchId);
          
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'SUCCEEDED' || status.status === 'FAILED') {
            resolve(status);
            return;
          }

          if (attempts >= maxAttempts) {
            reject(new Error(`Job polling timed out after ${maxAttempts} attempts`));
            return;
          }

          setTimeout(poll, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  },
};

export default batchPipelineApi;