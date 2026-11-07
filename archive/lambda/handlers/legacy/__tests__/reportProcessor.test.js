const { vi, expect, describe, it, beforeEach, afterEach } = require('vitest');
const AWS = require('aws-sdk');

// Mock AWS services
vi.mock('aws-sdk');
const mockS3 = {
  upload: vi.fn(),
  getSignedUrl: vi.fn(),
  putObject: vi.fn()
};
const mockCloudWatchLogs = {
  createLogGroup: vi.fn(),
  createLogStream: vi.fn(),
  putLogEvents: vi.fn()
};

AWS.S3.mockImplementation(() => mockS3);
AWS.CloudWatchLogs.mockImplementation(() => mockCloudWatchLogs);

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk');
const mockAnthropic = {
  messages: {
    create: vi.fn()
  }
};

const Anthropic = require('@anthropic-ai/sdk');
Anthropic.mockImplementation(() => mockAnthropic);

// Import the module to test (we'll create this)
const reportProcessor = require('../reportProcessor');

describe('Report Processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.S3_BUCKET = 'test-research-reports';
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('strip_think_blocks', () => {
    it('should remove <think> blocks from content', () => {
      const input = `Here is some content.
<think>
This is internal thinking that should be removed.
It can span multiple lines.
</think>
And here is more content.`;

      const expected = `Here is some content.

And here is more content.`;

      const result = reportProcessor.strip_think_blocks(input);
      expect(result).toBe(expected);
    });

    it('should remove multiple <think> blocks', () => {
      const input = `Content 1
<think>Think 1</think>
Content 2
<think>Think 2</think>
Content 3`;

      const expected = `Content 1

Content 2

Content 3`;

      const result = reportProcessor.strip_think_blocks(input);
      expect(result).toBe(expected);
    });

    it('should handle nested or malformed think blocks', () => {
      const input = `Content before
<think>Outer think
<think>Inner think</think>
Back to outer
</think>
Content after`;

      const result = reportProcessor.strip_think_blocks(input);
      expect(result).toContain('Content before');
      expect(result).toContain('Content after');
      expect(result).not.toContain('<think>');
      expect(result).not.toContain('</think>');
    });

    it('should handle content without think blocks', () => {
      const input = 'Just regular content without any think blocks.';
      const result = reportProcessor.strip_think_blocks(input);
      expect(result).toBe(input);
    });

    it('should handle empty content', () => {
      const result = reportProcessor.strip_think_blocks('');
      expect(result).toBe('');
    });

    it('should handle null and undefined input', () => {
      expect(reportProcessor.strip_think_blocks(null)).toBe('');
      expect(reportProcessor.strip_think_blocks(undefined)).toBe('');
    });
  });

  describe('formatPromptForTeam', () => {
    it('should format red team prompt correctly', () => {
      const formData = {
        targetCompany: 'Example Corp',
        analysisFocus: ['competitive analysis', 'market positioning'],
        marketScope: 'Global',
        disruptionTimeline: 12,
        investmentRange: [100000, 1000000]
      };

      const result = reportProcessor.formatPromptForTeam('red', formData);
      
      expect(result).toContain('RED TEAM RESEARCH SWARM');
      expect(result).toContain('Example Corp');
      expect(result).toContain('competitive analysis');
      expect(result).toContain('market positioning');
      expect(result).toContain('Global');
      expect(result).toContain('12 months');
      expect(result).toContain('$100,000 - $1,000,000');
    });

    it('should format white team prompt correctly', () => {
      const formData = {
        companyName: 'Innovation Inc',
        opportunityTypes: ['emerging markets', 'technology gaps'],
        targetCustomerSize: ['SMB', 'Enterprise'],
        businessModelPreference: ['SaaS', 'Marketplace']
      };

      const result = reportProcessor.formatPromptForTeam('white', formData);
      
      expect(result).toContain('WHITE TEAM RESEARCH SWARM');
      expect(result).toContain('Innovation Inc');
      expect(result).toContain('emerging markets');
      expect(result).toContain('technology gaps');
      expect(result).toContain('SMB');
      expect(result).toContain('Enterprise');
      expect(result).toContain('SaaS');
      expect(result).toContain('Marketplace');
    });

    it('should format black team prompt correctly', () => {
      const formData = {
        companyName: 'Tech Solutions',
        targetVendor: 'Legacy Vendor',
        toolCategories: ['CRM', 'Analytics'],
        implementationComplexity: 'Medium',
        teamSizeConstraint: 'small_team'
      };

      const result = reportProcessor.formatPromptForTeam('black', formData);
      
      expect(result).toContain('BLACK TEAM RESEARCH SWARM');
      expect(result).toContain('Tech Solutions');
      expect(result).toContain('Legacy Vendor');
      expect(result).toContain('CRM');
      expect(result).toContain('Analytics');
      expect(result).toContain('Medium');
      expect(result).toContain('Small team');
    });

    it('should handle unknown team type', () => {
      const formData = { companyName: 'Test' };
      const result = reportProcessor.formatPromptForTeam('unknown', formData);
      
      expect(result).toContain('RESEARCH SWARM');
      expect(result).toContain('Test');
    });

    it('should handle missing form data gracefully', () => {
      const result = reportProcessor.formatPromptForTeam('red', {});
      
      expect(result).toContain('RED TEAM RESEARCH SWARM');
      expect(result).toContain('Not specified');
    });
  });

  describe('processResearchReport', () => {
    it('should process a complete report successfully', async () => {
      const mockResponse = {
        content: [{
          text: `<think>Internal processing thoughts</think>
# Research Report

## Executive Summary
This is a comprehensive analysis.

## Key Findings
- Finding 1
- Finding 2

## Recommendations
Strategic recommendations here.`
        }]
      };

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      mockS3.upload.mockImplementation().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Location: 'https://s3.amazonaws.com/bucket/report.json',
          Key: 'reports/test-report.json'
        })
      });

      const requestData = {
        team: 'red',
        task: 'Analyze competitor X',
        formData: { targetCompany: 'Competitor X' },
        requestId: 'test-123'
      };

      const result = await reportProcessor.processResearchReport(requestData);

      expect(result).toEqual({
        success: true,
        requestId: 'test-123',
        s3Location: 'https://s3.amazonaws.com/bucket/report.json',
        s3Key: 'reports/test-report.json',
        contentSummary: 'This is a comprehensive analysis.',
        wordCount: expect.any(Number),
        processingTime: expect.any(Number)
      });

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: expect.stringContaining('RED TEAM RESEARCH SWARM')
        }]
      });

      expect(mockS3.upload).toHaveBeenCalledWith({
        Bucket: 'test-research-reports',
        Key: expect.stringMatching(/^reports\/red_\d+\.json$/),
        Body: expect.any(String),
        ContentType: 'application/json',
        Metadata: {
          team: 'red',
          requestId: 'test-123',
          originalTask: 'Analyze competitor X'
        }
      });
    });

    it('should handle LLM API timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'TIMEOUT';
      
      mockAnthropic.messages.create.mockRejectedValue(timeoutError);

      const requestData = {
        team: 'white',
        task: 'Find opportunities',
        formData: {},
        requestId: 'timeout-test'
      };

      const result = await reportProcessor.processResearchReport(requestData);

      expect(result).toEqual({
        success: false,
        requestId: 'timeout-test',
        error: 'LLM request timeout - please try again',
        errorType: 'TIMEOUT'
      });
    });

    it('should handle S3 upload failure', async () => {
      const mockResponse = {
        content: [{ text: '# Report\nContent here.' }]
      };

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      
      const s3Error = new Error('S3 upload failed');
      mockS3.upload.mockImplementation().mockReturnValue({
        promise: vi.fn().mockRejectedValue(s3Error)
      });

      const requestData = {
        team: 'black',
        task: 'Vendor analysis',
        formData: {},
        requestId: 's3-fail-test'
      };

      const result = await reportProcessor.processResearchReport(requestData);

      expect(result).toEqual({
        success: false,
        requestId: 's3-fail-test',
        error: 'Failed to save report to S3: S3 upload failed',
        errorType: 'S3_ERROR'
      });
    });

    it('should handle malformed LLM response', async () => {
      const mockResponse = {
        content: [] // Empty content array
      };

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const requestData = {
        team: 'red',
        task: 'Test task',
        formData: {},
        requestId: 'malformed-test'
      };

      const result = await reportProcessor.processResearchReport(requestData);

      expect(result).toEqual({
        success: false,
        requestId: 'malformed-test',
        error: 'LLM returned empty or invalid response',
        errorType: 'INVALID_RESPONSE'
      });
    });

    it('should generate proper S3 key with timestamp', async () => {
      const mockResponse = {
        content: [{ text: '# Test Report\nContent' }]
      };

      const fixedDate = new Date('2024-01-15T10:30:00Z');
      vi.useFakeTimers();
      vi.setSystemTime(fixedDate);

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      mockS3.upload.mockImplementation().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Location: 'https://s3.amazonaws.com/bucket/report.json',
          Key: 'reports/test-report.json'
        })
      });

      const requestData = {
        team: 'white',
        task: 'Test',
        formData: {},
        requestId: 'key-test'
      };

      await reportProcessor.processResearchReport(requestData);

      expect(mockS3.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringMatching(/^reports\/white_20240115_103000_key-test\.json$/)
        })
      );

      vi.useRealTimers();
    });
  });

  describe('generateDownloadUrl', () => {
    it('should generate signed URL for S3 object', async () => {
      const mockSignedUrl = 'https://s3.amazonaws.com/bucket/report.json?signature=abc123';
      mockS3.getSignedUrl.mockImplementation((operation, params, callback) => {
        callback(null, mockSignedUrl);
      });

      const result = await reportProcessor.generateDownloadUrl('reports/test-report.json');

      expect(result).toBe(mockSignedUrl);
      expect(mockS3.getSignedUrl).toHaveBeenCalledWith(
        'getObject',
        {
          Bucket: 'test-research-reports',
          Key: 'reports/test-report.json',
          Expires: 3600 // 1 hour
        },
        expect.any(Function)
      );
    });

    it('should handle S3 signed URL error', async () => {
      const s3Error = new Error('Access denied');
      mockS3.getSignedUrl.mockImplementation((operation, params, callback) => {
        callback(s3Error, null);
      });

      await expect(reportProcessor.generateDownloadUrl('reports/test.json'))
        .rejects.toThrow('Access denied');
    });
  });

  describe('extractContentSummary', () => {
    it('should extract first paragraph as summary', () => {
      const content = `# Title

This is the first paragraph that should become the summary.

This is the second paragraph that should not be included.

## Section
More content here.`;

      const result = reportProcessor.extractContentSummary(content);
      expect(result).toBe('This is the first paragraph that should become the summary.');
    });

    it('should handle content without clear paragraphs', () => {
      const content = '# Title\n\nBrief content only.';
      const result = reportProcessor.extractContentSummary(content);
      expect(result).toBe('Brief content only.');
    });

    it('should truncate long summaries', () => {
      const longText = 'A'.repeat(300);
      const content = `# Title\n\n${longText}\n\nMore content.`;
      
      const result = reportProcessor.extractContentSummary(content);
      expect(result.length).toBeLessThanOrEqual(250);
      expect(result).toContain('...');
    });

    it('should handle empty or undefined content', () => {
      expect(reportProcessor.extractContentSummary('')).toBe('No summary available');
      expect(reportProcessor.extractContentSummary(null)).toBe('No summary available');
      expect(reportProcessor.extractContentSummary(undefined)).toBe('No summary available');
    });
  });

  describe('logToCloudWatch', () => {
    it('should log processing events to CloudWatch', async () => {
      mockCloudWatchLogs.putLogEvents.mockImplementation().mockReturnValue({
        promise: vi.fn().mockResolvedValue({})
      });

      await reportProcessor.logToCloudWatch('test-stream', 'Processing started', {
        requestId: 'test-123',
        team: 'red'
      });

      expect(mockCloudWatchLogs.putLogEvents).toHaveBeenCalledWith({
        logGroupName: '/aws/lambda/report-processor',
        logStreamName: 'test-stream',
        logEvents: [{
          timestamp: expect.any(Number),
          message: JSON.stringify({
            level: 'INFO',
            message: 'Processing started',
            requestId: 'test-123',
            team: 'red',
            timestamp: expect.any(String)
          })
        }]
      });
    });

    it('should handle CloudWatch logging errors gracefully', async () => {
      const logError = new Error('CloudWatch error');
      mockCloudWatchLogs.putLogEvents.mockImplementation().mockReturnValue({
        promise: vi.fn().mockRejectedValue(logError)
      });

      // Should not throw - logging errors should be caught
      await expect(reportProcessor.logToCloudWatch('test', 'message', {}))
        .resolves.not.toThrow();
    });
  });

  describe('validateRequestData', () => {
    it('should validate complete request data', () => {
      const validData = {
        team: 'red',
        task: 'Analyze competitor',
        formData: { targetCompany: 'Test Corp' },
        requestId: 'test-123'
      };

      const result = reportProcessor.validateRequestData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = {
        team: 'red'
        // Missing task, formData, requestId
      };

      const result = reportProcessor.validateRequestData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: task');
      expect(result.errors).toContain('Missing required field: formData');
      expect(result.errors).toContain('Missing required field: requestId');
    });

    it('should validate team type', () => {
      const invalidData = {
        team: 'invalid',
        task: 'Test',
        formData: {},
        requestId: 'test'
      };

      const result = reportProcessor.validateRequestData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid team type: invalid. Must be one of: red, white, black');
    });

    it('should validate request ID format', () => {
      const invalidData = {
        team: 'red',
        task: 'Test',
        formData: {},
        requestId: '' // Empty request ID
      };

      const result = reportProcessor.validateRequestData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Request ID cannot be empty');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete end-to-end processing', async () => {
      const mockResponse = {
        content: [{
          text: `# Complete Research Report

<think>This should be removed</think>

## Executive Summary
This is a thorough analysis of the competitive landscape.

## Methodology
We used exhaustive research methods.

## Key Findings
1. Major competitor has 40% market share
2. Pricing gaps exist in mid-market segment
3. Technology stack is outdated

## Strategic Recommendations
1. Focus on mid-market pricing strategy
2. Leverage modern technology advantages
3. Target specific geographic regions

## Detailed Analysis
[Extensive content would go here...]

## Conclusion
This analysis provides comprehensive insights for strategic decision-making.`
        }]
      };

      mockAnthropic.messages.create.mockResolvedValue(mockResponse);
      mockS3.upload.mockImplementation().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Location: 'https://s3.amazonaws.com/bucket/complete-report.json',
          Key: 'reports/complete-report.json'
        })
      });

      const requestData = {
        team: 'red',
        task: 'Comprehensive competitive analysis of major players in the SaaS CRM space',
        formData: {
          targetCompany: 'Salesforce',
          analysisFocus: ['pricing strategy', 'feature comparison', 'market positioning'],
          marketScope: 'North America',
          disruptionTimeline: 18,
          investmentRange: [500000, 2000000]
        },
        requestId: 'comprehensive-test-001'
      };

      const result = await reportProcessor.processResearchReport(requestData);

      expect(result.success).toBe(true);
      expect(result.contentSummary).toBe('This is a thorough analysis of the competitive landscape.');
      expect(result.wordCount).toBeGreaterThan(50);
      expect(result.s3Location).toContain('complete-report.json');

      // Verify the uploaded content doesn't contain <think> blocks
      const uploadCall = mockS3.upload.mock.calls[0][0];
      const uploadedData = JSON.parse(uploadCall.Body);
      expect(uploadedData.processedContent).not.toContain('<think>');
      expect(uploadedData.processedContent).not.toContain('</think>');
    });

    it('should handle timeout scenarios with retry logic', async () => {
      // First attempt times out
      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'TIMEOUT';
      
      // Second attempt succeeds
      const mockResponse = {
        content: [{ text: '# Retry Success\nThis worked on retry.' }]
      };

      mockAnthropic.messages.create
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(mockResponse);

      mockS3.upload.mockImplementation().mockReturnValue({
        promise: vi.fn().mockResolvedValue({
          Location: 'https://s3.amazonaws.com/bucket/retry-report.json',
          Key: 'reports/retry-report.json'
        })
      });

      const requestData = {
        team: 'white',
        task: 'Opportunity analysis',
        formData: { companyName: 'StartupCorp' },
        requestId: 'retry-test-001'
      };

      const result = await reportProcessor.processResearchReport(requestData, { maxRetries: 1 });

      expect(result.success).toBe(true);
      expect(mockAnthropic.messages.create).toHaveBeenCalledTimes(2);
    });
  });
});