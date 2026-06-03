# ──────────────────────────────────────────────────────────────────
# Pen Times Magazine — API Dockerfile
# Multi-stage: base → development → builder → production
# Build context: monorepo root
#
# WHY multi-stage:
#   - development stage has hot-reload and dev deps
#   - production stage has ONLY compiled output + prod deps
#   - Results in a ~200MB prod image vs ~800MB single-stage
# ──────────────────────────────────────────────────────────────────

# ── Stage 1: Base 
# Node 20 LTS on Alpine for a minimal base layer.
FROM node:20.15.1-alpine3.20 AS base

RUN apk add --no-cache libc6-compat openssl

# Pin pnpm — never use corepack prepare pnpm@latest
RUN npm install -g pnpm@9.15.9

RUN pnpm config set registry https://registry.npmjs.org/ && \
    pnpm config set store-dir /pnpm/store && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set fetch-timeout 300000 && \
    pnpm config set network-concurrency 4

WORKDIR /app

# Copy manifests only (maximises Docker layer cache)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# ── Stage 2: Development
FROM base AS development

RUN --mount=type=cache,id=pnpm-store-api,target=/pnpm/store \
    pnpm --filter api... install --frozen-lockfile --prefer-offline

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["pnpm", "dev"]

# ── Stage 3: Builder
FROM base AS builder

RUN --mount=type=cache,id=pnpm-store-api,target=/pnpm/store \
    pnpm --filter api... install --frozen-lockfile --prefer-offline

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared first — api depends on its compiled output
RUN pnpm --filter shared build
RUN pnpm --filter api build

# Prune to production deps only
RUN pnpm --filter api --prod deploy /app/prod-deploy

# ── Stage 4: Production 
FROM node:20.15.1-alpine3.20 AS production

RUN apk add --no-cache libc6-compat openssl wget

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api_user

WORKDIR /app

COPY --from=builder --chown=api_user:nodejs /app/prod-deploy ./
COPY --from=builder --chown=api_user:nodejs /app/apps/api/dist ./dist

USER api_user

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
