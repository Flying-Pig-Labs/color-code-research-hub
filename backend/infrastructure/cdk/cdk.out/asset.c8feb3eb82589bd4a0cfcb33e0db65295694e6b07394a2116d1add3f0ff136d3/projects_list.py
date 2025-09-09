import json
import os
import boto3
from boto3.dynamodb.conditions import Attr
from helpers.auth import get_user, get_optional_user, AuthError
from helpers.users import ensure_user_exists
from helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
_dynamo_res = boto3.resource('dynamodb')
PROJECTS_TABLE = os.environ.get('PROJECTS_TABLE_NAME', '')
PIPELINE_REPOS_TABLE = os.environ.get('PIPELINE_REPOS_TABLE', 'PipelineRepos')


def handler(event, context):
    # If caller requests legacy pipeline repos via query param, serve that schema
    qs = event.get('queryStringParameters') or {}
    item_type = (qs.get('item_type') or '').lower()
    if item_type:
        # Require auth
        try:
            claims = get_user(event)
        except AuthError:
            return json_response(401, {"error": "unauthorized"})
        # PipelineRepos table filtered by username (legacy schema)
        table = _dynamo_res.Table(PIPELINE_REPOS_TABLE)
        resp = table.scan(FilterExpression=Attr('username').eq(claims.get('email') or claims.get('sub')))
        repositories = []
        issues = []
        for item in resp.get('Items', []):
            t = item.get('itemType', '')
            if t == 'REPO':
                repositories.append({
                    'id': item.get('id'),
                    'name': item.get('name', item.get('title')),
                    'full_name': item.get('fullName', item.get('name')),
                    'description': item.get('description'),
                    'body': item.get('body'),
                    'html_url': item.get('url', item.get('htmlUrl')),
                    'language': item.get('language'),
                    'stargazers_count': item.get('stars', 0),
                    'created_at': item.get('createdAt', item.get('timestamp')),
                    'updated_at': item.get('updatedAt'),
                    'username': item.get('username'),
                    'itemType': t,
                    'repoId': item.get('repoId'),
                    'visibility': item.get('visibility', 'private')
                })
            elif t.startswith('ISSUE#'):
                n = t.replace('ISSUE#', '')
                issues.append({
                    'id': item.get('id'),
                    'number': int(n) if n.isdigit() else 0,
                    'title': item.get('title', item.get('name')),
                    'body': item.get('body'),
                    'state': item.get('state', item.get('status', 'open')),
                    'created_at': item.get('createdAt', item.get('timestamp')),
                    'updated_at': item.get('updatedAt'),
                    'username': item.get('username'),
                    'itemType': t,
                    'repoId': item.get('repoId'),
                    'repository_id': item.get('repoId'),
                    'labels': item.get('labels', []),
                    'assignees': item.get('assignees', [])
                })
        return json_response(200, {
            'repositories': repositories,
            'issues': issues,
            'total': {'repositories': len(repositories), 'issues': len(issues)}
        })

    # Default: Projects list
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
    # For UI compatibility, return array (not wrapped)
    return json_response(200, items)
