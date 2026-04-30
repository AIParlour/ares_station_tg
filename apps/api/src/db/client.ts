// ─────────────────────────────────────────────────────────────────────────────
// Prisma client — singleton so the connection pool is reused across requests.
// In development, attaches to globalThis to survive hot-module reloads without
// exhausting Postgres connection limits.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
