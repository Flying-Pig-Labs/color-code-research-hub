"""
Start Plan Generation (CDK-native) without CORS issues.

Route: POST /api/plan/async/start
Behavior:
- Creates a job record in DynamoDB (PlanGenerationJobs)
- Resolves the SAM PlanOrchestrator function ARN via CloudFormation exports
- Asynchronously invokes the orchestrator with the input
- Returns 202 with jobId and statusUrl
"""
import os
import json
import time
import boto3
from helpers.http import json_response

JOBS_TABLE_NAME = os.environ.get('JOBS_TABLE_NAME', 'PlanGenerationJobs')
ORCHESTRATOR_ARN = os.environ.get('ORCHESTRATOR_ARN', '')

dynamo = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')
cf = boto3.client('cloudformation')


def _cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Accept',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Content-Type': 'application/json',
    }


def _generate_job_id() -> str:
    ts = int(time.time() * 1000)
    rand = format(int(time.time() * 1000000) ^ hash(os.urandom(8)), 'x')[-9:]
    return f"job-{format(ts, 'x')}-{rand}"


def _resolve_orchestrator_arn() -> str:
    if ORCHESTRATOR_ARN:
        return ORCHESTRATOR_ARN
    # Discover via CloudFormation exports (looks for *-OrchestratorFunction)
    try:
        paginator = cf.get_paginator('list_exports')
        for page in paginator.paginate():
            for exp in page.get('Exports', []):
                name = exp.get('Name') or ''
                if name.endswith('-OrchestratorFunction') or 'OrchestratorFunction' in name:
                    val = exp.get('Value') or ''
                    if val:
                        return val
    except Exception:
        pass
    raise RuntimeError('Unable to resolve Plan Orchestrator function ARN')


def handler(event, context):
    # Preflight
    if (event.get('httpMethod') or event.get('requestContext', {}).get('httpMethod')) == 'OPTIONS':
        return { 'statusCode': 200, 'headers': _cors_headers(), 'body': '' }

    # Parse body
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        return { 'statusCode': 400, 'headers': _cors_headers(), 'body': json.dumps({ 'error': 'invalid_json' }) }

    try:
        job_id = _generate_job_id()
        ts_iso = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime())
        ttl = int(time.time()) + 24 * 60 * 60
        input_obj = {
            'projectDescription': body.get('projectDescription') or body.get('metadata', {}).get('description'),
            'selectedTeams': body.get('selectedTeams'),
            'teamFields': body.get('teamFields'),
            'githubConfig': body.get('githubConfig'),
            'metadata': body.get('metadata'),
            'readmeContent': body.get('readmeContent'),
        }
        item = {
            'jobId': job_id,
            'status': 'INITIATED',
            'createdAt': ts_iso,
            'updatedAt': ts_iso,
            'ttl': ttl,
            'input': input_obj,
            'stages': {
                'parseReadme': { 'status': 'pending', 'startedAt': None, 'completedAt': None },
                'populateForm': { 'status': 'pending', 'startedAt': None, 'completedAt': None },
                'generatePhases': { 'status': 'pending', 'startedAt': None, 'completedAt': None },
                'createGitHubIssues': { 'status': 'pending', 'startedAt': None, 'completedAt': None },
            },
            'results': {},
            'errors': [],
        }

        # Write job record
        table = dynamo.Table(JOBS_TABLE_NAME)
        table.put_item(Item=item)

        # Resolve orchestrator and invoke async
        arn = _resolve_orchestrator_arn()
        payload = json.dumps({ 'jobId': job_id, 'input': input_obj }).encode('utf-8')
        lambda_client.invoke(FunctionName=arn, InvocationType='Event', Payload=payload)

        return {
            'statusCode': 202,
            'headers': _cors_headers(),
            'body': json.dumps({
                'jobId': job_id,
                'status': 'INITIATED',
                'message': 'Plan generation job started successfully',
                'statusUrl': f"/api/plan/async/status/{job_id}",
            }),
        }
    except Exception as e:
        return { 'statusCode': 500, 'headers': _cors_headers(), 'body': json.dumps({ 'error': 'start_failed', 'detail': str(e) }) }

