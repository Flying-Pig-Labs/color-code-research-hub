"""
List research reports for authenticated user from ResearchReports table
"""
import json
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import os
from .utils.http import create_cors_response, get_authenticated_username

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('RESEARCH_REPORTS_TABLE', 'ResearchReports'))

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