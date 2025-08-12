import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Metric {
  name: string;
  value: number;
  unit: string;
  trend: number[];
  threshold?: number;
}

interface MetricsPanelProps {
  metrics?: {
    cpu: Metric;
    memory: Metric;
    activeAgents: Metric;
    runningTasks: Metric;
    completedTasks: Metric;
  };
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  if (!metrics) {
    return <div className="metrics-panel loading">Loading metrics...</div>;
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'MB') return `${value.toFixed(0)} MB`;
    return value.toString();
  };

  const getStatusColor = (metric: Metric) => {
    if (!metric.threshold) return 'normal';
    return metric.value > metric.threshold ? 'warning' : 'normal';
  };

  return (
    <div className="metrics-panel">
      <h3>System Metrics</h3>
      
      <div className="metrics-grid">
        {Object.entries(metrics).map(([key, metric]) => (
          <div key={key} className={`metric-card ${getStatusColor(metric)}`}>
            <div className="metric-header">
              <span className="metric-name">{metric.name}</span>
              <span className="metric-value">
                {formatValue(metric.value, metric.unit)}
              </span>
            </div>
            
            {metric.trend && metric.trend.length > 0 && (
              <div className="metric-chart">
                <ResponsiveContainer width="100%" height={50}>
                  <LineChart data={metric.trend.map((v, i) => ({ x: i, y: v }))}>
                    <Line 
                      type="monotone" 
                      dataKey="y" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};