import json
import os
import boto3
from helpers.auth import get_user, AuthError
from helpers.users import ensure_user_exists
from helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
RESEARCH_REPORTS_TABLE = os.environ.get('RESEARCH_REPORTS_TABLE', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    ensure_user_exists(claims)
    user_id = claims.get('sub')
    
    # Scan reports filtered by userId (temporary until GSI_ReportsByUser is added)
    resp = _dynamodb.scan(
        TableName=RESEARCH_REPORTS_TABLE,
        FilterExpression='userId = :u',
        ExpressionAttributeValues={':u': {'S': user_id}}
    )
    
    items = [
        {
            'reportId': i['reportId']['S'],
            'projectId': i.get('projectId', {}).get('S', ''),
            'status': i.get('status', {}).get('S', 'pending'),
            'startedAt': int(i.get('startedAt', {'N': '0'})['N']),
            'completedAt': int(i.get('completedAt', {'N': '0'})['N']) if i.get('completedAt') else None
        }
        for i in resp.get('Items', [])
    ]
    # Sort by startedAt descending (latest first)
    items.sort(key=lambda x: x['startedAt'], reverse=True)
    return json_response(200, {'reports': items})
