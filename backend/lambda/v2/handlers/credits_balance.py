import json
import os
import boto3
import base64

_dynamodb = boto3.client('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE_NAME', 'Users')

def json_response(status_code, body):
    """Create a proper JSON response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body) if isinstance(body, (dict, list)) else str(body)
    }

def get_authenticated_username(event):
    """
    Extract username from JWT token in Authorization header
    """
    try:
        # Get Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        # Extract JWT token
        token = auth_header.replace('Bearer ', '')
        
        # Decode JWT (without verification for now)
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Add padding if needed
        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding
        
        # Decode payload
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        payload = json.loads(payload_bytes)
        
        return payload
        
    except Exception as e:
        print(f"Error extracting token payload: {e}")
        return None

def ensure_user_exists(user_payload):
    """
    Ensure a user record exists in the Users table
    """
    try:
        user_id = user_payload.get('sub') or user_payload.get('name') or 'unknown'
        
        # Try to get existing user
        resp = _dynamodb.get_item(
            TableName=USERS_TABLE, 
            Key={'userId': {'S': user_id}}
        )
        
        # If user doesn't exist, create it
        if 'Item' not in resp:
            _dynamodb.put_item(
                TableName=USERS_TABLE,
                Item={
                    'userId': {'S': user_id},
                    'credits': {'N': '100'},  # Default starting credits
                    'createdAt': {'S': json.dumps({'$date': {'$numberLong': str(int(os.times().elapsed * 1000))}})}
                }
            )
    except Exception as e:
        print(f"Error ensuring user exists: {e}")
        # Continue anyway

def handler(event, context):
    try:
        claims = get_authenticated_username(event)
        if not claims:
            return json_response(401, {"error": "unauthorized"})
        
        # Ensure user record exists
        ensure_user_exists(claims)
        user_id = claims.get('sub') or claims.get('name') or 'unknown'
        
        resp = _dynamodb.get_item(TableName=USERS_TABLE, Key={'userId': {'S': user_id}})
        item = resp.get('Item')
        
        if not item:
            return json_response(404, {"error": "user not found"})
        
        credits = int(item.get('credits', {'N': '0'})['N'])
        return json_response(200, {"credits": credits})
        
    except Exception as e:
        print(f"Error in credits_balance handler: {e}")
        return json_response(500, {"error": "Internal server error"})
