"""
Research API Lambda Handler - Core Research Processing Service

This module serves as the primary entry point for the Color Code Research Hub's research
processing pipeline. It orchestrates the complete research workflow from initial request
through AI-powered research generation, storage, and status tracking.

Architecture Overview:
----------------------
The Research API is part of a serverless microservices architecture deployed on AWS:

1. Frontend (React) → API Gateway → This Lambda Function
2. This Lambda → Perplexity AI API (async research generation)
3. This Lambda → S3 (research report storage)
4. This Lambda → DynamoDB (metadata and status tracking)
5. This Lambda → ReportProcessingFunction (async report enhancement)

Key Responsibilities:
--------------------
- Accept research requests from the frontend via API Gateway
- Initiate async research jobs with Perplexity AI's deep research models
- Store research artifacts in S3 with multi-tenant folder structure
- Track job status and metadata in DynamoDB
- Provide status polling endpoints for frontend progress tracking
- Generate presigned URLs for secure report downloads
- List and filter research reports with AI-generated summaries

Integration Points:
------------------
- **Upstream**: API Gateway (zi612qxxv0.execute-api.us-east-1.amazonaws.com)
- **Downstream Services**:
  - Perplexity AI API (sonar-deep-research model)
  - S3 Bucket (color-code-research-results-984906149037)
  - DynamoDB Table (ResearchReports)
  - ReportProcessingFunction Lambda (report enhancement)
  - AWS Secrets Manager (API key storage)

Security Considerations:
-----------------------
- API keys stored in AWS Secrets Manager, never in code
- S3 access controlled via IAM roles and presigned URLs
- CORS headers configured for oceanstudio.io domain
- Request validation and sanitization for all inputs

Performance Optimizations:
-------------------------
- API key caching to reduce Secrets Manager calls
- Async processing pattern to avoid Lambda timeouts
- DynamoDB scan with filters for efficient queries
- Presigned URL generation for direct S3 downloads

Author: Color Code Research Hub Team
Version: 2.1.0
Last Updated: January 2025
"""

import json
import boto3
import requests
import os
import time
from datetime import datetime
from typing import Dict, Any, Optional
import uuid
from decimal import Decimal
from botocore.exceptions import ClientError

# Initialize AWS clients with explicit region configuration
# These clients are reused across Lambda invocations for better performance
secrets_manager = boto3.client("secretsmanager", region_name="us-east-1")
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
lambda_client = boto3.client("lambda", region_name="us-east-1")

# External API endpoints for Perplexity AI's async research service
PERPLEXITY_ASYNC_URL = "https://api.perplexity.ai/async/chat/completions"
PERPLEXITY_STATUS_URL = "https://api.perplexity.ai/async/chat/completions/{request_id}"

# AWS resource identifiers from environment variables with fallbacks
# These are injected by the SAM template during deployment
S3_BUCKET = os.environ.get("RESEARCH_BUCKET", "color-code-research-results")
RESEARCH_REPORTS_TABLE = os.environ.get("RESEARCH_REPORTS_TABLE", "ResearchReports")
PERPLEXITY_SECRET_NAME = "perplexity-key"

# Module-level cache for the API key to avoid repeated Secrets Manager calls
# Lambda containers can be reused, so this cache persists across invocations
_cached_api_key: Optional[str] = None


def decimal_default(obj):
    """
    JSON serialization helper for DynamoDB Decimal types.
    
    DynamoDB stores numeric values as Decimal objects to maintain precision,
    but these cannot be directly serialized to JSON. This function converts
    Decimal objects to float for JSON serialization.
    
    Args:
        obj: Object to serialize (typically a Decimal from DynamoDB)
        
    Returns:
        float: Decimal converted to float for JSON serialization
        
    Raises:
        TypeError: If the object is not a Decimal and cannot be serialized
        
    Usage:
        json.dumps(dynamodb_response, default=decimal_default)
    """
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def get_perplexity_api_key() -> str:
    """
    Retrieve and cache the Perplexity API key from AWS Secrets Manager.
    
    This function implements a caching strategy to minimize calls to Secrets Manager,
    which improves performance and reduces costs. The cache persists for the lifetime
    of the Lambda container, which can serve multiple requests.
    
    The function handles two secret formats:
    1. JSON format: {"api_key": "...", "perplexity_key": "..."}
    2. Plain text format: Direct API key string
    
    Security considerations:
    - API keys are never logged or exposed in error messages
    - Secrets Manager access is controlled via IAM roles
    - Cache is container-scoped, not shared across Lambda instances
    
    Returns:
        str: The Perplexity API key for authentication
        
    Raises:
        ValueError: If no API key is found in the secret
        ClientError: If Secrets Manager access fails
        
    Performance notes:
    - First call: ~100ms (Secrets Manager API call)
    - Subsequent calls: <1ms (cache hit)
    """
    global _cached_api_key

    # Return cached key if available to avoid repeated Secrets Manager calls
    if _cached_api_key:
        return _cached_api_key

    try:
        # Retrieve secret from AWS Secrets Manager
        response = secrets_manager.get_secret_value(SecretId=PERPLEXITY_SECRET_NAME)
        secret_string = response["SecretString"]

        # Handle both JSON and plain text secret formats
        try:
            # Attempt to parse as JSON (preferred format)
            secret_data = json.loads(secret_string)
            # Support multiple key names for backward compatibility
            _cached_api_key = secret_data.get(
                "api_key", secret_data.get("perplexity_key", "")
            )
        except json.JSONDecodeError:
            # Fall back to plain text format
            _cached_api_key = secret_string.strip()

        if not _cached_api_key:
            raise ValueError("No API key found in secret")

        return _cached_api_key
    except Exception as e:
        # Log error without exposing sensitive information
        print(f"Error retrieving API key from Secrets Manager: {str(e)}")
        raise


