#!/usr/bin/env bash
set -e

# --- CONFIG: adjust only if your folder names change ---
BACKEND_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$BACKEND_ROOT/insightx-frontend"
BACKEND_PORT=8000

echo "Backend root:   $BACKEND_ROOT"
echo "Frontend dir:   $FRONTEND_DIR"
echo "Backend port:   $BACKEND_PORT"
echo

# --- Load GEMINI_API_KEY from .env if present ---
if [ -f "$BACKEND_ROOT/.env" ]; then
  GEMINI_LINE=$(grep -E '^GEMINI_API_KEY=' "$BACKEND_ROOT/.env" | tail -n 1 || true)
  if [ -n "$GEMINI_LINE" ]; then
    GEMINI_VALUE="${GEMINI_LINE#GEMINI_API_KEY=}"
    # strip any surrounding quotes
    GEMINI_VALUE="${GEMINI_VALUE%\"}"
    GEMINI_VALUE="${GEMINI_VALUE#\"}"
    export GEMINI_API_KEY="$GEMINI_VALUE"
    echo "Loaded GEMINI_API_KEY from .env"
  else
    echo "Warning: GEMINI_API_KEY not found in .env"
  fi
else
  echo "Warning: .env file not found at $BACKEND_ROOT/.env"
fi

# --- Start backend (FastAPI + uvicorn) in background ---
cd "$BACKEND_ROOT"

echo "Starting backend (uvicorn app:app --reload --port $BACKEND_PORT)..."
python3 -m uvicorn app:app --reload --port "$BACKEND_PORT" &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo

# Ensure backend is killed when this script is stopped (Ctrl+C)
cleanup() {
  echo
  echo "Stopping backend (PID $BACKEND_PID)..."
  kill "$BACKEND_PID" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

# --- Start frontend (Vite) in foreground ---
cd "$FRONTEND_DIR"
echo "Starting frontend (npm run dev)..."
echo

# Optional: first-time install (safe if already installed)
if [ ! -d "node_modules" ]; then
  echo "node_modules not found, running npm install..."
  npm install
fi

npm run dev

# If npm run dev exits normally, still cleanup backend
cleanup
