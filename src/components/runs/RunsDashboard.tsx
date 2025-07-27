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

  // WebSocket connection - disabled for MVP
  useEffect(() => {
    const wsUrl = claudeFlowClient.getWebSocketUrl();
    
    if (!wsUrl) {
      setWsStatus('disconnected');
      setWsMessages(['⚠️ WebSocket not configured - using REST API only']);
      return;
    }
    
    // Original WebSocket code would go here when WebSocket API Gateway is set up
  }, []);

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
      setWsMessages(prev => [...prev, `📤 Submitted task: ${response.executionId}`]);
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
              {getWsIcon()}
              <span>WebSocket: {wsStatus}</span>
            </div>
            <Badge variant="outline">Backend: API Gateway Proxy</Badge>
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

      {/* WebSocket Log */}
      <Card>
        <CardHeader>
          <CardTitle>Swarm Monitor Log</CardTitle>
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