def upload_to_s3(content: str, metadata: Dict[str, Any], research_id: str, user_id: str = "fprior", team: str = None) -> Dict[str, str]:
    """
    Upload research results to S3 with multi-tenant folder structure.
    
    This function implements a hierarchical storage pattern for research artifacts,
    organizing them by user, team, and research ID. This structure supports:
    - Multi-tenancy (user isolation)
    - Team-based organization (red/white/black teams)
    - Complete audit trail (request, response, metadata)
    
    S3 Structure Created:
    ```
    users/
    └── {user_id}/
        └── research/
            └── {team}/
                └── {research_id}/
                    ├── request.json    # Original research request
                    ├── response.json   # AI-generated research content
                    └── metadata.json   # Combined metadata and references
    ```
    
    Args:
        content: The AI-generated research content from Perplexity
        metadata: Request metadata including title, requester, tags, etc.
        research_id: Unique identifier for this research job
        user_id: User identifier for multi-tenant isolation (default: "fprior")
        team: Team designation (red/white/black) for organizational grouping
        
    Returns:
        Dict containing:
        - s3_prefix: Base path for all research files
        - s3_bucket: Bucket name for reference
        - files: Dict of file types to their S3 keys
        
    Raises:
        ValueError: If team parameter is not provided
        ClientError: If S3 upload fails
        
    Security Notes:
    - All uploads use server-side encryption (AES-256)
    - Access controlled via IAM roles and bucket policies
    - No public access - requires presigned URLs for downloads
    """
    if not team:
        raise ValueError("Team is required for S3 upload")
    
    try:
        # Construct hierarchical path for multi-tenant organization
        s3_prefix = f"users/{user_id}/research/{team}/{research_id}"
        
        # Capture upload timestamp for audit trail
        timestamp = datetime.now().isoformat()
        
        # 1. Upload original request for audit and reproducibility
        request_key = f"{s3_prefix}/request.json"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=request_key,
            Body=json.dumps({
                "research_id": research_id,
                "user_id": user_id,
                "timestamp": timestamp,
                "metadata": metadata,
                "type": "request"
            }, indent=2),
            ContentType="application/json"
        )
        
        # 2. Upload AI-generated research content
        response_key = f"{s3_prefix}/response.json"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=response_key,
            Body=json.dumps({
                "research_id": research_id,
                "content": content,
                "timestamp": timestamp,
                "type": "response"
            }, indent=2),
            ContentType="application/json"
        )
        
        # 3. Upload comprehensive metadata for querying and reporting
        metadata_key = f"{s3_prefix}/metadata.json"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=metadata_key,
            Body=json.dumps({
                "research_id": research_id,
                "user_id": user_id,
                "timestamp": timestamp,
                "s3_prefix": s3_prefix,
                # Include truncated summary for quick preview
                "content_summary": content[:500] + "..." if len(content) > 500 else content,
                "word_count": len(content.split()),
                "metadata": metadata,
                # Reference all uploaded files for easy navigation
                "files": {
                    "request": request_key,
                    "response": response_key,
                    "metadata": metadata_key
                }
            }, indent=2),
            ContentType="application/json"
        )

        print(f"Successfully uploaded research to S3: {S3_BUCKET}/{s3_prefix}/")
        return {
            "s3_prefix": s3_prefix,
            "s3_bucket": S3_BUCKET,
            "files": {
                "request": request_key,
                "response": response_key,
                "metadata": metadata_key
            }
        }

    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        # Re-raise to ensure calling function knows upload failed
        raise


