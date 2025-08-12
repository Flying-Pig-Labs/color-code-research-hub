import React, { useState, useEffect } from 'react';
import { MetricsPanel } from './MetricsPanel';
import { AgentGrid } from './AgentGrid';
import { TaskTimeline } from './TaskTimeline';
import { AlertsPanel } from './AlertsPanel';
import { useMonitoringAPI } from './hooks/useMonitoringAPI';
import { useSSE } from './hooks/useSSE';
import './MonitoringDashboard.css';

interface MonitoringDashboardProps {
  apiUrl: string;
  apiKey: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ apiUrl, apiKey }) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  // Use polling for initial data
  const { data: polledData, error: pollError } = useMonitoringAPI(apiUrl, apiKey);
  
  // Use SSE for real-time updates
  const { data: sseData, status: sseStatus } = useSSE(`${apiUrl}/stream`, apiKey);

  useEffect(() => {
    if (polledData) {
      setDashboardData(polledData);
      setConnectionStatus('connected');
    }
  }, [polledData]);

  useEffect(() => {
    if (sseData) {
      setDashboardData(prev => ({
        ...prev,
        ...sseData
      }));
    }
  }, [sseData]);

  useEffect(() => {
    if (pollError || sseStatus === 'error') {
      setConnectionStatus('error');
    }
  }, [pollError, sseStatus]);

  if (connectionStatus === 'connecting') {
    return (
      <div className="monitoring-dashboard loading">
        <div className="spinner"></div>
        <p>Connecting to Claude Flow monitoring...</p>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="monitoring-dashboard error">
        <div className="error-message">
          <h3>Connection Error</h3>
          <p>Unable to connect to monitoring service. Please check your configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-header">
        <h2>Claude Flow Monitoring</h2>
        <div className="connection-status">
          <span className={`status-indicator ${connectionStatus}`}></span>
          {connectionStatus === 'connected' ? 'Live' : 'Offline'}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="metrics-section">
          <MetricsPanel metrics={dashboardData?.metrics} />
        </div>

        <div className="agents-section">
          <AgentGrid agents={dashboardData?.agents} />
        </div>

        <div className="tasks-section">
          <TaskTimeline tasks={dashboardData?.tasks} />
        </div>

        <div className="alerts-section">
          <AlertsPanel alerts={dashboardData?.alerts} />
        </div>
      </div>
    </div>
  );
};