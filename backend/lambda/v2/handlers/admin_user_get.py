import json
import os
import boto3
from ..helpers.auth import get_user, require_admin, AuthError
from ..helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')
LEDGER_TABLE = os.environ.get('CREDIT_LEDGER_TABLE_NAME', '')
PROJECTS_TABLE = os.environ.get('PROJECTS_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
        require_admin(claims)
    except AuthError:
        return json_response(403, {"error": "forbidden"})
    user_id = event.get('pathParameters', {}).get('id')
    resp = _dynamodb.get_item(TableName=USERS_TABLE, Key={'userId': {'S': user_id}})
    item = resp.get('Item')
    if not item:
        return json_response(404, {"error": "not found"})
    stats = {}
    if 'stats' in item:
        for k, v in item['stats']['M'].items():
            stats[k] = int(v['N'])
    user = {
        'userId': item['userId']['S'],
        'email': item.get('email', {}).get('S', ''),
        'credits': int(item.get('credits', {'N': '0'})['N']),
        'stats': stats,
    }
    # Last N ledger entries by time
    ledger = _dynamodb.query(
        TableName=LEDGER_TABLE,
        IndexName='GSI_LedgerByTime',
        KeyConditionExpression='userId = :u',
        ExpressionAttributeValues={':u': {'S': user_id}},
        ScanIndexForward=False,
        Limit=25,
    )
    user['ledger'] = [
        {
            'txId': i['txId']['S'],
            'type': i['type']['S'],
            'amount': int(i['amount']['N']),
            'reason': i.get('reason', {}).get('S', ''),
            'ts': int(i.get('ts', {'N': '0'})['N'])
        } for i in ledger.get('Items', [])
    ]
    # Last N projects
    projects = _dynamodb.query(
        TableName=PROJECTS_TABLE,
        IndexName='GSI_ProjectsByUser',
        KeyConditionExpression='userId = :u',
        ExpressionAttributeValues={':u': {'S': user_id}},
        ScanIndexForward=False,
        Limit=25,
    )
    user['projects'] = [
        {
            'projectId': i['projectId']['S'],
            'title': i.get('title', {}).get('S', ''),
            'createdAt': int(i.get('createdAt', {'N': '0'})['N'])
        } for i in projects.get('Items', [])
    ]
    return json_response(200, user)
