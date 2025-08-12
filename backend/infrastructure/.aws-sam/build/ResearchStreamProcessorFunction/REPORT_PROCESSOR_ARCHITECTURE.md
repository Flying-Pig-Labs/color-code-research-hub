# Report Processor Architecture Specification

## Overview
This document defines the architecture for the new `reportProcessor.js` Lambda function that processes raw Perplexity research content into 5 structured artifacts using Claude LLM.

## Lambda Function Specification

### ReportProcessorFunction
- **File**: `/lambda/handlers/reportProcessor.js`
- **Runtime**: Node.js 18.x
- **Timeout**: 900 seconds (15 minutes)
- **Memory**: 3008MB (same as PlanOrchestrator for consistency)
- **Trigger**: S3 ObjectCreated events from `raw/` prefix
- **Reserved Concurrency**: 5 (to manage LLM API rate limits)

### Environment Variables
```javascript
{
  REPORTS_BUCKET_NAME: "color-code-research-results-{account-id}",
  REPORTS_TABLE_NAME: "ResearchReports", 
  ANTHROPIC_API_KEY: "Retrieved from Secrets Manager",
  OPENAI_API_KEY: "Retrieved from Secrets Manager (fallback)",
  NODE_ENV: "production"
}
```

### IAM Permissions Required
```yaml
Policies:
  - S3FullAccess: color-code-research-results-*
  - DynamoDBFullAccess: ResearchReports table
  - SecretsManagerReadAccess: anthropic_key, openai_key secrets
  - CloudWatchLogs: Standard Lambda logging
```

## Processing Pipeline Architecture

### Input Processing
1. **S3 Event Trigger**: New file in `raw/` prefix
2. **Content Extraction**: Download and parse raw research JSON
3. **Metadata Validation**: Ensure required fields present
4. **DynamoDB Update**: Set status to "processing"

### Parallel Artifact Generation
The system processes 5 artifacts concurrently using Promise.all():

```javascript
const artifactPromises = [
  generateExecutiveSummary(rawContent, metadata),
  generateDetailedAnalysis(rawContent, metadata), 
  generateActionItems(rawContent, metadata),
  generateVisualReport(rawContent, metadata),
  generateRawDataExport(rawContent, metadata)
];

const results = await Promise.all(artifactPromises);
```

### Output Storage
1. **S3 Upload**: Store each artifact in `processed/{reportId}/` 
2. **DynamoDB Update**: Update artifact status and S3 keys
3. **Error Handling**: Individual artifact failures don't stop others
4. **Final Status**: Set overall status to "completed" or "partial"

## LLM Prompt Specifications

### 1. Executive Summary Prompt
```javascript
const EXECUTIVE_SUMMARY_PROMPT = `
ROLE: You are a strategic intelligence analyst creating executive briefings.

TASK: Analyze the provided research content and create a comprehensive executive summary.

INPUT: Raw research content from Perplexity API

OUTPUT FORMAT (JSON):
{
  "title": "Executive Summary: [Topic]",
  "keyFindings": [
    "Finding 1 with strategic importance",
    "Finding 2 with business impact", 
    "Finding 3 with risk assessment"
  ],
  "strategicRecommendations": [
    {
      "recommendation": "Action to take",
      "rationale": "Why this action is important",
      "priority": "high|medium|low",
      "timeframe": "immediate|short-term|long-term"
    }
  ],
  "riskAssessment": {
    "highRisks": ["Risk 1", "Risk 2"],
    "mediumRisks": ["Risk 3", "Risk 4"], 
    "lowRisks": ["Risk 5", "Risk 6"]
  },
  "summary": "2-3 paragraph executive overview",
  "metadata": {
    "generatedAt": "${new Date().toISOString()}",
    "sourceWordCount": "approximate word count",
    "confidenceLevel": "high|medium|low"
  }
}

CONTENT TO ANALYZE:
{rawContent}

CONTEXT:
- Team: {team}
- Original Request: {originalRequest}
- Research Model: {model}
`;
```

### 2. Detailed Analysis Prompt
```javascript
const DETAILED_ANALYSIS_PROMPT = `
ROLE: You are a research analyst creating comprehensive technical analysis reports.

TASK: Transform raw research into structured, detailed analysis with methodology and evidence.

