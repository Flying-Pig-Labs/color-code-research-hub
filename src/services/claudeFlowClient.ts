// Simple Claude Flow API client for MVP
const CLAUDE_FLOW_BASE_URL = 'http://18.209.36.58';

export interface TaskSubmission {
  taskType: string;
  input: {
    objective: string;
    mode: string;
    agents: {
      coordinator: number;
      coder: number;
      tester: number;
    };
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
  activeSwarms: number;
  swarms: Array<{
    id: string;
    status: string;
    agents: number;
    startTime: string;
  }>;
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
    return `ws://${this.baseUrl.replace('http://', '')}/swarm-monitor`;
  }
}

export const claudeFlowClient = new ClaudeFlowClient();