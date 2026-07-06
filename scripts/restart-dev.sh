#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

# 停止已有服务
echo "Stopping existing services..."
kill $(lsof -ti :3001) 2>/dev/null || true
kill $(lsof -ti :5173) 2>/dev/null || true
sleep 1

# 启动后端
echo "Starting backend..."
cd "$ROOT_DIR/backend"
ENV_FILE="$ENV_FILE" nohup npm run dev > /tmp/wms-backend.log 2>&1 &

# 启动前端
echo "Starting frontend..."
cd "$ROOT_DIR/frontend"
nohup npm run dev -- --host 127.0.0.1 > /tmp/wms-frontend.log 2>&1 &

# 等待服务就绪
echo "Waiting for services..."
for i in $(seq 1 15); do
  if lsof -i :3001 -sTCP:LISTEN > /dev/null 2>&1 && lsof -i :5173 -sTCP:LISTEN > /dev/null 2>&1; then
    echo
    echo "Services restarted successfully:"
    echo "  Frontend: http://127.0.0.1:5173"
    echo "  Backend:  http://127.0.0.1:3001"
    echo "  Health:   http://127.0.0.1:3001/api/v1/health"
    echo "  Logs:     tail -f /tmp/wms-backend.log /tmp/wms-frontend.log"
    exit 0
  fi
  sleep 1
done

echo "Warning: services may not have started in time. Check logs:"
echo "  tail -f /tmp/wms-backend.log /tmp/wms-frontend.log"
