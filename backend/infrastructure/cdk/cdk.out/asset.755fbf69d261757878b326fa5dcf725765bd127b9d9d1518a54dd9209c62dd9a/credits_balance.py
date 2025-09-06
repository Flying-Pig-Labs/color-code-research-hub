import json
import os
import boto3
from ..helpers.auth import get_user, AuthError
from ..helpers.users import ensure_user_exists
from ..helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')

def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    # Ensure user record exists
    ensure_user_exists(claims)
    user_id = claims.get('sub')
    resp = _dynamodb.get_item(TableName=USERS_TABLE, Key={'userId': {'S': user_id}})
    item = resp.get('Item')
    if not item:
        return json_response(404, {"error": "user not found"})
    credits = int(item.get('credits', {'N': '0'})['N'])
    return json_response(200, {"credits": credits})
