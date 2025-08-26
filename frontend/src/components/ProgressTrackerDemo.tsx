/**
 * @fileoverview Demo component for testing progress tracker functionality
 * 
 * Simulates a processing job to test the progress tracking UI components
 * without requiring actual backend integration.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressTracker, CompactProgressTracker } from './ProgressTracker';
import { ProcessingJob } from '../types/pipeline';

export function ProgressTrackerDemo() {
  const [demoJob, setDemoJob] = useState<ProcessingJob | null>(null);

  // Create a demo job that starts processing
  const startDemoJob = () => {
    const job: ProcessingJob = {
      jobId: `demo-${Date.now()}`,
      status: 'processing',
      createdAt: new Date().toISOString(),
      title: 'Market Analysis for SaaS Tools',
      type: 'ideation',
      startTime: Date.now()
    };
    setDemoJob(job);
  };

  // Simulate job completion
  const completeDemoJob = () => {
    if (demoJob) {
      setDemoJob({
        ...demoJob,
        status: 'completed'
      });
    }
  };

  // Simulate job failure
  const failDemoJob = () => {
    if (demoJob) {
      setDemoJob({
        ...demoJob,
        status: 'failed'
      });
    }
  };

  // Reset demo
  const resetDemo = () => {
    setDemoJob(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Progress Tracker Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={startDemoJob} disabled={demoJob?.status === 'processing'}>
                Start Demo Job
              </Button>
              {demoJob && demoJob.status === 'processing' && (
                <>
                  <Button onClick={completeDemoJob} variant="outline">
                    Complete Job
                  </Button>
                  <Button onClick={failDemoJob} variant="outline">
                    Fail Job
                  </Button>
                </>
              )}
              {demoJob && (
                <Button onClick={resetDemo} variant="outline">
                  Reset Demo
                </Button>
              )}
            </div>
            
            <p className="text-sm text-gray-600">
              This demo simulates the progress tracking feature for long-running ideation pipeline jobs.
              The progress is calculated based on elapsed time and predefined stage durations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Full Progress Tracker */}
      {demoJob && demoJob.status === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Full Progress Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressTracker
              job={demoJob}
              onComplete={(jobId) => console.log('Job completed:', jobId)}
              onFailed={(jobId) => console.log('Job failed:', jobId)}
            />
          </CardContent>
        </Card>
      )}

      {/* Compact Progress Tracker (as used in table) */}
      {demoJob && demoJob.status === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Compact Progress Tracker (Table Version)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <CompactProgressTracker
                job={demoJob}
                onComplete={(jobId) => console.log('Job completed:', jobId)}
                onFailed={(jobId) => console.log('Job failed:', jobId)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Table Row */}
      {demoJob && demoJob.status === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Table Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Progress / Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  <tr className="hover:bg-muted/20">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {demoJob.title}
                    </td>
                    <td className="px-6 py-4">
                      <CompactProgressTracker
                        job={demoJob}
                        onComplete={(jobId) => console.log('Job completed:', jobId)}
                        onFailed={(jobId) => console.log('Job failed:', jobId)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button className="inline-flex items-center px-3 py-1 rounded-lg transition-colors bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 cursor-pointer">
                          Cancel
                        </button>
                        <button className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-500 border border-gray-200 transition-colors">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Information */}
      {demoJob && (
        <Card>
          <CardHeader>
            <CardTitle>Job Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Job ID:</strong> {demoJob.jobId}</p>
              <p><strong>Status:</strong> {demoJob.status}</p>
              <p><strong>Type:</strong> {demoJob.type}</p>
              <p><strong>Title:</strong> {demoJob.title}</p>
              <p><strong>Created:</strong> {new Date(demoJob.createdAt).toLocaleString()}</p>
              {demoJob.startTime && (
                <p><strong>Start Time:</strong> {new Date(demoJob.startTime).toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}