/**
 * INTEGRATION_EXAMPLE.tsx
 * 
 * Complete example showing how to integrate monitoring components
 * into the existing RunsDashboard for the RESEARCH/Runs tab
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Send, 
  Activity,
  BarChart3,
  Users,
  Bell
} from "lucide-react";

// Import our new monitoring components
import { 
  MetricsPanel, 
  AgentGrid, 
  TaskTimeline, 
  AlertsPanel,
  PerformanceChart,
  useMonitoringAPI,
  useSSE,
  type MonitoringData
} from '@/components/monitoring';

// Import existing Claude Flow client
import { claudeFlowClient } from '@/services/claudeFlowClient';
import { toast } from 'sonner';

const EnhancedRunsDashboard = () => {
  // ==========================================
  // EXISTING STATE (from current RunsDashboard)
  // ==========================================
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [objective, setObjective] = useState('Research the population of Richmond, VA');
  const [strategy, setStrategy] = useState('research');
  const [mode, setMode] = useState('centralized');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [swarmStatus, setSwarmStatus] = useState<any>(null);

  // ==========================================
  // NEW MONITORING STATE
  // ==========================================
  const [showMonitoring, setShowMonitoring] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h'>('1h');

  // Monitoring API integration
  const { 
    data: monitoringData, 
    loading: monitoringLoading, 
    error: monitoringError,
    refetch: refetchMonitoring
  } = useMonitoringAPI(
    import.meta.env.VITE_API_BASE_URL || '',
    'your-api-key', // This should come from env or context
    {
      pollingInterval: 5000,
      enabled: showMonitoring
    }
  );

  // SSE for real-time updates
  const { data: sseData, status: sseStatus } = useSSE(
    `${import.meta.env.VITE_API_BASE_URL}/api/stream`,
    'your-api-key',
    {
      enabled: showMonitoring
    }
  );

  // ==========================================
  // EXISTING EFFECTS (from current RunsDashboard)
  // ==========================================
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await claudeFlowClient.checkHealth();
        setHealthStatus(health.status === 'healthy' ? 'healthy' : 'error');
      } catch (error) {
        console.error('Health check failed:', error);
        setHealthStatus('error');
        toast.error('Failed to connect to Claude Flow backend');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Enhanced polling that includes monitoring data
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const pollAllData = async () => {
      try {
        // Existing swarm status polling
        const status = await claudeFlowClient.getSwarmStatus();
        setSwarmStatus(status);
        
        const timestamp = new Date().toLocaleTimeString();
        const message = `[${timestamp}] Active executions: ${status.activeExecutions} | Status: ${status.status}`;
        
        setWsMessages(prev => [...prev, message].slice(-10));
        
        // Add current execution info if available
        if (status.currentExecution) {
          const exec = status.currentExecution;
          const swarmMessage = `[${timestamp}] Execution ${exec.executionId}: ${exec.status} (started ${new Date(exec.startTime).toLocaleTimeString()})`;
          setWsMessages(prev => [...prev, swarmMessage].slice(-10));
        }
      } catch (error) {
        console.error('Failed to poll data:', error);
      }
    };
    
    if (isPolling) {
      setWsMessages(['🔄 Starting enhanced monitoring...']);
      pollAllData();
      pollInterval = setInterval(pollAllData, 3000);
    } else {
      setWsMessages(['⚠️ Monitoring paused - click Start Monitoring to resume']);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling]);

  // ==========================================
  // NEW MONITORING EFFECTS
  // ==========================================
  useEffect(() => {
    if (sseData) {
      console.log('Received SSE data:', sseData);
      // Handle real-time updates from SSE
      const timestamp = new Date().toLocaleTimeString();
      setWsMessages(prev => [...prev, `[${timestamp}] SSE Update: ${sseData.type || 'Data received'}`].slice(-10));
    }
  }, [sseData]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await claudeFlowClient.executeTask({
        taskType: 'swarm',
        input: {
          prompt: objective,
          strategy: strategy,
          mode: mode,
          maxAgents: 5
        }
      });
      
      setExecutionId(response.executionId);
      toast.success(`Task submitted: ${response.executionId}`);
      setWsMessages([`📤 Submitted task: ${response.executionId}`, '🔄 Starting enhanced monitoring...']);
      
      // Start monitoring when task is submitted
      setIsPolling(true);
      setShowMonitoring(true);
    } catch (error: any) {
      console.error('Task submission failed:', error);
      toast.error(`Failed to submit task: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlertAcknowledge = async (alertId: string) => {
    try {
      await claudeFlowClient.acknowledgeAlert?.(alertId);
      toast.success('Alert acknowledged');
      refetchMonitoring();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'checking': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getConnectionStatusBadge = () => {
    if (monitoringError) return <Badge variant="destructive">API Error</Badge>;
    if (monitoringLoading) return <Badge variant="secondary">Loading...</Badge>;
    if (sseStatus === 'connected') return <Badge variant="default">Live</Badge>;
    return <Badge variant="outline">Polling</Badge>;
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-6 p-4">
      {/* Enhanced Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Claude Flow Connection & Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              {getHealthIcon()}
              <span>API: {healthStatus}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Monitoring: {showMonitoring ? 'enabled' : 'disabled'}</span>
              {getConnectionStatusBadge()}
            </div>
            
            <div className="flex items-center gap-2">
              {isPolling ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span>Status: {isPolling ? 'polling' : 'paused'}</span>
            </div>

            {swarmStatus && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">
                  {swarmStatus.activeExecutions} active | {swarmStatus.totalExecutions} total
                </span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPolling(!isPolling)}
              disabled={healthStatus !== 'healthy'}
            >
              {isPolling ? 'Pause Monitoring' : 'Start Monitoring'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMonitoring(!showMonitoring)}
            >
              {showMonitoring ? 'Hide Dashboard' : 'Show Dashboard'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWsMessages([])}
            >
              Clear Log
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Monitoring Dashboard */}
      {showMonitoring && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agents & Tasks
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricsPanel metrics={monitoringData?.metrics} />
              <AlertsPanel 
                alerts={monitoringData?.alerts}
                onAcknowledge={handleAlertAcknowledge}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentGrid agents={monitoringData?.agents} />
              <TaskTimeline tasks={monitoringData?.tasks} />
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Time Range:</span>
              <div className="flex gap-2">
                {(['1h', '6h', '24h'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
            <PerformanceChart 
              data={[]} // This would come from historical data API
              timeRange={selectedTimeRange}
              showLegend={true}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Existing Task Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Claude Flow Swarm Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... existing form fields ... */}
            <Button 
              type="submit" 
              disabled={isSubmitting || healthStatus !== 'healthy'}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit to Claude Flow
                </>
              )}
            </Button>
          </form>
          
          {executionId && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
              <p className="text-sm">
                <strong>Execution ID:</strong> {executionId}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Swarm Monitor Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Swarm Monitor Log
            {isPolling && <Badge variant="secondary">Live</Badge>}
            {sseStatus === 'connected' && <Badge variant="default">SSE Connected</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 p-4 rounded-lg h-64 overflow-y-auto font-mono text-xs">
            {wsMessages.length === 0 ? (
              <p className="text-gray-500">Waiting for messages...</p>
            ) : (
              wsMessages.map((msg, idx) => (
                <div key={idx} className="text-gray-300 hover:text-white transition-colors">
                  {msg}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRunsDashboard;

/* 
IMPLEMENTATION STEPS:

1. Install recharts dependency:
   npm install recharts

2. Update claudeFlowClient service:
   Add the monitoring endpoints (getDashboardData, getAgents, etc.)

3. Replace existing RunsDashboard with this component:
   cp INTEGRATION_EXAMPLE.tsx ../runs/RunsDashboard.tsx

4. Update imports in Index.tsx if needed

5. Configure environment variables:
   VITE_API_BASE_URL=your-api-gateway-url

6. Test the integration:
   - Verify monitoring components render
   - Test real-time polling
   - Check SSE connection
   - Submit test tasks
   - Monitor alert system

This provides a seamless enhancement to the existing RESEARCH/Runs tab
while maintaining all current functionality.
*/