#!/usr/bin/env bash
set -euo pipefail

SERVER_HOST="${SERVER_HOST:-47.113.118.74}"
SERVER_USER="${SERVER_USER:-root}"
SERVER_DIR="${SERVER_DIR:-/opt/wms-print-template-center}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/wms_deploy_key}"
BRANCH="${BRANCH:-main}"

if [ ! -f "$SSH_KEY" ]; then
  echo "Missing SSH key: $SSH_KEY"
  echo "Set SSH_KEY=/path/to/key or restore /tmp/wms_deploy_key."
  exit 1
fi

echo "Deploying branch '$BRANCH' to $SERVER_USER@$SERVER_HOST:$SERVER_DIR"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "
set -e
cd '$SERVER_DIR'
git fetch origin '$BRANCH'
git checkout '$BRANCH'
git pull --ff-only origin '$BRANCH'
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
curl -fsS http://127.0.0.1/api/v1/health
"

echo
echo "Deployment finished:"
echo "  https://customprint.icu"
echo "  https://customprint.icu/api/v1/health"
