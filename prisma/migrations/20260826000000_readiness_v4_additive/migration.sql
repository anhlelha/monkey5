-- CreateTable
CREATE TABLE "AssessmentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "taxonomyVersion" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "artifactPath" TEXT,
    "inputHash" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "approvedByUserId" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "QuestionAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "taxonomyVersion" TEXT NOT NULL,
    "topicPrimary" TEXT NOT NULL,
    "topicSecondaryJson" TEXT NOT NULL DEFAULT '[]',
    "difficultyBand" INTEGER NOT NULL,
    "cognitiveLevel" TEXT NOT NULL,
    "reasoningType" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "model" TEXT NOT NULL,
    "sourceRunId" TEXT NOT NULL,
    "questionContentHash" TEXT NOT NULL,
    "assessedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SchoolProfileVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "taxonomyVersion" TEXT NOT NULL,
    "assessmentRunId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sourceHash" TEXT NOT NULL,
    "sourceExamIdsJson" TEXT NOT NULL,
    "examCount" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "yearCount" INTEGER NOT NULL,
    "yearRangeJson" TEXT NOT NULL,
    "blueprintCountJson" TEXT NOT NULL,
    "blueprintPointJson" TEXT NOT NULL,
    "topicWeightsJson" TEXT NOT NULL,
    "difficultyWeightsJson" TEXT NOT NULL,
    "cognitiveWeightsJson" TEXT NOT NULL,
    "difficultyIndex" REAL NOT NULL,
    "difficultyFactorsJson" TEXT NOT NULL,
    "formatProfileJson" TEXT NOT NULL,
    "reliabilityJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME,
    "retiredAt" DATETIME
);

-- CreateTable
CREATE TABLE "SchoolProfileAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL DEFAULT 'global',
    "scopeKey" TEXT NOT NULL DEFAULT 'global',
    "profileVersionId" TEXT NOT NULL,
    "previousProfileVersionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activatedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReadinessPolicyVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "formulaKey" TEXT NOT NULL,
    "priorStrength" REAL NOT NULL,
    "priorMastery" REAL NOT NULL,
    "evidenceTarget" REAL NOT NULL,
    "evidenceExponent" REAL NOT NULL,
    "blueprintWeightMode" TEXT NOT NULL,
    "preparingThreshold" REAL NOT NULL,
    "nearReadyThreshold" REAL NOT NULL,
    "readyThreshold" REAL NOT NULL,
    "strongReadyThreshold" REAL NOT NULL,
    "overallEvidenceGate" REAL NOT NULL,
    "advancedShareGate" REAL NOT NULL,
    "advancedEvidenceGate" REAL NOT NULL,
    "criticalTopicThreshold" REAL NOT NULL,
    "criticalMasteryGate" REAL NOT NULL,
    "criticalEvidenceGate" REAL NOT NULL,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "changeSummary" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "activatedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "shadowedAt" DATETIME,
    "activatedAt" DATETIME,
    "retiredAt" DATETIME
);

