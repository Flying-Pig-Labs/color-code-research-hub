import os
import boto3
from boto3.dynamodb.conditions import Attr
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

    username = _user_id_from_claims(claims)
    table = dynamo.Table(TABLE_NAME)

    try:
        resp = table.scan(FilterExpression=Attr('username').eq(username))
        items = resp.get('Items', [])
        # Map to GitHub-like shape used by UI
        repositories = []
        for it in items:
            repositories.append({
                'id': int(it.get('repoId') or it.get('id') or 0) if str(it.get('repoId') or '0').isdigit() else (it.get('repoId') or it.get('id') or 0),
                'name': it.get('name') or it.get('repoName') or (it.get('full_name') or '').split('/')[-1],
                'full_name': it.get('full_name') or f"{username}/{it.get('name')}",
                'description': it.get('description') or '',
                'html_url': it.get('html_url') or it.get('url') or it.get('repoUrl') or '#',
                'language': it.get('language') or 'Unknown',
                'stargazers_count': it.get('stargazers_count') or it.get('stars') or 0,
                'created_at': it.get('created_at') or it.get('createdAt'),
                'updated_at': it.get('updated_at') or it.get('updatedAt') or it.get('created_at') or it.get('createdAt'),
                'private': bool(it.get('private')),
                'body': it.get('body') or '',
            })
        return json_response(200, repositories)
    except Exception as e:
        return json_response(500, {"error": "internal_error", "detail": str(e)})
