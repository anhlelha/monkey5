import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SchoolProfileDashboard } from "@/components/readiness/SchoolProfileDashboard";
import { TopBar } from "@/components/TopBar";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { getActiveSchoolProfileView } from "@/lib/readiness-v4/school-profile-view-service";
import { getActiveSchools } from "@/lib/schools";
import { hydrateUser } from "@/lib/user-data";
import { requireReadinessPermission } from "@/lib/readiness-v4/permissions";

interface Props {
  params: Promise<{ school: string }>;
}

export default async function AdminSchoolProfilePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");
  await requireReadinessPermission("readiness.view");

  const { school: schoolId } = await params;
  const schools = await getActiveSchools();
  const school = schools.find((row) => row.id === schoolId);
  if (!school) notFound();

  const [profile, activeProfileAssignments] = await Promise.all([
    getActiveSchoolProfileView(school.id),
    prisma.schoolProfileAssignment.findMany({
      where: {
        subject: "math",
        scopeType: "global",
        scopeKey: "global",
        status: "active",
        endedAt: null,
      },
      select: { school: true },
    }),
  ]);
  const profileSchoolIds = new Set(activeProfileAssignments.map((assignment) => assignment.school));
  const profileSchools = schools.filter((candidate) => profileSchoolIds.has(candidate.id));

  return (
    <div className="main">
      <TopBar
        crumbs={[
          { label: "Quản trị", href: "/admin?tab=overview" },
          { label: "Readiness V4", href: "/admin?tab=readiness&subject=math" },
          `School Profile · ${school.short}`,
        ]}
      />
      <div className="content" style={{ maxWidth: 1400 }}>
        {!profile ? (
          <Card title="Chưa có School Profile V2 active">
            <p className="muted">Trường này chưa có profile global đang hoạt động.</p>
          </Card>
        ) : (
          <SchoolProfileDashboard school={school} schools={profileSchools} profile={profile} />
        )}
      </div>
    </div>
  );
}
