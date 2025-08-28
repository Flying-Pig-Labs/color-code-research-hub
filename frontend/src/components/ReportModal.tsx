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
        description: `Job started. Scroll down to Pipeline Jobs table to see progress (it'll take ~20m).`,
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
  const rawSummary = reportData?.summary || report?.metadata?.summary || 'No summary available';
  
  // Process summary into structured format for better readability
  const processedSummary = React.useMemo(() => {
    if (rawSummary === 'No summary available') return rawSummary;
    
    // Split into sentences and group them into logical sections
    const sentences = rawSummary.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length <= 2) {
      return rawSummary; // Keep short summaries as-is
    }
    
    // Group sentences into key insights
    const keyInsights = [];
    const opportunities = [];
    const challenges = [];
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      if (lower.includes('opportunity') || lower.includes('potential') || lower.includes('growth')) {
        opportunities.push(sentence.trim());
      } else if (lower.includes('challenge') || lower.includes('difficulty') || lower.includes('risk')) {
        challenges.push(sentence.trim());
      } else {
        keyInsights.push(sentence.trim());
      }
    });
    
    return {
      keyInsights: keyInsights.slice(0, 3),
      opportunities: opportunities.slice(0, 2),
      challenges: challenges.slice(0, 2)
    };
  }, [rawSummary]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${isPreview ? 'max-w-2xl w-full' : 'max-w-5xl w-full'} my-4 relative flex flex-col`} 
           style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <FileText className={`h-6 w-6 ${isPreview ? 'text-blue-600' : 'text-green-600'}`} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {isPreview ? 'report preview' : 'full report'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 ${isPreview ? 'flex-shrink-0' : ''}`}>
          {isPreview ? (
            // Preview Mode - Show structured summary
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">{title}</h3>
                
                {typeof processedSummary === 'string' ? (
                  // Simple summary format
                  <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">executive summary</p>
                    <p className="text-foreground leading-relaxed">{processedSummary}</p>
                  </div>
                ) : (
                  // Structured summary format
                  <div className="space-y-4">
                    {processedSummary.keyInsights.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">key insights</h4>
                        <ul className="space-y-2">
                          {processedSummary.keyInsights.map((insight, idx) => (
                            <li key={idx} className="text-foreground leading-relaxed">
                              • {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {processedSummary.opportunities.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-3">opportunities</h4>
                        <ul className="space-y-2">
                          {processedSummary.opportunities.map((opp, idx) => (
                            <li key={idx} className="text-foreground leading-relaxed">
                              • {opp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {processedSummary.challenges.length > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-3">challenges</h4>
                        <ul className="space-y-2">
                          {processedSummary.challenges.map((challenge, idx) => (
                            <li key={idx} className="text-foreground leading-relaxed">
                              • {challenge}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {reportData && (
                <div className="bg-muted/50 border border-border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Report Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Date:</span>
                      <span className="ml-2 text-foreground">
                        {reportData.createdAt ? new Date(reportData.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {reportData.vendorName && (
                      <div>
                        <span className="font-medium text-muted-foreground">Vendor:</span>
                        <span className="ml-2 text-foreground">{reportData.vendorName}</span>
                      </div>
                    )}
                    {reportData.companyName && (
                      <div>
                        <span className="font-medium text-muted-foreground">Company:</span>
                        <span className="ml-2 text-foreground">{reportData.companyName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* IDEATE Info */}
              <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Innovation Pipeline</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
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
                  <span className="ml-2 text-muted-foreground">Loading report...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive">{error}</p>
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
                    <h3 className="text-2xl font-bold text-foreground mb-2">{report.metadata.title}</h3>
                    <p className="text-muted-foreground">{report.metadata.summary}</p>
                  </div>

                  {/* Table of Contents */}
                  {report.tableOfContents && report.tableOfContents.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-3">Table of Contents</h4>
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
                    <div key={index} id={section.id} className="border-t border-border pt-6">
                      <h4 className="text-xl font-semibold text-foreground mb-3">
                        {section.title}
                      </h4>
                      <div 
                        className="prose prose-gray max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(section.content) }}
                      />
                    </div>
                  ))}

                  {/* Metadata */}
                  <div className="border-t border-border pt-6 mt-8">
                    <h4 className="font-semibold text-foreground mb-3">Report Information</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Created:</span>
                        <span className="ml-2 text-foreground">{new Date(report.metadata.createdAt).toLocaleDateString()}</span>
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
                <div className="text-center py-12 text-muted-foreground">
                  No report data available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
          {isPreview ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-foreground bg-background border border-border rounded-lg hover:bg-muted"
              >
                close
              </button>
              <div className="flex space-x-3">
                {/* IDEATE Button */}
                <button
                  onClick={handleIdeate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center transition-colors"
                  title="Generate innovation ideas from this research"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  ideate
                </button>
                
                <button
                  onClick={onViewFull}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                >
                  view full report
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500"
            >
              close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}