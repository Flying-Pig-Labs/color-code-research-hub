import json
import os
import time
import uuid
import boto3
import io
import zipfile
from helpers.auth import get_user, AuthError
from helpers.users import ensure_user_exists
from helpers.http import json_response
from helpers.credits import atomic_debit, DebitError

_dynamodb = boto3.client('dynamodb')
DOUBLES_TABLE = os.environ.get('DOUBLES_TABLE_NAME', '')
_s3 = boto3.client('s3')
RESEARCH_BUCKET = os.environ.get('RESEARCH_BUCKET', '')


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
    ideations_table = os.environ.get('PIPELINE_BATCH_JOBS_TABLE', '')
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

    # Create a provisional ZIP package with placeholders
    try:
        if RESEARCH_BUCKET:
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
                zf.writestr('readme_filing_steps.md', (
                    "# Provisional Filing Steps\n\n"
                    "These are placeholder steps. Replace with real guidance.\n\n"
                    "1. Review final.pdf (to be generated).\n"
                    "2. Prepare SB/16 cover sheet.\n"
                    "3. Generate drawings and attach.\n"
                    "4. File via USPTO Patent Center.\n"
                ))
                zf.writestr('sb16.pdf', 'Placeholder for SB/16 cover sheet PDF.')
                zf.writestr('drawings.pdf', 'Placeholder for drawings PDF.')
            buf.seek(0)
            key = f"u/{user_id}/p/{project_id}/double/{double_id}/provisional_package.zip"
            _s3.put_object(Bucket=RESEARCH_BUCKET, Key=key, Body=buf.getvalue(), ContentType='application/zip')
            _dynamodb.update_item(
                TableName=DOUBLES_TABLE,
                Key={'doubleId': {'S': double_id}},
                UpdateExpression='SET #s = :done, completedAt = :ca, finalZipS3Key = :k',
                ExpressionAttributeNames={'#s': 'status'},
                ExpressionAttributeValues={
                    ':done': {'S': 'done'},
                    ':ca': {'N': str(int(time.time() * 1000))},
                    ':k': {'S': key}
                }
            )
    except Exception as e:
        print(f"double_start: failed to write provisional ZIP: {e}")

    # Generate a basic final.pdf synchronously via Node generator
    try:
        import json as _json
        import boto3 as _boto3
        _lambda = _boto3.client('lambda')
        payload = {
            'kind': 'double',
            'userId': user_id,
            'projectId': project_id,
            'doubleId': double_id,
            'paragraphs': ['This is an automatically generated final deliverable.']
        }
        # Forward markdown options if provided
        if 'markdownUrl' in body:
            payload['markdownUrl'] = body.get('markdownUrl')
        if 'markdown' in body:
            payload['markdown'] = body.get('markdown')
        resp = _lambda.invoke(FunctionName='V2GeneratePdfFunction', InvocationType='RequestResponse', Payload=_json.dumps(payload).encode('utf-8'))
        body = _json.loads(resp.get('Payload').read().decode('utf-8'))
        key = _json.loads(body.get('body', '{}')).get('key') if isinstance(body.get('body'), str) else body.get('key')
        if key:
            _dynamodb.update_item(
                TableName=DOUBLES_TABLE,
                Key={'doubleId': {'S': double_id}},
                UpdateExpression='SET finalPdfS3Key = :k',
                ExpressionAttributeValues={':k': {'S': key}}
            )
    except Exception as e:
        print(f'double_start: PDF generation failed: {e}')

    return json_response(200, {"doubleId": double_id, "txId": tx_id})
