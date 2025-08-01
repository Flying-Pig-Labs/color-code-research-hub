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
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
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
        secret_data = json.loads(response['SecretString'])
        _cached_api_key = secret_data.get('api_key', secret_data.get('perplexity_key', ''))
        
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


def call_perplexity_api(user_content: str, model: str = "sonar-deep-research", 
                       reasoning_effort: str = "low") -> Dict[str, Any]:
    """Call Perplexity AI API with the provided content."""
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
        
        print(f"Calling Perplexity API with model: {model}")
        response = requests.post(
            PERPLEXITY_API_URL, 
            json=payload, 
            headers=headers,
            timeout=60  # 60 second timeout
        )
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"Error calling Perplexity API: {str(e)}")
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
        
        # Call Perplexity API
        perplexity_response = call_perplexity_api(
            user_content=user_content,
            model=model,
            reasoning_effort=reasoning_effort
        )
        
        # Extract the research content from response
        research_content = ''
        if 'choices' in perplexity_response and len(perplexity_response['choices']) > 0:
            research_content = perplexity_response['choices'][0].get('message', {}).get('content', '')
        
        # Upload to S3
        s3_key = upload_to_s3(research_content, metadata)
        
        # Prepare response
        response_data = {
            'success': True,
            'research_id': str(uuid.uuid4())[:8],
            'content': research_content,
            'metadata': metadata,
            's3_location': f"s3://{S3_BUCKET}/{s3_key}" if s3_key else None,
            'model_used': model,
            'timestamp': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {**cors_headers, 'Content-Type': 'application/json'},
            'body': json.dumps(response_data)
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