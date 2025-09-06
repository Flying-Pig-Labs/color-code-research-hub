import json

from ..helpers.credits import atomic_debit, DebitError

def handler(event, context):
    try:
        atomic_debit("user", "tx", "report", "reportCount")
    except DebitError:
        return {"statusCode": 400, "body": json.dumps({"error": "debit failed"})}
    return {"statusCode": 200, "body": json.dumps({"reportId": "stub"})}
