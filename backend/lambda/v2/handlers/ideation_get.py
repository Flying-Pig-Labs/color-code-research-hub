import json
import os
import boto3
from helpers.auth import get_user, AuthError
from helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
_s3 = boto3.client('s3')
IDEATIONS_TABLE = os.environ.get('IDEATIONS_TABLE_NAME', '')
ARTIFACTS_BUCKET = os.environ.get('ARTIFACTS_BUCKET_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})
    ideation_id = event.get('pathParameters', {}).get('ideationId')
    resp = _dynamodb.get_item(TableName=IDEATIONS_TABLE, Key={'ideationId': {'S': ideation_id}})
    item = resp.get('Item')
    if not item or item.get('userId', {}).get('S') != claims.get('sub'):
        return json_response(404, {"error": "not found"})
    result = {
        'ideationId': ideation_id,
        'status': item.get('status', {}).get('S', 'pending')
    }
    key = item.get('ideasJsonS3Key', {}).get('S')
    if key and result['status'] == 'done':
        url = _s3.generate_presigned_url('get_object', Params={'Bucket': ARTIFACTS_BUCKET, 'Key': key}, ExpiresIn=300)
        result['ideasUrl'] = url
    return json_response(200, result)
