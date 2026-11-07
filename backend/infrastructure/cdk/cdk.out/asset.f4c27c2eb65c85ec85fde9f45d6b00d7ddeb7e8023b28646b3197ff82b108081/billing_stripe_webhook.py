import json
import os
import time
import uuid
import hmac
import hashlib

import boto3
from ..helpers.http import json_response

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', '')
LEDGER_TABLE = os.environ.get('CREDIT_LEDGER_TABLE_NAME', '')
WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
_secrets = boto3.client('secretsmanager')
_cached_key = None


def _verify_stripe_signature(sig_header: str, payload: str, secret: str) -> bool:
    """Verify Stripe webhook signature (v1) per docs.
    Header: t=timestamp,v1=signature
    Computed: HMAC_SHA256(secret, f"{t}.{payload}")
    """
    try:
        parts = dict(s.split('=') for s in sig_header.split(',') if '=' in s)
        t = parts.get('t')
        v1 = parts.get('v1')
        if not t or not v1:
            return False
        signed_payload = f"{t}.{payload}".encode('utf-8')
        expected = hmac.new(secret.encode('utf-8'), signed_payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, v1)
    except Exception:
        return False


def handler(event, context):
    sig = event.get('headers', {}).get('Stripe-Signature', '')
    raw_body = event.get('body') or ''
    if WEBHOOK_SECRET:
        if not _verify_stripe_signature(sig, raw_body, WEBHOOK_SECRET):
            return json_response(401, {"error": "invalid signature"})
    # Optionally fetch API key for verifying event origin if needed (not required for signature check)
    if not WEBHOOK_SECRET:
        # If no webhook secret is configured, reject to avoid shortcuts
        return json_response(500, {"error": "webhook_secret_not_configured"})

    body = json.loads(raw_body or '{}')
    # Expect a custom mapping to include userId and quantity resolved from line items
    user_id = body.get('userId')
    quantity = int(body.get('quantity', 0))
    if not user_id or quantity <= 0:
        return json_response(400, {"error": "invalid payload"})

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
                        'reason': {'S': 'purchase'},
                        'ts': {'N': str(ts)},
                    },
                    'ConditionExpression': 'attribute_not_exists(txId)'
                }
            }
        ]
    )

    return json_response(200, {'received': True})
