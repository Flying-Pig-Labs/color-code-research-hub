// Environment configuration for AWS Amplify deployment
export const getEnvironmentConfig = () => {
  const env = import.meta.env.MODE || 'development';
  
  // Base configuration that works in all environments
  const config = {
    // API Gateway endpoint (to be set in Amplify environment variables)
    apiBaseUrl: import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE_URL || '/api',
    
    // Timeouts
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '300000'),
    pollInterval: parseInt(import.meta.env.VITE_POLL_INTERVAL || '2000'),
    
    // GitHub Integration
    githubOrg: import.meta.env.VITE_GITHUB_ORG || '',
    githubToken: import.meta.env.VITE_GITHUB_TOKEN || '',
    
    // Feature flags
    useLocalBackend: env === 'development' && !import.meta.env.VITE_API_GATEWAY_URL,
    enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    
    // AWS Configuration (for client-side SDK if needed)
    awsRegion: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    
    // Application metadata
    environment: env,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  };
  
  // Validate required configuration in production
  if (env === 'production') {
    const requiredVars = ['VITE_API_GATEWAY_URL', 'VITE_GITHUB_ORG'];
    const missing = requiredVars.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      console.warn('Missing required environment variables:', missing);
    }
  }
  
  return config;
};

// Type-safe environment config
export type EnvironmentConfig = ReturnType<typeof getEnvironmentConfig>;

// Export singleton instance
export const envConfig = getEnvironmentConfig();