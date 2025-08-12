/**
 * Monitoring API for Claude Flow
 * Provides HTTP endpoints for dashboard integration without WebSockets
 */

import { Router, Request, Response } from 'express';
import type { RealTimeMonitor } from '../monitoring/real-time-monitor.js';
import type { SwarmMonitor } from '../coordination/swarm-monitor.js';
import type { AgentRegistry } from '../agents/agent-registry.js';
import type { ILogger } from '../core/logger.js';

export interface MonitoringAPIConfig {
  enableCaching?: boolean;
  cacheTTL?: number; // seconds
  maxHistoryPoints?: number;
  enableCompression?: boolean;
  rateLimitPerMinute?: number;
}

export class MonitoringAPI {
  private router: Router;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private requestCounts = new Map<string, number[]>();

  constructor(
    private monitor: RealTimeMonitor,
    private swarmMonitor: SwarmMonitor,
    private agentRegistry: AgentRegistry,
    private logger: ILogger,
    private config: MonitoringAPIConfig = {},
  ) {
    this.router = Router();
    this.setupRoutes();
    this.startCacheCleanup();
  }

  /**
   * Get Express router
   */
  getRouter(): Router {
    return this.router;
  }

  private setupRoutes(): void {
    // Apply rate limiting middleware
    this.router.use(this.rateLimitMiddleware.bind(this));

    // System metrics endpoint
    this.router.get('/metrics', this.handleGetMetrics.bind(this));

    // Alerts endpoint
    this.router.get('/alerts', this.handleGetAlerts.bind(this));

    // Agents endpoint
    this.router.get('/agents', this.handleGetAgents.bind(this));

    // Tasks endpoint
    this.router.get('/tasks', this.handleGetTasks.bind(this));

    // Dashboard data endpoint (aggregated)
    this.router.get('/dashboard', this.handleGetDashboard.bind(this));

    // Historical data endpoint
    this.router.get('/history/:metric', this.handleGetHistory.bind(this));

    // Health check endpoint
    this.router.get('/health', this.handleHealthCheck.bind(this));

    // SSE endpoint for real-time updates
    this.router.get('/stream', this.handleSSEStream.bind(this));

    // Long polling endpoint
    this.router.get('/poll', this.handleLongPoll.bind(this));
  }

