#!/usr/bin/env bash

set -euo pipefail

# Copy canonical prompts into lambda/handlers for SAM build packaging

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CANONICAL_PROMPTS_DIR="$BACKEND_DIR/prompts"
CANONICAL_TXT_DIR="$BACKEND_DIR/prompts-txt"  # optional legacy text prompts

HANDLERS_DIR="$BACKEND_DIR/lambda/handlers"
HANDLERS_PROMPTS_DIR="$HANDLERS_DIR/prompts"
HANDLERS_TXT_DIR="$HANDLERS_DIR/prompts-txt"

copy_dir() {
  local src="$1"
  local dest="$2"
  local rsync_flags="-avh --delete"
  if [ "${DRY_RUN:-}" = "true" ]; then
    rsync_flags="$rsync_flags --dry-run"
  fi
  if command -v rsync >/dev/null 2>&1; then
    echo "rsync $rsync_flags \"$src/\" \"$dest/\""
    rsync $rsync_flags "$src/" "$dest/"
  else
    echo "cp -Rv \"$src/.\" \"$dest/\""
    mkdir -p "$dest"
    if [ "${DRY_RUN:-}" = "true" ]; then
      find "$src" -type f -print | sed "s|^|DRY_RUN would copy: |"
    else
      cp -Rv "$src/." "$dest/"
    fi
  fi
}

echo "==============================================="
echo "📤 Copying prompts into handlers for build"
echo "==============================================="

# Always reset handler prompt folders before copying
echo "🧹 Preparing handlers prompt folders..."
if [ "${DRY_RUN:-}" = "true" ]; then
  echo "DRY_RUN would remove: $HANDLERS_PROMPTS_DIR $HANDLERS_TXT_DIR"
else
  rm -rf "$HANDLERS_PROMPTS_DIR" "$HANDLERS_TXT_DIR"
  mkdir -p "$HANDLERS_PROMPTS_DIR" "$HANDLERS_TXT_DIR"
fi

echo "📦 Copying JS module prompts → handlers/prompts"
if [ -d "$CANONICAL_PROMPTS_DIR" ]; then
  copy_dir "$CANONICAL_PROMPTS_DIR" "$HANDLERS_PROMPTS_DIR"
else
  echo "❗ Missing canonical prompts directory: $CANONICAL_PROMPTS_DIR"
fi

if [ -d "$CANONICAL_TXT_DIR" ]; then
  echo "📦 Copying text prompts → handlers/prompts-txt"
  copy_dir "$CANONICAL_TXT_DIR" "$HANDLERS_TXT_DIR"
else
  echo "ℹ️  No canonical prompts-txt directory (expected when using JS modules only)"
fi

echo "✅ Prompts copied for build."


