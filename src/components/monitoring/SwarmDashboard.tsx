import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Server, 
  Zap, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Play,
  Square,
  RefreshCw,
  Download,
  Eye,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

interface Swarm {
  id: string;
  objective: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  startTime: number;
  endTime?: number;
  duration?: number;
  agents?: number;
  progress?: number;
}

interface SystemMetrics {
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  activeSwarms: number;
  connectedClients: number;
  totalExecutions: number;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'debug' | 'warn' | 'error';
  message: string;
  swarmId?: string;
  agentId?: string;
}

const SwarmDashboard = () => {
  const [swarms, setSwarms] = useState<Swarm[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSwarm, setSelectedSwarm] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Fetch all data
  const fetchDashboardData = async () => {
    try {
      // Fetch swarms list
      const swarmsResponse = await fetch(`${API_BASE_URL}/api/claude-flow/swarms`);
      if (swarmsResponse.ok) {
        const swarmsData = await swarmsResponse.json();
        setSwarms(swarmsData.swarms || []);
      }

      // Fetch system status
      const systemResponse = await fetch(`${API_BASE_URL}/api/claude-flow/system/status`);
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        setSystemMetrics(systemData.system || systemData);
      }

      // Fetch recent logs
      const logsResponse = await fetch(`${API_BASE_URL}/api/claude-flow/logs?limit=50&level=info`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setRecentLogs(logsData.logs || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, 5000); // 5 second refresh
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Swarm actions
  const stopSwarm = async (swarmId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude-flow/swarms/${swarmId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Swarm stopped successfully');
        fetchDashboardData();
      } else {
        throw new Error('Failed to stop swarm');
      }
    } catch (error) {
      toast.error('Failed to stop swarm');
    }
  };

  const downloadSwarmLogs = async (swarmId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude-flow/logs?swarmId=${swarmId}&limit=1000`);
      const data = await response.json();
      
      const logText = data.logs?.map((log: LogEntry) => 
        `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
      ).join('\n') || '';

      const blob = new Blob([logText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swarm-${swarmId}-logs.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Logs downloaded');
    } catch (error) {
      toast.error('Failed to download logs');
    }
  };

  // Status colors and icons
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'stopped': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'stopped': return <Square className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading swarm dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />
      
      <div className="container mx-auto p-6 space-y-6 dark">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-400 font-mono">$ swarm --monitor</h1>
            <p className="text-gray-500 font-mono text-sm">Monitor and control all AI agent swarms</p>
          </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="h-4 w-4 mr-1" />
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-950 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-mono">Active Swarms</p>
                <p className="text-2xl font-bold text-green-400 font-mono">{systemMetrics?.activeSwarms || swarms.filter(s => s.status === 'running').length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-950 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-mono">Total Executions</p>
                <p className="text-2xl font-bold text-cyan-400 font-mono">{systemMetrics?.totalExecutions || swarms.length}</p>
              </div>
              <Server className="h-8 w-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-950 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-mono">Memory Usage</p>
                <p className="text-2xl font-bold text-yellow-400 font-mono">{systemMetrics ? formatBytes(systemMetrics.memory.heapUsed) : 'N/A'}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-950 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-mono">Uptime</p>
                <p className="text-2xl font-bold text-purple-400 font-mono">{systemMetrics ? formatDuration(systemMetrics.uptime * 1000) : 'N/A'}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="swarms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-950 border-gray-800">
          <TabsTrigger value="swarms" className="font-mono data-[state=active]:bg-gray-800 data-[state=active]:text-green-400">Active Swarms</TabsTrigger>
          <TabsTrigger value="logs" className="font-mono data-[state=active]:bg-gray-800 data-[state=active]:text-green-400">System Logs</TabsTrigger>
          <TabsTrigger value="metrics" className="font-mono data-[state=active]:bg-gray-800 data-[state=active]:text-green-400">Performance</TabsTrigger>
        </TabsList>

        {/* Swarms Tab */}
        <TabsContent value="swarms" className="space-y-4">
          <Card className="bg-gray-950 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400 font-mono">
                <Users className="h-5 w-5" />
                Swarm Status Overview
              </CardTitle>
              <CardDescription className="text-gray-500 font-mono text-sm">
                Monitor and control all AI agent swarms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {swarms.length === 0 ? (
                <div className="text-center py-8 text-gray-600 font-mono">
                  $ No swarms are currently active
                </div>
              ) : (
                <div className="space-y-4">
                  {swarms.map((swarm) => (
                    <Card key={swarm.id} className="bg-black border-gray-800 border-l-4 border-l-green-400">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(swarm.status)}
                              <span className="font-medium">{swarm.objective}</span>
                              <Badge variant="outline" className="font-mono text-xs">
                                {swarm.id}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Status:</span>
                                <Badge variant="secondary" className={`ml-1 ${getStatusColor(swarm.status)}`}>
                                  {swarm.status}
                                </Badge>
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span>
                                <span className="ml-1">
                                  {swarm.duration ? formatDuration(swarm.duration) : 
                                   swarm.startTime ? formatDuration(Date.now() - swarm.startTime) : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Agents:</span>
                                <span className="ml-1">{swarm.agents || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-medium">Started:</span>
                                <span className="ml-1">
                                  {swarm.startTime ? new Date(swarm.startTime).toLocaleTimeString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                            {swarm.progress !== undefined && (
                              <div className="mt-2">
                                <Progress value={swarm.progress} className="h-2" />
                                <span className="text-xs text-muted-foreground">{swarm.progress}% complete</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSwarm(swarm.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadSwarmLogs(swarm.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {swarm.status === 'running' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => stopSwarm(swarm.id)}
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-gray-950 border-gray-800">
            <CardHeader>
              <CardTitle className="text-green-400 font-mono">System Logs</CardTitle>
              <CardDescription className="text-gray-500">Recent activity across all swarms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 border border-gray-800">
                <ScrollArea className="h-96">
                  {recentLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 font-mono">
                      $ No recent logs available
                    </div>
                  ) : (
                    <div className="space-y-1 font-mono text-sm">
                      {recentLogs.map((log, index) => (
                        <div key={index} className="text-gray-300 hover:bg-gray-900/50 px-2 py-1 rounded">
                          <span className={`${
                            log.level === 'error' ? 'text-red-400' :
                            log.level === 'warn' ? 'text-yellow-400' :
                            log.level === 'info' ? 'text-blue-400' :
                            'text-green-400'
                          }`}>
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                          {log.swarmId && (
                            <span className="text-cyan-400 ml-2">[{log.swarmId.slice(0, 8)}]</span>
                          )}
                          {log.agentId && (
                            <span className="text-purple-400 ml-2">[{log.agentId}]</span>
                          )}
                          <span className="text-gray-300 ml-2">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {systemMetrics ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Usage</span>
                        <span>{Math.round((systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100)}%</span>
                      </div>
                      <Progress value={(systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">RSS:</span>
                        <span className="ml-2">{formatBytes(systemMetrics.memory.rss)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Heap Total:</span>
                        <span className="ml-2">{formatBytes(systemMetrics.memory.heapTotal)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No system metrics available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Running Swarms</span>
                    <span className="font-medium">{swarms.filter(s => s.status === 'running').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed Today</span>
                    <span className="font-medium">{swarms.filter(s => s.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed</span>
                    <span className="font-medium text-red-500">{swarms.filter(s => s.status === 'failed').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default SwarmDashboard;