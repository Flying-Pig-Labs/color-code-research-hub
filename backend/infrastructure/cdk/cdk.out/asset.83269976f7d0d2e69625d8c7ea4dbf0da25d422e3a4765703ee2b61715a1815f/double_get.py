import json
import os
import boto3
from ..helpers.auth import get_user, AuthError

_dynamodb = boto3.client('dynamodb')
_s3 = boto3.client('s3')
DOUBLES_TABLE = os.environ.get('DOUBLES_TABLE_NAME', '')
ARTIFACTS_BUCKET = os.environ.get('ARTIFACTS_BUCKET_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}
    double_id = event.get('pathParameters', {}).get('doubleId')
    resp = _dynamodb.get_item(TableName=DOUBLES_TABLE, Key={'doubleId': {'S': double_id}})
    item = resp.get('Item')
    if not item or item.get('userId', {}).get('S') != claims.get('sub'):
        return {"statusCode": 404, "body": json.dumps({"error": "not found"})}
    result = {
        'doubleId': double_id,
        'status': item.get('status', {}).get('S', 'pending')
    }
    pdf_key = item.get('finalPdfS3Key', {}).get('S')
    zip_key = item.get('finalZipS3Key', {}).get('S')
    if result['status'] == 'done':
        if pdf_key:
            result['finalPdfUrl'] = _s3.generate_presigned_url('get_object', Params={'Bucket': ARTIFACTS_BUCKET, 'Key': pdf_key}, ExpiresIn=300)
        if zip_key:
            result['zipUrl'] = _s3.generate_presigned_url('get_object', Params={'Bucket': ARTIFACTS_BUCKET, 'Key': zip_key}, ExpiresIn=300)
    return {"statusCode": 200, "body": json.dumps(result)}
