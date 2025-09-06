import json
import os
import time
import uuid
import boto3
from ..helpers.auth import get_user, AuthError
from ..helpers.users import ensure_user_exists
from ..helpers.http import json_response
from ..helpers.credits import atomic_debit, DebitError

_dynamodb = boto3.client('dynamodb')
DOUBLES_TABLE = os.environ.get('DOUBLES_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    ensure_user_exists(claims)
    user_id = claims.get('sub')
    project_id = event.get('pathParameters', {}).get('projectId')
    body = json.loads(event.get('body') or '{}')
    ideation_id = body.get('ideationId')
    idea_id = body.get('ideaId')
    feedback = body.get('feedback', '')
    if not project_id or not ideation_id or not idea_id:
        return json_response(422, {"error": "missing parameters"})
    # Verify referenced ideation belongs to user and project
    ideations_table = os.environ.get('IDEATIONS_TABLE_NAME', '')
    ideation_item = _dynamodb.get_item(TableName=ideations_table, Key={'ideationId': {'S': ideation_id}}).get('Item')
    if not ideation_item or ideation_item.get('userId', {}).get('S') != user_id or ideation_item.get('projectId', {}).get('S') != project_id:
        return json_response(403, {"error": "forbidden"})

    tx_id = event.get('headers', {}).get('Idempotency-Key', str(uuid.uuid4()))
    try:
        atomic_debit(user_id, tx_id, 'double_down', 'doubleDownCount')
    except DebitError:
        return json_response(402, {"error": "insufficient credits"})
    double_id = str(uuid.uuid4())
    ts = int(time.time() * 1000)
    _dynamodb.put_item(
        TableName=DOUBLES_TABLE,
        Item={
            'doubleId': {'S': double_id},
            'projectId': {'S': project_id},
            'userId': {'S': user_id},
            'ideationId': {'S': ideation_id},
            'ideaId': {'S': idea_id},
            'feedback': {'S': feedback},
            'status': {'S': 'pending'},
            'startedAt': {'N': str(ts)}
        }
    )
    return json_response(200, {"doubleId": double_id, "txId": tx_id})
