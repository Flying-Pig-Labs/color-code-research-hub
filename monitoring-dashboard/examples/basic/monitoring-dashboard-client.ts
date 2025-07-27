/**
 * Example client implementation for Claude Flow Monitoring Dashboard
 * Demonstrates various non-websocket approaches for real-time monitoring
 */

interface DashboardConfig {
  apiUrl: string;
  pollInterval?: number; // milliseconds
  useSSE?: boolean;
  useLongPolling?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

interface DashboardData {
  timestamp: Date;
  system: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  swarm: {
    throughput: number;
    efficiency: number;
    reliability: number;
    utilization: number;
  };
  agents: {
    total: number;
    active: number;
    healthy: number;
    byType: Record<string, number>;
  };
  tasks: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
    throughput: number;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
  };
}

export class MonitoringDashboardClient {
  private config: DashboardConfig;
  private pollTimer?: NodeJS.Timeout;
  private sseConnection?: EventSource;
  private lastUpdate: Date = new Date(0);
  private retryCount: number = 0;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: DashboardConfig) {
    this.config = {
      pollInterval: 2000,
      useSSE: false,
      useLongPolling: false,
      retryDelay: 1000,
      maxRetries: 5,
      ...config,
    };
  }

  /**
   * Start monitoring
   */
  async start(): Promise<void> {
    if (this.config.useSSE) {
      this.startSSE();
    } else if (this.config.useLongPolling) {
      this.startLongPolling();
    } else {
      this.startPolling();
    }
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = undefined;
    }

    this.retryCount = 0;
  }

  /**
   * Subscribe to updates
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from updates
   */
  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Get current dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const response = await this.fetchWithRetry('/dashboard');
    return response;
  }

  /**
   * Get specific metric history
   */
  async getMetricHistory(metric: string, hours: number = 1): Promise<any> {
    const response = await this.fetchWithRetry(`/history/${metric}?hours=${hours}`);
    return response;
  }

  /**
   * Get active alerts
   */
  async getAlerts(includeResolved: boolean = false): Promise<any> {
    const response = await this.fetchWithRetry(
      `/alerts?includeResolved=${includeResolved}`,
    );
    return response;
  }

  /**
   * Get agent details
   */
  async getAgents(): Promise<any> {
    const response = await this.fetchWithRetry('/agents');
    return response;
  }

  // === Private Methods ===

  /**
   * Start standard HTTP polling
   */
  private startPolling(): void {
    const poll = async () => {
      try {
        const data = await this.getDashboardData();
        this.emit('update', data);
        this.emit('dashboard', data);
        this.retryCount = 0;
      } catch (error) {
        this.handleError(error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    this.pollTimer = setInterval(poll, this.config.pollInterval);
  }

  /**
   * Start Server-Sent Events connection
   */
  private startSSE(): void {
    try {
      this.sseConnection = new EventSource(`${this.config.apiUrl}/stream`);

      this.sseConnection.onopen = () => {
        console.log('SSE connection established');
        this.retryCount = 0;
        this.emit('connected');
      };

      this.sseConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('update', data);
        } catch (error) {
          console.error('Failed to parse SSE data:', error);
        }
      };

      // Handle specific event types
      this.sseConnection.addEventListener('metrics', (event: any) => {
        const data = JSON.parse(event.data);
        this.emit('metrics', data);
      });

      this.sseConnection.addEventListener('alert', (event: any) => {
        const data = JSON.parse(event.data);
        this.emit('alert', data);
      });

      this.sseConnection.addEventListener('task', (event: any) => {
        const data = JSON.parse(event.data);
        this.emit('task', data);
      });

      this.sseConnection.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.handleError(error);

        // EventSource will automatically reconnect
        // But we can implement additional retry logic if needed
        if (this.retryCount >= this.config.maxRetries!) {
          this.sseConnection?.close();
          this.emit('error', new Error('Max SSE reconnection attempts reached'));
        }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Start long polling
   */
  private async startLongPolling(): Promise<void> {
    const poll = async () => {
      try {
        const response = await fetch(
          `${this.config.apiUrl}/poll?timeout=30000&lastUpdate=${this.lastUpdate.toISOString()}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.lastUpdate = new Date(data.timestamp);

        if (data.updates && data.updates.length > 0) {
          for (const update of data.updates) {
            this.emit('update', update.data);
            this.emit(update.type, update.data);
          }
        }

        this.retryCount = 0;

        // Immediately start next poll
        poll();
      } catch (error) {
        this.handleError(error);

        // Retry with backoff
        const delay = Math.min(
          this.config.retryDelay! * Math.pow(2, this.retryCount),
          30000,
        );
        setTimeout(poll, delay);
      }
    };

    // Start polling
    poll();
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(endpoint: string): Promise<any> {
    let lastError: Error | undefined;

    for (let i = 0; i <= this.config.maxRetries!; i++) {
      try {
        const response = await fetch(`${this.config.apiUrl}${endpoint}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        if (i < this.config.maxRetries!) {
          const delay = this.config.retryDelay! * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    this.retryCount++;

    if (this.retryCount >= this.config.maxRetries!) {
      this.emit('error', error);
      this.stop();
    } else {
      this.emit('retry', { error, attempt: this.retryCount });
    }
  }

  /**
   * Emit events to listeners
   */
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      }
    }
  }
}

// === Example Usage ===

async function setupDashboard() {
  // Create client with HTTP polling (simplest approach)
  const pollingClient = new MonitoringDashboardClient({
    apiUrl: 'http://localhost:3000/api/monitoring',
    pollInterval: 2000,
  });

  // Listen for updates
  pollingClient.on('update', (data: DashboardData) => {
    console.log('Dashboard update:', data);
    updateUI(data);
  });

  pollingClient.on('error', (error: Error) => {
    console.error('Dashboard error:', error);
    showError(error.message);
  });

  // Start monitoring
  await pollingClient.start();

  // === Alternative: SSE for real-time updates ===
  const sseClient = new MonitoringDashboardClient({
    apiUrl: 'http://localhost:3000/api/monitoring',
    useSSE: true,
  });

  sseClient.on('metrics', (data: any) => {
    console.log('Real-time metrics:', data);
    updateMetricsDisplay(data);
  });

  sseClient.on('alert', (alert: any) => {
    console.log('New alert:', alert);
    showAlert(alert);
  });

  // === Alternative: Long polling for near real-time ===
  const longPollClient = new MonitoringDashboardClient({
    apiUrl: 'http://localhost:3000/api/monitoring',
    useLongPolling: true,
  });

  longPollClient.on('update', (data: any) => {
    console.log('Long poll update:', data);
  });

  // === Fetch specific data on demand ===
  
  // Get historical CPU metrics
  const cpuHistory = await pollingClient.getMetricHistory('system.cpu', 24);
  console.log('CPU history:', cpuHistory);

  // Get active alerts
  const alerts = await pollingClient.getAlerts();
  console.log('Active alerts:', alerts);

  // Get agent details
  const agents = await pollingClient.getAgents();
  console.log('Agents:', agents);
}

// UI update functions (implementation depends on your framework)
function updateUI(data: DashboardData): void {
  // Update dashboard displays
  document.getElementById('cpu-usage')!.textContent = `${data.system.cpu.toFixed(1)}%`;
  document.getElementById('memory-usage')!.textContent = `${data.system.memory.toFixed(1)}%`;
  document.getElementById('active-agents')!.textContent = data.agents.active.toString();
  document.getElementById('task-throughput')!.textContent = `${data.tasks.throughput}/min`;
}

function updateMetricsDisplay(metrics: any): void {
  // Update real-time metric displays
}

function showAlert(alert: any): void {
  // Show alert notification
}

function showError(message: string): void {
  // Display error message
}

// Export for use in browser or Node.js
export { setupDashboard };