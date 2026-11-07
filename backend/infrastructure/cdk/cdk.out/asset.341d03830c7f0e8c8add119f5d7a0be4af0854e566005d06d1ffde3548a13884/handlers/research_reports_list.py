"""
List research reports for authenticated user from ResearchReports table
"""
import json
import os
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from helpers.auth import get_optional_user

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('RESEARCH_REPORTS_TABLE', 'ResearchReports'))

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
    List all research reports for the authenticated user
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
        
        # Query ResearchReports table filtering by username
        response = table.scan(
            FilterExpression=Attr('username').eq(username)
        )
        
        reports = []
        for item in response.get('Items', []):
            # Map ResearchReports fields to standardized format
            report = {
                'reportId': item.get('reportId', item.get('id')),
                'title': item.get('title', f"Report {item.get('reportId', 'Unknown')}"),
                'status': item.get('status', 'completed'),
                'team': item.get('team'),
                'requester': item.get('requester'),
                'createdAt': item.get('timestamp', item.get('createdAt')),
                'updatedAt': item.get('updatedAt', item.get('timestamp')),
                'reportUrl': item.get('s3Key'),  # S3 key for full report
                'username': item.get('username'),
                'tags': item.get('tags', []),
                'wordCount': item.get('wordCount'),
                'confidence': item.get('confidence')
            }
            reports.append(report)
        
        # Sort by creation date (newest first)
        reports.sort(key=lambda x: x.get('createdAt', 0), reverse=True)
        
        return create_cors_response(200, reports)
        
    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return create_cors_response(500, {'error': 'Failed to fetch reports'})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return create_cors_response(500, {'error': 'Internal server error'})
