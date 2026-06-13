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
  topicId: z.string().min(1),
  name: z.string().min(1),
  difficulty: z.string().min(1),
  qcount: z.number().int().min(1).max(50),
  minutes: z.number().int().min(5).max(180),
  tags: z.array(z.string()).default([]),
});

export async function createTopicSet(input: unknown) {
  const user = await requireAdmin();
  const parsed = schema.parse(input);

  await prisma.customSet.create({
    data: {
      topic: parsed.topicId,
      name: parsed.name,
      difficulty: parsed.difficulty,
      qcount: parsed.qcount,
      minutes: parsed.minutes,
      kind: "reference",
      source: parsed.tags.length > 0 ? parsed.tags.join(" · ") : "Phỏng tạo từ ngân hàng",
      tags: JSON.stringify(parsed.tags),
      createdById: user.id,
    },
  });

  revalidatePath("/topics");
  redirect(`/topics/${parsed.topicId}`);
}
