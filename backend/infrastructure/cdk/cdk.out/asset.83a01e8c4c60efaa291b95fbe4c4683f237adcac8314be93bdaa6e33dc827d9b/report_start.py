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
    body = json.loads(event.get('body') or '{}')
    markdown_url = body.get('markdownUrl')
    markdown_str = body.get('markdown')
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
    # Generate a basic PDF synchronously via Node generator
    try:
        import json as _json
        import boto3 as _boto3
        _lambda = _boto3.client('lambda')
        payload = {
            'kind': 'report',
            'userId': user_id,
            'projectId': project_id,
            'reportId': report_id,
            'paragraphs': ['This is an automatically generated report PDF.']
        }
        if markdown_url:
            payload['markdownUrl'] = markdown_url
        if markdown_str:
            payload['markdown'] = markdown_str
        resp = _lambda.invoke(FunctionName='V2GeneratePdfFunction', InvocationType='RequestResponse', Payload=_json.dumps(payload).encode('utf-8'))
        body = _json.loads(resp.get('Payload').read().decode('utf-8'))
        key = _json.loads(body.get('body', '{}')).get('key') if isinstance(body.get('body'), str) else body.get('key')
        if key:
            _dynamodb.update_item(
                TableName=REPORTS_TABLE,
                Key={'reportId': {'S': report_id}},
                UpdateExpression='SET #s=:done, completedAt=:ca, reportS3Key=:k',
                ExpressionAttributeNames={'#s': 'status'},
                ExpressionAttributeValues={':done': {'S': 'done'}, ':ca': {'N': str(int(time.time()*1000))}, ':k': {'S': key}}
            )
    except Exception as e:
        print(f'report_start: PDF generation failed: {e}')

    return json_response(200, {"reportId": report_id, "txId": tx_id})
