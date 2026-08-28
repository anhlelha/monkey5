import { prisma } from "../prisma";

export async function activateGlobalPolicy(input: {
  policyVersionId: string;
  activatorUserId: string;
  reason: string;
}): Promise<{ assignmentId: string }> {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.readinessPolicyVersion.findUniqueOrThrow({ where: { id: input.policyVersionId } });
    if (candidate.status !== "shadow") throw new Error(`Policy must be shadow before activation; got ${candidate.status}`);
    if (!candidate.reviewedByUserId) throw new Error("Policy must have an academic reviewer");
    if (candidate.createdByUserId === input.activatorUserId) throw new Error("Four-eyes rule: creator cannot activate policy");

    const current = await tx.readinessPolicyAssignment.findFirst({
      where: { subject: candidate.subject, scopeType: "global", scopeKey: "global", status: "active", endedAt: null },
    });
    if (current) {
      await tx.readinessPolicyAssignment.update({
        where: { id: current.id },
        data: { status: "ended", endedAt: new Date() },
      });
    }
    const assignment = await tx.readinessPolicyAssignment.create({
      data: {
        subject: candidate.subject,
        scopeType: "global",
        scopeKey: "global",
        policyVersionId: candidate.id,
        previousPolicyVersionId: current?.policyVersionId,
        status: "active",
        activatedByUserId: input.activatorUserId,
        approvedByUserId: candidate.reviewedByUserId,
        reason: input.reason,
      },
    });
    await tx.readinessPolicyVersion.update({
      where: { id: candidate.id },
      data: { status: "active", activatedByUserId: input.activatorUserId, activatedAt: new Date() },
    });
    if (current && current.policyVersionId !== candidate.id) {
      const stillAssigned = await tx.readinessPolicyAssignment.count({
        where: { policyVersionId: current.policyVersionId, status: "active", endedAt: null },
      });
      if (stillAssigned === 0) {
        await tx.readinessPolicyVersion.update({
          where: { id: current.policyVersionId },
          data: { status: "retired", retiredAt: new Date() },
        });
      }
    }
    await tx.readinessPolicyAuditLog.create({
      data: {
        policyVersionId: candidate.id,
        action: "activate",
        actorUserId: input.activatorUserId,
        fromState: "shadow",
        toState: "active",
        reason: input.reason,
        assignmentId: assignment.id,
      },
    });
    return { assignmentId: assignment.id };
  });
}

export async function activateGlobalProfile(input: {
  profileVersionId: string;
  approverUserId: string;
  activatorUserId: string;
  reason: string;
}): Promise<{ assignmentId: string }> {
  if (input.approverUserId === input.activatorUserId) throw new Error("Four-eyes rule: profile approver and activator must differ");
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.schoolProfileVersion.findUniqueOrThrow({ where: { id: input.profileVersionId } });
    if (candidate.status !== "shadow") throw new Error(`Profile must be shadow before activation; got ${candidate.status}`);
    const current = await tx.schoolProfileAssignment.findFirst({
      where: {
        school: candidate.school,
        subject: candidate.subject,
        scopeType: "global",
        scopeKey: "global",
        status: "active",
        endedAt: null,
      },
    });
    if (current) {
      await tx.schoolProfileAssignment.update({ where: { id: current.id }, data: { status: "ended", endedAt: new Date() } });
    }
    const assignment = await tx.schoolProfileAssignment.create({
      data: {
        school: candidate.school,
        subject: candidate.subject,
        scopeType: "global",
        scopeKey: "global",
        profileVersionId: candidate.id,
        previousProfileVersionId: current?.profileVersionId,
        activatedByUserId: input.activatorUserId,
        approvedByUserId: input.approverUserId,
        reason: input.reason,
      },
    });
    await tx.schoolProfileVersion.update({ where: { id: candidate.id }, data: { status: "active", activatedAt: new Date() } });
    if (current && current.profileVersionId !== candidate.id) {
      const stillAssigned = await tx.schoolProfileAssignment.count({
        where: { profileVersionId: current.profileVersionId, status: "active", endedAt: null },
      });
      if (stillAssigned === 0) {
        await tx.schoolProfileVersion.update({ where: { id: current.profileVersionId }, data: { status: "retired", retiredAt: new Date() } });
      }
    }
    await tx.readinessPolicyAuditLog.create({
      data: {
        profileVersionId: candidate.id,
        action: "activate-profile",
        actorUserId: input.activatorUserId,
        fromState: "shadow",
        toState: "active",
        reason: input.reason,
        assignmentId: assignment.id,
      },
    });
    return { assignmentId: assignment.id };
  });
}

