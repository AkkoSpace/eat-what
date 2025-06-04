-- CreateTable
CREATE TABLE "recommendation_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "deviceId" TEXT,
    "userId" TEXT,
    "totalAttempts" INTEGER NOT NULL DEFAULT 1,
    "finalFoodId" TEXT,
    "finalDrinkId" TEXT,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "attemptHistory" TEXT NOT NULL DEFAULT '[]',
    "includeDrink" BOOLEAN NOT NULL DEFAULT false,
    "rejectionType" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "recommendation_stats_finalFoodId_fkey" FOREIGN KEY ("finalFoodId") REFERENCES "foods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "recommendation_stats_finalDrinkId_fkey" FOREIGN KEY ("finalDrinkId") REFERENCES "foods" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "recommendation_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "food_selection_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "foodId" TEXT NOT NULL,
    "recommendCount" INTEGER NOT NULL DEFAULT 0,
    "acceptCount" INTEGER NOT NULL DEFAULT 0,
    "rejectTodayCount" INTEGER NOT NULL DEFAULT 0,
    "rejectForeverCount" INTEGER NOT NULL DEFAULT 0,
    "lastRecommended" DATETIME,
    "lastAccepted" DATETIME,
    "lastRejected" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "food_selection_stats_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "food_selection_stats_foodId_key" ON "food_selection_stats"("foodId");
