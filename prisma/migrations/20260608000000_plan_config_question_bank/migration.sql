-- CreateTable
CREATE TABLE "PlanConfig" (
    "plan" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "topicSetLimit" INTEGER NOT NULL DEFAULT -1,
    "referenceExamLimit" INTEGER NOT NULL DEFAULT -1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LevelConfig" (
    "level" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "qcount" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,
    "grades" TEXT NOT NULL DEFAULT '[]',
    "tone" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "UserTopicSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTopicSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT,
    "num" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "stem" TEXT NOT NULL,
    "unit" TEXT,
    "placeholder" TEXT,
    "correct" TEXT,
    "options" TEXT NOT NULL DEFAULT '[]',
    "modelAnswer" TEXT,
    "figure" TEXT,
    "source" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("correct", "createdAt", "examId", "figure", "grade", "id", "modelAnswer", "num", "options", "placeholder", "points", "source", "stem", "topic", "type", "unit") SELECT "correct", "createdAt", "examId", "figure", "grade", "id", "modelAnswer", "num", "options", "placeholder", "points", "source", "stem", "topic", "type", "unit" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "UserTopicSet_userId_addedAt_idx" ON "UserTopicSet"("userId", "addedAt");

