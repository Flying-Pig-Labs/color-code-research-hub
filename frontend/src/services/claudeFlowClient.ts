// Simple Claude Flow API client for MVP
// Using API Gateway proxy to avoid mixed content issues
const API_GATEWAY_URL = import.meta.env.VITE_API_BASE_URL || 'https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production';
const CLAUDE_FLOW_BASE_URL = `${API_GATEWAY_URL}/api/claude-flow`;

export interface TaskSubmission {
  taskType: string;
  input: {
    prompt: string;
    strategy: string;
    mode: string;
    maxAgents: number;
  };
  metadata?: {
    executionId?: string;
    priority?: string;
    tags?: string[];
  };
}

export interface ExecutionResponse {
  status: string;
  executionId: string;
  metadata?: any;
}

export interface HealthResponse {
  status: string;
  timestamp?: string;
  version?: string;
  uptime?: number;
}

export interface SwarmStatus {
  status: string;
  activeExecutions: number;
  totalExecutions: number;
  currentExecution?: {
    executionId: string;
    taskType: string;
    startTime: string;
    status: string;
    outputDir: string;
  };
  timestamp: string;
}

class ClaudeFlowClient {
  private baseUrl: string;

  constructor(baseUrl: string = CLAUDE_FLOW_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  async executeTask(taskData: TaskSubmission): Promise<ExecutionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error(`Task execution failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Task execution error:', error);
      throw error;
    }
  }

  async getSwarmStatus(): Promise<SwarmStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/swarm-status`);
      if (!response.ok) {
        throw new Error(`Swarm status failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Swarm status error:', error);
      throw error;
    }
  }

  getWebSocketUrl(): string {
    // WebSocket requires a separate WebSocket API Gateway setup
    // For MVP, we'll disable WebSocket and use polling instead
    console.warn('WebSocket not yet configured - requires WebSocket API Gateway');
    return '';
  }
}

export const claudeFlowClient = new ClaudeFlowClient();