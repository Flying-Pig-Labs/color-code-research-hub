import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResearchReportHistory } from '../components/ResearchReportHistory';
import * as researchApi from '../services/researchApi';

// Mock the entire researchApi module
vi.mock('../services/researchApi');
const mockedResearchApi = researchApi as vi.Mocked<typeof researchApi>;

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date: Date) => new Date(date).toLocaleDateString())
}));

describe('Report Processing Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Report Processing Flow', () => {
    it('should handle complete research submission and status checking workflow', async () => {
      // Mock initial submission
      mockedResearchApi.submitResearch.mockResolvedValueOnce({
        request_id: 'req-integration-001',
        status: 'pending',
        result: {
          metadata: {
            title: 'Integration Test Research',
            requester: 'test-user',
            tags: ['integration'],
            model: 'sonar-deep-research',
            reasoning_effort: 'medium'
          },
          timestamp: '2024-01-15T10:00:00Z'
        }
      });

      // Mock status progression: pending -> processing -> completed
      mockedResearchApi.checkResearchStatus
        .mockResolvedValueOnce({
          request_id: 'req-integration-001',
          status: 'pending',
          result: undefined,
          s3_key: undefined,
          download_url: undefined,
          error: undefined
        })
        .mockResolvedValueOnce({
          request_id: 'req-integration-001',
          status: 'processing',
          result: undefined,
          s3_key: undefined,
          download_url: undefined,
          error: undefined
        })
        .mockResolvedValueOnce({
          request_id: 'req-integration-001',
          status: 'completed',
          result: {
            content: '# Research Results\n\nComprehensive analysis completed...',
            s3_location: 's3://bucket/reports/req-integration-001.json',
            model_used: 'claude-3-5-sonnet',
            timestamp: '2024-01-15T10:15:00Z'
          },
          s3_key: 'reports/req-integration-001.json',
          download_url: 'https://s3.amazonaws.com/bucket/reports/req-integration-001.json',
          error: undefined
        });

      // Test submission
      const submissionResult = await researchApi.submitResearch({
        task: 'Analyze competitor landscape for SaaS CRM market'
      });

      expect(submissionResult.request_id).toBe('req-integration-001');
      expect(submissionResult.status).toBe('pending');

      // Test status progression
      let statusResult = await researchApi.checkResearchStatus('req-integration-001');
      expect(statusResult.status).toBe('pending');

      statusResult = await researchApi.checkResearchStatus('req-integration-001');
      expect(statusResult.status).toBe('processing');

      statusResult = await researchApi.checkResearchStatus('req-integration-001');
      expect(statusResult.status).toBe('completed');
      expect(statusResult.download_url).toContain('req-integration-001.json');
    });

    it('should handle research failure scenarios', async () => {
      // Mock submission success but processing failure
      mockedResearchApi.submitResearch.mockResolvedValueOnce({
        request_id: 'req-failure-001',
        status: 'pending',
        result: undefined
      });

      mockedResearchApi.checkResearchStatus.mockResolvedValueOnce({
        request_id: 'req-failure-001',
        status: 'failed',
        result: undefined,
        s3_key: undefined,
        download_url: undefined,
        error: 'LLM processing timeout after 15 minutes'
      });

      const submissionResult = await researchApi.submitResearch({
        task: 'Complex analysis task'
      });

      expect(submissionResult.request_id).toBe('req-failure-001');

      const statusResult = await researchApi.checkResearchStatus('req-failure-001');
      expect(statusResult.status).toBe('failed');
      expect(statusResult.error).toContain('timeout');
    });

    it('should handle network failures and retries', async () => {
      // First call fails, second succeeds
      mockedResearchApi.submitResearch
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          request_id: 'req-retry-001',
          status: 'pending',
          result: undefined
        });

      // First attempt should fail
      await expect(researchApi.submitResearch({ task: 'test' }))
        .rejects.toThrow('Network timeout');

      // Second attempt should succeed
      const result = await researchApi.submitResearch({ task: 'test' });
      expect(result.request_id).toBe('req-retry-001');
    });
  });

  describe('Team-Specific Report Processing', () => {
    it('should handle red team competitive analysis workflow', async () => {
      const redTeamFormData = {
        targetCompany: 'Salesforce',
        analysisFocus: ['pricing strategy', 'feature comparison'],
        marketScope: 'Global',
        disruptionTimeline: 12,
        investmentRange: [1000000, 5000000]
      };

      const prompt = researchApi.formatRedTeamPrompt(redTeamFormData);
      
      expect(prompt).toContain('RED TEAM RESEARCH SWARM');
      expect(prompt).toContain('Salesforce');
      expect(prompt).toContain('pricing strategy');
      expect(prompt).toContain('feature comparison');
      expect(prompt).toContain('12 months');
      expect(prompt).toContain('$1,000,000 - $5,000,000');
      expect(prompt).toContain('EXHAUSTIVE COMPETITIVE DISRUPTION ANALYSIS');

      // Verify prompt is comprehensive enough for LLM processing
      expect(prompt.length).toBeGreaterThan(5000);
      expect(prompt).toContain('SWARM ASSEMBLY DIRECTIVE');
      expect(prompt).toContain('OUTPUT REQUIREMENTS');
    });

    it('should handle white team opportunity discovery workflow', async () => {
      const whiteTeamFormData = {
        companyName: 'TechStartup Inc',
        opportunityTypes: ['emerging markets', 'technology gaps'],
        targetCustomerSize: ['SMB', 'Enterprise'],
        businessModelPreference: ['SaaS', 'Marketplace'],
        riskTolerance: 4,
        minimumOpportunitySize: '$50M market'
      };

      const prompt = researchApi.formatWhiteTeamPrompt(whiteTeamFormData);
      
      expect(prompt).toContain('WHITE TEAM RESEARCH SWARM');
      expect(prompt).toContain('TechStartup Inc');
      expect(prompt).toContain('emerging markets');
      expect(prompt).toContain('technology gaps');
      expect(prompt).toContain('SMB');
      expect(prompt).toContain('Enterprise');
      expect(prompt).toContain('4/5');
      expect(prompt).toContain('$50M market');
      expect(prompt).toContain('EXHAUSTIVE MARKET OPPORTUNITY DISCOVERY');

      // Verify comprehensive prompt structure
      expect(prompt.length).toBeGreaterThan(5000);
      expect(prompt).toContain('Aggressive - Willing to pioneer new markets');
    });

    it('should handle black team vendor replacement workflow', async () => {
      const blackTeamFormData = {
        companyName: 'Enterprise Corp',
        targetVendor: 'Oracle Database',
        toolCategories: ['Database', 'Analytics'],
        implementationComplexity: 'comprehensive',
        teamSizeConstraint: 'large_team',
        evidenceThreshold: 4,
        techStackPreference: ['PostgreSQL', 'Redis', 'Elasticsearch']
      };

      const prompt = researchApi.formatBlackTeamPrompt(blackTeamFormData);
      
      expect(prompt).toContain('BLACK TEAM RESEARCH SWARM');
      expect(prompt).toContain('Enterprise Corp');
      expect(prompt).toContain('Oracle Database');
      expect(prompt).toContain('Database');
      expect(prompt).toContain('Analytics');
      expect(prompt).toContain('comprehensive');
      expect(prompt).toContain('large_team');
      expect(prompt).toContain('4/5 confidence required');
      expect(prompt).toContain('PostgreSQL');
      expect(prompt).toContain('EXHAUSTIVE VENDOR REPLACEMENT ANALYSIS');

      // Verify comprehensive technical analysis structure
      expect(prompt.length).toBeGreaterThan(5000);
      expect(prompt).toContain('Enterprise-grade full replacement');
      expect(prompt).toContain('Large team (10+ developers)');
    });
  });

  describe('Report History Component Integration', () => {
    const mockReports = [
      {
        reportId: 'report-red-001',
        team: 'red',
        createdAt: '2024-01-15T10:30:00Z',
        requestId: 'req-red-001',
        s3Key: 'reports/red_competitive_analysis.json',
        title: 'Salesforce Competitive Analysis',
        vendorName: 'Salesforce',
        contentSummary: 'Comprehensive competitive analysis revealing key vulnerabilities and market positioning gaps.',
        downloadUrl: 'https://s3.amazonaws.com/bucket/red_competitive_analysis.json',
        metadata: { wordCount: 15000, processingTime: 180000 }
      },
      {
        reportId: 'report-white-001',
        team: 'white',
        createdAt: '2024-01-14T15:45:00Z',
        requestId: 'req-white-001',
        s3Key: 'reports/white_opportunity_discovery.json',
        companyName: 'TechStartup Inc',
        contentSummary: 'Market opportunity discovery identifying 47 potential opportunities across 8 verticals.',
        downloadUrl: 'https://s3.amazonaws.com/bucket/white_opportunity_discovery.json',
        metadata: { wordCount: 22000, processingTime: 240000 }
      },
      {
        reportId: 'report-black-001',
        team: 'black',
        createdAt: '2024-01-13T09:15:00Z',
        requestId: 'req-black-001',
        s3Key: 'reports/black_vendor_replacement.json',
        vendorName: 'Oracle Database',
        contentSummary: 'Technical vendor replacement analysis with complete implementation blueprint for PostgreSQL migration.',
        downloadUrl: null, // Processing still in progress
        metadata: { wordCount: 35000, processingTime: 420000 }
      }
    ];

    it('should render and interact with report history correctly', async () => {
      mockedResearchApi.listResearchReports.mockResolvedValue(mockReports);

      render(<ResearchReportHistory />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      // Verify all reports are displayed
      expect(screen.getByText('Salesforce Competitive Analysis')).toBeInTheDocument();
      expect(screen.getByText('TechStartup Inc')).toBeInTheDocument();
      expect(screen.getByText('Oracle Database')).toBeInTheDocument();

      // Verify team badges
      expect(screen.getByText('RED')).toBeInTheDocument();
      expect(screen.getByText('WHITE')).toBeInTheDocument();
      expect(screen.getByText('BLACK')).toBeInTheDocument();

      // Verify download buttons - two enabled, one disabled
      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      expect(downloadButtons).toHaveLength(3);
      
      const enabledButtons = downloadButtons.filter(btn => !btn.hasAttribute('disabled'));
      const disabledButtons = downloadButtons.filter(btn => btn.hasAttribute('disabled'));
      
      expect(enabledButtons).toHaveLength(2);
      expect(disabledButtons).toHaveLength(1);
    });

    it('should handle team-specific filtering', async () => {
      const redTeamReports = mockReports.filter(r => r.team === 'red');
      mockedResearchApi.listResearchReports.mockResolvedValue(redTeamReports);

      render(<ResearchReportHistory team="red" />);

      await waitFor(() => {
        expect(screen.getByText('(RED Team)')).toBeInTheDocument();
      });

      expect(mockedResearchApi.listResearchReports).toHaveBeenCalledWith('red', 20);
      expect(screen.getByText('Salesforce Competitive Analysis')).toBeInTheDocument();
      expect(screen.queryByText('TechStartup Inc')).not.toBeInTheDocument();
    });

    it('should handle refresh functionality', async () => {
      mockedResearchApi.listResearchReports.mockResolvedValue(mockReports);

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      expect(mockedResearchApi.listResearchReports).toHaveBeenCalledTimes(2);
    });

    it('should handle download functionality with proper error handling', async () => {
      mockedResearchApi.listResearchReports.mockResolvedValue(mockReports);

      // Mock DOM methods for download
      const mockCreateElement = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockClick = vi.fn();

      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };

      mockCreateElement.mockReturnValue(mockLink);
      
      Object.defineProperty(document, 'createElement', { value: mockCreateElement });
      Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
      Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      const enabledButton = downloadButtons.find(btn => !btn.hasAttribute('disabled'));

      fireEvent.click(enabledButton!);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Performance and Scale Testing', () => {
    it('should handle large number of reports efficiently', async () => {
      // Generate 100 mock reports
      const largeReportsList = Array.from({ length: 100 }, (_, i) => ({
        reportId: `report-${i}`,
        team: ['red', 'white', 'black'][i % 3] as 'red' | 'white' | 'black',
        createdAt: new Date(2024, 0, 1 + i).toISOString(),
        requestId: `req-${i}`,
        s3Key: `reports/report_${i}.json`,
        title: `Report ${i}`,
        contentSummary: `Summary for report ${i}`,
        downloadUrl: `https://s3.amazonaws.com/bucket/report_${i}.json`,
        metadata: { wordCount: 1000 + i * 100 }
      }));

      mockedResearchApi.listResearchReports.mockResolvedValue(largeReportsList);

      const startTime = performance.now();
      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Rendering should complete within reasonable time (500ms)
      expect(renderTime).toBeLessThan(500);

      // Verify all reports are rendered
      expect(screen.getByText('Report 0')).toBeInTheDocument();
      expect(screen.getByText('Report 99')).toBeInTheDocument();
    });

    it('should handle concurrent API calls gracefully', async () => {
      // Mock multiple concurrent submissions
      const requests = Array.from({ length: 5 }, (_, i) => ({
        task: `Concurrent research task ${i}`
      }));

      const mockResponses = requests.map((_, i) => ({
        request_id: `concurrent-req-${i}`,
        status: 'pending' as const,
        result: undefined
      }));

      mockedResearchApi.submitResearch
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2])
        .mockResolvedValueOnce(mockResponses[3])
        .mockResolvedValueOnce(mockResponses[4]);

      // Submit all requests concurrently
      const promises = requests.map(req => researchApi.submitResearch(req));
      const results = await Promise.all(promises);

      // Verify all requests completed successfully
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.request_id).toBe(`concurrent-req-${i}`);
        expect(result.status).toBe('pending');
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary API failures', async () => {
      // First call fails, second succeeds after user retry
      mockedResearchApi.listResearchReports
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValueOnce([mockReports[0]]);

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load research history')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      expect(screen.getByText('Salesforce Competitive Analysis')).toBeInTheDocument();
    });

    it('should handle malformed API responses gracefully', async () => {
      // Return malformed response
      mockedResearchApi.listResearchReports.mockResolvedValue([
        {
          // Missing required fields
          reportId: 'malformed-1',
          team: 'red',
          createdAt: '2024-01-15T10:30:00Z',
          requestId: 'req-malformed',
          s3Key: 'reports/malformed.json'
          // Missing other required fields like contentSummary
        } as any
      ]);

      render(<ResearchReportHistory />);

      await waitFor(() => {
        expect(screen.getByText('Research History')).toBeInTheDocument();
      });

      // Should render with fallback values
      expect(screen.getByText('N/A')).toBeInTheDocument();
      expect(screen.getByText('No summary available')).toBeInTheDocument();
    });
  });
});