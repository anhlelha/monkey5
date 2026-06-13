import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { Sidebar } from "@/components/Sidebar";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");

  const user = hydrateUser(dbUser);
  // Anyone without selected target schools goes through onboarding.
  if (user.targets.length === 0) redirect("/onboarding");

  const examCount = await prisma.exam.count();

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
        }}
        examLibraryBadge={examCount}
      />
      {children}
    </div>
  );
}