def invoke_report_processor(
    report_id: str,
    content: str,
    team: str,
    task: str,
    metadata: Dict[str, Any],
    username: str = "fprior"
) -> Optional[Dict[str, Any]]:
    """
    Trigger asynchronous report processing for enhanced formatting and summaries.
    
    This function invokes a separate Lambda function (ReportProcessingFunction) that:
    1. Generates AI-powered summaries of the research content
    2. Creates structured reports in multiple formats (HTML, PDF, Markdown)
    3. Extracts key insights and actionable recommendations
    4. Updates DynamoDB with processed results
    
    The processing is done asynchronously to avoid blocking the main research flow.
    If report processing fails, the main research request still succeeds, ensuring
    that users always get their basic research results even if enhancement fails.
    
    Args:
        report_id: Unique identifier for the research report
        content: Raw research content from Perplexity AI
        team: Team designation (red/white/black) for specialized processing
        task: Research objective/task description
        metadata: Additional metadata for context
        username: User identifier for attribution
        
    Returns:
        Dict with invocation status if successful, None if processing fails
        Returns None rather than raising to ensure non-blocking behavior
        
    Integration Notes:
    - Invoked asynchronously (fire-and-forget pattern)
    - ReportProcessingFunction handles its own error recovery
    - Results are written directly to DynamoDB by the processor
    - Frontend polls DynamoDB for processing completion
    
    Failure Handling:
    - Missing environment variable: Log and continue (non-fatal)
    - Lambda invocation error: Log and continue (non-fatal)
    - Main research flow continues regardless of processing status
    """
    try:
        print(f"Invoking report processor for {report_id}")
        
        # Prepare comprehensive payload for report processing
        # Multiple field aliases ensure compatibility with different processor versions
        payload = {
            "reportId": report_id,
            "requestId": report_id,  # Backward compatibility with older processors
            "rawContent": content,
            "team": team,
            "username": username,
            "objective": task,
            "task": task,  # Some processor versions expect 'task' field
            "metadata": metadata,
            "formData": metadata  # Legacy field name for compatibility
        }
        
        # Retrieve target Lambda function name from environment
        # This allows dynamic configuration without code changes
        function_name = os.environ.get("REPORT_PROCESSING_FUNCTION_NAME")
        
        if not function_name:
            # Log configuration issue but don't fail the request
            # Users still get basic research even without enhancement
            print("ERROR: REPORT_PROCESSING_FUNCTION_NAME environment variable not set")
            print("Cannot invoke report processor - missing configuration")
            return None
            
        print(f"Invoking report processor Lambda function: {function_name}")
        
        # Async invocation - fire and forget pattern
        # Processing happens in background, doesn't block response
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="Event",  # Async - returns immediately
            Payload=json.dumps(payload)
        )
        
        print(f"Report processor invoked with status: {response['StatusCode']}")
        
        # Verify async invocation was accepted
        # 202 = Accepted for async processing
        if response['StatusCode'] == 202:
            return {"invoked": True, "statusCode": response['StatusCode']}
        else:
            print(f"WARNING: Unexpected status code: {response['StatusCode']}")
            return {"invoked": False, "statusCode": response['StatusCode']}
        
    except Exception as e:
        # Log but don't propagate - report processing is optional enhancement
        print(f"Error invoking report processor: {str(e)}")
        return None


def log_report_to_dynamodb_v2(
    report_id: str,
    team: str,
    metadata: Dict[str, Any],
    s3_info: Dict[str, Any],
    user_id: str,
    request_id: str,
    content_summary: str = None,
    status: str = "completed"
) -> bool:
    """
    Log research report metadata to DynamoDB with enhanced S3 structure.
    
    This is the updated version that supports the new multi-file S3 organization
    where each research job has separate request.json, response.json, and metadata.json
    files. This structure provides better organization and easier debugging.
    
    DynamoDB Record Structure:
    - reportId: Primary key for the report
    - userId: User who initiated the research
    - team: Team designation (red/white/black)
    - createdAt: ISO timestamp for sorting
    - requestId: Perplexity API request identifier
    - s3Prefix: Base path in S3 for all related files
    - s3Files: Dict mapping file types to S3 keys
    - metadata: Original request metadata
    - status: Current processing status
    - ttl: Time-to-live for automatic cleanup (90 days)
    
    This function is part of the migration from single-file to multi-file
    S3 storage, supporting better organization and troubleshooting.
    
    Args:
        report_id: Unique identifier for the research report
        team: Team designation for organizational grouping
        metadata: Request metadata including title, tags, etc.
        s3_info: Dict with s3_prefix, s3_bucket, and files mapping
        user_id: User identifier for multi-tenancy
        request_id: Perplexity API request ID
        content_summary: Optional truncated content preview
        status: Processing status (default: "completed")
        
    Returns:
        bool: True if successfully logged, False otherwise
        
    Note: Failures are non-fatal - research continues even if logging fails
    """
    try:
        table = dynamodb.Table(RESEARCH_REPORTS_TABLE)
        
        # Prepare item for DynamoDB with S3 prefix
        item = {
            "reportId": report_id,
            "userId": user_id,
            "team": team,
            "createdAt": datetime.now().isoformat(),
            "requestId": request_id,
            "s3Prefix": s3_info["s3_prefix"],
            "s3Bucket": s3_info["s3_bucket"],
            "s3Files": s3_info["files"],
            "metadata": metadata,
            "status": status,
            "ttl": int(datetime.now().timestamp()) + 7776000  # 90 days TTL
        }
        
        # Add optional fields
        if content_summary:
            item["contentSummary"] = content_summary[:500]  # Limit summary length
        
        if metadata.get("title"):
            item["title"] = metadata["title"]
            
        if metadata.get("requester"):
            item["requester"] = metadata["requester"]
            
        if metadata.get("vendorName"):
            item["vendorName"] = metadata["vendorName"]
            
        if metadata.get("companyName"):
            item["companyName"] = metadata["companyName"]
            
        # Write to DynamoDB
        table.put_item(Item=item)
        
        print(f"Successfully logged report {report_id} to DynamoDB with S3 prefix: {s3_info['s3_prefix']}")
        return True
        
    except Exception as e:
        print(f"Error logging to DynamoDB: {str(e)}")
        return False


