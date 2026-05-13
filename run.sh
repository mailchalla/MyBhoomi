#!/bin/bash
# MyBooomi — run both backend and frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend/backend"
FRONTEND_DIR="$SCRIPT_DIR/backend/frontend"

echo "=== MyBooomi ==="

# ── Backend ────────────────────────────────────────────────────────────
echo ""
echo "Starting backend (http://localhost:3001)..."
cd "$BACKEND_DIR"

# Check if deps are installed
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi

# Create .env from .env.example if missing
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "Created .env from .env.example — update JWT_SECRET before production!"
fi

npm run dev &
BACKEND_PID=$!

# ── Frontend ────────────────────────────────────────────────────────────
echo ""
echo "Starting frontend (http://localhost:3000)..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!

# ── Wait ─────────────────────────────────────────────────────────────────
echo ""
echo "MyBooomi is running!"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop."

# Cleanup on exit
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
