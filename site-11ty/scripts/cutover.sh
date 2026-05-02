#!/usr/bin/env bash
#
# Cutover script: replaces the Astro site at the repo root with the new 11ty site
# from site-11ty/. Run from the repo root after you've verified the new site
# locally (cd site-11ty && npm run serve).
#
# This script:
#   1. Removes Astro-specific files at the repo root
#   2. Moves site-11ty/* up to the repo root
#   3. Promotes .github-staged/workflows/ to .github/workflows/
#
# It does NOT push to git — you do that yourself after reviewing the diff.

set -euo pipefail

cd "$(dirname "$0")/.."   # repo root

if [ ! -d site-11ty ]; then
  echo "Error: site-11ty/ not found. Run from the repo root." >&2
  exit 1
fi

echo "==> Removing Astro artifacts at repo root..."
rm -rf \
  src \
  public \
  new \
  astro.config.ts \
  tailwind.config.ts \
  postcss.config.cjs \
  biome.json \
  tsconfig.json \
  pnpm-lock.yaml \
  package-lock.json \
  package.json \
  netlify.toml \
  flnzba.github.io.code-workspace \
  florian-info.md

echo "==> Replacing GitHub workflows..."
rm -f .github/workflows/deploy.yml
mv site-11ty/.github-staged/workflows/* .github/workflows/
rmdir site-11ty/.github-staged/workflows site-11ty/.github-staged

echo "==> Moving site-11ty/* to repo root..."
# Use shopt to include dotfiles
shopt -s dotglob
mv site-11ty/* .
shopt -u dotglob
rmdir site-11ty

echo
echo "==> Done. Review with: git status; git diff --stat"
echo "    Then commit and push to deploy."