  /**
   * Rate limiting middleware
   */
  private rateLimitMiddleware(req: Request, res: Response, next: Function): void {
    if (!this.config.rateLimitPerMinute) {
      return next();
    }

    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const minute = Math.floor(now / 60000);

    // Get or initialize request count
    const counts = this.requestCounts.get(clientId) || [];
    const currentMinuteCount = counts.filter((m) => m === minute).length;

    if (currentMinuteCount >= this.config.rateLimitPerMinute) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: 60 - (now % 60000) / 1000,
      });
      return;
    }

    // Record request
    counts.push(minute);
    this.requestCounts.set(clientId, counts.slice(-this.config.rateLimitPerMinute));
    next();
  }

  /**
   * Get system metrics
   */
  private async handleGetMetrics(req: Request, res: Response): Promise<void> {
    try {
      const cached = this.getCached('metrics');
      if (cached) {
        res.json(cached);
        return;
      }

      const systemMetrics = this.monitor.getSystemMetrics();
      const swarmMetrics = this.monitor.getSwarmMetrics();

      const metrics = {
        timestamp: new Date(),
        system: systemMetrics,
        swarm: swarmMetrics,
      };

      this.setCached('metrics', metrics);
      res.json(metrics);
    } catch (error) {
      this.logger.error('Error getting metrics', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  }

  /**
   * Get active alerts
   */
  private async handleGetAlerts(req: Request, res: Response): Promise<void> {
    try {
      const includeResolved = req.query.includeResolved === 'true';
      const limit = parseInt(req.query.limit as string) || 100;

      const alerts = includeResolved
        ? this.monitor.getAlertHistory(limit)
        : this.monitor.getActiveAlerts();

      res.json({
        timestamp: new Date(),
        alerts,
        total: alerts.length,
      });
    } catch (error) {
      this.logger.error('Error getting alerts', error);
      res.status(500).json({ error: 'Failed to get alerts' });
    }
  }

  /**
   * Get agent information
   */
  private async handleGetAgents(req: Request, res: Response): Promise<void> {
    try {
      const cached = this.getCached('agents');
      if (cached) {
        res.json(cached);
        return;
      }

      const agents = await this.agentRegistry.getAllAgents();
      const statistics = await this.agentRegistry.getStatistics();

      const response = {
        timestamp: new Date(),
        agents: agents.map((agent) => ({
          id: agent.id.id,
          name: agent.name,
          type: agent.type,
          status: agent.status,
          health: agent.health,
          workload: agent.workload,
          metrics: agent.metrics,
          capabilities: agent.capabilities,
        })),
        statistics,
      };

      this.setCached('agents', response);
      res.json(response);
    } catch (error) {
      this.logger.error('Error getting agents', error);
      res.status(500).json({ error: 'Failed to get agents' });
    }
  }

  /**
   * Get task information
   */
  private async handleGetTasks(req: Request, res: Response): Promise<void> {
    try {
      const summary = this.swarmMonitor.getSummary();

      const response = {
        timestamp: new Date(),
        summary: {
          total: summary.totalTasks,
          completed: summary.completedTasks,
          failed: summary.failedTasks,
          pending: summary.totalTasks - summary.completedTasks - summary.failedTasks,
          successRate: summary.successRate,
          averageDuration: summary.averageDuration,
          throughput: summary.currentThroughput,
        },
      };

      res.json(response);
    } catch (error) {
      this.logger.error('Error getting tasks', error);
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  }

  /**
   * Get aggregated dashboard data
   */
  private async handleGetDashboard(req: Request, res: Response): Promise<void> {
    try {
      const cached = this.getCached('dashboard');
      if (cached) {
        res.json(cached);
        return;
      }

      // Gather all dashboard data
      const [systemMetrics, swarmMetrics, agents, alerts, summary] = await Promise.all([
        this.monitor.getSystemMetrics(),
        this.monitor.getSwarmMetrics(),
        this.agentRegistry.getAllAgents(),
        this.monitor.getActiveAlerts(),
        this.swarmMonitor.getSummary(),
      ]);

      const dashboard = {
        timestamp: new Date(),
        system: {
          cpu: systemMetrics.cpuUsage,
          memory: systemMetrics.memoryUsage,
          disk: systemMetrics.diskUsage,
          network: systemMetrics.networkUsage,
        },
        swarm: {
          throughput: swarmMetrics.throughput,
          efficiency: swarmMetrics.efficiency,
          reliability: swarmMetrics.reliability,
          utilization: swarmMetrics.agentUtilization,
        },
        agents: {
          total: agents.length,
          active: agents.filter((a) => a.status === 'busy' || a.status === 'idle').length,
          healthy: agents.filter((a) => a.health > 0.7).length,
          byType: agents.reduce((acc, agent) => {
            acc[agent.type] = (acc[agent.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        tasks: {
          total: summary.totalTasks,
          completed: summary.completedTasks,
          failed: summary.failedTasks,
          successRate: summary.successRate,
          throughput: summary.currentThroughput,
        },
        alerts: {
          active: alerts.length,
          critical: alerts.filter((a) => a.level === 'critical').length,
          warning: alerts.filter((a) => a.level === 'warning').length,
        },
      };

      this.setCached('dashboard', dashboard, 5); // Cache for 5 seconds
      res.json(dashboard);
    } catch (error) {
      this.logger.error('Error getting dashboard data', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  }

  /**
   * Get historical data for a specific metric
   */
  private async handleGetHistory(req: Request, res: Response): Promise<void> {
    try {
      const metricName = req.params.metric;
      const hours = parseInt(req.query.hours as string) || 1;
      const maxPoints = this.config.maxHistoryPoints || 1000;

      const timeSeries = this.monitor.getTimeSeries(metricName);
      if (!timeSeries) {
        res.status(404).json({ error: 'Metric not found' });
        return;
      }

      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const points = timeSeries.points
        .filter((p) => p.timestamp > cutoff)
        .slice(-maxPoints)
        .map((p) => ({
          timestamp: p.timestamp,
          value: p.value,
        }));

      res.json({
        metric: metricName,
        points,
        aggregations: timeSeries.aggregations,
        count: points.length,
      });
    } catch (error) {
      this.logger.error('Error getting history', error);
      res.status(500).json({ error: 'Failed to get history' });
    }
  }

  /**
   * Health check endpoint
   */
  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.monitor.getMonitoringStatistics();

      res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: stats.uptime,
        metrics: {
          count: stats.metricsCount,
          activeAlerts: stats.activeAlerts,
          alertRules: stats.alertRules,
          healthChecks: stats.healthChecks,
        },
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Server-Sent Events stream
   */
  private async handleSSEStream(req: Request, res: Response): Promise<void> {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial connection message
    res.write('data: {"type":"connected"}\n\n');

    // Set up event listeners
    const metricsHandler = (data: any) => {
      res.write(`event: metrics\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const alertHandler = (data: any) => {
      res.write(`event: alert\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const taskHandler = (data: any) => {
      res.write(`event: task\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Register listeners
    this.monitor.on('metrics:updated', metricsHandler);
    this.monitor.on('alert:created', alertHandler);
    this.swarmMonitor.on('task:completed', taskHandler);

    // Send heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, 30000);

    // Clean up on client disconnect
    req.on('close', () => {
      this.monitor.off('metrics:updated', metricsHandler);
      this.monitor.off('alert:created', alertHandler);
      this.swarmMonitor.off('task:completed', taskHandler);
      clearInterval(heartbeat);
    });
  }

  /**
   * Long polling endpoint
   */
  private async handleLongPoll(req: Request, res: Response): Promise<void> {
    const timeout = parseInt(req.query.timeout as string) || 30000;
    const lastUpdate = req.query.lastUpdate
      ? new Date(req.query.lastUpdate as string)
      : new Date(0);

    const startTime = Date.now();

    // Check for immediate updates
    const updates = await this.getUpdatesSince(lastUpdate);
    if (updates.length > 0) {
      res.json({ updates, timestamp: new Date() });
      return;
    }

    // Wait for updates
    const checkInterval = setInterval(async () => {
      const updates = await this.getUpdatesSince(lastUpdate);
      if (updates.length > 0 || Date.now() - startTime >= timeout) {
        clearInterval(checkInterval);
        res.json({ updates, timestamp: new Date() });
      }
    }, 1000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(checkInterval);
    });
  }

  /**
   * Get updates since a specific timestamp
   */
  private async getUpdatesSince(since: Date): Promise<any[]> {
    const updates: any[] = [];

    // Check for new alerts
    const alerts = this.monitor.getActiveAlerts().filter((a) => a.timestamp > since);
    if (alerts.length > 0) {
      updates.push({ type: 'alerts', data: alerts });
    }

    // Check for metrics updates
    const systemMetrics = this.monitor.getSystemMetrics();
    if (systemMetrics.timestamp > since) {
      updates.push({ type: 'metrics', data: systemMetrics });
    }

    return updates;
  }

  /**
   * Cache management
   */
  private getCached(key: string): any | null {
    if (!this.config.enableCaching) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const ttl = (this.config.cacheTTL || 10) * 1000;
    if (Date.now() - cached.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCached(key: string, data: any, ttlSeconds?: number): void {
    if (!this.config.enableCaching) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const ttl = (this.config.cacheTTL || 10) * 1000;

      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }
}

/**
 * Create monitoring API router
 */
export function createMonitoringAPI(
  monitor: RealTimeMonitor,
  swarmMonitor: SwarmMonitor,
  agentRegistry: AgentRegistry,
  logger: ILogger,
  config?: MonitoringAPIConfig,
): Router {
  const api = new MonitoringAPI(monitor, swarmMonitor, agentRegistry, logger, config);
  return api.getRouter();
}