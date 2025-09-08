"""
List ideations for authenticated user from PipelineBatchJobs table
"""
import json
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import os
import base64

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('PIPELINE_BATCH_JOBS_TABLE', 'PipelineBatchJobs'))

def create_cors_response(status_code, body):
    """Create a proper CORS response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body) if isinstance(body, (dict, list)) else str(body)
    }

def get_authenticated_username(event):
    """
    Extract username from JWT token in Authorization header
    """
    try:
        # Get Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        # Extract JWT token
        token = auth_header.replace('Bearer ', '')
        
        # Decode JWT (without verification for now)
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Add padding if needed
        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding
        
        # Decode payload
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_bytes)
        
        # Extract username (prefer 'name', fallback to 'email' or 'sub')
        username = payload.get('name') or payload.get('email') or payload.get('sub')
        
        return username
        
    except Exception as e:
        print(f"Error extracting username from token: {e}")
        return None

def handler(event, context):
    """
    List all ideations for the authenticated user from PipelineBatchJobs
    """
    try:
        # Get authenticated username from JWT token
        username = get_authenticated_username(event)
        if not username:
            return create_cors_response(401, {'error': 'Authentication required'})
        
        # Query PipelineBatchJobs table filtering by username
        response = table.scan(
            FilterExpression=Attr('username').eq(username)
        )
        
        ideations = []
        for item in response.get('Items', []):
            # Map PipelineBatchJobs fields to standardized format
            ideation = {
                'ideationId': item.get('jobId', item.get('id')),
                'title': item.get('title', item.get('jobName', f"Ideation {item.get('jobId', 'Unknown')}")),
                'status': item.get('status', item.get('jobStatus', 'unknown')),
                'description': item.get('description', item.get('objective')),
                'createdAt': item.get('createdAt', item.get('timestamp')),
                'updatedAt': item.get('updatedAt', item.get('lastUpdated')),
                'username': item.get('username'),
                'jobType': item.get('jobType'),
                'batchJobId': item.get('batchJobId'),  # AWS Batch job ID
                'inputs': item.get('inputs', {}),
                'outputs': item.get('outputs', {}),
                'duration': item.get('duration'),
                'error': item.get('error')
            }
            ideations.append(ideation)
        
        # Sort by creation date (newest first)
        ideations.sort(key=lambda x: x.get('createdAt', 0), reverse=True)
        
        return create_cors_response(200, ideations)
        
    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return create_cors_response(500, {'error': 'Failed to fetch ideations'})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return create_cors_response(500, {'error': 'Internal server error'})