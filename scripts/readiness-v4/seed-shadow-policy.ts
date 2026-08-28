import { prisma } from "../../lib/prisma";
import { createDefaultMathPolicyDraft, movePolicyDraftToShadow } from "../../lib/readiness-v4/policy-repository";

async function main(): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "admin", disabled: false },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: 2,
  });
  if (admins.length < 2) throw new Error("Four-eyes policy setup requires two active admin users");
  const draft = await createDefaultMathPolicyDraft({ actorUserId: admins[0].id });
  const shadow = await movePolicyDraftToShadow({
    policyVersionId: draft.id,
    reviewerUserId: admins[1].id,
    reason: "Approved preview policy decisions for shadow computation",
  });
  console.log(JSON.stringify({ id: shadow.id, version: shadow.version, status: shadow.status }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
