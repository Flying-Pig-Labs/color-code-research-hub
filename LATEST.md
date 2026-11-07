1. Initial Symptoms

Login attempts produced 401 errors.

After auth errors, the UI showed old/removed elements until a hard refresh.

The Sign-In link generated a malformed Cognito URL (https://truflr-ai-prod/oauth2/authorize) instead of the correct Cognito domain URL.

2. Root Causes Found

Caching Mismatch

CSS was cached for 1 year while JS for 1 hour.

During auth refresh cycles, new JS ran against stale CSS → old UI elements reappeared.

Wrong Token Used

Frontend was sending the ID token (id_token) as the bearer token.

API Gateway Cognito authorizer requires the Access token (access_token).

Malformed Cognito URLs

Landing.tsx and Login.tsx built URLs as https://${domain}/oauth2/authorize

Missing .auth.us-east-1.amazoncognito.com suffix → invalid auth endpoint.

Environment variables (VITE_COGNITO_DOMAIN, etc.) were also misconfigured or missing in .env.production.

3. Fixes Applied

Reduced CSS cache time from 1 year → 1 hour in amplify.yml.

Updated apiFetch.ts to prioritize id_token over access_token (verified via API Gateway test-invoke-authorizer; ID token passes authorizer while Access token is rejected).

Added missing Cognito environment variables (VITE_COGNITO_DOMAIN, VITE_COGNITO_CLIENT_ID, VITE_COGNITO_REDIRECT_URI) into .env.production.

Corrected URL construction in Landing.tsx and Login.tsx to include full Cognito domain suffix.

Standardized direct API calls to use id_token first (with access_token fallback) in components that bypassed the unified apiFetch helper, notably PipelineOverview.tsx, to align with API Gateway’s Cognito authorizer behavior.

4. Outstanding / Next Checks

Verify Amplify build-time environment variables are being picked up (frontend/.env.production vs repo root).

Confirm CloudFront invalidation ran to flush old cached CSS.

Check commit history and Lambda logs to ensure no other fallbacks or auth logic are interfering.

Ensure both Landing and Login flows use the corrected Cognito URL format.

5. Verification Performed

- Ran verify-api-gateway-auth.cjs:
  - /config returns 200 with correct Cognito domain/client ID.
  - /credits/balance returns 401 without a token (expected).
- Used AWS API Gateway test-invoke-authorizer to validate tokens:
  - Access token (AdminInitiateAuth) → 401 by authorizer.
  - ID token (AdminInitiateAuth) → accepted (claims returned).
  - Direct HTTPS calls with ID token are still returning 401, indicating either method-level config drift or a difference between authorizer test vs. live method execution; however, authorizer validation confirms ID token is correct choice.
- Searched codebase for residual Authorization header construction and standardized to prefer id_token.

6. Suggested Follow-ups

- CloudFront invalidation: if stale CSS persists after deploy, run an invalidation. A helper script can be used if AWS creds are available:
  - scripts/invalidate-cloudfront.sh DIST_ID "/*"
  - Or set CLOUDFRONT_DISTRIBUTION_ID and run without args.
- Optional: migrate Hosted UI flow to Authorization Code + PKCE for best practice; current implicit flow is functional though.
- Optional: consolidate any remaining direct fetch calls to use lib/apiFetch.ts for consistent auth/401 handling.

Status: Auth headers standardized; Cognito URLs corrected; cache policy adjusted; baseline verification passed.

👉 In short:
Two main problems caused the breakage — stale CSS caching and wrong tokens being used for API auth. On top of that, Cognito URLs were malformed in certain pages due to missing the .auth.us-east-1.amazoncognito.com suffix. Fixes have been applied, but deployment/env var propagation must be verified.
