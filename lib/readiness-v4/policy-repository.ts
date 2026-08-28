import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { DEFAULT_MATH_READINESS_POLICY_V1, validateReadinessPolicy } from "./policy";
import type { ReadinessPolicy } from "./types";

type PolicyRow = Awaited<ReturnType<typeof prisma.readinessPolicyVersion.findUniqueOrThrow>>;

export function policyFromRow(row: PolicyRow): ReadinessPolicy {
  return validateReadinessPolicy({
    formulaKey: row.formulaKey,
    priorStrength: row.priorStrength,
    priorMastery: row.priorMastery,
    evidenceTarget: row.evidenceTarget,
    evidenceExponent: row.evidenceExponent,
    blueprintWeightMode: row.blueprintWeightMode,
    preparingThreshold: row.preparingThreshold,
    nearReadyThreshold: row.nearReadyThreshold,
    readyThreshold: row.readyThreshold,
    strongReadyThreshold: row.strongReadyThreshold,
    overallEvidenceGate: row.overallEvidenceGate,
    advancedShareGate: row.advancedShareGate,
    advancedEvidenceGate: row.advancedEvidenceGate,
    criticalTopicThreshold: row.criticalTopicThreshold,
    criticalMasteryGate: row.criticalMasteryGate,
    criticalEvidenceGate: row.criticalEvidenceGate,
  });
}

function policyData(policy: ReadinessPolicy): Omit<Prisma.ReadinessPolicyVersionUncheckedCreateInput,
  "id" | "subject" | "version" | "methodologyVersion" | "status" | "changeSummary" | "createdByUserId"
> {
  return {
    ...policy,
    configJson: "{}",
  };
}

export async function createDefaultMathPolicyDraft(input: {
  actorUserId: string;
  version?: string;
}): Promise<PolicyRow> {
  const version = input.version ?? "math-readiness-policy-v1";
  const existing = await prisma.readinessPolicyVersion.findUnique({
    where: { subject_version: { subject: "math", version } },
  });
  if (existing) return existing;
  return prisma.$transaction(async (tx) => {
    const created = await tx.readinessPolicyVersion.create({
      data: {
        subject: "math",
        version,
        methodologyVersion: "readiness-v4",
        status: "draft",
        changeSummary: "Initial Readiness v4 preview policy",
        createdByUserId: input.actorUserId,
        ...policyData(DEFAULT_MATH_READINESS_POLICY_V1),
      },
    });
    await tx.readinessPolicyAuditLog.create({
      data: {
        policyVersionId: created.id,
        action: "create",
        actorUserId: input.actorUserId,
        toState: "draft",
        diffJson: JSON.stringify(DEFAULT_MATH_READINESS_POLICY_V1),
        reason: "Initial preview policy",
      },
    });
    return created;
  });
}

export async function movePolicyDraftToShadow(input: {
  policyVersionId: string;
  reviewerUserId: string;
  reason: string;
}): Promise<PolicyRow> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.readinessPolicyVersion.findUniqueOrThrow({ where: { id: input.policyVersionId } });
    if (current.status === "shadow") return current;
    if (current.status !== "draft") throw new Error(`Only draft policy can move to shadow; got ${current.status}`);
    if (current.createdByUserId === input.reviewerUserId) throw new Error("Four-eyes rule: reviewer must differ from creator");
    policyFromRow(current);
    const updated = await tx.readinessPolicyVersion.update({
      where: { id: current.id },
      data: { status: "shadow", reviewedByUserId: input.reviewerUserId, shadowedAt: new Date() },
    });
    await tx.readinessPolicyAuditLog.create({
      data: {
        policyVersionId: current.id,
        action: "shadow",
        actorUserId: input.reviewerUserId,
        fromState: "draft",
        toState: "shadow",
        reason: input.reason,
      },
    });
    return updated;
  });
}

export async function getShadowMathPolicy(): Promise<{ row: PolicyRow; policy: ReadinessPolicy }> {
  const row = await prisma.readinessPolicyVersion.findFirst({
    where: { subject: "math", status: "shadow" },
    orderBy: { createdAt: "desc" },
  });
  if (!row) throw new Error("No shadow math readiness policy found");
  return { row, policy: policyFromRow(row) };
}

export async function clonePolicyToDraft(input: {
  sourcePolicyVersionId: string;
  version: string;
  actorUserId: string;
  changeSummary: string;
}): Promise<PolicyRow> {
  const source = await prisma.readinessPolicyVersion.findUniqueOrThrow({ where: { id: input.sourcePolicyVersionId } });
  const policy = policyFromRow(source);
  return prisma.$transaction(async (tx) => {
    const created = await tx.readinessPolicyVersion.create({
      data: {
        subject: source.subject,
        version: input.version,
        methodologyVersion: source.methodologyVersion,
        status: "draft",
        changeSummary: input.changeSummary,
        createdByUserId: input.actorUserId,
        ...policyData(policy),
      },
    });
    await tx.readinessPolicyAuditLog.create({
      data: {
        policyVersionId: created.id,
        action: "create",
        actorUserId: input.actorUserId,
        toState: "draft",
        diffJson: JSON.stringify({ clonedFrom: source.id }),
        reason: input.changeSummary,
      },
    });
    return created;
  });
}

export async function updatePolicyDraft(input: {
  policyVersionId: string;
  actorUserId: string;
  policy: unknown;
  reason: string;
}): Promise<PolicyRow> {
  const policy = validateReadinessPolicy(input.policy);
  return prisma.$transaction(async (tx) => {
    const current = await tx.readinessPolicyVersion.findUniqueOrThrow({ where: { id: input.policyVersionId } });
    if (current.status !== "draft") throw new Error(`Only draft policy content can be edited; got ${current.status}`);
    const before = policyFromRow(current);
    const updated = await tx.readinessPolicyVersion.update({
      where: { id: current.id },
      data: policyData(policy),
    });
    await tx.readinessPolicyAuditLog.create({
      data: {
        policyVersionId: current.id,
        action: "edit-draft",
        actorUserId: input.actorUserId,
        fromState: "draft",
        toState: "draft",
        diffJson: JSON.stringify({ before, after: policy }),
        reason: input.reason,
      },
    });
    return updated;
  });
}
