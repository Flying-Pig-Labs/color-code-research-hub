"""User helpers for V2 API.

Provides lazy initialization of user rows in the Users table.
"""
import os
import time
from typing import Optional, Dict

import boto3
from botocore.exceptions import ClientError

_dynamodb = boto3.client("dynamodb")
USERS_TABLE = os.environ.get("USERS_TABLE_NAME", "")


def ensure_user_exists(claims: Dict) -> None:
    """Create a Users row if missing.

    Sets defaults: credits=0, stats counters=0, entity='USERS'.
    """
    user_id = claims.get("sub")
    if not user_id:
        return
    now = int(time.time() * 1000)
    item = {
        "userId": {"S": user_id},
        "credits": {"N": "0"},
        "entity": {"S": "USERS"},
        "createdAt": {"N": str(now)},
        "updatedAt": {"N": str(now)},
        "stats": {
            "M": {
                "reportCount": {"N": "0"},
                "ideationCount": {"N": "0"},
                "doubleDownCount": {"N": "0"},
            }
        },
    }
    email = claims.get("email")
    if email:
        item["email"] = {"S": email}
    try:
        _dynamodb.put_item(
            TableName=USERS_TABLE,
            Item=item,
            ConditionExpression="attribute_not_exists(userId)",
        )
    except ClientError as e:
        # If row already exists, ignore
        if e.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
            raise

