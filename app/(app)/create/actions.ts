"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const requireAdmin = async () => {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") throw new Error("Unauthorized");
  return session.user;
};

const schema = z.object({
  style: z.string().min(1),
  qcount: z.number().int().min(1).max(50),
  minutes: z.number().int().min(5).max(180),
  note: z.string().optional(),
});

export async function createReferenceExam(input: unknown) {
  await requireAdmin();
  const parsed = schema.parse(input);

  const id = `ref-${parsed.style}-${Date.now().toString(36)}`;
  await prisma.exam.create({
    data: {
      id,
      school: parsed.style,
      kind: "reference",
      year: `Phỏng ${parsed.style.toUpperCase()} ${new Date().getFullYear()}`,
      qcount: parsed.qcount,
      minutes: parsed.minutes,
      generated: true,
      note: parsed.note ?? null,
    },
  });

  revalidatePath("/library");
  revalidatePath("/home");
  redirect(`/library?school=${parsed.style}&kind=reference`);
}