export async function resolveGlobalAssignments(): Promise<{
  policyVersionId: string | null;
  profileVersionIds: Record<string, string>;
}> {
  const [policy, profiles] = await Promise.all([
    prisma.readinessPolicyAssignment.findFirst({
      where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null },
    }),
    prisma.schoolProfileAssignment.findMany({
      where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null },
    }),
  ]);
  return {
    policyVersionId: policy?.policyVersionId ?? null,
    profileVersionIds: Object.fromEntries(profiles.map((row) => [row.school, row.profileVersionId])),
  };
}

export async function rollbackGlobalReadinessV4(input: {
  actorUserId: string;
  approverUserId: string;
  reason: string;
}): Promise<void> {
  if (input.actorUserId === input.approverUserId) throw new Error("Four-eyes rule: rollback approver and actor must differ");
  await prisma.$transaction(async (tx) => {
    const policyAssignment = await tx.readinessPolicyAssignment.findFirst({
      where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null },
    });
    if (policyAssignment) {
      await tx.readinessPolicyAssignment.update({
        where: { id: policyAssignment.id },
        data: { status: "ended", endedAt: new Date() },
      });
      await tx.readinessPolicyVersion.update({
        where: { id: policyAssignment.policyVersionId },
        data: { status: "retired", retiredAt: new Date() },
      });
      let replacementAssignmentId: string | undefined;
      if (policyAssignment.previousPolicyVersionId) {
        const replacement = await tx.readinessPolicyAssignment.create({
          data: {
            subject: "math",
            scopeType: "global",
            scopeKey: "global",
            policyVersionId: policyAssignment.previousPolicyVersionId,
            previousPolicyVersionId: policyAssignment.policyVersionId,
            activatedByUserId: input.actorUserId,
            approvedByUserId: input.approverUserId,
            reason: input.reason,
          },
        });
        replacementAssignmentId = replacement.id;
        await tx.readinessPolicyVersion.update({
          where: { id: policyAssignment.previousPolicyVersionId },
          data: { status: "active", activatedAt: new Date(), retiredAt: null },
        });
      }
      await tx.readinessPolicyAuditLog.create({
        data: {
          policyVersionId: policyAssignment.policyVersionId,
          action: "rollback",
          actorUserId: input.actorUserId,
          fromState: "active",
          toState: policyAssignment.previousPolicyVersionId ? "previous-active" : "legacy-fallback",
          reason: input.reason,
          assignmentId: replacementAssignmentId,
        },
      });
    }

    const profileAssignments = await tx.schoolProfileAssignment.findMany({
      where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null },
    });
    for (const assignment of profileAssignments) {
      await tx.schoolProfileAssignment.update({ where: { id: assignment.id }, data: { status: "ended", endedAt: new Date() } });
      await tx.schoolProfileVersion.update({ where: { id: assignment.profileVersionId }, data: { status: "retired", retiredAt: new Date() } });
      let replacementAssignmentId: string | undefined;
      if (assignment.previousProfileVersionId) {
        const replacement = await tx.schoolProfileAssignment.create({
          data: {
            school: assignment.school,
            subject: "math",
            scopeType: "global",
            scopeKey: "global",
            profileVersionId: assignment.previousProfileVersionId,
            previousProfileVersionId: assignment.profileVersionId,
            activatedByUserId: input.actorUserId,
            approvedByUserId: input.approverUserId,
            reason: input.reason,
          },
        });
        replacementAssignmentId = replacement.id;
        await tx.schoolProfileVersion.update({
          where: { id: assignment.previousProfileVersionId },
          data: { status: "active", activatedAt: new Date(), retiredAt: null },
        });
      }
      await tx.readinessPolicyAuditLog.create({
        data: {
          profileVersionId: assignment.profileVersionId,
          action: "rollback-profile",
          actorUserId: input.actorUserId,
          fromState: "active",
          toState: assignment.previousProfileVersionId ? "previous-active" : "legacy-fallback",
          reason: input.reason,
          assignmentId: replacementAssignmentId,
        },
      });
    }
  });
}
