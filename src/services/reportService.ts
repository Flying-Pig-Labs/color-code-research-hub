// Report Service for fetching and processing research reports from S3
import { toast } from "sonner";

// Get configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Report data structure based on research API schema
export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ReportMetadata {
  title: string;
  summary: string;
  team: 'red' | 'black' | 'white';
  createdAt: string;
  reportId: string;
  s3Key: string;
  requestId: string;
  contentSummary?: string;
  disclaimers?: string[];
}

export interface ProcessedReport {
  metadata: ReportMetadata;
  sections: ReportSection[];
  tableOfContents: Array<{
    id: string;
    title: string;
    order: number;
  }>;
}

export interface RawReportData {
  content: string;
  metadata: ReportMetadata;
}

// Error handling for report service
export class ReportServiceError extends Error {
  constructor(
    public code: 'FETCH_ERROR' | 'PARSE_ERROR' | 'NOT_FOUND' | 'ACCESS_DENIED',
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ReportServiceError';
  }
}

/**
 * Fetch report data from S3 via API Gateway
 */
export async function fetchReportData(reportId: string): Promise<RawReportData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/research/reports/${reportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'omit',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ReportServiceError(
          'NOT_FOUND',
          `Report with ID ${reportId} not found`,
          { reportId, status: response.status }
        );
      }
      
      if (response.status === 403) {
        throw new ReportServiceError(
          'ACCESS_DENIED',
          'Access denied to this report',
          { reportId, status: response.status }
        );
      }

      throw new ReportServiceError(
        'FETCH_ERROR',
        `Failed to fetch report: ${response.statusText}`,
        { reportId, status: response.status }
      );
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data.content || !data.metadata) {
      throw new ReportServiceError(
        'PARSE_ERROR',
        'Invalid report data structure',
        { reportId, data }
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ReportServiceError) {
      throw error;
    }
    
    console.error('Error fetching report data:', error);
    throw new ReportServiceError(
      'FETCH_ERROR',
      `Failed to fetch report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { reportId, originalError: error }
    );
  }
}

/**
 * Process raw report content into structured sections
 */
export function processReportContent(rawContent: string): ReportSection[] {
  const sections: ReportSection[] = [];
  
  // Split content by major headings (# or ##)
  const contentLines = rawContent.split('\n');
  let currentSection: Partial<ReportSection> | null = null;
  let sectionOrder = 0;
  
  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i].trim();
    
    // Check for section headers (# or ##)
    const headerMatch = line.match(/^#{1,2}\s+(.+)$/);
    
    if (headerMatch) {
      // Save previous section if it exists
      if (currentSection && currentSection.title && currentSection.content) {
        sections.push({
          id: generateSectionId(currentSection.title),
          title: currentSection.title,
          content: currentSection.content.trim(),
          order: sectionOrder++
        });
      }
      
      // Start new section
      currentSection = {
        title: headerMatch[1],
        content: '',
      };
    } else if (currentSection) {
      // Add line to current section content
      currentSection.content = (currentSection.content || '') + line + '\n';
    } else if (line && !currentSection) {
      // Content before first header - create introduction section
      currentSection = {
        title: 'Introduction',
        content: line + '\n',
      };
    }
  }
  
  // Don't forget the last section
  if (currentSection && currentSection.title && currentSection.content) {
    sections.push({
      id: generateSectionId(currentSection.title),
      title: currentSection.title,
      content: currentSection.content.trim(),
      order: sectionOrder
    });
  }
  
  return sections;
}

/**
 * Generate a URL-friendly ID from section title
 */
function generateSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Process complete report data into structured format
 */
export function processReport(rawData: RawReportData): ProcessedReport {
  const sections = processReportContent(rawData.content);
  
  // Create table of contents
  const tableOfContents = sections.map((section) => ({
    id: section.id,
    title: section.title,
    order: section.order,
  }));
  
  return {
    metadata: rawData.metadata,
    sections,
    tableOfContents,
  };
}

/**
 * Convert markdown content to HTML for display
 */
export function renderMarkdownToHtml(markdown: string): string {
  // Basic markdown to HTML conversion
  // For a production app, consider using a library like marked or remark
  let html = markdown
    // Code blocks with language specifiers (e.g., ```markdown, ```javascript)
    .replace(/```[a-zA-Z]*\s*\n([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
    // Code blocks without language specifiers
    .replace(/```([\s\S]*?)```/gm, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold (fix to be non-greedy)
    .replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
    .replace(/__([^_]+)__/gim, '<strong>$1</strong>')
    // Italic (fix to be non-greedy and avoid conflicts with lists)
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/gim, '<em>$1</em>')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Lists
    .replace(/^\* (.+)$/gim, '<li>$1</li>')
    .replace(/^\- (.+)$/gim, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gim, '<li>$1. $2</li>')
    // Line breaks
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>');
  
  // Wrap in paragraphs and handle lists
  html = '<p>' + html + '</p>';
  html = html.replace(/<\/p><p><li>/gim, '</p><ul><li>');
  html = html.replace(/<\/li><br><li>/gim, '</li><li>');
  html = html.replace(/<\/li><p>/gim, '</li></ul><p>');
  html = html.replace(/<p><\/p>/gim, '');
  
  return html;
}

/**
 * Generate default disclaimers based on team type
 */
export function getDefaultDisclaimers(team: string): string[] {
  const commonDisclaimers = [
    'This report is generated by AI and should be reviewed by human experts before making critical decisions.',
    'All information is based on publicly available sources and may not reflect the most current state.',
    'Recommendations should be validated through independent research and expert consultation.'
  ];
  
  switch (team) {
    case 'red':
      return [
        ...commonDisclaimers,
        'This competitive analysis is for strategic planning purposes only and should comply with all applicable laws.',
        'Any mentioned strategies should be implemented ethically and within legal boundaries.'
      ];
    
    case 'black':
      return [
        ...commonDisclaimers,
        'This technical analysis is for educational and competitive research purposes only.',
        'Any implementation should respect intellectual property rights and terms of service.',
        'Reverse engineering activities should comply with applicable laws and licensing agreements.'
      ];
    
    case 'white':
      return [
        ...commonDisclaimers,
        'Market opportunities identified require further validation through market research and customer discovery.',
        'Financial projections and market sizing are estimates and should be validated independently.'
      ];
    
    default:
      return commonDisclaimers;
  }
}

/**
 * Show error toast for report service errors
 */
export function showReportError(error: ReportServiceError) {
  switch (error.code) {
    case 'NOT_FOUND':
      toast.error('Report Not Found', {
        description: 'The requested report could not be found. It may have been deleted or the link is invalid.',
      });
      break;
      
    case 'ACCESS_DENIED':
      toast.error('Access Denied', {
        description: 'You do not have permission to access this report.',
      });
      break;
      
    case 'PARSE_ERROR':
      toast.error('Report Format Error', {
        description: 'The report data is corrupted or in an unexpected format.',
      });
      break;
      
    case 'FETCH_ERROR':
    default:
      toast.error('Failed to Load Report', {
        description: 'Unable to load the report. Please check your connection and try again.',
      });
      break;
  }
}