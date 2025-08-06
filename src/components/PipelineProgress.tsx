import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, AlertCircle, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PipelineProgressProps {
  jobId: string;
  onComplete?: (repoUrl: string) => void;
  onError?: (error: string) => void;
}

interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  backendStages: number[];
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'research', name: 'Research', status: 'pending', backendStages: [1, 2] },
  { id: 'analysis', name: 'Analysis', status: 'pending', backendStages: [3] },
  { id: 'ideation', name: 'Ideation', status: 'pending', backendStages: [4, 5] },
  { id: 'validation', name: 'Validation', status: 'pending', backendStages: [6] },
  { id: 'documentation', name: 'Documentation', status: 'pending', backendStages: [7] }
];

export const PipelineProgress = ({ jobId, onComplete, onError }: PipelineProgressProps) => {
  const [stages, setStages] = useState<PipelineStage[]>(PIPELINE_STAGES);
  const [overallProgress, setOverallProgress] = useState(0);
  const [status, setStatus] = useState<'running' | 'completed' | 'failed'>('running');
  const [githubRepoUrl, setGithubRepoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [timeEstimates, setTimeEstimates] = useState<{
    elapsedMinutes?: number;
    estimatedRemainingMinutes?: number;
    estimatedTotalMinutes?: number;
  }>({});
  const [metadata, setMetadata] = useState<{
    researchDocId?: string;
    username?: string;
    startedAt?: string;
  }>({});

  // Save jobId to localStorage for session recovery
  useEffect(() => {
    if (jobId) {
      localStorage.setItem('innovationPipelineJobId', jobId);
    }
  }, [jobId]);

  // Poll for status updates
  useEffect(() => {
    if (!isPolling || status !== 'running') return;

    const pollStatus = async () => {
      try {
        // Force use of new API Gateway for innovation pipeline in production
        const apiBase = window.location.hostname === 'oceanstudio.io' 
          ? 'https://nke1jc944d.execute-api.us-east-1.amazonaws.com/production'
          : (import.meta.env.VITE_INNOVATION_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://nke1jc944d.execute-api.us-east-1.amazonaws.com/production');
          
        const response = await fetch(`${apiBase}/status/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        
        // Update overall progress
        setOverallProgress(data.overallProgress || 0);
        
        // Update time estimates
        if (data.timeEstimates) {
          setTimeEstimates(data.timeEstimates);
        }
        
        // Update metadata
        if (data.metadata) {
          setMetadata(data.metadata);
        }
        
        // Update stage statuses based on current stage
        const currentStage = data.currentStage || 1;
        const updatedStages = PIPELINE_STAGES.map(stage => {
          const maxBackendStage = Math.max(...stage.backendStages);
          const minBackendStage = Math.min(...stage.backendStages);
          
          if (currentStage > maxBackendStage) {
            return { ...stage, status: 'completed' as const };
          } else if (currentStage >= minBackendStage && currentStage <= maxBackendStage) {
            return { ...stage, status: 'active' as const };
          } else {
            return { ...stage, status: 'pending' as const };
          }
        });
        
        setStages(updatedStages);
        
        // Check for completion
        if (data.status === 'completed' && data.githubRepoUrl) {
          setStatus('completed');
          setGithubRepoUrl(data.githubRepoUrl);
          setIsPolling(false);
          localStorage.removeItem('innovationPipelineJobId');
          if (onComplete) {
            onComplete(data.githubRepoUrl);
          }
        } else if (data.status === 'failed' || data.status === 'error') {
          setStatus('failed');
          setError(data.error || 'Pipeline failed');
          setIsPolling(false);
          localStorage.removeItem('innovationPipelineJobId');
          if (onError) {
            onError(data.error || 'Pipeline failed');
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
        // Don't stop polling on temporary errors
      }
    };

    // Poll immediately
    pollStatus();

    // Set up interval for polling every 3 seconds
    const interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [jobId, isPolling, status, onComplete, onError]);

  const handleCopyLink = () => {
    if (githubRepoUrl) {
      navigator.clipboard.writeText(githubRepoUrl);
      toast.success('Repository link copied to clipboard');
    }
  };

  const handleRetry = () => {
    // Reset state and trigger parent retry logic
    setStages(PIPELINE_STAGES);
    setOverallProgress(0);
    setStatus('running');
    setError(null);
    setIsPolling(true);
    // Parent should handle creating a new job
  };

  const getStageIcon = (stage: PipelineStage) => {
    if (stage.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (stage.status === 'active') {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {status === 'running' && 'Innovation Pipeline Running'}
          {status === 'completed' && 'Pipeline Complete!'}
          {status === 'failed' && 'Pipeline Failed'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {status === 'running' && timeEstimates.estimatedRemainingMinutes !== undefined && (
            <>Time remaining: approximately {Math.ceil(timeEstimates.estimatedRemainingMinutes)} minutes</>
          )}
          {status === 'running' && timeEstimates.estimatedRemainingMinutes === undefined && 'This process takes approximately 22 minutes'}
          {status === 'completed' && 'Your GitHub repository is ready'}
          {status === 'failed' && error}
        </p>
        {/* Time details for running jobs */}
        {status === 'running' && timeEstimates.elapsedMinutes !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Elapsed: {Math.floor(timeEstimates.elapsedMinutes)} min • 
            Total estimate: {timeEstimates.estimatedTotalMinutes || 22} min
          </p>
        )}
      </div>

      {/* Progress Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              stage.status === 'active' 
                ? 'bg-blue-50 border border-blue-200 shadow-sm animate-pulse' 
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {getStageIcon(stage)}
            <span className={`font-medium ${
              stage.status === 'completed' ? 'text-green-700' :
              stage.status === 'active' ? 'text-blue-700' :
              'text-gray-500'
            }`}>
              {stage.name}
            </span>
          </div>
        ))}
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Overall Progress</span>
          <span>{Math.round(overallProgress)}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Completion Actions */}
      {status === 'completed' && githubRepoUrl && (
        <div className="flex gap-3 justify-center pt-4">
          <Button
            onClick={() => window.open(githubRepoUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Repository
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Link
          </Button>
        </div>
      )}

      {/* Error Actions */}
      {status === 'failed' && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleRetry}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Pipeline
          </Button>
        </div>
      )}

      {/* Status Info */}
      {status === 'running' && (
        <div className="text-center text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          You can safely close this modal - the pipeline will continue running
        </div>
      )}
    </div>
  );
};

export default PipelineProgress;