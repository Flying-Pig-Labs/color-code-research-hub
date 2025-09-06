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
IDEATIONS_TABLE = os.environ.get('IDEATIONS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    ensure_user_exists(claims)
    user_id = claims.get('sub')
    project_id = event.get('pathParameters', {}).get('projectId')
    body = json.loads(event.get('body') or '{}')
    report_id = body.get('reportId')
    if not project_id or not report_id:
        return json_response(422, {"error": "projectId and reportId required"})
    # Verify referenced report belongs to user and project
    reports_table = os.environ.get('REPORTS_TABLE_NAME', '')
    report_item = _dynamodb.get_item(TableName=reports_table, Key={'reportId': {'S': report_id}}).get('Item')
    if not report_item or report_item.get('userId', {}).get('S') != user_id or report_item.get('projectId', {}).get('S') != project_id:
        return json_response(403, {"error": "forbidden"})

    tx_id = event.get('headers', {}).get('Idempotency-Key', str(uuid.uuid4()))
    try:
        atomic_debit(user_id, tx_id, 'ideation', 'ideationCount')
    except DebitError:
        return json_response(402, {"error": "insufficient credits"})
    ideation_id = str(uuid.uuid4())
    ts = int(time.time() * 1000)
    _dynamodb.put_item(
        TableName=IDEATIONS_TABLE,
        Item={
            'ideationId': {'S': ideation_id},
            'projectId': {'S': project_id},
            'userId': {'S': user_id},
            'reportId': {'S': report_id},
            'status': {'S': 'pending'},
            'startedAt': {'N': str(ts)}
        }
    )
    return json_response(200, {"ideationId": ideation_id, "txId": tx_id})
