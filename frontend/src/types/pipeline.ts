/**
 * @fileoverview Pipeline progress tracking types and definitions
 * 
 * Defines the structure for tracking long-running ideation pipeline jobs
 * with client-side progress estimation based on historical timing data.
 */

export interface PipelineStage {
  id: string;
  name: string;
  icon: string;
  estimatedDuration: number; // seconds
  startMessage: string;
  progressMessages: Array<{
    percentage: number;
    message: string;
    timeOffset: number; // seconds from stage start
  }>;
  completedMessage: string;
}

export interface PipelineProgress {
  currentStage: number;
  currentStageProgress: number; // 0-100
  overallProgress: number; // 0-100
  elapsedTime: number; // seconds
  estimatedTimeRemaining: number; // seconds
  currentMessage: string;
  isComplete: boolean;
  isFailed: boolean;
}

export interface ProcessingJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'submitted';
  createdAt: string;
  title: string;
  type: 'ideation' | 'research';
  startTime?: number; // timestamp
}

// Pipeline stage definitions with granular progress tracking
export const IDEATION_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'setup',
    name: 'Initial Setup',
    icon: '🚀',
    estimatedDuration: 2, // 2 seconds - Fast
    startMessage: 'Initializing pipeline and loading secrets...',
    progressMessages: [
      {
        percentage: 50,
        message: 'Loading configuration and secrets...',
        timeOffset: 1
      }
    ],
    completedMessage: 'Starting research analysis with parallel LLM processing...'
  },
  {
    id: 'research',
    name: 'Research Analysis',
    icon: '⚡',
    estimatedDuration: 16, // 16 seconds
    startMessage: 'Research analysis in progress...',
    progressMessages: [
      {
        percentage: 25,
        message: 'LLM analysis in progress (25% complete)...',
        timeOffset: 4
      },
      {
        percentage: 75,
        message: 'Processing market intelligence...',
        timeOffset: 12
      }
    ],
    completedMessage: 'Research analysis complete, generating results...'
  },
  {
    id: 'jtbd_reddit',
    name: 'JTBD & Reddit Discovery',
    icon: '🔍',
    estimatedDuration: 215, // 3m 35s
    startMessage: 'Extracting Jobs-to-be-Done from analysis...',
    progressMessages: [
      {
        percentage: 5,
        message: 'Searching Reddit for user discussions (25 JTBDs)...',
        timeOffset: 11
      },
      {
        percentage: 40,
        message: 'Reddit processing in progress (40% complete)...',
        timeOffset: 86
      },
      {
        percentage: 85,
        message: 'Analyzing user sentiment and patterns...',
        timeOffset: 183
      }
    ],
    completedMessage: 'Reddit analysis complete, found 487 discussions...'
  },
  {
    id: 'opportunity_zones',
    name: 'Opportunity Zone Analysis',
    icon: '🧠',
    estimatedDuration: 733, // 12m 13s
    startMessage: 'Analyzing opportunity zones with AI clustering...',
    progressMessages: [
      {
        percentage: 15,
        message: 'Enriching zones with Perplexity market research...',
        timeOffset: 185
      },
      {
        percentage: 40,
        message: 'Deep market intelligence gathering in progress...',
        timeOffset: 293
      },
      {
        percentage: 75,
        message: 'Evaluating market opportunities and sizing...',
        timeOffset: 550
      }
    ],
    completedMessage: 'Opportunity zones complete, starting product ideation...'
  },
  {
    id: 'product_ideas',
    name: 'Product Idea Generation',
    icon: '💡',
    estimatedDuration: 787, // 13m 7s
    startMessage: 'Generating innovative product ideas...',
    progressMessages: [
      {
        percentage: 30,
        message: 'Evaluating product viability and scoring...',
        timeOffset: 236
      },
      {
        percentage: 70,
        message: 'Creating detailed product specifications...',
        timeOffset: 551
      },
      {
        percentage: 90,
        message: 'Finalizing product portfolio...',
        timeOffset: 708
      }
    ],
    completedMessage: 'Product portfolio ready, creating GitHub repository...'
  },
  {
    id: 'quick_consolidation',
    name: 'Quick Consolidation',
    icon: '📋',
    estimatedDuration: 1, // <1 second
    startMessage: 'Consolidating innovation portfolio...',
    progressMessages: [],
    completedMessage: 'Consolidation complete, creating GitHub repository...'
  },
  {
    id: 'github_creation',
    name: 'GitHub Repository Creation',
    icon: '🎉',
    estimatedDuration: 1565, // 26m 5s
    startMessage: 'Setting up GitHub repository...',
    progressMessages: [
      {
        percentage: 20,
        message: 'Generating comprehensive documentation...',
        timeOffset: 313
      },
      {
        percentage: 50,
        message: 'Creating GitHub issues for product ideas...',
        timeOffset: 782
      },
      {
        percentage: 80,
        message: 'Finalizing repository structure...',
        timeOffset: 1252
      }
    ],
    completedMessage: 'Pipeline complete! Repository created successfully.'
  }
];

// Total estimated duration for the full pipeline
export const TOTAL_ESTIMATED_DURATION = IDEATION_PIPELINE_STAGES.reduce(
  (total, stage) => total + stage.estimatedDuration,
  0
);