/**
 * @file report-processing-service.js
 * @description Core service for processing Perplexity API research reports
 * 
 * This service handles the complex task of transforming raw research data into
 * structured, actionable reports using Claude API for intelligent summarization
 * and content organization.
 * 
 * Key Functions:
 * - strip_think_blocks: Removes <think> tags and content from raw text
 * - LLM Integration: Uses Claude API with OpenAI fallback
 * - Summary Generation: Creates exactly 120-word executive summaries
 * - Content Structuring: Organizes findings into actionable sections
 * - S3 Storage: Saves processed reports with metadata
 * - DynamoDB Tracking: Maintains report metadata and search indexes
 * 
 * @module report-processing-service
 * @requires @aws-sdk/client-bedrock-runtime
 * @requires @aws-sdk/client-s3
 * @requires @aws-sdk/client-dynamodb
 * @requires ./prompt-sanitizer
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { buildSafePrompt } = require('./prompt-sanitizer');

// AWS clients
const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
const s3 = new S3Client({ region: 'us-east-1' });
const dynamodb = new DynamoDBClient({ region: 'us-east-1' });

// Configuration constants
const CLAUDE_MODEL_ID = 'anthropic.claude-3-5-sonnet-20240620-v1:0';
const SUMMARY_WORD_TARGET = 120;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000; // 2 seconds

// Summary generation prompt
const SUMMARY_PROMPT = `
Create a concise 120-word executive summary of the following research report.

Focus on the key findings, implications, and actionable insights.
Write for C-level executives who need quick understanding.

## Research Content:
{content}

## Requirements:
- Exactly 120 words (acceptable range: 110-130 words)
- Clear and compelling
- Focus on what matters most
- No fluff or filler

Return ONLY the summary text, no JSON, no formatting, just the 120-word summary.
`;

// Report formatting prompt
const FORMAT_REPORT_PROMPT = `
Format the following raw Perplexity research report for human readability using markdown.

## Your Task:
- Remove ONLY the LLM self-talk (e.g., "Let me search for...", "I'm looking for...", "I'll investigate...")
- Keep ALL actual findings, data, quotes, statistics, and information EXACTLY as written
- Do NOT summarize, condense, or rewrite any content
- Add proper markdown formatting to improve readability
- Organize into logical sections with clear headers
- Preserve the original flow and every detail

## Raw Content:
{content}

## Markdown Formatting Guidelines:
- Use ## for main section headers (e.g., ## Key Findings)
- Use ### for subsection headers if needed
- Use bullet points (- or *) for lists of findings or data points
- Use **bold** for important numbers, statistics, or key terms
- Use regular paragraphs for explanatory text
- Add blank lines between sections for readability
- Format data/statistics clearly (e.g., **$1.2B market size**)
- Use numbered lists (1. 2. 3.) for sequential steps or rankings

## Example Structure:
## Overview
[Introductory findings and context]

## Market Analysis
- **Market Size**: $X billion
- **Growth Rate**: X% CAGR
- **Key Players**: Company A, Company B

## Key Findings
### Finding 1: [Title]
[Detailed explanation with **bold** highlights]

### Finding 2: [Title]
[Detailed explanation]

## Recommendations
1. [First recommendation]
2. [Second recommendation]

Return ONLY the formatted markdown text, nothing else.
`;

/**
 * Service class for processing research reports
 * Handles the entire pipeline from raw content to structured output
 */
class ReportProcessingService {
    constructor() {
        this.bucketName = process.env.REPORT_BUCKET || 'color-code-research-results-984906149037';
        this.tableName = process.env.RESEARCH_REPORTS_TABLE || 'ResearchReports';
    }

