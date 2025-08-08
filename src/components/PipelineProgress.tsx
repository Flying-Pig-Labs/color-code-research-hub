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

interface BackendStage {
  name: string;
  status: 'completed' | 'running' | 'pending';
  estimatedMinutes: number;
}

interface PipelineResults {
  githubRepoUrl: string | null;
  githubRepoName: string | null;
  issuesCreated: number;
  analysisResults: any | null;
}

export const PipelineProgress = ({ jobId, onComplete, onError }: PipelineProgressProps) => {
  const [stages, setStages] = useState<BackendStage[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [status, setStatus] = useState<'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'>('RUNNING');
  const [currentStage, setCurrentStage] = useState(1);
  const [stageName, setStageName] = useState('');
  const [stageProgress, setStageProgress] = useState(0);
  const [results, setResults] = useState<PipelineResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [timeEstimates, setTimeEstimates] = useState<{
    elapsedMinutes?: number;
    estimatedRemainingMinutes?: number;
    estimatedTotalMinutes?: number;
    actualDurationMinutes?: number;
  }>({});
  const [metadata, setMetadata] = useState<{
    researchDocId?: string;
    username?: string;
    startedAt?: string;
    jobId?: string;
  }>({});

  // Save jobId to localStorage for session recovery
  useEffect(() => {
    if (jobId) {
      localStorage.setItem('innovationPipelineJobId', jobId);
    }
  }, [jobId]);

  // Poll for status updates
  useEffect(() => {
    if (!isPolling || status === 'COMPLETED' || status === 'FAILED') return;

    const pollStatus = async () => {
      try {
        // Use the correct Innovation Pipeline API Gateway URL (9hv22ga3uh)
        // Fallback to main API Gateway if innovation API not configured
        const apiBase = import.meta.env.VITE_INNOVATION_API_BASE_URL || 
                       import.meta.env.VITE_API_BASE_URL || 
                       'https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod';
          
        const response = await fetch(`${apiBase}/status/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        
        // Update all state from backend response
        setStatus(data.status);
        setOverallProgress(data.overallProgress || 0);
        setCurrentStage(data.currentStage || 1);
        setStageName(data.stageName || '');
        setStageProgress(data.stageProgress || 0);
        
        // Update time estimates
        setTimeEstimates({
          elapsedMinutes: data.elapsedMinutes,
          estimatedRemainingMinutes: data.estimatedRemainingMinutes,
          estimatedTotalMinutes: data.estimatedTotalMinutes || 22,
          actualDurationMinutes: data.actualDurationMinutes
        });
        
        // Update metadata
        if (data.metadata) {
          setMetadata(data.metadata);
        }
        
        // Use backend's stages array
        if (data.stages) {
          setStages(data.stages);
        }
        
        // Update results
        if (data.results) {
          setResults(data.results);
        }
        
        // Check for completion
        if (data.status === 'COMPLETED' && data.results?.githubRepoUrl) {
          setIsPolling(false);
          localStorage.removeItem('innovationPipelineJobId');
          if (onComplete) {
            onComplete(data.results.githubRepoUrl);
          }
        } else if (data.status === 'FAILED') {
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
    if (results?.githubRepoUrl) {
      navigator.clipboard.writeText(results.githubRepoUrl);
      toast.success('Repository link copied to clipboard');
    }
  };

  const handleRetry = () => {
    // Reset state and trigger parent retry logic
    setStages([]);
    setOverallProgress(0);
    setStatus('RUNNING');
    setError(null);
    setIsPolling(true);
    // Parent should handle creating a new job
  };

  const getStageIcon = (stage: BackendStage) => {
    if (stage.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (stage.status === 'running') {
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
          {status === 'RUNNING' && 'Innovation Pipeline Running'}
          {status === 'QUEUED' && 'Pipeline Queued'}
          {status === 'COMPLETED' && 'Pipeline Complete!'}
          {status === 'FAILED' && 'Pipeline Failed'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {(status === 'RUNNING' || status === 'QUEUED') && timeEstimates.estimatedRemainingMinutes !== undefined && (
            <>Time remaining: approximately {Math.ceil(timeEstimates.estimatedRemainingMinutes)} minutes</>
          )}
          {(status === 'RUNNING' || status === 'QUEUED') && timeEstimates.estimatedRemainingMinutes === undefined && 'This process takes approximately 22 minutes'}
          {status === 'COMPLETED' && results && (
            <>Your GitHub repository is ready with {results.issuesCreated} innovation ideas!</>
          )}
          {status === 'FAILED' && error}
        </p>
        {/* Current stage details */}
        {status === 'RUNNING' && stageName && (
          <p className="text-sm font-medium text-primary mt-2">
            {stageName} ({Math.round(stageProgress)}% complete)
          </p>
        )}
        {/* Time details */}
        {(status === 'RUNNING' || status === 'QUEUED') && timeEstimates.elapsedMinutes !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Elapsed: {Math.floor(timeEstimates.elapsedMinutes)} min • 
            Total estimate: {timeEstimates.estimatedTotalMinutes || 22} min
          </p>
        )}
        {status === 'COMPLETED' && timeEstimates.actualDurationMinutes !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Completed in {Math.floor(timeEstimates.actualDurationMinutes)} minutes
          </p>
        )}
      </div>

      {/* Progress Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div
            key={`stage-${index}`}
            className={`flex items-center justify-between gap-3 p-3 rounded-lg transition-all ${
              stage.status === 'running' 
                ? 'bg-blue-50 border border-blue-200 shadow-sm animate-pulse' 
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {getStageIcon(stage)}
              <span className={`font-medium ${
                stage.status === 'completed' ? 'text-green-700' :
                stage.status === 'running' ? 'text-blue-700' :
                'text-gray-500'
              }`}>
                {stage.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {stage.estimatedMinutes} min
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
      {status === 'COMPLETED' && results?.githubRepoUrl && (
        <div className="flex gap-3 justify-center pt-4">
          <Button
            onClick={() => window.open(results.githubRepoUrl, '_blank')}
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
      {status === 'FAILED' && (
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
      {(status === 'RUNNING' || status === 'QUEUED') && (
        <div className="text-center text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3 inline mr-1" />
          You can safely close this modal - the pipeline will continue running
        </div>
      )}
    </div>
  );
};

export default PipelineProgress;