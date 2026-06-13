import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { SCHOOLS, MIX_SCHOOL } from "@/lib/static";
import { CreateExamWizard } from "./CreateExamWizard";

export default async function CreateExamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");

  return (
    <CreateExamWizard
      schools={[...SCHOOLS, MIX_SCHOOL].map((s) => ({
        id: s.id,
        short: s.short,
        full: s.full,
        desc: s.desc,
        tone: s.tone,
        color: s.color,
        minutes: s.minutes,
      }))}
    />
  );
}
