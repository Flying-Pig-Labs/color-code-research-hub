# Spec Pack: Credits-Driven Research & Ideation Platform (Amplify + Cognito + Stripe + API GW + Lambda + DynamoDB + S3)

This is a consolidated, end-to-end specification covering the **data layer**, **API layer**, and **frontend** (plus a compact security/ops appendix). The system delivers:

* **Auth:** Cognito (email/password + Google SSO), one **admin** group.
* **Credits:** **Pooled** model — 1 credit funds **any action** (Report, Ideation, Double-Down).
* **Actions:**

  * **Report** → generates the analysis report.
  * **Ideation** → generates & ranks **10 ideas** + internal reviews.
  * **Double-Down** → refines an **individual idea** using reviews + user feedback; emits a final deliverable package (PDF + ZIP) suitable for **manual** USPTO provisional filing (no automated e-filing; user uploads via Patent Center).
* **Admin Panel:** read-all visibility; optional credit adjustments.

---

# DOC 1 — Data Layer Specification

## 1.1 Core stores

### DynamoDB Tables (PAY\_PER\_REQUEST)

1. **Users**
   **PK:** `userId` (string; Cognito `sub`)

| Attribute        | Type | Notes                                                                 |
| ---------------- | ---- | --------------------------------------------------------------------- |
| userId           | S    | Cognito subject                                                       |
| email            | S    | From JWT                                                              |
| credits          | N    | **Pooled** integer balance                                            |
| stats            | M    | Counters: `reportCount`, `ideationCount`, `doubleDownCount` (numbers) |
| stripeCustomerId | S    | Optional; set on first purchase                                       |
| createdAt        | N    | epoch ms                                                              |
| updatedAt        | N    | epoch ms                                                              |

**GSI (optional, recommended for admin list):**
`GSIUsersByCreated` → `PK = entity (S, constant 'USERS')`, `SK = createdAt (N)`
Add `entity='USERS'` to all user items.

---

2. **CreditLedger**
   **PK:** `userId` (S)
   **SK:** `txId` (S, unique; e.g., `CR_<payment_intent>` or `DR_<uuid>`)

