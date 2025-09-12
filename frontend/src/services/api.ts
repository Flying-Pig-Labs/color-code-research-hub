/**
 * @fileoverview Core API service module for backend communication in Color Code Research Hub.
 * 
 * Provides a comprehensive API client with error handling, timeout management, and polling
 * capabilities for research job workflows. Supports both local development and production
 * AWS API Gateway endpoints.
 * 
 * Key Features:
 * - Type-safe API error handling with specific error types
 * - Automatic timeout management and request abortion
 * - CORS-compliant request configuration
 * - Exponential backoff polling for long-running jobs
 * - Environment-aware configuration
 * - User-friendly error notifications via toast system
 * 
 * API Endpoints:
 * - Health check and environment detection
 * - Team management and field definitions
 * - Research job submission and status tracking
 * - Results retrieval and polling
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { toast } from "sonner";

/**
 * Environment-based API configuration.
 * Supports both local development (localhost:3001) and production (AWS API Gateway).
 */
// Primary API base URL - supports both gateway and direct URLs
const API_BASE_URL = (import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
// Optional API key for authenticated endpoints
const API_KEY = import.meta.env.VITE_API_KEY || '';
// Request timeout - 5 minutes for long-running operations
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '300000'); 
// Polling interval for job status checks - 2 seconds
const POLL_INTERVAL = parseInt(import.meta.env.VITE_POLL_INTERVAL || '2000');

/**
 * Default API client configuration with CORS support.
 * Headers are applied to all requests unless overridden.
 */
const apiClient = {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'Accept': 'application/json',
  },
};

/**
 * Enumeration of API error types for type-safe error handling.
 * Enables specific error handling strategies based on error category.
 */
export enum ApiErrorType {
  /** Network connectivity issues (server unreachable) */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Cross-origin request policy violations */
  CORS_ERROR = 'CORS_ERROR',
  /** Request timeout or server taking too long */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** Authentication/authorization failures */
  AUTH_ERROR = 'AUTH_ERROR',
  /** Server-side errors (4xx/5xx responses) */
  SERVER_ERROR = 'SERVER_ERROR',
  /** Unexpected or unclassified errors */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for API-related errors with enhanced metadata.
 * Provides structured error information for better error handling and user feedback.
 */
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

/**
 * Centralized error handler that converts raw errors into structured ApiError instances.
 * 
 * Analyzes error types and provides user-friendly error messages with actionable guidance.
 * Essential for providing consistent error handling across all API calls.
 * 
 * @param {any} error - Raw error from fetch or other API operations
 * @throws {ApiError} Structured error with type classification and details
 * @returns {never} Always throws - this function never returns normally
 */
function handleApiError(error: any): never {
  console.error('API Error:', error);

  // Network connectivity errors (server unreachable)
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    throw new ApiError(
      ApiErrorType.NETWORK_ERROR,
      'Unable to connect to the server. Please check if the backend is running on port 3001.',
      { originalError: error }
    );
  }

  // Request timeout errors
  if (error.name === 'AbortError') {
    throw new ApiError(
      ApiErrorType.TIMEOUT_ERROR,
      'Request timed out. The server might be processing a large request.',
      { originalError: error }
    );
  }

  // CORS policy errors (often manifest as network errors)
  if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
    throw new ApiError(
      ApiErrorType.CORS_ERROR,
      'CORS error: The server needs to be configured to accept requests from this origin.',
      { originalError: error }
    );
  }

  // Fallback for unclassified errors
  throw new ApiError(
    ApiErrorType.UNKNOWN_ERROR,
    error.message || 'An unexpected error occurred',
    { originalError: error }
  );
}

/**
 * Creates an AbortController with automatic timeout.
 * 
 * Provides request cancellation capability to prevent hanging requests
 * and ensure responsive user experience.
 * 
 * @param {number} timeout - Timeout duration in milliseconds (default: API_TIMEOUT)
 * @returns {AbortController} Controller that will abort the request after timeout
 */
function createTimeoutController(timeout: number = API_TIMEOUT): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

export { apiFetch } from '@/lib/apiFetch';

// Keep existing error handling types for backward compatibility
async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  return apiFetch(url, options);
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

  // Removed startIdeationPipeline - use innovationPipelineService.startPipeline() instead
  // The correct endpoint is https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod/submit
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