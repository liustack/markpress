#!/usr/bin/env bash
set -euo pipefail

# Release workflow: build → tag → push tag → publish to npm

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

echo "Releasing ${TAG}..."

# 1. Build
pnpm build

# 2. Tag
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists, skipping"
else
  git tag "${TAG}"
  echo "Created tag ${TAG}"
fi

# 3. Push tag
git push origin "${TAG}"

# 4. Publish
pnpm publish --access public --no-git-checks

echo "Published @liustack/markpress@${VERSION}"
