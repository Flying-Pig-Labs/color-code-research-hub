import os
from helpers.http import json_response


def handler(event, context):
    domain = os.environ.get('COGNITO_HOSTED_UI_DOMAIN')
    client_id = os.environ.get('COGNITO_CLIENT_ID')
    redirect_uri = os.environ.get('COGNITO_REDIRECT_URI') or 'https://www.truflr.ai/v2/auth/callback'
    return json_response(200, {
        'cognitoDomain': domain,
        'cognitoClientId': client_id,
        'redirectUri': redirect_uri,
    })
