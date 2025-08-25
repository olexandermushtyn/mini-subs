#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

echo ">>> Using compose file: $COMPOSE_FILE"

echo ">>> Starting infra containers (pg-auth + redis)..."
docker compose -f "$COMPOSE_FILE" up -d pg-auth redis

echo ">>> Waiting for Postgres to be healthy..."
docker compose -f "$COMPOSE_FILE" exec -T pg-auth bash -c 'until pg_isready -h localhost -U postgres; do sleep 1; done'

echo ">>> Creating test database..."
docker compose -f "$COMPOSE_FILE" exec -T pg-auth psql -U postgres -c "CREATE DATABASE auth_test;" || true

echo ">>> Running e2e tests for auth-svc..."
pnpm -F auth-svc test:e2e

echo ">>> Stopping infra containers..."
docker compose -f "$COMPOSE_FILE" down
