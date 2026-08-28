import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/TopBar";
import { ReadinessPolicyManagement } from "@/components/readiness/ReadinessPolicyManagement";
import { prisma } from "@/lib/prisma";
import { getReadinessPolicyView, getReadinessPolicyViews } from "@/lib/readiness-v4/policy-view-service";
import { requireReadinessPermission } from "@/lib/readiness-v4/permissions";
import { hydrateUser } from "@/lib/user-data";

interface Props {
  params: Promise<{ policyId: string }>;
}

export default async function ReadinessPolicyDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");
  await requireReadinessPermission("readiness.view");
  const { policyId } = await params;
  const [selected, views] = await Promise.all([
    getReadinessPolicyView(policyId),
    getReadinessPolicyViews(),
  ]);
  if (!selected) notFound();

  return (
    <div className="main">
      <TopBar crumbs={[
        { label: "Quản trị", href: "/admin?tab=overview" },
        { label: "Readiness V4", href: "/admin?tab=readiness&subject=math" },
        { label: "Policy Management", href: "/admin/readiness/policies" },
        selected.version,
      ]} />
      <div className="content" style={{ maxWidth: 1500 }}>
        <ReadinessPolicyManagement views={views} selected={selected} />
      </div>
    </div>
  );
}
