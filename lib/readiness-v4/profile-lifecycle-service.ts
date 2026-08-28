import { prisma } from "@/lib/prisma";

interface ReliabilityJson {
  flags?: string[];
  examCount?: number;
  questionCount?: number;
  yearCount?: number;
  yearRange?: string[];
}

interface WeightJson {
  count?: Record<string, number>;
  point?: Record<string, number>;
}

export interface ProfileLifecycleVersionView {
  id: string;
  school: string;
  status: string;
  taxonomyVersion: string;
  methodologyVersion: string;
  assessmentRunId: string;
  sourceHash: string;
  sourceExamIds: string[];
  examCount: number;
  questionCount: number;
  yearCount: number;
  yearRange: string[];
  difficultyIndex: number;
  reliabilityFlags: string[];
  createdAt: string;
  activatedAt: string | null;
  retiredAt: string | null;
  activeAssignmentId: string | null;
  reviewedByUserId: string | null;
  approvedByUserId: string | null;
}

export interface ProfileCandidateComparisonView {
  school: string;
  active: ProfileLifecycleVersionView | null;
  candidate: ProfileLifecycleVersionView | null;
  versions: ProfileLifecycleVersionView[];
  delta: {
    examAdded: number;
    examRemoved: number;
    questionCount: number;
    difficultyIndex: number | null;
    reliabilityFlagsAdded: string[];
    reliabilityFlagsRemoved: string[];
    sourceChanged: boolean;
  } | null;
}

function parse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toVersion(
  row: Awaited<ReturnType<typeof prisma.schoolProfileVersion.findUniqueOrThrow>>,
  activeAssignmentId: string | null,
  audits: Array<{ action: string; actorUserId: string }>,
): ProfileLifecycleVersionView {
  const reliability = parse<ReliabilityJson>(row.reliabilityJson, {});
  return {
    id: row.id,
    school: row.school,
    status: row.status,
    taxonomyVersion: row.taxonomyVersion,
    methodologyVersion: row.methodologyVersion,
    assessmentRunId: row.assessmentRunId,
    sourceHash: row.sourceHash,
    sourceExamIds: parse<string[]>(row.sourceExamIdsJson, []),
    examCount: row.examCount,
    questionCount: row.questionCount,
    yearCount: row.yearCount,
    yearRange: parse<string[]>(row.yearRangeJson, []),
    difficultyIndex: row.difficultyIndex,
    reliabilityFlags: reliability.flags ?? [],
    createdAt: row.createdAt.toISOString(),
    activatedAt: row.activatedAt?.toISOString() ?? null,
    retiredAt: row.retiredAt?.toISOString() ?? null,
    activeAssignmentId,
    reviewedByUserId: audits.find((audit) => audit.action === "review-profile")?.actorUserId ?? null,
    approvedByUserId: audits.find((audit) => audit.action === "approve-profile")?.actorUserId ?? null,
  };
}

function compare(active: ProfileLifecycleVersionView | null, candidate: ProfileLifecycleVersionView | null): ProfileCandidateComparisonView["delta"] {
  if (!active || !candidate) return null;
  const activeExams = new Set(active.sourceExamIds);
  const candidateExams = new Set(candidate.sourceExamIds);
  const flags = (values: string[]) => new Set(values);
  const activeFlags = flags(active.reliabilityFlags);
  const candidateFlags = flags(candidate.reliabilityFlags);
  return {
    examAdded: candidate.sourceExamIds.filter((id) => !activeExams.has(id)).length,
    examRemoved: active.sourceExamIds.filter((id) => !candidateExams.has(id)).length,
    questionCount: candidate.questionCount - active.questionCount,
    difficultyIndex: candidate.difficultyIndex - active.difficultyIndex,
    reliabilityFlagsAdded: candidate.reliabilityFlags.filter((flag) => !activeFlags.has(flag)),
    reliabilityFlagsRemoved: active.reliabilityFlags.filter((flag) => !candidateFlags.has(flag)),
    sourceChanged: candidate.sourceHash !== active.sourceHash,
  };
}

export async function getProfileLifecycleViews(): Promise<ProfileCandidateComparisonView[]> {
  const [rows, assignments] = await Promise.all([
    prisma.schoolProfileVersion.findMany({ where: { subject: "math" }, orderBy: [{ school: "asc" }, { createdAt: "desc" }] }),
    prisma.schoolProfileAssignment.findMany({
      where: { subject: "math", scopeType: "global", scopeKey: "global", status: "active", endedAt: null },
      select: { id: true, school: true, profileVersionId: true },
    }),
  ]);
  const audits = rows.length
    ? await prisma.readinessPolicyAuditLog.findMany({
        where: { profileVersionId: { in: rows.map((row) => row.id) } },
        select: { profileVersionId: true, action: true, actorUserId: true },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const auditsByProfile = new Map<string, Array<{ action: string; actorUserId: string }>>();
  for (const audit of audits) {
    if (!audit.profileVersionId) continue;
    const profileAudits = auditsByProfile.get(audit.profileVersionId) ?? [];
    profileAudits.push({ action: audit.action, actorUserId: audit.actorUserId });
    auditsByProfile.set(audit.profileVersionId, profileAudits);
  }
  const assignmentBySchool = new Map(assignments.map((assignment) => [assignment.school, assignment]));
  const activeBySchool = new Map<string, ProfileLifecycleVersionView>();
  const candidateBySchool = new Map<string, ProfileLifecycleVersionView>();
  const versionsBySchool = new Map<string, ProfileLifecycleVersionView[]>();
  for (const row of rows) {
    const assignment = assignmentBySchool.get(row.school);
    const version = toVersion(row, assignment?.profileVersionId === row.id ? assignment.id : null, auditsByProfile.get(row.id) ?? []);
    const versions = versionsBySchool.get(row.school) ?? [];
    versions.push(version);
    versionsBySchool.set(row.school, versions);
    if (assignment?.profileVersionId === row.id) activeBySchool.set(row.school, version);
    if (row.status === "shadow" && !candidateBySchool.has(row.school)) candidateBySchool.set(row.school, version);
  }
  const schools = new Set([...activeBySchool.keys(), ...candidateBySchool.keys(), ...rows.map((row) => row.school)]);
  return [...schools].sort().map((school) => {
    const active = activeBySchool.get(school) ?? null;
    const candidate = candidateBySchool.get(school) ?? null;
    return { school, active, candidate, versions: versionsBySchool.get(school) ?? [], delta: compare(active, candidate) };
  });
}
