"""
Get user-scoped shark reviews by mapping issue URLs to user ownership
Since SharkTankReviews table doesn't have username field, we need to cross-reference
with PipelineRepos to determine which reviews belong to which user
"""
import json
import boto3
from user_helpers import get_username_from_jwt, create_user_filter_response, handle_cors_preflight


def handler(event, context):
    """
    Lambda function to get user's shark tank reviews
    
    GET /api/user/shark/reviews
    Authorization: Bearer <jwt>
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
        
        # Initialize DynamoDB
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        
        # First, get user's repository issues to find their issue URLs
        repos_table = dynamodb.Table('PipelineRepos')
        repos_response = repos_table.scan(
            FilterExpression='username = :username AND begins_with(itemType, :issue_prefix)',
            ExpressionAttributeValues={
                ':username': username,
                ':issue_prefix': 'ISSUE#'
            }
        )
        
        user_issues = repos_response.get('Items', [])
        user_issue_urls = [issue.get('url', '') for issue in user_issues if issue.get('url')]
        
        if not user_issue_urls:
            return create_user_filter_response([])
        
        # Now get shark reviews for these issues
        reviews_table = dynamodb.Table('SharkTankReviews')
        user_reviews = []
        
        # We need to scan SharkTankReviews and match by issue_id pattern
        # issue_id format appears to be like "ocean-studio-repos/repo-name#issue-number"
        for issue in user_issues:
            issue_url = issue.get('url', '')
            if not issue_url:
                continue
                
            # Extract issue_id pattern from GitHub URL
            # URL: https://github.com/ocean-studio-repos/mint-delta-catalyst/issues/1
            # issue_id: ocean-studio-repos/mint-delta-catalyst#1
            try:
                url_parts = issue_url.replace('https://github.com/', '').split('/')
                if len(url_parts) >= 4 and url_parts[2] == 'issues':
                    repo_full_name = f"{url_parts[0]}/{url_parts[1]}"
                    issue_number = url_parts[3]
                    issue_id = f"{repo_full_name}#{issue_number}"
                    
                    # Query SharkTankReviews for this specific issue
                    review_response = reviews_table.query(
                        KeyConditionExpression='issue_id = :issue_id',
                        ExpressionAttributeValues={':issue_id': issue_id}
                    )
                    
                    reviews = review_response.get('Items', [])
                    for review in reviews:
                        # Add the original issue data for context
                        review['issue_title'] = issue.get('title', '')
                        review['issue_url'] = issue_url
                        review['repo_name'] = url_parts[1]
                        user_reviews.append(review)
                        
            except Exception as e:
                print(f"Error processing issue URL {issue_url}: {e}")
                continue
        
        # Sort by review timestamp descending (most recent first)
        user_reviews.sort(key=lambda x: x.get('review_timestamp', ''), reverse=True)
        
        return create_user_filter_response(user_reviews)
        
    except Exception as e:
        print(f"Error getting user shark reviews: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }