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

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
  echo 'ERROR: .env file not found on server. Please create it from .env.production.example first.'
  exit 1
fi

# 检查 JWT_SECRET 和 CORS_ORIGIN 是否已配置
if ! grep -q '^JWT_SECRET=.' .env 2>/dev/null || grep -q '^JWT_SECRET=replace_with' .env 2>/dev/null; then
  echo 'ERROR: JWT_SECRET is not configured in .env. Please generate one with: openssl rand -hex 32'
  exit 1
fi

if ! grep -q '^CORS_ORIGIN=.\+' .env 2>/dev/null; then
  echo 'ERROR: CORS_ORIGIN is not configured in .env. Please set it to your production domain (e.g. https://customprint.icu).'
  exit 1
fi

git fetch origin '$BRANCH' 2>/dev/null || true
git checkout '$BRANCH'
git pull --ff-only origin '$BRANCH' 2>/dev/null || true

CHANGED=\$(git diff --name-only HEAD~1 2>/dev/null || echo '')
BUILD_BACKEND=0
BUILD_FRONTEND=0

if echo \"\$CHANGED\" | grep -q '^backend/'; then BUILD_BACKEND=1; fi
if echo \"\$CHANGED\" | grep -q '^frontend/'; then BUILD_FRONTEND=1; fi
if echo \"\$CHANGED\" | grep -q '^nginx/\|^docker-compose'; then BUILD_BACKEND=1; BUILD_FRONTEND=1; fi
[ -z \"\$CHANGED\" ] && { BUILD_BACKEND=1; BUILD_FRONTEND=1; }

if [ \"\$BUILD_BACKEND\" = '1' ] && [ \"\$BUILD_FRONTEND\" = '1' ]; then
  DOCKER_BUILDKIT=1 docker compose up -d --build
elif [ \"\$BUILD_BACKEND\" = '1' ]; then
  DOCKER_BUILDKIT=1 docker compose up -d --build backend
elif [ \"\$BUILD_FRONTEND\" = '1' ]; then
  DOCKER_BUILDKIT=1 docker compose up -d --build frontend
else
  docker compose up -d --force-recreate
fi

docker compose ps
sleep 3
curl -fsSk https://127.0.0.1/api/v1/health
"

echo
echo "Deployment finished:"
echo "  https://customprint.icu"
echo "  https://customprint.icu/api/v1/health"
