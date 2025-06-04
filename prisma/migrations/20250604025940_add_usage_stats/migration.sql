-- CreateTable
CREATE TABLE "global_usage_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "totalAccepted" INTEGER NOT NULL DEFAULT 0,
    "totalRejected" INTEGER NOT NULL DEFAULT 0,
    "totalAbandoned" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "daily_usage_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "dailyClicks" INTEGER NOT NULL DEFAULT 0,
    "dailyUsers" INTEGER NOT NULL DEFAULT 0,
    "dailySessions" INTEGER NOT NULL DEFAULT 0,
    "dailyAttempts" INTEGER NOT NULL DEFAULT 0,
    "dailyAccepted" INTEGER NOT NULL DEFAULT 0,
    "dailyRejected" INTEGER NOT NULL DEFAULT 0,
    "dailyAbandoned" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_usage_stats_date_key" ON "daily_usage_stats"("date");
