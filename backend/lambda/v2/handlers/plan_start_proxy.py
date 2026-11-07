"""
Proxy for Plan Generation start to the SAM Plan API to fix CORS.

Route: POST /api/plan/async/start (CDK API)
Env: PLAN_API_BASE_URL must point to the SAM API base (e.g., https://<id>.execute-api.us-east-1.amazonaws.com/production)
"""
import os
import json
import urllib.request
from helpers.http import json_response

PLAN_API_BASE_URL = os.environ.get('PLAN_API_BASE_URL', '').rstrip('/')


def _cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Accept',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Content-Type': 'application/json',
    }


def handler(event, context):
    # Preflight support
    if (event.get('httpMethod') or event.get('requestContext', {}).get('httpMethod')) == 'OPTIONS':
        return { 'statusCode': 200, 'headers': _cors_headers(), 'body': '' }

    if not PLAN_API_BASE_URL:
        return { 'statusCode': 500, 'headers': _cors_headers(), 'body': json.dumps({ 'error': 'PLAN_API_BASE_URL not configured' }) }

    try:
        body = event.get('body') or '{}'
        # Forward request to SAM API
        url = f"{PLAN_API_BASE_URL}/api/plan/async/start"
        req = urllib.request.Request(url, data=body.encode('utf-8'), method='POST')
        req.add_header('Content-Type', 'application/json')
        # Note: We do not forward Authorization; SAM start endpoint should be configured to accept this call. If needed, add a service token here.
        with urllib.request.urlopen(req, timeout=30) as res:
            payload = res.read().decode('utf-8')
            return {
                'statusCode': res.status,
                'headers': _cors_headers(),
                'body': payload,
            }
    except Exception as e:
        return { 'statusCode': 500, 'headers': _cors_headers(), 'body': json.dumps({ 'error': 'proxy_failed', 'detail': str(e) }) }

