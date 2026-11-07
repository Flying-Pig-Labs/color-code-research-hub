// Monitoring types and interfaces for Claude Flow integration

export interface Metric {
  name: string;
  value: number;
  unit: string;
  trend: number[];
  threshold?: number;
  timestamp?: string;
}

export interface SystemMetrics {
  cpu: Metric;
  memory: Metric;
  activeAgents: Metric;
  runningTasks: Metric;
  completedTasks: Metric;
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  type: 'coder' | 'researcher' | 'tester' | 'coordinator' | 'architect' | 'reviewer';
  status: 'active' | 'idle' | 'error' | 'offline';
  currentTask?: string;
  lastHeartbeat: string;
  metrics?: {
    tasksCompleted: number;
    avgExecutionTime: number;
    successRate: number;
  };
  capabilities?: string[];
}

export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedTo?: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  subtasks?: Task[];
  priority?: 'low' | 'medium' | 'high';
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface MonitoringData {
  metrics?: SystemMetrics;
  agents?: Agent[];
  tasks?: Task[];
  alerts?: Alert[];
  timestamp: string;
}

export interface SwarmStatus {
  status: string;
  activeExecutions: number;
  totalExecutions: number;
  currentExecution?: {
    executionId: string;
    status: string;
    startTime: string;
  };
}

// Hook return types
export interface UseMonitoringAPIReturn {
  data: MonitoringData | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export interface UseSSEReturn {
  data: any;
  status: 'connecting' | 'connected' | 'error' | 'closed';
}

// Component props
export interface MetricsPanelProps {
  metrics?: SystemMetrics;
}

export interface AgentGridProps {
  agents?: Agent[];
}

export interface TaskTimelineProps {
  tasks?: Task[];
}

export interface AlertsPanelProps {
  alerts?: Alert[];
  onAcknowledge?: (alertId: string) => void;
}

// API response types
export interface DashboardResponse {
  timestamp: string;
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