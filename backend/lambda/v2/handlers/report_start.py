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
REPORTS_TABLE = os.environ.get('REPORTS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    # Ensure user exists and validate project ownership
    ensure_user_exists(claims)
    user_id = claims.get('sub')
    project_id = event.get('pathParameters', {}).get('projectId')
    if not project_id:
        return json_response(400, {"error": "projectId required"})
    proj_table = os.environ.get('PROJECTS_TABLE_NAME', '')
    proj = _dynamodb.get_item(TableName=proj_table, Key={'projectId': {'S': project_id}}).get('Item')
    if not proj or proj.get('userId', {}).get('S') != user_id:
        return json_response(403, {"error": "forbidden"})
    tx_id = event.get('headers', {}).get('Idempotency-Key', str(uuid.uuid4()))
    try:
        atomic_debit(user_id, tx_id, 'report', 'reportCount')
    except DebitError:
        return json_response(402, {"error": "insufficient credits"})
    report_id = str(uuid.uuid4())
    ts = int(time.time() * 1000)
    _dynamodb.put_item(
        TableName=REPORTS_TABLE,
        Item={
            'reportId': {'S': report_id},
            'projectId': {'S': project_id},
            'userId': {'S': user_id},
            'status': {'S': 'pending'},
            'startedAt': {'N': str(ts)}
        }
    )
    return json_response(200, {"reportId": report_id, "txId": tx_id})
