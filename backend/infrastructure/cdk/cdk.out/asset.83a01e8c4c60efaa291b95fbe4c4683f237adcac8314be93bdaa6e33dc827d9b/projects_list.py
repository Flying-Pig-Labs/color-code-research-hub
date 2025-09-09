import json
import os
import boto3
from helpers.auth import get_user, AuthError
from helpers.users import ensure_user_exists
from helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
PROJECTS_TABLE = os.environ.get('PROJECTS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    ensure_user_exists(claims)
    user_id = claims.get('sub')
    resp = _dynamodb.query(
        TableName=PROJECTS_TABLE,
        IndexName='GSI_ProjectsByUser',
        KeyConditionExpression='userId = :u',
        ExpressionAttributeValues={':u': {'S': user_id}},
        ScanIndexForward=False
    )
    items = [
        {
            'projectId': i['projectId']['S'],
            'title': i.get('title', {}).get('S', ''),
            'createdAt': int(i.get('createdAt', {'N': '0'})['N'])
        }
        for i in resp.get('Items', [])
    ]
    return json_response(200, {'projects': items})
