const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

// Initialize AWS clients
const s3Client = new S3Client({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });

// Environment variables
const RESEARCH_BUCKET = process.env.RESEARCH_BUCKET || 'color-code-research-results-984906149037';
const RESEARCH_REPORTS_TABLE = process.env.RESEARCH_REPORTS_TABLE || 'ResearchReports';

/**
 * Lambda handler for fetching individual research reports
 */
exports.handler = async (event) => {
    console.log('Get report request:', JSON.stringify(event, null, 2));
    
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    };
    
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    try {
        // Extract reportId from path parameters
        const reportId = event.pathParameters?.reportId;
        
        if (!reportId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Report ID is required',
                    message: 'Please provide a valid report ID in the URL path'
                })
            };
        }
        
        console.log('Fetching report:', reportId);
        
        // First, get report metadata from DynamoDB
        const dbParams = {
            TableName: RESEARCH_REPORTS_TABLE,
            Key: {
                reportId: { S: reportId }
            }
        };
        
        console.log('DynamoDB query params:', JSON.stringify(dbParams, null, 2));
        const dbResponse = await dynamoClient.send(new GetItemCommand(dbParams));
        
        if (!dbResponse.Item) {
            console.log('Report not found in DynamoDB:', reportId);
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Report not found',
                    message: `Report with ID ${reportId} does not exist`
                })
            };
        }
        
        // Unmarshall DynamoDB item
        const reportMetadata = unmarshall(dbResponse.Item);
        console.log('Found report metadata:', JSON.stringify(reportMetadata, null, 2));
        
        // Get report content from S3 - check for new structure first, then fall back to old
        let s3Key = reportMetadata.s3ReportKey || reportMetadata.s3Key;
        
        // If we have the new structure, prefer the formatted report
        if (reportMetadata.s3ReportKey) {
            s3Key = reportMetadata.s3ReportKey; // This is the .md file
        } else if (reportMetadata.s3ResponseKey) {
            s3Key = reportMetadata.s3ResponseKey; // This is the raw response.json
        } else if (reportMetadata.s3Key) {
            s3Key = reportMetadata.s3Key; // Legacy structure
        } else {
            console.log('No S3 key found for report:', reportId);
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Report content not available',
                    message: 'S3 key not found in report metadata'
                })
            };
        }
        
        console.log('Fetching from S3 bucket:', RESEARCH_BUCKET, 'key:', s3Key);
        
        const s3Params = {
            Bucket: RESEARCH_BUCKET,
            Key: s3Key
        };
        
        try {
            const s3Response = await s3Client.send(new GetObjectCommand(s3Params));
            const reportContent = await streamToString(s3Response.Body);
            
            console.log('Successfully fetched report content, length:', reportContent.length);
            
            // Parse the content based on file type
            let parsedContent = reportContent;
            let isMarkdown = s3Key.endsWith('.md');
            
            if (!isMarkdown) {
                // If it's JSON (old format or response.json), try to parse it
                try {
                    const jsonContent = JSON.parse(reportContent);
                    // If the content is structured, extract the main content
                    parsedContent = jsonContent.content || jsonContent.result || reportContent;
                } catch (parseError) {
                    // If not JSON, use as-is
                    console.log('Content is not JSON, using as-is');
                }
            }
            
            // Prepare response data
            const responseData = {
                metadata: {
                    title: reportMetadata.title || 'Research Report',
                    // Use processedSummary from DynamoDB if available, otherwise generate
                    summary: reportMetadata.processedSummary || reportMetadata.contentSummary || generateSummary(parsedContent),
                    team: reportMetadata.team || 'unknown',
                    createdAt: reportMetadata.createdAt,
                    reportId: reportMetadata.reportId,
                    s3BasePath: reportMetadata.s3BasePath,
                    s3ReportKey: reportMetadata.s3ReportKey,
                    s3SummaryKey: reportMetadata.s3SummaryKey,
                    requestId: reportMetadata.requestId || reportMetadata.reportId,
                    username: reportMetadata.username || 'fprior',
                    summaryWordCount: reportMetadata.summaryWordCount,
                    processingCompletedAt: reportMetadata.processingCompletedAt || reportMetadata.pipelineCompletedAt
                },
                content: parsedContent,
                contentType: isMarkdown ? 'markdown' : 'json'
            };
            
            return {
                statusCode: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(responseData)
            };
            
        } catch (s3Error) {
            console.error('Error fetching from S3:', s3Error);
            
            if (s3Error.name === 'NoSuchKey' || s3Error.Code === 'NoSuchKey') {
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        error: 'Report content not found',
                        message: 'The report content file could not be found in storage'
                    })
                };
            }
            
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Failed to fetch report content',
                    message: 'An error occurred while retrieving the report from storage',
                    details: s3Error.message
                })
            };
        }
        
    } catch (error) {
        console.error('Handler error:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'An unexpected error occurred while processing the request',
                details: error.message
            })
        };
    }
};

/**
 * Convert a stream to string
 */
async function streamToString(stream) {
    const chunks = [];
    
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    
    return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Generate a summary from content (first 120 words)
 */
function generateSummary(content) {
    if (!content || typeof content !== 'string') {
        return 'This research report provides comprehensive analysis and insights based on the requested scope and methodology.';
    }
    
    // Remove markdown headers and formatting
    const cleanContent = content
        .replace(/^#{1,6}\s+/gm, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`([^`]+)`/g, '$1') // Remove inline code
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim();
    
    // Get first 120 words
    const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
    const summaryWords = words.slice(0, 120);
    
    let summary = summaryWords.join(' ');
    
    // Add ellipsis if truncated
    if (words.length > 120) {
        summary += '...';
    }
    
    // Fallback if summary is too short or empty
    if (summary.length < 50) {
        return 'This research report provides comprehensive analysis and insights based on the requested scope and methodology.';
    }
    
    return summary;
}