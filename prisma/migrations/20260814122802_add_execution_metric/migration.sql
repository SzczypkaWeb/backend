-- CreateTable
CREATE TABLE "ExecutionMetric" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "node" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalCostUsd" DECIMAL(10,4),
    "durationMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutionMetric_runId_idx" ON "ExecutionMetric"("runId");

-- CreateIndex
CREATE INDEX "ExecutionMetric_repo_createdAt_idx" ON "ExecutionMetric"("repo", "createdAt");
