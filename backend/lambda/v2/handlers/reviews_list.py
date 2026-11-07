import os
import boto3
from boto3.dynamodb.conditions import Attr
from helpers.auth import get_user, get_optional_user, AuthError
from helpers.http import json_response

TABLE = os.environ.get('SHARK_TANK_REVIEWS_TABLE', 'SharkTankReviews')
dynamo = boto3.resource('dynamodb')


def _normalize_userid(claims: dict) -> str:
    uid = claims.get('sub') or claims.get('email') or claims.get('name') or ''
    if uid == 'priorww@gmail.com':
        return 'fprior'
    return uid


def handler(event, context):
    # Optional auth: allow public/global leaderboard without tokens, but filter requires auth
    claims = get_optional_user(event)
    qs = event.get('queryStringParameters') or {}
    userid = qs.get('userid') if qs else None
    if userid and not claims:
        # Require auth to filter by user
        try:
            claims = get_user(event)
        except AuthError:
            return json_response(401, { 'error': 'unauthorized' })

    table = dynamo.Table(TABLE)
    try:
        scan = table.scan()
        items = scan.get('Items', [])
        # If filtering by user, try several fields
        if userid:
            match_uid = userid
            # Normalize common mapping
            if match_uid == 'priorww@gmail.com':
                match_uid = 'fprior'
            filtered = []
            for it in items:
                u1 = (it.get('userId') or it.get('userid') or '').strip()
                u2 = (it.get('username') or '').strip()
                if (u1 and u1 == match_uid) or (u2 and u2 == match_uid):
                    filtered.append(it)
            items = filtered
        # Sort newest first if created/ts present
        try:
            items.sort(key=lambda x: x.get('review_timestamp') or x.get('createdAt') or 0, reverse=True)
        except Exception:
            pass
        return json_response(200, { 'items': items, 'count': len(items) })
    except Exception as e:
        return json_response(500, { 'error': 'internal_error', 'detail': str(e) })

