import { auth } from "../../auth";
import { prisma } from "../prisma";

export const READINESS_PERMISSIONS = [
  "readiness.view",
  "readiness.policy.edit",
  "readiness.policy.review",
  "readiness.policy.activate",
  "readiness.recompute.operate",
] as const;

export type ReadinessPermission = (typeof READINESS_PERMISSIONS)[number];

export async function requireReadinessPermission(permission: ReadinessPermission): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") throw new Error("Unauthorized");
  const granted = await prisma.readinessAdminPermission.findUnique({
    where: { userId_permission: { userId: session.user.id, permission } },
  });
  if (!granted) throw new Error(`Missing permission: ${permission}`);
  return { id: session.user.id };
}
