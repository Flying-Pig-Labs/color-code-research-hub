import React from 'react';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error' | 'offline';
  currentTask?: string;
  lastHeartbeat: string;
  metrics?: {
    tasksCompleted: number;
    avgExecutionTime: number;
    successRate: number;
  };
}

interface AgentGridProps {
  agents?: Agent[];
}

export const AgentGrid: React.FC<AgentGridProps> = ({ agents }) => {
  if (!agents || agents.length === 0) {
    return (
      <div className="agent-grid empty">
        <p>No active agents</p>
      </div>
    );
  }

  const getAgentIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'coder': '👨‍💻',
      'researcher': '🔍',
      'tester': '🧪',
      'coordinator': '🎯',
      'architect': '🏗️',
      'reviewer': '👀'
    };
    return icons[type] || '🤖';
  };

  const getStatusClass = (status: string) => {
    return `agent-status-${status}`;
  };

  const getTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="agent-grid">
      <h3>Active Agents ({agents.length})</h3>
      
      <div className="agents-container">
        {agents.map(agent => (
          <div key={agent.id} className={`agent-card ${getStatusClass(agent.status)}`}>
            <div className="agent-header">
              <span className="agent-icon">{getAgentIcon(agent.type)}</span>
              <span className="agent-name">{agent.name}</span>
              <span className={`agent-status-indicator ${agent.status}`} />
            </div>
            
            <div className="agent-details">
              <div className="agent-type">{agent.type}</div>
              <div className="agent-heartbeat">{getTimeSince(agent.lastHeartbeat)}</div>
            </div>
            
            {agent.currentTask && (
              <div className="agent-task">
                <span className="task-label">Current Task:</span>
                <span className="task-id">{agent.currentTask}</span>
              </div>
            )}
            
            {agent.metrics && (
              <div className="agent-metrics">
                <div className="metric">
                  <span className="metric-value">{agent.metrics.tasksCompleted}</span>
                  <span className="metric-label">Tasks</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{agent.metrics.successRate}%</span>
                  <span className="metric-label">Success</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{agent.metrics.avgExecutionTime}s</span>
                  <span className="metric-label">Avg Time</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};