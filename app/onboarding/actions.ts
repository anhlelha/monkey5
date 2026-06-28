"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function completeOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const targets = (formData.get("targets") as string)
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];
  const hours = Number(formData.get("hours") ?? 5);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      targets: JSON.stringify(targets),
      hours: Number.isFinite(hours) ? hours : 5,
    },
  });

  revalidatePath("/home");
  revalidatePath("/overview");
  redirect("/overview");
}
