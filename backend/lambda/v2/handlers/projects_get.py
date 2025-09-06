import json
import os
import boto3
from ..helpers.auth import get_user, AuthError

_dynamodb = boto3.client('dynamodb')
PROJECTS_TABLE = os.environ.get('PROJECTS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}
    project_id = event.get('pathParameters', {}).get('projectId')
    if not project_id:
        return {"statusCode": 400, "body": json.dumps({"error": "projectId required"})}
    resp = _dynamodb.get_item(TableName=PROJECTS_TABLE, Key={'projectId': {'S': project_id}})
    item = resp.get('Item')
    if not item or item.get('userId', {}).get('S') != claims.get('sub'):
        return {"statusCode": 404, "body": json.dumps({"error": "not found"})}
    result = {
        'projectId': project_id,
        'title': item.get('title', {}).get('S', ''),
        'domain': item.get('domain', {}).get('S'),
        'createdAt': int(item.get('createdAt', {'N': '0'})['N'])
    }
    return {"statusCode": 200, "body": json.dumps(result)}
