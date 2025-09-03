import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, RefreshCw, Clock, CheckCircle2, Circle, Github } from 'lucide-react';

interface PipelineJob {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'in-progress' | 'completed';
  startTime: number; // Unix timestamp when job started
  totalDurationMs: number; // Total expected duration (7 minutes = 420000ms)
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

// 7-minute research pipeline phases
const RESEARCH_PHASES: ResearchPhase[] = [
  // Phase A — Brief & Plan (0:00 - 0:45)
  { name: 'briefing', description: 'Scoping your brief', startMs: 0, endMs: 45000, displayName: 'Brief & Plan' },
  
  // Phase B — Discovery & Retrieval (0:45 - 2:30)  
  { name: 'discovery', description: 'Seeding searches', startMs: 45000, endMs: 95000, displayName: 'Discovery' },
  { name: 'retrieval', description: 'Reading top sources', startMs: 95000, endMs: 150000, displayName: 'Retrieval' },
  
  // Phase C — Reading & Extraction (2:30 - 4:00)
  { name: 'extraction', description: 'Extracting evidence', startMs: 150000, endMs: 200000, displayName: 'Extraction' },
  { name: 'validation', description: 'Cross-checking claims', startMs: 200000, endMs: 240000, displayName: 'Validation' },
  
  // Phase D — Analysis & Reasoning (4:00 - 5:15) 
  { name: 'analysis', description: 'Analyzing patterns', startMs: 240000, endMs: 315000, displayName: 'Analysis' },
  
  // Phase E & F — Drafting & Finalization (5:15 - 7:00)
  { name: 'drafting', description: 'Packaging report', startMs: 315000, endMs: 420000, displayName: 'Finalization' }
];

// Calculate current phase and progress based on elapsed time
function getCurrentPhaseInfo(startTime: number, totalDurationMs: number) {
  const now = Date.now();
  const elapsedMs = now - startTime;
  const remainingMs = Math.max(0, totalDurationMs - elapsedMs);
  
  // Find current phase
  const currentPhase = RESEARCH_PHASES.find(phase => 
    elapsedMs >= phase.startMs && elapsedMs < phase.endMs
  ) || RESEARCH_PHASES[RESEARCH_PHASES.length - 1];
  
  // Calculate overall progress percentage
  const overallProgressPercent = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
  
  // Format time remaining
  const minutesRemaining = Math.floor(remainingMs / 60000);
  const secondsRemaining = Math.floor((remainingMs % 60000) / 1000);
  const timeRemaining = `${minutesRemaining}m ${secondsRemaining}s`;
  
  // Format elapsed time
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
  const elapsedTime = `${elapsedMinutes}m ${elapsedSeconds}s`;
  
  // Create stage statuses based on current progress
  const stages = RESEARCH_PHASES.map(phase => ({
    id: phase.startMs,
    name: phase.displayName,
    description: phase.description,
    status: elapsedMs > phase.endMs ? 'completed' as const :
            elapsedMs >= phase.startMs ? 'in-progress' as const : 
            'pending' as const,
    icon: undefined
  }));
  
  return {
    currentPhase,
    overallProgressPercent,
    timeRemaining,
    elapsedTime,
    stages,
    isComplete: elapsedMs >= totalDurationMs
  };
}

// Mock data - starts 1 minute ago for demo
const mockPipelineJob: PipelineJob = {
  id: 'pipeline-123',
  title: 'Market Opportunity Discovery',
  type: 'innovation',
  status: 'in-progress',
  startTime: Date.now() - (60 * 1000), // Started 1 minute ago
  totalDurationMs: 7 * 60 * 1000 // 7 minutes
};

export function PipelineTracker() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    // Simulate having an active job
    setPipelineJobs([mockPipelineJob]);
  }, []);

  // Update current time every second for live countdown
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      // TODO: Also fetch pipeline status from API here
    }, 1000);
    
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
                
                {pipelineJobs.map((job) => {
                  const phaseInfo = getCurrentPhaseInfo(job.startTime, job.totalDurationMs);
                  
                  return (
                    <div key={job.id} className="space-y-4">
                      {/* Job Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-stone-400 text-sm">Pipeline in progress</span>
                          </div>
                          <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
                            {phaseInfo.overallProgressPercent}%
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>Estimated time remaining: {phaseInfo.timeRemaining}</span>
                          </div>
                          <div>Elapsed: {phaseInfo.elapsedTime}</div>
                        </div>
                      </div>

                      {/* Job Title */}
                      <h5 className="text-xl font-semibold text-slate-100 mb-4">{job.title}</h5>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-2 mb-6">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${phaseInfo.overallProgressPercent}%` }}
                        />
                      </div>

                      {/* Pipeline Stages */}
                      <div className="grid grid-cols-7 gap-4 mb-6">
                        {phaseInfo.stages.map((stage, index) => (
                          <div key={stage.id} className="text-center">
                            <div className={`
                              w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 transition-all
                              ${stage.status === 'completed' 
                                ? 'bg-amber-500/20 text-amber-400' 
                                : stage.status === 'in-progress'
                                ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/50'
                                : 'bg-slate-800 text-slate-500'
                              }
                            `}>
                              {getStageIcon(stage)}
                            </div>
                            <div className="text-xs font-medium text-slate-300 mb-1">
                              {stage.name}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Current Activity */}
                      {phaseInfo.currentPhase && (
                        <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-amber-500">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-slate-200">
                              {phaseInfo.currentPhase.displayName}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400">
                            {phaseInfo.currentPhase.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}