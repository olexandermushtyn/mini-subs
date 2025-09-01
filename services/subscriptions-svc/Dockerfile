FROM node:20-alpine

WORKDIR /app

COPY pnpm-lock.yaml ./
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY services/subscriptions-svc ./services/subscriptions-svc

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN pnpm install --frozen-lockfile

WORKDIR /app/services/subscriptions-svc
RUN pnpm prisma:generate
RUN pnpm build

CMD ["pnpm", "start"]