OUTPUT FORMAT (JSON):
{
  "title": "Detailed Analysis: [Topic]",
  "methodology": {
    "researchApproach": "Description of analysis methodology",
    "sourcesAnalyzed": "Types and quality of sources",
    "limitations": "Analytical constraints and caveats"
  },
  "findings": [
    {
      "category": "Classification of finding",  
      "title": "Specific finding title",
      "description": "Detailed explanation",
      "evidence": ["Supporting evidence 1", "Supporting evidence 2"],
      "confidence": "high|medium|low",
      "implications": "What this means for the organization"
    }
  ],
  "trends": [
    {
      "trend": "Identified trend",
      "direction": "increasing|decreasing|stable",
      "significance": "high|medium|low",
      "timeframe": "Current timeframe of trend"
    }
  ],
  "conclusions": [
    "Evidence-based conclusion 1",
    "Evidence-based conclusion 2"
  ],
  "recommendedActions": [
    {
      "action": "Specific action to take",
      "justification": "Analysis-based reasoning", 
      "resources": "Required resources",
      "timeline": "Suggested timeframe"
    }
  ],
  "appendix": {
    "keyTerms": {"term": "definition"},
    "calculations": ["Any calculations performed"],
    "assumptions": ["Assumptions made in analysis"]
  }
}

CONTENT TO ANALYZE:
{rawContent}
`;
```

### 3. Action Items Prompt
```javascript
const ACTION_ITEMS_PROMPT = `
ROLE: You are a project manager creating actionable task lists from research findings.

TASK: Extract actionable items and organize them by priority and timeline.

OUTPUT FORMAT (JSON):
{
  "title": "Action Items: [Topic]",
  "summary": "Overview of action items generated",
  "categories": [
    {
      "category": "Category name (e.g., 'Security', 'Operations')",
      "description": "What this category addresses",
      "actions": [
        {
          "id": "unique-action-id",
          "title": "Clear, actionable task title",
          "description": "Detailed task description",
          "priority": "critical|high|medium|low",
          "complexity": "simple|moderate|complex",
          "estimatedEffort": "Time/resource estimate",
          "dependencies": ["List of dependencies"],
          "assignedRole": "Who should handle this",
          "deadline": "Suggested completion timeframe",
          "successCriteria": ["How to measure completion"],
          "risks": ["Potential risks if not completed"]
        }
      ]
    }
  ],
  "timeline": {
    "immediate": ["Actions needed within 24-48 hours"],
    "shortTerm": ["Actions needed within 1-4 weeks"], 
    "mediumTerm": ["Actions needed within 1-3 months"],
    "longTerm": ["Actions needed beyond 3 months"]
  },
  "resourceRequirements": {
    "personnel": ["Required roles/skills"],
    "technology": ["Required tools/systems"],
    "budget": "Estimated budget requirements",
    "external": ["Third-party resources needed"]
  }
}

CONTENT TO ANALYZE:
{rawContent}
`;
```

### 4. Visual Report Prompt
```javascript
const VISUAL_REPORT_PROMPT = `
ROLE: You are a data visualization specialist creating chart and graph specifications.

TASK: Identify data visualization opportunities and create specifications for charts, graphs, and visual elements.

OUTPUT FORMAT (JSON):
{
  "title": "Visual Report Specifications: [Topic]",
  "summary": "Overview of visualization opportunities identified",
  "visualizations": [
    {
      "id": "viz-1",
      "type": "bar|line|pie|scatter|timeline|heatmap|network|treemap",
      "title": "Chart title",
      "description": "What this visualization shows",
      "dataSource": "Where the data comes from in the research",
      "xAxis": {
        "label": "X-axis label",
        "dataType": "categorical|numerical|temporal",
        "values": ["Sample values"]
      },
      "yAxis": {
        "label": "Y-axis label", 
        "dataType": "numerical|categorical",
        "scale": "linear|logarithmic"
      },
      "dataPoints": [
        {
          "label": "Data point label",
          "value": "Extracted value",
          "color": "Suggested color code",
          "note": "Additional context"
        }
      ],
      "insights": ["Key insights this visualization reveals"],
      "priority": "high|medium|low"
    }
  ],
  "dashboardLayout": {
    "sections": [
      {
        "title": "Dashboard section title",
        "visualizations": ["viz-1", "viz-2"],
        "description": "What this section shows"
      }
    ]
  },
  "designGuidelines": {
    "colorPalette": ["#color1", "#color2", "#color3"],
    "typography": "Font and sizing recommendations",
    "layout": "Layout principles for the visualizations"
  }
}

CONTENT TO ANALYZE:
{rawContent}
`;
```

