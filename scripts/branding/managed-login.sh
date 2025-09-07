#!/usr/bin/env bash
set -euo pipefail

OPERATION="${1:-}"; shift || true
REQUESTED_CLIENT_ID="${1:-}"

REGION=${AWS_REGION:-}
PROFILE_OPT=${AWS_PROFILE:+--profile $AWS_PROFILE}
REGION_OPT=${REGION:+--region $REGION}
POOL_ID=${COGNITO_USER_POOL_ID:-}
SETTINGS_PATH=${SETTINGS_PATH:-brand/managed-login/settings.json}
STATE_DIR=${STATE_DIR:-.branding}

CLI_BIN=${CLI_BIN:-aws}

usage() {
  cat <<EOF
Usage:
  COGNITO_USER_POOL_ID=... [COGNITO_APP_CLIENT_ID=...] [AWS_PROFILE=...] [AWS_REGION=...] $0 apply|status|reset [CLIENT_ID]
EOF
}

need_pool() {
  if [[ -z "${POOL_ID}" ]]; then
    echo "Missing COGNITO_USER_POOL_ID" >&2
    exit 1
  fi
}

ensure_state_dir() { mkdir -p "$STATE_DIR"; }

get_style_id() {
  local client_id="$1"
  if [[ -f "$STATE_DIR/${POOL_ID}_${client_id}.json" ]]; then
    jq -r '.ManagedLoginBrandingId // empty' "$STATE_DIR/${POOL_ID}_${client_id}.json" || true
    return
  fi
  if $CLI_BIN help cognito-idp list-managed-login-brandings >/dev/null 2>&1; then
    $CLI_BIN cognito-idp list-managed-login-brandings \
      $REGION_OPT $PROFILE_OPT \
      --user-pool-id "$POOL_ID" \
      | jq -r --arg C "$client_id" '.ManagedLoginBrandings[] | select(.ClientId==$C) | .ManagedLoginBrandingId' \
      | head -n1
  else
    echo ""
  fi
}

save_state() {
  ensure_state_dir
  echo "$1" > "$STATE_FILE"
}

cmd_apply() {
  need_pool
  if [[ ! -f "$SETTINGS_PATH" ]]; then
    echo "Missing settings: $SETTINGS_PATH" >&2
    exit 1
  fi
  local cid
  cid="${REQUESTED_CLIENT_ID:-${COGNITO_APP_CLIENT_ID:-}}"
  if [[ -z "$cid" ]]; then
    cid=$($CLI_BIN cognito-idp list-user-pool-clients $REGION_OPT $PROFILE_OPT --user-pool-id "$POOL_ID" --max-results 60 | jq -r '.UserPoolClients[]?.ClientId' | head -n1)
    [[ -n "$cid" ]] || { echo "No app clients found in pool $POOL_ID" >&2; exit 1; }
  fi
  echo "Applying Managed Login branding (pool=$POOL_ID client=$cid)..."
  # Try update by discovered branding id
  local bid
  bid=$(get_style_id "$cid")
  if [[ -n "$bid" ]] && $CLI_BIN help cognito-idp update-managed-login-branding >/dev/null 2>&1; then
    set +e
    $CLI_BIN cognito-idp update-managed-login-branding $REGION_OPT $PROFILE_OPT \
      --user-pool-id "$POOL_ID" \
      --managed-login-branding-id "$bid" \
      --settings file://"$SETTINGS_PATH"
    rc=$?
    set -e
    if [[ $rc -eq 0 ]]; then
      echo "✅ Branding updated"
      exit 0
    fi
    echo "⚠️  Update failed; attempting create…"
  fi
  # Create if none
  $CLI_BIN cognito-idp create-managed-login-branding $REGION_OPT $PROFILE_OPT \
    --user-pool-id "$POOL_ID" \
    --client-id "$cid" \
    --settings file://"$SETTINGS_PATH" \
    --query 'ManagedLoginBranding.ManagedLoginBrandingId' --output text | {
      read -r new_id || true; \
      if [[ -n "${new_id:-}" ]]; then echo "✅ Created branding: $new_id"; fi; }
}

cmd_status() {
  need_pool
  local cid
  cid="${REQUESTED_CLIENT_ID:-${COGNITO_APP_CLIENT_ID:-}}"
  if [[ -z "$cid" ]]; then
    cid=$($CLI_BIN cognito-idp list-user-pool-clients $REGION_OPT $PROFILE_OPT --user-pool-id "$POOL_ID" --max-results 60 | jq -r '.UserPoolClients[]?.ClientId' | head -n1)
  fi
  bid=$(get_style_id "$cid")
  if [[ -z "$bid" ]]; then
    echo "No Managed Login style bound to client=$cid"
    exit 0
  fi
  $CLI_BIN cognito-idp describe-managed-login-branding $REGION_OPT $PROFILE_OPT \
    --user-pool-id "$POOL_ID" \
    --managed-login-branding-id "$bid" \
    --return-merged-resources
}

cmd_reset() {
  need_pool
  local cid
  cid="${REQUESTED_CLIENT_ID:-${COGNITO_APP_CLIENT_ID:-}}"
  if [[ -z "$cid" ]]; then
    cid=$($CLI_BIN cognito-idp list-user-pool-clients $REGION_OPT $PROFILE_OPT --user-pool-id "$POOL_ID" --max-results 60 | jq -r '.UserPoolClients[]?.ClientId' | head -n1)
  fi
  bid=$(get_style_id "$cid")
  if [[ -z "$bid" ]]; then
    echo "No style to delete (client=$cid)"
    exit 0
  fi
  if $CLI_BIN help cognito-idp delete-managed-login-branding >/dev/null 2>&1; then
    $CLI_BIN cognito-idp delete-managed-login-branding $REGION_OPT $PROFILE_OPT \
      --user-pool-id "$POOL_ID" \
      --managed-login-branding-id "$bid"
    echo "✅ Managed Login branding deleted"
  else
    echo "Your CLI lacks delete-managed-login-branding; upgrade to AWS CLI v2"
  fi
}

case "$OPERATION" in
  apply) cmd_apply ;;
  status) cmd_status ;;
  reset) cmd_reset ;;
  *) usage; exit 1 ;;
esac
