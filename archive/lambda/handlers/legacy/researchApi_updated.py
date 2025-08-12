"""
Updated Research API Lambda Handler with Simplified User-Based S3 Structure
"""
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
import base64

# Initialize AWS clients
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
secrets_client = boto3.client("secretsmanager")

# Environment variables
S3_BUCKET = os.environ.get("RESEARCH_BUCKET", "color-code-research-results-984906149037")
DYNAMODB_TABLE = os.environ.get("RESEARCH_REPORTS_TABLE", "ResearchReports")
PERPLEXITY_SECRET_NAME = os.environ.get("PERPLEXITY_API_KEY_SECRET", "perplexity_api_key")

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

# Cache for the API key
_cached_api_key: Optional[str] = None


def get_perplexity_api_key() -> str:
    """Retrieve Perplexity API key from AWS Secrets Manager with caching."""
    # ... (keeping existing implementation)
    pass


def upload_research_to_s3(
    research_id: str,
    request_data: Dict[str, Any],
    response_data: Dict[str, Any],
    metadata: Dict[str, Any],
    user_id: str = "fprior"
) -> Dict[str, str]:
    """
    Upload research data to S3 with new user-based structure.
    Returns dict with S3 keys for all uploaded files.
    """
    try:
        # Create S3 prefix for this research
        s3_prefix = f"users/{user_id}/research/{research_id}"
        
        # Prepare files to upload
        files_to_upload = {
            # Request data
            f"{s3_prefix}/request.json": {
                "research_id": research_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_id": user_id,
                "request": request_data,
                "metadata": metadata
            },
            
            # Response data
            f"{s3_prefix}/response.json": {
                "research_id": research_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "user_id": user_id,
                "response": response_data,
                "processing_time": metadata.get("processing_time", 0)
            },
            
            # Combined metadata
            f"{s3_prefix}/metadata.json": {
                "research_id": research_id,
                "user_id": user_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "request_summary": request_data.get("content", "")[:200] + "...",
                "response_summary": response_data.get("content", "")[:200] + "...",
                "word_count": len(response_data.get("content", "").split()),
                "metadata": metadata,
                "s3_prefix": s3_prefix
            }
        }
        
        # Upload all files
        uploaded_keys = {}
        for key, data in files_to_upload.items():
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=key,
                Body=json.dumps(data, indent=2),
                ContentType="application/json",
                Metadata={
                    "research-id": research_id,
                    "user-id": user_id,
                    "created-at": datetime.now(timezone.utc).isoformat()
                }
            )
            uploaded_keys[key.split('/')[-1].replace('.json', '')] = key
            print(f"Uploaded: {key}")
        
        return {
            "s3_prefix": s3_prefix,
            "s3_bucket": S3_BUCKET,
            "files": uploaded_keys
        }
        
    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        raise


def create_research_record(
    research_id: str,
    user_id: str,
    request_data: Dict[str, Any],
    response_data: Dict[str, Any],
    s3_info: Dict[str, Any],
    metadata: Dict[str, Any]
) -> None:
    """Create or update DynamoDB record with research information."""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        item = {
            "reportId": research_id,  # Using existing primary key name
            "userId": user_id,
            "createdAt": now,
            "updatedAt": now,
            "status": "completed",
            
            # S3 location info - this is the key part!
            "s3Prefix": s3_info["s3_prefix"],
            "s3Bucket": s3_info["s3_bucket"],
            "s3Files": s3_info["files"],
            
            # Request info
            "requestContent": request_data.get("content", ""),
            "requestMetadata": request_data.get("metadata", {}),
            
            # Response summary
            "contentSummary": response_data.get("content", "")[:500] + "...",
            "wordCount": len(response_data.get("content", "").split()),
            
            # Metadata
            "metadata": metadata,
            "ttl": int((datetime.now() + timedelta(days=90)).timestamp())
        }
        
        # If team is provided, add it for existing GSI compatibility
        if metadata.get("team"):
            item["team"] = metadata["team"]
        
        table.put_item(Item=item)
        print(f"Created DynamoDB record for research_id: {research_id}")
        
    except Exception as e:
        print(f"Error creating DynamoDB record: {str(e)}")
        raise


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for research API requests."""
    try:
        # Extract user context
        headers = event.get("headers", {})
        user_id = headers.get("X-User-Id", "fprior")
        
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Generate unique research ID
        research_id = f"research_{uuid.uuid4().hex[:12]}"
        
        # Extract request data
        request_data = {
            "content": body.get("content", ""),
            "metadata": body.get("metadata", {}),
            "user_id": user_id
        }
        
        # TODO: Call Perplexity API here to get response
        # For now, using placeholder
        response_data = {
            "content": f"Research response for: {request_data['content'][:100]}...",
            "sources": [],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Upload to S3 with new structure
        s3_info = upload_research_to_s3(
            research_id=research_id,
            request_data=request_data,
            response_data=response_data,
            metadata={
                "processing_time": 1.23,  # TODO: Track actual time
                "model": "perplexity",
                "team": body.get("metadata", {}).get("team")
            },
            user_id=user_id
        )
        
        # Create DynamoDB record with S3 prefix
        create_research_record(
            research_id=research_id,
            user_id=user_id,
            request_data=request_data,
            response_data=response_data,
            s3_info=s3_info,
            metadata=body.get("metadata", {})
        )
        
        # Return response
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "success": True,
                "research_id": research_id,
                "s3_prefix": s3_info["s3_prefix"],
                "content": response_data["content"],
                "message": f"Research saved to: {s3_info['s3_prefix']}"
            })
        }
        
    except Exception as e:
        print(f"Error in handler: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "success": False,
                "error": str(e)
            })
        }


# Add this helper function to get research by ID
def get_research_by_id(research_id: str, user_id: str = "fprior") -> Dict[str, Any]:
    """
    Retrieve research data using the research_id.
    The DynamoDB record contains the S3 prefix where all files are stored.
    """
    try:
        # Get record from DynamoDB
        response = table.get_item(Key={"reportId": research_id})
        
        if "Item" not in response:
            raise ValueError(f"Research ID {research_id} not found")
        
        item = response["Item"]
        s3_prefix = item.get("s3Prefix")
        
        if not s3_prefix:
            # Fallback for old records
            raise ValueError(f"No S3 prefix found for research ID {research_id}")
        
        # Retrieve files from S3
        files = {}
        for file_type in ["request", "response", "metadata"]:
            try:
                s3_response = s3_client.get_object(
                    Bucket=S3_BUCKET,
                    Key=f"{s3_prefix}/{file_type}.json"
                )
                files[file_type] = json.loads(s3_response["Body"].read())
            except Exception as e:
                print(f"Error reading {file_type}.json: {str(e)}")
        
        return {
            "research_id": research_id,
            "dynamodb_record": item,
            "files": files,
            "s3_prefix": s3_prefix
        }
        
    except Exception as e:
        print(f"Error retrieving research: {str(e)}")
        raise