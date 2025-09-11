"""Credit helpers for the V2 API layer.

Provides an `atomic_debit` function that atomically decrements a user's
credit balance, records the debit in the ledger and increments usage counters.
"""
import os
import time
from typing import Literal

import boto3
from botocore.exceptions import ClientError

_dynamodb = boto3.client("dynamodb")

USERS_TABLE = os.environ.get("USERS_TABLE_NAME")
LEDGER_TABLE = os.environ.get("CREDIT_LEDGER_TABLE_NAME")

class DebitError(Exception):
    """Raised when a debit cannot be performed."""


def atomic_debit(user_id: str, tx_id: str, reason: str, stats_field: Literal[
    "reportCount", "ideationCount", "doubleDownCount"
]) -> None:
    """Atomically debit one credit for an action.

    Parameters
    ----------
    user_id: str
        Cognito subject for the user.
    tx_id: str
        Unique transaction id derived from `Idempotency-Key` header.
    reason: str
        Ledger reason (`report`, `ideation`, `double_down`, etc.).
    stats_field: Literal
        Which `stats` counter to increment on the user item.

    Raises
    ------
    DebitError
        If the user has insufficient credits or the transaction was already
        processed.
    """
    ts = int(time.time() * 1000)

    try:
        _dynamodb.transact_write_items(
            TransactItems=[
                {
                    "Update": {
                        "TableName": USERS_TABLE,
                        "Key": {"userId": {"S": user_id}},
                        "UpdateExpression":
                        "SET credits = credits - :one, updatedAt = :ts, stats.#sf = stats.#sf + :one",
                        "ConditionExpression": "credits >= :one",
                        "ExpressionAttributeValues": {
                            ":one": {"N": "1"},
                            ":ts": {"N": str(ts)},
                        },
                        "ExpressionAttributeNames": {"#sf": stats_field},
                    }
                },
                {
                    "Put": {
                        "TableName": LEDGER_TABLE,
                        "Item": {
                            "userId": {"S": user_id},
                            "txId": {"S": tx_id},
                            "type": {"S": "debit"},
                            "amount": {"N": "1"},
                            "reason": {"S": reason},
                            "ts": {"N": str(ts)},
                        },
                        "ConditionExpression": "attribute_not_exists(txId)",
                    }
                },
            ]
        )
    except ClientError as e:
        if e.response["Error"].get("Code") == "ConditionalCheckFailedException":
            raise DebitError("insufficient credits or duplicate txId") from e
        raise

