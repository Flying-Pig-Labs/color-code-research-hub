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
    # Support comma-separated list of secret ARNs as primary,fallback
    candidates = [s.strip() for s in GITHUB_TOKEN_SECRET_ARN.split(',') if s.strip()]
    last_error = None
    for arn in candidates:
        try:
            resp = secrets.get_secret_value(SecretId=arn)
            s = resp.get('SecretString') or ''
            if not s:
                continue
            try:
                data = json.loads(s)
                token = data.get('github_token') or data.get('token') or data.get('GITHUB_TOKEN')
                if token:
                    return token
            except Exception:
                # Secret is plaintext token
                return s.strip()
        except Exception as e:
            last_error = e
            continue
    if last_error:
        raise last_error
    raise RuntimeError('No usable GitHub token secret')


def _list_labels(owner: str, repo: str, token: str):
    url = f'https://api.github.com/repos/{owner}/{repo}/labels?per_page=100'
    req = urllib.request.Request(url, method='GET')
    req.add_header('Authorization', f'token {token}')
    req.add_header('Accept', 'application/vnd.github.v3+json')
    req.add_header('User-Agent', 'truflr-ai')
    with urllib.request.urlopen(req, timeout=15) as res:
        if 200 <= res.status < 300:
            return json.loads(res.read().decode('utf-8'))
        raise RuntimeError(f'GitHub list labels status {res.status}')


def _find_shark_label(owner: str, repo: str, token: str, preferred: str | None = None) -> str | None:
    """Return the exact label name to use:
    - If preferred provided and exists, use it.
    - Else, pick the first label whose name contains 'shark' (case-insensitive) or the shark emoji.
    """
    labels = _list_labels(owner, repo, token)

    def norm(s: str) -> str:
        return (s or '').strip().lower()

    # Exact preferred match (case-insensitive)
    if preferred:
        p = norm(preferred)
        for lb in labels:
            name = lb.get('name') or ''
            if norm(name) == p:
                return name

    # Substring match on 'shark' or emoji
    for lb in labels:
        name = (lb.get('name') or '')
        n = norm(name)
        if 'shark' in n or '🦈' in name:
            return name
    return None


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

    # Attempt to add existing shark label from repo; do not create new labels
    try:
        token = _get_github_token()
        chosen = _find_shark_label(owner, reponame, token, preferred=label)
        if not chosen:
            return json_response(400, { 'error': 'shark_label_not_found', 'hint': 'Create a label containing "shark" or the 🦈 emoji in this repo.' })
        _add_label(owner, reponame, int(issue_number), chosen, token)
    except Exception as e:
        # Inspect HTTP errors and pass through status + GitHub body when possible
        import urllib.error
        if isinstance(e, urllib.error.HTTPError):
            status = getattr(e, 'code', 0)
            gh_body = ''
            try:
                gh_body = e.read().decode('utf-8', errors='ignore')
            except Exception:
                gh_body = str(e)
            if status in (400, 404, 422):
                return json_response(400, { 'error': 'label_not_found', 'github': gh_body })
            if status == 403:
                return json_response(403, { 'error': 'forbidden', 'github': gh_body, 'repository': f'{owner}/{reponame}', 'issue_number': int(issue_number) })
            return json_response(status or 500, { 'error': 'github_error', 'github': gh_body })
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
