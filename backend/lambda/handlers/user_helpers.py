"""
User helper functions for user-scoped API filtering
Maps Cognito users to username for data access
"""
import json
import jwt
from typing import Optional


def get_username_from_jwt(event: dict) -> Optional[str]:
    """
    Extract username from Cognito JWT token
    
    Args:
        event: Lambda event with Authorization header
        
    Returns:
        username string or None if not found
    """
    try:
        # Get JWT token from Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
            
        jwt_token = auth_header.replace('Bearer ', '')
        
        # Decode JWT (Cognito already validated it)
        claims = jwt.decode(jwt_token, options={"verify_signature": False})
        
        # Get email from claims
        email = claims.get('email', '')
        
        # Map email to username
        return get_username_from_email(email)
        
    except Exception as e:
        print(f"Error extracting username from JWT: {e}")
        return None


def get_username_from_email(email: str) -> str:
    """
    Map email to username for data filtering
    
    Args:
        email: User email from Cognito
        
    Returns:
        username string for data queries
    """
    # Known user mapping
    email_to_username = {
        "priorww@gmail.com": "fprior"
    }
    
    # Return mapped username or use email prefix for new users
    return email_to_username.get(email, email.split('@')[0])


def create_user_filter_response(items: list, cors_headers: dict = None) -> dict:
    """
    Create standardized API response with CORS headers
    
    Args:
        items: Filtered data items
        cors_headers: CORS headers for browser requests
        
    Returns:
        API Gateway response format
    """
    if cors_headers is None:
        cors_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        }
    
    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps({
            'success': True,
            'count': len(items),
            'data': items
        })
    }


def handle_cors_preflight() -> dict:
    """
    Handle CORS preflight requests
    
    Returns:
        CORS preflight response
    """
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps({'message': 'CORS preflight'})
    }