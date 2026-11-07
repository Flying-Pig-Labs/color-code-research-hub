import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/services/v2/api';

interface JobStatus {
  jobId: string;
  jobName?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt?: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: any;
}

const MilestonesJobRunner = () => {
  const { repo, jobId } = useParams<{ repo: string; jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timer | null>(null);

  // Poll job status
  const fetchJobStatus = async () => {
    try {
      const data = await apiFetch(`/api/plan/async/status/${jobId}`);
      setJobStatus(data);
      
      
      // If job succeeded, navigate to complete screen
      if (data.status === 'COMPLETED') {
        setIsPolling(false);
        navigate(`/milestones/${repo}/${jobId}/complete`, { 
          state: { results: data.result } 
        });
      } else if (data.status === 'FAILED') {
        setIsPolling(false);
        toast({
          title: "Job Failed",
          description: data.error || "The job failed to complete.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching job status:', error);
      // If unauthorized, stop polling and surface a helpful toast
      if (String(error?.message || '').includes('401')) {
        setIsPolling(false);
        toast({
          title: 'Session expired',
          description: 'Please reauthenticate to continue tracking the job.',
          variant: 'destructive',
        });
      }
    }
  };


  // Start polling on mount
  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJobStatus();

    // Set up polling interval
    pollIntervalRef.current = setInterval(fetchJobStatus, 5000); // Every 5 seconds

    // Cleanup
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobId]);

  // Stop polling when not needed
  useEffect(() => {
    if (!isPolling) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  }, [isPolling]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-green-500';
      case 'FAILED':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header with animation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Generating Backlog</CardTitle>
              <p className="text-muted-foreground mt-1">
                Repository: <span className="font-mono">{`mvp-builder-app/${repo}`}</span>
              </p>
            </div>
            <Badge className={`${getStatusColor(jobStatus?.status || 'PENDING')} text-white`}>
              {jobStatus?.status || 'INITIALIZING'}
            </Badge>
          </div>
        </CardHeader>
      </Card>


      {/* Job metadata */}
      {jobStatus && (
        <Card>
          <CardContent className="pt-6">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Job ID</dt>
                <dd className="font-mono">{jobStatus.jobId}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Started</dt>
                <dd>{jobStatus.startedAt ? new Date(jobStatus.startedAt).toLocaleTimeString() : 'Pending'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MilestonesJobRunner;
