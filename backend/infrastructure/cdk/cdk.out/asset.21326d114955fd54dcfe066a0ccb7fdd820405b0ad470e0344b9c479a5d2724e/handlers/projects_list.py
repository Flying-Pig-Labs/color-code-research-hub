import json
import os
import boto3
from boto3.dynamodb.conditions import Attr
from helpers.auth import get_user, get_optional_user, AuthError
from helpers.users import ensure_user_exists
from helpers.http import json_response
from botocore.exceptions import ClientError

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
        # PipelineRepos table filtered by user identity
        table = _dynamo_res.Table(PIPELINE_REPOS_TABLE)
        user_sub = claims.get('sub')
        username = claims.get('name') or claims.get('email') or claims.get('sub')
        # Legacy mapping support
        if username == 'priorww@gmail.com':
            username = 'fprior'
        # Prefer userId match, but support legacy username values
        try:
            resp = table.scan(
                FilterExpression=(Attr('userId').eq(user_sub)) | (Attr('username').eq(username))
            )
        except Exception:
            # Fallback: username-only scan
            resp = table.scan(FilterExpression=Attr('username').eq(username))
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

    # Quick sanity check to avoid opaque 502s when env is misconfigured
    if not PROJECTS_TABLE:
        return json_response(500, {"error": "PROJECTS_TABLE_NAME not configured"})

    ensure_user_exists(claims)
    user_id = claims.get('sub')
    try:
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
        return json_response(200, items)
    except ClientError as e:
        code = e.response.get('Error', {}).get('Code')
        # Graceful fallback if GSI isn't available yet: do a scan by userId
        if code in ('ValidationException', 'ResourceNotFoundException'):
            try:
                table = _dynamo_res.Table(PROJECTS_TABLE)
                scan = table.scan(FilterExpression=Attr('userId').eq(user_id))
                items = [
                    {
                        'projectId': it.get('projectId'),
                        'title': it.get('title', ''),
                        'createdAt': int(it.get('createdAt', 0)) if isinstance(it.get('createdAt'), (int, float, str)) else 0,
                    }
                    for it in scan.get('Items', [])
                ]
                return json_response(200, items)
            except Exception:
                # Fall through to generic error below
                pass
        # Unknown error: return structured 500 to prevent APIGW 502
        return json_response(500, {"error": "internal_error", "detail": str(e)})
