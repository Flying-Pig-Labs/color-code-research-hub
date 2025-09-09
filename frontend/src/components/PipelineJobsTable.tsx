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
import { v2Api } from '@/services/v2/api';
import type { Report } from '@/services/v2/api';
import { ProgressTracker } from './ProgressTracker';
import { ProcessingJob } from '../types/pipeline';

interface PipelineJob {
  jobId: string;
  researchId: string;
  username?: string;
  objective?: string; // Research objective/target from the original research report
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
  const [researchReports, setResearchReports] = useState<Report[]>([]);

  // Fetch research reports to get objectives
  const fetchResearchReports = async () => {
    try {
      const reports = await v2Api.listReports(); // Get all recent reports
      setResearchReports(reports);
    } catch (error) {
      console.error('Error fetching research reports:', error);
    }
  };

  // Fetch all jobs (running and completed) from v2 API (PipelineBatchJobs)
  const fetchJobs = async () => {
    try {
      const list = await v2Api.listPipelineJobs();
      const newJobs = Array.isArray(list) ? list : [];
      setJobs(prevJobs => newJobs.map((nj: any) => {
        const existing = prevJobs.find(j => j.jobId === nj.jobId);
        const matchingReport = researchReports.find(r => r.reportId === (nj.researchId || nj.jobId));
        const objective = matchingReport?.objective || existing?.objective;
        return {
          jobId: nj.jobId,
          researchId: nj.researchId || nj.jobId,
          username: nj.username,
          objective,
          startTime: nj.startTime || nj.created_at || nj.createdAt,
          endTime: nj.endTime,
          status: (nj.status || 'SUCCEEDED') as PipelineJob['status'],
          currentStage: nj.currentStage,
          overallProgress: nj.overallProgress,
          elapsedMinutes: nj.elapsedMinutes,
          githubRepoUrl: nj.githubRepoUrl,
          issuesCreated: nj.issuesCreated,
          error: nj.error,
        } as PipelineJob;
      }));
    } catch (error) {
      console.error('Error fetching pipeline jobs:', error);
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
      await fetchResearchReports();
      await fetchJobs();
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
    // Fetch research reports first, then jobs
    fetchResearchReports().then(() => {
      fetchJobs();
    });
  }, []);

