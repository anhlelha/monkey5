-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT NOT NULL DEFAULT 'Lớp 5',
    "targets" TEXT NOT NULL DEFAULT '[]',
    "hours" INTEGER NOT NULL DEFAULT 5,
    "examDate" TEXT,
    "readyTarget" INTEGER NOT NULL DEFAULT 75,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "joinedDays" INTEGER NOT NULL DEFAULT 0,
    "topicMastery" TEXT NOT NULL DEFAULT '{}',
    "readiness" TEXT NOT NULL DEFAULT '{}',
    "activity" TEXT NOT NULL DEFAULT '[]',
    "theme" TEXT NOT NULL DEFAULT 'clay',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL DEFAULT 'math',
    "school" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "title" TEXT,
    "intro" TEXT,
    "minutes" INTEGER NOT NULL,
    "qcount" INTEGER NOT NULL,
    "generated" BOOLEAN NOT NULL DEFAULT false,
    "basedOn" TEXT,
    "note" TEXT,
    "mixRatio" TEXT,
    "sections" TEXT NOT NULL DEFAULT '[]',
    "ownerUserId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT,
    "subject" TEXT NOT NULL DEFAULT 'math',
    "num" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "skill" TEXT,
    "grade" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "groupId" TEXT,
    "passageId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "stem" TEXT NOT NULL,
    "unit" TEXT,
    "placeholder" TEXT,
    "correct" TEXT,
    "answerSchema" TEXT,
    "options" TEXT NOT NULL DEFAULT '[]',
    "modelAnswer" TEXT,
    "figure" TEXT,
    "source" TEXT,
    "sourceQuestionId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "score" INTEGER NOT NULL DEFAULT 0,
    "earned" REAL NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topic" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qcount" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 30,
    "difficulty" TEXT NOT NULL DEFAULT 'L5',
    "kind" TEXT NOT NULL DEFAULT 'reference',
    "mixRatio" TEXT,
    "source" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomSet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TopicSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "qcount" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "setId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TopicSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL DEFAULT 'math',
    "skill" TEXT,
    "name" TEXT NOT NULL,
    "short" TEXT NOT NULL,
    "ico" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'article',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserReferenceExam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserReferenceExam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserReferenceExam_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserWhitelist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "level" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'math',
    "label" TEXT NOT NULL,
    "sub" TEXT NOT NULL,
    "qcount" INTEGER NOT NULL,
    "minutes" INTEGER NOT NULL,
    "grades" TEXT NOT NULL DEFAULT '[]',
    "tone" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("level", "subject")
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

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "short" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "full" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "minutes" INTEGER NOT NULL DEFAULT 60,
    "style" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '07:00',
    "landingTheme" TEXT NOT NULL DEFAULT 'ocean',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LLMSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "model" TEXT NOT NULL DEFAULT 'claude-opus-4-8',
    "apiKey" TEXT,
    "gradingPrompt" TEXT,
    "writingPrompt" TEXT,
    "writingWeights" TEXT NOT NULL DEFAULT '{}',
    "vnWritingPrompt" TEXT,
    "vnWritingWeights" TEXT NOT NULL DEFAULT '{}',
    "methodWeight" INTEGER NOT NULL DEFAULT 70,
    "answerWeight" INTEGER NOT NULL DEFAULT 30,
    "guessCredit" INTEGER NOT NULL DEFAULT 20,
    "maxTokens" INTEGER NOT NULL DEFAULT 1024,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EssayGrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "fraction" REAL NOT NULL,
    "earned" REAL NOT NULL,
    "points" INTEGER NOT NULL,
    "answerCorrect" BOOLEAN NOT NULL DEFAULT false,
    "methodScore" REAL NOT NULL DEFAULT 0,
    "guessed" BOOLEAN NOT NULL DEFAULT false,
    "kind" TEXT NOT NULL DEFAULT 'math',
    "criteria" TEXT NOT NULL DEFAULT '{}',
    "feedback" TEXT NOT NULL DEFAULT '',
    "provider" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'graded',
    "error" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EssayGrade_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SchoolProfile" (
    "school" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'math',
    "topicWeights" TEXT NOT NULL,
    "levelWeights" TEXT NOT NULL,
    "difficulty" REAL NOT NULL,
    "minutes" REAL NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "freeTextPct" REAL NOT NULL DEFAULT 0,
    "olympicGeoPct" REAL NOT NULL DEFAULT 0,
    "diversity" INTEGER NOT NULL DEFAULT 0,
    "factors" TEXT NOT NULL DEFAULT '{}',
    "sourceHash" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("school", "subject")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Exam_ownerUserId_active_position_idx" ON "Exam"("ownerUserId", "active", "position");

-- CreateIndex
CREATE INDEX "TopicSession_userId_topic_createdAt_idx" ON "TopicSession"("userId", "topic", "createdAt");

-- CreateIndex
CREATE INDEX "Passage_examId_idx" ON "Passage"("examId");

-- CreateIndex
CREATE INDEX "UserReferenceExam_userId_addedAt_idx" ON "UserReferenceExam"("userId", "addedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserReferenceExam_userId_examId_key" ON "UserReferenceExam"("userId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWhitelist_email_key" ON "UserWhitelist"("email");

-- CreateIndex
CREATE INDEX "UserTopicSet_userId_addedAt_idx" ON "UserTopicSet"("userId", "addedAt");

-- CreateIndex
CREATE INDEX "EssayGrade_attemptId_idx" ON "EssayGrade"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "EssayGrade_attemptId_questionId_key" ON "EssayGrade"("attemptId", "questionId");
