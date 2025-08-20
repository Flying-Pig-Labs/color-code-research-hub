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

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const axios = require('axios');

// AWS clients
const s3 = new S3Client({ region: 'us-east-1' });
const dynamodb = new DynamoDBClient({ region: 'us-east-1' });

// Configuration constants
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';  // Latest version with 8192 token support
const OPENAI_MODEL = 'gpt-4o';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
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
     * Generate summary using OpenAI API (Claude removed due to token limits)
     * 
     * @async
     * @param {Object} config - Generation configuration
     * @param {string} config.content - Cleaned content to summarize
     * @param {Object} config.secrets - API secrets
     * @returns {Promise<string>} 120-word summary
     */
    async generateSummary(config) {
        // Limit content size but don't over-sanitize it
        const contentToSummarize = config.content.substring(0, 45000);
        
        // Build prompt without aggressive sanitization that removes content
        const prompt = SUMMARY_PROMPT.replace('{content}', contentToSummarize);

        // Always use OpenAI for better token limits
        console.log('🤖 Using OpenAI for summary generation');
        const response = await this.callOpenAIFallback(prompt, config.secrets, 'summary');
        return response.trim();
    }

    /**
     * Format report using Claude with continuation support for long reports
     * Falls back to OpenAI if Claude fails
     * 
     * @async
     * @param {Object} config - Generation configuration
     * @param {string} config.content - Cleaned content to format
     * @param {Object} config.secrets - API secrets
     * @returns {Promise<string>} Formatted markdown report
     */
    async formatReport(config) {
        // Don't limit content - let continuation handle it
        const contentToFormat = config.content;
        
        // Build prompt without aggressive sanitization that removes content
        const prompt = FORMAT_REPORT_PROMPT.replace('{content}', contentToFormat);

        try {
            // Try Claude first with continuation support for long reports
            console.log('🤖 Using Claude with continuation support for report formatting');
            const response = await this.callClaudeWithContinuation(
                prompt, 
                config.secrets, 
                'format', 
                5 // Allow up to 5 continuations (can handle ~40k tokens)
            );
            
            // Extract content from response
            const content = typeof response === 'string' ? response : response.content;
            return content.trim();
            
        } catch (error) {
            console.log('⚠️ Claude formatting failed, falling back to OpenAI with continuation', error.message);
            // Fall back to OpenAI with continuation support
            const response = await this.callOpenAIWithContinuation(
                prompt, 
                config.secrets, 
                'format', 
                3 // Allow up to 3 continuations for OpenAI (~48k tokens)
            );
            const content = typeof response === 'string' ? response : response.content;
            return content.trim();
        }
    }

    /**
     * Call Claude API with automatic retry logic for rate limits
     * Now uses native Anthropic API instead of Bedrock for full 8192 token support
     * 
     * @async
     * @param {string} prompt - The prompt to send to Claude
     * @param {Object} secrets - API secrets object
     * @param {string} responseType - Expected response type ('summary', 'format', or 'json')
     * @param {number} retries - Number of retries remaining
     * @returns {Promise<string|Object>} Response from Claude
     */
    async callClaudeWithRetry(prompt, secrets, responseType = 'json', retries = MAX_RETRIES) {
        // Get Anthropic API key
        const anthropicKey = secrets.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
            console.log('⚠️ Anthropic API key not found, falling back to OpenAI');
            return this.callOpenAIFallback(prompt, secrets, responseType, retries);
        }

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                console.log(`🤖 Claude API call attempt ${attempt + 1}/${retries} (Native Anthropic API)`);
                
                const response = await axios.post(
                    ANTHROPIC_API_URL,
                    {
                        model: CLAUDE_MODEL,
                        max_tokens: responseType === 'summary' ? 500 : 8192, // Full 8192 token support!
                        temperature: 0.3,
                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ]
                    },
                    {
                        headers: {
                            'x-api-key': anthropicKey,
                            'anthropic-version': '2023-06-01',
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000 // 60 seconds
                    }
                );

                const content = response.data.content[0].text;
                const stopReason = response.data.stop_reason;

                // For continuation support, return full response with metadata
                if (responseType === 'format' || responseType === 'full') {
                    return {
                        content: content,
                        stop_reason: stopReason,
                        usage: response.data.usage
                    };
                }
                
                // Return based on expected response type
                if (responseType === 'json') {
                    return this.parseClaudeResponse(content);
                } else {
                    // For summary, return plain text
                    return content;
                }

            } catch (error) {
                // Enhanced rate limit detection for Anthropic API
                const isRateLimit = error.response?.status === 429 ||
                                   error.response?.status === 529 || // Anthropic overloaded
                                   error.message?.includes('rate limit') ||
                                   error.message?.includes('Too many requests');
                
                const isRetryable = isRateLimit || 
                                   error.response?.status === 503 || // Service unavailable
                                   error.response?.status === 502;    // Bad gateway
                
                if (isRetryable && attempt < retries - 1) {
                    // Calculate wait time with jitter to avoid thundering herd
                    const baseWaitTime = RETRY_BASE_DELAY * Math.pow(2, attempt);
                    const jitter = Math.random() * 1000; // Up to 1 second of jitter
                    const waitTime = Math.min(baseWaitTime + jitter, 30000); // Cap at 30 seconds
                    
                    console.log(`⏳ ${isRateLimit ? 'Rate limited' : 'Service error'}, waiting ${Math.round(waitTime)}ms before retry ${attempt + 2}/${retries}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    console.error(`❌ Claude API call failed on attempt ${attempt + 1}:`, error.response?.data || error.message);
                    
                    // If all Claude attempts failed, try OpenAI as fallback
                    if (attempt === retries - 1) {
                        console.log('🔄 All Claude attempts failed, falling back to OpenAI');
                        return this.callOpenAIFallback(prompt, secrets, responseType, retries);
                    }
                    throw error;
                }
            }
        }
        
        // If we've exhausted all retries, fall back to OpenAI
        console.log('🔄 Claude API rate limited after all retries, falling back to OpenAI');
        return this.callOpenAIFallback(prompt, secrets, responseType, retries);
    }

    /**
     * Detect if a response was truncated due to token limits
     * 
     * @param {Object} response - API response object
     * @param {string} content - Response content text
     * @returns {boolean} True if response was truncated
     */
    detectTruncation(response, content) {
        // Check for explicit truncation indicators
        if (response?.stop_reason === 'max_tokens' || 
            response?.finish_reason === 'length') {
            return true;
        }

        // Heuristic checks for truncation
        const lastChar = content.trim().slice(-1);
        const endsWithPunctuation = ['.', '!', '?', '"', "'", ')', ']', '}'].includes(lastChar);
        
        // Check for incomplete markdown
        const openCodeBlocks = (content.match(/```/g) || []).length % 2 !== 0;
        const openBoldMarkers = (content.match(/\*\*/g) || []).length % 2 !== 0;
        
        // Check for incomplete JSON
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        const incompleteJSON = openBraces > closeBraces;
        
        // Check for incomplete lists
        const lastLine = content.trim().split('\n').pop();
        const incompleteBullet = /^[-*]\s+[^.!?]*$/.test(lastLine);
        
        return !endsWithPunctuation || openCodeBlocks || openBoldMarkers || 
               incompleteJSON || incompleteBullet;
    }

    /**
     * Generate a continuation prompt to resume from truncation point
     * 
     * @param {string} previousContent - The truncated content
     * @param {string} originalPrompt - The original prompt
     * @returns {string} Continuation prompt
     */
    generateContinuationPrompt(previousContent, originalPrompt) {
        // Get last 500 characters for context
        const contextLength = 500;
        const lastContext = previousContent.slice(-contextLength);
        
        return `You are continuing a response that was cut off due to length limits.

## Original Request:
${originalPrompt.slice(0, 500)}...

## Last ${contextLength} characters of previous response:
...${lastContext}

## Instructions:
1. Continue EXACTLY from where the previous response ended
2. Do NOT repeat any content that was already written
3. Do NOT add any introduction or transition text
4. Simply continue writing as if there was no interruption
5. Maintain the same formatting style and structure

Continue from the next word/character:`;
    }

    /**
     * Call Claude API with automatic continuation for long responses
     * 
     * @async
     * @param {string} prompt - The prompt to send
     * @param {Object} secrets - API secrets object
     * @param {string} responseType - Expected response type
     * @param {number} maxContinuations - Maximum continuation attempts (default: 5)
     * @returns {Promise<string>} Complete response with continuations
     */
    async callClaudeWithContinuation(prompt, secrets, responseType = 'format', maxContinuations = 5) {
        let fullContent = '';
        let currentPrompt = prompt;
        let continuationCount = 0;
        
        console.log('🚀 Starting Claude API call with continuation support');
        
        while (continuationCount <= maxContinuations) {
            try {
                // Call Claude API
                const response = await this.callClaudeWithRetry(
                    currentPrompt, 
                    secrets, 
                    responseType, 
                    MAX_RETRIES
                );
                
                // Extract text content based on response type
                let content = '';
                if (typeof response === 'string') {
                    content = response;
                } else if (response?.content) {
                    content = response.content;
                } else if (response?.text) {
                    content = response.text;
                } else {
                    content = JSON.stringify(response);
                }
                
                // Append to full content
                fullContent += content;
                
                // Check if response was truncated
                const wasTruncated = this.detectTruncation(response, content);
                
                if (!wasTruncated) {
                    console.log(`✅ Response complete after ${continuationCount + 1} part(s)`);
                    break;
                }
                
                if (continuationCount >= maxContinuations) {
                    console.log(`⚠️ Reached maximum continuations (${maxContinuations})`);
                    break;
                }
                
                // Generate continuation prompt
                console.log(`📝 Response truncated, generating continuation ${continuationCount + 2}/${maxContinuations + 1}`);
                currentPrompt = this.generateContinuationPrompt(fullContent, prompt);
                continuationCount++;
                
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error during continuation ${continuationCount + 1}:`, error);
                
                // If we have partial content, return it
                if (fullContent.length > 0) {
                    console.log('⚠️ Returning partial content due to error');
                    return fullContent;
                }
                
                throw error;
            }
        }
        
        return fullContent;
    }

    /**
     * Call OpenAI API with automatic continuation for long responses
     * 
     * @async
     * @param {string} prompt - The prompt to send
     * @param {Object} secrets - API secrets object
     * @param {string} responseType - Expected response type
     * @param {number} maxContinuations - Maximum continuation attempts (default: 3)
     * @returns {Promise<string>} Complete response with continuations
     */
    async callOpenAIWithContinuation(prompt, secrets, responseType = 'format', maxContinuations = 3) {
        let fullContent = '';
        let currentPrompt = prompt;
        let continuationCount = 0;
        
        console.log('🚀 Starting OpenAI API call with continuation support');
        
        // Get OpenAI key
        let openaiKey;
        if (secrets.OPENAI_API_KEY) {
            openaiKey = secrets.OPENAI_API_KEY;
        } else {
            try {
                const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
                const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });
                const command = new GetSecretValueCommand({ SecretId: 'openai_key' });
                const response = await secretsClient.send(command);
                
                try {
                    const secretData = JSON.parse(response.SecretString);
                    openaiKey = secretData.openai_key || secretData.OPENAI_API_KEY || response.SecretString;
                } catch (parseError) {
                    openaiKey = response.SecretString;
                }
            } catch (error) {
                throw new Error(`Failed to retrieve OpenAI API key: ${error.message}`);
            }
        }
        
        if (!openaiKey) {
            throw new Error('OpenAI API key not found in secrets');
        }
        
        while (continuationCount <= maxContinuations) {
            try {
                console.log(`🤖 OpenAI API continuation ${continuationCount + 1}/${maxContinuations + 1}`);
                
                const response = await axios.post(
                    OPENAI_API_URL,
                    {
                        model: OPENAI_MODEL,
                        messages: [
                            {
                                role: 'user',
                                content: currentPrompt
                            }
                        ],
                        temperature: 0.3,
                        max_tokens: 16384 // OpenAI supports 16k output tokens
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${openaiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000
                    }
                );
                
                const content = response.data.choices[0].message.content;
                const finishReason = response.data.choices[0].finish_reason;
                
                // Append to full content
                fullContent += content;
                
                // Check if response was truncated
                const wasTruncated = finishReason === 'length' || 
                                   this.detectTruncation({finish_reason: finishReason}, content);
                
                if (!wasTruncated) {
                    console.log(`✅ OpenAI response complete after ${continuationCount + 1} part(s)`);
                    break;
                }
                
                if (continuationCount >= maxContinuations) {
                    console.log(`⚠️ Reached maximum OpenAI continuations (${maxContinuations})`);
                    break;
                }
                
                // Generate continuation prompt
                console.log(`📝 OpenAI response truncated, generating continuation ${continuationCount + 2}/${maxContinuations + 1}`);
                currentPrompt = this.generateContinuationPrompt(fullContent, prompt);
                continuationCount++;
                
                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ OpenAI error during continuation ${continuationCount + 1}:`, error.response?.data || error.message);
                
                // If we have partial content, return it
                if (fullContent.length > 0) {
                    console.log('⚠️ Returning partial OpenAI content due to error');
                    return fullContent;
                }
                
                throw error;
            }
        }
        
        return fullContent;
    }

    /**
     * Call OpenAI API as fallback when Claude/Bedrock rate limits
     * Now includes retry logic with exponential backoff for rate limits
     * 
     * @async
     * @param {string} prompt - The prompt to send to OpenAI
     * @param {Object} secrets - API secrets object containing OPENAI_API_KEY
     * @param {string} responseType - Expected response type ('summary', 'format', or 'json')
     * @param {number} retries - Number of retries to attempt (default: 5)
     * @returns {Promise<string|Object>} Response from OpenAI
     */
    async callOpenAIFallback(prompt, secrets, responseType = 'json', retries = 5) {
        console.log(`🔄 Falling back to OpenAI (${OPENAI_MODEL}) due to Claude rate limiting`);
        
        // Get OpenAI key from separate secret
        let openaiKey;
        if (secrets.OPENAI_API_KEY) {
            openaiKey = secrets.OPENAI_API_KEY;
        } else {
            try {
                const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
                const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });
                const command = new GetSecretValueCommand({ SecretId: 'openai_key' });
                const response = await secretsClient.send(command);
                
                // Parse the JSON secret (unlike perplexity-key which is plain text)
                try {
                    const secretData = JSON.parse(response.SecretString);
                    openaiKey = secretData.openai_key || secretData.OPENAI_API_KEY || response.SecretString;
                } catch (parseError) {
                    // If it's not JSON, use as plain string
                    openaiKey = response.SecretString;
                }
            } catch (error) {
                throw new Error(`Failed to retrieve OpenAI API key: ${error.message}`);
            }
        }
        
        if (!openaiKey) {
            throw new Error('OpenAI API key not found in secrets');
        }

        // Retry loop with exponential backoff
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                console.log(`🤖 OpenAI API call attempt ${attempt + 1}/${retries}`);
                
                const response = await axios.post(
                    OPENAI_API_URL,
                    {
                        model: OPENAI_MODEL,
                        messages: [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.3,
                        max_tokens: responseType === 'summary' ? 500 : 16384 // Higher limit for formatting
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${openaiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 60000 // Increased to 60 seconds for retries
                    }
                );

                const content = response.data.choices[0].message.content;
                
                // Success! Return based on expected response type
                console.log(`✅ OpenAI API call succeeded on attempt ${attempt + 1}`);
                if (responseType === 'json') {
                    return this.parseClaudeResponse(content); // Works for OpenAI too
                } else {
                    // For summary and format, return plain text
                    return content;
                }
            } catch (error) {
                const errorMessage = error.response?.data?.error?.message || error.message;
                const statusCode = error.response?.status;
                
                // Check if this is a rate limit error
                const isRateLimit = statusCode === 429 || 
                                   errorMessage?.includes('rate limit') ||
                                   errorMessage?.includes('Rate limit') ||
                                   errorMessage?.includes('TPM') ||
                                   errorMessage?.includes('RPM');
                
                // Check if this is a timeout or temporary error
                const isTemporary = error.code === 'ECONNABORTED' ||
                                   error.message?.includes('timeout') ||
                                   statusCode === 503 ||
                                   statusCode === 502;
                
                const isRetryable = isRateLimit || isTemporary;
                
                if (isRetryable && attempt < retries - 1) {
                    // Extract wait time from error message if available
                    let waitTime = RETRY_BASE_DELAY * Math.pow(2, attempt); // Default exponential backoff
                    
                    // If rate limit error includes a retry-after suggestion, use it
                    const retryAfterMatch = errorMessage?.match(/try again in (\d+\.?\d*)s/i);
                    if (retryAfterMatch) {
                        waitTime = Math.ceil(parseFloat(retryAfterMatch[1]) * 1000) + 1000; // Add 1s buffer
                        console.log(`⏳ Rate limited. Waiting ${waitTime}ms as suggested by API`);
                    } else {
                        // Add jitter to prevent thundering herd
                        const jitter = Math.random() * 2000; // Up to 2 seconds of jitter
                        waitTime = Math.min(waitTime + jitter, 60000); // Cap at 60 seconds
                        console.log(`⏳ ${isRateLimit ? 'Rate limited' : 'Temporary error'}. Waiting ${Math.round(waitTime)}ms before retry ${attempt + 2}/${retries}`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    // Final attempt failed or error is not retryable
                    console.error(`❌ OpenAI API call failed on attempt ${attempt + 1}:`, errorMessage);
                    throw new Error(`OpenAI API error after ${attempt + 1} attempts: ${errorMessage}`);
                }
            }
        }
        
        // Should never reach here, but just in case
        throw new Error(`Failed to complete OpenAI API call after ${retries} attempts`);
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
        // First, try to get the existing record to preserve createdAt
        let originalCreatedAt = null;
        try {
            const { GetItemCommand } = require('@aws-sdk/client-dynamodb');
            const getCommand = new GetItemCommand({
                TableName: this.tableName,
                Key: {
                    reportId: { S: metadata.reportId }
                }
            });
            const existingRecord = await dynamodb.send(getCommand);
            if (existingRecord.Item && existingRecord.Item.createdAt) {
                originalCreatedAt = existingRecord.Item.createdAt.S;
                console.log(`📅 Preserving original createdAt: ${originalCreatedAt}`);
            }
        } catch (error) {
            console.log('📝 No existing record found, will create new');
        }

        const item = {
            reportId: { S: metadata.reportId },
            team: { S: metadata.team },
            username: { S: metadata.username },
            createdAt: { S: originalCreatedAt || new Date().toISOString() }, // Use original if exists, otherwise current time
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
            status: { S: 'completed' }, // Ensure status is always set
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