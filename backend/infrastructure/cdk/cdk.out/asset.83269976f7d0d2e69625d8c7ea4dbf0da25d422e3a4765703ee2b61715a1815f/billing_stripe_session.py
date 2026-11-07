import json
import os

def handler(event, context):
    body = json.loads(event.get('body') or '{}')
    quantity = body.get('quantity', 1)
    price = os.environ.get('STRIPE_PRICE_CREDIT', 'price_mock')
    checkout_url = f"https://stripe.example/checkout?price={price}&qty={quantity}"
    return {"statusCode": 200, "body": json.dumps({"checkoutUrl": checkout_url})}
