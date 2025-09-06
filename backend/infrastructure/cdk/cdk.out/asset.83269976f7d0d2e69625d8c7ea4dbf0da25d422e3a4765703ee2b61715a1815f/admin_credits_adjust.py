import json
import os
import time
import uuid
import boto3
from ..helpers.auth import get_user, require_admin, AuthError

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')
LEDGER_TABLE = os.environ.get('CREDIT_LEDGER_TABLE_NAME', '')


def handler(event, context):
    try:
        claims = get_user(event)
        require_admin(claims)
    except AuthError:
        return {"statusCode": 403, "body": json.dumps({"error": "forbidden"})}
    body = json.loads(event.get('body') or '{}')
    user_id = body.get('userId')
    delta = body.get('delta')
    note = body.get('note', '')
    if user_id is None or delta not in (-1, 1):
        return {"statusCode": 422, "body": json.dumps({"error": "invalid request"})}
    tx_id = f"ADJ_{uuid.uuid4()}"
    ts = int(time.time() * 1000)
    if delta > 0:
        update_expr = 'SET credits = credits + :one'
        cond_expr = 'attribute_exists(userId)'
        ledger_type = 'credit'
    else:
        update_expr = 'SET credits = credits - :one'
        cond_expr = 'credits >= :one'
        ledger_type = 'debit'
    _dynamodb.transact_write_items(
        TransactItems=[
            {
                'Update': {
                    'TableName': USERS_TABLE,
                    'Key': {'userId': {'S': user_id}},
                    'UpdateExpression': update_expr,
                    'ConditionExpression': cond_expr,
                    'ExpressionAttributeValues': {':one': {'N': '1'}},
                }
            },
            {
                'Put': {
                    'TableName': LEDGER_TABLE,
                    'Item': {
                        'userId': {'S': user_id},
                        'txId': {'S': tx_id},
                        'type': {'S': ledger_type},
                        'amount': {'N': '1'},
                        'reason': {'S': f'manual_adjust:{note}'},
                        'ts': {'N': str(ts)},
                        'meta': {
                            'M': {
                                'adminActor': {'S': claims.get('sub', '')}
                            }
                        }
                    },
                    'ConditionExpression': 'attribute_not_exists(txId)'
                }
            }
        ]
    )
    return {"statusCode": 200, "body": json.dumps({'txId': tx_id})}
