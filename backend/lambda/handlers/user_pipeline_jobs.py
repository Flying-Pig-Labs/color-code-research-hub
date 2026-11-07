"""
Get user-scoped pipeline jobs from PipelineBatchJobs table
Filters by username extracted from Cognito JWT
"""
import json
import boto3
from user_helpers import get_username_from_jwt, create_user_filter_response, handle_cors_preflight


def handler(event, context):
    """
    Lambda function to get user's pipeline jobs
    
    GET /api/user/pipeline/jobs
    Authorization: Bearer <jwt>
    """
    
    # Handle CORS preflight - support API Gateway v2 event format
    method = event.get("requestContext", {}).get("http", {}).get("method", event.get("httpMethod", ""))
    if method == 'OPTIONS':
        return handle_cors_preflight()
    
    try:
        # Get username from JWT
        username = get_username_from_jwt(event)
        if not username:
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Unauthorized - invalid token'})
            }
        
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('PipelineBatchJobs')
        
        # Scan table with username filter
        response = table.scan(
            FilterExpression='username = :username',
            ExpressionAttributeValues={
                ':username': username
            }
        )
        
        jobs = response.get('Items', [])
        
        # Sort by startTime descending (most recent first)
        jobs.sort(key=lambda x: x.get('startTime', ''), reverse=True)
        
        return create_user_filter_response(jobs)
        
    except Exception as e:
        print(f"Error getting user pipeline jobs: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }