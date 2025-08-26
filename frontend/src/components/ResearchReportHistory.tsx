import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listResearchReports, ResearchReport } from '../services/researchApi';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ExternalLink, Eye } from 'lucide-react';
import { ReportModal } from './ReportModal';
import { CompactProgressTracker } from './ProgressTracker';
import { ProcessingJob } from '../types/pipeline';

interface ResearchReportHistoryProps {
  team?: 'red' | 'black' | 'white';
  limit?: number;
}

export function ResearchReportHistory({ team, limit = 20 }: ResearchReportHistoryProps) {
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [modalMode, setModalMode] = useState<'preview' | 'full'>('preview');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadReports();
  }, [team, limit]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get active jobs from localStorage
      const localTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
      const activeJobs = localTasks
        .filter((task: any) => ['pending', 'processing', 'submitted'].includes(task.status))
        .filter((task: any) => !team || task.team === team)
        .map((task: any) => ({
          reportId: task.research_id || task.requestId || task.id,
          team: task.team || 'unknown',
          createdAt: task.createdAt,
          requestId: task.requestId,
          title: task.vendorName || task.companyName || task.title || 'Research Job',
          vendorName: task.vendorName,
          companyName: task.companyName,
          status: task.status,
          jobType: task.jobType || 'research'
        }));

      // Get completed reports from API
      const apiReports = await listResearchReports(team, limit);
      
      // Combine active jobs first, then completed reports
      const allReports = [...activeJobs, ...apiReports];
      setReports(allReports.slice(0, limit));
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to load research history');
      // Fall back to localStorage if API fails
      try {
        const localReports = JSON.parse(localStorage.getItem('researchTasks') || '[]')
          .filter((task: any) => task.status === 'completed' && (!team || task.team === team))
          .slice(0, limit)
          .map((task: any) => ({
            reportId: task.research_id || task.requestId || task.id,
            team: task.team || 'unknown',
            createdAt: task.createdAt,
            requestId: task.requestId,
            s3Prefix: task.s3_prefix,
            s3Files: task.s3_files,
            s3Key: task.s3_key,
            vendorName: task.vendorName,
            companyName: task.companyName,
            title: task.vendorName || task.companyName || 'Research Report',
            contentSummary: task.summary,
            processedSummary: task.summary,
            summaryWordCount: task.summaryWordCount,
            downloadUrl: task.download_url
          }));
        setReports(localReports);
        toast.warning('Using offline data - API unavailable');
      } catch (localErr) {
        toast.error('Failed to load research history');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: ResearchReport) => {
    // Prioritize the formatted .md report over the raw JSON
    const s3Key = report.s3ReportKey || report.fullReportS3Key || report.s3Files?.response || report.s3Key;
    
    if (!s3Key && !report.downloadUrl) {
      toast.error('Download not available for this report');
      return;
    }

    try {
      let downloadUrl = report.downloadUrl;
      
      // If we have an s3Key, fetch a fresh presigned URL
      if (s3Key) {
        const encodedKey = btoa(s3Key);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/research/download/${encodedKey}`);
        
        if (!response.ok) {
          throw new Error('Failed to get download URL');
        }
        
        const data = await response.json();
        if (data.download_url) {
          downloadUrl = data.download_url;
        } else {
          throw new Error('No download URL received');
        }
      }
      
      // Use the fresh URL (or existing one if no s3Key)
      const link = document.createElement('a');
      link.href = downloadUrl;
      // Always download as .md if it's a report (prefer formatted report)
      const isFormattedReport = report.s3ReportKey || report.fullReportS3Key || s3Key?.includes('/report.md') || s3Key?.includes('/formatted_report.md');
      link.download = isFormattedReport ? `research_${report.reportId}.md` : `research_${report.reportId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report');
    }
  };

  const handlePreview = (report: ResearchReport) => {
    setSelectedReport(report);
    setModalMode('preview');
    setIsModalOpen(true);
  };

  const handleViewFull = () => {
    setModalMode('full');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
    setModalMode('preview');
  };

  // Convert ResearchReport to ProcessingJob for progress tracking
  const toProcessingJob = (report: ResearchReport): ProcessingJob => ({
    jobId: report.reportId,
    status: report.status || 'completed',
    createdAt: report.createdAt,
    title: report.title || report.vendorName || report.companyName || 'Research Report',
    type: report.jobType || 'research',
    startTime: new Date(report.createdAt).getTime()
  });

  // Handle job completion
  const handleJobComplete = (jobId: string) => {
    // Refresh the reports to get updated status
    loadReports();
    toast.success('Job completed successfully!');
  };

  // Handle job failure
  const handleJobFailed = (jobId: string) => {
    // Refresh the reports to get updated status
    loadReports();
    toast.error('Job failed. Please try again.');
  };

  // Check if a report is currently processing
  const isProcessing = (report: ResearchReport): boolean => {
    return report.status === 'processing' || report.status === 'pending' || report.status === 'submitted';
  };


  // TODO: Future feature - Add delete functionality for individual reports
  // Implementation exists in scripts/delete-report.cjs
  // const handleDeleteReport = async (reportId: string) => {
  //   // Confirm deletion
  //   // Call API to delete from DynamoDB and S3
  //   // Refresh the report list
  // };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8" role="status" aria-label="Loading research reports">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadReports}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No research reports found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Research History
        </h3>
        <button
          onClick={loadReports}
          className="px-3 py-1 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
        >
          Refresh
        </button>
      </div>

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
            {reports.map((report) => (
              <tr key={report.reportId} className="hover:bg-muted/20">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {(() => {
                    if (!report.createdAt) return 'N/A';
                    const date = new Date(report.createdAt);
                    return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'M/d/yyyy h:mma');
                  })()}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {(() => {
                    const target = report.objective || report.metadata?.vendorName || report.metadata?.companyName || report.metadata?.title || report.vendorName || report.companyName || report.title || 'N/A';
                    // Remove " Research" suffix if present
                    return target.endsWith(' Research') ? target.slice(0, -9) : target;
                  })()}
                </td>
                <td className="px-6 py-4">
                  {isProcessing(report) ? (
                    <CompactProgressTracker
                      job={toProcessingJob(report)}
                      onComplete={handleJobComplete}
                      onFailed={handleJobFailed}
                    />
                  ) : (
                    <div className="text-sm text-gray-500">
                      {(() => {
                        // FIX: Handle inconsistent timestamp formats from DynamoDB
                        // Some timestamps have microseconds without Z, others have Z
                        
                        if (report.createdAt && report.processingCompletedAt) {
                          // Normalize timestamps - ensure both are treated as UTC
                          let startStr = report.createdAt;
                          let endStr = report.processingCompletedAt;
                          
                          // If timestamp has microseconds (6 decimal places), truncate to milliseconds (3)
                          if (startStr.includes('.') && !startStr.endsWith('Z')) {
                            const parts = startStr.split('.');
                            const decimals = parts[1].substring(0, 3);
                            startStr = `${parts[0]}.${decimals}Z`;
                          } else if (!startStr.endsWith('Z')) {
                            startStr = `${startStr}Z`;
                          }
                          
                          const startTime = new Date(startStr).getTime();
                          const endTime = new Date(endStr).getTime();
                          const durationMs = endTime - startTime;
                          
                          // If we have a valid positive duration, use it
                          if (durationMs > 1000 && durationMs < 86400000) { // > 1 second and < 24 hours
                            const totalSeconds = Math.floor(durationMs / 1000);
                            const minutes = Math.floor(totalSeconds / 60);
                            const seconds = totalSeconds % 60;
                            return <span className="font-mono">{minutes}m {seconds}s</span>;
                          }
                          
                          // If duration is invalid (negative or too small), use processingTimeMs
                          if (report.processingTimeMs && report.processingTimeMs > 0) {
                            const totalSeconds = Math.floor(report.processingTimeMs / 1000);
                            const minutes = Math.floor(totalSeconds / 60);
                            const seconds = totalSeconds % 60;
                            return <span className="font-mono">{minutes}m {seconds}s</span>;
                          }
                        }
                        
                        // Fallback: If we only have processingTimeMs
                        if (report.processingTimeMs && report.processingTimeMs > 0) {
                          const totalSeconds = Math.floor(report.processingTimeMs / 1000);
                          const minutes = Math.floor(totalSeconds / 60);
                          const seconds = totalSeconds % 60;
                          return <span className="font-mono">{minutes}m {seconds}s</span>;
                        }
                        
                        return <span className="text-gray-400">-</span>;
                      })()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {isProcessing(report) ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // TODO: Implement cancel functionality
                          toast.info('Cancel functionality coming soon');
                        }}
                        className="inline-flex items-center px-3 py-1 rounded-lg transition-colors bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 cursor-pointer"
                        title="Cancel job"
                      >
                        Cancel
                      </button>
                      <Link
                        to={`/reports/${report.reportId}`}
                        className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-500 border border-gray-200 transition-colors"
                        title="Job still in progress"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePreview(report)}
                        disabled={!report.processedSummary}
                        className={`inline-flex items-center px-3 py-1 rounded-lg transition-colors ${
                          report.processedSummary
                            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 border border-gray-200'
                        }`}
                        title={!report.processedSummary ? 'Summary not yet processed' : 'Preview summary'}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </button>
                      <Link
                        to={`/reports/${report.reportId}`}
                        className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Link>
                      <button
                        onClick={() => handleDownload(report)}
                        disabled={!report.downloadUrl && !report.s3Key && !report.s3Files?.response && !report.s3ReportKey && !report.fullReportS3Key}
                        className={`inline-flex items-center px-3 py-1 rounded-lg transition-colors ${
                          report.downloadUrl || report.s3Key || report.s3Files?.response || report.s3ReportKey || report.fullReportS3Key
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 border border-gray-200'
                        }`}
                        title={
                          !report.downloadUrl && !report.s3Key && !report.s3Files?.response && !report.s3ReportKey && !report.fullReportS3Key
                            ? 'Download not available yet'
                            : 'Download report'
                        }
                      >
                        Download
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <ReportModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          reportId={selectedReport.reportId}
          reportData={{
            title: selectedReport.title || selectedReport.vendorName || selectedReport.companyName,
            summary: selectedReport.processedSummary || selectedReport.contentSummary,
            team: selectedReport.team,
            createdAt: selectedReport.createdAt,
            vendorName: selectedReport.vendorName,
            companyName: selectedReport.companyName
          }}
          mode={modalMode}
          onViewFull={handleViewFull}
        />
      )}
    </div>
  );
}