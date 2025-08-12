import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface PerformanceDataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  throughput: number;
  responseTime: number;
}

interface PerformanceChartProps {
  data?: PerformanceDataPoint[];
  timeRange?: '1h' | '6h' | '24h' | '7d';
  showLegend?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data = [], 
  timeRange = '1h',
  showLegend = true 
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '1h' || timeRange === '6h') {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit'
    });
  };

  const formatTooltipValue = (value: number, name: string) => {
    switch (name) {
      case 'cpu':
      case 'memory':
        return [`${value.toFixed(1)}%`, name.toUpperCase()];
      case 'throughput':
        return [`${value.toFixed(0)}/s`, 'Throughput'];
      case 'responseTime':
        return [`${value.toFixed(0)}ms`, 'Response Time'];
      default:
        return [value, name];
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium mb-2">{formatTimestamp(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatTooltipValue(entry.value, entry.dataKey)[0]}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends ({timeRange})
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Last {data.length} data points
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* CPU and Memory Usage */}
          <div>
            <h4 className="text-sm font-medium mb-3">System Resources</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    fontSize={12}
                    tickMargin={8}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="CPU"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memory" 
                    stackId="1"
                    stroke="hsl(var(--destructive))" 
                    fill="hsl(var(--destructive))"
                    fillOpacity={0.3}
                    name="Memory"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Throughput and Response Time */}
          <div>
            <h4 className="text-sm font-medium mb-3">Application Performance</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimestamp}
                    fontSize={12}
                    tickMargin={8}
                  />
                  <YAxis 
                    yAxisId="left"
                    fontSize={12}
                    tickFormatter={(value) => `${value}/s`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    fontSize={12}
                    tickFormatter={(value) => `${value}ms`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="throughput" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                    name="Throughput"
                    activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    dot={false}
                    name="Response Time"
                    activeDot={{ r: 4, fill: "hsl(var(--secondary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>CPU Usage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <span>Memory Usage</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Throughput</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span>Response Time</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};