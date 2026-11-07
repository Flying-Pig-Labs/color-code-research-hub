import json
import os
import boto3
from helpers.auth import get_user, require_admin, AuthError
from helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
        require_admin(claims)
    except AuthError:
        return json_response(403, {"error": "forbidden"})
    resp = _dynamodb.scan(TableName=USERS_TABLE, Limit=50)
    users = [
        {
            'userId': i['userId']['S'],
            'email': i.get('email', {}).get('S', ''),
            'credits': int(i.get('credits', {'N': '0'})['N'])
        }
        for i in resp.get('Items', [])
    ]
    return json_response(200, {'users': users})
