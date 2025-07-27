import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, AlertCircle, Send, LineChart, Activity } from "lucide-react";
import { claudeFlowClient } from '@/services/claudeFlowClient';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsPanel } from '@/components/monitoring/MetricsPanel';
import { AgentGrid } from '@/components/monitoring/AgentGrid';
import { TaskTimeline } from '@/components/monitoring/TaskTimeline';
import { AlertsPanel } from '@/components/monitoring/AlertsPanel';
import { useMonitoringAPI } from '@/components/monitoring/hooks/useMonitoringAPI';

const RunsDashboard = () => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [objective, setObjective] = useState('Research the population of Richmond, VA');
  const [strategy, setStrategy] = useState('research');
  const [mode, setMode] = useState('centralized');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [swarmStatus, setSwarmStatus] = useState<any>(null);
  
  // Use monitoring API hook
  const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
  const { 
    data: monitoringData, 
    error: monitoringError, 
    isLoading: monitoringLoading 
  } = useMonitoringAPI(`${apiUrl}/api/monitoring/dashboard`, 'test', {
    interval: 3000 // Poll every 3 seconds
  });

  // Check backend health
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

  // Polling for swarm status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const pollSwarmStatus = async () => {
      try {
        const status = await claudeFlowClient.getSwarmStatus();
        setSwarmStatus(status);
        
        const timestamp = new Date().toLocaleTimeString();
        const message = `[${timestamp}] Active executions: ${status.activeExecutions} | Status: ${status.status}`;
        
        setWsMessages(prev => {
          // Keep only last 10 messages
          const newMessages = [...prev, message].slice(-10);
          return newMessages;
        });
        
        if (status.currentExecution) {
          const exec = status.currentExecution;
          const swarmMessage = `[${timestamp}] Execution ${exec.executionId}: ${exec.status} (started ${new Date(exec.startTime).toLocaleTimeString()})`;
          setWsMessages(prev => [...prev, swarmMessage].slice(-10));
        }
      } catch (error) {
        console.error('Failed to poll swarm status:', error);
      }
    };
    
    if (isPolling) {
      setWsMessages(['🔄 Starting swarm monitoring...']);
      pollSwarmStatus(); // Initial poll
      pollInterval = setInterval(pollSwarmStatus, 3000); // Poll every 3 seconds
    } else {
      setWsMessages(['⚠️ WebSocket not configured - using REST API polling when tasks are running']);
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling]);

  // Start polling when a task is submitted
  useEffect(() => {
    if (executionId && !isPolling) {
      setIsPolling(true);
      
      // Stop polling after 2 minutes (adjust as needed)
      const stopTimeout = setTimeout(() => {
        setIsPolling(false);
        setWsMessages(prev => [...prev, '⏹️ Stopped monitoring (timeout)']);
      }, 120000);
      
      return () => clearTimeout(stopTimeout);
    }
  }, [executionId, isPolling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await claudeFlowClient.executeTask({
        taskType: 'swarm',
        input: {
          prompt: objective,  // This becomes the swarm command argument
          strategy: strategy,  // User selected strategy
          mode: mode,  // User selected mode
          maxAgents: 5
        }
      });
      
      setExecutionId(response.executionId);
      toast.success(`Task submitted: ${response.executionId}`);
      setWsMessages([`📤 Submitted task: ${response.executionId}`, '🔄 Starting swarm monitoring...']);
    } catch (error: any) {
      console.error('Task submission failed:', error);
      toast.error(`Failed to submit task: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'checking': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getWsIcon = () => {
    switch (wsStatus) {
      case 'connecting': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Claude Flow Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              {getHealthIcon()}
              <span>API: {healthStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              {isPolling ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                getWsIcon()
              )}
              <span>Monitoring: {isPolling ? 'polling' : wsStatus}</span>
            </div>
            <Badge variant="outline">Backend: API Gateway Proxy</Badge>
            {swarmStatus && (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {swarmStatus.activeExecutions} active executions | Total: {swarmStatus.totalExecutions}
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
              {isPolling ? 'Stop Monitoring' : 'Start Monitoring'}
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

      {/* Task Submission */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Claude Flow Swarm Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="objective" className="text-sm font-medium">
                Swarm Objective
              </label>
              <Input
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Enter objective for the swarm..."
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="strategy" className="text-sm font-medium">
                  Strategy
                </label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger id="strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="optimization">Optimization</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="mode" className="text-sm font-medium">
                  Mode
                </label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centralized">Centralized</SelectItem>
                    <SelectItem value="distributed">Distributed</SelectItem>
                    <SelectItem value="hierarchical">Hierarchical</SelectItem>
                    <SelectItem value="mesh">Mesh</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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

      {/* Monitoring Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Swarm Monitoring Dashboard
            {monitoringData && <Badge variant="secondary">Live</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {monitoringLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : monitoringError ? (
                <div className="text-center text-red-500 p-8">
                  Failed to load monitoring data
                </div>
              ) : monitoringData ? (
                <>
                  <MetricsPanel metrics={monitoringData.metrics} />
                  {monitoringData.alerts && monitoringData.alerts.length > 0 && (
                    <AlertsPanel 
                      alerts={monitoringData.alerts} 
                      onAcknowledge={(alertId) => {
                        console.log('Acknowledge alert:', alertId);
                      }}
                    />
                  )}
                </>
              ) : null}
            </TabsContent>
            
            <TabsContent value="agents" className="space-y-4">
              {monitoringData && monitoringData.agents && (
                <AgentGrid agents={monitoringData.agents} />
              )}
            </TabsContent>
            
            <TabsContent value="tasks" className="space-y-4">
              {monitoringData && monitoringData.tasks && (
                <TaskTimeline tasks={monitoringData.tasks} />
              )}
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-4">
              <div className="bg-gray-900 p-4 rounded-lg h-64 overflow-y-auto font-mono text-xs">
                {wsMessages.length === 0 ? (
                  <p className="text-gray-500">Waiting for messages...</p>
                ) : (
                  wsMessages.map((msg, idx) => (
                    <div key={idx} className="text-gray-300">
                      {msg}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RunsDashboard;