/**
 * Local UI Webhook Client for Claude Flow Research System
 * This module provides an easy way to trigger research jobs on the remote EC2 instance
 */

const axios = require('axios');
const EventEmitter = require('events');

class ClaudeFlowResearchClient extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.baseUrl = config.baseUrl || process.env.CLAUDE_FLOW_WEBHOOK_URL;
        this.apiKey = config.apiKey || process.env.CLAUDE_FLOW_API_KEY;
        this.webhookSecret = config.webhookSecret || process.env.WEBHOOK_SECRET;
        this.timeout = config.timeout || 30000;
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;
        
        if (!this.baseUrl) {
            throw new Error('baseUrl is required. Set CLAUDE_FLOW_WEBHOOK_URL or pass in config.');
        }
        
        // Create axios instance with defaults
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'X-API-Key': this.apiKey })
            }
        });
        
        // Add request interceptor for webhook signature
        if (this.webhookSecret) {
            this.client.interceptors.request.use(this.addWebhookSignature.bind(this));
        }
    }
    
    /**
     * Add webhook signature to request
     */
    addWebhookSignature(config) {
        if (config.data && config.method === 'post') {
            const crypto = require('crypto');
            const payload = JSON.stringify(config.data);
            const signature = 'sha256=' + crypto
                .createHmac('sha256', this.webhookSecret)
                .update(payload)
                .digest('hex');
            
            config.headers['X-Webhook-Signature'] = signature;
        }
        return config;
    }
    
    /**
     * Submit a research request
     * @param {Object} params - Research parameters
     * @param {string} params.intent - The research intent/objective
     * @param {Object} params.swarmConfig - Swarm configuration options
     * @param {Object} params.researchConfig - Research-specific configuration
     * @param {Object} params.metadata - Additional metadata
     * @returns {Promise<Object>} Job details including jobId
     */
    async submitResearch(params) {
        const {
            intent,
            swarmConfig = {},
            researchConfig = {},
            metadata = {}
        } = params;
        
        if (!intent) {
            throw new Error('Research intent is required');
        }
        
        const requestBody = {
            intent,
            swarmConfig: {
                strategy: 'research',
                maxAgents: 6,
                timeout: 60,
                parallel: true,
                ...swarmConfig
            },
            researchConfig: {
                depth: 'comprehensive',
                outputFormat: 'structured',
                includeSources: true,
                ...researchConfig
            },
            metadata: {
                timestamp: new Date().toISOString(),
                source: 'local-ui',
                ...metadata
            }
        };
        
        try {
            const response = await this.retryRequest(
                () => this.client.post('/webhook/research', requestBody)
            );
            
            this.emit('jobSubmitted', response.data);
            return response.data;
        } catch (error) {
            this.emit('error', error);
            throw this.formatError(error);
        }
    }
    
    /**
     * Check job status
     * @param {string} jobId - The job ID to check
     * @returns {Promise<Object>} Job status and results if completed
     */
    async checkJobStatus(jobId) {
        if (!jobId) {
            throw new Error('Job ID is required');
        }
        
        try {
            const response = await this.retryRequest(
                () => this.client.get(`/job/${jobId}/status`)
            );
            
            if (response.data.status === 'completed') {
                this.emit('jobCompleted', response.data);
            }
            
            return response.data;
        } catch (error) {
            this.emit('error', error);
            throw this.formatError(error);
        }
    }
    
    /**
     * Get job logs
     * @param {string} jobId - The job ID
     * @returns {Promise<string>} Log content
     */
    async getJobLogs(jobId) {
        if (!jobId) {
            throw new Error('Job ID is required');
        }
        
        try {
            const response = await this.retryRequest(
                () => this.client.get(`/logs/${jobId}`, {
                    responseType: 'text'
                })
            );
            
            return response.data;
        } catch (error) {
            this.emit('error', error);
            throw this.formatError(error);
        }
    }
    
    /**
     * Health check
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/health');
            return response.data;
        } catch (error) {
            throw this.formatError(error);
        }
    }
    
    /**
     * Wait for job completion with polling
     * @param {string} jobId - The job ID
     * @param {Object} options - Polling options
     * @returns {Promise<Object>} Completed job results
     */
    async waitForCompletion(jobId, options = {}) {
        const {
            pollInterval = 5000,
            maxWaitTime = 600000, // 10 minutes
            onProgress = null
        } = options;
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            const status = await this.checkJobStatus(jobId);
            
            if (onProgress) {
                onProgress(status);
            }
            
            if (status.status === 'completed') {
                return status;
            }
            
            if (status.status === 'failed') {
                throw new Error(`Job failed: ${status.error || 'Unknown error'}`);
            }
            
            await this.sleep(pollInterval);
        }
        
        throw new Error(`Job timed out after ${maxWaitTime}ms`);
    }
    
    /**
     * Submit research and wait for completion
     * @param {Object} params - Research parameters
     * @param {Object} options - Polling options
     * @returns {Promise<Object>} Completed research results
     */
    async submitAndWait(params, options = {}) {
        const { jobId } = await this.submitResearch(params);
        return await this.waitForCompletion(jobId, options);
    }
    
    /**
     * Retry request with exponential backoff
     */
    async retryRequest(requestFn, attempt = 1) {
        try {
            return await requestFn();
        } catch (error) {
            if (attempt >= this.retryAttempts) {
                throw error;
            }
            
            const isRetryable = error.response && 
                (error.response.status >= 500 || error.response.status === 429);
            
            if (!isRetryable) {
                throw error;
            }
            
            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            await this.sleep(delay);
            
            return this.retryRequest(requestFn, attempt + 1);
        }
    }
    
    /**
     * Format error for better readability
     */
    formatError(error) {
        if (error.response) {
            return new Error(
                `API Error ${error.response.status}: ${
                    error.response.data?.error || error.response.statusText
                }`
            );
        } else if (error.request) {
            return new Error('No response from server. Check if the EC2 instance is running.');
        } else {
            return error;
        }
    }
    
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Example usage module
class ResearchJobBuilder {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.params = {
            intent: '',
            swarmConfig: {},
            researchConfig: {},
            metadata: {}
        };
        return this;
    }
    
    setIntent(intent) {
        this.params.intent = intent;
        return this;
    }
    
    setStrategy(strategy) {
        this.params.swarmConfig.strategy = strategy;
        return this;
    }
    
    setMaxAgents(maxAgents) {
        this.params.swarmConfig.maxAgents = maxAgents;
        return this;
    }
    
    setDepth(depth) {
        this.params.researchConfig.depth = depth;
        return this;
    }
    
    setFocus(focusAreas) {
        this.params.researchConfig.focus = focusAreas;
        return this;
    }
    
    setMetadata(metadata) {
        this.params.metadata = { ...this.params.metadata, ...metadata };
        return this;
    }
    
    build() {
        if (!this.params.intent) {
            throw new Error('Intent is required');
        }
        return { ...this.params };
    }
}

