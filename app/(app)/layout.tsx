import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { getQuietHours, isInQuietHours } from "@/lib/app-settings";
import { Sidebar } from "@/components/Sidebar";
import { QuietHoursLock } from "@/components/QuietHoursLock";

// Routes exempt from the quiet-hours lock so students can still read why the
// system is closed and manage their account.
const QUIET_HOURS_ALLOWED_PREFIXES = ["/guide", "/onboarding"];

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");

  const user = hydrateUser(dbUser);
  if (user.disabled) redirect("/signin?disabled=1");
  // Anyone without selected target schools goes through onboarding.
  if (user.targets.length === 0) redirect("/onboarding");

  const [examCount, quietHours] = await Promise.all([
    prisma.exam.count(),
    getQuietHours(),
  ]);

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAllowedDuringQuietHours = QUIET_HOURS_ALLOWED_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );
  const isStudent = user.role !== "admin";
  const quietHoursActive = isInQuietHours(quietHours);
  const showLock =
    isStudent && quietHoursActive && !isAllowedDuringQuietHours;

  return (
    <div className="app">
      <Sidebar
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          grade: user.grade,
          role: user.role,
          plan: user.plan,
          targets: user.targets,
          hours: user.hours,
          examDate: user.examDate,
          readyTarget: user.readyTarget,
          theme: user.theme,
        }}
        examLibraryBadge={examCount}
      />
      {showLock ? (
        <QuietHoursLock start={quietHours.start} end={quietHours.end} />
      ) : (
        children
      )}
    </div>
  );
}