-- CreateTable
CREATE TABLE "ReadinessPolicyAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL DEFAULT 'global',
    "scopeKey" TEXT NOT NULL DEFAULT 'global',
    "policyVersionId" TEXT NOT NULL,
    "previousPolicyVersionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "activatedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MasterySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "taxonomyVersion" TEXT NOT NULL,
    "assessmentRunId" TEXT NOT NULL,
    "masteryConfigHash" TEXT NOT NULL,
    "attemptSourceHash" TEXT NOT NULL,
    "recomputeJobId" TEXT,
    "cellsJson" TEXT NOT NULL,
    "topicSummaryJson" TEXT NOT NULL,
    "cognitiveSummaryJson" TEXT NOT NULL,
    "coverageSummaryJson" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReadinessSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "methodologyVersion" TEXT NOT NULL,
    "profileVersionId" TEXT NOT NULL,
    "masterySnapshotId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "recomputeJobId" TEXT,
    "schoolMastery" REAL NOT NULL,
    "schoolEvidence" REAL NOT NULL,
    "advancedEvidence" REAL,
    "readiness" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "gatesJson" TEXT NOT NULL,
    "criticalTopicsJson" TEXT NOT NULL,
    "reasonCodesJson" TEXT NOT NULL,
    "calibrationVersion" TEXT,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReadinessRecomputeJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "policyVersionId" TEXT,
    "profileVersionIdsJson" TEXT NOT NULL DEFAULT '[]',
    "taxonomyVersion" TEXT,
    "scopeJson" TEXT NOT NULL,
    "sourceVersionJson" TEXT NOT NULL,
    "targetVersionJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "requestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "successItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "checkpointJson" TEXT NOT NULL DEFAULT '{}',
    "errorSummaryJson" TEXT NOT NULL DEFAULT '{}',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReadinessRecomputeJobItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "leaseOwner" TEXT,
    "leaseExpiresAt" DATETIME,
    "error" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReadinessPolicyAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyVersionId" TEXT,
    "profileVersionId" TEXT,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT,
    "diffJson" TEXT NOT NULL DEFAULT '{}',
    "reason" TEXT NOT NULL,
    "relatedJobId" TEXT,
    "assignmentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReadinessAdminPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ContentTaxonomyMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "taxonomyVersion" TEXT NOT NULL,
    "taxonomyTopic" TEXT NOT NULL,
    "contentTopic" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Add feature flags without rebuilding the existing table. Readiness v4 must
-- remain an additive migration so older application code continues to work.
ALTER TABLE "AppSetting" ADD COLUMN "readinessV4ComputeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppSetting" ADD COLUMN "readinessV4ShadowEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppSetting" ADD COLUMN "readinessV4ReadEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AppSetting" ADD COLUMN "readinessV4PersistLegacyEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "AssessmentRun_subject_taxonomyVersion_status_idx" ON "AssessmentRun"("subject", "taxonomyVersion", "status");

-- CreateIndex
CREATE INDEX "QuestionAssessment_subject_taxonomyVersion_idx" ON "QuestionAssessment"("subject", "taxonomyVersion");

-- CreateIndex
CREATE INDEX "QuestionAssessment_topicPrimary_difficultyBand_idx" ON "QuestionAssessment"("topicPrimary", "difficultyBand");