    /**
     * Main processing method that orchestrates the entire report processing pipeline
     * 
     * @async
     * @param {Object} config - Processing configuration
     * @param {string} config.reportId - Unique report identifier
     * @param {string} config.rawContent - Raw content from Perplexity API
     * @param {string} config.team - Team identifier
     * @param {string} config.objective - Research objective
     * @param {Object} config.metadata - Additional metadata
     * @param {Object} config.secrets - API secrets object
     * @param {number} config.timeoutMs - Maximum processing time in milliseconds
     * @returns {Promise<Object>} Processed report with structure and metadata
     */
    async processReport(config) {
        const startTime = Date.now();
        console.log('📊 Starting report processing pipeline...');

        try {
            // Step 1: Strip think blocks from raw content
            console.log('🧹 Step 1: Cleaning content...');
            const cleanedContent = this.stripThinkBlocks(config.rawContent);
            const thinkBlocksRemoved = this.countThinkBlocks(config.rawContent);
            
            console.log(`✂️ Removed ${thinkBlocksRemoved} think blocks, content reduced by ${config.rawContent.length - cleanedContent.length} characters`);

            // Step 2: Generate 120-word summary (First API call)
            console.log('🤖 Step 2: Generating 120-word summary...');
            const summary = await this.generateSummary({
                content: cleanedContent,
                secrets: config.secrets
            });
            const summaryWordCount = this.countWords(summary);
            console.log(`✅ Generated summary with ${summaryWordCount} words`);

            // Step 3: Format the full report (Second API call)
            console.log('📝 Step 3: Formatting full report...');
            const formattedReport = await this.formatReport({
                content: cleanedContent,
                secrets: config.secrets
            });
            console.log(`✅ Formatted report with ${formattedReport.length} characters`);

            // Step 4: Store files in unified S3 structure
            console.log('💾 Step 4: Storing files in S3...');
            const s3Results = await this.storeFilesInS3({
                reportId: config.reportId,
                team: config.team,
                username: config.username || 'fprior', // Default to fprior if not provided
                summary: summary,
                formattedReport: formattedReport
            });

            // Step 5: Save metadata to DynamoDB
            console.log('📝 Step 5: Saving metadata and summary to DynamoDB...');
            await this.saveReportMetadata({
                reportId: config.reportId,
                team: config.team,
                username: config.username || 'fprior',
                objective: config.objective,
                summary: summary,
                summaryWordCount: summaryWordCount,
                s3Paths: s3Results,
                originalLength: config.rawContent.length,
                processedLength: cleanedContent.length,
                thinkBlocksRemoved,
                processingTimeMs: Date.now() - startTime
            });

            console.log('🎉 Report processing completed successfully');
            
            return {
                summary: summary,
                summaryWordCount: summaryWordCount,
                formattedReport: formattedReport,
                s3Paths: s3Results,
                processing: {
                    thinkBlocksRemoved,
                    apiCallsUsed: 2, // Two Claude API calls
                    processingTimeMs: Date.now() - startTime
                }
            };

        } catch (error) {
            console.error('💥 Report processing failed:', error);
            throw new Error(`Report processing failed: ${error.message}`);
        }
    }

    /**
     * Remove <think> blocks and their content from the raw text
     * Handles both single-line and multi-line think blocks
     * 
     * @param {string} content - Raw content containing think blocks
     * @returns {string} Cleaned content without think blocks
     */
    stripThinkBlocks(content) {
        if (!content || typeof content !== 'string') {
            return '';
        }

        // Remove multi-line think blocks: <think>...</think>
        let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
        
        // Remove single-line think blocks: <think>content</think>
        cleaned = cleaned.replace(/<think>.*?<\/think>/gi, '');
        
        // Remove orphaned opening or closing think tags
        cleaned = cleaned.replace(/<\/?think>/gi, '');
        
        // Clean up excessive whitespace that may result from removals
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple newlines -> double newline
        cleaned = cleaned.replace(/^\s+|\s+$/g, ''); // Trim start/end whitespace
        
        return cleaned;
    }

    /**
     * Count the number of think blocks in the content for metrics
     * 
     * @param {string} content - Content to analyze
     * @returns {number} Number of think blocks found
     */
    countThinkBlocks(content) {
        if (!content || typeof content !== 'string') {
            return 0;
        }
        
        const matches = content.match(/<think>[\s\S]*?<\/think>/gi);
        return matches ? matches.length : 0;
    }

