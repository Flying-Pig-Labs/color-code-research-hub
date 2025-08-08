import React, { useState, useEffect } from 'react';
import { X, FileText, ChevronRight, Loader2, Lightbulb, ExternalLink } from 'lucide-react';
import { 
  fetchReportData, 
  processReport, 
  renderMarkdownToHtml,
  ProcessedReport,
  ReportMetadata 
} from '../services/reportService';
import { innovationPipelineService } from '../services/innovationPipelineService';
import { toast } from 'sonner';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportData?: {
    title?: string;
    summary?: string;
    team?: string;
    createdAt?: string;
    vendorName?: string;
    companyName?: string;
  };
  mode: 'preview' | 'full';
  onViewFull?: () => void;
}

export function ReportModal({ 
  isOpen, 
  onClose, 
  reportId, 
  reportData,
  mode, 
  onViewFull 
}: ReportModalProps) {
  const [report, setReport] = useState<ProcessedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed pipeline progress state - no longer showing modal

  useEffect(() => {
    if (isOpen && mode === 'full' && !report) {
      loadFullReport();
    }
  }, [isOpen, mode, reportId]);

  const loadFullReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawReport = await fetchReportData(reportId);
      const processedReport = processReport(rawReport);
      setReport(processedReport);
    } catch (err) {
      setError('Failed to load report');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIdeate = async () => {
    try {
      // Get the team from reportData, default to 'red' if not specified
      const team = reportData?.team || 'red';
      
      // Start the pipeline with the team parameter
      const response = await innovationPipelineService.startPipeline(reportId, 'user', team);
      
      // Don't show the progress modal - just show success notification
      // The PipelineJobsTable will track the job
      
      // Success message with more details
      toast.success('Innovation pipeline started!', {
        description: `Job ${response.jobName} is now running. Check the Pipeline Jobs table to monitor progress. Processing takes approximately 10-15 minutes.`,
        duration: 8000,
      });
    } catch (err) {
      console.error('Error starting innovation pipeline:', err);
      
      // Better error handling with specific messages
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Make 404 errors more user-friendly
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          errorMessage = `Research report '${reportId}' not found. Please ensure the report exists and has been fully processed.`;
        }
      }
      
      toast.error('Failed to start innovation pipeline', {
        description: errorMessage,
      });
    }
  };
  
  // Removed pipeline handlers - no longer needed since we don't show the modal

  if (!isOpen) return null;

  const isPreview = mode === 'preview';
  const title = reportData?.title || report?.metadata?.title || 'Research Report';
  const summary = reportData?.summary || report?.metadata?.summary || 'No summary available';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl ${isPreview ? 'max-w-2xl' : 'max-w-4xl w-full max-h-[90vh]'} relative`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className={`h-6 w-6 ${isPreview ? 'text-blue-600' : 'text-green-600'}`} />
            <h2 className="text-xl font-semibold text-gray-900">
              {isPreview ? 'Report Preview' : 'Full Report'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className={`p-6 ${!isPreview && 'overflow-y-auto max-h-[calc(90vh-180px)]'}`}>
          {isPreview ? (
            // Preview Mode - Show 120-word summary
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Executive Summary (120 words)</p>
                  <p className="text-gray-700 leading-relaxed">{summary}</p>
                </div>
              </div>
              
              {reportData && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Team:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium
                      ${reportData.team === 'red' ? 'bg-red-100 text-red-800' : ''}
                      ${reportData.team === 'black' ? 'bg-gray-900 text-white' : ''}
                      ${reportData.team === 'white' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {reportData.team?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500">Date:</span>
                    <span className="ml-2">
                      {reportData.createdAt ? new Date(reportData.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {reportData.vendorName && (
                    <div>
                      <span className="font-medium text-gray-500">Vendor:</span>
                      <span className="ml-2">{reportData.vendorName}</span>
                    </div>
                  )}
                  {reportData.companyName && (
                    <div>
                      <span className="font-medium text-gray-500">Company:</span>
                      <span className="ml-2">{reportData.companyName}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* IDEATE Info */}
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">Innovation Pipeline</p>
                    <p className="text-sm text-purple-700 mt-1">
                      Click <span className="font-semibold">IDEATE</span> to generate actionable innovation ideas 
                      from this research. The process takes approximately 22 minutes and creates a GitHub 
                      repository with detailed implementation plans.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Full Report Mode
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading report...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={loadFullReport}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : report ? (
                <>
                  {/* Report Header */}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{report.metadata.title}</h3>
                    <p className="text-gray-600">{report.metadata.summary}</p>
                  </div>

                  {/* Table of Contents */}
                  {report.tableOfContents && report.tableOfContents.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Table of Contents</h4>
                      <ul className="space-y-2">
                        {report.tableOfContents.map((item, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <ChevronRight className="h-4 w-4 text-gray-400 mr-2" />
                            <a
                              href={`#${item.id}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {item.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Report Sections */}
                  {report.sections && report.sections.map((section, index) => (
                    <div key={index} id={section.id} className="border-t pt-6">
                      <h4 className="text-xl font-semibold text-gray-900 mb-3">
                        {section.title}
                      </h4>
                      <div 
                        className="prose prose-gray max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(section.content) }}
                      />
                    </div>
                  ))}

                  {/* Metadata */}
                  <div className="border-t pt-6 mt-8">
                    <h4 className="font-semibold text-gray-900 mb-3">Report Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Team:</span>
                        <span className="ml-2">{report.metadata.team?.toUpperCase() || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Created:</span>
                        <span className="ml-2">{new Date(report.metadata.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimers */}
                  {report.metadata.disclaimers && report.metadata.disclaimers.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">Important Notice</h4>
                      <ul className="space-y-1 text-sm text-yellow-800">
                        {report.metadata.disclaimers.map((disclaimer, index) => (
                          <li key={index}>• {disclaimer}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No report data available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          {isPreview ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <div className="flex space-x-3">
                {/* IDEATE Button */}
                <button
                  onClick={handleIdeate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center transition-colors"
                  title="Generate innovation ideas from this research"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  IDEATE
                </button>
                
                <button
                  onClick={onViewFull}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  View Full Report
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}