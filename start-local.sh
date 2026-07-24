#!/usr/bin/env bash
# ==============================================================================
# HomeReady AI - Local Development Startup Script
# Starts FastAPI backend (port 8000) and Next.js frontend (port 3000) locally.
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

BACKEND_LOG="$ROOT_DIR/.backend.log"
FRONTEND_LOG="$ROOT_DIR/.frontend.log"

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}        HomeReady AI - Local Dev Environment          ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check if ports 8000 or 3000 are in use and clean up existing instances
cleanup_ports() {
    for port in 8000 3000; do
        if lsof -t -i:$port >/dev/null 2>&1; then
            echo -e "${YELLOW}[!] Port $port is currently in use. Stopping stale process...${NC}"
            lsof -t -i:$port | xargs kill -9 2>/dev/null || true
        fi
    done
}

cleanup_ports

# Verify backend virtual environment exists
if [ ! -d "$BACKEND_DIR/.venv" ]; then
    echo -e "${RED}[x] Error: Backend virtual environment not found at $BACKEND_DIR/.venv${NC}"
    echo -e "Please create it using: cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -e ."
    exit 1
fi

# Verify frontend node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}[!] Frontend dependencies not installed. Running npm install...${NC}"
    (cd "$FRONTEND_DIR" && npm install)
fi

# 1. Start FastAPI Backend
echo -e "${GREEN}[+] Starting FastAPI Backend on http://127.0.0.1:8000...${NC}"
cd "$BACKEND_DIR"
"$BACKEND_DIR/.venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8000 --reload > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
cd "$ROOT_DIR"

# Wait for Backend to be ready
echo -n "Waiting for Backend API to initialize..."
for i in {1..15}; do
    if curl -s http://127.0.0.1:8000/api/v1/contractors >/dev/null 2>&1; then
        echo -e " ${GREEN}READY!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 15 ]; then
        echo -e " ${RED}TIMEOUT${NC}"
        echo -e "${RED}[x] Backend failed to respond in time. Check logs at $BACKEND_LOG${NC}"
    fi
done

# 2. Start Next.js Frontend
echo -e "${GREEN}[+] Starting Next.js Frontend Dev Server on http://localhost:3000...${NC}"
cd "$FRONTEND_DIR"
npm run dev -- -p 3000 > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
cd "$ROOT_DIR"

# Save PIDs for stop script
echo "$BACKEND_PID" > "$ROOT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$ROOT_DIR/.frontend.pid"

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ✓ HomeReady AI is running successfully!            ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "  • ${BLUE}Frontend UI:${NC}    http://localhost:3000"
echo -e "  • ${BLUE}Backend API:${NC}    http://127.0.0.1:8000"
echo -e "  • ${BLUE}API Docs:${NC}       http://127.0.0.1:8000/docs"
echo -e "  • ${BLUE}Backend Logs:${NC}   $BACKEND_LOG"
echo -e "  • ${BLUE}Frontend Logs:${NC}  $FRONTEND_LOG"
echo -e "${GREEN}======================================================${NC}"

# Handle daemon mode flag (-d / --daemon)
if [[ "$1" == "-d" || "$1" == "--daemon" ]]; then
    echo -e "${YELLOW}[i] Running in detached daemon mode. To shut down servers later, run: ./stop-local.sh${NC}"
    exit 0
fi

# Foreground mode trap
echo -e "${YELLOW}[i] Running in interactive mode. Press Ctrl+C to shut down both servers.${NC}\n"

# Trap interrupt signal to cleanly shut down background processes when Ctrl+C is pressed
trap 'echo -e "\n${YELLOW}[!] Shutting down servers...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; rm -f "$ROOT_DIR/.backend.pid" "$ROOT_DIR/.frontend.pid"; echo -e "${GREEN}[✓] Clean shutdown complete.${NC}"; exit 0' SIGINT SIGTERM

# Tail both log files simultaneously
tail -f "$BACKEND_LOG" "$FRONTEND_LOG"
