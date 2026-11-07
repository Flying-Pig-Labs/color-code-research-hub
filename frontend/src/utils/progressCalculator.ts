/**
 * @fileoverview Progress calculation utilities for pipeline tracking
 * 
 * Provides client-side progress estimation based on elapsed time
 * and predefined stage timing data.
 */

import { 
  PipelineStage, 
  PipelineProgress, 
  IDEATION_PIPELINE_STAGES, 
  TOTAL_ESTIMATED_DURATION 
} from '../types/pipeline';

/**
 * Calculate current pipeline progress based on elapsed time
 */
export function calculatePipelineProgress(
  startTime: number,
  currentTime: number = Date.now()
): PipelineProgress {
  const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
  
  // Handle edge case - if somehow we're before start time
  if (elapsedSeconds <= 0) {
    return {
      currentStage: 0,
      currentStageProgress: 0,
      overallProgress: 0,
      elapsedTime: 0,
      estimatedTimeRemaining: TOTAL_ESTIMATED_DURATION,
      currentMessage: IDEATION_PIPELINE_STAGES[0].startMessage,
      isComplete: false,
      isFailed: false
    };
  }

  // Find current stage based on cumulative timing
  let cumulativeTime = 0;
  let currentStageIndex = 0;
  let timeInCurrentStage = elapsedSeconds;

  for (let i = 0; i < IDEATION_PIPELINE_STAGES.length; i++) {
    const stage = IDEATION_PIPELINE_STAGES[i];
    
    if (elapsedSeconds <= cumulativeTime + stage.estimatedDuration) {
      currentStageIndex = i;
      timeInCurrentStage = elapsedSeconds - cumulativeTime;
      break;
    }
    
    cumulativeTime += stage.estimatedDuration;
  }

  // If we've exceeded all stages, we're in the final stage
  if (elapsedSeconds > TOTAL_ESTIMATED_DURATION) {
    currentStageIndex = IDEATION_PIPELINE_STAGES.length - 1;
    timeInCurrentStage = IDEATION_PIPELINE_STAGES[currentStageIndex].estimatedDuration;
  }

  const currentStage = IDEATION_PIPELINE_STAGES[currentStageIndex];
  
  // Calculate progress within current stage
  const currentStageProgress = Math.min(
    100,
    (timeInCurrentStage / currentStage.estimatedDuration) * 100
  );

  // Calculate overall progress
  const completedStagesTime = IDEATION_PIPELINE_STAGES
    .slice(0, currentStageIndex)
    .reduce((total, stage) => total + stage.estimatedDuration, 0);
  
  const overallProgress = Math.min(
    100,
    ((completedStagesTime + timeInCurrentStage) / TOTAL_ESTIMATED_DURATION) * 100
  );

  // Get appropriate message for current stage and progress
  const currentMessage = getCurrentStageMessage(currentStage, timeInCurrentStage, currentStageProgress);

  // Calculate estimated time remaining
  const remainingTime = Math.max(0, TOTAL_ESTIMATED_DURATION - elapsedSeconds);

  return {
    currentStage: currentStageIndex,
    currentStageProgress: Math.round(currentStageProgress),
    overallProgress: Math.round(overallProgress),
    elapsedTime: elapsedSeconds,
    estimatedTimeRemaining: remainingTime,
    currentMessage,
    isComplete: overallProgress >= 100,
    isFailed: false // This would be set by external status checks
  };
}

/**
 * Get the appropriate message for the current stage and progress
 */
function getCurrentStageMessage(
  stage: PipelineStage, 
  timeInStage: number, 
  stageProgress: number
): string {
  // If we're just starting the stage
  if (stageProgress < 5) {
    return stage.startMessage;
  }

  // Check if we have a progress message that matches our current time/progress
  for (const progressMsg of stage.progressMessages) {
    if (
      timeInStage >= progressMsg.timeOffset && 
      stageProgress >= progressMsg.percentage - 10 && // Give some flexibility
      stageProgress <= progressMsg.percentage + 20
    ) {
      return progressMsg.message;
    }
  }

  // If we're near the end of the stage
  if (stageProgress >= 90) {
    return stage.completedMessage;
  }

  // Fallback to a generic progress message
  return `${stage.icon} ${stage.name} in progress...`;
}

/**
 * Format seconds into human-readable time
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Format elapsed time into human-readable format
 */
export function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}