    /**
     * Generate summary using Claude API
     * 
     * @async
     * @param {Object} config - Generation configuration
     * @param {string} config.content - Cleaned content to summarize
     * @param {Object} config.secrets - API secrets
     * @returns {Promise<string>} 120-word summary
     */
    async generateSummary(config) {
        const prompt = buildSafePrompt(SUMMARY_PROMPT, {
            content: config.content.substring(0, 45000) // Limit content size
        });

        const response = await this.callClaudeWithRetry(prompt, config.secrets, 'summary');
        return response.trim();
    }

    /**
     * Format report using Claude API
     * 
     * @async
     * @param {Object} config - Generation configuration
     * @param {string} config.content - Cleaned content to format
     * @param {Object} config.secrets - API secrets
     * @returns {Promise<string>} Formatted markdown report
     */
    async formatReport(config) {
        const prompt = buildSafePrompt(FORMAT_REPORT_PROMPT, {
            content: config.content.substring(0, 45000) // Limit content size
        });

        const response = await this.callClaudeWithRetry(prompt, config.secrets, 'format');
        return response.trim();
    }

    /**
     * Call Claude API with automatic retry logic for rate limits
     * 
     * @async
     * @param {string} prompt - The prompt to send to Claude
     * @param {Object} secrets - API secrets object
     * @param {string} responseType - Expected response type ('summary', 'format', or 'json')
     * @param {number} retries - Number of retries remaining
     * @returns {Promise<string|Object>} Response from Claude
     */
    async callClaudeWithRetry(prompt, secrets, responseType = 'json', retries = MAX_RETRIES) {
        const command = new InvokeModelCommand({
            modelId: CLAUDE_MODEL_ID,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 4096,
                temperature: 0.3, // Lower temperature for more consistent structured output
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        });

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                console.log(`🤖 Claude API call attempt ${attempt + 1}/${retries}`);
                
                const response = await bedrock.send(command);
                const responseData = JSON.parse(new TextDecoder().decode(response.body));
                const content = responseData.content[0].text;

                // Return based on expected response type
                if (responseType === 'json') {
                    return this.parseClaudeResponse(content);
                } else {
                    // For summary and format, return plain text
                    return content;
                }

            } catch (error) {
                // Enhanced rate limit detection
                const isRateLimit = error.message?.includes('Too many requests') || 
                                   error.message?.includes('rate limit') ||
                                   error.message?.includes('ThrottlingException') ||
                                   error.message?.includes('throttled') ||
                                   error.$metadata?.httpStatusCode === 429 ||
                                   error.name === 'ThrottlingException' ||
                                   error.name === 'TooManyRequestsException';
                
                const isRetryable = isRateLimit || 
                                   error.$metadata?.httpStatusCode === 503 || // Service unavailable
                                   error.$metadata?.httpStatusCode === 502;    // Bad gateway
                
                if (isRetryable && attempt < retries - 1) {
                    // Calculate wait time with jitter to avoid thundering herd
                    const baseWaitTime = RETRY_BASE_DELAY * Math.pow(2, attempt);
                    const jitter = Math.random() * 1000; // Up to 1 second of jitter
                    const waitTime = Math.min(baseWaitTime + jitter, 30000); // Cap at 30 seconds
                    
                    console.log(`⏳ ${isRateLimit ? 'Rate limited' : 'Service error'}, waiting ${Math.round(waitTime)}ms before retry ${attempt + 2}/${retries}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    console.error(`❌ Claude API call failed on attempt ${attempt + 1}:`, error);
                    throw error;
                }
            }
        }
        
        // If we've exhausted all retries, throw an error
        throw new Error(`Failed to complete Claude API call after ${retries} attempts due to rate limiting`);
    }

    /**
     * Parse Claude's JSON response with error handling
     * 
     * @param {string} content - Raw response content from Claude
     * @returns {Object} Parsed JSON object
     * @throws {Error} If JSON parsing fails
     */
    parseClaudeResponse(content) {
        try {
            // Try to parse the entire response as JSON
            return JSON.parse(content);
        } catch (error) {
            // Try to extract JSON from code blocks
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                try {
                    const jsonStr = jsonMatch[1] || jsonMatch[0];
                    return JSON.parse(jsonStr);
                } catch (parseError) {
                    console.error('Failed to parse extracted JSON:', parseError);
                }
            }
            
            throw new Error(`Failed to parse Claude response as JSON: ${error.message}`);
        }
    }


    /**
     * Store summary and report files in unified S3 structure
     * 
     * @async
     * @param {Object} config - Storage configuration
     * @param {string} config.reportId - Report identifier
     * @param {string} config.team - Team identifier
     * @param {string} config.username - Username
     * @param {string} config.summary - 120-word summary
     * @param {string} config.formattedReport - Formatted markdown report
     * @returns {Promise<Object>} S3 paths for stored files
     */
    async storeFilesInS3(config) {
        const basePath = `users/${config.username}/research/${config.team}/${config.reportId}`;
        
        // Store summary as plain text
        const summaryKey = `${basePath}/summary.txt`;
        const summaryCommand = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: summaryKey,
            Body: config.summary,
            ContentType: 'text/plain',
            Metadata: {
                'report-id': config.reportId,
                'team': config.team,
                'file-type': 'summary',
                'processed-at': new Date().toISOString()
            }
        });
        
        // Store formatted report as markdown
        const reportKey = `${basePath}/report.md`;
        const reportCommand = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: reportKey,
            Body: config.formattedReport,
            ContentType: 'text/markdown',
            Metadata: {
                'report-id': config.reportId,
                'team': config.team,
                'file-type': 'formatted-report',
                'processed-at': new Date().toISOString()
            }
        });

        // Upload both files
        await Promise.all([
            s3.send(summaryCommand),
            s3.send(reportCommand)
        ]);
        
        console.log(`📁 Files stored in S3:`);
        console.log(`   - Summary: ${summaryKey}`);
        console.log(`   - Report: ${reportKey}`);
        
        return {
            basePath,
            summaryKey,
            reportKey
        };
    }

    /**
     * Save report metadata to DynamoDB for search and tracking
     * 
     * @async
     * @param {Object} metadata - Metadata to store
     */
    async saveReportMetadata(metadata) {
        const item = {
            reportId: { S: metadata.reportId },
            team: { S: metadata.team },
            username: { S: metadata.username },
            createdAt: { S: new Date().toISOString() },
            objective: { S: metadata.objective },
            // Store full S3 paths
            s3BasePath: { S: metadata.s3Paths.basePath },
            s3SummaryKey: { S: metadata.s3Paths.summaryKey },
            s3ReportKey: { S: metadata.s3Paths.reportKey },
            // Store the actual summary text for quick access
            processedSummary: { S: metadata.summary },
            summaryWordCount: { N: metadata.summaryWordCount.toString() },
            originalLength: { N: metadata.originalLength.toString() },
            processedLength: { N: metadata.processedLength.toString() },
            thinkBlocksRemoved: { N: metadata.thinkBlocksRemoved.toString() },
            processingTimeMs: { N: metadata.processingTimeMs.toString() },
            processingCompletedAt: { S: new Date().toISOString() },
            ttl: { N: Math.floor(Date.now() / 1000 + (30 * 24 * 60 * 60)).toString() } // 30 days TTL
        };

        const command = new PutItemCommand({
            TableName: this.tableName,
            Item: item
        });

        await dynamodb.send(command);
        console.log(`📋 Metadata and summary saved to DynamoDB for report: ${metadata.reportId.substring(0, 8)}...`);
    }

    /**
     * Count words in a text string
     * 
     * @param {string} text - Text to count words in
     * @returns {number} Word count
     */
    countWords(text) {
        if (!text || typeof text !== 'string') {
            return 0;
        }
        
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
}

module.exports = {
    ReportProcessingService
};