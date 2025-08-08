import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listResearchReports, ResearchReport } from '../services/researchApi';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ExternalLink, Eye } from 'lucide-react';
import { ReportModal } from './ReportModal';

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
      // Always fetch from API to get all reports including those with summaries
      const data = await listResearchReports(team, limit);
      setReports(data);
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

  const getTeamColor = (teamType: string) => {
    switch (teamType) {
      case 'red':
        return 'text-red-700';
      case 'black':
        return 'text-gray-700';
      case 'white':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTeamBgColor = (teamType: string) => {
    switch (teamType) {
      case 'red':
        return 'bg-red-50 border border-red-200';
      case 'black':
        return 'bg-gray-100 border border-gray-300';
      case 'white':
        return 'bg-gray-50 border border-gray-200';
      default:
        return 'bg-gray-50 border border-gray-200';
    }
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
        <p>No research reports found{team ? ` for ${team} team` : ''}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Research History {team && <span className={getTeamColor(team)}>({team.toUpperCase()} Team)</span>}
        </h3>
        <button
          onClick={loadReports}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.reportId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {(() => {
                    if (!report.createdAt) return 'N/A';
                    const date = new Date(report.createdAt);
                    return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'M/d/yyyy h:mma');
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTeamBgColor(report.team)} ${getTeamColor(report.team)}`}>
                    {report.team ? report.team.toUpperCase() : 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {report.objective || report.metadata?.vendorName || report.metadata?.companyName || report.metadata?.title || report.vendorName || report.companyName || report.title || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {(() => {
                    // Try to calculate from timestamps first (for new records)
                    if (report.createdAt && report.processingCompletedAt) {
                      const startTime = new Date(report.createdAt).getTime();
                      const endTime = new Date(report.processingCompletedAt).getTime();
                      const durationMs = endTime - startTime;
                      
                      // Only use if duration is positive (timestamps are different)
                      if (durationMs > 0) {
                        const minutes = Math.floor(durationMs / 1000 / 60);
                        const seconds = Math.floor((durationMs / 1000) % 60);
                        return <span className="font-mono">{minutes}m {seconds}s</span>;
                      }
                    }
                    
                    // Use processingTimeMs for existing records where timestamps are the same
                    if (report.processingTimeMs) {
                      const minutes = Math.floor(report.processingTimeMs / 1000 / 60);
                      const seconds = Math.floor((report.processingTimeMs / 1000) % 60);
                      return <span className="font-mono">{minutes}m {seconds}s</span>;
                    }
                    
                    return <span className="text-gray-400">-</span>;
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
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