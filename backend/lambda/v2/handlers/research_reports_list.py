"""
List research reports for authenticated user from ResearchReports table
"""
import json
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import os
import base64

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
    List all research reports for the authenticated user
    """
    try:
        # Get authenticated username from JWT token
        username = get_authenticated_username(event)
        if not username:
            return create_cors_response(401, {'error': 'Authentication required'})
        
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