#!/usr/bin/env bash

set -euo pipefail

# Enable debug tracing if DEBUG=true
if [ "${DEBUG:-}" = "true" ]; then
  set -x
fi

# Synchronize canonical prompts from backend/prompts* to lambda/handlers for packaging

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

CANONICAL_PROMPTS_DIR="$BACKEND_DIR/prompts"
CANONICAL_TXT_DIR="$BACKEND_DIR/prompts-txt"  # retained temporarily for legacy callers

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
    # Fallback to cp -R (no delete of removed files)
    echo "cp -Rv \"$src/.\" \"$dest/\""
    mkdir -p "$dest"
    if [ "${DRY_RUN:-}" = "true" ]; then
      # List what would be copied
      find "$src" -type f -print | sed "s|^|DRY_RUN would copy: |"
    else
      cp -Rv "$src/." "$dest/"
    fi
  fi
}

echo "==============================================="
echo "🔁 Syncing prompts between canonical and handlers"
echo "==============================================="

# Seed canonical directories from handlers if canonical doesn't exist yet
if [ ! -d "$CANONICAL_PROMPTS_DIR" ]; then
  echo "⚙️  Canonical prompts dir missing. Seeding from handlers..."
  if [ -d "$HANDLERS_PROMPTS_DIR" ]; then
    mkdir -p "$CANONICAL_PROMPTS_DIR"
    copy_dir "$HANDLERS_PROMPTS_DIR" "$CANONICAL_PROMPTS_DIR"
  else
    mkdir -p "$CANONICAL_PROMPTS_DIR"
  fi
fi

if [ ! -d "$CANONICAL_TXT_DIR" ]; then
  echo "⚙️  Canonical prompts-txt dir missing. Seeding from handlers..."
  if [ -d "$HANDLERS_TXT_DIR" ]; then
    mkdir -p "$CANONICAL_TXT_DIR"
    copy_dir "$HANDLERS_TXT_DIR" "$CANONICAL_TXT_DIR"
  else
    mkdir -p "$CANONICAL_TXT_DIR"
  fi
fi

# Ensure handlers have the canonical content for packaging
echo "🧹 Resetting handlers prompt folders..."
if [ "${DRY_RUN:-}" = "true" ]; then
  echo "DRY_RUN would remove: $HANDLERS_PROMPTS_DIR $HANDLERS_TXT_DIR"
else
  rm -rf "$HANDLERS_PROMPTS_DIR" "$HANDLERS_TXT_DIR"
  mkdir -p "$HANDLERS_PROMPTS_DIR" "$HANDLERS_TXT_DIR"
fi

echo "📤 Copying canonical → handlers (prompts)"
if [ -d "$CANONICAL_PROMPTS_DIR" ]; then
  copy_dir "$CANONICAL_PROMPTS_DIR" "$HANDLERS_PROMPTS_DIR"
else
  echo "❗ Canonical prompts dir missing: $CANONICAL_PROMPTS_DIR"
fi

if [ -d "$CANONICAL_TXT_DIR" ]; then
  echo "📤 Copying canonical → handlers (prompts-txt)"
  copy_dir "$CANONICAL_TXT_DIR" "$HANDLERS_TXT_DIR"
else
  echo "ℹ️  No canonical prompts-txt directory (expected if migrated to JS modules)"
fi

echo "✅ Prompt sync complete."

echo ""
echo "📂 Canonical prompts (source): $CANONICAL_PROMPTS_DIR"
if [ -d "$CANONICAL_PROMPTS_DIR" ]; then
  ls -la "$CANONICAL_PROMPTS_DIR"
fi
echo ""
echo "📂 Handlers prompts (packaged): $HANDLERS_PROMPTS_DIR"
if [ -d "$HANDLERS_PROMPTS_DIR" ]; then
  ls -la "$HANDLERS_PROMPTS_DIR"
fi



