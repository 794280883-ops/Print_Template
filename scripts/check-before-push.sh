#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Checking backend JavaScript syntax..."
node --check backend/src/server.js
node --check backend/src/app.js
node --check backend/src/controllers/businessDataController.js
node --check backend/src/repositories/businessDataRepository.js
node --check backend/src/routes/businessData.routes.js
node --check backend/src/services/businessDataService.js

echo "Running frontend production build..."
npm --prefix frontend run build

echo "Scanning tracked and staged changes for common secret patterns..."
SECRET_PATTERN='(BEGIN .*PRIVATE KEY|PRIVATE_KEY=|PASSWORD=[^[:space:]]+|password:[^[:space:]]+|mysql://[^[:space:]]+:[^[:space:]@]+@|jdbc:mysql://10\.)'

if git diff --cached -- . ':(exclude)scripts/check-before-push.sh' | rg -n "$SECRET_PATTERN" >/tmp/wms_secret_scan_cached.txt; then
  echo "Potential secret found in staged changes:"
  cat /tmp/wms_secret_scan_cached.txt
  exit 1
fi

if git diff -- . ':(exclude)scripts/check-before-push.sh' | rg -n "$SECRET_PATTERN" >/tmp/wms_secret_scan_worktree.txt; then
  echo "Potential secret found in unstaged changes:"
  cat /tmp/wms_secret_scan_worktree.txt
  exit 1
fi

echo "Checking ignored env files are not tracked..."
if git ls-files | rg '(^|/)\.env$|(^|/)\.env\.test$|(^|/)\.env\.production$' >/tmp/wms_tracked_env_files.txt; then
  echo "Tracked env file detected:"
  cat /tmp/wms_tracked_env_files.txt
  exit 1
fi

echo "All pre-push checks passed."
