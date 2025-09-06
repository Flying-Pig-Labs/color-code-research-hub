import json
import os
import boto3
from ..helpers.auth import get_user, AuthError

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')

def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}
    user_id = claims.get('sub')
    resp = _dynamodb.get_item(TableName=USERS_TABLE, Key={'userId': {'S': user_id}})
    item = resp.get('Item')
    if not item:
        return {"statusCode": 404, "body": json.dumps({"error": "user not found"})}
    credits = int(item.get('credits', {'N': '0'})['N'])
    return {"statusCode": 200, "body": json.dumps({"credits": credits})}
