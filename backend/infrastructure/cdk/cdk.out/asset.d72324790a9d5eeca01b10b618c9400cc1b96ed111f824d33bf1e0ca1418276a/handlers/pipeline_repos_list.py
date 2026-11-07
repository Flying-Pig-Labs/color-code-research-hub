"""
List repositories and issues for authenticated user from PipelineRepos table
Handles both REPO and ISSUE#{number} itemTypes
"""
import json
import os
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
from helpers.auth import get_optional_user

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('PIPELINE_REPOS_TABLE', 'PipelineRepos'))

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
    List all repositories and issues for the authenticated user from PipelineRepos
    Query params:
    - item_type: 'repo', 'issue', or 'all' (default: 'all')
    In PUBLIC_MODE without auth:
      - If item_type specified: returns demo repos/issues payload
      - If item_type not specified: returns demo Projects[] payload for UI compatibility
    """
    try:
        # Get query parameters first to check item_type
        query_params = event.get('queryStringParameters') or {}
        item_type_filter = query_params.get('item_type', 'all').lower()
        
        # Get authenticated user claims
        user_claims = get_optional_user(event)
        
        if not user_claims:
            return create_cors_response(401, {'error': 'Authentication required'})
        
        # Extract username from claims (prefer 'name', fallback to 'email' or 'sub')
        username = user_claims.get('name') or user_claims.get('email') or user_claims.get('sub')
        
        # Apply email to username mapping for legacy compatibility
        if username == 'priorww@gmail.com':
            username = 'fprior'
        
        # Query PipelineRepos table filtering by username
        response = table.scan(
            FilterExpression=Attr('username').eq(username)
        )
        
        repositories = []
        issues = []
        
        for item in response.get('Items', []):
            item_type = item.get('itemType', '')
            
            if item_type == 'REPO':
                # This is a repository
                repo = {
                    'id': item.get('id'),
                    'name': item.get('repoName') or item.get('name', item.get('title')),
                    'repoName': item.get('repoName') or item.get('name'),
                    'full_name': item.get('fullName', item.get('name')),
                    'description': item.get('description'),
                    'body': item.get('body'),  # README content
                    'repoUrl': item.get('repoUrl') or item.get('url') or item.get('htmlUrl'),
                    'html_url': item.get('url', item.get('htmlUrl')),
                    'language': item.get('language'),
                    'stargazers_count': item.get('stars', 0),
                    'created_at': item.get('createdAt', item.get('timestamp')),
                    'updated_at': item.get('updatedAt'),
                    'username': item.get('username'),
                    'itemType': item_type,
                    'repoId': item.get('repoId'),
                    'visibility': item.get('visibility', 'private')
                }
                repositories.append(repo)
                
            elif item_type.startswith('ISSUE#'):
                # This is an issue
                issue_number = item_type.replace('ISSUE#', '')
                issue = {
                    'id': item.get('id'),
                    'number': int(issue_number) if issue_number.isdigit() else 0,
                    'title': item.get('title', item.get('name')),
                    'body': item.get('body'),  # Issue description
                    'url': item.get('url') or item.get('github_url') or item.get('issueUrl'),
                    'state': item.get('state', item.get('status', 'open')),
                    'created_at': item.get('createdAt', item.get('timestamp')),
                    'updated_at': item.get('updatedAt'),
                    'username': item.get('username'),
                    'itemType': item_type,
                    'repoId': item.get('repoId'),
                    'repository_id': item.get('repoId'),
                    'labels': item.get('labels', []),
                    'assignees': item.get('assignees', [])
                }
                issues.append(issue)
        
        # Sort by creation date (newest first)
        repositories.sort(key=lambda x: x.get('created_at', 0), reverse=True)
        issues.sort(key=lambda x: x.get('created_at', 0), reverse=True)
        
        # Return based on filter
        if item_type_filter == 'repo':
            return create_cors_response(200, repositories)
        elif item_type_filter == 'issue':
            return create_cors_response(200, issues)
        else:
            # Return both with type indicators
            return create_cors_response(200, {
                'repositories': repositories,
                'issues': issues,
                'total': {
                    'repositories': len(repositories),
                    'issues': len(issues)
                }
            })
        
    except ClientError as e:
        print(f"DynamoDB error: {e}")
        return create_cors_response(500, {'error': 'Failed to fetch pipeline repos'})
    except Exception as e:
        print(f"Unexpected error: {e}")
        return create_cors_response(500, {'error': 'Internal server error'})
