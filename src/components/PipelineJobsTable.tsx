import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Clock,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PipelineJob {
  jobId: string;
  researchId: string;
  username?: string;
  startTime: string;
  endTime?: string;
  status: 'SUBMITTED' | 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  currentStage?: string;
  overallProgress?: number;
  elapsedMinutes?: number;
  githubRepoUrl?: string;
  issuesCreated?: number;
  error?: string;
}

export const PipelineJobsTable = () => {
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch running jobs from API
  const fetchJobs = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 
                     'https://zi612qxxv0.execute-api.us-east-1.amazonaws.com/production';
      
      const response = await fetch(`${apiBase}/api/status/running`);
      
      if (!response.ok) {
        // If endpoint doesn't exist yet, show empty state
        if (response.status === 404) {
          setJobs([]);
          return;
        }
        throw new Error('Failed to fetch pipeline jobs');
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching pipeline jobs:', error);
      // Don't show error toast on initial load if API doesn't exist yet
      if (!loading) {
        toast.error('Failed to load pipeline jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh a specific job
  const refreshJob = async (jobId: string) => {
    setRefreshing(jobId);
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 
                     'https://zi612qxxv0.execute-api.us-east-1.amazonaws.com/production';
      
      const response = await fetch(`${apiBase}/api/plan/async/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to refresh job');
      }
      
      const data = await response.json();
      
      // Update the job in our local state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.jobId === jobId 
            ? {
                ...job,
                status: data.status,
                currentStage: data.currentStage,
                overallProgress: data.overallProgress,
                elapsedMinutes: data.elapsedMinutes,
                endTime: data.endTime,
                githubRepoUrl: data.results?.githubRepository?.url,
                issuesCreated: data.results?.githubRepository?.issuesCreated,
                error: data.error
              }
            : job
        )
      );
      
      toast.success('Job status refreshed');
    } catch (error) {
      console.error('Error refreshing job:', error);
      toast.error('Failed to refresh job status');
    } finally {
      setRefreshing(null);
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, []);

  // Auto-refresh every 10 seconds for running jobs
  useEffect(() => {
    if (!autoRefresh) return;
    
    const hasRunningJobs = jobs.some(job => 
      job.status === 'RUNNING' || job.status === 'PENDING' || job.status === 'SUBMITTED'
    );
    
    if (hasRunningJobs) {
      const interval = setInterval(fetchJobs, 10000);
      return () => clearInterval(interval);
    }
  }, [jobs, autoRefresh]);

  // Get status badge variant and icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return {
          variant: 'success' as const,
          icon: <CheckCircle2 className="h-3 w-3" />,
          label: 'Completed'
        };
      case 'RUNNING':
        return {
          variant: 'default' as const,
          icon: <PlayCircle className="h-3 w-3" />,
          label: 'Running'
        };
      case 'PENDING':
      case 'SUBMITTED':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          label: 'Queued'
        };
      case 'FAILED':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
          label: 'Failed'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3" />,
          label: status
        };
    }
  };

  // Format duration
  const formatDuration = (startTime: string, endTime?: string) => {
    if (endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const minutes = Math.round((end - start) / 60000);
      return `${minutes} min`;
    }
    
    try {
      return formatDistanceToNow(new Date(startTime), { addSuffix: false });
    } catch {
      return 'Running...';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Innovation Pipeline Jobs</h3>
        </div>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Innovation Pipeline Jobs</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="text-center p-8 text-muted-foreground border rounded-lg">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">No active pipeline jobs</p>
          <p className="text-sm mt-2">Start a pipeline by clicking the IDEATE button on a research report</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Innovation Pipeline Jobs</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Research ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Stage</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>GitHub Repo</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const statusBadge = getStatusBadge(job.status);
              
              return (
                <TableRow key={job.jobId}>
                  <TableCell className="font-mono text-sm">
                    {job.researchId.length > 20 
                      ? `${job.researchId.slice(0, 20)}...` 
                      : job.researchId}
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={statusBadge.variant} className="gap-1">
                      {statusBadge.icon}
                      {statusBadge.label}
                    </Badge>
                    {job.status === 'RUNNING' && job.overallProgress !== undefined && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {job.overallProgress}%
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {job.currentStage || '-'}
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {new Date(job.startTime).toLocaleString()}
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {formatDuration(job.startTime, job.endTime)}
                  </TableCell>
                  
                  <TableCell>
                    {job.githubRepoUrl ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="gap-1 p-0 h-auto"
                          onClick={() => window.open(job.githubRepoUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Button>
                        {job.issuesCreated && (
                          <span className="text-xs text-muted-foreground">
                            ({job.issuesCreated} issues)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refreshJob(job.jobId)}
                      disabled={refreshing === job.jobId}
                      className="gap-1"
                    >
                      {refreshing === job.jobId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Refresh
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-green-500 rounded-full" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Running</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-gray-400 rounded-full" />
          <span>Queued</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-red-500 rounded-full" />
          <span>Failed</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineJobsTable;