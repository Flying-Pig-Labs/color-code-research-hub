import json
import boto3
import requests
import os
from datetime import datetime
from typing import Dict, Any, Optional
import uuid

# Initialize AWS clients
secrets_manager = boto3.client('secretsmanager', region_name='us-east-1')
s3_client = boto3.client('s3')

# Constants
PERPLEXITY_ASYNC_URL = "https://api.perplexity.ai/async/chat/completions"
PERPLEXITY_STATUS_URL = "https://api.perplexity.ai/async/chat/completions/{request_id}"
S3_BUCKET = os.environ.get('RESEARCH_BUCKET', 'color-code-research-results')
PERPLEXITY_SECRET_NAME = 'perplexity-key'

# Cache for the API key
_cached_api_key: Optional[str] = None


def get_perplexity_api_key() -> str:
    """Retrieve Perplexity API key from AWS Secrets Manager."""
    global _cached_api_key
    
    if _cached_api_key:
        return _cached_api_key
    
    try:
        response = secrets_manager.get_secret_value(SecretId=PERPLEXITY_SECRET_NAME)
        secret_string = response['SecretString']
        
        # Try to parse as JSON first
        try:
            secret_data = json.loads(secret_string)
            _cached_api_key = secret_data.get('api_key', secret_data.get('perplexity_key', ''))
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
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        research_id = str(uuid.uuid4())[:8]
        s3_key = f"research/{timestamp}_{research_id}.json"
        
        # Prepare the data to store
        s3_data = {
            'metadata': metadata,
            'content': content,
            'timestamp': datetime.now().isoformat(),
            'research_id': research_id
        }
        
        # Upload to S3
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=json.dumps(s3_data, indent=2),
            ContentType='application/json',
            Metadata={
                'research-id': research_id,
                'timestamp': timestamp
            }
        )
        
        print(f"Successfully uploaded research results to S3: {S3_BUCKET}/{s3_key}")
        return s3_key
        
    except Exception as e:
        print(f"Error uploading to S3: {str(e)}")
        # Don't fail the request if S3 upload fails
        return None


def create_async_research_job(user_content: str, model: str = "sonar-deep-research", 
                             reasoning_effort: str = "low") -> Dict[str, Any]:
    """Create an async research job with Perplexity API."""
    try:
        api_key = get_perplexity_api_key()
        
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": user_content}
            ],
            "reasoning_effort": reasoning_effort
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        print(f"Creating async research job with model: {model}")
        response = requests.post(
            PERPLEXITY_ASYNC_URL, 
            json=payload, 
            headers=headers,
            timeout=30
        )
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error creating async job: {str(e)}")
        raise


def check_job_status(request_id: str) -> Dict[str, Any]:
    """Check the status of an async research job."""
    try:
        api_key = get_perplexity_api_key()
        
        headers = {
            "Authorization": f"Bearer {api_key}"
        }
        
        url = PERPLEXITY_STATUS_URL.format(request_id=request_id)
        print(f"Checking job status: {request_id}")
        
        response = requests.get(
            url,
            headers=headers,
            timeout=30
        )
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error checking job status: {str(e)}")
        raise


def handler(event, context):
    """Lambda handler for research API requests."""
    print(f"Research API request: {json.dumps(event, indent=2)}")
    
    # CORS headers
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }
    
    # Handle preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
    
    try:
        path = event.get('path', '')
        
        # Handle async job creation
        if path == '/api/research' and event.get('httpMethod') == 'POST':
            # Parse request body
            body = json.loads(event.get('body', '{}'))
            
            # Extract parameters
            user_content = body.get('content', body.get('task', ''))
            model = body.get('model', 'sonar-deep-research')
            reasoning_effort = body.get('reasoning_effort', 'low')
            
            # Additional metadata from request
            metadata = {
                'title': body.get('title', 'Research Request'),
                'requester': body.get('requester', 'Unknown'),
                'tags': body.get('tags', []),
                'model': model,
                'reasoning_effort': reasoning_effort
            }
            
            if not user_content:
                return {
                    'statusCode': 400,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'error': 'Bad Request',
                        'message': 'Missing required field: content or task'
                    })
                }
            
            # Create async job
            job_response = create_async_research_job(
                user_content=user_content,
                model=model,
                reasoning_effort=reasoning_effort
            )
            
            # Extract request_id from response
            request_id = job_response.get('request_id')
            
            if not request_id:
                raise ValueError("No request_id returned from Perplexity API")
            
            # Return job creation response
            response_data = {
                'success': True,
                'request_id': request_id,
                'status': 'pending',
                'metadata': metadata,
                'timestamp': datetime.now().isoformat()
            }
            
            return {
                'statusCode': 202,  # Accepted
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps(response_data)
            }
        
        # Handle status check
        elif path.startswith('/api/research/status/') and event.get('httpMethod') == 'GET':
            # Extract request_id from path
            request_id = path.split('/')[-1]
            
            if not request_id:
                return {
                    'statusCode': 400,
                    'headers': {**cors_headers, 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'error': 'Bad Request',
                        'message': 'Missing request_id'
                    })
                }
            
            # Check job status
            status_response = check_job_status(request_id)
            
            # Extract status and data
            status = status_response.get('status', 'unknown')
            
            response_data = {
                'success': True,
                'request_id': request_id,
                'status': status,
                'timestamp': datetime.now().isoformat()
            }
            
            # If completed, include the result
            if status == 'completed':
                # Extract the research content from response
                research_content = ''
                if 'choices' in status_response and len(status_response['choices']) > 0:
                    research_content = status_response['choices'][0].get('message', {}).get('content', '')
                
                # Upload to S3
                metadata = {
                    'request_id': request_id,
                    'model': status_response.get('model', 'sonar-deep-research')
                }
                s3_key = upload_to_s3(research_content, metadata)
                
                response_data['content'] = research_content
                response_data['s3_location'] = f"s3://{S3_BUCKET}/{s3_key}" if s3_key else None
                response_data['model_used'] = status_response.get('model')
            
            # If failed, include error info
            elif status == 'failed':
                response_data['error'] = status_response.get('error', 'Unknown error')
            
            return {
                'statusCode': 200,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps(response_data)
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': {**cors_headers, 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'error': 'Not Found',
                    'message': f'Endpoint not found: {path}'
                })
            }
        
    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Bad Request',
                'message': str(e)
            })
        }
        
    except Exception as e:
        print(f"Research API error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': 'Failed to process research request',
                'details': str(e)
            })
        }