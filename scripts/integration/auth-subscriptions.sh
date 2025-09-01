#!/bin/sh
set -eu

# ── paths ─────────────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"

AUTH_DIR="$ROOT_DIR/services/auth-svc"
SUBS_DIR="$ROOT_DIR/services/subscriptions-svc"

AUTH_HEALTH_URL="http://localhost:3000/v1/auth/health"
SUBS_HEALTH_URL="http://localhost:3001/v1/subscriptions/health"

echo ">>> Using compose file: $COMPOSE_FILE"

# ── 1) start infra ────────────────────────────────────────────────────────────
echo ">>> Starting infra containers (pg-auth, pg-subs, redis)..."
docker compose -f "$COMPOSE_FILE" up -d pg-auth pg-subs redis

echo ">>> Waiting for pg-auth to be healthy..."
docker compose -f "$COMPOSE_FILE" exec -T pg-auth sh -lc \
  'until pg_isready -h localhost -U postgres >/dev/null 2>&1; do sleep 1; done'
echo ">>> pg-auth is ready."

echo ">>> Waiting for pg-subs to be healthy..."
docker compose -f "$COMPOSE_FILE" exec -T pg-subs sh -lc \
  'until pg_isready -h localhost -U postgres >/dev/null 2>&1; do sleep 1; done'
echo ">>> pg-subs is ready."

# ── 2) run prisma migrations (locally against forwarded ports) ───────────────
PRISMA_SKIP_ENV_LOAD=1; export PRISMA_SKIP_ENV_LOAD

echo ">>> Running prisma migrate for auth-svc (localhost:5433/auth)..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/auth"; export DATABASE_URL
OLDPWD="$(pwd)"; cd "$AUTH_DIR"
pnpm exec prisma generate
pnpm exec prisma migrate deploy
cd "$OLDPWD"

echo ">>> Running prisma migrate for subscriptions-svc (localhost:5434/subscriptions)..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/subscriptions"; export DATABASE_URL
OLDPWD="$(pwd)"; cd "$SUBS_DIR"
pnpm exec prisma generate
pnpm exec prisma migrate deploy
cd "$OLDPWD"

# ── 3) start both services ───────────────────────────────────────────────────
echo ">>> Starting services (auth-svc, subscriptions-svc)..."
docker compose -f "$COMPOSE_FILE" up -d auth-svc subscriptions-svc

# ── 4) wait for health endpoints (POSIX loop) ─────────────────────────────────
echo ">>> Waiting for auth-svc at $AUTH_HEALTH_URL ..."
i=0
while [ $i -lt 60 ]; do
  if curl -fsS "$AUTH_HEALTH_URL" >/dev/null 2>&1; then
    echo ">>> auth-svc is up"
    break
  fi
  i=$((i+1))
  sleep 1
done
[ $i -lt 60 ] || { echo "!!! auth-svc did not become healthy"; exit 1; }

echo ">>> Waiting for subscriptions-svc at $SUBS_HEALTH_URL ..."
i=0
while [ $i -lt 60 ]; do
  if curl -fsS "$SUBS_HEALTH_URL" >/dev/null 2>&1; then
    echo ">>> subscriptions-svc is up"
    break
  fi
  i=$((i+1))
  sleep 1
done
[ $i -lt 60 ] || { echo "!!! subscriptions-svc did not become healthy"; exit 1; }

# ── 5) perform signup on auth-svc ────────────────────────────────────────────
STAMP="$(date +%s)"
EMAIL="integration+$STAMP@example.com"
PASSWORD="Password123"

echo ">>> Calling /v1/auth/signup with email=$EMAIL ..."
curl -fsS -X POST "http://localhost:3000/v1/auth/signup" \
  -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" >/dev/null || true

# ── 6) wait for worker to process -> assert in pg-subs ───────────────────────
echo ">>> Waiting for subscriptions worker to process event..."
sleep 2

echo ">>> Checking Subscriber row in pg-subs ..."
OUT="$(docker compose -f "$COMPOSE_FILE" exec -T pg-subs \
  psql -U postgres -d subscriptions -t -A -c "select email from \"Subscriber\" where email='$EMAIL';" 2>/dev/null || true)"

if [ -n "$OUT" ] && [ "$OUT" = "$EMAIL" ]; then
  echo "✅ Integration PASS: Subscriber exists for $EMAIL"
  exit 0
else
  echo "❌ Integration FAIL: Subscriber not found for $EMAIL"
  echo "--- Debug: Outbox on pg-auth ---"
  docker compose -f "$COMPOSE_FILE" exec -T pg-auth \
    psql -U postgres -d auth -c 'table "Outbox";' || true
  echo "--- Debug: Subscriber on pg-subs ---"
  docker compose -f "$COMPOSE_FILE" exec -T pg-subs \
    psql -U postgres -d subscriptions -c 'table "Subscriber";' || true
  exit 1
fi
