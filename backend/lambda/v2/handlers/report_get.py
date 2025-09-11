import json
import os
import boto3
from botocore.exceptions import ClientError
from helpers.auth import get_user, AuthError
from helpers.http import json_response
from utils.user_mapping import get_authenticated_username_with_mapping

_dynamo_res = boto3.resource('dynamodb')
_s3 = boto3.client('s3')

# Prefer legacy ResearchReports table for content, fall back to Reports if needed
RESEARCH_REPORTS_TABLE = os.environ.get('RESEARCH_REPORTS_TABLE', 'ResearchReports')
REPORTS_TABLE = os.environ.get('REPORTS_TABLE_NAME', '')
ARTIFACTS_BUCKET = os.environ.get('ARTIFACTS_BUCKET_NAME', '')
RESEARCH_BUCKET = os.environ.get('RESEARCH_BUCKET', '')


def _get_report_item(report_id: str):
    """Fetch report item from ResearchReports, falling back to Reports."""
    # Try ResearchReports by reportId
    table = _dynamo_res.Table(RESEARCH_REPORTS_TABLE)
    try:
        resp = table.get_item(Key={'reportId': report_id})
        item = resp.get('Item')
    except ClientError:
        item = None

    # Fallback: try by id key
    if not item:
        try:
            resp = table.get_item(Key={'id': report_id})
            item = resp.get('Item')
        except ClientError:
            item = None

    # Final fallback: v2 Reports table
    if not item and REPORTS_TABLE:
        v2 = _dynamo_res.Table(REPORTS_TABLE)
        try:
            resp = v2.get_item(Key={'reportId': report_id})
            item = resp.get('Item')
        except ClientError:
            item = None

    return item


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
    s3_key = item.get('s3Key') or item.get('reportS3Key')
    summary = item.get('contentSummary') or item.get('processedSummary') or item.get('summary', '')
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

    # Load content: prefer S3 longform markdown, fallback to processed summary
    content = ''
    if s3_key:
        try:
            # Choose bucket: use research bucket for legacy ResearchReports items
            bucket = None
            if item.get('username') or item.get('s3Files') or item.get('s3BasePath') or item.get('team'):
                bucket = RESEARCH_BUCKET or ARTIFACTS_BUCKET
            else:
                bucket = ARTIFACTS_BUCKET or RESEARCH_BUCKET
            obj = _s3.get_object(Bucket=bucket, Key=s3_key)
            body = obj.get('Body')
            if body:
                content = body.read().decode('utf-8', errors='replace')
        except Exception as e:
            # Log and continue to fallback
            print(f"S3 get_object failed for {bucket}/{s3_key}: {e}")

    if not content:
        content = summary or '# Report In Progress\nThe longform content is not available yet.'

    return json_response(200, {
        'content': content,
        'metadata': metadata,
    })
