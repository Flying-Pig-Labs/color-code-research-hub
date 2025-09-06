import json
import os
import time
import uuid
import boto3
from ..helpers.auth import get_user, AuthError
from ..helpers.users import ensure_user_exists

_dynamodb = boto3.client('dynamodb')
PROJECTS_TABLE = os.environ.get('PROJECTS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}

    # Ensure user row exists (first login)
    ensure_user_exists(claims)
    body = json.loads(event.get('body') or '{}')
    title = body.get('title')
    if not title:
        return {"statusCode": 422, "body": json.dumps({"error": "title required"})}
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

    _dynamodb.put_item(TableName=PROJECTS_TABLE, Item=item)
    return {"statusCode": 200, "body": json.dumps({"projectId": project_id})}