| Attribute | Type | Notes                                              |        |          |              |        |                         |
| --------- | ---- | -------------------------------------------------- | ------ | -------- | ------------ | ------ | ----------------------- |
| userId    | S    |                                                    |        |          |              |        |                         |
| txId      | S    | idempotent key                                     |        |          |              |        |                         |
| type      | S    | `credit` or `debit`                                |        |          |              |        |                         |
| amount    | N    | always `1` in this design                          |        |          |              |        |                         |
| reason    | S    | \`purchase                                         | report | ideation | double\_down | refund | manual\_adjust:<note>\` |
| ts        | N    | epoch ms                                           |        |          |              |        |                         |
| meta      | M    | optional (e.g., admin actor id, Stripe session id) |        |          |              |        |                         |

**GSI (optional):**

* `GSI_LedgerByTime` → `PK = userId`, `SK = ts` (time-ordered per user)
* `GSI_LedgerGlobal` → `PK = reason`, `SK = ts` (global streams by reason)

---

3. **Projects**
   **PK:** `projectId` (S, ULID/UUIDv7)

| Attribute | Type | Notes                  |
| --------- | ---- | ---------------------- |
| projectId | S    |                        |
| userId    | S    | owner                  |
| title     | S    |                        |
| domain    | S    | optional               |
| inputs    | M    | seed inputs / settings |
| createdAt | N    |                        |

**GSI:** `GSI_ProjectsByUser` → `PK = userId`, `SK = createdAt`

---

4. **Reports**
   **PK:** `reportId` (S)

| Attribute   | Type | Notes         |      |          |
| ----------- | ---- | ------------- | ---- | -------- |
| reportId    | S    |               |      |          |
| projectId   | S    |               |      |          |
| userId      | S    |               |      |          |
| status      | S    | \`pending     | done | failed\` |
| reportS3Key | S    | set when done |      |          |
| startedAt   | N    |               |      |          |
| completedAt | N    |               |      |          |

**GSI:** `GSI_ReportsByProject` → `PK = projectId`, `SK = startedAt`

---

5. **Ideations**
   **PK:** `ideationId` (S)

| Attribute      | Type | Notes                             |      |          |
| -------------- | ---- | --------------------------------- | ---- | -------- |
| ideationId     | S    |                                   |      |          |
| projectId      | S    |                                   |      |          |
| userId         | S    |                                   |      |          |
| reportId       | S    | source report                     |      |          |
| status         | S    | \`pending                         | done | failed\` |
| ideasJsonS3Key | S    | S3 JSON blob (10 ideas + reviews) |      |          |
| startedAt      | N    |                                   |      |          |
| completedAt    | N    |                                   |      |          |

**Idea object** (stored inside JSON on S3):

```json
{
  "ideaId": "i-01",
  "title": "…",
  "summary": "…",
  "whyNow": "…",
  "differentiation": "…",
  "risks": ["…"],
  "rank": 1,
  "review": {
    "score": 0.0,
    "rationale": "…",
    "marketSignals": ["…"]
  }
}
```

**GSI:** `GSI_IdeationsByProject` → `PK = projectId`, `SK = startedAt`

---

6. **DoubleDowns**
   **PK:** `doubleId` (S)

| Attribute     | Type | Notes                            |      |          |
| ------------- | ---- | -------------------------------- | ---- | -------- |
| doubleId      | S    |                                  |      |          |
| projectId     | S    |                                  |      |          |
| userId        | S    |                                  |      |          |
| ideationId    | S    |                                  |      |          |
| ideaId        | S    | target idea within that ideation |      |          |
| feedback      | S    | user-provided                    |      |          |
| status        | S    | \`pending                        | done | failed\` |
| finalPdfS3Key | S    |                                  |      |          |
| finalZipS3Key | S    |                                  |      |          |
| startedAt     | N    |                                  |      |          |
| completedAt   | N    |                                  |      |          |

**GSI:** `GSI_DoublesByProject` → `PK = projectId`, `SK = startedAt`

---

### S3 Buckets

* **ArtifactsBucket** (private)
  Structure (keys are examples):

  ```
  /u/{userId}/p/{projectId}/
      report/{reportId}/report.pdf
      ideation/{ideationId}/ideas.json
      double/{doubleId}/final.pdf
      double/{doubleId}/provisional_package.zip
      double/{doubleId}/sb16.pdf            (prefilled)
      double/{doubleId}/drawings.pdf
  ```
* **Access:** Lambdas read/write; users download via **short-lived presigned URLs**.

---

## 1.2 Data mutations & invariants

* **Credits are pooled**: `Users.credits` is the sole spendable balance.
* **Every debit/credit** must have a **matching ledger item** (idempotent key).
* **Action start** performs: (1) atomic debit; (2) create action record (`Reports`/`Ideations`/`DoubleDowns`) with `pending`; (3) bump user counters (`stats.*Count`).
* **Referential integrity** (enforced in code):

  * `Ideations.reportId` must exist & belong to same `userId` & `projectId`.
  * `DoubleDowns.ideationId` must exist & `ideaId` must exist within that ideation’s ideas JSON.

---

## 1.3 IAM & Secrets

* **Secrets Manager / SSM Parameter Store**

  * `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_CREDIT`
* **Lambdas**: least-privilege policies (table-scoped RW, bucket object RW).
* **Admin** Lambdas: read-all; optional write for credit adjustments.

---

# DOC 2 — API Layer Specification

**Gateway:** API Gateway (REST or HTTP) with **Cognito JWT authorizer** for all routes except the Stripe webhook.
**AuthN:** Cognito User Pool (Hosted UI; Google IdP)
**AuthZ:**

* **User**: access only own resources.
* **Admin**: routes guarded by `cognito:groups` contains `"admin"`.

## 2.1 Common conventions

* **Headers**

  * `Authorization: Bearer <ID_TOKEN>`
  * Optional idempotency: `Idempotency-Key: <uuid>`
* **Errors** (examples):

  * `401 Unauthorized` (no/invalid token)
  * `403 Forbidden` (not admin / cross-user access)
  * `404 Not Found` (missing resource)
  * `409 Conflict` (bad state; e.g., idea not in ideation)
  * `422 Unprocessable Entity` (validation)
  * `402 Payment Required` (insufficient credits)
* **Idempotency**

  * For **debits**, use `txId = hash(userId, action, Idempotency-Key)`; if repeated, return the prior success.

---

## 2.2 Billing

### `POST /billing/stripe/create-checkout-session`

* **Auth:** user
* **Body:** `{ "quantity": 1 }` (optional; default 1)
* **Response:** `{ "checkoutUrl": "…" }`

### `POST /billing/stripe/webhook`

* **Auth:** none (Stripe-signed)
* **Body:** Stripe event payload
* **Behavior:** on `checkout.session.completed` → lookup line items → compute purchased credits → **idempotent** `Users.credits += qty` + `CreditLedger` `"credit"`.

### `GET /credits/balance`

* **Auth:** user
* **Response:** `{ "credits": 7 }`

---

## 2.3 Projects

### `POST /projects`

* **Auth:** user
* **Body:** `{ "title": "…", "domain": "…", "inputs": {...} }`
* **Response:** `{ "projectId": "…" }`

### `GET /projects`

* **Auth:** user
* **Query:** pagination
* **Response:** list (most recent first)

---

## 2.4 Report

### `POST /projects/{projectId}/report/start`

* **Auth:** user (owns project)
* **Behavior:**

  1. Atomic **debit** (`reason='report'`)
  2. Create `Reports` item `pending`
  3. Kick async job (same Lambda or Step Functions)
* **Response:** `{ "reportId": "…", "txId": "…" }`

### `GET /reports/{reportId}`

* **Auth:** user
* **Response:** metadata + presigned `report.pdf` URL (if done)

---

## 2.5 Ideation

### `POST /projects/{projectId}/ideation/start`

* **Auth:** user
* **Body:** `{ "reportId": "…" }`
* **Guards:** report belongs to user & project
* **Behavior:**

  1. **debit** (`reason='ideation'`)
  2. Create `Ideations` `pending`
  3. Run pipeline → produce **10 ideas + reviews** → store JSON on S3 → mark `done`
* **Response:** `{ "ideationId": "…", "txId": "…" }`

### `GET /ideations/{ideationId}`

* **Auth:** user
* **Response:** metadata + ideas (inline or presigned JSON link)

---

## 2.6 Double-Down

### `POST /projects/{projectId}/double-down/start`

* **Auth:** user
* **Body:** `{ "ideationId": "…", "ideaId": "…", "feedback": "…" }`
* **Guards:** ideation belongs to user & project; `ideaId` exists in ideation’s JSON
* **Behavior:**

  1. **debit** (`reason='double_down'`)
  2. Create `DoubleDowns` `pending`
  3. Refine idea using internal reviews + `feedback`
  4. Generate deliverables:

     * `final.pdf` (exec summary, refined concept, business plan, landing page spec, basic implementation plan, clear “not legal advice” banner)
     * `provisional_package.zip` (spec PDF, **prefilled** USPTO SB/16 cover sheet PDF, drawings PDF, filing steps README)
  5. Store to S3; mark `done`
* **Response:** `{ "doubleId": "…", "txId": "…" }`

### `GET /double-downs/{doubleId}`

* **Auth:** user
* **Response:** metadata + presigned URLs for `final.pdf` and `provisional_package.zip`

---

## 2.7 Feedback (optional helper)

### `POST /ideations/{ideationId}/feedback`

* **Auth:** user
* **Body:** `{ "ideaId": "…", "feedback": "…" }`
* **Behavior:** append to ideation-scoped feedback log (S3 JSON or a small DDB item)
* **Use:** can be pulled into Double-Down prompts.

---

## 2.8 Admin

All admin routes require `cognito:groups` contains `"admin"`.

### `GET /admin/users`

* **Query:** `limit`, `next`
* **Response:** list of `{ userId, email, credits, stats, createdAt }`

### `GET /admin/users/{userId}`

* **Response:** user profile + last N ledger entries + last N projects

### `GET /admin/users/{userId}/ledger`

* **Query:** `limit`, `next`
* **Response:** paginated ledger

### `GET /admin/metrics/summary`

* **Response:** aggregates (totals by action, purchased vs spent, active users 7d/30d)

### `POST /admin/credits/adjust` *(optional)*

* **Body:** `{ "userId": "…", "delta": 1|-1, "note": "…" }`
* **Behavior:** atomically adjust balance + write ledger with `reason='manual_adjust:<note>'` + include admin actor in `meta`.

---

## 2.9 Lambda Behaviors (atomicity & guards)

### Debit helper (shared)

* **TransactWriteItems**: `Users.credits = credits - 1` (condition `credits >= 1`) + `CreditLedger` put with unique `txId`.
* Return `txId` for tracing.

### Counters update

* After **successful debit**, increment `Users.stats.<X>Count` (atomic update). If this update fails, **do not** roll back the debit; a nightly reconciler can repair counters from ledger.

### Ownership checks

* Every `GET`/`POST` that references child resources must verify `userId == jwt.sub` and (where applicable) `projectId` chain matches.

---

# DOC 3 — Frontend Specification (Amplify + React)

## 3.1 Auth & session

* Use **Amplify UI** `<Authenticator socialProviders={['google']}/>`
* Configure OAuth with Cognito Hosted UI domain & callbacks.
* After auth: display **Credits: N**.

**Admin gate:** read `cognito:groups` from ID token; show `/admin` route only if includes `"admin"`.

---

## 3.2 IA & screens

### A) App Shell

* Header: brand, **Credits chip**, user menu (Profile, Sign out), Admin link (if admin)
* Left nav: Projects, Billing, (Admin)
* Toasts for success/error

### B) Billing

* Balance card: **Credits: N**
* Purchase panel:

  * Quantity stepper (default 1)
  * “Buy Credits” → POST `/billing/stripe/create-checkout-session` → redirect to Stripe
* After redirect back: poll `/credits/balance`

### C) Projects

* **List**: title, created date, last activity
* **Create** modal: title/domain/inputs

### D) Project Detail (timeline of actions)

1. **Report**

   * CTA: “Run Report (1 credit)”
   * If running: show spinner + status; once done, **Download Report** button (presigned link)
2. **Ideations**

   * Select **source report** from dropdown (pre-select latest)
   * CTA: “Run Ideation (1 credit)”
   * Show latest ideations list: each with table of **10 ideas (rank, title, score, quick view)**
   * Row actions: “Open”, “Provide Feedback” (optional), “Double-Down”
3. **Double-Down**

   * Choose **Ideation** + **Idea** (radio)
   * Textarea for **feedback** (optional)
   * CTA: “Double-Down (1 credit)”
   * Result: buttons for `final.pdf` and `provisional_package.zip` (presigned URLs)

### E) Admin (if in group)

* **Dashboard**: cards

  * Total users, Credits purchased, Credits spent, Actions (today/7d/30d)
* **Users**: table with Email, Credits, Report/Ideation/DoubleDown counts, CreatedAt, “View”
* **User Detail**:

  * Profile summary (email, credits, stats)
  * Tabs: **Ledger** (paginated), **Projects** (last N)
  * (Optional) Adjust Credits (+/– with reason; confirm dialog)

---

## 3.3 Frontend → API contracts (examples)

### Fetch balance

```
GET /credits/balance
→ { "credits": 7 }
```

### Start report

```
POST /projects/{projectId}/report/start
Headers: Authorization, Idempotency-Key
Body: {}
→ { "reportId": "...", "txId": "..." }
```

### Start ideation

```
POST /projects/{projectId}/ideation/start
Body: { "reportId": "..." }
→ { "ideationId": "...", "txId": "..." }
```

### Start double-down

```
POST /projects/{projectId}/double-down/start
Body: { "ideationId": "...", "ideaId": "...", "feedback": "..." }
→ { "doubleId": "...", "txId": "..." }
```

### Get artifacts

```
GET /reports/{reportId}
→ { "status": "done", "reportUrl": "https://..." }

