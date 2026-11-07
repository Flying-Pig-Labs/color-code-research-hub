import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  submitResearch, 
  checkResearchStatus, 
  listResearchReports,
  formatRedTeamPrompt, 
  formatWhiteTeamPrompt, 
  formatBlackTeamPrompt,
  type ResearchReport 
} from '../researchApi';

describe('researchApi', () => {
  const mockFetch = vi.fn();
  const mockBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitResearch', () => {
    it('should submit research request successfully', async () => {
      const mockResponse = {
        success: true,
        request_id: 'req-123',
        status: 'pending' as const,
        metadata: {
          title: 'Research Request',
          requester: 'user',
          tags: ['research'],
          model: 'sonar-deep-research',
          reasoning_effort: 'low'
        },
        timestamp: '2024-01-01T00:00:00Z'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });
      
      const result = await submitResearch({ task: 'Research competitive landscape' });
      
      expect(result).toEqual({
        request_id: 'req-123',
        status: 'pending',
        result: {
          metadata: mockResponse.metadata,
          timestamp: mockResponse.timestamp
        }
      });
      
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/api/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Research competitive landscape',
          title: 'Research Request',
          model: 'sonar-deep-research',
          reasoning_effort: 'low'
        })
      });
    });

    it('should handle submission errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      await expect(submitResearch({ task: 'Research task' }))
        .rejects.toThrow('Research submission failed: Internal Server Error');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(submitResearch({ task: 'Research task' }))
        .rejects.toThrow('Network error');
    });

    it('should handle response without metadata', async () => {
      const mockResponse = {
        success: true,
        request_id: 'req-123',
        status: 'processing' as const,
        timestamp: '2024-01-01T00:00:00Z'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });
      
      const result = await submitResearch({ task: 'Research task' });
      
      expect(result).toEqual({
        request_id: 'req-123',
        status: 'processing',
        result: undefined
      });
    });
  });

  describe('checkResearchStatus', () => {
    it('should check status of pending request', async () => {
      const mockResponse = {
        success: true,
        request_id: 'req-123',
        status: 'processing' as const,
        timestamp: '2024-01-01T00:00:00Z'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });
      
      const result = await checkResearchStatus('req-123');
      
      expect(result).toEqual({
        request_id: 'req-123',
        status: 'processing',
        result: undefined,
        error: undefined
      });
      
      expect(mockFetch).toHaveBeenCalledWith(`${mockBaseUrl}/api/research/status/req-123`);
    });

    it('should return completed research with content', async () => {
      const mockResponse = {
        success: true,
        request_id: 'req-123',
        status: 'completed' as const,
        content: 'Research findings...',
        s3_location: 's3://bucket/req-123.json',
        model_used: 'sonar-deep-research',
        timestamp: '2024-01-01T00:05:00Z'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });
      
      const result = await checkResearchStatus('req-123');
      
      expect(result).toEqual({
        request_id: 'req-123',
        status: 'completed',
        result: {
          content: 'Research findings...',
          s3_location: 's3://bucket/req-123.json',
          model_used: 'sonar-deep-research',
          timestamp: '2024-01-01T00:05:00Z'
        },
        error: undefined
      });
    });

    it('should handle failed research with error', async () => {
      const mockResponse = {
        success: false,
        request_id: 'req-123',
        status: 'failed' as const,
        error: 'Research failed due to timeout',
        timestamp: '2024-01-01T00:05:00Z'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });
      
      const result = await checkResearchStatus('req-123');
      
      expect(result).toEqual({
        request_id: 'req-123',
        status: 'failed',
        result: undefined,
        error: 'Research failed due to timeout'
      });
    });

    it('should handle status check errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(checkResearchStatus('req-123'))
        .rejects.toThrow('Status check failed: Not Found');
    });
  });

  describe('formatRedTeamPrompt', () => {
    it('should format red team prompt with all parameters', () => {
      const formData = {
        targetCompany: 'Acme Corp',
        analysisFocus: ['Market share', 'Technology stack', 'Customer base'],
        marketScope: 'custom',
        customCountries: ['USA', 'Canada', 'UK'],
        disruptionTimeline: 6,
        investmentRange: [500000, 2000000],
        targetMarketSize: ['$10M-$50M', '$50M-$100M'],
        competitiveIntensity: 'High',
        disruptionStrategy: 'Technology disruption',
        industryVerticals: ['SaaS', 'FinTech'],
        customKeywords: ['AI', 'Machine Learning', 'Automation']
      };
      
      const prompt = formatRedTeamPrompt(formData);
      
      expect(prompt).toContain('TARGET COMPANY: Acme Corp');
      expect(prompt).toContain('• Market share');
      expect(prompt).toContain('• Technology stack');
      expect(prompt).toContain('• Customer base');
      expect(prompt).toContain('CUSTOM COUNTRIES: USA, Canada, UK');
      expect(prompt).toContain('Timeline: 6 months');
      expect(prompt).toContain('Investment Range: $500,000 - $2,000,000');
      expect(prompt).toContain('Target Market Size: $10M-$50M, $50M-$100M');
      expect(prompt).toContain('Competitive Intensity: High');
      expect(prompt).toContain('Disruption Strategy: Technology disruption');
      expect(prompt).toContain('• SaaS');
      expect(prompt).toContain('• FinTech');
      expect(prompt).toContain('• AI');
      expect(prompt).toContain('• Machine Learning');
      expect(prompt).toContain('• Automation');
      expect(prompt).toContain('URGENT - But DO NOT sacrifice completeness for speed');
    });

    it('should handle missing optional parameters', () => {
      const formData = {};
      
      const prompt = formatRedTeamPrompt(formData);
      
      expect(prompt).toContain('TARGET COMPANY: Not specified');
      expect(prompt).toContain('• Comprehensive competitive analysis');
      expect(prompt).toContain('MARKET SCOPE: Global');
      expect(prompt).toContain('Timeline: 12 months');
      expect(prompt).toContain('Investment Range: $100,000 - $1,000,000');
      expect(prompt).toContain('Target Market Size: All market sizes');
      expect(prompt).toContain('Competitive Intensity: Medium');
      expect(prompt).toContain('Disruption Strategy: Market differentiation');
      expect(prompt).toContain('• Cross-industry analysis');
      expect(prompt).toContain('• No custom keywords specified');
    });
  });

  describe('formatWhiteTeamPrompt', () => {
    it('should format white team prompt with all parameters', () => {
      const formData = {
        companyName: 'Innovation Labs',
        opportunityTypes: ['New markets', 'Product extensions', 'Platform plays'],
        targetCustomerSize: ['Enterprise', 'Mid-market'],
        businessModelPreference: ['SaaS', 'Marketplace'],
        technicalApproach: 'cutting_edge',
        marketEntrySpeed: 'immediate',
        competitiveLandscape: 'Low competition',
        minimumOpportunitySize: '$100M+',
        successMetrics: ['Revenue potential', 'Market share', 'User adoption'],
        riskTolerance: 5,
        ecosystemIntegration: ['API-first', 'Cloud-native'],
        customSearchAreas: ['Climate tech', 'Web3', 'Healthcare AI']
      };
      
      const prompt = formatWhiteTeamPrompt(formData);
      
      expect(prompt).toContain('COMPANY NAME: Innovation Labs');
      expect(prompt).toContain('• New markets');
      expect(prompt).toContain('• Product extensions');
      expect(prompt).toContain('• Platform plays');
      expect(prompt).toContain('• Enterprise');
      expect(prompt).toContain('• Mid-market');
      expect(prompt).toContain('• SaaS');
      expect(prompt).toContain('• Marketplace');
      expect(prompt).toContain('Technical Approach: cutting_edge');
      expect(prompt).toContain('Market Entry Speed: immediate');
      expect(prompt).toContain('Competitive Landscape: Low competition');
      expect(prompt).toContain('Minimum Opportunity Size: $100M+');
      expect(prompt).toContain('1. Revenue potential');
      expect(prompt).toContain('2. Market share');
      expect(prompt).toContain('3. User adoption');
      expect(prompt).toContain('Risk Tolerance Level: 5/5');
      expect(prompt).toContain('Aggressive - Willing to pioneer new markets');
      expect(prompt).toContain('• API-first');
      expect(prompt).toContain('• Cloud-native');
      expect(prompt).toContain('• Climate tech');
      expect(prompt).toContain('• Web3');
      expect(prompt).toContain('• Healthcare AI');
      expect(prompt).toContain('Bleeding edge technology opportunities');
      expect(prompt).toContain('URGENT - Quick wins needed');
      expect(prompt).toContain('Focus on opportunities with $100M+ market potential');
    });
  });

  describe('formatBlackTeamPrompt', () => {
    it('should format black team prompt with all parameters', () => {
      const formData = {
        companyName: 'Tech Innovators',
        targetVendor: 'LegacySystem Pro',
        existingTools: ['CRM', 'Analytics', 'Workflow'],
        toolCategories: ['Customer Management', 'Data Analysis', 'Process Automation'],
        informationSources: {
          public_documentation: true,
          api_documentation: true,
          github_repositories: true,
          stack_overflow: true,
          community_forums: false
        },
        implementationComplexity: 'comprehensive',
        teamSizeConstraint: 'large_team',
        timeToMarket: 'Fast track',
        evidenceThreshold: 4,
        techStackPreference: ['Python', 'React', 'PostgreSQL'],
        costComparisonBaseline: 'custom_threshold',
        customCostThreshold: 50000
      };
      
      const prompt = formatBlackTeamPrompt(formData);
      
      expect(prompt).toContain('COMPANY NAME: Tech Innovators');
      expect(prompt).toContain('TARGET VENDOR: LegacySystem Pro');
      expect(prompt).toContain('EXISTING TOOLS IN USE: CRM, Analytics, Workflow');
      expect(prompt).toContain('• Customer Management');
      expect(prompt).toContain('• Data Analysis');
      expect(prompt).toContain('• Process Automation');
      expect(prompt).toContain('• Public Documentation');
      expect(prompt).toContain('• Api Documentation');
      expect(prompt).toContain('• Github Repositories');
      expect(prompt).toContain('• Stack Overflow');
      expect(prompt).not.toContain('• Community Forums');
      expect(prompt).toContain('Complexity Level: comprehensive');
      expect(prompt).toContain('Team Size: large_team');
      expect(prompt).toContain('Time to Market: Fast track');
      expect(prompt).toContain('Evidence Threshold: 4/5 confidence required');
      expect(prompt).toContain('• Python');
      expect(prompt).toContain('• React');
      expect(prompt).toContain('• PostgreSQL');
      expect(prompt).toContain('Custom Threshold: $50,000');
      expect(prompt).toContain('Below custom threshold');
      expect(prompt).toContain('Large team (10+ developers)');
      expect(prompt).toContain('Enterprise-grade full replacement');
      expect(prompt).toContain('High confidence - Extensive proof required');
    });

    it('should handle default values correctly', () => {
      const formData = {
        teamSizeConstraint: 'solo_developer',
        implementationComplexity: 'minimal',
        evidenceThreshold: 1
      };
      
      const prompt = formatBlackTeamPrompt(formData);
      
      expect(prompt).toContain('Single developer implementation');
      expect(prompt).toContain('MVP - Quick prototype');
      expect(prompt).toContain('Low threshold - Rapid prototyping acceptable');
    });
  });

  describe('listResearchReports', () => {
    const mockReports: ResearchReport[] = [
      {
        reportId: 'report-1',
        team: 'red',
        createdAt: '2024-01-15T10:30:00Z',
        requestId: 'req-1',
        s3Key: 'reports/red_report_1.json',
        title: 'Competitive Analysis',
        vendorName: 'Competitor Corp',
        contentSummary: 'Analysis of competitive landscape',
        downloadUrl: 'https://s3.amazonaws.com/bucket/report1.json',
        metadata: { wordCount: 1500 }
      },
      {
        reportId: 'report-2',
        team: 'white',
        createdAt: '2024-01-14T15:45:00Z',
        requestId: 'req-2',
        s3Key: 'reports/white_report_2.json',
        companyName: 'Innovation Inc',
        contentSummary: 'Market opportunity analysis',
        downloadUrl: 'https://s3.amazonaws.com/bucket/report2.json',
        metadata: { wordCount: 2200 }
      }
    ];

    it('should list all research reports', async () => {
      const mockResponse = {
        success: true,
        reports: mockReports,
        total: 2
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await listResearchReports();

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/research/reports?limit=50`
      );

      expect(result).toEqual(mockReports);
    });

    it('should list reports filtered by team', async () => {
      const redTeamReports = mockReports.filter(r => r.team === 'red');
      const mockResponse = {
        success: true,
        reports: redTeamReports,
        total: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await listResearchReports('red', 20);

      expect(mockFetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/research/reports?team=red&limit=20`
      );

      expect(result).toEqual(redTeamReports);
    });

    it('should handle empty reports list', async () => {
      const mockResponse = {
        success: true,
        reports: [],
        total: 0
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await listResearchReports();

      expect(result).toEqual([]);
    });

    it('should handle missing reports array in response', async () => {
      const mockResponse = {
        success: true,
        total: 0
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await listResearchReports();

      expect(result).toEqual([]);
    });

    it('should handle list reports HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      await expect(listResearchReports()).rejects.toThrow(
        'Failed to list reports: Internal Server Error'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(submitResearch({ task: 'test' })).rejects.toThrow('Invalid JSON');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(submitResearch({ task: 'test' })).rejects.toThrow('Request timeout');
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          // Missing required fields
          success: true
        })
      });

      const result = await submitResearch({ task: 'test' });

      expect(result.request_id).toBeUndefined();
      expect(result.status).toBeUndefined();
    });

    it('should handle empty environment variable gracefully', async () => {
      const originalEnv = import.meta.env.VITE_API_BASE_URL;
      
      // Temporarily clear the env var
      Object.defineProperty(import.meta.env, 'VITE_API_BASE_URL', {
        value: '',
        configurable: true
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, request_id: 'test', status: 'pending' })
      });

      await submitResearch({ task: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/research',
        expect.any(Object)
      );

      // Restore original env
      Object.defineProperty(import.meta.env, 'VITE_API_BASE_URL', {
        value: originalEnv,
        configurable: true
      });
    });
  });
});