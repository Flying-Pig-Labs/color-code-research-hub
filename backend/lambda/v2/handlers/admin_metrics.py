import json
import os
import boto3
from helpers.auth import get_user, require_admin, AuthError
from helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')
LEDGER_TABLE = os.environ.get('CREDIT_LEDGER_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
        require_admin(claims)
    except AuthError:
        return json_response(403, {"error": "forbidden"})
    users_resp = _dynamodb.scan(TableName=USERS_TABLE, Select='COUNT')
    users_count = users_resp.get('Count', 0)
    ledger_resp = _dynamodb.scan(TableName=LEDGER_TABLE, ProjectionExpression='amount, #t', ExpressionAttributeNames={'#t': 'type'})
    purchased = sum(int(i['amount']['N']) for i in ledger_resp.get('Items', []) if i['type']['S'] == 'credit')
    spent = sum(int(i['amount']['N']) for i in ledger_resp.get('Items', []) if i['type']['S'] == 'debit')
    metrics = {
        'totalUsers': users_count,
        'creditsPurchased': purchased,
        'creditsSpent': spent,
    }
    return json_response(200, {'metrics': metrics})
