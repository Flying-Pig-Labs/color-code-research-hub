/**
 * @file planApi.ts
 * @description API service for plan generation jobs
 * 
 * Provides functions to interact with the plan generation API endpoints.
 * Handles fetching job lists, individual job status, and job creation.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Plan Generation Job interface matching the backend response
 */
export interface PlanGenerationJob {
  jobId: string;
  status: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  repositoryName?: string;
  projectTitle?: string;
  totalIssues: number;
  issuesCreated: number;
  error?: string;
}

/**
 * API Response interface for job list
 */
interface ListPlanJobsResponse {
  jobs: PlanGenerationJob[];
  pagination: {
    hasMore: boolean;
    lastEvaluatedKey?: string;
  };
  totalCount: number;
  scannedCount: number;
}

/**
 * Query parameters for listing jobs
 */
interface ListPlanJobsParams {
  status?: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  limit?: number;
  lastEvaluatedKey?: string;
}

/**
 * Lists plan generation jobs from the backend API
 * 
 * @param params - Query parameters for filtering and pagination
 * @returns Promise resolving to list of plan generation jobs
 * @throws Error if API request fails
 */
export async function listPlanGenerationJobs(params: ListPlanJobsParams = {}): Promise<ListPlanJobsResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.lastEvaluatedKey) queryParams.append('lastEvaluatedKey', params.lastEvaluatedKey);
    
    const url = `${API_BASE_URL}/api/plan/async/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to list plan generation jobs: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error listing plan generation jobs:', error);
    throw error;
  }
}

/**
 * Gets the status of a specific plan generation job
 * 
 * @param jobId - The unique job identifier
 * @returns Promise resolving to job status
 * @throws Error if API request fails
 */
export async function getPlanGenerationJobStatus(jobId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/plan/async/status/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting job status:', error);
    throw error;
  }
}

/**
 * Calculates the duration between two timestamps
 * 
 * @param startTime - Start timestamp
 * @param endTime - End timestamp
 * @returns Duration in milliseconds or null if invalid
 */
export function calculateDuration(startTime?: string, endTime?: string): number | null {
  if (!startTime || !endTime) return null;
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  
  const duration = end.getTime() - start.getTime();
  return duration > 0 ? duration : null;
}

/**
 * Formats duration from milliseconds to human readable format
 * 
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string (e.g., "5m 30s")
 */
export function formatDuration(durationMs: number | null): string {
  if (!durationMs || durationMs <= 0) return '-';
  
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Gets the display color for job status badges
 * 
 * @param status - Job status
 * @returns CSS classes for status badge
 */
export function getStatusBadgeClasses(status: PlanGenerationJob['status']): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'INITIATED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Extracts repository owner and name from full repository path
 * 
 * @param repositoryName - Full repository name (owner/repo)
 * @returns Object with owner and repo, or null if invalid
 */
export function parseRepositoryName(repositoryName?: string): { owner: string; repo: string } | null {
  if (!repositoryName || !repositoryName.includes('/')) return null;
  
  const [owner, repo] = repositoryName.split('/');
  return owner && repo ? { owner, repo } : null;
}