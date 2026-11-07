import json
import os
import time
import uuid

import boto3

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')
LEDGER_TABLE = os.environ.get('CREDIT_LEDGER_TABLE_NAME', '')
WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')


def handler(event, context):
    signature = event.get('headers', {}).get('Stripe-Signature')
    if WEBHOOK_SECRET and signature != WEBHOOK_SECRET:
        return {"statusCode": 401, "body": json.dumps({"error": "invalid signature"})}

    body = json.loads(event.get('body') or '{}')
    user_id = body.get('userId')
    quantity = int(body.get('quantity', 0))
    if not user_id or quantity <= 0:
        return {"statusCode": 400, "body": json.dumps({"error": "invalid payload"})}

    tx_id = body.get('id', f"STRIPE_{uuid.uuid4()}")
    ts = int(time.time() * 1000)

    _dynamodb.transact_write_items(
        TransactItems=[
            {
                'Update': {
                    'TableName': USERS_TABLE,
                    'Key': {'userId': {'S': user_id}},
                    'UpdateExpression': 'SET credits = credits + :q',
                    'ExpressionAttributeValues': {':q': {'N': str(quantity)}}
                }
            },
            {
                'Put': {
                    'TableName': LEDGER_TABLE,
                    'Item': {
                        'userId': {'S': user_id},
                        'txId': {'S': tx_id},
                        'type': {'S': 'credit'},
                        'amount': {'N': str(quantity)},
                        'reason': {'S': 'stripe'},
                        'ts': {'N': str(ts)},
                    },
                    'ConditionExpression': 'attribute_not_exists(txId)'
                }
            }
        ]
    )

    return {"statusCode": 200, "body": json.dumps({'received': True})}

