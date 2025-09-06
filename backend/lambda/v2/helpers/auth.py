"""Authentication helpers for V2 API."""
import json
from typing import Dict

class AuthError(Exception):
    pass

def get_user(event: Dict) -> Dict:
    """Extract user claims from a Lambda event with a Cognito authorizer."""
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims")
    if not claims:
        raise AuthError("missing claims")
    return claims

def require_admin(claims: Dict) -> None:
    groups = claims.get("cognito:groups", "")
    if "admin" not in groups:
        raise AuthError("admin group required")
