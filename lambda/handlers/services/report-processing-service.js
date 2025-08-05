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

// Report processing prompt template
const REPORT_PROCESSING_PROMPT = `
You are an expert research analyst tasked with processing and structuring research reports from Perplexity API.

Your task is to transform the raw research content into a professional, actionable report with the following structure:

## REQUIREMENTS:

1. **EXECUTIVE SUMMARY** (approximately 120 words):
   - Create a compelling summary that captures the essence of the research
   - Focus on key findings, implications, and opportunities
   - Write for C-level executives who need quick insights
   - Target 100-140 words, but prioritize clarity and completeness over exact word count

2. **KEY FINDINGS** (3-5 bullet points):
   - Extract the most important discoveries from the research
   - Each finding should be actionable and specific
   - Include relevant data points, trends, or insights
   - Prioritize findings by business impact
   - Each bullet point should be a complete, well-formatted sentence or paragraph suitable for markdown display

3. **OPPORTUNITIES** (2-4 bullet points):
   - Identify specific business opportunities based on the research
   - Focus on actionable next steps or strategic directions
   - Include market gaps, competitive advantages, or growth areas
   - Quantify opportunities where possible

4. **RECOMMENDATIONS** (3-5 bullet points):
   - Provide specific, actionable recommendations
   - Prioritize by implementation difficulty and potential impact
   - Include both short-term and long-term actions
   - Be specific about what should be done and why

5. **RISKS & CONSIDERATIONS** (2-4 bullet points):
   - Identify potential challenges or risks
   - Include market risks, competitive threats, or implementation challenges
   - Suggest mitigation strategies where appropriate
   - Be balanced but realistic about potential obstacles

## INPUT DATA:
**Research Objective:** {objective}
**Team:** {team}
**Raw Content:** {content}

## OUTPUT FORMAT:
Please return your response as a valid JSON object with this exact structure:

{
  "summary": "Approximately 120-word executive summary here...",
  "wordCount": 120,
  "sections": [
    {
      "title": "Key Findings",
      "content": [
        "First key finding with specific details...",
        "Second key finding with data points...",
        "Third key finding with implications..."
      ]
    },
    {
      "title": "Opportunities",
      "content": [
        "First opportunity with market potential...",
        "Second opportunity with strategic value..."
      ]
    },
    {
      "title": "Recommendations",
      "content": [
        "First recommendation with implementation notes...",
        "Second recommendation with timeline...",
        "Third recommendation with resource requirements..."
      ]
    },
    {
      "title": "Risks & Considerations",
      "content": [
        "First risk with mitigation strategy...",
        "Second risk with probability assessment..."
      ]
    }
  ],
  "metadata": {
    "processingTimestamp": "{timestamp}",
    "sourceTeam": "{team}",
    "objective": "{objective}"
  }
}

CRITICAL: Ensure the summary is approximately 120 words (100-140 words is acceptable). Focus on creating a compelling, complete summary.
CRITICAL: Return only valid JSON. Do not include any text before or after the JSON object.
CRITICAL: Format all text content to be clean and suitable for markdown rendering. Avoid special characters that might break formatting.
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

            // Step 2: Generate structured report using Claude
            console.log('🤖 Step 2: Generating structured report...');
            const structuredReport = await this.generateStructuredReport({
                content: cleanedContent,
                objective: config.objective,
                team: config.team,
                secrets: config.secrets,
                timeoutMs: config.timeoutMs - (Date.now() - startTime)
            });

            // Step 3: Validate and enhance the report
            console.log('✅ Step 3: Validating report structure...');
            const validatedReport = this.validateAndEnhanceReport(structuredReport, config);

            // Step 4: Store in S3
            console.log('💾 Step 4: Storing processed report...');
            const s3Key = await this.storeReportInS3({
                reportId: config.reportId,
                report: validatedReport,
                team: config.team
            });

            // Step 5: Save metadata to DynamoDB
            console.log('📝 Step 5: Saving metadata...');
            await this.saveReportMetadata({
                reportId: config.reportId,
                team: config.team,
                objective: config.objective,
                s3Key,
                summary: validatedReport.summary,
                wordCount: validatedReport.wordCount,
                sectionsCount: validatedReport.sections.length,
                originalLength: config.rawContent.length,
                processedLength: cleanedContent.length,
                thinkBlocksRemoved,
                processingTimeMs: Date.now() - startTime
            });

            console.log('🎉 Report processing completed successfully');
            
            return {
                ...validatedReport,
                s3Key,
                processing: {
                    thinkBlocksRemoved,
                    apiCallsUsed: 1, // Currently one Claude call per report
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
     * Generate structured report using Claude API
     * Includes retry logic with exponential backoff for rate limits
     * 
     * @async
     * @param {Object} config - Generation configuration
     * @param {string} config.content - Cleaned content to process
     * @param {string} config.objective - Research objective
     * @param {string} config.team - Team identifier
     * @param {Object} config.secrets - API secrets
     * @param {number} config.timeoutMs - Remaining timeout
     * @returns {Promise<Object>} Structured report object
     */
    async generateStructuredReport(config) {
        const prompt = buildSafePrompt(REPORT_PROCESSING_PROMPT, {
            content: config.content.substring(0, 45000), // Limit content size for prompt
            objective: config.objective,
            team: config.team,
            timestamp: new Date().toISOString()
        });

        return await this.callClaudeWithRetry(prompt, config.secrets);
    }

    /**
     * Call Claude API with automatic retry logic for rate limits
     * 
     * @async
     * @param {string} prompt - The prompt to send to Claude
     * @param {Object} secrets - API secrets object
     * @param {number} retries - Number of retries remaining
     * @returns {Promise<Object>} Parsed JSON response from Claude
     */
    async callClaudeWithRetry(prompt, secrets, retries = MAX_RETRIES) {
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

                // Parse the JSON response
                return this.parseClaudeResponse(content);

            } catch (error) {
                const isRateLimit = error.message?.includes('Too many requests') || 
                                   error.message?.includes('rate limit') ||
                                   error.$metadata?.httpStatusCode === 429;
                
                if (isRateLimit && attempt < retries - 1) {
                    const waitTime = RETRY_BASE_DELAY * Math.pow(2, attempt);
                    console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    console.error(`❌ Claude API call failed on attempt ${attempt + 1}:`, error);
                    throw error;
                }
            }
        }
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
     * Validate and enhance the report structure
     * Ensures all required fields are present and properly formatted
     * 
     * @param {Object} report - Raw report from Claude
     * @param {Object} config - Original processing configuration
     * @returns {Object} Validated and enhanced report
     */
    validateAndEnhanceReport(report, config) {
        // Ensure required fields exist
        const validatedReport = {
            summary: report.summary || 'Summary not available',
            wordCount: this.countWords(report.summary || ''),
            sections: report.sections || [],
            metadata: {
                ...report.metadata,
                processingTimestamp: new Date().toISOString(),
                originalObjective: config.objective,
                sourceTeam: config.team,
                reportId: config.reportId
            }
        };

        // Validate summary word count
        if (validatedReport.wordCount < 100 || validatedReport.wordCount > 140) {
            console.warn(`⚠️ Summary word count (${validatedReport.wordCount}) is outside the target range (100-140 words)`);
        }

        // Ensure required sections exist
        const requiredSections = ['Key Findings', 'Opportunities', 'Recommendations', 'Risks & Considerations'];
        for (const sectionName of requiredSections) {
            if (!validatedReport.sections.find(s => s.title === sectionName)) {
                validatedReport.sections.push({
                    title: sectionName,
                    content: [`No ${sectionName.toLowerCase()} identified in the source material.`]
                });
            }
        }

        return validatedReport;
    }

    /**
     * Store processed report in S3 bucket
     * 
     * @async
     * @param {Object} config - Storage configuration
     * @param {string} config.reportId - Report identifier
     * @param {Object} config.report - Processed report object
     * @param {string} config.team - Team identifier
     * @returns {Promise<string>} S3 key where report was stored
     */
    async storeReportInS3(config) {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const s3Key = `processed-reports/${config.team}/${timestamp}/${config.reportId}.json`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: s3Key,
            Body: JSON.stringify(config.report, null, 2),
            ContentType: 'application/json',
            Metadata: {
                'report-id': config.reportId,
                'team': config.team,
                'processed-at': new Date().toISOString(),
                'word-count': config.report.wordCount?.toString() || '0',
                'sections-count': config.report.sections?.length?.toString() || '0'
            }
        });

        await s3.send(command);
        console.log(`📁 Report stored in S3: ${s3Key}`);
        
        return s3Key;
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
            createdAt: { S: new Date().toISOString() },
            objective: { S: metadata.objective },
            s3Key: { S: metadata.s3Key },
            summary: { S: metadata.summary.substring(0, 1000) }, // Truncate for DynamoDB
            wordCount: { N: metadata.wordCount.toString() },
            sectionsCount: { N: metadata.sectionsCount.toString() },
            originalLength: { N: metadata.originalLength.toString() },
            processedLength: { N: metadata.processedLength.toString() },
            thinkBlocksRemoved: { N: metadata.thinkBlocksRemoved.toString() },
            processingTimeMs: { N: metadata.processingTimeMs.toString() },
            ttl: { N: Math.floor(Date.now() / 1000 + (30 * 24 * 60 * 60)).toString() } // 30 days TTL
        };

        const command = new PutItemCommand({
            TableName: this.tableName,
            Item: item
        });

        await dynamodb.send(command);
        console.log(`📋 Metadata saved to DynamoDB for report: ${metadata.reportId.substring(0, 8)}...`);
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