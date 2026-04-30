# ─────────────────────────────────────────────────────────────────────────────
# Ares Station — API Dockerfile
# Multi-stage build: keeps the production image lean (~200MB vs ~900MB)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
# Install ALL dependencies (including devDeps needed for build)
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ── Stage 2: build ────────────────────────────────────────────────────────────
# Compile TypeScript → JavaScript
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (must run before tsc)
RUN npx prisma generate

RUN npm run build

# ── Stage 3: production ───────────────────────────────────────────────────────
# Only production deps + compiled output
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and Prisma client
COPY --from=build /app/dist            ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma/schema.prisma              ./prisma/schema.prisma

# Non-root user for security
RUN addgroup -S ares && adduser -S ares -G ares
USER ares

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
