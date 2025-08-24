# services/auth-svc/Dockerfile
FROM node:20-alpine

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

# 1) Copy root manifests for better cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 2) Copy only manifests of dependent workspaces (for cache)
COPY packages/common/package.json packages/common/
COPY packages/contracts/package.json packages/contracts/
COPY services/auth-svc/package.json services/auth-svc/

# 3) Installation of only what is needed for the service (pnpm workspaces)
RUN pnpm -w install --filter auth-svc...

# 4) Now copy all package code and service
COPY packages ./packages
COPY services/auth-svc ./services/auth-svc

# 5) Build the service
WORKDIR /app/services/auth-svc
RUN pnpm prisma generate && pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
