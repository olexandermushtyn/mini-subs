#!/usr/bin/env bash
set -euo pipefail

# repo root: microservices-pet/
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"
SVC_DIR="$ROOT_DIR/services/subscriptions-svc"

echo ">>> Using compose file: $COMPOSE_FILE"

# ── start infra (pg-subs + redis) ─────────────────────────────────────────────
echo ">>> Starting infra containers (pg-subs, redis)..."
docker compose -f "$COMPOSE_FILE" up -d pg-subs redis

# ── wait for Postgres healthy ─────────────────────────────────────────────────
echo ">>> Waiting for pg-subs to be healthy..."
docker compose -f "$COMPOSE_FILE" exec -T pg-subs bash -lc \
  'until pg_isready -h localhost -U postgres >/dev/null 2>&1; do sleep 1; done'
echo ">>> pg-subs is ready."

# ── prisma generate + migrate (locally, pointing to localhost:5434) ──────────
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5434/subscriptions}"
export PRISMA_SKIP_ENV_LOAD=1

echo ">>> Running prisma generate & migrate against $DATABASE_URL"
( cd "$SVC_DIR" && \
  pnpm exec prisma generate && \
  pnpm exec prisma migrate deploy )

# ── start subscriptions-svc (dev) ────────────────────────────────────────────
echo ">>> Starting subscriptions-svc (pnpm start:dev)"
echo "    Tip: stop with Ctrl+C. Infra stays up; run dev-down.sh to stop it."
cd "$SVC_DIR"
pnpm start:dev
