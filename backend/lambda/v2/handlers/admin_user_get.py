import json
import os
import boto3
from ..helpers.auth import get_user, require_admin, AuthError

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
        require_admin(claims)
    except AuthError:
        return {"statusCode": 403, "body": json.dumps({"error": "forbidden"})}
    user_id = event.get('pathParameters', {}).get('id')
    resp = _dynamodb.get_item(TableName=USERS_TABLE, Key={'userId': {'S': user_id}})
    item = resp.get('Item')
    if not item:
        return {"statusCode": 404, "body": json.dumps({"error": "not found"})}
    stats = {}
    if 'stats' in item:
        for k, v in item['stats']['M'].items():
            stats[k] = int(v['N'])
    user = {
        'userId': item['userId']['S'],
        'email': item.get('email', {}).get('S', ''),
        'credits': int(item.get('credits', {'N': '0'})['N']),
        'stats': stats,
    }
    return {"statusCode": 200, "body": json.dumps(user)}