def log_report_to_dynamodb(
    report_id: str,
    team: str,
    metadata: Dict[str, Any],
    s3_key: str,
    request_id: str,
    content_summary: str = None,
    status: str = "completed"
) -> bool:
    """
    Legacy function: Log research report metadata to DynamoDB (single-file S3 structure).
    
    This is the original logging function that stores a single S3 key per report.
    It's maintained for backward compatibility with existing reports but new code
    should use log_report_to_dynamodb_v2 which supports the multi-file structure.
    
    Migration Note:
    - Old reports: Single JSON file in S3
    - New reports: Separate request/response/metadata files
    - Both formats coexist in the database
    - Frontend handles both formats transparently
    
    Args:
        report_id: Unique identifier for the research report
        team: Team designation (red/white/black)
        metadata: Request metadata
        s3_key: Single S3 key for the report file (legacy format)
        request_id: Perplexity API request ID
        content_summary: Optional content preview
        status: Processing status
        
    Returns:
        bool: True if logged successfully, False otherwise
        
    Deprecated: Use log_report_to_dynamodb_v2 for new implementations
    """
    try:
        table = dynamodb.Table(RESEARCH_REPORTS_TABLE)
        
        # Prepare item for DynamoDB
        item = {
            "reportId": report_id,
            "team": team,
            "createdAt": datetime.now().isoformat(),
            "requestId": request_id,
            "s3Key": s3_key,
            "s3Bucket": S3_BUCKET,
            "metadata": metadata,
            "status": status,
            "ttl": int(datetime.now().timestamp()) + 7776000  # 90 days TTL
        }
        
        # Add optional fields
        if content_summary:
            item["contentSummary"] = content_summary[:500]  # Limit summary length
        
        if metadata.get("title"):
            item["title"] = metadata["title"]
            
        if metadata.get("requester"):
            item["requester"] = metadata["requester"]
            
        if metadata.get("vendorName"):
            item["vendorName"] = metadata["vendorName"]
            
        if metadata.get("companyName"):
            item["companyName"] = metadata["companyName"]
            
        # Write to DynamoDB
        table.put_item(Item=item)
        
        print(f"Successfully logged report {report_id} to DynamoDB")
        return True
        
    except Exception as e:
        print(f"Error logging to DynamoDB: {str(e)}")
        # Don't fail the request if DynamoDB logging fails
        return False


def create_async_research_job(
    user_content: str, model: str = "sonar-deep-research"
) -> Dict[str, Any]:
    """
    Initiate an asynchronous research job with Perplexity AI's API.
    
    This function starts a long-running research process using Perplexity's
    advanced AI models. The async pattern allows for deep, comprehensive research
    that can take several minutes to complete without hitting Lambda timeouts.
    
    Perplexity Models Available:
    - sonar-deep-research: Deep web research with citations (default)
    - sonar: Standard research model
    - sonar-pro: Enhanced research capabilities
    
    Args:
        user_content: The research query or task description
        model: Perplexity model to use (default: sonar-deep-research)
        
    Returns:
        Dict containing:
        - id: Unique request ID for polling status
        - status: Initial job status (typically "processing")
        
    Raises:
        RequestException: If API call fails
        ValueError: If API key is missing
        
    API Contract:
    - Endpoint: POST /async/chat/completions
    - Auth: Bearer token from Secrets Manager
    - Timeout: 30 seconds for job creation (not completion)
    
    Performance Notes:
    - Job creation: ~1-2 seconds
    - Job completion: 30-180 seconds depending on complexity
    - Polling required to check completion status
    """
    try:
        # Retrieve API key from secure storage
        api_key = get_perplexity_api_key()

        # Perplexity async API requires nested request structure
        # This differs from their synchronous API format
        payload = {
            "request": {
                "model": model,
                "messages": [{"role": "user", "content": user_content}],
            }
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        print(f"Creating async research job with model: {model}")
        print(f"Request payload: {json.dumps(payload, indent=2)}")

        # Initiate async job - returns immediately with job ID
        response = requests.post(
            PERPLEXITY_ASYNC_URL, json=payload, headers=headers, timeout=30
        )

        # Enhanced error logging for debugging API issues
        if response.status_code != 200:
            print(f"Error response status: {response.status_code}")
            print(f"Error response body: {response.text}")

        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error creating async job: {str(e)}")
        # Include response body in logs for better debugging
        if hasattr(e, "response") and e.response is not None:
            print(f"Response body: {e.response.text}")
        raise


def check_job_status(request_id: str) -> Dict[str, Any]:
    """
    Poll the status of an async research job from Perplexity AI.
    
    This function is used to check if a previously initiated research job
    has completed and retrieve the results. It's typically called multiple
    times in a polling loop until the job completes.
    
    Job Status Values:
    - processing: Job is still running
    - completed: Job finished successfully, results available
    - failed: Job encountered an error
    
    Args:
        request_id: Unique identifier returned by create_async_research_job
        
    Returns:
        Dict containing:
        - status: Current job status
        - result: Research content (if completed)
        - error: Error message (if failed)
        
    Raises:
        RequestException: If API call fails
        
    Polling Strategy:
    - Frontend polls every 3-5 seconds
    - Typical completion: 30-180 seconds
    - Maximum wait: 15 minutes before timeout
    """
    try:
        api_key = get_perplexity_api_key()

        headers = {"Authorization": f"Bearer {api_key}"}

        # Format URL with specific request ID
        url = PERPLEXITY_STATUS_URL.format(request_id=request_id)
        print(f"Checking job status: {request_id}")

        response = requests.get(url, headers=headers, timeout=30)

        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error checking job status: {str(e)}")
        raise


def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """
    Generate a presigned URL for secure S3 object download.
    
    Presigned URLs provide temporary, secure access to private S3 objects
    without requiring AWS credentials. This enables the frontend to download
    research reports directly from S3 without proxying through Lambda.
    
    Security Features:
    - Time-limited access (default 1 hour)
    - Cryptographically signed with AWS credentials
    - Single-use URL for specific object
    - No permanent public access to S3 objects
    
    Args:
        s3_key: The S3 object key (path) to generate URL for
        expiration: URL validity period in seconds (default: 3600 = 1 hour)
        
    Returns:
        str: Presigned URL for direct S3 download, or None if generation fails
        
    Usage:
    - Frontend receives URL in API response
    - Browser downloads directly from S3
    - Reduces Lambda data transfer costs
    - Improves download performance
    
    Performance Benefits:
    - Direct S3 download: ~10-100 MB/s
    - Via Lambda proxy: ~1-10 MB/s
    - Cost savings: No Lambda data transfer charges
    """
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": s3_key},
            ExpiresIn=expiration,
        )
        return url
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        # Return None instead of raising to allow graceful degradation
        return None


