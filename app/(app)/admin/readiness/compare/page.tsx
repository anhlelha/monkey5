import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SchoolProfileComparison } from "@/components/readiness/SchoolProfileComparison";
import { TopBar } from "@/components/TopBar";
import { prisma } from "@/lib/prisma";
import { requireReadinessPermission } from "@/lib/readiness-v4/permissions";
import {
  getActiveSchoolProfileComparison,
  type ComparisonSortMetric,
  type ComparisonWeightMode,
} from "@/lib/readiness-v4/school-profile-comparison-service";
import { hydrateUser } from "@/lib/user-data";

interface Props {
  searchParams: Promise<{
    schools?: string;
    metric?: string;
    weight?: string;
    sort?: string;
  }>;
}

const METRICS = new Set<ComparisonSortMetric>([
  "difficultyIndex",
  "averageDifficulty",
  "advancedShare",
  "questionsPerMinute",
  "examCount",
  "assessmentCoverage",
  "assessmentConfidence",
]);

export default async function AdminSchoolProfileComparisonPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");
  await requireReadinessPermission("readiness.view");

  const [params, view] = await Promise.all([searchParams, getActiveSchoolProfileComparison()]);
  const metric = METRICS.has(params.metric as ComparisonSortMetric)
    ? params.metric as ComparisonSortMetric
    : "difficultyIndex";
  const weight: ComparisonWeightMode = params.weight === "point" ? "point" : "count";
  const direction = params.sort === "asc" ? "asc" as const : "desc" as const;
  const selectedSchools = (params.schools ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => /^[a-z][a-z0-9]{0,15}$/.test(value))
    .slice(0, 4);

  return (
    <div className="main">
      <TopBar
        crumbs={[
          { label: "Quản trị", href: "/admin?tab=overview" },
          { label: "Readiness V4", href: "/admin?tab=readiness&subject=math" },
          "So sánh School Profile",
        ]}
      />
      <div className="content" style={{ maxWidth: 1500 }}>
        <SchoolProfileComparison
          rows={view.rows}
          summary={view.summary}
          topics={view.topics}
          initialSchools={selectedSchools}
          initialMetric={metric}
          initialWeight={weight}
          initialDirection={direction}
        />
      </div>
    </div>
  );
}
