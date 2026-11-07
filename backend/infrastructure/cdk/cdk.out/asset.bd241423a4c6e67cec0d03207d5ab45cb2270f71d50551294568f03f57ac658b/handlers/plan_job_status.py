import os
import boto3
from helpers.auth import get_user, AuthError
from helpers.http import json_response

JOBS_TABLE_NAME = os.environ.get('JOBS_TABLE_NAME', 'PlanGenerationJobs')
dynamo = boto3.resource('dynamodb')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})

    params = event.get('pathParameters') or {}
    job_id = params.get('jobId')
    if not job_id:
        return json_response(400, {"error": "jobId required"})
    if not JOBS_TABLE_NAME:
        return json_response(500, {"error": "JOBS_TABLE_NAME not configured"})

    table = dynamo.Table(JOBS_TABLE_NAME)
    try:
        resp = table.get_item(Key={'jobId': job_id})
        item = resp.get('Item')
        if not item:
            return json_response(404, {"error": "not_found"})
        # Return minimal status payload expected by JobRunner
        return json_response(200, {
            'jobId': item.get('jobId'),
            'status': item.get('status') or 'PENDING',
            'createdAt': item.get('createdAt'),
            'startedAt': item.get('startedAt'),
            'completedAt': item.get('updatedAt') if item.get('status') == 'COMPLETED' else None,
            'error': (item.get('errors') or [{}])[0].get('message') if item.get('status') == 'FAILED' else None,
            'result': item.get('results') or {},
        })
    except Exception as e:
        return json_response(500, {"error": "internal_error", "detail": str(e)})

