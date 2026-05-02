#!/usr/bin/env bash
#
# Sync local .env values to GitHub Actions secrets for this repo.
# Reads ./env (gitignored), pushes each KEY=VALUE pair via `gh secret set`.
#
# Requirements: gh CLI authenticated (gh auth login).
# Usage:        npm run secrets:push   (or)   bash scripts/sync-secrets.sh

set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Copy .env.example to .env and fill in values." >&2
  exit 1
fi

echo "==> Syncing secrets from $ENV_FILE to $REPO ..."

while IFS= read -r line || [ -n "$line" ]; do
  # Skip comments and empty lines
  case "$line" in
    \#*|"") continue ;;
  esac

  key="${line%%=*}"
  value="${line#*=}"
  # Trim surrounding whitespace and quotes from value
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"

  if [ -z "${value:-}" ]; then
    echo "  - $key (empty, skipped)"
    continue
  fi

  printf '  + %s ... ' "$key"
  printf '%s' "$value" | gh secret set "$key" --repo "$REPO" --body - >/dev/null
  echo "ok"
done < "$ENV_FILE"

echo "==> Done. Verify with: gh secret list --repo $REPO"
