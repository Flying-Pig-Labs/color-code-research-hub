/**
 * @fileoverview Environment configuration management for Color Code Research Hub.
 * 
 * Provides centralized configuration management for different deployment environments
 * (development, staging, production). Handles environment variable parsing,
 * validation, and provides type-safe access to configuration values.
 * 
 * Supports multiple deployment targets:
 * - Local development (Vite dev server)
 * - AWS Amplify (production hosting)
 * - Custom deployments
 * 
 * Configuration includes:
 * - API endpoints and timeouts
 * - GitHub integration settings
 * - Feature flags and toggles
 * - AWS service configuration
 * - Application metadata
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

/**
 * Get environment-specific configuration with validation and defaults.
 * 
 * Parses environment variables and provides a consistent configuration object
 * across all deployment environments. Includes validation for production
 * deployments to ensure required variables are present.
 * 
 * @returns {EnvironmentConfig} Complete configuration object with type safety
 */
export const getEnvironmentConfig = () => {
  const env = import.meta.env.MODE || 'development';
  
  /**
   * Base configuration object with environment variable mapping and defaults.
   * All configuration is derived from VITE_ prefixed environment variables.
   */
  const config = {
    // API Gateway endpoint configuration
    // Supports both direct API URL and AWS API Gateway URL formats
    apiBaseUrl: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL || '/api',
    // Dedicated Research API base (HTTP API) for research endpoints
    researchApiBaseUrl: import.meta.env.VITE_RESEARCH_API_BASE_URL || (import.meta.env.VITE_RESEARCH_API_URL || (import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL || '/api')),
    // Dedicated Plan API base (SAM stack) for async start/status endpoints
    planApiBaseUrl: import.meta.env.VITE_PLAN_API_BASE_URL || (import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL || '/api'),
    
    // Network timeout configuration
    // 5 minutes for long-running operations, 2 seconds for polling
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '300000'),
    pollInterval: parseInt(import.meta.env.VITE_POLL_INTERVAL || '2000'),
    
    // GitHub integration settings
    // Required for repository management and issue creation
    githubOrg: import.meta.env.VITE_GITHUB_ORG || '',
    githubToken: import.meta.env.VITE_GITHUB_TOKEN || '',
    
    // Feature flags for conditional functionality
    useLocalBackend: env === 'development' && !import.meta.env.VITE_API_GATEWAY_URL,
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    
    // AWS service configuration for client-side SDK usage
    awsRegion: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    
    // Application metadata and versioning
    environment: env,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  };
  
  /**
   * Production environment validation.
   * Ensures critical environment variables are present in production deployments.
   * Logs warnings for missing variables but allows application to continue.
   */
  if (env === 'production') {
    const requiredVars = ['VITE_API_GATEWAY_URL', 'VITE_GITHUB_ORG'];
    const missing = requiredVars.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      console.warn('Missing required environment variables:', missing);
    }
  }
  
  return config;
};

/**
 * Type definition for environment configuration object.
 * Provides compile-time type safety for configuration access.
 */
export type EnvironmentConfig = ReturnType<typeof getEnvironmentConfig>;

/**
 * Singleton configuration instance for application-wide use.
 * Pre-computed configuration object that can be imported and used
 * throughout the application without re-parsing environment variables.
 * 
 * @example
 * ```typescript
 * import { envConfig } from '@/config/environment';
 * 
 * const apiUrl = envConfig.apiBaseUrl;
 * const isLocal = envConfig.useLocalBackend;
 * ```
 */
export const envConfig = getEnvironmentConfig();
