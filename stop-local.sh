#!/usr/bin/env bash
# ==============================================================================
# HomeReady AI - Local Development Shutdown Script
# Stops FastAPI backend and Next.js frontend servers running on ports 8000 & 3000.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PID_FILE="$ROOT_DIR/.backend.pid"
FRONTEND_PID_FILE="$ROOT_DIR/.frontend.pid"

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[!] Shutting down HomeReady AI development servers...${NC}"

# Kill by PID file if available
if [ -f "$BACKEND_PID_FILE" ]; then
    kill $(cat "$BACKEND_PID_FILE") 2>/dev/null || true
    rm -f "$BACKEND_PID_FILE"
fi

if [ -f "$FRONTEND_PID_FILE" ]; then
    kill $(cat "$FRONTEND_PID_FILE") 2>/dev/null || true
    rm -f "$FRONTEND_PID_FILE"
fi

# Clean up any lingering processes on ports 8000 and 3000
for port in 8000 3000; do
    if lsof -t -i:$port >/dev/null 2>&1; then
        lsof -t -i:$port | xargs kill -9 2>/dev/null || true
    fi
done

echo -e "${GREEN}[✓] HomeReady AI servers stopped cleanly.${NC}"
