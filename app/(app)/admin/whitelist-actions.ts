"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function addWhitelistEntry(formData: FormData) {
  await requireAdmin();

  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const role = (formData.get("role") as string | null) ?? "student";
  const plan = (formData.get("plan") as string | null) ?? "free";
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!email || !email.includes("@")) {
    return { error: "Email không hợp lệ" };
  }
  if (!["student", "admin"].includes(role)) {
    return { error: "Role không hợp lệ" };
  }
  if (!["free", "pro", "vip"].includes(plan)) {
    return { error: "Plan không hợp lệ" };
  }

  await prisma.userWhitelist.upsert({
    where: { email },
    create: { email, role, plan, note },
    update: { role, plan, note },
  });

  // Also apply immediately to existing User record
  await prisma.user.updateMany({
    where: { email },
    data: { role, plan },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteWhitelistEntry(email: string) {
  await requireAdmin();
  await prisma.userWhitelist.delete({ where: { email } });
  revalidatePath("/admin");
  return { success: true };
}

export async function updateUserPlan(userId: string, plan: string) {
  await requireAdmin();
  if (!["free", "pro", "vip"].includes(plan)) return { error: "Plan không hợp lệ" };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { plan },
    select: { email: true },
  });

  // Sync whitelist if this user has a whitelist entry
  if (updated.email) {
    await prisma.userWhitelist.updateMany({
      where: { email: updated.email.toLowerCase() },
      data: { plan },
    });
  }

  revalidatePath("/admin");
  return { success: true };
}
