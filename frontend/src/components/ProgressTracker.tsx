/**
 * @fileoverview Progress tracker component for pipeline jobs
 * 
 * Displays real-time progress for long-running ideation pipeline jobs
 * with stage indicators, progress bars, and time estimates.
 */

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ProcessingJob } from '../types/pipeline';
import { 
  calculatePipelineProgress, 
  formatTimeRemaining, 
  formatElapsedTime 
} from '../utils/progressCalculator';
import { IDEATION_PIPELINE_STAGES } from '../types/pipeline';

interface ProgressTrackerProps {
  job: ProcessingJob;
  onComplete?: (jobId: string) => void;
  onFailed?: (jobId: string) => void;
  className?: string;
}

export function ProgressTracker({ 
  job, 
  onComplete, 
  onFailed, 
  className = '' 
}: ProgressTrackerProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle job status changes
  useEffect(() => {
    if (job.status === 'completed' && onComplete) {
      onComplete(job.jobId);
    } else if (job.status === 'failed' && onFailed) {
      onFailed(job.jobId);
    }
  }, [job.status, job.jobId, onComplete, onFailed]);

  // Don't render if job is not processing
  if (job.status !== 'processing') {
    return null;
  }

  const startTime = job.startTime || new Date(job.createdAt).getTime();
  const progress = calculatePipelineProgress(startTime, currentTime);

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800 ${className}`}>
      <div className="p-4">
        {/* Header with credit notice */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Credit reserved - Generation in progress
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(progress.overallProgress)}%
          </div>
        </div>

        {/* Job title */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {job.title}
          </h4>
        </div>

        {/* Overall progress bar */}
        <div className="mb-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Time information */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Estimated time remaining: {formatTimeRemaining(progress.estimatedTimeRemaining)}</span>
          </div>
          <div>
            Elapsed: {formatElapsedTime(progress.elapsedTime)}
          </div>
        </div>

        {/* Stage indicators */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {IDEATION_PIPELINE_STAGES.map((stage, index) => (
              <div key={stage.id} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    index < progress.currentStage
                      ? 'bg-green-500 text-white' // Completed
                      : index === progress.currentStage
                        ? 'bg-blue-500 text-white' // Current
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500' // Upcoming
                  }`}
                >
                  {index < progress.currentStage ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : index === progress.currentStage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`text-xs mt-1 text-center ${
                  index === progress.currentStage 
                    ? 'text-blue-700 dark:text-blue-300 font-medium' 
                    : 'text-gray-500'
                }`}>
                  {stage.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current status message */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <div className="text-lg">
              {IDEATION_PIPELINE_STAGES[progress.currentStage]?.icon || '⚡'}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {progress.currentMessage}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Credit will only be deducted when the report is successfully generated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for table rows
 */
interface CompactProgressTrackerProps {
  job: ProcessingJob;
  onComplete?: (jobId: string) => void;
  onFailed?: (jobId: string) => void;
}

export function CompactProgressTracker({ 
  job, 
  onComplete, 
  onFailed 
}: CompactProgressTrackerProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (job.status === 'completed' && onComplete) {
      onComplete(job.jobId);
    } else if (job.status === 'failed' && onFailed) {
      onFailed(job.jobId);
    }
  }, [job.status, job.jobId, onComplete, onFailed]);

  if (job.status !== 'processing') {
    return null;
  }

  const startTime = job.startTime || new Date(job.createdAt).getTime();
  const progress = calculatePipelineProgress(startTime, currentTime);
  const currentStage = IDEATION_PIPELINE_STAGES[progress.currentStage];

  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-2 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {Math.round(progress.overallProgress)}% - Stage {progress.currentStage + 1}: {currentStage?.name}
        </span>
      </div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
        <div 
          className="h-full bg-blue-600 rounded-full transition-all duration-1000"
          style={{ width: `${progress.overallProgress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{formatElapsedTime(progress.elapsedTime)} elapsed</span>
        <span>{formatTimeRemaining(progress.estimatedTimeRemaining)} remaining</span>
      </div>
    </div>
  );
}