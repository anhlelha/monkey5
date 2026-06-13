import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser, firstName } from "@/lib/user-data";
import { SCHOOLS } from "@/lib/static";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");

  const user = hydrateUser(dbUser);

  // Already onboarded → straight to home.
  if (user.targets.length > 0) redirect("/home");

  return (
    <OnboardingForm
      firstName={firstName(user.name)}
      schools={SCHOOLS.map((s) => ({
        id: s.id,
        full: s.full,
        short: s.short,
        tone: s.tone,
        desc: s.desc,
      }))}
    />
  );
}
