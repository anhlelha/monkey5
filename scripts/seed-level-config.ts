// Seeds LevelConfig rows for every subject (math L4/L5/NC/MIX, english A1/A2/B1,
// vietnamese NB/TH/VD) from the single source of truth in lib/plan-config.ts.
//
// Why standalone: prisma/seed.ts is NOT run during deploy (setup-remote.sh only
// runs the exam-content seeders), and a `prisma db push` that changes the
// LevelConfig primary key (single → composite [level, subject]) recreates the
// table and drops its rows. This seeder repopulates them on every content deploy.
//
// Idempotent + edit-preserving: on an existing row it refreshes only the
// non-admin-editable fields (label/sub/grades/tone/position) and LEAVES
// qcount/minutes/active untouched so values changed in the admin "Số câu luyện"
// panel survive re-deploys. Missing rows are created with the defaults.

import { PrismaClient } from "@prisma/client";
import { DEFAULT_LEVEL_CONFIGS_BY_SUBJECT } from "../lib/plan-config";

const prisma = new PrismaClient();

async function main() {
  const rows = Object.values(DEFAULT_LEVEL_CONFIGS_BY_SUBJECT).flat();
  let created = 0;
  for (const c of rows) {
    const res = await prisma.levelConfig.upsert({
      where: { level_subject: { level: c.level, subject: c.subject } },
      create: {
        level: c.level,
        subject: c.subject,
        label: c.label,
        sub: c.sub,
        qcount: c.qcount,
        minutes: c.minutes,
        grades: JSON.stringify(c.grades),
        tone: c.tone,
        position: c.position,
        active: c.active,
      },
      // Preserve admin edits: do NOT touch qcount/minutes/active here.
      update: {
        label: c.label,
        sub: c.sub,
        grades: JSON.stringify(c.grades),
        tone: c.tone,
        position: c.position,
      },
    });
    if (res) created += 1;
  }
  console.log(`✓ LevelConfig seeded/refreshed: ${rows.length} rows (${created} upserts)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
