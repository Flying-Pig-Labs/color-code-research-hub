import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import { claudeFlowClient } from '@/services/claudeFlowClient';
import { toast } from 'sonner';

const RunsDashboard = () => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [objective, setObjective] = useState('Research the population of Richmond, VA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [swarmStatus, setSwarmStatus] = useState<any>(null);

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
        const message = `[${timestamp}] Active swarms: ${status.activeSwarms}`;
        
        setWsMessages(prev => {
          // Keep only last 10 messages
          const newMessages = [...prev, message].slice(-10);
          return newMessages;
        });
        
        if (status.swarms && status.swarms.length > 0) {
          status.swarms.forEach((swarm: any) => {
            const swarmMessage = `[${timestamp}] Swarm ${swarm.id}: ${swarm.status} (${swarm.agents} agents)`;
            setWsMessages(prev => [...prev, swarmMessage].slice(-10));
          });
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
        taskType: 'hive-mind',
        input: {
          objective,
          mode: 'centralized',
          agents: {
            coordinator: 1,
            coder: 2,
            tester: 1
          }
        },
        metadata: {
          priority: 'normal',
          tags: ['research', 'mvp']
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
                  {swarmStatus.activeSwarms} active swarms
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
          <CardTitle>Submit Research Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="objective" className="text-sm font-medium">
                Research Objective
              </label>
              <Input
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Enter research objective..."
                required
              />
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

      {/* Swarm Monitor Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Swarm Monitor Log
            {isPolling && <Badge variant="secondary">Live Polling</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default RunsDashboard;