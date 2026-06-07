# ──────────────────────────────────────────────────────────────────
# Pen Times Magazine — API Dockerfile
# Multi-stage: base → deps → development → builder → production
#
# Key optimizations:
#   - "deps" stage installs packages ONCE and is reused by dev/prod
#   - Source copied AFTER install so package-lock changes don't
#     invalidate the source copy layer (and vice versa)
#   - tsx watch launched directly (no shared pre-build step here;
#     shared is volume-mounted in dev and pre-built in prod)
#   - Migrations run automatically on container startup in production
# ──────────────────────────────────────────────────────────────────

# ── Stage 1: Base ──────────────────────────────────────────────────
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

# Copy ONLY manifests first — this layer is cached until any
# package.json or lockfile changes (not on every source edit)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

COPY tsconfig*.json ./

# ── Stage 2: Install dependencies (cached layer) ───────────────────
FROM base AS deps

# Install all deps (including dev) once. This layer is reused by
# the development stage — no reinstall on every `docker compose up`.
RUN --mount=type=cache,id=pnpm-store-api,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline

# ── Stage 3: Development ───────────────────────────────────────────
FROM deps AS development

# Copy source AFTER install so source edits don't bust the deps layer
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api

EXPOSE 4000

# tsx watch handles TypeScript compilation in-process.
# The shared package source is volume-mounted in docker-compose.yml
# so tsx path aliases resolve it directly — no pre-build needed.
CMD ["pnpm", "exec", "tsx", "watch", "src/index.ts"]

# ── Stage 4: Builder ───────────────────────────────────────────────
FROM deps AS builder

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build shared first — api depends on its compiled output
RUN pnpm --filter shared build
RUN pnpm --filter api build

# Prune to production deps only
RUN pnpm --filter api --prod deploy /app/prod-deploy

# ── Stage 5: Production ────────────────────────────────────────────
FROM node:20.15.1-alpine3.20 AS production

RUN apk add --no-cache libc6-compat openssl wget

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api_user

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder --chown=api_user:nodejs /app/prod-deploy ./
COPY --from=builder --chown=api_user:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=api_user:nodejs /app/apps/api/src/db/migrations ./dist/db/migrations

USER api_user

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:4000/health || exit 1

# Run migrations first, then start server
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/index.js"]