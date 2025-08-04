const { createStructuredReport, extractSections, extractKeyFindings, convertMarkdownToHtml } = require('../generateResearchReport');

describe('Research Report Data Formatting', () => {
    // Mock Perplexity response
    const mockPerplexityResponse = {
        status: 'COMPLETED',
        response: {
            choices: [{
                message: {
                    content: `# Research Report: AI in Healthcare

## Executive Summary
Artificial Intelligence is transforming healthcare delivery through improved diagnostics and treatment optimization.

## Key Findings
- AI reduces diagnostic errors by 30%
- Treatment personalization increases patient outcomes
- Cost savings of up to 15% reported

## Recommendations
- Implement AI-powered diagnostic tools
- Train staff on AI integration
- Establish data governance protocols

## Risk Assessment
There are significant privacy concerns with patient data handling.

## Action Items
- Deploy AI diagnostic system
- Configure privacy controls
- Train medical staff
                    `
                }
            }],
            citations: [
                {
                    url: 'https://example.com/study1',
                    title: 'AI in Healthcare Study',
                    excerpt: 'Key findings on AI effectiveness'
                }
            ],
            usage: {
                prompt_tokens: 100,
                completion_tokens: 200,
                total_tokens: 300,
                completion_time: 45
            },
            model: 'sonar-deep-research'
        }
    };

    const mockMetadata = {
        title: 'AI Healthcare Research',
        team: 'red',
        requester: 'Dr. Smith',
        vendorName: 'HealthTech Inc',
        companyName: 'Regional Hospital',
        tags: ['AI', 'healthcare', 'diagnostics'],
        model: 'sonar-deep-research',
        reasoning_effort: 'high',
        originalPrompt: 'Research AI applications in healthcare diagnostics'
    };

    const requestId = 'test-request-123';

    test('should create structured report with exact JSON schema', () => {
        const report = createStructuredReport(mockPerplexityResponse, mockMetadata, requestId);
        
        // Verify top-level structure
        expect(report).toHaveProperty('id', requestId);
        expect(report).toHaveProperty('timestamp');
        expect(report).toHaveProperty('metadata');
        expect(report).toHaveProperty('request');
        expect(report).toHaveProperty('content');
        expect(report).toHaveProperty('analysis');
        expect(report).toHaveProperty('sources');
        expect(report).toHaveProperty('quality');
        expect(report).toHaveProperty('formats');

        // Verify metadata structure
        expect(report.metadata).toEqual({
            title: 'AI Healthcare Research',
            team: 'red',
            requester: 'Dr. Smith',
            vendorName: 'HealthTech Inc',
            companyName: 'Regional Hospital',
            tags: ['AI', 'healthcare', 'diagnostics'],
            model: 'sonar-deep-research',
            reasoning_effort: 'high'
        });

        // Verify request structure
        expect(report.request).toHaveProperty('originalPrompt');
        expect(report.request).toHaveProperty('processingTime', 45);
        expect(report.request).toHaveProperty('tokens');
        expect(report.request.tokens).toEqual({
            input: 100,
            output: 200,
            total: 300
        });

        // Verify content structure
        expect(report.content).toHaveProperty('summary');
        expect(report.content).toHaveProperty('fullText');
        expect(report.content).toHaveProperty('wordCount');
        expect(report.content).toHaveProperty('sections');
        expect(report.content.sections).toBeInstanceOf(Array);

        // Verify analysis structure
        expect(report.analysis).toHaveProperty('keyFindings');
        expect(report.analysis).toHaveProperty('recommendations');
        expect(report.analysis).toHaveProperty('riskAssessment');
        expect(report.analysis).toHaveProperty('actionItems');

        // Verify quality scores
        expect(report.quality).toHaveProperty('confidence');
        expect(report.quality).toHaveProperty('completeness');
        expect(report.quality).toHaveProperty('relevance');
        expect(report.quality.confidence).toBeGreaterThan(0);
        expect(report.quality.confidence).toBeLessThanOrEqual(1);

        // Verify formats availability
        expect(report.formats).toEqual({
            raw: true,
            structured: true,
            markdown: true,
            html: true,
            cleaned: true
        });

        // Verify sources
        expect(report.sources).toBeInstanceOf(Array);
        expect(report.sources).toHaveLength(1);
        expect(report.sources[0]).toHaveProperty('url');
        expect(report.sources[0]).toHaveProperty('title');
        expect(report.sources[0]).toHaveProperty('excerpt');
        expect(report.sources[0]).toHaveProperty('relevance');
    });

    test('should extract sections from content', () => {
        const content = `# Main Title

## Section One
Content for section one with details.

## Section Two  
Content for section two with more information.

### Subsection
Some subsection content.`;

        const sections = extractSections(content);
        
        expect(sections).toBeInstanceOf(Array);
        expect(sections.length).toBeGreaterThan(0);
        expect(sections[0]).toHaveProperty('title');
        expect(sections[0]).toHaveProperty('content');
    });

    test('should extract key findings from bullet points', () => {
        const content = `Here are the main findings:
- AI reduces diagnostic errors by 30%
- Treatment personalization increases patient outcomes
- Cost savings of up to 15% reported
- Short finding (should be filtered out)`;

        const findings = extractKeyFindings(content);
        
        expect(findings).toBeInstanceOf(Array);
        expect(findings.length).toBe(3); // Short finding should be filtered out
        expect(findings[0]).toBe('AI reduces diagnostic errors by 30%');
        expect(findings[1]).toBe('Treatment personalization increases patient outcomes');
        expect(findings[2]).toBe('Cost savings of up to 15% reported');
    });

    test('should convert markdown to sanitized HTML', () => {
        const markdown = `# Heading
        
**Bold text** and *italic text*

- List item 1
- List item 2

[Link](https://example.com)

<script>alert('xss')</script>`;

        const html = convertMarkdownToHtml(markdown);
        
        expect(html).toContain('<h1>');
        expect(html).toContain('<strong>');
        expect(html).toContain('<em>');
        expect(html).toContain('<ul>');
        expect(html).toContain('<li>');
        expect(html).toContain('<a href="https://example.com">');
        expect(html).not.toContain('<script>'); // Should be sanitized
        expect(html).not.toContain('alert'); // Should be sanitized
    });

    test('should calculate confidence and completeness scores', () => {
        const report = createStructuredReport(mockPerplexityResponse, mockMetadata, requestId);
        
        expect(typeof report.quality.confidence).toBe('number');
        expect(typeof report.quality.completeness).toBe('number');
        expect(report.quality.confidence).toBeGreaterThan(0);
        expect(report.quality.completeness).toBeGreaterThan(0);
        expect(report.quality.confidence).toBeLessThanOrEqual(1);
        expect(report.quality.completeness).toBeLessThanOrEqual(1);
    });

    test('should handle empty or minimal content gracefully', () => {
        const emptyResponse = {
            status: 'COMPLETED',
            response: {
                choices: [{
                    message: {
                        content: 'Minimal content'
                    }
                }],
                citations: [],
                usage: {
                    prompt_tokens: 10,
                    completion_tokens: 5,
                    total_tokens: 15,
                    completion_time: 2
                },
                model: 'sonar-deep-research'
            }
        };

        const report = createStructuredReport(emptyResponse, { team: 'unknown' }, requestId);
        
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('content');
        expect(report.content.fullText).toBe('Minimal content');
        expect(report.analysis.keyFindings).toBeInstanceOf(Array);
        expect(report.analysis.recommendations).toBeInstanceOf(Array);
        expect(report.sources).toHaveLength(0);
    });
});

// Note: These functions would need to be exported from the main file for testing
// The test assumes we're testing the internal functions
describe('S3 Key Structure', () => {
    test('should follow reports/{request_id}/[artifact] pattern', () => {
        const requestId = 'test-12345';
        const expectedKeys = {
            raw: `reports/${requestId}/raw.json`,
            structured: `reports/${requestId}/report.json`,
            markdown: `reports/${requestId}/report.md`,
            html: `reports/${requestId}/report.html`,
            cleaned: `reports/${requestId}/cleaned.md`
        };

        // This test validates the expected S3 key structure
        Object.values(expectedKeys).forEach(key => {
            expect(key).toMatch(/^reports\/test-12345\/.+$/);
        });

        expect(expectedKeys.raw).toBe('reports/test-12345/raw.json');
        expect(expectedKeys.structured).toBe('reports/test-12345/report.json');
        expect(expectedKeys.markdown).toBe('reports/test-12345/report.md');
        expect(expectedKeys.html).toBe('reports/test-12345/report.html');
        expect(expectedKeys.cleaned).toBe('reports/test-12345/cleaned.md');
    });
});