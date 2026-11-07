"""
Update README.md in a GitHub repository.

Route: POST /api/github/repos/readme
Body: { repository: "owner/repo", content: "# Markdown...", message?: "commit message" }
"""
import os
import json
import base64
import urllib.request
import boto3
from helpers.auth import get_user, AuthError
from helpers.http import json_response

GITHUB_TOKEN_SECRET_ARN = os.environ.get('GITHUB_TOKEN_SECRET_ARN', '')
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
    return s.strip()


def _get_readme_sha(owner: str, repo: str, token: str):
    url = f'https://api.github.com/repos/{owner}/{repo}/contents/README.md'
    req = urllib.request.Request(url, method='GET')
    req.add_header('Authorization', f'token {token}')
    req.add_header('Accept', 'application/vnd.github.v3+json')
    req.add_header('User-Agent', 'truflr-ai')
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            if res.status == 200:
                data = json.loads(res.read().decode('utf-8'))
                return data.get('sha')
    except Exception:
        return None
    return None


def handler(event, context):
    try:
        _ = get_user(event)
    except AuthError:
        return json_response(401, { 'error': 'unauthorized' })

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return json_response(400, { 'error': 'invalid_json' })

    repository = (body.get('repository') or '').strip()
    content = body.get('content') or ''
    message = body.get('message') or 'refine: update README.md'
    if not repository or not content:
        return json_response(422, { 'error': 'repository and content required' })
    try:
        owner, reponame = repository.split('/', 1)
    except ValueError:
        return json_response(422, { 'error': 'repository must be owner/repo' })

    token = _get_github_token()
    sha = _get_readme_sha(owner, reponame, token)
    url = f'https://api.github.com/repos/{owner}/{reponame}/contents/README.md'
    payload = {
        'message': message,
        'content': base64.b64encode(content.encode('utf-8')).decode('utf-8'),
    }
    if sha:
        payload['sha'] = sha
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='PUT')
    req.add_header('Authorization', f'token {token}')
    req.add_header('Accept', 'application/vnd.github.v3+json')
    req.add_header('User-Agent', 'truflr-ai')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            if 200 <= res.status < 300:
                return json_response(200, { 'ok': True })
            return json_response(res.status, { 'error': 'github_error' })
    except Exception as e:
        return json_response(500, { 'error': 'update_failed', 'detail': str(e) })

