import json
import os
import time
import uuid
import boto3
from helpers.auth import get_user, AuthError
from helpers.users import ensure_user_exists
from helpers.http import json_response
from helpers.credits import atomic_debit, DebitError
_s3 = boto3.client('s3')
ARTIFACTS_BUCKET = os.environ.get('ARTIFACTS_BUCKET_NAME', '')

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

    # Create minimal ideas.json immediately for a successful artifact URL
    try:
        if ARTIFACTS_BUCKET:
            ideas = []
            for i in range(1, 11):
                ideas.append({
                    "ideaId": f"i-{i:02d}",
                    "title": f"Idea #{i}",
                    "summary": "Initial placeholder summary.",
                    "rank": i,
                    "review": {"score": 0.0, "rationale": "", "marketSignals": []}
                })
            payload = {
                "ideationId": ideation_id,
                "projectId": project_id,
                "userId": user_id,
                "ideas": ideas,
                "generatedAt": ts
            }
            key = f"u/{user_id}/p/{project_id}/ideation/{ideation_id}/ideas.json"
            _s3.put_object(Bucket=ARTIFACTS_BUCKET, Key=key, Body=json.dumps(payload).encode('utf-8'), ContentType='application/json')
            _dynamodb.update_item(
                TableName=IDEATIONS_TABLE,
                Key={'ideationId': {'S': ideation_id}},
                UpdateExpression='SET #s = :done, completedAt = :ca, ideasJsonS3Key = :k',
                ExpressionAttributeNames={'#s': 'status'},
                ExpressionAttributeValues={
                    ':done': {'S': 'done'},
                    ':ca': {'N': str(int(time.time() * 1000))},
                    ':k': {'S': key}
                }
            )
    except Exception as e:
        # Keep request successful; GET will remain pending until later processing
        print(f"ideation_start: failed to write ideas.json: {e}")

    return json_response(200, {"ideationId": ideation_id, "txId": tx_id})
