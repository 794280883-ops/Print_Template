#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing local env file: $ENV_FILE"
  echo "Create it first: cp .env.example .env"
  exit 1
fi

cd "$ROOT_DIR"

echo "Checking existing local MySQL on 127.0.0.1:3306..."
if ! nc -z 127.0.0.1 3306 >/dev/null 2>&1; then
  echo "Local MySQL is not reachable on 127.0.0.1:3306."
  echo "Start your existing MySQL container from Docker Desktop first."
  echo "DataGrip can be used to inspect the same database, but it does not start MySQL."
  exit 1
fi

echo "Running database migrations..."
cd "$ROOT_DIR/backend"
ENV_FILE="$ENV_FILE" npm run migrate

cleanup() {
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting backend dev server: http://127.0.0.1:3001"
ENV_FILE="$ENV_FILE" npm run dev &
BACKEND_PID=$!

echo "Starting frontend dev server: http://127.0.0.1:5173"
cd "$ROOT_DIR/frontend"
npm run dev -- --host 127.0.0.1 &
FRONTEND_PID=$!

echo
echo "Local dev is ready when both servers finish booting:"
echo "  App:    http://127.0.0.1:5173"
echo "  Health: http://127.0.0.1:3001/api/v1/health"
echo
echo "Press Ctrl+C to stop frontend/backend. Your existing MySQL service will keep running."

wait "$BACKEND_PID" "$FRONTEND_PID"