GET /ideations/{ideationId}
→ { "status": "done", "ideasUrl": "https://..." }

GET /double-downs/{doubleId}
→ { "status": "done", "finalPdfUrl": "https://...", "zipUrl": "https://..." }
```

---

## 3.4 UX notes & empty states

* If `credits == 0`, disable action CTAs and surface “Buy credits”.
* Allow **multiple ideations** per report and **multiple double-downs** per ideation (one per selected idea).
* In lists, show **cost label** (“Costs 1 credit”) near CTAs.
* Show clear **disclaimer** on Double-Down result: “Informational only; not legal advice; user must file & pay fees via USPTO Patent Center.”

---

# Appendix — Security, Ops, and Implementation Notes

## A) Cognito & Admin

* **Groups:** create `admin` group.
* Frontend admin gate via `cognito:groups` in ID token; backend guard rejects if not in group.

## B) Atomic debit & idempotency

* Always debit **once at start** of each action via `TransactWriteItems`.
* Use `Idempotency-Key` header to compute stable `txId`; if duplicate, return prior success.

## C) Observability

* **CloudWatch Dashboards:**

  * API 5xx/4xx by route
  * Lambda errors & duration
  * DDB throttles
* **Structured logs:** include `requestId`, `userId`, `projectId`, `action`, `txId`.
* **Alarms:** Stripe webhook failure, debit failures, artifact upload failure.

## D) Reconciliation

* Nightly job:

  * Compute `ledgerCredits - ledgerDebits` per user; compare to `Users.credits`.
  * Optionally repair counters (`stats.*Count`) from debit ledger.

## E) File generation (Double-Down)

* **PDF engine:** WeasyPrint (pure Python) or wkhtmltopdf (binary in Lambda layer).
* **SB/16 cover sheet:** store a fillable PDF template; prefill inventors/contact from user-supplied profile fields.
* **ZIP:** assemble `spec.pdf`, `sb16.pdf`, `drawings.pdf`, `readme_filing_steps.md`, plus any supporting artifacts.
* **Distribution:** presigned URLs with short TTL; objects encrypted at rest.

## F) Infrastructure (CDK summary)

* **Cognito User Pool** with Google IdP; Hosted UI domain; app client with OAuth code flow.
* **API Gateway** with Cognito JWT authorizer; routes per spec.
* **Lambda** functions:

  * `stripe_create_checkout_session`
  * `stripe_webhook`
  * `projects_create`, `projects_list`
  * `report_start`, `report_get`
  * `ideation_start`, `ideation_get`
  * `double_start`, `double_get`
  * `admin_*` (list users, user detail, ledger, metrics, adjust)
  * Shared **Layer**: `lib/credits.py`, DDB client helpers, S3 utils, auth parsing.
* **DynamoDB** tables & GSIs as specified.
* **S3** Artifacts bucket with least-privilege IAM.
* **Parameters/Secrets** wired to Lambdas via env.

**Environment variables (examples):**

```
USERS_TABLE, LEDGER_TABLE, PROJECTS_TABLE, REPORTS_TABLE, IDEATIONS_TABLE, DOUBLES_TABLE
ARTIFACTS_BUCKET
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_CREDIT
FRONTEND_URL
```

## G) Threat & abuse considerations

* **No automated e-filing**. Never store USPTO credentials.
* **SSRF & prompt-injection**: sanitize report inputs, restrict outbound calls as needed.
* **Download links**: presigned, short TTL; never expose raw S3 keys publicly.
* **Admin adjustments:** always ledger with `meta.adminActor = <sub>`; require confirmation modal.

---

## Minimal Implementation Checklist

**Data layer**

* [ ] Create DDB tables + GSIs
* [ ] Create S3 Artifacts bucket
* [ ] Seed `entity='USERS'` on new users; ensure `credits` exists (0)

**API**

* [ ] JWT authorizer on all user/admin routes; Stripe webhook unsigned but verified with secret
* [ ] Implement debit helper with `TransactWriteItems`
* [ ] Implement action routes (report/ideation/double) with guards + artifacts writes
* [ ] Admin routes + group guard
* [ ] Stripe Checkout + webhook to credit balance

**Frontend**

* [ ] Amplify Authenticator (Google enabled)
* [ ] Credits chip + Billing purchase flow
* [ ] Projects list/detail with CTAs and status polling
* [ ] Ideation table (10 ideas + rankings) + “Double-Down” flow
* [ ] Admin dashboard, users list, user detail, optional credit adjust UI
