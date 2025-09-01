#!/usr/bin/env bash
set -euo pipefail

# ── paths ──────────────────────────────────────────────────────────────────────
# repo root: microservices-pet/
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

AUTH_DIR="$ROOT_DIR/services/auth-svc"
SUBS_DIR="$ROOT_DIR/services/subscriptions-svc"

# Health check URLs
AUTH_HEALTH_URL="http://localhost:3000/v1/auth/health"
SUBS_HEALTH_URL="http://localhost:3001/v1/subscriptions/health"

echo ">>> Starting all services in development mode"
echo ">>> Using compose file: $COMPOSE_FILE"

# ── 1) start infra containers ─────────────────────────────────────────────────
echo ">>> Starting infra containers (pg-auth, pg-subs, redis)..."
docker compose -f "$COMPOSE_FILE" up -d pg-auth pg-subs redis

# ── 2) wait for Postgres instances to be healthy ─────────────────────────────
echo ">>> Waiting for pg-auth to be healthy..."
docker compose -f "$COMPOSE_FILE" exec -T pg-auth bash -lc \
  'until pg_isready -h localhost -U postgres >/dev/null 2>&1; do sleep 1; done'
echo ">>> pg-auth is ready."

echo ">>> Waiting for pg-subs to be healthy..."
docker compose -f "$COMPOSE_FILE" exec -T pg-subs bash -lc \
  'until pg_isready -h localhost -U postgres >/dev/null 2>&1; do sleep 1; done'
echo ">>> pg-subs is ready."

# ── 3) run prisma migrations for all services ────────────────────────────────
export PRISMA_SKIP_ENV_LOAD=1

echo ">>> Running prisma generate & migrate for auth-svc..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/auth"
( cd "$AUTH_DIR" && \
  pnpm exec prisma generate && \
  pnpm exec prisma migrate deploy )

echo ">>> Running prisma generate & migrate for subscriptions-svc..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:5434/subscriptions"
( cd "$SUBS_DIR" && \
  pnpm exec prisma generate && \
  pnpm exec prisma migrate deploy )

# ── 4) build common packages ──────────────────────────────────────────────────
echo ">>> Building common packages..."
( cd "$ROOT_DIR" && \
  pnpm -w --filter @minisubs/common build && \
  pnpm -w --filter @minisubs/contracts build )

# ── 5) start all services in parallel ────────────────────────────────────────
echo ">>> Starting all services in development mode..."
echo ">>> Services will be available at:"
echo "    - auth-svc: http://localhost:3000"
echo "    - subscriptions-svc: http://localhost:3001"
echo ">>> Press Ctrl+C to stop all services"

# Function to start a service
start_service() {
    local service_name="$1"
    local service_dir="$2"
    local port="$3"
    
    echo ">>> Starting $service_name on port $port..."
    cd "$service_dir"
    pnpm start:dev &
    local pid=$!
    echo ">>> $service_name started with PID $pid"
    return $pid
}

# Start services in background
start_service "auth-svc" "$AUTH_DIR" "3000" &
AUTH_PID=$!

start_service "subscriptions-svc" "$SUBS_DIR" "3001" &
SUBS_PID=$!

# ── 6) wait for services to be healthy ───────────────────────────────────────
echo ">>> Waiting for services to be healthy..."

# Wait for auth-svc
echo ">>> Waiting for auth-svc at $AUTH_HEALTH_URL ..."
i=0
while [ $i -lt 60 ]; do
  if curl -fsS "$AUTH_HEALTH_URL" >/dev/null 2>&1; then
    echo ">>> auth-svc is up and healthy"
    break
  fi
  i=$((i+1))
  sleep 1
done
[ $i -lt 60 ] || { echo "!!! auth-svc did not become healthy"; exit 1; }

# Wait for subscriptions-svc
echo ">>> Waiting for subscriptions-svc at $SUBS_HEALTH_URL ..."
i=0
while [ $i -lt 60 ]; do
  if curl -fsS "$SUBS_HEALTH_URL" >/dev/null 2>&1; then
    echo ">>> subscriptions-svc is up and healthy"
    break
  fi
  i=$((i+1))
  sleep 1
done
[ $i -lt 60 ] || { echo "!!! subscriptions-svc did not become healthy"; exit 1; }

echo ">>> All services are up and running!"
echo ">>> Services:"
echo "    - auth-svc: http://localhost:3000"
echo "    - subscriptions-svc: http://localhost:3001"
echo ">>> Press Ctrl+C to stop all services"

# ── 7) wait for interrupt signal ─────────────────────────────────────────────
trap 'echo ">>> Stopping all services..."; kill $AUTH_PID $SUBS_PID 2>/dev/null || true; echo ">>> Services stopped. Run scripts/dev-down.sh to stop infra."; exit 0' INT TERM

# Wait for background processes
wait $AUTH_PID $SUBS_PID
