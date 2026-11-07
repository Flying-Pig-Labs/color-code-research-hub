"""
User mapping utilities to convert Cognito email addresses to legacy usernames
"""
import json
import base64

# Email to username mapping for legacy table compatibility
EMAIL_TO_USERNAME_MAP = {
    'priorww@gmail.com': 'fprior'
    # Add more mappings as needed for other users
}

def get_authenticated_username_with_mapping(event):
    """
    Extract username from JWT token and map to legacy username if needed
    """
    try:
        # Get Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization')

        # If no Authorization header, return None; public/demo is handled by handlers
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
        
        # Extract username (prefer 'name', fallback to 'email' or 'sub')
        jwt_username = payload.get('name') or payload.get('email') or payload.get('sub')
        
        if not jwt_username:
            return None
        
        # Apply mapping if the user is in our mapping table
        mapped_username = EMAIL_TO_USERNAME_MAP.get(jwt_username, jwt_username)
        
        print(f"JWT username: {jwt_username} -> Mapped username: {mapped_username}")
        return mapped_username
        
    except Exception as e:
        print(f"Error extracting username from token: {e}")
        return None

def add_user_mapping(email, username):
    """
    Add a new email -> username mapping
    """
    EMAIL_TO_USERNAME_MAP[email] = username
    print(f"Added mapping: {email} -> {username}")

def get_all_mappings():
    """
    Get all email -> username mappings
    """
    return EMAIL_TO_USERNAME_MAP.copy()

