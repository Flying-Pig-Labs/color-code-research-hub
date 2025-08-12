interface ResearchRequest {
  task: string;
  team?: string;
  companyName?: string;
  vendorName?: string;
}

interface ResearchResponse {
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  research_id?: string;  // New: unique research ID
  s3_prefix?: string;    // New: S3 folder prefix
  s3_files?: {           // New: individual file paths
    request?: string;
    response?: string;
    metadata?: string;
  };
  s3_key?: string;       // Deprecated: kept for backwards compatibility
  download_url?: string;
  error?: string;
  summary?: string;
  summaryWordCount?: number;
  reportId?: string;
  reportProcessed?: boolean;
  team?: string;
  title?: string;
  vendorName?: string;
  companyName?: string;
}

interface AsyncJobResponse {
  success: boolean;
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: {
    title: string;
    requester: string;
    tags: string[];
    model: string;
    reasoning_effort: string;
  };
  timestamp: string;
}

interface StatusCheckResponse {
  success: boolean;
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  content?: string;
  research_id?: string;    // New: unique research ID
  s3_prefix?: string;      // New: S3 folder prefix
  s3_location?: string;
  s3_files?: {             // New: individual file paths
    request?: string;
    response?: string;
    metadata?: string;
  };
  s3_key?: string;
  download_url?: string;
  model_used?: string;
  timestamp: string;
  error?: string;
  summary?: string;
  summaryWordCount?: number;
  reportId?: string;
  reportProcessed?: boolean;
  team?: string;
  title?: string;
  vendorName?: string;
  companyName?: string;
}

// Use API Gateway proxy to avoid CORS/private network issues
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
// Prompts (moved to frontend/prompts)
import { buildRedTeamPrompt } from '../../prompts/red-team';
import { buildWhiteTeamPrompt } from '../../prompts/white-team';
import { buildBlackTeamPrompt } from '../../prompts/black-team';

export async function submitResearch(request: ResearchRequest): Promise<ResearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'fprior',  // Add user header
      },
      body: JSON.stringify({
        content: request.task,
        title: request.companyName ? `${request.companyName} Research` : 'Research Request',
        model: 'sonar-deep-research',
        reasoning_effort: 'high',
        team: request.team || 'unknown',
        companyName: request.companyName,
        vendorName: request.vendorName
      }),
    });

    if (!response.ok) {
      throw new Error(`Research submission failed: ${response.statusText}`);
    }

    const data: AsyncJobResponse = await response.json();
    
    // Return the async job response
    return {
      request_id: data.request_id,
      status: data.status,
      result: data.metadata ? {
        metadata: data.metadata,
        timestamp: data.timestamp
      } : undefined
    };
  } catch (error) {
    console.error('Error submitting research:', error);
    throw error;
  }
}

export async function checkResearchStatus(requestId: string): Promise<ResearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/research/status/${requestId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const data: StatusCheckResponse = await response.json();
    
    // Transform the status check response to match expected format
    return {
      request_id: data.request_id,
      status: data.status,
      result: data.status === 'completed' ? {
        content: data.content,
        s3_location: data.s3_location,
        model_used: data.model_used,
        timestamp: data.timestamp
      } : undefined,
      research_id: data.research_id,
      s3_prefix: data.s3_prefix,
      s3_files: data.s3_files,
      s3_key: data.s3_key,
      download_url: data.download_url,
      error: data.error,
      summary: data.summary,
      summaryWordCount: data.summaryWordCount,
      reportId: data.reportId || data.research_id,  // Use research_id as fallback
      reportProcessed: data.reportProcessed,
      team: data.team,
      title: data.title,
      vendorName: data.vendorName,
      companyName: data.companyName
    };
  } catch (error) {
    console.error('Error checking research status:', error);
    throw error;
  }
}

export const formatRedTeamPrompt = buildRedTeamPrompt;

export const formatWhiteTeamPrompt = buildWhiteTeamPrompt;

export interface ResearchReport {
  reportId: string;
  userId?: string;         // New: user who created the report
  team: string;
  createdAt: string;
  requestId: string;
  s3Prefix?: string;       // New: S3 folder prefix
  s3Files?: {             // New: individual file paths
    request?: string;
    response?: string;
    metadata?: string;
  };
  s3Key?: string;          // Deprecated: kept for backwards compatibility
  s3ReportKey?: string;    // New: formatted report S3 key
  fullReportS3Key?: string; // New: full report S3 key
  title?: string;
  vendorName?: string;
  companyName?: string;
  contentSummary?: string;
  processedSummary?: string;
  summaryWordCount?: number;
  downloadUrl?: string;
  objective?: string;       // Research objective/target from DynamoDB
  processingTimeMs?: number; // Processing duration in milliseconds from DynamoDB
  processingCompletedAt?: string; // Completion timestamp from DynamoDB
  metadata?: {
    title?: string;
    vendorName?: string;
    companyName?: string;
    team?: string;
    [key: string]: any;
  };
  pipelineDurationSeconds?: number;
  pipelineStartedAt?: string;
  pipelineCompletedAt?: string;
}

export async function listResearchReports(team?: string, limit: number = 50): Promise<ResearchReport[]> {
  try {
    const params = new URLSearchParams();
    if (team) params.append('team', team);
    params.append('limit', limit.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/research/reports?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to list reports: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.reports || [];
  } catch (error) {
    console.error('Error listing research reports:', error);
    throw error;
  }
}

export const formatBlackTeamPrompt = buildBlackTeamPrompt;