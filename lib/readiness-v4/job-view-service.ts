import { prisma } from "@/lib/prisma";
import { stableHash } from "./hashing";

interface ParsedJson {
  [key: string]: unknown;
}

export interface RecomputeJobItemView {
  id: string;
  itemKey: string;
  status: string;
  attemptCount: number;
  leaseOwner: string | null;
  leaseExpiresAt: string | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface RecomputeJobDetailView {
  id: string;
  subject: string;
  jobType: string;
  reason: string;
  mode: string;
  status: string;
  policyVersionId: string | null;
  profileVersionIds: string[];
  taxonomyVersion: string | null;
  scope: ParsedJson;
  sourceVersion: ParsedJson;
  targetVersion: ParsedJson;
  checkpoint: ParsedJson;
  errorSummary: ParsedJson;
  requestedByUserId: string | null;
  approvedByUserId: string | null;
  totalItems: number;
  processedItems: number;
  successItems: number;
  failedItems: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  queueDepth: number;
  oldestQueuedAgeSeconds: number | null;
  workerHeartbeat: { active: boolean; leaseExpiresAt: string | null };
  latency: { p50Ms: number | null; p95Ms: number | null };
  failureRate: number;
  items: RecomputeJobItemView[];
  reconciliation: {
    expectedPairs: number;
    snapshotPairs: number;
    missingPairs: number;
    duplicateLogicalResults: number;
    stalePairs: number;
    statusDistribution: Record<string, number>;
  };
}

function parseJson(value: string): ParsedJson {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as ParsedJson : {};
  } catch {
    return {};
  }
}

function parseStringList(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function percentile(values: number[], fraction: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function safeError(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 500);
}

export async function getRecomputeJobDetail(jobId: string): Promise<RecomputeJobDetailView | null> {
  const job = await prisma.readinessRecomputeJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  const [items, snapshotRows, queuedRows] = await Promise.all([
    prisma.readinessRecomputeJobItem.findMany({ where: { jobId }, orderBy: { createdAt: "asc" } }),
    prisma.readinessSnapshot.findMany({
      where: { recomputeJobId: jobId },
      select: { userId: true, school: true, policyVersionId: true, profileVersionId: true, status: true, computedAt: true },
    }),
    prisma.readinessRecomputeJobItem.findMany({ where: { status: "queued" }, select: { createdAt: true }, orderBy: { createdAt: "asc" }, take: 1 }),
  ]);

  const profileVersionIds = parseStringList(job.profileVersionIdsJson);
  const expectedPairs = job.totalItems * profileVersionIds.length;
  const logicalKeys = new Set<string>();
  let duplicateLogicalResults = 0;
  let stalePairs = 0;
  const statusDistribution: Record<string, number> = {};
  for (const row of snapshotRows) {
    const key = `${row.userId}:${row.school}:${row.policyVersionId}:${row.profileVersionId}`;
    if (logicalKeys.has(key)) duplicateLogicalResults += 1;
    logicalKeys.add(key);
    statusDistribution[row.status] = (statusDistribution[row.status] ?? 0) + 1;
    if (job.policyVersionId && row.policyVersionId !== job.policyVersionId) stalePairs += 1;
  }

  const now = Date.now();
  const queuedCreatedAt = queuedRows[0]?.createdAt.getTime() ?? null;
  const running = items.filter((item) => item.status === "running");
  const latencies = items
    .filter((item) => item.startedAt && item.completedAt)
    .map((item) => item.completedAt!.getTime() - item.startedAt!.getTime());
  const activeLease = running.find((item) => item.leaseExpiresAt && item.leaseExpiresAt.getTime() > now);
  const itemsView = items.map((item) => ({
    id: item.id,
    itemKey: item.itemKey.startsWith("user:") ? `user:${stableHash(item.itemKey.slice(5)).slice(0, 12)}` : item.itemKey,
    status: item.status,
    attemptCount: item.attemptCount,
    leaseOwner: item.leaseOwner,
    leaseExpiresAt: item.leaseExpiresAt?.toISOString() ?? null,
    error: safeError(item.error),
    startedAt: item.startedAt?.toISOString() ?? null,
    completedAt: item.completedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
  }));

  return {
    id: job.id,
    subject: job.subject,
    jobType: job.jobType,
    reason: job.reason,
    mode: job.mode,
    status: job.status,
    policyVersionId: job.policyVersionId,
    profileVersionIds,
    taxonomyVersion: job.taxonomyVersion,
    scope: parseJson(job.scopeJson),
    sourceVersion: parseJson(job.sourceVersionJson),
    targetVersion: parseJson(job.targetVersionJson),
    checkpoint: parseJson(job.checkpointJson),
    errorSummary: parseJson(job.errorSummaryJson),
    requestedByUserId: job.requestedByUserId,
    approvedByUserId: job.approvedByUserId,
    totalItems: job.totalItems,
    processedItems: job.processedItems,
    successItems: job.successItems,
    failedItems: job.failedItems,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
    queueDepth: items.filter((item) => item.status === "queued").length,
    oldestQueuedAgeSeconds: queuedCreatedAt ? Math.max(0, (now - queuedCreatedAt) / 1000) : null,
    workerHeartbeat: { active: Boolean(activeLease), leaseExpiresAt: activeLease?.leaseExpiresAt?.toISOString() ?? null },
    latency: { p50Ms: percentile(latencies, 0.5), p95Ms: percentile(latencies, 0.95) },
    failureRate: job.processedItems ? job.failedItems / job.processedItems : 0,
    items: itemsView,
    reconciliation: {
      expectedPairs,
      snapshotPairs: logicalKeys.size,
      missingPairs: Math.max(0, expectedPairs - logicalKeys.size),
      duplicateLogicalResults,
      stalePairs,
      statusDistribution,
    },
  };
}
