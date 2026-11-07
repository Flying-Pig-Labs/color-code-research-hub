#!/usr/bin/env bash
set -euo pipefail

# CloudFront invalidation helper
# Usage:
#   scripts/invalidate-cloudfront.sh DISTRIBUTION_ID [PATHS]
# Example:
#   scripts/invalidate-cloudfront.sh E123ABCDEF0123 "/*"
#
# If DISTRIBUTION_ID is omitted, the script will use $CLOUDFRONT_DISTRIBUTION_ID.
# If PATHS is omitted, defaults to "/*".

DIST_ID="${1:-${CLOUDFRONT_DISTRIBUTION_ID:-}}"
PATHS="${2:-/*}"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found. Install https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" >&2
  exit 1
fi

if [[ -z "${DIST_ID}" ]]; then
  echo "Distribution ID not provided. Set CLOUDFRONT_DISTRIBUTION_ID or pass as first arg." >&2
  exit 1
fi

echo "Creating CloudFront invalidation for distribution ${DIST_ID} paths: ${PATHS}"
aws cloudfront create-invalidation \
  --distribution-id "${DIST_ID}" \
  --paths "${PATHS}" \
  --query 'Invalidation.Id' \
  --output text

echo "Invalidation requested. It may take a few minutes to complete."

