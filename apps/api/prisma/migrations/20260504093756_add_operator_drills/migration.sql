-- CreateTable
CREATE TABLE "player_drill_stats" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "drillType" TEXT NOT NULL,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "masteryTier" TEXT NOT NULL DEFAULT 'none',
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalRoundsPlayed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_drill_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "utcDay" TEXT NOT NULL,
    "drillsPlayed" JSONB NOT NULL,
    "integrityScore" INTEGER NOT NULL,
    "currencyAwarded" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_drill_streaks" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastWorkoutDay" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_drill_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codex_entries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "unlockType" TEXT NOT NULL,
    "unlockCondition" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "codex_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_codex_unlocks" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "codexEntryId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_codex_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "player_drill_stats_playerId_drillType_key" ON "player_drill_stats"("playerId", "drillType");

-- CreateIndex
CREATE INDEX "workout_sessions_playerId_completedAt_idx" ON "workout_sessions"("playerId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "workout_sessions_playerId_utcDay_key" ON "workout_sessions"("playerId", "utcDay");

-- CreateIndex
CREATE UNIQUE INDEX "player_drill_streaks_playerId_key" ON "player_drill_streaks"("playerId");

-- CreateIndex
CREATE INDEX "player_codex_unlocks_playerId_idx" ON "player_codex_unlocks"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "player_codex_unlocks_playerId_codexEntryId_key" ON "player_codex_unlocks"("playerId", "codexEntryId");

-- AddForeignKey
ALTER TABLE "player_drill_stats" ADD CONSTRAINT "player_drill_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_drill_streaks" ADD CONSTRAINT "player_drill_streaks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_codex_unlocks" ADD CONSTRAINT "player_codex_unlocks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_codex_unlocks" ADD CONSTRAINT "player_codex_unlocks_codexEntryId_fkey" FOREIGN KEY ("codexEntryId") REFERENCES "codex_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