  // Auto-refresh every 10 seconds for running jobs
  useEffect(() => {
    if (!autoRefresh) return;
    
    const hasRunningJobs = jobs.some(job => 
      job.status === 'RUNNING' || job.status === 'PENDING' || job.status === 'SUBMITTED'
    );
    
    if (hasRunningJobs) {
      const interval = setInterval(() => {
        fetchResearchReports().then(() => {
          fetchJobs();
        });
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [jobs, autoRefresh, researchReports]);

  // Get status badge variant and icon - show actual AWS Batch status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return {
          variant: 'success' as const,
          icon: <CheckCircle2 className="h-3 w-3" />,
          label: 'SUCCEEDED',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'RUNNING':
        return {
          variant: 'default' as const,
          icon: <PlayCircle className="h-3 w-3" />,
          label: 'RUNNING',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'PENDING':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          label: 'PENDING',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'SUBMITTED':
        return {
          variant: 'secondary' as const,
          icon: <Clock className="h-3 w-3" />,
          label: 'SUBMITTED',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      case 'RUNNABLE':
        return {
          variant: 'secondary' as const,
          icon: <AlertCircle className="h-3 w-3" />,
          label: 'RUNNABLE',
          className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        };
      case 'STARTING':
        return {
          variant: 'default' as const,
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          label: 'STARTING',
          className: 'bg-cyan-100 text-cyan-800 border-cyan-200'
        };
      case 'FAILED':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />,
          label: 'FAILED',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: <Clock className="h-3 w-3" />,
          label: status,
          className: 'bg-gray-50 text-gray-600 border-gray-200'
        };
    }
  };

  // Format duration - only show for completed jobs
  const formatDuration = (startTime: string, endTime?: string, status: string) => {
    // Only show duration for completed jobs (succeeded or failed)
    if (status !== 'SUCCEEDED' && status !== 'FAILED') {
      return '-';
    }
    
    if (endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      const minutes = Math.round((end - start) / 60000);
      return `${minutes} min`;
    }
    
    // If status is completed but no endTime, something is wrong
    return '-';
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
            onClick={() => {
              fetchResearchReports().then(() => {
                fetchJobs();
              });
            }}
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

  // Convert PipelineJob to ProcessingJob for progress tracker
  const toProcessingJob = (job: PipelineJob): ProcessingJob => {
    // Map AWS Batch statuses to progress tracker statuses
    let status: 'pending' | 'processing' | 'completed' | 'failed' | 'submitted';
    switch (job.status) {
      case 'SUBMITTED':
        status = 'submitted';
        break;
      case 'PENDING':
        status = 'pending';
        break;
      case 'RUNNING':
      case 'STARTING':
        status = 'processing';
        break;
      case 'SUCCEEDED':
        status = 'completed';
        break;
      case 'FAILED':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }
    
    return {
      jobId: job.jobId,
      status,
      createdAt: job.startTime,
      title: job.objective || 'Pipeline Job',
      type: 'ideation',
      startTime: new Date(job.startTime).getTime()
    };
  };

  // Filter jobs for different sections
  const activeJobs = jobs.filter(job => 
    ['SUBMITTED', 'PENDING', 'RUNNING', 'STARTING'].includes(job.status)
  );
  const completedJobs = jobs.filter(job => 
    ['SUCCEEDED', 'FAILED'].includes(job.status)
  );

  return (
    <div className="space-y-6">
      {/* Active Jobs with Enhanced Progress Display */}
      {activeJobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Pipeline Jobs</h3>
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
            </div>
          </div>
          
          {/* Enhanced Progress Cards */}
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <ProgressTracker
                key={job.jobId}
                job={toProcessingJob(job)}
                onComplete={(jobId) => {
                  toast.success('Pipeline job completed!');
                  fetchJobs();
                }}
                onFailed={(jobId) => {
                  toast.error('Pipeline job failed.');
                  fetchJobs();
                }}
                className="w-full"
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs Table */}
      {completedJobs.length > 0 && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {activeJobs.length > 0 ? 'Completed Pipeline Jobs' : 'Innovation Pipeline Jobs'}
            </h3>
            <div className="flex items-center gap-2">
              {activeJobs.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchResearchReports().then(() => {
                    fetchJobs();
                  });
                }}
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
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Stage</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>GitHub Repo</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedJobs.map((job) => {
              const statusBadge = getStatusBadge(job.status);
              
              return (
                <TableRow key={job.jobId}>
                  <TableCell className="font-mono text-sm">
                    {job.researchId.length > 20 
                      ? `${job.researchId.slice(0, 20)}...` 
                      : job.researchId}
                  </TableCell>
                  
                  <TableCell className="text-sm" title={job.objective}>
                    {job.objective ? (
                      job.objective.length > 40 
                        ? `${job.objective.slice(0, 40)}...` 
                        : job.objective
                    ) : '-'}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={statusBadge.variant} 
                      className={`gap-1 ${statusBadge.className}`}
                    >
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
                    {formatDistanceToNow(new Date(job.startTime), { addSuffix: true })}
                  </TableCell>
                  
                  <TableCell className="text-sm">
                    {formatDuration(job.startTime, job.endTime, job.status)}
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
        </div>
      )}

      {/* Show empty state if no jobs at all */}
      {activeJobs.length === 0 && completedJobs.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Innovation Pipeline Jobs</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchResearchReports().then(() => {
                  fetchJobs();
                });
              }}
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
      )}

      {/* Status indicators */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-green-500 rounded-full" />
          <span>SUCCEEDED</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
          <span>RUNNING</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-cyan-500 rounded-full" />
          <span>STARTING</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-indigo-500 rounded-full" />
          <span>RUNNABLE</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-yellow-500 rounded-full" />
          <span>PENDING</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-gray-400 rounded-full" />
          <span>SUBMITTED</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-red-500 rounded-full" />
          <span>FAILED</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineJobsTable;
