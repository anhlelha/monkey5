CREATE TABLE "PracticeSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'math',
    "mode" TEXT NOT NULL DEFAULT 'targeted',
    "taxonomyVersion" TEXT NOT NULL,
    "analyticalTopic" TEXT,
    "difficultyBand" TEXT,
    "targetSchool" TEXT,
    "profileVersionId" TEXT,
    "policyVersionId" TEXT,
    "sourceFilter" TEXT NOT NULL DEFAULT 'all',
    "algorithmVersion" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestedCount" INTEGER NOT NULL,
    "selectedCount" INTEGER NOT NULL,
    "unseenCount" INTEGER NOT NULL,
    "assessmentRunIdsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticeSet_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PracticeSetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceSetId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sourceQuestionId" TEXT NOT NULL,
    "canonicalQuestionId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "analyticalTopic" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "cognitiveLevel" TEXT NOT NULL,
    "reasoningType" TEXT NOT NULL,
    "isRepeat" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    CONSTRAINT "PracticeSetItem_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PracticeSet_examId_key" ON "PracticeSet"("examId");
CREATE UNIQUE INDEX "PracticeSet_idempotencyKey_key" ON "PracticeSet"("idempotencyKey");
CREATE INDEX "PracticeSet_userId_analyticalTopic_difficultyBand_createdAt_idx" ON "PracticeSet"("userId", "analyticalTopic", "difficultyBand", "createdAt");
CREATE INDEX "PracticeSet_targetSchool_profileVersionId_idx" ON "PracticeSet"("targetSchool", "profileVersionId");
CREATE UNIQUE INDEX "PracticeSetItem_practiceSetId_position_key" ON "PracticeSetItem"("practiceSetId", "position");
CREATE INDEX "PracticeSetItem_canonicalQuestionId_idx" ON "PracticeSetItem"("canonicalQuestionId");
CREATE INDEX "PracticeSetItem_analyticalTopic_difficulty_idx" ON "PracticeSetItem"("analyticalTopic", "difficulty");
