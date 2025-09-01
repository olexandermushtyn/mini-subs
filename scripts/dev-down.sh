#!/usr/bin/env bash
set -euo pipefail

# ── paths ──────────────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

echo ">>> Stopping all services and infrastructure..."

# Stop all Node.js processes that might be running the services
echo ">>> Stopping Node.js processes..."
pkill -f "ts-node-dev" || true
pkill -f "nest start" || true
pkill -f "pnpm start:dev" || true

# Stop all Docker containers
echo ">>> Stopping Docker containers..."
docker compose -f "$COMPOSE_FILE" down

echo ">>> All services and infrastructure stopped."
