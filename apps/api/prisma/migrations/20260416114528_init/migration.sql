-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "tgUserId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "languageCode" TEXT,
    "isPremiumTg" BOOLEAN NOT NULL DEFAULT false,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "days" (
    "id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "answers" JSONB NOT NULL,

    CONSTRAINT "days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_days" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "solvedSlots" JSONB NOT NULL DEFAULT '{}',
    "unlockWords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "paradoxWin" BOOLEAN NOT NULL DEFAULT false,
    "attemptsUsed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "player_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paradox_logs" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paradox_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "itemId" TEXT,
    "dayId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_tgUserId_key" ON "players"("tgUserId");

-- CreateIndex
CREATE INDEX "days_publishedAt_idx" ON "days"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "days_season_dayNumber_key" ON "days"("season", "dayNumber");

-- CreateIndex
CREATE INDEX "player_days_playerId_unlockedAt_idx" ON "player_days"("playerId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "player_days_playerId_dayId_key" ON "player_days"("playerId", "dayId");

-- CreateIndex
CREATE INDEX "paradox_logs_playerId_dayId_idx" ON "paradox_logs"("playerId", "dayId");

-- CreateIndex
CREATE INDEX "transactions_playerId_idx" ON "transactions"("playerId");

-- AddForeignKey
ALTER TABLE "player_days" ADD CONSTRAINT "player_days_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_days" ADD CONSTRAINT "player_days_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradox_logs" ADD CONSTRAINT "paradox_logs_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paradox_logs" ADD CONSTRAINT "paradox_logs_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
