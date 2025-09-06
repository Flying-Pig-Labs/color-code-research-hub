import json
import os
import time
import uuid
import boto3
from ..helpers.auth import get_user, AuthError
from ..helpers.credits import atomic_debit, DebitError

_dynamodb = boto3.client('dynamodb')
IDEATIONS_TABLE = os.environ.get('IDEATIONS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}
    user_id = claims.get('sub')
    project_id = event.get('pathParameters', {}).get('projectId')
    body = json.loads(event.get('body') or '{}')
    report_id = body.get('reportId')
    if not project_id or not report_id:
        return {"statusCode": 422, "body": json.dumps({"error": "projectId and reportId required"})}
    tx_id = event.get('headers', {}).get('Idempotency-Key', str(uuid.uuid4()))
    try:
        atomic_debit(user_id, tx_id, 'ideation', 'ideationCount')
    except DebitError:
        return {"statusCode": 402, "body": json.dumps({"error": "insufficient credits"})}
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
    return {"statusCode": 200, "body": json.dumps({"ideationId": ideation_id, "txId": tx_id})}
