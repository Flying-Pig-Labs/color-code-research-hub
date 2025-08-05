import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Download, ExternalLink, Menu, X, Clock, User, Tag, Sparkles } from 'lucide-react';
import {
  fetchReportData,
  processReport,
  renderMarkdownToHtml,
  getDefaultDisclaimers,
  showReportError,
  ProcessedReport,
  ReportServiceError
} from '../services/reportService';
import { apiService } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';

interface ReportViewProps {
  reportId?: string;
}

export function ReportView({ reportId: propReportId }: ReportViewProps) {
  const { reportId: paramReportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const reportId = propReportId || paramReportId;
  
  const [report, setReport] = useState<ProcessedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [tocOpen, setTocOpen] = useState(false);
  const [isIdeating, setIsIdeating] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement }>({});

  useEffect(() => {
    if (reportId) {
      // Check for demo data first
      if (reportId === 'demo') {
        const demoData = sessionStorage.getItem('demo-report-data');
        if (demoData) {
          try {
            const parsedData = JSON.parse(demoData);
            const processedReport = processReport(parsedData);
            setReport(processedReport);
            if (processedReport.sections.length > 0) {
              setActiveSection(processedReport.sections[0].id);
            }
            setLoading(false);
            return;
          } catch (error) {
            console.error('Failed to parse demo data:', error);
          }
        }
      }
      
      loadReport(reportId);
    } else {
      setError('No report ID provided');
      setLoading(false);
    }
  }, [reportId]);

  // Track active section while scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!report || !contentRef.current) return;

      const scrollPosition = contentRef.current.scrollTop + 100; // Offset for header
      let currentSection = '';

      // Find the section that's currently in view
      for (const section of report.sections) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop) {
            currentSection = section.id;
          }
        }
      }

      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [report, activeSection]);

  const loadReport = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading report:', id);
      const rawData = await fetchReportData(id);
      const processedReport = processReport(rawData);
      
      setReport(processedReport);

      // Set first section as active initially
      if (processedReport.sections.length > 0) {
        setActiveSection(processedReport.sections[0].id);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
      
      if (err instanceof ReportServiceError) {
        showReportError(err);
        setError(err.message);
      } else {
        const errorMessage = 'Failed to load report';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element && contentRef.current) {
      const offset = element.offsetTop - 80; // Account for header
      contentRef.current.scrollTo({
        top: offset,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
      setTocOpen(false); // Close mobile ToC
    }
  };

  const handleDownload = () => {
    if (!report) return;

    try {
      // Create downloadable report content
      const downloadContent = {
        metadata: report.metadata,
        sections: report.sections,
        generatedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(downloadContent, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `research_report_${report.metadata.reportId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download report');
    }
  };

  const handleIdeate = async () => {
    if (!report || !report.metadata.reportId) return;

    setIsIdeating(true);
    
    try {
      // Extract the research ID (assuming reportId is the same as research_id)
      const researchDocId = report.metadata.reportId;
      
      // Call the ideation pipeline API
      const response = await apiService.startIdeationPipeline(researchDocId);
      
      // Show success message
      toast.success('Ideation pipeline started!', {
        description: `Processing research document: ${researchDocId}`,
        duration: 5000,
      });

      // If the response contains a GitHub repo URL, offer to open it
      if (response.repositoryUrl) {
        toast.success('GitHub repository created!', {
          description: response.repositoryName,
          action: {
            label: 'Open Repository',
            onClick: () => window.open(response.repositoryUrl, '_blank'),
          },
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Ideation failed:', error);
      toast.error('Failed to start ideation pipeline', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsIdeating(false);
    }
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'black': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'white': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTeamIcon = (team: string) => {
    switch (team) {
      case 'red': return '🔴';
      case 'black': return '⚫';
      case 'white': return '⚪';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <X className="h-5 w-5 mr-2" />
              Error Loading Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              {reportId && (
                <Button
                  onClick={() => loadReport(reportId)}
                  className="flex items-center"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const disclaimers = report.metadata.disclaimers || getDefaultDisclaimers(report.metadata.team);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="sm"
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <div className="flex items-center">
                <span className="text-2xl mr-2">{getTeamIcon(report.metadata.team)}</span>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                    {report.metadata.title}
                  </h1>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(report.metadata.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={getTeamColor(report.metadata.team)}>
                {report.metadata.team.toUpperCase()} Team
              </Badge>
              
              <Button
                onClick={handleIdeate}
                disabled={isIdeating}
                size="sm"
                className="flex items-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isIdeating ? 'Starting...' : 'Ideate'}
              </Button>
              
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              {/* Mobile ToC Toggle */}
              <Sheet open={tocOpen} onOpenChange={setTocOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Table of Contents</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-full mt-4">
                    <nav className="space-y-1">
                      {report.tableOfContents.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.title}
                        </button>
                      ))}
                    </nav>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Table of Contents */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Table of Contents</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-12rem)]">
                    <nav className="space-y-1">
                      {report.tableOfContents.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeSection === item.id
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.title}
                        </button>
                      ))}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <ScrollArea className="h-[calc(100vh-8rem)]" ref={contentRef}>
              <div className="space-y-8">
                {/* Report Summary */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{report.metadata.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {report.metadata.team.toUpperCase()} Team
                          </div>
                          <div className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            ID: {report.metadata.reportId}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold mb-3">Executive Summary</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {report.metadata.summary || 
                         report.metadata.contentSummary || 
                         'This research report provides comprehensive analysis and insights based on the requested scope and methodology.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Report Sections */}
                {report.sections.map((section) => (
                  <Card
                    key={section.id}
                    ref={(el) => {
                      if (el) {
                        sectionRefs.current[section.id] = el;
                      }
                    }}
                  >
                    <CardHeader>
                      <CardTitle id={section.id} className="scroll-mt-24">
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="prose max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-strong:text-gray-900"
                        dangerouslySetInnerHTML={{ 
                          __html: renderMarkdownToHtml(section.content) 
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}

                {/* Disclaimers */}
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 flex items-center">
                      <span className="mr-2">⚠️</span>
                      Important Disclaimers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {disclaimers.map((disclaimer, index) => (
                        <p key={index} className="text-sm text-yellow-700">
                          • {disclaimer}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Report Metadata */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm text-gray-600">Report Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Report ID:</span>
                        <span className="ml-2 text-gray-600 font-mono">{report.metadata.reportId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Request ID:</span>
                        <span className="ml-2 text-gray-600 font-mono">{report.metadata.requestId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Team:</span>
                        <span className="ml-2">
                          <Badge className={getTeamColor(report.metadata.team)}>
                            {report.metadata.team.toUpperCase()}
                          </Badge>
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Generated:</span>
                        <span className="ml-2 text-gray-600">
                          {format(new Date(report.metadata.createdAt), 'PPpp')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}