### 5. Raw Data Export Prompt
```javascript
const RAW_DATA_EXPORT_PROMPT = `
ROLE: You are a data engineer creating structured data exports from research content.

TASK: Extract and structure all data points, sources, and metadata into a comprehensive data export.

OUTPUT FORMAT (JSON):
{
  "title": "Raw Data Export: [Topic]",
  "exportMetadata": {
    "generatedAt": "${new Date().toISOString()}",
    "sourceDocument": "Original research file reference",
    "processingVersion": "1.0",
    "totalRecords": "Number of data records extracted"
  },
  "sources": [
    {
      "id": "source-1",
      "type": "academic|news|report|website|database",
      "title": "Source title",
      "author": "Author/organization",
      "url": "Source URL if available",
      "date": "Publication date",
      "reliability": "high|medium|low",
      "relevance": "high|medium|low"
    }
  ],
  "dataPoints": [
    {
      "id": "data-point-1",
      "category": "Classification of data",
      "value": "Extracted value/fact",
      "unit": "Unit of measurement if applicable",
      "sourceId": "Reference to source",
      "confidence": "high|medium|low",
      "timestamp": "When this data was current",
      "context": "Additional context for the data point"
    }
  ],
  "entities": [
    {
      "name": "Entity name (company, person, location)",
      "type": "organization|person|location|technology|concept",
      "description": "Description of the entity",
      "mentions": "Number of times mentioned",
      "sentiment": "positive|neutral|negative",
      "relevance": "high|medium|low"
    }
  ],
  "statistics": {
    "totalWords": "Word count of source",
    "totalSources": "Number of sources",
    "dataQuality": "overall|high|medium|low",
    "coverage": "Percentage of topic covered",
    "gaps": ["Identified information gaps"]
  },
  "rawContent": {
    "originalText": "Full original research content",
    "processedSections": ["List of processed sections"],
    "unusedContent": "Content that wasn't categorized"
  }
}

CONTENT TO ANALYZE:
{rawContent}
`;
```

## Error Handling Architecture

### Individual Artifact Failures
- Each artifact generation is wrapped in try-catch
- Failed artifacts are marked as "failed" in DynamoDB
- Processing continues for remaining artifacts
- Partial success is acceptable

### Complete Processing Failures
- Lambda timeout handling with graceful degradation
- Progress checkpointing in DynamoDB
- Retry mechanism for transient failures
- Dead letter queue for permanent failures

### Rate Limiting & API Failures
- Claude API rate limits: Exponential backoff (2s, 4s, 8s)
- OpenAI fallback: Automatic switch on Claude 529 errors
- Concurrent processing: Max 3 artifacts simultaneously

## Integration Points

### S3 Event Configuration
```yaml
Events:
  ProcessRawResearch:
    Type: S3
    Properties:
      Bucket: !Ref ResearchResultsBucket
      Events: s3:ObjectCreated:*
      Filter:
        S3Key:
          Rules:
            - Name: prefix
              Value: raw/
            - Name: suffix
              Value: .json
```

### DynamoDB Integration
- Update processing status at each stage
- Store artifact S3 keys for easy retrieval
- Track processing metrics and timing
- Enable frontend progress monitoring

### Frontend API Integration  
- New endpoints in `researchApi.py` for artifact access
- Real-time processing status updates
- Download capabilities for each artifact type
- Bulk export functionality for complete reports

## Monitoring & Observability

### CloudWatch Metrics
- Processing success/failure rates per artifact type
- Processing duration by artifact complexity
- API rate limit hits and fallback usage
- S3 upload success rates

### Logging Strategy
- Structured JSON logging for searchability
- Processing stage markers for debugging
- Error context preservation
- Performance timing data

### Alerting Thresholds
- Processing failure rate > 10%
- Average processing time > 10 minutes  
- API rate limit hits > 50/hour
- S3 upload failure rate > 5%

## Deployment Considerations

### Lambda Configuration
- VPC not required (external API access needed)
- Environment variables loaded from Parameter Store
- Secrets Manager integration for API keys
- Dead letter queue configuration

### Dependencies
- AWS SDK v3 for better performance
- Axios for HTTP requests (Perplexity API compatibility)
- UUID library for ID generation
- JSON schema validation library

### Testing Strategy
- Unit tests for each artifact generator
- Integration tests with mock S3/DynamoDB
- Load testing for concurrent processing
- End-to-end testing with real Perplexity data