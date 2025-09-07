#!/usr/bin/env bash
set -euo pipefail

# One-time Managed Login branding apply script (no CSS; Managed Login ignores CSS).
# Applies dark mode + primary/background colors. Auto-discovers App Client if not provided.
#
# Env (required):
#   COGNITO_USER_POOL_ID
# Env (optional):
#   COGNITO_APP_CLIENT_ID  (if omitted, script discovers the first client in the pool)
#   AWS_PROFILE            (e.g., mvp)
#   AWS_REGION             (e.g., us-east-1)

REGION_OPT=${AWS_REGION:+--region "$AWS_REGION"}
PROFILE_OPT=${AWS_PROFILE:+--profile "$AWS_PROFILE"}

POOL_ID=${COGNITO_USER_POOL_ID:?COGNITO_USER_POOL_ID required}
CLIENT_ID=${COGNITO_APP_CLIENT_ID:-}

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing $1"; exit 1; }; }
need aws
need jq

say()  { printf "%b\n" "$*"; }
fail() { say "❌ $*"; exit 1; }

discover_client() {
  aws cognito-idp list-user-pool-clients $REGION_OPT $PROFILE_OPT \
    --user-pool-id "$POOL_ID" --max-results 60 \
  | jq -r '.UserPoolClients[]?.ClientId' | head -n1
}

get_branding_id() {
  # Returns branding id for CLIENT_ID if list op is available; else empty
  if aws help cognito-idp list-managed-login-brandings >/dev/null 2>&1; then
    aws cognito-idp list-managed-login-brandings $REGION_OPT $PROFILE_OPT \
      --user-pool-id "$POOL_ID" \
    | jq -r --arg C "$CLIENT_ID" '.ManagedLoginBrandings[] | select(.ClientId==$C) | .ManagedLoginBrandingId' \
    | head -n1
  else
    echo ""
  fi
}

describe_branding() {
  local bid="$1"
  if [[ -z "$bid" ]]; then
    say "ℹ️  No Managed Login branding attached yet."
    return
  fi
  if aws help cognito-idp describe-managed-login-branding >/dev/null 2>&1; then
    aws cognito-idp describe-managed-login-branding $REGION_OPT $PROFILE_OPT \
      --user-pool-id "$POOL_ID" \
      --managed-login-branding-id "$bid" \
      --return-merged-resources
  else
    say "ℹ️  Your AWS CLI does not support describe-managed-login-branding."
  fi
}

# Settings payloads
FULL_JSON='{
  "General": { "ColorMode": "dark" },
  "Colors":  { "Primary": "#0ea5e9", "Background": "#0b0f14" }
}'
MIN_JSON='{
  "General": { "ColorMode": "dark" }
}'

APPLY_SETTINGS() {
  local settings_file="$1"

  # Try create first (binds to App Client)
  if aws help cognito-idp create-managed-login-branding >/dev/null 2>&1; then
    if aws cognito-idp create-managed-login-branding $REGION_OPT $PROFILE_OPT \
      --user-pool-id "$POOL_ID" \
      --client-id "$CLIENT_ID" \
      --settings "file://$settings_file" >/dev/null 2>&1; then
      say "✅ Created Managed Login branding (client=$CLIENT_ID)."
      return 0
    fi
  fi

  # If create failed, try update via discovered branding id
  local BID
  BID="$(get_branding_id)"
  if [[ -n "$BID" ]] && aws help cognito-idp update-managed-login-branding >/dev/null 2>&1; then
    if aws cognito-idp update-managed-login-branding $REGION_OPT $PROFILE_OPT \
      --user-pool-id "$POOL_ID" \
      --managed-login-branding-id "$BID" \
      --settings "file://$settings_file" >/dev/null 2>&1; then
      say "✅ Updated Managed Login branding (id=$BID)."
      return 0
    fi
  fi

  return 1
}

main() {
  if [[ -z "$CLIENT_ID" ]]; then
    CLIENT_ID="$(discover_client)"
    [[ -n "$CLIENT_ID" ]] || fail "No app clients found in pool $POOL_ID. Create an App Client first."
    say "Using discovered App Client ID: $CLIENT_ID"
  fi

  say "🎨 Applying Managed Login branding (pool=$POOL_ID client=$CLIENT_ID)..."

  # Write settings to tmp files
  local FULL_FILE MIN_FILE
  FULL_FILE="$(mktemp)"; MIN_FILE="$(mktemp)"
  printf '%s' "$FULL_JSON" > "$FULL_FILE"
  printf '%s' "$MIN_JSON" > "$MIN_FILE"

  # Try full payload; if it fails (UnknownProperty, etc.), fallback to minimal
  if APPLY_SETTINGS "$FULL_FILE"; then
    say "✅ Managed Login branding applied (full)."
  elif APPLY_SETTINGS "$MIN_FILE"; then
    say "✅ Managed Login branding applied (minimal ColorMode only)."
    say "ℹ️  Your CLI/tenant rejected some fields in full payload. Add fields back later from console."
  else
    rm -f "$FULL_FILE" "$MIN_FILE"
    fail "Could not apply Managed Login branding via CLI. Set values via console Branding panel instead."
  fi

  # Show summary if describe op exists
  local BID
  BID="$(get_branding_id)"
  describe_branding "$BID" || true

  rm -f "$FULL_FILE" "$MIN_FILE"
}

main
