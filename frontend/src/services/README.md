# 🔌 Services Directory

> **API service modules for backend communication**

## Overview

This directory contains service modules that handle all API communication between the React frontend and the backend services. Each service module encapsulates related API endpoints and provides a clean interface for components to interact with backend data.

## Service Architecture

```
Frontend Component
       ↓
Service Module (Type-safe API)
       ↓
   Fetch API
       ↓
  API Gateway
       ↓
Lambda Functions
```

## Available Services

### 📊 api.ts
Base API client with common functionality.

**Features:**
- Centralized error handling
- Request/response interceptors  
- Authentication headers
- Base URL configuration

**Usage:**
```typescript
import { api } from '@/services/api';

// GET request
const data = await api.get<ResponseType>('/endpoint');

// POST request
const result = await api.post<ResponseType>('/endpoint', payload);
```

### 📋 planGeneration.ts
Handles all plan generation operations.

**Key Methods:**
```typescript
// Start async plan generation
startAsync(params: PlanParams): Promise<JobResponse>

// Check job status  
getStatus(jobId: string): Promise<JobStatus>

// Generate plan synchronously
generateCLI(params: PlanParams): Promise<PlanResult>

// Extract metadata from README
populateForm(readme: string): Promise<ProjectMetadata>
```

### 🐙 github.ts
GitHub API integration for repository operations.

**Key Methods:**
```typescript
// List user/org repositories
listRepos(owner: string): Promise<Repository[]>

// Get repository README
getReadme(owner: string, repo: string): Promise<ReadmeContent>

// Create issues in repository
createIssues(owner: string, repo: string, issues: Issue[]): Promise<CreatedIssue[]>
```

### 🤖 claudeFlow.ts
Claude Flow swarm orchestration service.

**Key Methods:**
```typescript
// Execute swarm command
execute(command: string, options?: ExecutionOptions): Promise<Execution>

// Get execution status
getStatus(executionId: string): Promise<ExecutionStatus>

// Stream execution logs
streamLogs(executionId: string, onLog: (log: LogEntry) => void): () => void

// Get swarm status
getSwarmStatus(): Promise<SwarmStatus>
```

### 🔍 research.ts (planned)
Research team request handling.

**Key Methods:**
```typescript
// Submit research request
submitRequest(team: TeamType, data: ResearchData): Promise<RequestId>

// Get request status
getRequestStatus(requestId: string): Promise<RequestStatus>

// Download results
getResults(requestId: string): Promise<ResearchResults>
```

## Service Patterns

### Error Handling

All services implement consistent error handling:

```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
  }
}

// In service method
async function fetchData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        error.message,
        error.code,
        response.status,
        error.details
      );
    }
    return response.json();
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      throw new APIError(
        'Network error',
        'NETWORK_ERROR',
        0
      );
    }
    throw error;
  }
}
```

### Type Safety

All services use TypeScript for type safety:

```typescript
// types/api.ts
export interface PlanParams {
  metadata: ProjectMetadata;
  readmeContent: string;
  repository?: string;
  branch?: string;
}

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  statusUrl: string;
  estimatedDuration: number;
}

// service implementation
export const planGenerationService = {
  async startAsync(params: PlanParams): Promise<JobResponse> {
    return api.post<JobResponse>('/api/plan/async/start', params);
  }
};
```

### Request Cancellation

Support for cancelling long-running requests:

```typescript
export function createCancellableRequest<T>(
  requestFn: (signal: AbortSignal) => Promise<T>
): [Promise<T>, () => void] {
  const controller = new AbortController();
  const promise = requestFn(controller.signal);
  
  return [promise, () => controller.abort()];
}

// Usage
const [promise, cancel] = createCancellableRequest(
  (signal) => fetch(url, { signal }).then(r => r.json())
);

// Cancel if needed
cancel();
```

### Caching

Simple caching for frequently accessed data:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}
```

## Configuration

### Environment Variables

Services use environment variables for configuration:

```typescript
// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// WebSocket URL
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL;

// Feature flags
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';
```

### Development Mode

Mock data support for development:

```typescript
if (import.meta.env.DEV && ENABLE_MOCK_DATA) {
  // Return mock data
  return mockPlanGenerationResponse();
}
```

## Testing

### Unit Tests

```typescript
// planGeneration.test.ts
describe('PlanGenerationService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });
  
  it('should start async plan generation', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ jobId: '123' }));
    
    const result = await planGenerationService.startAsync({
      metadata: mockMetadata,
      readmeContent: 'Test README'
    });
    
    expect(result.jobId).toBe('123');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/plan/async/start'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
```

### Integration Tests

```typescript
// api.integration.test.ts
describe('API Integration', () => {
  it('should handle real API calls', async () => {
    // Test against actual backend
    const repos = await githubService.listRepos('octocat');
    expect(repos).toBeInstanceOf(Array);
    expect(repos[0]).toHaveProperty('name');
  });
});
```

## Best Practices

1. **Single Responsibility**: Each service handles one domain
2. **Type Safety**: Always use TypeScript interfaces
3. **Error Handling**: Consistent error types and handling
4. **Documentation**: Document all public methods
5. **Testing**: Unit test all service methods
6. **Caching**: Cache appropriate GET requests
7. **Cancellation**: Support request cancellation

## Adding a New Service

1. Create new file: `serviceName.ts`
2. Define TypeScript interfaces in `types/`
3. Implement service methods
4. Add error handling
5. Write unit tests
6. Update this README
7. Export from `index.ts`

## Related Documentation

- [API Documentation](../../docs/API_DOCUMENTATION.md)
- [Frontend Architecture](../README.md)
- [Type Definitions](../types/README.md)

---

> 💡 **Tip**: Always use the service layer instead of direct fetch calls. This ensures consistent error handling and makes testing easier!