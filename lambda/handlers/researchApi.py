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


def decimal_default(obj):
    """Helper function to serialize Decimal objects to JSON."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


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


def upload_to_s3(content: str, metadata: Dict[str, Any], research_id: str, user_id: str = "fprior", team: str = "red") -> Dict[str, str]:
    """Upload research results to S3 with new structure and return S3 info."""
    try:
        # Create S3 prefix for this research with team folder
        s3_prefix = f"users/{user_id}/research/{team}/{research_id}"
        
        # Prepare files to upload
        timestamp = datetime.now().isoformat()
        
        # 1. Upload request metadata
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
        
        # 2. Upload response content
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
        
        # 3. Upload combined metadata
        metadata_key = f"{s3_prefix}/metadata.json"
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=metadata_key,
            Body=json.dumps({
                "research_id": research_id,
                "user_id": user_id,
                "timestamp": timestamp,
                "s3_prefix": s3_prefix,
                "content_summary": content[:500] + "..." if len(content) > 500 else content,
                "word_count": len(content.split()),
                "metadata": metadata,
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
        raise  # We want to know if S3 upload fails now


def invoke_report_processor(
    report_id: str,
    content: str,
    team: str,
    task: str,
    metadata: Dict[str, Any],
    username: str = "fprior"
) -> Optional[Dict[str, Any]]:
    """Invoke the ReportProcessingFunction to generate structured reports."""
    try:
        print(f"Invoking report processor for {report_id}")
        
        # Prepare the payload for report processing
        payload = {
            "reportId": report_id,
            "requestId": report_id,  # Add requestId for compatibility
            "rawContent": content,
            "team": team,
            "username": username,
            "objective": task,
            "task": task,  # Some handlers expect 'task' field
            "metadata": metadata,
            "formData": metadata  # Add formData alias for compatibility
        }
        
        # Get the function name from environment variable
        function_name = os.environ.get("REPORT_PROCESSING_FUNCTION_NAME")
        
        if not function_name:
            print("ERROR: REPORT_PROCESSING_FUNCTION_NAME environment variable not set")
            print("Cannot invoke report processor - missing configuration")
            return None
            
        print(f"Invoking report processor Lambda function: {function_name}")
        
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType="Event",  # Async invocation
            Payload=json.dumps(payload)
        )
        
        print(f"Report processor invoked with status: {response['StatusCode']}")
        
        # Check if invocation was accepted (202 for async)
        if response['StatusCode'] == 202:
            return {"invoked": True, "statusCode": response['StatusCode']}
        else:
            print(f"WARNING: Unexpected status code: {response['StatusCode']}")
            return {"invoked": False, "statusCode": response['StatusCode']}
        
    except Exception as e:
        print(f"Error invoking report processor: {str(e)}")
        # Don't fail the main request if report processing fails
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
    """Log research report metadata to DynamoDB with new S3 structure."""
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
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,Accept,X-User-Id",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
        "Access-Control-Max-Age": "86400"
    }

    # Handle preflight requests
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    try:
        path = event.get("path", "")
        # Strip stage prefix if present (e.g., /production/api/... -> /api/...)
        if path.startswith("/production"):
            path = path[11:]  # Remove "/production" prefix

        # Handle async job creation with polling
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

            # Generate research ID upfront
            research_id = str(uuid.uuid4())
            pipeline_started_at = datetime.now().isoformat()
            
            # Create DynamoDB record with processing status
            try:
                table = dynamodb.Table(RESEARCH_REPORTS_TABLE)
                table.put_item(
                    Item={
                        "reportId": research_id,  # Using reportId as PK for compatibility
                        "pipelineStartedAt": pipeline_started_at,
                        "status": "processing",
                        "team": metadata.get("team", "unknown"),
                        "metadata": metadata,
                        "createdAt": pipeline_started_at  # Use same timestamp
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

            # Create async job with Perplexity
            try:
                job_response = create_async_research_job(
                    user_content=user_content, model=model
                )
                request_id = job_response.get("id")
                
                if not request_id:
                    raise ValueError("No id returned from Perplexity API")
                    
                # Update record with Perplexity request ID
                table.update_item(
                    Key={"reportId": research_id},
                    UpdateExpression="SET requestId = :rid",
                    ExpressionAttributeValues={":rid": request_id}
                )
                
            except Exception as e:
                # Update status to error
                table.update_item(
                    Key={"reportId": research_id},
                    UpdateExpression="SET #status = :status, errorMessage = :error",
                    ExpressionAttributeNames={"#status": "status"},
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

            # Start polling loop (up to 15 minutes)
            max_poll_time = 15 * 60  # 15 minutes in seconds
            poll_interval = 5  # Start with 5 second intervals
            elapsed_time = 0
            
            while elapsed_time < max_poll_time:
                try:
                    # Check Perplexity status
                    status_response = check_job_status(request_id)
                    status = status_response.get("status", "UNKNOWN")
                    
                    if status == "COMPLETED":
                        # Get the completed research content
                        response_obj = status_response.get("response", {})
                        research_content = response_obj.get("choices", [{}])[0].get("message", {}).get("content", "")
                        
                        if research_content:
                            # Invoke Lambda B (Raw Report Handler)
                            # For now, we'll invoke inline since Lambda B doesn't exist yet
                            # TODO: Replace with actual Lambda B invocation
                            
                            # Upload raw report to S3 using unified structure
                            team = metadata.get("team", "red")
                            user_id = metadata.get("userId", "fprior")
                            raw_key = f"users/{user_id}/research/{team}/{research_id}/response.json"
                            s3_client.put_object(
                                Bucket=S3_BUCKET,
                                Key=raw_key,
                                Body=json.dumps({
                                    "perplexityResponse": status_response,
                                    "content": research_content,
                                    "metadata": metadata,
                                    "timestamp": datetime.now().isoformat()
                                }, indent=2),
                                ContentType='application/json'
                            )
                            
                            # Also upload request.json and metadata.json for completeness
                            request_key = f"users/{user_id}/research/{team}/{research_id}/request.json"
                            s3_client.put_object(
                                Bucket=S3_BUCKET,
                                Key=request_key,
                                Body=json.dumps({
                                    "team": team,
                                    "metadata": metadata,
                                    "user_content": user_content,
                                    "timestamp": pipeline_started_at
                                }, indent=2),
                                ContentType='application/json'
                            )
                            
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
                                    "completed_at": datetime.now().isoformat(),
                                    "model": model,
                                    "metadata": metadata
                                }, indent=2),
                                ContentType='application/json'
                            )
                            
                            # Update DynamoDB status with new unified structure
                            s3_base_path = f"users/{user_id}/research/{team}/{research_id}"
                            table.update_item(
                                Key={"reportId": research_id},
                                UpdateExpression="SET #status = :status, rawS3Key = :key, perplexityCompletedAt = :pca, s3BasePath = :basePath, s3ResponseKey = :responseKey, s3RequestKey = :requestKey, s3MetadataKey = :metadataKey, username = :username, content = :content",
                                ExpressionAttributeNames={"#status": "status"},
                                ExpressionAttributeValues={
                                    ":status": "pending_postprocessing",
                                    ":key": raw_key,
                                    ":pca": datetime.now().isoformat(),
                                    ":basePath": s3_base_path,
                                    ":responseKey": raw_key,
                                    ":requestKey": request_key,
                                    ":metadataKey": metadata_key,
                                    ":username": user_id,
                                    ":content": research_content
                                }
                            )
                            
                            # Invoke Lambda C (ReportProcessingFunction)
                            processor_result = invoke_report_processor(
                                report_id=research_id,
                                content=research_content,
                                team=metadata.get("team", "unknown"),
                                task=user_content,
                                metadata=metadata,
                                username=user_id
                            )
                            
                            # Return success
                            return {
                                "statusCode": 200,
                                "headers": {**cors_headers, "Content-Type": "application/json"},
                                "body": json.dumps({
                                    "success": True,
                                    "research_id": research_id,
                                    "status": "pending_postprocessing",
                                    "message": "Research completed, post-processing started"
                                }),
                            }
                            
                    elif status == "FAILED":
                        # Update status to error
                        error_msg = status_response.get("error_message", "Unknown error")
                        table.update_item(
                            Key={"reportId": research_id},
                            UpdateExpression="SET #status = :status, errorMessage = :error",
                            ExpressionAttributeNames={"#status": "status"},
                            ExpressionAttributeValues={
                                ":status": "error",
                                ":error": f"Perplexity job failed: {error_msg}"
                            }
                        )
                        return {
                            "statusCode": 500,
                            "headers": {**cors_headers, "Content-Type": "application/json"},
                            "body": json.dumps({"error": "Research job failed"}),
                        }
                        
                except Exception as e:
                    print(f"Error during polling: {str(e)}")
                
                # Sleep before next poll (with exponential backoff)
                time.sleep(poll_interval)
                elapsed_time += poll_interval
                # Increase interval up to 30 seconds
                poll_interval = min(poll_interval * 1.5, 30)
            
            # Timeout after 15 minutes
            table.update_item(
                Key={"reportId": research_id},
                UpdateExpression="SET #status = :status, errorMessage = :error",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":status": "error_timeout",
                    ":error": "Research timed out after 15 minutes"
                }
            )
            
            return {
                "statusCode": 408,  # Request Timeout
                "headers": {**cors_headers, "Content-Type": "application/json"},
                "body": json.dumps({
                    "error": "Research timeout",
                    "research_id": research_id,
                    "message": "Research did not complete within 15 minutes"
                }),
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

            # Read-only status check from DynamoDB
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