-- CreateIndex
CREATE INDEX "QuestionAssessment_sourceRunId_idx" ON "QuestionAssessment"("sourceRunId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAssessment_questionId_taxonomyVersion_sourceRunId_key" ON "QuestionAssessment"("questionId", "taxonomyVersion", "sourceRunId");

-- CreateIndex
CREATE INDEX "SchoolProfileVersion_school_subject_status_idx" ON "SchoolProfileVersion"("school", "subject", "status");

-- CreateIndex
CREATE INDEX "SchoolProfileVersion_assessmentRunId_idx" ON "SchoolProfileVersion"("assessmentRunId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolProfileVersion_school_subject_methodologyVersion_sourceHash_key" ON "SchoolProfileVersion"("school", "subject", "methodologyVersion", "sourceHash");

-- CreateIndex
CREATE INDEX "SchoolProfileAssignment_school_subject_scopeType_scopeKey_status_idx" ON "SchoolProfileAssignment"("school", "subject", "scopeType", "scopeKey", "status");

-- CreateIndex
CREATE INDEX "SchoolProfileAssignment_profileVersionId_idx" ON "SchoolProfileAssignment"("profileVersionId");

-- CreateIndex
CREATE INDEX "ReadinessPolicyVersion_subject_status_idx" ON "ReadinessPolicyVersion"("subject", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessPolicyVersion_subject_version_key" ON "ReadinessPolicyVersion"("subject", "version");

-- CreateIndex
CREATE INDEX "ReadinessPolicyAssignment_subject_scopeType_scopeKey_status_idx" ON "ReadinessPolicyAssignment"("subject", "scopeType", "scopeKey", "status");

-- CreateIndex
CREATE INDEX "ReadinessPolicyAssignment_policyVersionId_idx" ON "ReadinessPolicyAssignment"("policyVersionId");

-- CreateIndex
CREATE INDEX "MasterySnapshot_userId_subject_computedAt_idx" ON "MasterySnapshot"("userId", "subject", "computedAt");

-- CreateIndex
CREATE INDEX "MasterySnapshot_recomputeJobId_idx" ON "MasterySnapshot"("recomputeJobId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterySnapshot_userId_subject_methodologyVersion_taxonomyVersion_assessmentRunId_masteryConfigHash_attemptSourceHash_key" ON "MasterySnapshot"("userId", "subject", "methodologyVersion", "taxonomyVersion", "assessmentRunId", "masteryConfigHash", "attemptSourceHash");

-- CreateIndex
CREATE INDEX "ReadinessSnapshot_userId_subject_computedAt_idx" ON "ReadinessSnapshot"("userId", "subject", "computedAt");

-- CreateIndex
CREATE INDEX "ReadinessSnapshot_school_subject_methodologyVersion_idx" ON "ReadinessSnapshot"("school", "subject", "methodologyVersion");

-- CreateIndex
CREATE INDEX "ReadinessSnapshot_recomputeJobId_idx" ON "ReadinessSnapshot"("recomputeJobId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessSnapshot_userId_school_subject_profileVersionId_masterySnapshotId_policyVersionId_methodologyVersion_key" ON "ReadinessSnapshot"("userId", "school", "subject", "profileVersionId", "masterySnapshotId", "policyVersionId", "methodologyVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessRecomputeJob_idempotencyKey_key" ON "ReadinessRecomputeJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ReadinessRecomputeJob_subject_status_createdAt_idx" ON "ReadinessRecomputeJob"("subject", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ReadinessRecomputeJobItem_jobId_status_idx" ON "ReadinessRecomputeJobItem"("jobId", "status");

-- CreateIndex
CREATE INDEX "ReadinessRecomputeJobItem_status_leaseExpiresAt_idx" ON "ReadinessRecomputeJobItem"("status", "leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessRecomputeJobItem_jobId_itemKey_key" ON "ReadinessRecomputeJobItem"("jobId", "itemKey");

-- CreateIndex
CREATE INDEX "ReadinessPolicyAuditLog_policyVersionId_createdAt_idx" ON "ReadinessPolicyAuditLog"("policyVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "ReadinessPolicyAuditLog_profileVersionId_createdAt_idx" ON "ReadinessPolicyAuditLog"("profileVersionId", "createdAt");

-- CreateIndex
CREATE INDEX "ReadinessPolicyAuditLog_actorUserId_createdAt_idx" ON "ReadinessPolicyAuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ReadinessAdminPermission_userId_idx" ON "ReadinessAdminPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessAdminPermission_userId_permission_key" ON "ReadinessAdminPermission"("userId", "permission");

-- CreateIndex
CREATE INDEX "ContentTaxonomyMapping_subject_taxonomyVersion_taxonomyTopic_enabled_idx" ON "ContentTaxonomyMapping"("subject", "taxonomyVersion", "taxonomyTopic", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTaxonomyMapping_subject_taxonomyVersion_taxonomyTopic_contentTopic_key" ON "ContentTaxonomyMapping"("subject", "taxonomyVersion", "taxonomyTopic", "contentTopic");

-- SQLite partial indexes enforce one active global pointer per scope while
-- still allowing an arbitrary number of ended assignment records for audit.
CREATE UNIQUE INDEX "SchoolProfileAssignment_one_active_scope"
ON "SchoolProfileAssignment"("school", "subject", "scopeType", "scopeKey")
WHERE "status" = 'active' AND "endedAt" IS NULL;

CREATE UNIQUE INDEX "ReadinessPolicyAssignment_one_active_scope"
ON "ReadinessPolicyAssignment"("subject", "scopeType", "scopeKey")
WHERE "status" = 'active' AND "endedAt" IS NULL;

-- Policy audit is append-only at the database boundary, not only by convention
-- in application repositories.
CREATE TRIGGER "ReadinessPolicyAuditLog_no_update"
BEFORE UPDATE ON "ReadinessPolicyAuditLog"
BEGIN
  SELECT RAISE(ABORT, 'ReadinessPolicyAuditLog is append-only');
END;

CREATE TRIGGER "ReadinessPolicyAuditLog_no_delete"
BEFORE DELETE ON "ReadinessPolicyAuditLog"
BEGIN
  SELECT RAISE(ABORT, 'ReadinessPolicyAuditLog is append-only');
END;
