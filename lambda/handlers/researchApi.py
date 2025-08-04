import json
import boto3
import requests
import os
from datetime import datetime
from typing import Dict, Any, Optional
import uuid

# Initialize AWS clients
secrets_manager = boto3.client("secretsmanager", region_name="us-east-1")
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
lambda_client = boto3.client("lambda", region_name="us-east-1")

# Constants
PERPLEXITY_ASYNC_URL = "https://api.perplexity.ai/async/chat/completions"
PERPLEXITY_STATUS_URL = "https://api.perplexity.ai/async/chat/completions/{request_id}"
S3_BUCKET = os.environ.get("RESEARCH_BUCKET", "color-code-research-results")
RESEARCH_REPORTS_TABLE = os.environ.get("RESEARCH_REPORTS_TABLE", "ResearchReports")
PERPLEXITY_SECRET_NAME = "perplexity-key"

# Cache for the API key
_cached_api_key: Optional[str] = None


def get_perplexity_api_key() -> str:
    """Retrieve Perplexity API key from AWS Secrets Manager."""
    global _cached_api_key

    if _cached_api_key:
        return _cached_api_key

    try:
        response = secrets_manager.get_secret_value(SecretId=PERPLEXITY_SECRET_NAME)
        secret_string = response["SecretString"]

        # Try to parse as JSON first
        try:
            secret_data = json.loads(secret_string)
            _cached_api_key = secret_data.get(
                "api_key", secret_data.get("perplexity_key", "")
            )
        except json.JSONDecodeError:
            # If not JSON, treat as plain string API key
            _cached_api_key = secret_string.strip()

        if not _cached_api_key:
            raise ValueError("No API key found in secret")

        return _cached_api_key
    except Exception as e:
        print(f"Error retrieving API key from Secrets Manager: {str(e)}")
        raise


def upload_to_s3(content: str, metadata: Dict[str, Any]) -> str:
    """Upload research results to S3 and return the S3 key."""
    try:
        # Generate unique S3 key
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        research_id = str(uuid.uuid4())[:8]
        s3_key = f"research/{timestamp}_{research_id}.json"

        # Prepare the data to store
        s3_data = {
            "metadata": metadata,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "research_id": research_id,
        }

        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(s3_data, indent=2),
            ContentType="application/json",
            Metadata={"research-id": research_id, "timestamp": timestamp},
        )

        print(f"Successfully uploaded research results to S3: {S3_BUCKET}/{s3_key}")
        return s3_key

    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        # Don't fail the request if S3 upload fails
        return None


def invoke_report_processor(
    report_id: str,
    content: str,
    team: str,
    task: str,
    metadata: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """Invoke the ReportProcessingFunction to generate structured reports."""
    try:
        print(f"Invoking report processor for {report_id}")
        
        # Prepare the payload for report processing
        payload = {
            "reportId": report_id,
            "rawContent": content,
            "team": team,
            "objective": task,
            "metadata": metadata
        }
        
        # Invoke the report processing function asynchronously
        # Use environment variable or construct ARN
        function_name = os.environ.get("REPORT_PROCESSING_FUNCTION_NAME", 
                                      "color-code-research-hub-ReportProcessingFunction-HaCSag5t4t7Y")
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="Event",  # Async invocation
            Payload=json.dumps(payload)
        )
        
        print(f"Report processor invoked with status: {response['StatusCode']}")
        return {"invoked": True, "statusCode": response['StatusCode']}
        
    except Exception as e:
        print(f"Error invoking report processor: {str(e)}")
        # Don't fail the main request if report processing fails
        return None


def log_report_to_dynamodb(
    report_id: str,
    team: str,
    metadata: Dict[str, Any],
    s3_key: str,
    request_id: str,
    content_summary: str = None
) -> bool:
    """Log research report metadata to DynamoDB for tracking and retrieval."""
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
            "status": "completed",
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
    """Create an async research job with Perplexity API."""
    try:
        api_key = get_perplexity_api_key()

        # Async endpoint expects the request wrapped in a "request" object
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

        response = requests.post(
            PERPLEXITY_ASYNC_URL, json=payload, headers=headers, timeout=30
        )

        # Log response details for debugging
        if response.status_code != 200:
            print(f"Error response status: {response.status_code}")
            print(f"Error response body: {response.text}")

        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error creating async job: {str(e)}")
        if hasattr(e, "response") and e.response is not None:
            print(f"Response body: {e.response.text}")
        raise


