import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, RefreshCw, Download, Maximize2, Loader2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useSwarmWebSocket, SWARM_EVENTS } from "@/hooks/useSwarmWebSocket";

interface LogEntry {
  timestamp: string;
  level: 'info' | 'debug' | 'warn' | 'error';
  message: string;
  agentId?: string;
  metadata?: any;
}

interface SwarmLogsViewerProps {
  swarmId: string;
  onClose?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const SwarmLogsViewer = ({ 
  swarmId, 
  onClose, 
  autoRefresh = true,
  refreshInterval = 5000 
}: SwarmLogsViewerProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logLevel, setLogLevel] = useState<'all' | 'info' | 'debug' | 'warn' | 'error'>('debug');
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  
  // WebSocket connection for real-time logs
  const { 
    isConnected, 
    events, 
    getEventsBySwarm 
  } = useSwarmWebSocket({
    onEvent: (event) => {
      // Convert WebSocket events to log entries
      if (event.swarmId === swarmId && (event.type === SWARM_EVENTS.LOG_ENTRY || event.message)) {
        const logEntry: LogEntry = {
          timestamp: event.timestamp,
          level: event.level || 'info',
          message: event.message || `${event.type}: ${JSON.stringify(event.metadata || {})}`,
          agentId: event.agentId,
          metadata: event.metadata
        };
        
        setLogs(prev => [...prev, logEntry]);
        
        // Auto-scroll if enabled
        if (shouldAutoScroll.current && scrollAreaRef.current) {
          setTimeout(() => {
            const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
          }, 100);
        }
      }
    }
  });

  const fetchLogs = async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        level: logLevel === 'all' ? 'debug' : logLevel
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/claude-flow/execution/${swarmId}/logs?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform the logs data based on the backend response format
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        console.warn('Unexpected logs format:', data);
        setLogs([]);
      }

      // Auto-scroll to bottom if enabled
      if (shouldAutoScroll.current && scrollAreaRef.current) {
        setTimeout(() => {
          const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchLogs();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs(false);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [swarmId, logLevel, limit, offset, autoRefresh, refreshInterval]);

  const handleManualRefresh = () => {
    fetchLogs(false);
  };

  const handleDownloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}]${log.agentId ? ` [${log.agentId}]` : ''} ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swarm-${swarmId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  const getLogLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>Swarm Execution Logs</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {swarmId}
            </Badge>
            {autoRefresh && (
              <Badge variant="secondary" className="text-xs">
                Auto-refresh: {refreshInterval / 1000}s
              </Badge>
            )}
            <Badge 
              variant={isConnected ? "default" : "destructive"} 
              className="text-xs flex items-center gap-1"
            >
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Real-time execution logs from the research swarm
        </CardDescription>
        
        {/* Controls */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadLogs}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>

          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value as any)}
            className="px-3 py-1 text-sm border rounded-md"
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
          </select>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1 text-sm border rounded-md"
          >
            <option value="50">Last 50</option>
            <option value="100">Last 100</option>
            <option value="200">Last 200</option>
            <option value="500">Last 500</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-hidden p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No logs available yet
          </div>
        ) : (
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-4 font-mono text-sm space-y-1">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 hover:bg-muted/50 p-1 rounded"
                >
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <Badge 
                    variant={getLogLevelBadgeVariant(log.level) as any}
                    className="text-xs font-mono uppercase"
                  >
                    {log.level}
                  </Badge>
                  {log.agentId && (
                    <Badge variant="outline" className="text-xs">
                      {log.agentId}
                    </Badge>
                  )}
                  <span className={`flex-1 break-all ${getLogLevelColor(log.level)}`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default SwarmLogsViewer;