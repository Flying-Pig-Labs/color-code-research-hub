import json
import os
import time
import uuid
import boto3
from helpers.auth import get_user, AuthError
from helpers.users import ensure_user_exists
from helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
PROJECTS_TABLE = os.environ.get('PROJECTS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})

    # Ensure user row exists (first login)
    ensure_user_exists(claims)
    # Validate env to avoid opaque 502s
    if not PROJECTS_TABLE:
        return json_response(500, {"error": "PROJECTS_TABLE_NAME not configured"})
    body = json.loads(event.get('body') or '{}')
    title = body.get('title')
    if not title:
        return json_response(422, {"error": "title required"})
    domain = body.get('domain')
    inputs = body.get('inputs')

    project_id = str(uuid.uuid4())
    ts = int(time.time() * 1000)
    item = {
        'projectId': {'S': project_id},
        'userId': {'S': claims['sub']},
        'title': {'S': title},
        'createdAt': {'N': str(ts)}
    }
    if domain:
        item['domain'] = {'S': domain}
    if inputs:
        item['inputs'] = {'S': json.dumps(inputs)}

    try:
        _dynamodb.put_item(TableName=PROJECTS_TABLE, Item=item)
    except Exception as e:
        return json_response(500, {"error": "internal_error", "detail": str(e)})
    return json_response(200, {"projectId": project_id})
