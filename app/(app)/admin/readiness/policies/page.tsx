import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/TopBar";
import { ReadinessPolicyManagement } from "@/components/readiness/ReadinessPolicyManagement";
import { prisma } from "@/lib/prisma";
import { getReadinessPolicyViews } from "@/lib/readiness-v4/policy-view-service";
import { requireReadinessPermission } from "@/lib/readiness-v4/permissions";
import { hydrateUser } from "@/lib/user-data";

export default async function ReadinessPoliciesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");
  await requireReadinessPermission("readiness.view");
  const views = await getReadinessPolicyViews();

  return (
    <div className="main">
      <TopBar crumbs={[
        { label: "Quản trị", href: "/admin?tab=overview" },
        { label: "Readiness V4", href: "/admin?tab=readiness&subject=math" },
        "Policy Management",
      ]} />
      <div className="content" style={{ maxWidth: 1500 }}>
        <ReadinessPolicyManagement views={views} />
      </div>
    </div>
  );
}
