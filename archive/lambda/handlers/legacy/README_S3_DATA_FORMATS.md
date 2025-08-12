# S3 Storage and Data Formatting Implementation

## Overview

This implementation provides enhanced S3 storage with multiple data formats for research reports generated via the Perplexity API. The system creates structured, accessible data in five different formats stored in AWS S3.

## Architecture

### Lambda Function
- **File**: `generateResearchReport.js`
- **Runtime**: Node.js 18.x  
- **Memory**: 1024 MB
- **Timeout**: 900 seconds (15 minutes)
- **API Endpoints**: `/api/research/v2/*`

### S3 Key Structure

All artifacts for a research report are stored under:
```
reports/{request_id}/
├── raw.json          # Original Perplexity API response
├── report.json       # Structured React-ready format
├── report.md         # Markdown formatted report
├── report.html       # Sanitized HTML format
└── cleaned.md        # Human-readable cleaned markdown
```

## Data Formats

### 1. Raw JSON (`raw.json`)
- **Purpose**: Preserve original Perplexity API response
- **Content**: Complete unmodified response from Perplexity
- **Use Case**: Debugging, audit trails, data recovery

### 2. Structured Report JSON (`report.json`)
- **Purpose**: React-ready structured data with analysis
- **Schema**: Comprehensive structured format with metadata, analysis, quality metrics
- **Content**: 
  - Metadata (title, team, requester, etc.)
  - Request details (tokens, processing time)
  - Content analysis (summary, sections, word count)
  - Automated analysis (key findings, recommendations, risks, action items)
  - Quality metrics (confidence, completeness, relevance scores)
  - Source citations
  - Format availability flags

### 3. Markdown Report (`report.md`)
- **Purpose**: Formatted report for documentation systems
- **Content**: Well-structured markdown with sections, metadata, analysis
- **Features**: 
  - Executive summary
  - Key findings as bullet points
  - Recommendations section
  - Risk assessment
  - Action items with checkboxes
  - Source citations with links

### 4. Sanitized HTML (`report.html`)
- **Purpose**: Web-ready HTML for display
- **Processing**: 
  - Markdown-to-HTML conversion using `marked`
  - HTML sanitization using `isomorphic-dompurify`
  - XSS protection with allowed tags/attributes only
- **Security**: Removes scripts, dangerous attributes, and malicious content

### 5. Cleaned Markdown (`cleaned.md`)
- **Purpose**: Human-readable cleaned content
- **Processing**:
  - Normalized whitespace and line breaks
  - Consistent bullet point formatting
  - Cleaned section headers
  - Removed excessive formatting

## JSON Schema Structure

```typescript
interface StructuredReport {
  id: string;                    // Request ID
  timestamp: string;             // ISO timestamp
  metadata: {
    title: string;
    team: string;
    requester: string;
    vendorName?: string;
    companyName?: string;
    tags: string[];
    model: string;
    reasoning_effort: string;
  };
  request: {
    originalPrompt: string;
    processingTime: number;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
  };
  content: {
    summary: string;             // First 500 chars + ellipsis
    fullText: string;           // Complete content
    wordCount: number;
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
  analysis: {
    keyFindings: string[];      // Extracted bullet points
    recommendations: string[];  // Actionable recommendations
    riskAssessment: Array<{
      type: string;
      description: string;
      severity: string;
    }>;
    actionItems: Array<{
      action: string;
      priority: string;
      status: string;
    }>;
  };
  sources: Array<{
    url: string;
    title: string;
    excerpt: string;
    relevance: number;
  }>;
  quality: {
    confidence: number;         // 0-1 score
    completeness: number;       // 0-1 score  
    relevance: number;          // 0-1 score
  };
  formats: {
    raw: boolean;
    structured: boolean;
    markdown: boolean;
    html: boolean;
    cleaned: boolean;
  };
}
```

## Dependencies

