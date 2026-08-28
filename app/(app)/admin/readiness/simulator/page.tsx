import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/TopBar";
import { ReadinessSimulator } from "@/components/readiness/ReadinessSimulator";
import { ReadinessActiveCandidateComparison } from "@/components/readiness/ReadinessActiveCandidateComparison";
import { prisma } from "@/lib/prisma";
import { requireReadinessPermission } from "@/lib/readiness-v4/permissions";
import { getReadinessPolicyViews } from "@/lib/readiness-v4/policy-view-service";
import { buildActiveCandidateComparison, buildShadowComparison } from "@/lib/readiness-v4/simulator-service";
import { hydrateUser } from "@/lib/user-data";

interface Props {
  searchParams: Promise<{ policy?: string; profiles?: string | string[] }>;
}

function asList(value: string | string[] | undefined): string[] {
  return (Array.isArray(value) ? value : value ? [value] : [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export default async function ReadinessSimulatorPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");
  await requireReadinessPermission("readiness.view");

  const [params, policies, profileRows] = await Promise.all([
    searchParams,
    getReadinessPolicyViews(),
    prisma.schoolProfileVersion.findMany({
      where: { subject: "math", status: { in: ["shadow", "active"] } },
      select: { id: true, school: true, status: true, sourceHash: true },
      orderBy: [{ status: "asc" }, { school: "asc" }],
    }),
  ]);
  const candidates = policies.filter((policy) => policy.status === "draft" || policy.status === "shadow");
  const selectedPolicyId = candidates.some((policy) => policy.id === params.policy)
    ? params.policy as string
    : candidates[0]?.id ?? "";
  const validProfileIds = new Set(profileRows.map((profile) => profile.id));
  const requestedProfileIds = asList(params.profiles).filter((id) => validProfileIds.has(id));
  const selectedProfileIds = requestedProfileIds.length
    ? requestedProfileIds
    : profileRows.filter((profile) => profile.status === "shadow").map((profile) => profile.id);
  const candidateProfileIds = selectedProfileIds.filter((id) => profileRows.some((profile) => profile.id === id && profile.status === "shadow"));
  const simulation = selectedPolicyId
    ? await buildShadowComparison(selectedPolicyId, selectedProfileIds)
    : { rows: [], summary: { policyVersionId: "", users: 0, schools: 0, snapshotsCompared: 0, invariantViolations: 0, bySchool: {} } };
  const activeCandidate = selectedPolicyId
    ? await buildActiveCandidateComparison({ candidatePolicyVersionId: selectedPolicyId, candidateProfileVersionIds: candidateProfileIds })
    : {
        rows: [],
        summary: {
          activePolicyVersionId: null,
          candidatePolicyVersionId: "",
          activeProfileVersionIds: [],
          candidateProfileVersionIds: [],
          users: 0,
          schools: 0,
          snapshotsCompared: 0,
          invariantViolations: 0,
          bySchool: {},
          policyChanges: [],
        },
      };

  return (
    <div className="main">
      <TopBar crumbs={[
        { label: "Quản trị", href: "/admin?tab=overview" },
        { label: "Readiness V4", href: "/admin?tab=readiness&subject=math" },
        "Simulator",
      ]} />
      <div className="content" style={{ maxWidth: 1500 }}>
        <ReadinessSimulator
          policies={candidates}
          profiles={profileRows}
          selectedPolicyId={selectedPolicyId}
          selectedProfileIds={selectedProfileIds}
          rows={simulation.rows}
          summary={simulation.summary}
        />
        <ReadinessActiveCandidateComparison rows={activeCandidate.rows} summary={activeCandidate.summary} />
      </div>
    </div>
  );
}
