import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/TopBar";
import { ProfileLifecycle } from "@/components/readiness/ProfileLifecycle";
import { prisma } from "@/lib/prisma";
import { requireReadinessPermission } from "@/lib/readiness-v4/permissions";
import { getProfileLifecycleViews } from "@/lib/readiness-v4/profile-lifecycle-service";
import { getActiveSchools } from "@/lib/schools";
import { hydrateUser } from "@/lib/user-data";

export default async function ProfileLifecyclePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");
  await requireReadinessPermission("readiness.view");
  const [rows, schools, assessmentRuns] = await Promise.all([
    getProfileLifecycleViews(),
    getActiveSchools(),
    prisma.assessmentRun.findMany({
      where: { subject: "math", status: "approved" },
      select: { id: true, taxonomyVersion: true, inputHash: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="main">
      <TopBar crumbs={[
        { label: "Quản trị", href: "/admin?tab=overview" },
        { label: "Readiness V4", href: "/admin?tab=readiness&subject=math" },
        "Profile lifecycle",
      ]} />
      <div className="content" style={{ maxWidth: 1500 }}>
        <ProfileLifecycle
          rows={rows}
          schools={schools.map((school) => ({ id: school.id, short: school.short, name: school.name }))}
          assessmentRuns={assessmentRuns.map((run) => ({ id: run.id, version: run.taxonomyVersion, inputHash: run.inputHash, createdAt: run.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