### Core AWS SDKs
- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/client-dynamodb` - Metadata storage
- `@aws-sdk/client-secrets-manager` - API key management

### Content Processing
- `marked` (v12.0.0) - Markdown to HTML conversion
- `isomorphic-dompurify` (v2.8.0) - HTML sanitization
- `axios` - HTTP requests to Perplexity API
- `uuid` - Request ID generation

## API Endpoints

### POST `/api/research/v2`
Create a new research job with structured data output.

**Request Body:**
```json
{
  "content": "Research question or task",
  "title": "Report title",
  "team": "red|black|white",
  "requester": "Requester name",
  "vendorName": "Vendor name (optional)",
  "companyName": "Company name (optional)",
  "tags": ["tag1", "tag2"],
  "model": "sonar-deep-research",
  "reasoning_effort": "low|medium|high"
}
```

**Response:**
```json
{
  "success": true,
  "request_id": "uuid",
  "status": "pending",
  "metadata": { ... },
  "timestamp": "ISO timestamp"
}
```

### GET `/api/research/v2/status/{requestId}`
Check job status and retrieve completed results.

**Response (Completed):**
```json
{
  "success": true,
  "request_id": "uuid",
  "status": "completed",
  "content": "Full text content",
  "summary": "Executive summary",
  "s3_locations": {
    "bucket": "bucket-name",
    "baseKey": "reports/uuid",
    "formats": {
      "raw": "reports/uuid/raw.json",
      "structured": "reports/uuid/report.json",
      "markdown": "reports/uuid/report.md",
      "html": "reports/uuid/report.html",
      "cleaned": "reports/uuid/cleaned.md"
    }
  },
  "analysis": { ... },
  "quality": { ... },
  "sources": [ ... ]
}
```

### GET `/api/research/v2/reports`
List research reports with metadata.

**Query Parameters:**
- `team` (optional) - Filter by team
- `limit` (optional, default: 50) - Result limit

## Content Analysis Features

### Automated Section Extraction
- Detects markdown headers (`# ## ###`)
- Identifies numbered sections (`1. 2. 3.`)
- Recognizes colon-terminated headers (`Section Name:`)

### Key Findings Extraction
- Identifies bullet points with findings
- Filters out short/irrelevant items
- Limits to top 10 most relevant findings

### Recommendation Analysis
- Searches for recommendation keywords
- Extracts actionable recommendations
- Prioritizes based on context

### Risk Assessment
- Identifies risk-related content
- Categorizes by risk type
- Assigns severity levels

### Action Items
- Extracts actionable tasks
- Assigns priority levels
- Formats for task management

### Quality Scoring
- **Confidence**: Based on content length, structure, keywords
- **Completeness**: Based on expected report sections
- **Relevance**: Static score (could be enhanced with ML)

## Security Features

### HTML Sanitization
- Whitelist approach for allowed tags
- Removes script tags and dangerous attributes
- Protects against XSS attacks
- Validates URLs in links

### API Security
- API key caching for performance
- Error handling without exposing secrets
- Input validation and sanitization

## DynamoDB Integration

The system logs report metadata to DynamoDB for tracking:

**Table**: `ResearchReports`
**Primary Key**: `reportId`  
**GSI**: `team-createdAt-index`

**Stored Fields:**
- Report metadata and summary
- S3 key locations for all formats
- Quality metrics
- 90-day TTL for automatic cleanup

## Deployment

### SAM Template Configuration
```yaml
GenerateResearchReportFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../lambda/handlers/
    Handler: generateResearchReport.handler
    Runtime: nodejs18.x
    Timeout: 900
    MemorySize: 1024
    Environment:
      Variables:
        RESEARCH_BUCKET: !Ref ResearchResultsBucket
        RESEARCH_REPORTS_TABLE: !Ref ResearchReportsTable
```

### Required IAM Permissions
- Secrets Manager: `GetSecretValue`
- S3: `PutObject`, `GetObject`, `PutObjectAcl`
- DynamoDB: `PutItem`, `GetItem`, `Query`, `Scan`, `UpdateItem`

## Testing

The implementation includes comprehensive tests covering:
- JSON schema validation
- Content extraction algorithms
- HTML sanitization
- S3 key structure validation
- Error handling scenarios

**Test File**: `__tests__/generateResearchReport.test.js`

## Usage Examples

### Frontend Integration
```javascript
// Create research job
const response = await fetch('/api/research/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Research AI applications in healthcare',
    title: 'AI Healthcare Study',
    team: 'red',
    requester: 'Dr. Smith'
  })
});

const { request_id } = await response.json();

// Poll for completion
const status = await fetch(`/api/research/v2/status/${request_id}`);
const result = await status.json();

// Access structured data
console.log(result.analysis.keyFindings);
console.log(result.s3_locations.formats.html);
```

### Backend Processing
```javascript
// Access S3 stored formats
const s3Key = `reports/${requestId}/report.json`;
const structuredData = await s3Client.getObject({
  Bucket: 'research-bucket',
  Key: s3Key
});

// Process the structured report
const report = JSON.parse(await structuredData.Body.transformToString());
console.log(`Confidence: ${report.quality.confidence}`);
console.log(`Key findings: ${report.analysis.keyFindings.length}`);
```

## Performance Considerations

- **Memory**: 1024 MB to handle large content processing
- **Timeout**: 15 minutes for complex analysis
- **Caching**: API key caching reduces Secrets Manager calls
- **Batching**: Parallel S3 uploads for all formats
- **Error Handling**: Graceful degradation if S3 upload fails

## Future Enhancements

1. **ML-Enhanced Analysis**: Use ML models for better quality scoring
2. **Custom Templates**: Support for different report templates
3. **Real-time Processing**: WebSocket updates for progress
4. **Advanced Formatting**: PDF generation support
5. **Multi-language**: Support for non-English content analysis