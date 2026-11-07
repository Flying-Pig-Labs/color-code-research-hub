"""
List ideations for authenticated user from PipelineBatchJobs table
"""
import json
import os
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from helpers.auth import get_optional_user

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

def handler(event, context):
    """
    List all ideations for the authenticated user from PipelineBatchJobs
    """
    try:
        # Get authenticated user claims
        user_claims = get_optional_user(event)
        
        if not user_claims:
            return create_cors_response(401, {'error': 'Authentication required'})
        
        # Extract username from claims (prefer 'name', fallback to 'email' or 'sub')
        username = user_claims.get('name') or user_claims.get('email') or user_claims.get('sub')
        
        # Apply email to username mapping for legacy compatibility
        if username == 'priorww@gmail.com':
            username = 'fprior'
        
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
        
        # Sort by creation date (newest first) - handle missing values
        ideations.sort(key=lambda x: (x.get('createdAt') or 0), reverse=True)
        
        return create_cors_response(200, ideations)
        
    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return create_cors_response(500, {'error': 'Failed to fetch ideations'})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return create_cors_response(500, {'error': 'Internal server error'})
