#!/usr/bin/env bash
set -euo pipefail

# ── paths ──────────────────────────────────────────────────────────────────────
# repo root: microservices-pet/
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"
SVC_DIR="$ROOT_DIR/services/auth-svc"

echo ">>> Using compose file: $COMPOSE_FILE"

# ── start infra (pg-auth + redis) ─────────────────────────────────────────────
echo ">>> Starting infra containers (pg-auth, redis)..."
docker compose -f "$COMPOSE_FILE" up -d pg-auth redis

# ── wait for Postgres healthy ─────────────────────────────────────────────────
echo ">>> Waiting for Postgres to be healthy..."
docker compose -f "$COMPOSE_FILE" exec -T pg-auth bash -lc \
  'until pg_isready -h localhost -U postgres >/dev/null 2>&1; do sleep 1; done'
echo ">>> Postgres is ready."

# ── run prisma generate + migrate (locally, pointing to localhost:5433) ──────
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/auth}"
export PRISMA_SKIP_ENV_LOAD=1

echo ">>> Running prisma generate & migrate against $DATABASE_URL"
( cd "$SVC_DIR" && \
  pnpm exec prisma generate && \
  pnpm exec prisma migrate deploy )

# ── start auth-svc (dev) ──────────────────────────────────────────────────────
echo ">>> Starting auth-svc (pnpm start:dev)"
echo "    Tip: stop with Ctrl+C. Infra stays up; run dev-down.sh to stop it."
cd "$SVC_DIR"
pnpm start:dev
