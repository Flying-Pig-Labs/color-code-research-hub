import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  GitBranch,
  Users,
  Github
} from 'lucide-react';

interface PlanGenerationProgressProps {
  jobId: string;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

interface JobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  completedStages: string[];
  issuesCreated: number;
  totalIssues: number;
  createdAt: string;
  updatedAt?: string;
  result?: any;
  error?: string;
}

const STAGES = [
  { id: 'Form Analysis', name: 'Analyzing Form Data', icon: FileText, color: 'text-blue-500' },
  { id: 'Phase Generation', name: 'Generating Project Phases', icon: GitBranch, color: 'text-purple-500' },
  { id: 'Epic Generation', name: 'Creating Epic Stories', icon: Users, color: 'text-green-500' },
  { id: 'Issue Formatting', name: 'Formatting GitHub Issues', icon: FileText, color: 'text-orange-500' },
  { id: 'GitHub Creation', name: 'Creating GitHub Issues', icon: Github, color: 'text-gray-700' }
];

export const PlanGenerationProgress: React.FC<PlanGenerationProgressProps> = ({
  jobId,
  onComplete,
  onError
}) => {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!jobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/plan/async/status/${jobId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }

        const status: JobStatus = await response.json();
        setJobStatus(status);

        // Calculate estimated time remaining
        const elapsed = Date.now() - startTime;
        const progressRate = status.progress / elapsed;
        const remaining = progressRate > 0 ? (100 - status.progress) / progressRate : 0;
        setEstimatedTimeRemaining(Math.max(0, remaining));

        if (status.status === 'completed') {
          clearInterval(pollInterval);
          onComplete(status.result);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          onError(status.error || 'Plan generation failed');
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, onComplete, onError, startTime]);

  const getStageStatus = (stageId: string) => {
    if (!jobStatus) return 'pending';
    
    if (jobStatus.completedStages.includes(stageId)) {
      return 'completed';
    } else if (jobStatus.stage === stageId) {
      return 'in-progress';
    }
    return 'pending';
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  if (!jobStatus) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Initializing plan generation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Plan Generation in Progress
          </CardTitle>
          <Badge variant={jobStatus.status === 'failed' ? 'destructive' : 'default'}>
            {jobStatus.status === 'processing' ? 'Processing' : jobStatus.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{jobStatus.progress}%</span>
          </div>
          <Progress value={jobStatus.progress} className="h-3" />
          {estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Estimated time remaining: {formatTime(estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Stage Progress */}
        <div className="space-y-4">
          {STAGES.map((stage, index) => {
            const status = getStageStatus(stage.id);
            const Icon = stage.icon;
            
            return (
              <div key={stage.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {status === 'completed' ? (
                    <CheckCircle2 className={`w-6 h-6 ${stage.color}`} />
                  ) : status === 'in-progress' ? (
                    <Loader2 className={`w-6 h-6 animate-spin ${stage.color}`} />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className={`font-medium ${
                        status === 'completed' ? 'text-muted-foreground' : 
                        status === 'in-progress' ? 'text-foreground' : 
                        'text-muted-foreground/50'
                      }`}>
                        {stage.name}
                      </span>
                    </div>
                    {status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {status === 'in-progress' && jobStatus.stage === 'GitHub Creation' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Creating issues: {jobStatus.issuesCreated} / {jobStatus.totalIssues}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Activity */}
        {jobStatus.status === 'processing' && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">{jobStatus.stage}</p>
                {jobStatus.stage === 'GitHub Creation' && jobStatus.totalIssues > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Created {jobStatus.issuesCreated} of {jobStatus.totalIssues} issues
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {jobStatus.status === 'failed' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Generation Failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {jobStatus.error || 'An error occurred during plan generation'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {jobStatus.status === 'completed' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Plan Generation Complete!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Successfully created {jobStatus.issuesCreated} GitHub issues
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};