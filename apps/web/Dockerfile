# ──────────────────────────────────────────────────────────────────
# Pen Times Magazine — Web Dockerfile
# Multi-stage: base → deps → development → builder → production
#
# Key optimizations vs original:
#   - Separate "deps" stage so installs survive source changes
#   - next dev launched directly; shared pre-build not required in
#     dev because tsconfig.json maps @pentimes/shared → TS source
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

# Manifests only first — cached until lockfile/package.json changes
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# ── Stage 2: Install dependencies (cached layer) ───────────────────
FROM base AS deps

RUN --mount=type=cache,id=pnpm-store-web,target=/pnpm/store \
    pnpm --filter web... install --frozen-lockfile --prefer-offline

# ── Stage 3: Development ───────────────────────────────────────────
FROM deps AS development

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /app/apps/web

EXPOSE 3000

# next dev resolves @pentimes/shared via tsconfig paths → TS source.
# No separate shared build step needed in development.
CMD ["pnpm", "exec", "next", "dev", "--port", "3000"]

# ── Stage 4: Builder ───────────────────────────────────────────────
FROM deps AS builder

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

RUN pnpm --filter shared build

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter web build

# ── Stage 5: Production ────────────────────────────────────────────
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