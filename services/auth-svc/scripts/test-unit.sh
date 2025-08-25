#!/usr/bin/env bash
set -euo pipefail

echo ">>> Running unit tests for auth-svc..."
pnpm -F auth-svc test:unit
