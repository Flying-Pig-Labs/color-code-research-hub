"""
Trigger repository build from an idea/issue
Calls the existing Blue Ocean Ideation build API with user context
"""
import json
import boto3
import requests
from user_helpers import get_username_from_jwt, handle_cors_preflight


def handler(event, context):
    """
    Lambda function to build a repository from an idea
    
    POST /api/user/build/repository
    Authorization: Bearer <jwt>
    Body: {
        "repoName": "mint-delta-catalyst",
        "issueNumber": 1
    }
    """
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return handle_cors_preflight()
    
    try:
        # Get username from JWT
        username = get_username_from_jwt(event)
        if not username:
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Unauthorized - invalid token'})
            }
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        repo_name = body.get('repoName')
        issue_number = body.get('issueNumber')
        
        if not repo_name or not issue_number:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'repoName and issueNumber required'})
            }
        
        # Verify user owns this repository/issue
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        table = dynamodb.Table('PipelineRepos')
        
        response = table.get_item(
            Key={
                'repoName': repo_name,
                'itemType': f'ISSUE#{issue_number}'
            }
        )
        
        if 'Item' not in response or response['Item'].get('username') != username:
            return {
                'statusCode': 403,
                'body': json.dumps({'error': 'Forbidden - you do not own this repository/issue'})
            }
        
        # Call the existing Blue Ocean Ideation build API
        build_url = 'https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/build'
        
        build_payload = {
            'repository': f'ocean-studio-repos/{repo_name}',
            'issue_number': issue_number,
            'username': username  # Add username context
        }
        
        build_response = requests.post(build_url, json=build_payload, timeout=30)
        
        if build_response.status_code == 200:
            build_data = build_response.json()
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS'
                },
                'body': json.dumps({
                    'success': True,
                    'message': 'Repository build triggered successfully',
                    'buildData': build_data
                })
            }
        else:
            return {
                'statusCode': build_response.status_code,
                'body': json.dumps({
                    'error': 'Build API call failed',
                    'details': build_response.text
                })
            }
        
    except Exception as e:
        print(f"Error triggering repository build: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }