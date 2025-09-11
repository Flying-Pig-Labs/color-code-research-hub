"""
Get user-scoped repositories and issues from PipelineRepos table
Filters by username extracted from Cognito JWT
"""
import json
import boto3
from collections import defaultdict
from user_helpers import get_username_from_jwt, create_user_filter_response, handle_cors_preflight


def handler(event, context):
    """
    Lambda function to get user's repositories and issues
    
    GET /api/user/repositories
    Authorization: Bearer <jwt>
    
    Returns repositories grouped by repo name with their issues
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
        table = dynamodb.Table('PipelineRepos')
        
        # Scan table with username filter
        response = table.scan(
            FilterExpression='username = :username',
            ExpressionAttributeValues={
                ':username': username
            }
        )
        
        items = response.get('Items', [])
        
        # Group items by repository name
        repos = defaultdict(lambda: {
            'repoName': '',
            'issues': [],
            'totalIssues': 0,
            'latestActivity': '',
            'githubUrl': ''
        })
        
        for item in items:
            repo_name = item.get('repoName', '')
            
            # Initialize repo if first time seeing it
            if not repos[repo_name]['repoName']:
                repos[repo_name]['repoName'] = repo_name
                repos[repo_name]['githubUrl'] = f"https://github.com/ocean-studio-repos/{repo_name}"
            
            # Add issue if it's an issue item
            if item.get('itemType', '').startswith('ISSUE#'):
                issue = {
                    'issueId': item.get('itemType', ''),
                    'issueNumber': item.get('issueNumber'),
                    'title': item.get('title', ''),
                    'labels': item.get('labels', []),
                    'url': item.get('url', ''),
                    'createdAt': item.get('createdAt', ''),
                    'body': item.get('body', '')[:500] + '...' if len(item.get('body', '')) > 500 else item.get('body', '')  # Truncate body
                }
                repos[repo_name]['issues'].append(issue)
                
                # Update latest activity
                if item.get('createdAt', '') > repos[repo_name]['latestActivity']:
                    repos[repo_name]['latestActivity'] = item.get('createdAt', '')
        
        # Convert to list and add counts
        result = []
        for repo_data in repos.values():
            repo_data['totalIssues'] = len(repo_data['issues'])
            # Sort issues by issue number
            repo_data['issues'].sort(key=lambda x: x.get('issueNumber', 0))
            result.append(repo_data)
        
        # Sort repos by latest activity
        result.sort(key=lambda x: x.get('latestActivity', ''), reverse=True)
        
        return create_user_filter_response(result)
        
    except Exception as e:
        print(f"Error getting user repositories: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }