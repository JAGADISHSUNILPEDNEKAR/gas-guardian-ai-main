-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "smartAccountAddress" TEXT,
    "email" TEXT,
    "notificationPreferences" TEXT DEFAULT '{"browser": true, "email": false}',
    "totalSavedUsd" REAL NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "optimalExecutionRate" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActiveAt" DATETIME
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "executionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transactionType" TEXT,
    "maxGasPrice" BIGINT NOT NULL,
    "minAssetPrice" BIGINT,
    "maxSlippage" INTEGER,
    "deadline" DATETIME NOT NULL,
    "targetAddress" TEXT NOT NULL,
    "transactionData" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '0',
    "actualGasPrice" BIGINT,
    "actualFlrPrice" BIGINT,
    "gasUsed" BIGINT,
    "txHash" TEXT,
    "blockNumber" BIGINT,
    "immediateCostUsd" REAL,
    "actualCostUsd" REAL,
    "savedUsd" REAL,
    "savingsPercentage" REAL,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "notificationChannels" TEXT NOT NULL DEFAULT '{"browser": true}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastTriggeredAt" DATETIME,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertTrigger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT NOT NULL,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertTrigger_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "Alert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GasHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gasPrice" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalSaved" REAL NOT NULL,
    "transactionCount" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Savings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModelMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelType" TEXT NOT NULL,
    "lastTrained" DATETIME NOT NULL,
    "version" TEXT NOT NULL,
    "accuracy" REAL,
    "metadata" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_totalSavedUsd_idx" ON "User"("totalSavedUsd" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_executionId_key" ON "Transaction"("executionId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_deadline_idx" ON "Transaction"("deadline");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_status_idx" ON "Alert"("status");

-- CreateIndex
CREATE INDEX "AlertTrigger_alertId_idx" ON "AlertTrigger"("alertId");

-- CreateIndex
CREATE INDEX "AlertTrigger_triggeredAt_idx" ON "AlertTrigger"("triggeredAt");

-- CreateIndex
CREATE INDEX "GasHistory_timestamp_idx" ON "GasHistory"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_userId_key" ON "Leaderboard"("userId");

-- CreateIndex
CREATE INDEX "Leaderboard_rank_idx" ON "Leaderboard"("rank");

-- CreateIndex
CREATE INDEX "Leaderboard_totalSaved_idx" ON "Leaderboard"("totalSaved" DESC);

-- CreateIndex
CREATE INDEX "Savings_userId_idx" ON "Savings"("userId");

-- CreateIndex
CREATE INDEX "Savings_createdAt_idx" ON "Savings"("createdAt");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
