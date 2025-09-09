import json
import os
import boto3
from helpers.auth import get_user, AuthError
from helpers.users import ensure_user_exists

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', 'Users')


def json_response(status_code, body):
    """Create a proper JSON response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body) if isinstance(body, (dict, list)) else str(body)
    }

## use shared ensure_user_exists from helpers.users

def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    try:
        # Ensure user record exists
        ensure_user_exists(claims)
        user_id = claims.get('sub') or claims.get('name') or claims.get('username') or 'unknown'
        resp = _dynamodb.get_item(TableName=USERS_TABLE, Key={'userId': {'S': user_id}})
        item = resp.get('Item')
        if not item:
            return json_response(404, {"error": "user not found"})
        credits = int(item.get('credits', {'N': '0'})['N'])
        return json_response(200, {"credits": credits})
    except Exception as e:
        print(f"Error in credits_balance handler: {e}")
        return json_response(500, {"error": "Internal server error"})
