#!/bin/bash
# Publish to GitHub Pages.
#   ./deploy.sh              first run — creates the repo and turns Pages on
#   ./deploy.sh "message"    later — push an update
set -euo pipefail
cd "$(dirname "$0")"
REPO="saturday-league-web"

gh auth status >/dev/null 2>&1 || { echo "Run: gh auth login"; exit 1; }
USER=$(gh api user --jq .login)

if git remote get-url origin >/dev/null 2>&1; then
  git add -A
  git commit -m "${1:-Update Saturday League}" || echo "Nothing to commit."
  git push
  echo "Pushed. Live in about a minute: https://$USER.github.io/$REPO/"
  exit 0
fi

gh repo create "$REPO" --public --source=. --remote=origin --push
gh api -X POST "repos/$USER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 \
  || gh api -X PUT "repos/$USER/$REPO/pages" -f "source[branch]=main" -f "source[path]=/" >/dev/null

echo
echo "Live in about a minute:  https://$USER.github.io/$REPO/"
echo "On your iPhone: open it in Safari, then Share -> Add to Home Screen."
