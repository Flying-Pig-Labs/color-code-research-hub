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
    project_id = event.get('pathParameters', {}).get('projectId')
    if not project_id:
        return json_response(400, {"error": "projectId required"})
    resp = _dynamodb.get_item(TableName=PROJECTS_TABLE, Key={'projectId': {'S': project_id}})
    item = resp.get('Item')
    if not item or item.get('userId', {}).get('S') != claims.get('sub'):
        return json_response(404, {"error": "not found"})
    result = {
        'projectId': project_id,
        'title': item.get('title', {}).get('S', ''),
        'domain': item.get('domain', {}).get('S'),
        'createdAt': int(item.get('createdAt', {'N': '0'})['N'])
    }
    return json_response(200, result)