def check_job_status(request_id: str) -> Dict[str, Any]:
    """Check the status of an async research job."""
    try:
        api_key = get_perplexity_api_key()

        headers = {"Authorization": f"Bearer {api_key}"}

        url = PERPLEXITY_STATUS_URL.format(request_id=request_id)
        print(f"Checking job status: {request_id}")

        response = requests.get(url, headers=headers, timeout=30)

        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"Error checking job status: {str(e)}")
        raise


def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """Generate a presigned URL for S3 object download."""
    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": s3_key},
            ExpiresIn=expiration,
        )
        return url
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return None


def handler(event, context):
    """Lambda handler for research API requests."""
    print(f"Research API request: {json.dumps(event, indent=2)}")

    # CORS headers - Updated to support oceanstudio.io
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,Accept",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
        "Access-Control-Max-Age": "86400"
    }

    # Handle preflight requests
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        path = event.get("path", "")

        # Handle async job creation
        if path == "/api/research" and event.get("httpMethod") == "POST":
            # Parse request body
            body = json.loads(event.get("body", "{}"))

            # Extract parameters
            user_content = body.get("content", body.get("task", ""))
            model = body.get("model", "sonar-deep-research")
            reasoning_effort = body.get("reasoning_effort", "low")

            # Additional metadata from request
            metadata = {
                "title": body.get("title", "Research Request"),
                "requester": body.get("requester", "Unknown"),
                "tags": body.get("tags", []),
                "model": model,
                "reasoning_effort": reasoning_effort,
                "team": body.get("team", "unknown"),
                "vendorName": body.get("vendorName"),
                "companyName": body.get("companyName"),
            }

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

            # Create async job
            job_response = create_async_research_job(
                user_content=user_content, model=model
            )

            # Extract id from response (Perplexity uses 'id' not 'request_id')
            request_id = job_response.get("id")

            if not request_id:
                raise ValueError("No id returned from Perplexity API")

            # Return job creation response
            response_data = {
                "success": True,
                "request_id": request_id,
                "status": "pending",
                "metadata": metadata,
                "timestamp": datetime.now().isoformat(),
            }

            return {
                "statusCode": 202,  # Accepted
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps(response_data),
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

        # Handle status check
        elif (
            path.startswith("/api/research/status/")
            and event.get("httpMethod") == "GET"
        ):
            # Extract request_id from path
            request_id = path.split("/")[-1]

            if not request_id:
                return {
                    "statusCode": 400,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps(
                        {"error": "Bad Request", "message": "Missing request_id"}
                    ),
                }

            # Check job status
            status_response = check_job_status(request_id)

            # Extract status and data
            status = status_response.get("status", "UNKNOWN")

            response_data = {
                "success": True,
                "request_id": request_id,
                "status": status.lower(),  # Convert to lowercase for frontend compatibility
                "timestamp": datetime.now().isoformat(),
            }
            
            # Check if we have a processed report in DynamoDB
            # If the report has been processed, include the 120-word summary
            try:
                table = dynamodb.Table(RESEARCH_REPORTS_TABLE)
                # Query for report by request_id
                scan_response = table.scan(
                    FilterExpression="requestId = :rid",
                    ExpressionAttributeValues={":rid": request_id},
                    Limit=1
                )
                
                if scan_response.get("Items") and len(scan_response["Items"]) > 0:
                    report_item = scan_response["Items"][0]
                    
                    # Check if we have a processed report with summary
                    if report_item.get("processedSummary"):
                        response_data["summary"] = report_item["processedSummary"]
                        response_data["summaryWordCount"] = report_item.get("summaryWordCount", 120)
                        response_data["reportId"] = report_item.get("reportId")
                        response_data["reportProcessed"] = True
                        
                        # Add metadata if available
                        if report_item.get("team"):
                            response_data["team"] = report_item["team"]
                        if report_item.get("title"):
                            response_data["title"] = report_item["title"]
                        if report_item.get("vendorName"):
                            response_data["vendorName"] = report_item["vendorName"]
                        if report_item.get("companyName"):
                            response_data["companyName"] = report_item["companyName"]
                            
            except Exception as e:
                print(f"Error checking for processed report: {str(e)}")
                # Don't fail the request if we can't check for processed report

            # If completed, include the result
            if status == "COMPLETED":
                # Extract the research content from nested response
                research_content = ""
                response_obj = status_response.get("response", {})
                if (
                    response_obj
                    and "choices" in response_obj
                    and len(response_obj["choices"]) > 0
                ):
                    research_content = (
                        response_obj["choices"][0].get("message", {}).get("content", "")
                    )

                # Upload to S3
                # Extract team and other metadata from the original request
                # For now, we'll try to parse it from the research content or use defaults
                team = "unknown"
                vendor_name = None
                company_name = None
                
                # Try to detect team from content
                if "RED TEAM" in research_content[:500]:
                    team = "red"
                elif "BLACK TEAM" in research_content[:500]:
                    team = "black"
                elif "WHITE TEAM" in research_content[:500]:
                    team = "white"
                
                metadata = {
                    "request_id": request_id,
                    "model": response_obj.get("model", "sonar-deep-research"),
                    "team": team,
                }
                
                s3_key = upload_to_s3(research_content, metadata)
                
                # Log to DynamoDB if S3 upload succeeded
                if s3_key:
                    # Generate a unique report ID
                    research_id = str(uuid.uuid4())[:8]
                    
                    # Get first 500 chars as summary
                    content_summary = research_content[:500] if research_content else None
                    
                    # Log to DynamoDB
                    log_report_to_dynamodb(
                        report_id=research_id,
                        team=team,
                        metadata=metadata,
                        s3_key=s3_key,
                        request_id=request_id,
                        content_summary=content_summary
                    )
                    
                    # Invoke report processor to generate structured reports
                    # This will create the 5 different output formats with LLM processing
                    processor_result = invoke_report_processor(
                        report_id=research_id,
                        content=research_content,
                        team=team,
                        task=content_summary or "Research Analysis",
                        metadata=metadata
                    )
                    
                    if processor_result:
                        print(f"Report processor invoked successfully for {research_id}")
                        response_data["report_processing_status"] = "initiated"
                    else:
                        print(f"Failed to invoke report processor for {research_id}")

                response_data["content"] = research_content
                response_data["s3_location"] = (
                    f"s3://{S3_BUCKET}/{s3_key}" if s3_key else None
                )
                response_data["s3_key"] = s3_key  # Store the key for later download

                # Generate presigned URL for download
                if s3_key:
                    download_url = generate_presigned_url(s3_key)
                    if download_url:
                        response_data["download_url"] = download_url

                response_data["model_used"] = response_obj.get("model")
                response_data["status"] = "completed"  # lowercase for frontend

            # If failed, include error info
            elif status == "FAILED":
                response_data["error"] = status_response.get(
                    "error_message", "Unknown error"
                )
                response_data["status"] = "failed"  # lowercase for frontend

            # Handle other statuses
            elif status == "IN_PROGRESS":
                response_data["status"] = (
                    "processing"  # Map to frontend expected status
                )
            elif status == "CREATED":
                response_data["status"] = "pending"  # Map to frontend expected status

            return {
                "statusCode": 200,
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps(response_data),
            }

        # Handle list reports endpoint
        elif path == "/api/research/reports" and event.get("httpMethod") == "GET":
            try:
                # Get query parameters
                query_params = event.get("queryStringParameters", {}) or {}
                team = query_params.get("team")
                limit = int(query_params.get("limit", 50))
                
                table = dynamodb.Table(RESEARCH_REPORTS_TABLE)
                
                # Build query parameters
                if team:
                    # Query by team using GSI
                    response = table.query(
                        IndexName="team-createdAt-index",
                        KeyConditionExpression="team = :team",
                        ExpressionAttributeValues={":team": team},
                        ScanIndexForward=False,  # Sort by createdAt descending
                        Limit=limit
                    )
                else:
                    # Scan all reports (less efficient but needed for all teams)
                    response = table.scan(Limit=limit)
                
                # Extract items and generate presigned URLs
                items = response.get("Items", [])
                for item in items:
                    if item.get("s3Key"):
                        # Generate fresh presigned URL
                        download_url = generate_presigned_url(item["s3Key"])
                        if download_url:
                            item["downloadUrl"] = download_url
                
                return {
                    "statusCode": 200,
                    "headers": {**cors_headers, "Content-Type": "application/json"},
                    "body": json.dumps({
                        "success": True,
                        "reports": items,
                        "count": len(items),
                        "hasMore": response.get("LastEvaluatedKey") is not None
                    }),
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
        return {
            "statusCode": 400,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps({"error": "Bad Request", "message": str(e)}),
        }

    except Exception as e:
        print(f"Research API error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {**cors_headers, "Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "error": "Internal Server Error",
                    "message": "Failed to process research request",
                    "details": str(e),
                }
            ),
        }
