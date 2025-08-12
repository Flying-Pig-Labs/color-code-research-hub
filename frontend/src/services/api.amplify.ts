// API service for AWS Amplify deployment
// This replaces the existing api.ts when deployed to Amplify

import { envConfig } from '@/config/environment';

// API Error types
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create a proper fetch wrapper with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout: number = envConfig.apiTimeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(ApiErrorType.TIMEOUT_ERROR, 'Request timed out');
    }
    throw error;
  }
}

// Base request function with proper error handling
async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${envConfig.apiBaseUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add API key if configured
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
  
  try {
    const response = await fetchWithTimeout(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 401:
          throw new ApiError(ApiErrorType.UNAUTHORIZED, 'Unauthorized', errorData);
        case 404:
          throw new ApiError(ApiErrorType.NOT_FOUND, 'Resource not found', errorData);
        case 422:
        case 400:
          throw new ApiError(ApiErrorType.VALIDATION_ERROR, errorData.message || 'Validation error', errorData);
        default:
          throw new ApiError(ApiErrorType.SERVER_ERROR, errorData.message || 'Server error', errorData);
      }
    }
    
    return response.json();
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error.name === 'NetworkError' || error.message === 'Failed to fetch') {
      throw new ApiError(
        ApiErrorType.NETWORK_ERROR,
        'Unable to connect to the server. Please check your internet connection.',
        { originalError: error }
      );
    }
    
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      error.message || 'An unexpected error occurred',
      { originalError: error }
    );
  }
}

// API Methods
export const api = {
  // Health check
  checkHealth: () => request('/health'),
  
  // Teams
  getTeams: () => request('/teams'),
  getTeamFields: (teamType: string) => request(`/teams/${teamType}/fields`),
  
  // SQS submission (replaces research endpoints for Amplify)
  submitToSQS: (data: {
    teamType: string;
    formData: any;
    repoId: string;
  }) => request('/api/sqs/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
};

// Environment detection
export function getCurrentEnvironment(): 'production' | 'development' {
  return envConfig.environment === 'production' ? 'production' : 'development';
}

// Error helper
export function getErrorMessage(error: unknown): { message: string; details?: any } {
  if (error instanceof ApiError) {
    switch (error.type) {
      case ApiErrorType.NETWORK_ERROR:
        return {
          message: 'Connection Error',
          details: [
            {
              description: 'Unable to reach the server. Please check your internet connection.',
              action: {
                label: 'Retry',
                handler: () => window.location.reload()
              }
            }
          ]
        };
      case ApiErrorType.TIMEOUT_ERROR:
        return {
          message: 'Request Timeout',
          details: [
            {
              description: 'The request took too long to complete. Please try again.',
              action: {
                label: 'Retry',
                handler: () => window.location.reload()
              }
            }
          ]
        };
      case ApiErrorType.VALIDATION_ERROR:
        return {
          message: 'Validation Error',
          details: error.details?.errors || [{ description: error.message }]
        };
      case ApiErrorType.SERVER_ERROR:
        return {
          message: 'Server Error',
          details: [{ description: error.message || 'An unexpected server error occurred' }]
        };
      default:
        return {
          message: 'Error',
          details: [{ description: error.message }]
        };
    }
  }
  
  if (error instanceof Error) {
    return {
      message: 'Error',
      details: [{ description: error.message }]
    };
  }
  
  return {
    message: 'Unknown Error',
    details: [{ description: 'An unexpected error occurred' }]
  };
}