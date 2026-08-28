import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { TopBar } from "@/components/TopBar";
import { RecomputeJobDetail } from "@/components/readiness/RecomputeJobDetail";
import { prisma } from "@/lib/prisma";
import { requireReadinessPermission } from "@/lib/readiness-v4/permissions";
import { getRecomputeJobDetail } from "@/lib/readiness-v4/job-view-service";
import { hydrateUser } from "@/lib/user-data";

interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function RecomputeJobDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");
  await requireReadinessPermission("readiness.view");
  const { jobId } = await params;
  const job = await getRecomputeJobDetail(jobId);
  if (!job) notFound();

  return (
    <div className="main">
      <TopBar crumbs={[
        { label: "Quản trị", href: "/admin?tab=overview" },
        { label: "Readiness V4", href: "/admin?tab=readiness&subject=math" },
        "Recompute Job Detail",
      ]} />
      <div className="content" style={{ maxWidth: 1500 }}>
        <RecomputeJobDetail job={job} />
      </div>
    </div>
  );
}
