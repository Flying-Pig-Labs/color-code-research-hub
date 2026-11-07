"""
Label a GitHub issue as "shark ready :shark:" and mark the PipelineRepos item as reviewed.

Route: POST /api/github/issues/label
Body: { repository: "owner/repo", issue_number: 1, label?: "shark ready :shark:" }
Auth: Cognito (IdToken). Uses server-side GitHub PAT from Secrets Manager.

Behavior:
- If PipelineRepos has review=true for this ISSUE item, returns 200 { message: "Already reviewed" } without calling GitHub.
- Otherwise, sets review=true and calls GitHub API to add the label.
"""
import json
import os
import boto3
import urllib.request
from helpers.auth import get_user, AuthError
from helpers.http import json_response

PIPELINE_REPOS_TABLE = os.environ.get('PIPELINE_REPOS_TABLE', 'PipelineRepos')
GITHUB_TOKEN_SECRET_ARN = os.environ.get('GITHUB_TOKEN_SECRET_ARN', '')

dynamo = boto3.resource('dynamodb')
secrets = boto3.client('secretsmanager')


def _get_github_token():
    if not GITHUB_TOKEN_SECRET_ARN:
        raise RuntimeError('GITHUB_TOKEN_SECRET_ARN not configured')
    resp = secrets.get_secret_value(SecretId=GITHUB_TOKEN_SECRET_ARN)
    s = resp.get('SecretString') or ''
    try:
        data = json.loads(s)
        token = data.get('github_token') or data.get('token') or data.get('GITHUB_TOKEN')
        if token:
            return token
    except Exception:
        pass
    # Fallback: secret is the token itself
    return s.strip()


def _label_exists(owner: str, repo: str, label: str, token: str) -> bool:
    """Check label existence robustly by listing labels and matching by name.
    - Case-insensitive comparison
    - Normalizes whitespace
    - Supports emoji shortcode ':shark:' -> '🦈'
    """
    def _norm(s: str) -> str:
        return ' '.join((s or '').strip().split()).lower()

    def _variants(name: str):
        yield name
        if ':shark:' in name:
            yield name.replace(':shark:', '🦈')

    targets = {_norm(v) for v in _variants(label)}
    url = f'https://api.github.com/repos/{owner}/{repo}/labels?per_page=100'
    req = urllib.request.Request(url, method='GET')
    req.add_header('Authorization', f'token {token}')
    req.add_header('Accept', 'application/vnd.github.v3+json')
    req.add_header('User-Agent', 'truflr-ai')
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            if 200 <= res.status < 300:
                data = json.loads(res.read().decode('utf-8'))
                for lb in data:
                    name = lb.get('name') or ''
                    if _norm(name) in targets:
                        return True
                return False
    except Exception:
        return False


def _add_label(owner: str, repo: str, number: int, label: str, token: str):
    url = f'https://api.github.com/repos/{owner}/{repo}/issues/{number}/labels'
    payload = { 'labels': [label] }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'token {token}')
    req.add_header('Accept', 'application/vnd.github.v3+json')
    req.add_header('User-Agent', 'truflr-ai')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=15) as res:
        if res.status >= 200 and res.status < 300:
            return True
        raise RuntimeError(f'GitHub returned {res.status}')


def handler(event, context):
    try:
        _ = get_user(event)  # Ensure authenticated
    except AuthError:
        return json_response(401, { 'error': 'unauthorized' })

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return json_response(400, { 'error': 'invalid_json' })

    repository = (body.get('repository') or '').strip()
    issue_number = body.get('issue_number')
    label = (body.get('label') or 'shark ready :shark:').strip()
    if not repository or not issue_number:
        return json_response(422, { 'error': 'repository and issue_number required' })

    # Validate repo format and derive repoName for DDB key
    try:
        owner, reponame = repository.split('/', 1)
        reponame = reponame.strip()
    except ValueError:
        return json_response(422, { 'error': 'repository must be owner/repo' })

    table = dynamo.Table(PIPELINE_REPOS_TABLE)
    item_type = f'ISSUE#{issue_number}'

    # Check review flag; idempotent behavior
    try:
        resp = table.get_item(Key={'repoName': reponame, 'itemType': item_type})
        item = resp.get('Item')
    except Exception as e:
        item = None

    if item and item.get('review') is True:
        return json_response(200, { 'message': 'Already reviewed' })

    # Verify label exists and add on GitHub
    try:
        token = _get_github_token()
        if not _label_exists(owner, reponame, label, token):
            return json_response(400, { 'error': 'label_not_found', 'label': label })
        _add_label(owner, reponame, int(issue_number), label, token)
    except Exception as e:
        return json_response(500, { 'error': 'label_failed', 'detail': str(e) })

    # Mark as reviewed (upsert) after successful label add
    try:
        table.update_item(
            Key={'repoName': reponame, 'itemType': item_type},
            UpdateExpression='SET #r = :true',
            ExpressionAttributeNames={'#r': 'review'},
            ExpressionAttributeValues={':true': True},
        )
    except Exception:
        pass

    return json_response(200, { 'ok': True, 'labeled': True })
