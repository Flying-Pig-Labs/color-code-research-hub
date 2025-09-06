# API Layer – V2 Platform

This document describes the HTTP interface for the credits based research & ideation platform.
It complements `V2_FEATURES.md` and `DATA_LAYER_V2.md` by detailing endpoints, request and
response payloads, authorizers and Lambda handler mappings.

## Authorization

- **User JWT** – all user routes use a Cognito JWT authorizer. The `sub` is the
  `userId` and is required for all data access.
- **Admin guard** – admin routes additionally check `cognito:groups` includes
  `admin`.

## Common Helpers

- `atomic_debit(userId, txId, reason, statsField)` – performs a DynamoDB
  `TransactWriteItems` that decrements `Users.credits`, appends a debit entry to
  `CreditLedger` and increments the `stats.*Count` counter. Idempotency is
  enforced via the `txId` which is derived from the `Idempotency-Key` HTTP
  header.
- `get_presigned_url(key, ttl)` – utility for short lived S3 downloads.
- `update_counters` – used internally by `atomic_debit`.

## Error Handling

- `400` – malformed input / insufficient credits.
- `401` – missing/invalid JWT.
- `403` – admin group required.
- `409` – idempotent request already processed.
- `500` – unexpected error.

## OpenAPI Style Map

The following table summarises routes and their handlers.

| Path | Method | Description | Handler | Data Dependencies |
|------|--------|-------------|---------|------------------|
| `/billing/stripe/session` | POST | Create Stripe Checkout session | `billing_stripe_session.handler` | Users, CreditLedger |
| `/billing/stripe/webhook` | POST | Stripe webhook (no auth) | `billing_stripe_webhook.handler` | Users, CreditLedger |
| `/credits/balance` | GET | Return remaining credits | `credits_balance.handler` | Users |
| `/projects` | POST | Create project | `projects_create.handler` | Projects |
| `/projects` | GET | List projects for user | `projects_list.handler` | Projects |
| `/projects/{id}` | GET | Get project detail | `projects_get.handler` | Projects |
| `/report/start` | POST | Start report generation | `report_start.handler` | Users, CreditLedger, Reports, S3 |
| `/report/get` | GET | Get report status/url | `report_get.handler` | Reports, S3 |
| `/ideation/start` | POST | Start ideation | `ideation_start.handler` | Users, CreditLedger, Ideations, S3 |
| `/ideation/get` | GET | Get ideation result | `ideation_get.handler` | Ideations, S3 |
| `/double-down/start` | POST | Start double‑down | `double_start.handler` | Users, CreditLedger, DoubleDowns, S3 |
| `/double-down/get` | GET | Get double‑down result | `double_get.handler` | DoubleDowns, S3 |
| `/admin/users` | GET | List users (admin) | `admin_users.handler` | Users |
| `/admin/metrics` | GET | Platform metrics (admin) | `admin_metrics.handler` | Users, CreditLedger |

### Request/Response Shapes

Below are representative payloads. All responses are JSON and include CORS headers.

#### `POST /billing/stripe/session`
```json
{ "successUrl": "https://app/success", "cancelUrl": "https://app/billing" }
→ { "checkoutUrl": "https://stripe.com/checkout..." }
```

#### `GET /credits/balance`
```json
→ { "credits": 3 }
```

#### `POST /projects`
```json
{ "title": "Widget", "domain": "gadgets", "inputs": {...} }
→ { "projectId": "<uuid>" }
```

#### `POST /report/start`
```json
{ "projectId": "p1" }
→ { "reportId": "r1" }
```

Other action start routes follow the same pattern returning their respective ids.
Get routes return status plus presigned URLs when complete.

## Lambda Mapping

Every row in the table above maps to a Python Lambda function placed under
`backend/lambda/v2/handlers`. Functions are deployed through the CDK stack
`ApiLayerStack` which wires paths to handlers and configures environment
variables:

```
USERS_TABLE_NAME, CREDIT_LEDGER_TABLE_NAME, PROJECTS_TABLE_NAME,
REPORTS_TABLE_NAME, IDEATIONS_TABLE_NAME, DOUBLES_TABLE_NAME,
ARTIFACTS_BUCKET_NAME, STRIPE_SECRET_KEY, STRIPE_PRICE_CREDIT
```

## Data Layer Dependencies

All tables and the `ArtifactsBucket` are provisioned by `DataLayerStack` and are
referenced by the API functions via environment variables.

