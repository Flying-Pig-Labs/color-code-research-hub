Auth Branding – Cognito Hosted UI
=================================

Mode
-----
We use Cognito Hosted UI (Classic) with a Cognito domain. Managed Login theming is limited in CFN; Classic supports CSS + logo via the `set-ui-customization` API.

What we customize
-----------------
- Colors (buttons, inputs, links) and radius via a small CSS file
- Logo (PNG)
- Optional: custom domain (auth.<domain>) when certificate and domain provided

What we cannot customize
------------------------
- Full layout, component structure, and all states (limited selectors only)
- Custom fonts via remote URLs (CSP); we use system stack
- Some messages and labels (service controlled)

Assets
------
- CSS: `infrastructure/cognito/hosted-ui.css`
- Logo (dark): `public/logo-dark.png` (optimize < 100KB)

IaC
---
- CDK (`backend/infrastructure/cdk/lib/auth-stack.ts`):
  - Creates User Pool and domain (Cognito or optional custom domain)
  - Outputs: UserPoolId, UserPoolClientId, HostedUIDomain
- Branding is applied via AWS CLI (idempotent) to support CSS + logo

Env vars
--------
- `COGNITO_USER_POOL_ID` (required)
- `COGNITO_APP_CLIENT_ID` (optional; omit for pool‑level CSS)
- `COGNITO_CUSTOM_DOMAIN_NAME` (optional, e.g., auth.truflr.ai)
- `COGNITO_CUSTOM_DOMAIN_CERT_ARN` (optional; ACM cert in same region)
- `AWS_REGION`

Commands – Classic (CSS)
------------------------
- Apply: `make auth:brand:apply`
- Status: `make auth:brand:status`
- Rollback: `make auth:brand:rollback`

Commands – Managed Login (no CSS)
---------------------------------
- Apply: `COGNITO_USER_POOL_ID=<id> make auth:managed:apply`
- Status: `COGNITO_USER_POOL_ID=<id> make auth:managed:status`
- Reset:  `COGNITO_USER_POOL_ID=<id> make auth:managed:reset`

Custom domain
-------------
- Provide `COGNITO_CUSTOM_DOMAIN_NAME` and `COGNITO_CUSTOM_DOMAIN_CERT_ARN` then `cd backend/infrastructure/cdk && npm install && npx cdk -a 'npx ts-node bin/auth-layer.ts' deploy AuthStack`
- Update App Client callback/sign-out URLs to include `https://auth.<domain>/oauth2/idpresponse` (if required)

Testing
-------
1. Set env vars and run `make auth:brand:apply`
2. Test sign‑up, sign‑in, forgot password, and MFA (if enabled) at the Hosted UI domain
3. Take screenshots (375px, 1280px)
4. Verify CSP (no blocked assets), contrast (WCAG‑AA), and focus states

Re‑apply
--------
Rebuilds or new environments: set env vars, then run `make auth:brand:apply`.

Rollback
--------
`make auth:brand:rollback` to remove CSS and logo.

Future path
-----------
If pixel‑perfect control is needed beyond Hosted UI limits, migrate to a custom React Auth UI (e.g., Amplify UI components) and reuse the same design tokens.