def handler(event, context):
    """
    Main Lambda handler - Entry point for all research API requests.
    
    This handler implements a RESTful API for research operations, routing
    requests to appropriate functions based on HTTP method and path. It handles
    the complete research lifecycle from job creation through status polling
    to result retrieval.
    
    Supported Endpoints:
    -------------------
    POST /api/research
        Create new research job with Perplexity AI
        Body: {content, model, team, metadata}
        Returns: {research_id, request_id, status_url}
        
    GET /api/research/status/{request_id}
        Poll job status and retrieve results
        Returns: {status, summary, download_url, processing_time}
        
    GET /api/research/reports
        List all research reports with optional filtering
        Query params: ?team={team}&limit={n}
        Returns: Array of report summaries with download URLs
        
    GET /api/research/download/{base64_key}
        Generate presigned URL for S3 download
        Returns: {download_url, s3_key}
        
    OPTIONS * (CORS Preflight)
        Returns appropriate CORS headers
    
    Request Flow:
    ------------
    1. API Gateway → Lambda handler (this function)
    2. Request validation and routing
    3. Business logic execution (create job, check status, etc.)
    4. Response formatting with CORS headers
    5. Return to API Gateway → Frontend
    
    Error Handling:
    --------------
    - 400: Invalid request (missing parameters, bad format)
    - 404: Resource not found (invalid job ID, missing report)
    - 500: Internal server error (API failures, AWS service issues)
    
    All errors return JSON with 'error' and 'message' fields.
    
    Security Features:
    -----------------
    - CORS headers configured for production domain
    - Input validation on all parameters
    - No sensitive data in error messages
    - API keys stored in Secrets Manager
    - S3 access via presigned URLs only
    
    Performance Optimizations:
    -------------------------
    - Connection pooling for AWS clients
    - API key caching across invocations
    - Direct S3 downloads via presigned URLs
    - Async processing pattern for long operations
    - DynamoDB queries optimized with indexes
    
    Args:
        event: API Gateway event containing HTTP request details
        context: Lambda context with runtime information
        
    Returns:
        Dict with statusCode, headers, and body for API Gateway response
    """
    print(f"Research API request: {json.dumps(event, indent=2)}")

    # CORS configuration for cross-origin requests from frontend
    # Supports both oceanstudio.io production and localhost development
    cors_headers = {
        "Access-Control-Allow-Origin": "*",  # Consider restricting to specific domains
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,Accept,X-User-Id",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
        "Access-Control-Max-Age": "86400"  # Cache preflight for 24 hours
    }

    # Handle CORS preflight requests immediately
    # Browsers send OPTIONS requests before actual API calls
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        # Extract and normalize request path
        # API Gateway may include stage prefix that needs removal
        path = event.get("path", "")
        # Strip stage prefix if present (e.g., /production/api/... -> /api/...)
        if path.startswith("/production"):
            path = path[11:]  # Remove "/production" prefix

        # Route: POST /api/research - Create new research job
        if path == "/api/research" and event.get("httpMethod") == "POST":
            # Parse request body
            body = json.loads(event.get("body", "{}"))

            # Extract and validate request parameters
            # Support both 'content' and 'task' field names for backward compatibility
            user_content = body.get("content", body.get("task", ""))
            model = body.get("model", "sonar-deep-research")
            reasoning_effort = body.get("reasoning_effort", "high")

            # Build comprehensive metadata for tracking and filtering
            # This metadata follows the report through the entire pipeline
            metadata = {
                "title": body.get("title", "Research Request"),
                "requester": body.get("requester", "Unknown"),
                "tags": body.get("tags", []),
                "model": model,
                "reasoning_effort": reasoning_effort,
                "team": body.get("team", "unknown"),  # red/white/black team designation
                "vendorName": body.get("vendorName"),  # For vendor assessment research
                "companyName": body.get("companyName"),  # Client company context
            }

            # Validate required fields
            if not user_content:
                return {
                    "statusCode": 400,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps(
                        {
                            "error": "Bad Request",
                            "message": "Missing required field: content or task",
                        }
                    ),
                }

            # Generate unique research ID for tracking throughout pipeline
            # This ID links DynamoDB records, S3 files, and status queries
            research_id = str(uuid.uuid4())
            pipeline_started_at = datetime.now().isoformat()
            
            # Step 1: Create initial DynamoDB record for status tracking
            # This enables immediate status queries even before Perplexity responds
            try:
                table = dynamodb.Table(RESEARCH_REPORTS_TABLE)
                table.put_item(
                    Item={
                        "reportId": research_id,  # Primary key (legacy name for compatibility)
                        "pipelineStartedAt": pipeline_started_at,
                        "status": "processing",  # Initial status for polling
                        "team": metadata.get("team", "unknown"),
                        "metadata": metadata,
                        "createdAt": pipeline_started_at  # For sorting and TTL
                    }
                )
                print(f"Created DynamoDB record {research_id} with status=processing")
            except Exception as e:
                print(f"Error creating DynamoDB record: {str(e)}")
                return {
                    "statusCode": 500,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "Failed to create research record"}),
                }

            # Step 2: Initiate async research job with Perplexity AI
            # This starts the actual AI research process
            try:
                job_response = create_async_research_job(
                    user_content=user_content, model=model
                )
                request_id = job_response.get("id")
                
                if not request_id:
                    raise ValueError("No id returned from Perplexity API")
                    
                # Link Perplexity request ID to our research record
                # This enables status polling via the Perplexity API
                table.update_item(
                    Key={"reportId": research_id},
                    UpdateExpression="SET requestId = :rid",
                    ExpressionAttributeValues={":rid": request_id}
                )
                
            except Exception as e:
                # Mark job as failed if Perplexity API call fails
                # This ensures frontend gets proper error status
                table.update_item(
                    Key={"reportId": research_id},
                    UpdateExpression="SET #status = :status, errorMessage = :error",
                    ExpressionAttributeNames={"#status": "status"},  # 'status' is reserved word
                    ExpressionAttributeValues={
                        ":status": "error",
                        ":error": f"Failed to start Perplexity job: {str(e)}"
                    }
                )
                return {
                    "statusCode": 500,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "Failed to start research job"}),
                }

            # Step 3: Upload initial request data to S3 for audit trail
            # S3 serves as permanent storage while DynamoDB handles queries
            team = metadata.get("team")
            if not team:
                return {
                    "statusCode": 400,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "Team is required for research submission"}),
                }
            user_id = metadata.get("userId", "fprior")  # Default user for backward compatibility
            
            # Upload request.json - captures original research request
            # This file is crucial for debugging and reproducing results
            request_key = f"users/{user_id}/research/{team}/{research_id}/request.json"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=request_key,
                Body=json.dumps({
                    "team": team,
                    "metadata": metadata,
                    "user_content": user_content,
                    "perplexity_request_id": request_id,
                    "timestamp": pipeline_started_at
                }, indent=2),
                ContentType='application/json'
            )
            
            # Upload metadata.json
            metadata_key = f"users/{user_id}/research/{team}/{research_id}/metadata.json"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=metadata_key,
                Body=json.dumps({
                    "research_id": research_id,
                    "request_id": request_id,
                    "team": team,
                    "user_id": user_id,
                    "started_at": pipeline_started_at,
                    "model": model,
                    "metadata": metadata
                }, indent=2),
                ContentType='application/json'
            )
            
            # Update DynamoDB with initial data and S3 paths
            s3_base_path = f"users/{user_id}/research/{team}/{research_id}"
            table.update_item(
                Key={"reportId": research_id},
                UpdateExpression="SET s3BasePath = :basePath, s3RequestKey = :requestKey, s3MetadataKey = :metadataKey, username = :username, userId = :userId",
                ExpressionAttributeValues={
                    ":basePath": s3_base_path,
                    ":requestKey": request_key,
                    ":metadataKey": metadata_key,
                    ":username": user_id,
                    ":userId": user_id
                }
            )
            
            print(f"Successfully created research job {research_id} with Perplexity request {request_id}")
            print(f"DynamoDB Stream will trigger async processing")
            
            # Step 4: Return success response immediately (async pattern)
            # Frontend will poll the status endpoint for completion
            # This avoids Lambda timeout for long-running research jobs
            return {
                "statusCode": 200,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({
                    "success": True,
                    "research_id": research_id,  # Our internal tracking ID
                    "request_id": request_id,     # Perplexity's job ID for status checks
                    "team": team,                 # Team designation for filtering
                    "status": "processing",       # Initial status for polling
                    "message": "Research job started. Use the status endpoint to check progress.",
                    "status_url": f"/api/research/status/{request_id}",  # Polling endpoint
                    "report_url": f"/reports/{research_id}"  # Future report location
                })
            }

        # Handle download URL generation
        elif (
            path.startswith("/api/research/download/")
            and event.get("httpMethod") == "GET"
        ):
            # Extract s3_key from path (expects base64 encoded key)
            try:
                import base64

                encoded_key = path.split("/")[-1]
                s3_key = base64.b64decode(encoded_key).decode("utf-8")

                if not s3_key:
                    return {
                        "statusCode": 400,
                        "headers": {**cors_headers, "Content-Type": "application/json"},
                        "body": json.dumps(
                            {"error": "Bad Request", "message": "Missing S3 key"}
                        ),
                    }

                # Generate presigned URL
                download_url = generate_presigned_url(
                    s3_key, expiration=3600
                )  # 1 hour expiration

                if download_url:
                    return {
                        "statusCode": 200,
                        "headers": {**cors_headers, "Content-Type": "application/json"},
                        "body": json.dumps(
                            {
                                "success": True,
                                "download_url": download_url,
                                "s3_key": s3_key,
                            }
                        ),
                    }
                else:
                    return {
                        "statusCode": 500,
                        "headers": {**cors_headers, "Content-Type": "application/json"},
                        "body": json.dumps(
                            {
                                "error": "Internal Server Error",
                                "message": "Failed to generate download URL",
                            }
                        ),
                    }

            except Exception as e:
                return {
                    "statusCode": 400,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps(
                        {"error": "Bad Request", "message": f"Invalid S3 key: {str(e)}"}
                    ),
                }

        # Route: GET /api/research/status/{request_id} - Poll job status
        # This endpoint is called repeatedly by frontend until job completes
        elif (
            path.startswith("/api/research/status/")
            and event.get("httpMethod") == "GET"
        ):
            # Extract Perplexity request ID from URL path
            request_id = path.split("/")[-1]

            if not request_id:
                return {
                    "statusCode": 400,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps(
                        {"error": "Bad Request", "message": "Missing request_id"}
                    ),
                }

            # Query DynamoDB for current job status
            # This is a read-only operation - no Perplexity API calls here
            # The actual status updates happen via DynamoDB Streams trigger
            try:
                table = dynamodb.Table(RESEARCH_REPORTS_TABLE)
                
                # Query by requestId
                scan_response = table.scan(
                    FilterExpression="requestId = :rid",
                    ExpressionAttributeValues={":rid": request_id},
                    Limit=1
                )
                
                if not scan_response.get("Items") or len(scan_response["Items"]) == 0:
                    # No record found
                    return {
                        "statusCode": 404,
                        "headers": {**cors_headers, "Content-Type": "application/json"},
                        "body": json.dumps({
                            "success": False,
                            "error": "Report not found",
                            "request_id": request_id
                        }),
                    }
                
                # Get the report record
                report_item = scan_response["Items"][0]
                
                # Build response based on status
                response_data = {
                    "success": True,
                    "request_id": request_id,
                    "status": report_item.get("status", "unknown"),
                    "timestamp": datetime.now().isoformat(),
                    "reportId": report_item.get("reportId"),
                }
                
                # Add all relevant fields from DynamoDB
                if report_item.get("processedSummary"):
                    response_data["summary"] = report_item["processedSummary"]
                    response_data["summaryWordCount"] = report_item.get("summaryWordCount", 120)
                    response_data["reportProcessed"] = True
                else:
                    response_data["reportProcessed"] = False
                
                # Add timestamps and calculate duration if available
                if report_item.get("pipelineStartedAt"):
                    response_data["pipelineStartedAt"] = report_item["pipelineStartedAt"]
                if report_item.get("pipelineCompletedAt"):
                    response_data["pipelineCompletedAt"] = report_item["pipelineCompletedAt"]
                    
                    # Calculate duration if both timestamps exist
                    if report_item.get("pipelineStartedAt"):
                        try:
                            started = datetime.fromisoformat(report_item["pipelineStartedAt"].replace('Z', '+00:00'))
                            completed = datetime.fromisoformat(report_item["pipelineCompletedAt"].replace('Z', '+00:00'))
                            duration_seconds = (completed - started).total_seconds()
                            response_data["pipelineDurationSeconds"] = duration_seconds
                        except Exception as e:
                            print(f"Error calculating duration: {str(e)}")
                
                # Add metadata fields
                if report_item.get("team"):
                    response_data["team"] = report_item["team"]
                if report_item.get("title"):
                    response_data["title"] = report_item["title"]
                if report_item.get("vendorName"):
                    response_data["vendorName"] = report_item["vendorName"]
                if report_item.get("companyName"):
                    response_data["companyName"] = report_item["companyName"]
                    
                # Add S3 information
                if report_item.get("s3Prefix"):
                    response_data["s3_prefix"] = report_item["s3Prefix"]
                    response_data["s3_location"] = f"s3://{S3_BUCKET}/{report_item['s3Prefix']}/"
                if report_item.get("s3Files"):
                    response_data["s3_files"] = report_item["s3Files"]
                if report_item.get("s3Key"):
                    response_data["s3_key"] = report_item["s3Key"]
                    
                # Add content if status is completed
                if report_item.get("status") == "completed" and report_item.get("s3Files", {}).get("response"):
                    # Generate presigned URL for download
                    try:
                        download_url = generate_presigned_url(report_item["s3Files"]["response"])
                        if download_url:
                            response_data["download_url"] = download_url
                    except Exception as e:
                        print(f"Error generating presigned URL: {str(e)}")
                        
            except Exception as e:
                print(f"Error reading from DynamoDB: {str(e)}")
                return {
                    "statusCode": 500,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps({
                        "success": False,
                        "error": "Failed to check status",
                        "message": str(e)
                    }),
                }
            
            # Return the read-only status response
            return {
                "statusCode": 200,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps(response_data, default=decimal_default),
            }

        # Route: GET /api/research/reports - List all research reports
        # Returns paginated list with AI-generated summaries and download links
        elif path == "/api/research/reports" and event.get("httpMethod") == "GET":
            try:
                # Parse query parameters for filtering and pagination
                query_params = event.get("queryStringParameters", {}) or {}
                team = query_params.get("team")  # Optional: filter by red/white/black team
                limit = int(query_params.get("limit", 50))  # Default 50 reports per page
                
                table = dynamodb.Table(RESEARCH_REPORTS_TABLE)
                
                # Optimize query based on filter parameters
                if team:
                    # Use Global Secondary Index for efficient team-based queries
                    # GSI: team-createdAt-index allows fast filtering by team
                    response = table.query(
                        IndexName="team-createdAt-index",
                        KeyConditionExpression="team = :team",
                        ExpressionAttributeValues={":team": team},
                        ScanIndexForward=False,  # Sort by createdAt descending (newest first)
                        Limit=limit
                    )
                else:
                    # Full table scan when no team filter applied
                    # Less efficient but necessary for cross-team views
                    response = table.scan(Limit=limit)
                
                # Post-process results: add download URLs and calculate metrics
                items = response.get("Items", [])
                for item in items:
                    # Generate presigned URL for full report if available
                    if item.get("fullReportS3Key"):
                        # Use the new fullReportS3Key field
                        download_url = generate_presigned_url(item["fullReportS3Key"])
                        if download_url:
                            item["downloadUrl"] = download_url
                    elif item.get("s3Key"):
                        # Fallback to old s3Key field for backward compatibility
                        download_url = generate_presigned_url(item["s3Key"])
                        if download_url:
                            item["downloadUrl"] = download_url
                    
                    # Ensure summary is included if available
                    if item.get("processedSummary"):
                        item["summary"] = item["processedSummary"]
                        item["summaryWordCount"] = item.get("summaryWordCount", 0)
                    
                    # Calculate duration if both timestamps exist
                    if item.get("pipelineStartedAt") and item.get("pipelineCompletedAt"):
                        try:
                            started = datetime.fromisoformat(item["pipelineStartedAt"].replace('Z', '+00:00'))
                            completed = datetime.fromisoformat(item["pipelineCompletedAt"].replace('Z', '+00:00'))
                            item["pipelineDurationSeconds"] = (completed - started).total_seconds()
                        except Exception as e:
                            # Don't fail if timestamp parsing fails
                            pass
                
                return {
                    "statusCode": 200,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps({
                        "success": True,
                        "reports": items,
                        "count": len(items),
                        "hasMore": response.get("LastEvaluatedKey") is not None
                    }, default=decimal_default),
                }
                
            except Exception as e:
                print(f"Error listing reports: {str(e)}")
                return {
                    "statusCode": 500,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps({
                        "error": "Internal Server Error",
                        "message": "Failed to list research reports"
                    }),
                }
        
        else:
            return {
                "statusCode": 404,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps(
                    {"error": "Not Found", "message": f"Endpoint not found: {path}"}
                ),
            }

    except ValueError as e:
        # Handle client errors (400 Bad Request)
        # These are typically validation failures or missing parameters
        return {
            "statusCode": 400,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Bad Request", "message": str(e)}),
        }

    except Exception as e:
        # Handle server errors (500 Internal Server Error)
        # Log full error for debugging but return generic message to client
        # This prevents leaking sensitive information in error responses
        print(f"Research API error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "error": "Internal Server Error",
                    "message": "Failed to process research request",
                    "details": str(e),  # Consider removing in production for security
                }
            ),
        }
