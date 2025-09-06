import json
import os
import base64
import urllib.parse
import urllib.request
import boto3
from ..helpers.http import json_response

_secrets = boto3.client('secretsmanager')
_cached_key = None


def _get_stripe_key():
    global _cached_key
    if _cached_key:
        return _cached_key
    arn = os.environ.get('STRIPE_API_KEY_SECRET_ARN')
    if not arn:
        return None
    resp = _secrets.get_secret_value(SecretId=arn)
    secret = resp.get('SecretString') or '{}'
    data = json.loads(secret)
    _cached_key = data.get('stripe_api_key')
    return _cached_key


def handler(event, context):
    body = json.loads(event.get('body') or '{}')
    quantity = int(body.get('quantity', 1))
    if quantity <= 0:
        quantity = 1
    price = os.environ.get('STRIPE_PRICE_CREDIT')
    if not price:
        return json_response(500, {"error": "stripe_not_configured"})

    api_key = _get_stripe_key()
    if not api_key:
        return json_response(500, {"error": "stripe_key_missing"})

    # Create a Checkout Session via Stripe API without installing the SDK
    # Docs: https://stripe.com/docs/api/checkout/sessions/create
    # required form fields (example): mode=payment, line_items[0][price]=price_xxx, line_items[0][quantity]=1, success_url, cancel_url
    success_url = os.environ.get('STRIPE_SUCCESS_URL') or 'https://www.truflr.ai/billing/success'
    cancel_url = os.environ.get('STRIPE_CANCEL_URL') or 'https://www.truflr.ai/billing'
    data = {
        'mode': 'payment',
        'line_items[0][price]': price,
        'line_items[0][quantity]': str(quantity),
        'success_url': success_url,
        'cancel_url': cancel_url,
    }
    encoded = urllib.parse.urlencode(data).encode('utf-8')
    req = urllib.request.Request('https://api.stripe.com/v1/checkout/sessions', data=encoded, method='POST')
    auth_header = base64.b64encode(f"{api_key}:".encode('utf-8')).decode('utf-8')
    req.add_header('Authorization', f'Basic {auth_header}')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read().decode('utf-8'))
            return json_response(200, {"checkoutUrl": payload.get('url')})
    except Exception as e:
        return json_response(500, {"error": "stripe_session_error", "message": str(e)})
