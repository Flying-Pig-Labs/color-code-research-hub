import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { apiService } from "@/services/api";
import { Loader2, Trash2, RefreshCw, CheckCircle2, XCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { checkResearchStatus } from "@/services/researchApi";

interface ResearchTask {
  id: string;
  team: string;
  vendorName?: string;
  companyName?: string;
  whitespaceType?: string[];
  targetUser?: string[];
  createdAt: string;
  deadline?: string;
  status: string;
  teamSize?: string;
  roles?: string[];
  requestId?: string;
  result?: any;
  s3_key?: string;
  download_url?: string;
  summary?: string;
  summaryWordCount?: number;
  reportId?: string;
  reportProcessed?: boolean;
}

interface ResearchRequestTableActiveProps {
  teamType: 'red' | 'black' | 'white';
}

const ResearchRequestTableActive = ({ teamType }: ResearchRequestTableActiveProps) => {
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingApi, setIsUsingApi] = useState(false);
  const [pollingTasks, setPollingTasks] = useState<Set<string>>(new Set());
  const [downloadingTasks, setDownloadingTasks] = useState<Set<string>>(new Set());

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      // Check if API is available
      const health = await apiService.checkHealth();
      if (health.status === 'healthy') {
        setIsUsingApi(true);
      }
    } catch (error) {
      setIsUsingApi(false);
    }
    
    // Load from localStorage
    const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
    const teamTasks = existingTasks.filter((task: ResearchTask) => task.team === teamType);
    setTasks(teamTasks.reverse()); // Show newest first
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
    
    // Listen for storage changes
    const handleStorageChange = () => loadTasks();
    const handleTaskAdded = () => loadTasks();
    const handleTaskUpdated = () => loadTasks();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('taskAdded', handleTaskAdded);
    window.addEventListener('taskUpdated', handleTaskUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('taskAdded', handleTaskAdded);
      window.removeEventListener('taskUpdated', handleTaskUpdated);
    };
  }, [teamType]);

  // Poll for status updates of processing tasks
  useEffect(() => {
    const processingTasks = tasks.filter(task => 
      ((task.status === 'processing' || task.status === 'pending') || 
       (task.status === 'completed' && !task.summary)) && task.requestId
    );
    
    if (processingTasks.length === 0) return;

    // Update polling set
    setPollingTasks(new Set(processingTasks.map(t => t.requestId!)));

    const pollInterval = setInterval(async () => {
      let hasUpdates = false;
      
      for (const task of processingTasks) {
        if (!task.requestId) continue;
        
        try {
          const status = await checkResearchStatus(task.requestId);
          
          if (status.status !== task.status || (status.summary && !task.summary)) {
            hasUpdates = true;
            
            // Update task in localStorage
            const allTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
            const updatedTasks = allTasks.map((t: ResearchTask) => 
              t.requestId === task.requestId 
                ? { 
                    ...t, 
                    status: status.status, 
                    result: status.result,
                    s3_key: status.s3_key,
                    download_url: status.download_url,
                    summary: status.summary,
                    summaryWordCount: status.summaryWordCount,
                    reportId: status.reportId,
                    reportProcessed: status.reportProcessed
                  }
                : t
            );
            localStorage.setItem('researchTasks', JSON.stringify(updatedTasks));
            
            // Show toast for completion or when summary becomes available
            if (status.status === 'completed' && !task.summary && status.summary) {
              toast.success(
                <div>
                  <p className="font-semibold">Research completed with summary!</p>
                  <p className="text-sm mt-1">{task.vendorName || task.companyName || 'task'}</p>
                </div>
              );
            } else if (status.status === 'completed' && !task.summary) {
              toast.success(`Research for ${task.vendorName || task.companyName || 'task'} completed!`);
            } else if (status.status === 'failed') {
              toast.error(`Research for ${task.vendorName || task.companyName || 'task'} failed`);
            } else if (!task.summary && status.summary) {
              toast.info(`Summary ready for ${task.vendorName || task.companyName || 'task'}`);
            }
          }
        } catch (error) {
          console.error(`Error checking status for ${task.requestId}:`, error);
        }
      }
      
      if (hasUpdates) {
        loadTasks();
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [tasks, teamType]);

  const clearOldJobs = () => {
    const allTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
    const otherTeamTasks = allTasks.filter((task: ResearchTask) => task.team !== teamType);
    localStorage.setItem('researchTasks', JSON.stringify(otherTeamTasks));
    setTasks([]);
    toast.success(`Cleared all ${teamType} team research jobs`);
  };

  const handleDownload = async (task: ResearchTask) => {
    if (!task.s3_key) {
      toast.error('No download available for this research');
      return;
    }

    setDownloadingTasks(prev => new Set(prev).add(task.id));

    try {
      // If we have a fresh download URL, use it
      if (task.download_url) {
        const link = document.createElement('a');
        link.href = task.download_url;
        link.download = `research_${task.requestId || task.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      } else {
        // Otherwise, fetch a new presigned URL
        const encodedKey = btoa(task.s3_key);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/research/download/${encodedKey}`);
        
        if (!response.ok) {
          throw new Error('Failed to get download URL');
        }
        
        const data = await response.json();
        if (data.download_url) {
          const link = document.createElement('a');
          link.href = data.download_url;
          link.download = `research_${task.requestId || task.id}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Download started');
        } else {
          throw new Error('No download URL received');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download research report');
    } finally {
      setDownloadingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'red': return 'bg-red-team text-white';
      case 'black': return 'bg-black-team text-white';
      case 'white': return 'bg-white-team-dark text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusBadge = (task: ResearchTask) => {
    const isPolling = pollingTasks.has(task.requestId || '');
    
    // Show as processing if status is completed but summary is not yet available
    if (task.status === 'completed' && !task.summary) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white">
            <Loader2 className={`h-3 w-3 mr-1 ${isPolling ? 'animate-spin' : ''}`} />
            Processing Summary
          </Badge>
          {isPolling && (
            <RefreshCw className="h-3 w-3 text-muted-foreground animate-pulse" />
          )}
        </div>
      );
    } else if (task.status === 'completed') {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        </div>
      );
    } else if (task.status === 'failed') {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-red-600 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        </div>
      );
    } else if (task.status === 'processing' || task.status === 'pending') {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-600 text-white">
            <Loader2 className={`h-3 w-3 mr-1 ${isPolling ? 'animate-spin' : ''}`} />
            Processing
          </Badge>
          {isPolling && (
            <RefreshCw className="h-3 w-3 text-muted-foreground animate-pulse" />
          )}
        </div>
      );
    }
    
    return <Badge>{task.status}</Badge>;
  };

  const getTaskTitle = (task: ResearchTask) => {
    if (task.vendorName) return task.vendorName;
    if (task.companyName) return task.companyName;
    if (task.whitespaceType && task.whitespaceType.length > 0) {
      return task.whitespaceType[0];
    }
    return 'Research Task';
  };

  const getTaskDescription = (task: ResearchTask) => {
    if (task.targetUser && task.targetUser.length > 0) {
      return `Target: ${task.targetUser.join(', ')}`;
    }
    if (task.roles && task.roles.length > 0) {
      return `Roles: ${task.roles.join(', ')}`;
    }
    if (task.requestId) {
      return `Request ID: ${task.requestId.substring(0, 8)}...`;
    }
    return 'Research in progress';
  };

  if (isLoading) {
    return (
      <Card className={`${teamType === 'black' ? 'bg-black-team-light border-white/20' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-lg ${teamType === 'black' ? 'text-white' : 'text-foreground'}`}>
            Active Research Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className={`h-6 w-6 animate-spin ${teamType === 'black' ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeTasks = tasks.filter(t => t.status === 'processing' || t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Active Jobs */}
      {activeTasks.length > 0 && (
        <Card className={`${teamType === 'black' ? 'bg-black-team-light border-white/20' : 'border-gray-200'}`}>
          <CardHeader>
            <CardTitle className={`text-lg ${teamType === 'black' ? 'text-white' : 'text-foreground'} flex items-center justify-between`}>
              <span className="flex items-center gap-2">
                Active Research Jobs
                <Badge variant="outline" className="text-xs">
                  {activeTasks.length} Running
                </Badge>
              </span>
              {pollingTasks.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-pulse" />
                  Polling every 10s
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className={`font-medium ${teamType === 'black' ? 'text-white' : ''}`}>
                        {getTaskTitle(task)}
                      </h4>
                      <p className={`text-sm ${teamType === 'black' ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {getTaskDescription(task)}
                      </p>
                    </div>
                    {getStatusBadge(task)}
                  </div>
                  {task.summary && (
                    <div className={`bg-purple-50 border border-purple-200 rounded-lg p-3 ${teamType === 'black' ? 'bg-purple-900/20 border-purple-400/30' : ''}`}>
                      <p className={`text-sm font-medium mb-1 ${teamType === 'black' ? 'text-purple-300' : 'text-purple-900'}`}>
                        Executive Summary ({task.summaryWordCount || 120} words)
                      </p>
                      <p className={`text-sm ${teamType === 'black' ? 'text-white/80' : 'text-gray-700'}`}>
                        {task.summary}
                      </p>
                    </div>
                  )}
                  <div className="w-full">
                    <Progress 
                      value={
                        task.summary ? 100 : 
                        task.status === 'completed' ? 70 : 
                        30
                      } 
                      className="h-2" 
                    />
                    <p className={`text-xs mt-1 ${teamType === 'black' ? 'text-white/60' : 'text-muted-foreground'}`}>
                      Started {format(new Date(task.createdAt), 'MMM dd, HH:mm')}
                      {task.status === 'completed' && !task.summary && ' • Generating summary...'}
                      {task.summary && ' • Summary ready'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Jobs */}
      <Card className={`${teamType === 'black' ? 'bg-black-team-light border-white/20' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-lg ${teamType === 'black' ? 'text-white' : 'text-foreground'} flex items-center justify-between`}>
            <span>Research History</span>
            <div className="flex items-center gap-2">
              {isUsingApi && (
                <Badge variant="outline" className="text-xs">
                  API Connected
                </Badge>
              )}
              {completedTasks.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearOldJobs}
                  className={`gap-2 ${teamType === 'black' ? 'text-white hover:bg-white/10' : ''}`}
                >
                  <Trash2 className="h-3 w-3" />
                  Clear History
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedTasks.length === 0 ? (
            <p className={`text-center py-8 ${teamType === 'black' ? 'text-white/70' : 'text-muted-foreground'}`}>
              No completed research jobs yet. Launch your first swarm above!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className={teamType === 'black' ? 'border-white/20' : ''}>
                  <TableHead className={teamType === 'black' ? 'text-white' : ''}>Request</TableHead>
                  <TableHead className={teamType === 'black' ? 'text-white' : ''}>Status</TableHead>
                  <TableHead className={teamType === 'black' ? 'text-white' : ''}>Completed</TableHead>
                  <TableHead className={teamType === 'black' ? 'text-white' : ''}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedTasks.map((task) => (
                  <TableRow key={task.id} className={teamType === 'black' ? 'border-white/20' : ''}>
                    <TableCell className={teamType === 'black' ? 'text-white' : ''}>
                      <div>
                        <div className="font-medium">{getTaskTitle(task)}</div>
                        <div className={`text-sm ${teamType === 'black' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {getTaskDescription(task)}
                        </div>
                        {task.summary && (
                          <div className={`mt-2 text-xs p-2 rounded bg-purple-50 ${teamType === 'black' ? 'bg-purple-900/20' : ''}`}>
                            <span className={`font-medium ${teamType === 'black' ? 'text-purple-300' : 'text-purple-700'}`}>Summary:</span>
                            <span className={`ml-1 ${teamType === 'black' ? 'text-white/70' : 'text-gray-600'}`}>
                              {task.summary.substring(0, 150)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task)}
                    </TableCell>
                    <TableCell className={teamType === 'black' ? 'text-white' : ''}>
                      {format(new Date(task.createdAt), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell>
                      {task.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(task)}
                          disabled={downloadingTasks.has(task.id)}
                          className={`gap-2 ${teamType === 'black' ? 'text-white hover:bg-white/10' : ''}`}
                        >
                          {downloadingTasks.has(task.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          Download
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResearchRequestTableActive;