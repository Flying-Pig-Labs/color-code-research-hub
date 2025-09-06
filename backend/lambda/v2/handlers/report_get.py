import json
import os
import boto3
from ..helpers.auth import get_user, AuthError

_dynamodb = boto3.client('dynamodb')
_s3 = boto3.client('s3')
REPORTS_TABLE = os.environ.get('REPORTS_TABLE_NAME', '')
ARTIFACTS_BUCKET = os.environ.get('ARTIFACTS_BUCKET_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}
    report_id = event.get('pathParameters', {}).get('reportId')
    resp = _dynamodb.get_item(TableName=REPORTS_TABLE, Key={'reportId': {'S': report_id}})
    item = resp.get('Item')
    if not item or item.get('userId', {}).get('S') != claims.get('sub'):
        return {"statusCode": 404, "body": json.dumps({"error": "not found"})}
    result = {
        'reportId': report_id,
        'status': item.get('status', {}).get('S', 'pending')
    }
    key = item.get('reportS3Key', {}).get('S')
    if key and result['status'] == 'done':
        url = _s3.generate_presigned_url('get_object', Params={'Bucket': ARTIFACTS_BUCKET, 'Key': key}, ExpiresIn=300)
        result['reportUrl'] = url
    return {"statusCode": 200, "body": json.dumps(result)}
