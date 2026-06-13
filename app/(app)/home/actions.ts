"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  const targets = String(formData.get("targets") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const hours = Number(formData.get("hours") ?? 5);
  const examDate = String(formData.get("examDate") ?? "");
  const readyTarget = Number(formData.get("readyTarget") ?? 75);

  if (targets.length === 0) throw new Error("Phải chọn ít nhất 1 trường mục tiêu");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name || null,
      targets: JSON.stringify(targets),
      hours: Number.isFinite(hours) ? hours : 5,
      examDate: examDate || null,
      readyTarget: Number.isFinite(readyTarget) ? readyTarget : 75,
    },
  });

  revalidatePath("/home");
}
