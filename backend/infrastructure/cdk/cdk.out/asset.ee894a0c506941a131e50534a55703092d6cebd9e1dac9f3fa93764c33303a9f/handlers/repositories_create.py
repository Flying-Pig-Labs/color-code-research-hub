import os
import json
import time
import boto3
from helpers.auth import get_user, AuthError
from helpers.http import json_response

TABLE_NAME = os.environ.get('REPOSITORIES_TABLE', 'Repositories')
dynamo = boto3.resource('dynamodb')


def _user_id_from_claims(claims: dict) -> str:
    # Use Cognito sub (userId) consistently across tables
    return claims.get('sub')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})

    if not TABLE_NAME:
        return json_response(500, {"error": "REPOSITORIES_TABLE not configured"})

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return json_response(400, {"error": "invalid_json"})

    name = body.get('name')
    full_name = body.get('full_name') or name
    if not name:
        return json_response(422, {"error": "name required"})

    username = _user_id_from_claims(claims)
    table = dynamo.Table(TABLE_NAME)
    ts = int(time.time() * 1000)

    item = {
        'repoId': f"{username}-{name}-{ts}",
        'username': username,
        'name': name,
        'full_name': full_name,
        'html_url': body.get('html_url') or body.get('url') or '#',
        'description': body.get('description') or '',
        'language': body.get('language') or 'Unknown',
        'stargazers_count': body.get('stargazers_count') or 0,
        'private': bool(body.get('private')),
        'created_at': body.get('created_at') or ts,
        'updated_at': body.get('updated_at') or ts,
        'body': body.get('body') or '',
    }

    try:
        table.put_item(Item=item)
        return json_response(201, {"success": True, "repository": item})
    except Exception as e:
        return json_response(500, {"error": "internal_error", "detail": str(e)})
