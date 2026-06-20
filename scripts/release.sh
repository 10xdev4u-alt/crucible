#!/usr/bin/env bash
# Release script for Crucible.
#
# Usage: ./scripts/release.sh <version>
# Example: ./scripts/release.sh 0.1.0
#
# Prerequisites:
# - Clean working tree
# - On main branch
# - NPM_TOKEN env var set
# - gh CLI authenticated

set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.1.0"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash changes first."
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "Must be on main branch (currently on $BRANCH)."
  exit 1
fi

echo "Updating version in packages…"
for pkg in packages/*/package.json; do
  if grep -q '"version"' "$pkg"; then
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$pkg"
    echo "  $pkg"
  fi
done

echo "Updating CHANGELOG.md…"
TODAY=$(date -u +%Y-%m-%d)
sed -i "s/## \[Unreleased\]/## [$VERSION] - $TODAY/" CHANGELOG.md

echo "Committing version bump…"
git add -A
git commit -m "chore: bump version to $VERSION"

echo "Tagging release…"
git tag -a "v$VERSION" -m "Release v$VERSION"

echo "Pushing…"
git push origin main
git push origin "v$VERSION"

echo ""
echo "Release v$VERSION tagged and pushed."
echo "GitHub Actions will:"
echo "  1. Run all CI jobs"
echo "  2. Publish @crucible/core and @crucible/cli to npm"
echo "  3. Create a GitHub release with notes"
echo ""
echo "Watch progress: https://github.com/10xdev4u-alt/crucible/actions"
