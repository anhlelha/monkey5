import { prisma } from "@/lib/prisma";
import { policyFromRow } from "./policy-repository";
import type { ReadinessPolicy } from "./types";

export type ReadinessPolicyStatus = "draft" | "shadow" | "active" | "retired";

export interface ReadinessPolicyAuditView {
  id: string;
  action: string;
  actorUserId: string;
  fromState: string | null;
  toState: string | null;
  diff: unknown;
  reason: string;
  createdAt: string;
}

export interface ReadinessPolicyView {
  id: string;
  subject: string;
  version: string;
  methodologyVersion: string;
  status: string;
  changeSummary: string;
  createdByUserId: string;
  reviewedByUserId: string | null;
  activatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  shadowedAt: string | null;
  activatedAt: string | null;
  retiredAt: string | null;
  policy: ReadinessPolicy | null;
  validationError: string | null;
  assignment: {
    id: string;
    status: string;
    policyVersionId: string;
    previousPolicyVersionId: string | null;
    activatedByUserId: string;
    approvedByUserId: string;
    reason: string;
    effectiveFrom: string;
    endedAt: string | null;
  } | null;
  audits: ReadinessPolicyAuditView[];
}

function parseDiff(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return { raw: value };
  }
}

function toView(
  row: Awaited<ReturnType<typeof prisma.readinessPolicyVersion.findUniqueOrThrow>>,
  assignment: Awaited<ReturnType<typeof prisma.readinessPolicyAssignment.findFirst>>,
  audits: Awaited<ReturnType<typeof prisma.readinessPolicyAuditLog.findMany>>,
): ReadinessPolicyView {
  let policy: ReadinessPolicy | null = null;
  let validationError: string | null = null;
  try {
    policy = policyFromRow(row);
  } catch (error) {
    validationError = error instanceof Error ? error.message : String(error);
  }

  return {
    id: row.id,
    subject: row.subject,
    version: row.version,
    methodologyVersion: row.methodologyVersion,
    status: row.status,
    changeSummary: row.changeSummary,
    createdByUserId: row.createdByUserId,
    reviewedByUserId: row.reviewedByUserId,
    activatedByUserId: row.activatedByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    shadowedAt: row.shadowedAt?.toISOString() ?? null,
    activatedAt: row.activatedAt?.toISOString() ?? null,
    retiredAt: row.retiredAt?.toISOString() ?? null,
    policy,
    validationError,
    assignment: assignment
      ? {
          id: assignment.id,
          status: assignment.status,
          policyVersionId: assignment.policyVersionId,
          previousPolicyVersionId: assignment.previousPolicyVersionId,
          activatedByUserId: assignment.activatedByUserId,
          approvedByUserId: assignment.approvedByUserId,
          reason: assignment.reason,
          effectiveFrom: assignment.effectiveFrom.toISOString(),
          endedAt: assignment.endedAt?.toISOString() ?? null,
        }
      : null,
    audits: audits.map((audit) => ({
      id: audit.id,
      action: audit.action,
      actorUserId: audit.actorUserId,
      fromState: audit.fromState,
      toState: audit.toState,
      diff: parseDiff(audit.diffJson),
      reason: audit.reason,
      createdAt: audit.createdAt.toISOString(),
    })),
  };
}

export async function getReadinessPolicyViews(): Promise<ReadinessPolicyView[]> {
  const rows = await prisma.readinessPolicyVersion.findMany({
    where: { subject: "math" },
    orderBy: { createdAt: "desc" },
  });
  if (!rows.length) return [];

  const [assignments, audits] = await Promise.all([
    prisma.readinessPolicyAssignment.findMany({
      where: { subject: "math", scopeType: "global", scopeKey: "global" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.readinessPolicyAuditLog.findMany({
      where: { policyVersionId: { in: rows.map((row) => row.id) } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const assignmentByPolicy = new Map<string, (typeof assignments)[number]>();
  for (const assignment of assignments) {
    if (!assignmentByPolicy.has(assignment.policyVersionId)) assignmentByPolicy.set(assignment.policyVersionId, assignment);
  }
  const auditsByPolicy = new Map<string, (typeof audits)[number][]>();
  for (const audit of audits) {
    if (!audit.policyVersionId) continue;
    const current = auditsByPolicy.get(audit.policyVersionId) ?? [];
    current.push(audit);
    auditsByPolicy.set(audit.policyVersionId, current);
  }

  return rows.map((row) => toView(row, assignmentByPolicy.get(row.id) ?? null, auditsByPolicy.get(row.id) ?? []));
}

export async function getReadinessPolicyView(policyVersionId: string): Promise<ReadinessPolicyView | null> {
  const row = await prisma.readinessPolicyVersion.findFirst({
    where: { id: policyVersionId, subject: "math" },
  });
  if (!row) return null;

  const [assignment, audits] = await Promise.all([
    prisma.readinessPolicyAssignment.findFirst({
      where: { subject: "math", scopeType: "global", scopeKey: "global", policyVersionId: row.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.readinessPolicyAuditLog.findMany({
      where: { policyVersionId: row.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return toView(row, assignment, audits);
}
