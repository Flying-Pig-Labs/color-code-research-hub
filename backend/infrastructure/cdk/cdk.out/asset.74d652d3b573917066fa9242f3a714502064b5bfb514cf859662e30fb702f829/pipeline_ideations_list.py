"""
List ideations for authenticated user from PipelineBatchJobs table
"""
import json
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import os
from .utils.http import create_cors_response, get_authenticated_username

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('PIPELINE_BATCH_JOBS_TABLE', 'PipelineBatchJobs'))

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