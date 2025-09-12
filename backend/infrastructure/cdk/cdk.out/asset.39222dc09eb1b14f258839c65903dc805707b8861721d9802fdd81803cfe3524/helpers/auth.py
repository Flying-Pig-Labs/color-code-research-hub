"""Authentication helpers for V2 API.

Primary API: get_user(event) returns verified claims from either the API Gateway
authorizer or a raw bearer token (decoded without verification). It does not
silently fall back to a synthetic identity.

Additional helpers:
- get_optional_user(event): same as get_user, but returns None instead of raising.
- is_public_mode(): returns True if PUBLIC_MODE env var enabled; handlers can
  opt‑in to specific anonymous/demo behaviors in that mode.
"""
import base64
import json
import os
from typing import Dict, Optional


class AuthError(Exception):
    pass


def _decode_jwt_without_verification(token: str) -> Dict:
    """Decode a JWT payload without verification. Returns {} on failure."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        payload_b64 = parts[1]
        pad = 4 - (len(payload_b64) % 4)
        if pad and pad != 4:
            payload_b64 += '=' * pad
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes)
    except Exception:
        return {}


def get_optional_user(event: Dict) -> Optional[Dict]:
    """Extract user claims if present; return None if missing."""
    claims = event.get("requestContext", {}).get("authorizer", {}).get("claims")
    if claims:
        return claims
    headers = event.get('headers') or {}
    auth = headers.get('Authorization') or headers.get('authorization')
    if auth and auth.startswith('Bearer '):
        token = auth.replace('Bearer ', '')
        decoded = _decode_jwt_without_verification(token)
        if decoded:
            return decoded
    return None


def get_user(event: Dict) -> Dict:
    """Extract user claims from the event or raise AuthError if missing."""
    claims = get_optional_user(event)
    if not claims:
        raise AuthError("missing claims")
    return claims


def is_public_mode() -> bool:
    return (os.environ.get('PUBLIC_MODE', '').lower() == 'true')


def require_admin(claims: Dict) -> None:
    groups = claims.get("cognito:groups", "")
    if "admin" not in groups:
        raise AuthError("admin group required")
