import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, RefreshCw, Clock, CheckCircle2, Circle } from 'lucide-react';
import { v2Api } from '@/services/v2/api';

interface PipelineJob {
  id: string;
  title: string;
  type: string;
  status: 'SUBMITTED' | 'PENDING' | 'RUNNING' | 'STARTING' | 'SUCCEEDED' | 'FAILED';
  startTime?: number;
  endTime?: number;
  overallProgress?: number;
}

interface ResearchPhase {
  name: string;
  description: string;
  startMs: number; // When this phase starts (0-420000ms)
  endMs: number;   // When this phase ends
  displayName: string;
}

interface PipelineStage {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  icon?: React.ComponentType<any>;
}

// No simulated phases/timers: render only actual running jobs

export function PipelineTracker() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const fetchPipelineJobs = async () => {
    try {
      const list = await v2Api.listPipelineJobs();
      const arr: any[] = Array.isArray(list) ? list : [];
      const active = arr.filter(j => ['SUBMITTED','PENDING','RUNNING','STARTING'].includes(j.status));
      const jobs: PipelineJob[] = active.map(j => ({
        id: j.jobId,
        title: j.objective || 'Ideation Pipeline',
        type: 'ideation',
        status: j.status,
        startTime: j.startTime ? new Date(j.startTime).getTime() : undefined,
        endTime: j.endTime ? new Date(j.endTime).getTime() : undefined,
        overallProgress: j.overallProgress,
      }));
      setPipelineJobs(jobs);
    } catch (err) {
      console.error('Failed to load pipeline jobs:', err);
      setPipelineJobs([]);
    }
  };

  useEffect(() => {
    fetchPipelineJobs();
  }, []);

  // Update current time every second and refresh jobs when auto-refresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      fetchPipelineJobs();
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (pipelineJobs.length === 0) {
    return null; // Don't show if no active pipelines
  }

  const getStageIcon = (stage: PipelineStage) => {
    if (stage.icon) {
      const Icon = stage.icon;
      return <Icon className="h-4 w-4" />;
    }
    
    switch (stage.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-amber-500" />;
      case 'in-progress':
        return <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />;
      case 'pending':
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStageTextColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-amber-700 dark:text-amber-400';
      case 'in-progress':
        return 'text-amber-700 dark:text-amber-400 font-medium';
      case 'pending':
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-6">
        <Card className="bg-black border-stone-800 text-white">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Circle className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-stone-100">
                  track running ideation processes and outputs
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    autoRefresh 
                      ? 'bg-stone-800 text-stone-100' 
                      : 'bg-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span>Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:bg-stone-800 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-stone-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-stone-400" />
                  )}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4">
                <h4 className="text-lg font-semibold text-stone-100 mb-4">Active Pipeline Jobs</h4>
                {pipelineJobs.map((job) => (
                  <div key={job.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${job.status === 'RUNNING' || job.status === 'STARTING' ? 'bg-amber-500 animate-pulse' : 'bg-amber-300'}`} />
                        <span className="text-stone-300 text-sm">{job.status}</span>
                        {typeof job.overallProgress === 'number' && (
                          <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
                            {Math.round(job.overallProgress)}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {job.startTime ? `Started ${new Date(job.startTime).toLocaleTimeString()}` : ''}
                      </div>
                    </div>
                    <h5 className="text-xl font-semibold text-slate-100">{job.title}</h5>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${typeof job.overallProgress === 'number' ? Math.min(100, Math.max(0, job.overallProgress)) : 5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
