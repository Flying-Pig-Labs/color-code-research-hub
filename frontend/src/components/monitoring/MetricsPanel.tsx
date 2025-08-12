import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Cpu, MemoryStick, Users } from 'lucide-react';
import { SystemMetrics, Metric } from './types';

interface MetricsPanelProps {
  metrics?: SystemMetrics;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading metrics...
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'MB') return `${value.toFixed(0)} MB`;
    if (unit === 'GB') return `${value.toFixed(1)} GB`;
    return value.toString();
  };

  const getStatusVariant = (metric: Metric): "default" | "secondary" | "destructive" | "outline" => {
    if (!metric.threshold) return "default";
    if (metric.value > metric.threshold * 0.9) return "destructive";
    if (metric.value > metric.threshold * 0.7) return "secondary";
    return "default";
  };

  const getTrendIcon = (trend: number[]) => {
    if (trend.length < 2) return null;
    const recent = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    
    if (recent > previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (recent < previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getMetricIcon = (key: string) => {
    switch (key) {
      case 'cpu': return <Cpu className="h-4 w-4" />;
      case 'memory': return <MemoryStick className="h-4 w-4" />;
      case 'activeAgents': return <Users className="h-4 w-4" />;
      case 'runningTasks': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const prepareChartData = (trend: number[]) => {
    return trend.map((value, index) => ({
      x: index,
      value: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(metrics).map(([key, metric]) => {
            if (key === 'timestamp') return null;
            
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getMetricIcon(key)}
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    <Badge variant={getStatusVariant(metric)}>
                      {formatValue(metric.value, metric.unit)}
                    </Badge>
                  </div>
                </div>
                
                {metric.trend && metric.trend.length > 1 && (
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareChartData(metric.trend)}>
                        <XAxis 
                          dataKey="x" 
                          hide 
                        />
                        <YAxis 
                          hide 
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {metric.threshold && (
                  <div className="text-xs text-muted-foreground">
                    Threshold: {formatValue(metric.threshold, metric.unit)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};