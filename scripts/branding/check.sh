#!/usr/bin/env bash
set -euo pipefail

# Branding drift checker for Cognito Managed Login
# Requires: AWS CLI v2 with managed-login commands, jq

POOL_ID=${COGNITO_USER_POOL_ID:?COGNITO_USER_POOL_ID required}
CLIENT_ID=${COGNITO_APP_CLIENT_ID:-}
REGION_OPT=${AWS_REGION:+--region $AWS_REGION}
PROFILE_OPT=${AWS_PROFILE:+--profile $AWS_PROFILE}
SETTINGS_PATH=${SETTINGS_PATH:-brand/managed-login/settings.json}
ENFORCE=${ENFORCE_BRANDING_DRIFT:-false}

need_cmd() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1" >&2; exit 0; }; }
need_cmd aws; need_cmd jq

if [[ -z "$CLIENT_ID" ]]; then
  CLIENT_ID=$(aws cognito-idp list-user-pool-clients $REGION_OPT $PROFILE_OPT --user-pool-id "$POOL_ID" --max-results 60 \
    | jq -r '.UserPoolClients[]?.ClientId' | head -n1)
fi

if [[ -z "$CLIENT_ID" ]]; then
  echo "No app client discovered; skipping drift check."; exit 0
fi

# Discover branding id
if aws help cognito-idp list-managed-login-brandings >/dev/null 2>&1; then
  BID=$(aws cognito-idp list-managed-login-brandings $REGION_OPT $PROFILE_OPT --user-pool-id "$POOL_ID" \
    | jq -r --arg C "$CLIENT_ID" '.ManagedLoginBrandings[] | select(.ClientId==$C) | .ManagedLoginBrandingId' | head -n1)
else
  echo "CLI lacks managed-login list; skipping drift check."; exit 0
fi

if [[ -z "$BID" ]]; then
  echo "No Managed Login style bound to client=$CLIENT_ID"; exit 0
fi

if ! aws help cognito-idp describe-managed-login-branding >/dev/null 2>&1; then
  echo "CLI lacks describe-managed-login-branding; skipping drift check."; exit 0
fi

OBS=$(aws cognito-idp describe-managed-login-branding $REGION_OPT $PROFILE_OPT \
  --user-pool-id "$POOL_ID" --managed-login-branding-id "$BID" --return-merged-resources || true)

if [[ ! -f "$SETTINGS_PATH" ]]; then
  echo "Missing $SETTINGS_PATH; skipping drift check."; exit 0
fi

EXP=$(cat "$SETTINGS_PATH")

echo "Observed branding (truncated):"
echo "$OBS" | jq '{ManagedLoginBrandingId, ClientId, Settings:.Settings}' || true
echo "Expected settings:"
echo "$EXP" | jq '.' || true

# Best-effort compare limited keys if present in observed payload
ok=true

get_or_empty() { echo "$1" | jq -r "$2 // empty" 2>/dev/null || true; }

obs_mode=$(get_or_empty "$OBS" '.Settings.General.ColorMode')
exp_mode=$(get_or_empty "$EXP" '.General.ColorMode')
if [[ -n "$obs_mode" && -n "$exp_mode" && "$obs_mode" != "$exp_mode" ]]; then
  echo "Drift: ColorMode observed=$obs_mode expected=$exp_mode"; ok=false
fi

obs_primary=$(get_or_empty "$OBS" '.Settings.Colors.Primary')
exp_primary=$(get_or_empty "$EXP" '.Colors.Primary')
if [[ -n "$obs_primary" && -n "$exp_primary" && "$obs_primary" != "$exp_primary" ]]; then
  echo "Drift: Colors.Primary observed=$obs_primary expected=$exp_primary"; ok=false
fi

obs_bg=$(get_or_empty "$OBS" '.Settings.Colors.Background')
exp_bg=$(get_or_empty "$EXP" '.Colors.Background')
if [[ -n "$obs_bg" && -n "$exp_bg" && "$obs_bg" != "$exp_bg" ]]; then
  echo "Drift: Colors.Background observed=$obs_bg expected=$exp_bg"; ok=false
fi

if [[ "$ENFORCE" == "true" && "$ok" != "true" ]]; then
  echo "Branding drift detected (enforced)."; exit 1
fi

echo "Branding drift check complete. Enforce=$ENFORCE"
exit 0

