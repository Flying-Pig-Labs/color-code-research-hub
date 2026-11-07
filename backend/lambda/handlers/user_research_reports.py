"""
Get user-scoped research reports from ResearchReports table
Filters by username extracted from Cognito JWT
"""
import json
import boto3
from user_helpers import get_username_from_jwt, create_user_filter_response, handle_cors_preflight


def handler(event, context):
    """
    Lambda function to get user's research reports
    
    GET /api/user/research/reports
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
        table = dynamodb.Table('ResearchReports')
        
        # Scan table with username filter
        response = table.scan(
            FilterExpression='username = :username',
            ExpressionAttributeValues={
                ':username': username
            }
        )
        
        reports = response.get('Items', [])
        
        # Add download URLs for S3 reports
        s3_client = boto3.client('s3')
        for report in reports:
            if 's3ReportKey' in report:
                try:
                    # Generate presigned URL for report download (1 hour expiry)
                    bucket_name = report['s3ReportKey'].split('/')[0] if '/' in report['s3ReportKey'] else 'multi-step-llm-dev-984906149037'
                    s3_key = report['s3ReportKey']
                    
                    # Try to generate presigned URL
                    download_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': bucket_name, 'Key': s3_key},
                        ExpiresIn=3600
                    )
                    report['downloadUrl'] = download_url
                except Exception as e:
                    print(f"Error generating download URL for {report['reportId']}: {e}")
                    report['downloadUrl'] = None
        
        return create_user_filter_response(reports)
        
    except Exception as e:
        print(f"Error getting user research reports: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }