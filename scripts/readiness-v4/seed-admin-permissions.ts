import { prisma } from "../../lib/prisma";
import { READINESS_PERMISSIONS } from "../../lib/readiness-v4/permissions";

async function main(): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "admin", disabled: false },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admins.length) throw new Error("No active admin user found");
  const grantor = admins[0].id;
  for (const admin of admins) {
    for (const permission of READINESS_PERMISSIONS) {
      await prisma.readinessAdminPermission.upsert({
        where: { userId_permission: { userId: admin.id, permission } },
        create: { userId: admin.id, permission, grantedByUserId: grantor },
        update: {},
      });
    }
  }
  console.log(JSON.stringify({ admins: admins.length, permissionsEach: READINESS_PERMISSIONS.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
