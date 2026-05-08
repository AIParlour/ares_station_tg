import express from "express";
import cors from "cors";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { authRouter }     from "./routes/auth.js";
import { dayRouter }      from "./routes/day.js";
import { puzzleRouter }   from "./routes/puzzle.js";
import { paradoxRouter }  from "./routes/paradox.js";
import { progressRouter } from "./routes/progress.js";
import { drillsRouter }   from "./routes/drills.js";
import { startBot, sendDailyNotifications } from "./bot/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = Number(process.env.PORT ?? 3000);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "*",
  methods: ["GET", "POST"],
}));
app.use(express.json({ limit: "50kb" }));

// ── Request logger (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "ares-station-api", ts: new Date().toISOString() })
);

app.use("/api/auth",     authRouter);
app.use("/api/days",     dayRouter);
app.use("/api/puzzle",   puzzleRouter);
app.use("/api/paradox",  paradoxRouter);
app.use("/api/progress", progressRouter);
app.use("/api/drills",   drillsRouter);

// ── Static frontend (production) ─────────────────────────────────────────────
// In production the built SPA is copied into dist/public/ by the build script.
// Serve it here so a single Render service handles both API and frontend.
const publicDir = join(__dirname, "public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA fallback — any non-API route serves index.html
  app.get("*", (_req, res) => {
    res.sendFile(join(publicDir, "index.html"));
  });
  console.log(`[ares-api] Serving static frontend from ${publicDir}`);
} else {
  // No frontend build present — API-only mode
  app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled]", err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[ares-api] listening on http://localhost:${PORT}`);
  console.log(`[ares-api] NODE_ENV=${process.env.NODE_ENV ?? "development"}`);
  console.log(`[ares-api] BOT_TOKEN=${process.env.BOT_TOKEN ? "set" : "NOT SET (dev mode)"}`);
  console.log(`[ares-api] ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY ? "set" : "NOT SET (mock mode)"}`);

  // ── Telegram Bot ──────────────────────────────────────────────────────────
  const bot = await startBot();
  if (bot) {
    // Check for new day unlocks every 5 minutes
    setInterval(() => sendDailyNotifications(bot), 5 * 60 * 1000);
    console.log("[ares-api] Daily notification sweep active (every 5 min)");
  }
});
