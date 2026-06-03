# ──────────────────────────────────────────────────────────────────
# Pen Times Magazine — Web Dockerfile
# Multi-stage: base → development → builder → production
# Build context: monorepo root
#
# WHY standalone output:
#   next.config.ts sets output: 'standalone' which copies only the
#   minimum server files needed. Reduces image from ~1GB to ~200MB.
# ──────────────────────────────────────────────────────────────────

# ── Stage 1: Base ──────────────────────────────────────────────────
FROM node:20.15.1-alpine3.20 AS base

RUN apk add --no-cache libc6-compat

RUN npm install -g pnpm@9.15.9

RUN pnpm config set registry https://registry.npmjs.org/ && \
    pnpm config set store-dir /pnpm/store && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set fetch-timeout 300000 && \
    pnpm config set network-concurrency 4

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# ── Stage 2: Development ───────────────────────────────────────────
FROM base AS development

RUN --mount=type=cache,id=pnpm-store-web,target=/pnpm/store \
    pnpm --filter web... install --frozen-lockfile --prefer-offline

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "dev"]

# ── Stage 3: Builder ───────────────────────────────────────────────
FROM base AS builder

RUN --mount=type=cache,id=pnpm-store-web,target=/pnpm/store \
    pnpm --filter web... install --frozen-lockfile --prefer-offline

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

RUN pnpm --filter shared build

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter web build

# ── Stage 4: Production ────────────────────────────────────────────
FROM node:20.15.1-alpine3.20 AS production

RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
