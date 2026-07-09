# ──────────────────────────────────────────────────────────────────
# Pen Times Magazine — Web Dockerfile
# Multi-stage: base → deps → development → builder → production
#
# Key optimizations:
#   - Separate "deps" stage so installs survive source changes
#   - next dev launched directly; shared pre-build not required in
#     dev because tsconfig.json maps @pentimes/shared → TS source
#   - Production stage properly configured with standalone output
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

COPY tsconfig*.json ./

# ── Stage 2: Install dependencies (cached layer) ───────────────────
FROM base AS deps

RUN pnpm install --frozen-lockfile

# ── Stage 3: Development ───────────────────────────────────────────
FROM deps AS development

# Copy source AFTER install so source edits don't bust the deps layer
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /app/apps/web

EXPOSE 3000

# next dev resolves @pentimes/shared via tsconfig paths → TS source.
# No separate shared build step needed in development.
CMD ["pnpm", "exec", "next", "dev", "--port", "3000"]

# ── Stage 4: Builder ───────────────────────────────────────────────
FROM deps AS builder

# Copy source for building
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build shared package first (required for web build)
RUN pnpm --filter shared build

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app (creates .next directory with standalone output)
RUN pnpm --filter web build

# ── Stage 5: Production ────────────────────────────────────────────
FROM node:20.15.1-alpine3.20 AS production

RUN apk add --no-cache libc6-compat

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone output (includes server.js and node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static assets (served separately from standalone server)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Start the standalone server
CMD ["node", "apps/web/server.js"]