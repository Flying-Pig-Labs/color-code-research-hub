// API Service Module for Backend Communication
import { toast } from "sonner";

// Get configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_API_KEY || '';
// SQS integration - no webhook needed
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '300000'); // 5 minutes
const POLL_INTERVAL = parseInt(import.meta.env.VITE_POLL_INTERVAL || '2000'); // 2 seconds

// API client configuration with CORS support
const apiClient = {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'Accept': 'application/json',
  },
  credentials: 'include' as RequestCredentials,
};

// Error types for better error handling
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to handle API errors
function handleApiError(error: any): never {
  console.error('API Error:', error);

  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    throw new ApiError(
      ApiErrorType.NETWORK_ERROR,
      'Unable to connect to the server. Please check if the backend is running on port 3001.',
      { originalError: error }
    );
  }

  if (error.name === 'AbortError') {
    throw new ApiError(
      ApiErrorType.TIMEOUT_ERROR,
      'Request timed out. The server might be processing a large request.',
      { originalError: error }
    );
  }

  // Check for CORS errors (these often manifest as network errors)
  if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
    throw new ApiError(
      ApiErrorType.CORS_ERROR,
      'CORS error: The server needs to be configured to accept requests from this origin.',
      { originalError: error }
    );
  }

  throw new ApiError(
    ApiErrorType.UNKNOWN_ERROR,
    error.message || 'An unexpected error occurred',
    { originalError: error }
  );
}

// Create an AbortController with timeout
function createTimeoutController(timeout: number = API_TIMEOUT): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

// Generic fetch wrapper with error handling
async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = createTimeoutController();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...apiClient.headers,
        ...options.headers,
      },
      credentials: apiClient.credentials,
      signal: controller.signal,
    });

    if (response && response.status === 401) {
      throw new ApiError(
        ApiErrorType.AUTH_ERROR,
        'Authentication failed. Please check your API key.',
        { status: response.status }
      );
    }

    if (response && !response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        ApiErrorType.SERVER_ERROR,
        errorData.message || `Server error: ${response.status}`,
        { status: response.status, data: errorData }
      );
    }
    
    if (!response) {
      throw new ApiError(
        ApiErrorType.UNKNOWN_ERROR,
        'Invalid response from server',
        { response }
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw handleApiError(error);
  }
}

// API Service Interface
export interface TeamField {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
}

export interface ResearchSubmission {
  teamType: 'red' | 'black' | 'white';
  fields: Record<string, any>;
}

export interface ResearchJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: any;
  error?: string;
}

// API Service Methods
export const apiService = {
  // Health check endpoint
  async checkHealth(): Promise<{ status: string; environment: string }> {
    try {
      const response = await fetchWithErrorHandling<{ status: string; environment: string }>(
        `${API_BASE_URL}/health`,
        { method: 'GET' }
      );
      return response;
    } catch (error) {
      // Return a default response for health check failures
      return {
        status: 'error',
        environment: 'unknown',
      };
    }
  },

  // Get available teams
  async getTeams(): Promise<string[]> {
    return fetchWithErrorHandling<string[]>(
      `${API_BASE_URL}/teams`,
      { method: 'GET' }
    );
  },

  // Get fields for a specific team type
  async getTeamFields(teamType: string): Promise<TeamField[]> {
    return fetchWithErrorHandling<TeamField[]>(
      `${API_BASE_URL}/teams/${teamType}/fields`,
      { method: 'GET' }
    );
  },

  // Submit research request
  async submitResearch(submission: ResearchSubmission): Promise<{ jobId: string }> {
    return fetchWithErrorHandling<{ jobId: string }>(
      `${API_BASE_URL}/research/submit`,
      {
        method: 'POST',
        body: JSON.stringify(submission),
      }
    );
  },

  // Get research job status
  async getJobStatus(jobId: string): Promise<ResearchJob> {
    return fetchWithErrorHandling<ResearchJob>(
      `${API_BASE_URL}/research/status/${jobId}`,
      { method: 'GET' }
    );
  },

  // Get research results
  async getJobResults(jobId: string): Promise<any> {
    return fetchWithErrorHandling<any>(
      `${API_BASE_URL}/research/results/${jobId}`,
      { method: 'GET' }
    );
  },

  // Poll for job completion with exponential backoff
  async pollJobCompletion(
    jobId: string,
    onProgress?: (status: ResearchJob) => void
  ): Promise<any> {
    let pollInterval = POLL_INTERVAL;
    let attempts = 0;
    const maxAttempts = Math.floor(API_TIMEOUT / POLL_INTERVAL);

    while (attempts < maxAttempts) {
      try {
        const status = await this.getJobStatus(jobId);
        
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'completed') {
          return await this.getJobResults(jobId);
        }

        if (status.status === 'failed') {
          throw new ApiError(
            ApiErrorType.SERVER_ERROR,
            status.error || 'Research job failed',
            { jobId, status }
          );
        }

        // Wait before next poll with exponential backoff
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Increase poll interval (exponential backoff)
        pollInterval = Math.min(pollInterval * 1.5, 10000); // Max 10 seconds
        attempts++;
      } catch (error) {
        if (error instanceof ApiError && error.type === ApiErrorType.NETWORK_ERROR) {
          // Continue polling on network errors
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new ApiError(
      ApiErrorType.TIMEOUT_ERROR,
      'Job polling timed out after 5 minutes',
      { jobId, attempts }
    );
  },
};

// Export helper function to get current environment
export function getCurrentEnvironment(): 'local' | 'unknown' {
  if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
    return 'local';
  }
  return 'unknown';
}

// Export helper to show environment-specific error messages
export function showApiError(error: ApiError) {
  switch (error.type) {
    case ApiErrorType.NETWORK_ERROR:
      toast.error(
        'Connection failed',
        {
          description: 'Unable to reach the server. Please ensure the backend is running on port 3001.',
          action: {
            label: 'Setup Help',
            onClick: () => window.open('/setup-help', '_blank'),
          },
        }
      );
      break;
      
    case ApiErrorType.CORS_ERROR:
      toast.error(
        'CORS Error',
        {
          description: 'Cross-origin requests are blocked. The backend server needs to allow requests from this domain.',
        }
      );
      break;
      
    case ApiErrorType.AUTH_ERROR:
      toast.error(
        'Authentication Failed',
        {
          description: 'Please check your API key in the .env.local file.',
        }
      );
      break;
      
    case ApiErrorType.TIMEOUT_ERROR:
      toast.error(
        'Request Timeout',
        {
          description: 'The server is taking too long to respond. It might be processing a large request.',
        }
      );
      break;
      
    default:
      toast.error(error.message);
  }
}