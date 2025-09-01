# MiniSubs – monorepo

A microservices-based subscription management system built with NestJS, Prisma, and PostgreSQL.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Development

**Start all services:**

```bash
./scripts/dev-all.sh
```

**Stop all services:**

```bash
./scripts/dev-down.sh
```

### Services

When running, services are available at:

- **auth-svc**: http://localhost:3000
- **subscriptions-svc**: http://localhost:3001

### Health Checks

- **auth-svc**: http://localhost:3000/v1/auth/health
- **subscriptions-svc**: http://localhost:3001/v1/subscriptions/health

## Architecture

### Services

- **auth-svc**: User authentication and management
- **subscriptions-svc**: Subscription management and event processing
- **gateway**: API Gateway (coming soon)

### Shared Packages

- **@minisubs/common**: Shared utilities, logging, HTTP helpers
- **@minisubs/contracts**: Zod schemas and TypeScript types for REST/events

### Infrastructure

- Each service has its own PostgreSQL database
- Redis for BullMQ job queues
- Docker Compose for local development

## Development Scripts

### All Services

- `./scripts/dev-all.sh` - Start all services
- `./scripts/dev-down.sh` - Stop all services

### Individual Services

Each service has its own scripts in `services/{service-name}/scripts/`:

- `dev-up.sh` - Start individual service
- `dev-down.sh` - Stop individual service
- `migrate.sh` - Run migrations

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL 16 with Prisma 5
- **Queue**: BullMQ with Redis
- **Validation**: Zod 3
- **Logging**: Pino 9
- **Package Manager**: pnpm 9+
- **Language**: TypeScript 5

## Project Structure

```
microservices-pet/
├── packages/
│   ├── common/          # Shared utilities
│   └── contracts/       # Type definitions & schemas
├── services/
│   ├── auth-svc/        # Authentication service
│   ├── subscriptions-svc/ # Subscription service
│   └── gateway/         # API Gateway (coming soon)
├── infra/               # Docker Compose & infrastructure
└── scripts/             # Development scripts
```
