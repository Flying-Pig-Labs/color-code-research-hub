"""
HTTP utility functions for V2 API handlers
"""
import json
import jwt
import base64

def create_cors_response(status_code, body):
    """Create a proper CORS response"""
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
    For now, uses the 'name' field from the JWT token as username
    """
    try:
        # Get Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        # Extract JWT token
        token = auth_header.replace('Bearer ', '')
        
        # Decode JWT (without verification for now - in production you'd verify)
        # Split token and decode payload
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
        
        # Extract username (prefer 'name', fallback to 'email' or 'sub')
        username = payload.get('name') or payload.get('email') or payload.get('sub')
        
        return username
        
    except Exception as e:
        print(f"Error extracting username from token: {e}")
        return None