// Preset research templates
const ResearchTemplates = {
    MVP_RESEARCH: {
        swarmConfig: {
            strategy: 'research',
            maxAgents: 8,
            timeout: 90,
            parallel: true
        },
        researchConfig: {
            depth: 'comprehensive',
            focus: ['market_analysis', 'competitive_landscape', 'technical_feasibility', 'user_needs'],
            outputFormat: 'structured',
            includeSources: true,
            includeRecommendations: true
        }
    },
    
    COMPETITIVE_ANALYSIS: {
        swarmConfig: {
            strategy: 'analysis',
            maxAgents: 6,
            timeout: 60
        },
        researchConfig: {
            depth: 'detailed',
            focus: ['competitors', 'market_share', 'features', 'pricing', 'strengths_weaknesses'],
            includeVisualizations: true
        }
    },
    
    MARKET_OPPORTUNITY: {
        swarmConfig: {
            strategy: 'research',
            maxAgents: 5,
            timeout: 45
        },
        researchConfig: {
            depth: 'exploratory',
            focus: ['market_size', 'growth_trends', 'unmet_needs', 'entry_barriers'],
            timeframe: 'next_5_years'
        }
    },
    
    TECHNICAL_FEASIBILITY: {
        swarmConfig: {
            strategy: 'analysis',
            maxAgents: 4,
            timeout: 30
        },
        researchConfig: {
            depth: 'technical',
            focus: ['architecture', 'technology_stack', 'scalability', 'security', 'cost_analysis']
        }
    }
};

// Export everything
module.exports = {
    ClaudeFlowResearchClient,
    ResearchJobBuilder,
    ResearchTemplates
};

// Example usage
if (require.main === module) {
    // Example 1: Simple research submission
    async function example1() {
        const client = new ClaudeFlowResearchClient({
            baseUrl: 'http://your-ec2-ip-here',
            webhookSecret: 'your-secret-here'
        });
        
        try {
            const result = await client.submitResearch({
                intent: 'Research the market opportunity for AI-powered code review tools',
                swarmConfig: {
                    maxAgents: 6
                },
                researchConfig: {
                    focus: ['market_size', 'competitors', 'technical_requirements']
                }
            });
            
            console.log('Job submitted:', result.jobId);
            
            // Wait for completion
            const completed = await client.waitForCompletion(result.jobId, {
                onProgress: (status) => console.log('Status:', status.status)
            });
            
            console.log('Research completed:', completed);
        } catch (error) {
            console.error('Error:', error.message);
        }
    }
    
    // Example 2: Using the job builder
    async function example2() {
        const client = new ClaudeFlowResearchClient({
            baseUrl: 'http://your-ec2-ip-here'
        });
        
        const builder = new ResearchJobBuilder();
        const job = builder
            .setIntent('Find the best SaaS MVP opportunity in the HR tech space')
            .setStrategy('research')
            .setMaxAgents(8)
            .setDepth('comprehensive')
            .setFocus(['market_gaps', 'user_pain_points', 'competitive_advantage'])
            .setMetadata({ project: 'hr-tech-mvp', priority: 'high' })
            .build();
        
        const result = await client.submitAndWait(job);
        console.log('Research result:', result);
    }
    
    // Example 3: Using templates
    async function example3() {
        const client = new ClaudeFlowResearchClient({
            baseUrl: 'http://your-ec2-ip-here'
        });
        
        const result = await client.submitResearch({
            intent: 'Analyze the competitive landscape for project management tools',
            ...ResearchTemplates.COMPETITIVE_ANALYSIS,
            metadata: {
                requestedBy: 'product-team',
                deadline: '2024-01-15'
            }
        });
        
        console.log('Analysis started:', result.jobId);
    }
}