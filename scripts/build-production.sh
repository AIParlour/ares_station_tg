#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Ares Station — Production build script
# Builds frontend + backend into a single deployable unit.
# The frontend SPA is copied into api/dist/public/ so Express can serve it.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "╔═══════════════════════════════════════╗"
echo "║   ARES STATION — PRODUCTION BUILD     ║"
echo "╚═══════════════════════════════════════╝"

# ── 1. Install dependencies ──────────────────────────────────────────────────
echo ""
echo "▸ Installing dependencies..."
cd "$ROOT"
npm install

# ── 2. Generate Prisma client ────────────────────────────────────────────────
echo ""
echo "▸ Generating Prisma client..."
cd "$ROOT/apps/api"
npx prisma generate

# ── 3. Build frontend ───────────────────────────────────────────────────────
echo ""
echo "▸ Building frontend..."
cd "$ROOT/apps/web"
npx tsc -b
npx vite build

# ── 4. Build backend ────────────────────────────────────────────────────────
echo ""
echo "▸ Building backend..."
cd "$ROOT/apps/api"
npx tsc -p tsconfig.json

# ── 5. Copy frontend into backend's public dir ──────────────────────────────
echo ""
echo "▸ Copying frontend → api/dist/public/..."
rm -rf "$ROOT/apps/api/dist/public"
cp -r "$ROOT/apps/web/dist" "$ROOT/apps/api/dist/public"

# ── 6. Copy content JSON files (needed by seed at runtime) ──────────────────
echo ""
echo "▸ Copying content files..."
cp -r "$ROOT/apps/api/src/content" "$ROOT/apps/api/dist/content"

echo ""
echo "✓ Build complete. Start with: node apps/api/dist/index.js"
