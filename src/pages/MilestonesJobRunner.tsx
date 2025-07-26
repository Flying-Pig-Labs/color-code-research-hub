import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Player } from '@lottiefiles/react-lottie-player';

interface JobStatus {
  jobId: string;
  jobName: string;
  status: 'SUBMITTED' | 'PENDING' | 'RUNNABLE' | 'STARTING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  createdAt?: number;
  startedAt?: number;
  stoppedAt?: number;
  failureReason?: string;
  results?: any;
}

const MilestonesJobRunner = () => {
  const { repo, jobId } = useParams<{ repo: string; jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<string[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timer | null>(null);
  const logPollIntervalRef = useRef<NodeJS.Timer | null>(null);

  // Poll job status
  const fetchJobStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/job/${jobId}/status`);
      if (!response.ok) throw new Error('Failed to fetch job status');
      
      const data = await response.json();
      setJobStatus(data);
      
      // If job succeeded, navigate to complete screen
      if (data.status === 'SUCCEEDED') {
        setIsPolling(false);
        navigate(`/milestones/${repo}/${jobId}/complete`, { 
          state: { results: data.results } 
        });
      } else if (data.status === 'FAILED') {
        setIsPolling(false);
        toast({
          title: "Job Failed",
          description: data.failureReason || "The job failed to complete.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching job status:', error);
    }
  };

  // Poll logs
  const fetchLogs = async () => {
    try {
      const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/api/job/${jobId}/logs`);
      if (nextToken) {
        url.searchParams.append('nextToken', nextToken);
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      
      if (data.logs && data.logs.length > 0) {
        setLogs(prev => [...prev, ...data.logs]);
        setNextToken(data.nextToken);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  // Start polling on mount
  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJobStatus();
    fetchLogs();

    // Set up polling intervals
    pollIntervalRef.current = setInterval(fetchJobStatus, 5000); // Every 5 seconds
    logPollIntervalRef.current = setInterval(fetchLogs, 2000); // Every 2 seconds

    // Cleanup
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (logPollIntervalRef.current) clearInterval(logPollIntervalRef.current);
    };
  }, [jobId]);

  // Stop polling when not needed
  useEffect(() => {
    if (!isPolling) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (logPollIntervalRef.current) clearInterval(logPollIntervalRef.current);
    }
  }, [isPolling]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-500';
      case 'SUCCEEDED':
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
        <CardContent>
          <div className="flex justify-center py-8">
            <Player
              autoplay
              loop
              src="https://lottie.host/9ddaa4a9-ca67-4b45-a1c2-1fcab08d2f34/IelF0Z8xJl.json"
              style={{ height: '200px', width: '200px' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Terminal logs */}
      <Card className="bg-gray-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-green-400" />
            <CardTitle className="text-green-400 text-lg">Job Logs</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] w-full" ref={scrollAreaRef}>
            <div className="p-4 font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">Waiting for logs...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-gray-300 leading-relaxed">
                    {log}
                  </div>
                ))
              )}
              {isPolling && logs.length > 0 && (
                <div className="text-green-400 animate-pulse mt-2">
                  <span className="inline-block">▊</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
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