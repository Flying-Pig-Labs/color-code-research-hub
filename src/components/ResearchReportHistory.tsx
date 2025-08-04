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
      const data = await listResearchReports(team, limit);
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Failed to load research history');
      toast.error('Failed to load research history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: ResearchReport) => {
    if (!report.downloadUrl) {
      toast.error('Download not available for this report');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = report.downloadUrl;
      link.download = `research_${report.reportId}.json`;
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
        return 'text-red-600';
      case 'black':
        return 'text-gray-900';
      case 'white':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTeamBgColor = (teamType: string) => {
    switch (teamType) {
      case 'red':
        return 'bg-red-50';
      case 'black':
        return 'bg-gray-100';
      case 'white':
        return 'bg-gray-50';
      default:
        return 'bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                Summary
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
                  {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTeamBgColor(report.team)} ${getTeamColor(report.team)}`}>
                    {report.team.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {report.vendorName || report.companyName || report.title || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                  {report.contentSummary || 'No summary available'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    {report.processedSummary && (
                      <button
                        onClick={() => handlePreview(report)}
                        className="inline-flex items-center px-3 py-1 rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </button>
                    )}
                    <Link
                      to={`/reports/${report.reportId}`}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Link>
                    <button
                      onClick={() => handleDownload(report)}
                      disabled={!report.downloadUrl}
                      className={`px-3 py-1 rounded-lg text-white ${
                        report.downloadUrl
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
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