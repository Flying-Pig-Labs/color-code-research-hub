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
DOUBLES_TABLE = os.environ.get('DOUBLES_TABLE_NAME', '')


def handler(event, context):
    # If caller requests legacy pipeline repos via query param, serve that schema
    qs = event.get('queryStringParameters') or {}
    item_type = (qs.get('item_type') or '').lower()
    if item_type:
        # Special case: DoubleDowns listing used by Plan page
        if item_type == 'doubles':
            try:
                claims = get_user(event)
            except AuthError:
                return json_response(401, {"error": "unauthorized"})
            ensure_user_exists(claims)
            user_id = claims.get('sub')
            items: list = []
            # Prefer DoubleDowns table if configured
            if DOUBLES_TABLE:
                try:
                    table = _dynamo_res.Table(DOUBLES_TABLE)
                    scan = table.scan(FilterExpression=Attr('userId').eq(user_id))
                    raw = scan.get('Items', [])
                    for d in raw:
                        repo_name = d.get('repoName')
                        if not repo_name and d.get('repoUrl'):
                            try:
                                # Derive from GitHub URL
                                u = d.get('repoUrl')
                                parts = str(u).rstrip('/').split('/')
                                if len(parts) >= 2:
                                    repo_name = parts[-1]
                            except Exception:
                                pass
                        items.append({
                            'doubleId': d.get('doubleId') or d.get('id'),
                            'repoName': repo_name,
                            'repoUrl': d.get('repoUrl'),
                            'body': d.get('body') or d.get('readme') or d.get('readme_content'),
                            'createdAt': d.get('createdAt') or d.get('created_at') or d.get('startedAt'),
                            'status': d.get('status') or 'completed',
                        })
                except Exception:
                    # Fall through to fallback below
                    items = []
            # Fallback: derive doubles-like items from PipelineRepos REPO entries
            if not items:
                try:
                    table_pr = _dynamo_res.Table(PIPELINE_REPOS_TABLE)
                    scan = table_pr.scan(FilterExpression=Attr('userId').eq(user_id))
                    for r in scan.get('Items', []):
                        if r.get('itemType') == 'REPO':
                            repo_name = r.get('repoName') or r.get('name')
                            items.append({
                                'doubleId': r.get('id'),
                                'repoName': repo_name,
                                'repoUrl': r.get('repoUrl') or r.get('url') or r.get('htmlUrl'),
                                'body': r.get('body'),
                                'createdAt': r.get('createdAt') or r.get('timestamp'),
                                'status': 'completed',
                            })
                except Exception:
                    pass
            # Sort by createdAt desc if available
            try:
                items.sort(key=lambda x: x.get('createdAt') or 0, reverse=True)
            except Exception:
                pass
            # For compatibility with frontend which expects an array
            return json_response(200, items)

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
                    'id': item.get('id') or item.get('repoId') or item.get('repoName'),
                    'name': item.get('repoName') or item.get('name', item.get('title')),
                    'repoName': item.get('repoName') or item.get('name'),
                    'full_name': item.get('fullName', item.get('name')),
                    'description': item.get('description'),
                    'body': item.get('body'),
                    'repoUrl': item.get('repoUrl') or item.get('url') or item.get('htmlUrl'),
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
                    'id': item.get('id') or (f"{t}:{item.get('repoName', '')}" if item.get('repoName') else t),
                    'number': int(n) if n.isdigit() else 0,
                    'title': item.get('title', item.get('name')),
                    'body': item.get('body'),
                    'url': item.get('url'),
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
