import json
import os
import boto3
from botocore.exceptions import ClientError
from helpers.auth import get_user, AuthError
from helpers.http import json_response
from utils.user_mapping import get_authenticated_username_with_mapping

_dynamo_res = boto3.resource('dynamodb')
_s3 = boto3.client('s3')

# Canonical source for research reports
RESEARCH_REPORTS_TABLE = os.environ.get('RESEARCH_REPORTS_TABLE', 'ResearchReports')
ARTIFACTS_BUCKET = os.environ.get('ARTIFACTS_BUCKET_NAME', '')
RESEARCH_BUCKET = os.environ.get('RESEARCH_BUCKET', '')


def _get_report_item(report_id: str):
    """Fetch report item from ResearchReports by reportId only."""
    table = _dynamo_res.Table(RESEARCH_REPORTS_TABLE)
    resp = table.get_item(Key={'reportId': report_id})
    return resp.get('Item')


def handler(event, context):
    # Authn: ensure caller is authenticated
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})

    report_id = (event.get('pathParameters') or {}).get('reportId')
    if not report_id:
        return json_response(400, {"error": "reportId required"})

    item = _get_report_item(report_id)
    if not item:
        return json_response(404, {"error": "not found"})

    # Authz: require ownership
    username = get_authenticated_username_with_mapping(event)
    owner_username = item.get('username') or item.get('userEmail')
    owner_sub = item.get('userId')
    if not (
        (owner_sub and owner_sub == claims.get('sub')) or
        (owner_username and username and owner_username == username)
    ):
        return json_response(404, {"error": "not found"})

    # Build metadata
    s3_key = item.get('s3ReportKey') or item.get('s3Key')
    summary = item.get('processedSummary') or item.get('summary', '')
    metadata = {
        'title': item.get('title') or f'Report {report_id}',
        'summary': summary or '',
        'team': item.get('team') or 'white',
        'createdAt': item.get('timestamp') or item.get('createdAt'),
        'reportId': report_id,
        's3Key': s3_key or '',
        'requestId': item.get('requestId', report_id),
        'contentSummary': summary or '',
    }

    # Validate required configuration
    if not RESEARCH_BUCKET:
        return json_response(500, {"error": "config_error", "detail": "RESEARCH_BUCKET not configured"})

    # Validate S3 key presence
    if not s3_key:
        return json_response(404, {"error": "artifact_key_missing", "detail": "Report has no S3 key"})

    # Load longform content from S3
    try:
        obj = _s3.get_object(Bucket=RESEARCH_BUCKET, Key=s3_key)
        body = obj.get('Body')
        if not body:
            return json_response(404, {"error": "artifact_missing", "detail": "Empty S3 object"})
        content = body.read().decode('utf-8', errors='replace')
        return json_response(200, {
            'content': content,
            'metadata': metadata,
        })
    except _s3.exceptions.NoSuchKey:
        return json_response(404, {"error": "artifact_missing", "detail": "S3 key not found"})
    except Exception as e:
        return json_response(500, {"error": "artifact_read_failed", "detail": str(e)})
