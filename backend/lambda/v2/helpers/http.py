import json

ALLOWED_HEADERS = 'Content-Type,Authorization,X-Api-Key,Accept,Idempotency-Key'
ALLOWED_METHODS = 'GET,POST,OPTIONS,PUT,DELETE'


def json_response(status_code: int, payload) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': ALLOWED_HEADERS,
            'Access-Control-Allow-Methods': ALLOWED_METHODS,
        },
        'body': json.dumps(payload),
    }

