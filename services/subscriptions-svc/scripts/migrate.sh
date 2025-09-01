#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"
SVC_DIR="$ROOT_DIR/services/subscriptions-svc"

echo ">>> Ensuring pg-subs is up..."
docker compose -f "$COMPOSE_FILE" up -d pg-subs

echo ">>> Waiting for pg-subs to be healthy..."
docker compose -f "$COMPOSE_FILE" exec -T pg-subs bash -lc \
  'until pg_isready -h localhost -U postgres >/dev/null 2>&1; do sleep 1; done'

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5434/subscriptions}"
export PRISMA_SKIP_ENV_LOAD=1

echo ">>> prisma generate & migrate on $DATABASE_URL"
( cd "$SVC_DIR" && \
  pnpm exec prisma generate && \
  pnpm exec prisma migrate deploy )
