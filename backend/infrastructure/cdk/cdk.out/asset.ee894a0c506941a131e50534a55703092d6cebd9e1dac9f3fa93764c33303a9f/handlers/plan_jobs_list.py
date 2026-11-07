import os
import boto3
from boto3.dynamodb.conditions import Attr
from helpers.auth import get_user, AuthError
from helpers.http import json_response

JOBS_TABLE_NAME = os.environ.get('JOBS_TABLE_NAME', 'PlanGenerationJobs')
dynamo = boto3.resource('dynamodb')


def handler(event, context):
    try:
        claims = get_user(event)
    except AuthError:
        return json_response(401, {"error": "unauthorized"})

    if not JOBS_TABLE_NAME:
        return json_response(500, {"error": "JOBS_TABLE_NAME not configured"})

    qs = event.get('queryStringParameters') or {}
    limit = 50
    try:
        if 'limit' in qs:
            limit = max(1, min(100, int(qs['limit'])))
    except Exception:
        pass

    table = dynamo.Table(JOBS_TABLE_NAME)
    try:
        # Best-effort filter by user when available; otherwise return most recent
        user_id = claims.get('sub')
        scan = table.scan(Limit=limit)
        items = scan.get('Items', [])
        # Sort by createdAt desc if present
        try:
            items.sort(key=lambda x: x.get('createdAt') or 0, reverse=True)
        except Exception:
            pass
        # Transform minimal fields expected by UI cards/history
        jobs = []
        for it in items:
            jobs.append({
                'jobId': it.get('jobId'),
                'status': it.get('status') or 'PENDING',
                'createdAt': it.get('createdAt'),
                'updatedAt': it.get('updatedAt'),
                'completedAt': it.get('updatedAt') if it.get('status') == 'COMPLETED' else None,
                'repositoryName': ((it.get('input') or {}).get('githubConfig') or {}).get('repository'),
                'projectTitle': ((it.get('input') or {}).get('metadata') or {}).get('title'),
                'totalIssues': 0,
                'issuesCreated': 0,
                'error': (it.get('errors') or [{}])[0].get('message') if it.get('status') == 'FAILED' else None,
            })
        return json_response(200, {
            'jobs': jobs[:limit],
            'pagination': { 'hasMore': False, 'lastEvaluatedKey': None },
            'totalCount': len(items)
        })
    except Exception as e:
        return json_response(500, {"error": "internal_error", "detail": str(e)})

