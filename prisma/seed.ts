// Seed reference data: topics only.
// Optionally promotes SEED_ADMIN_EMAIL to admin role.

import { PrismaClient } from "@prisma/client";
import { DEFAULT_TOPICS } from "../lib/static";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding topics");
  for (let i = 0; i < DEFAULT_TOPICS.length; i++) {
    const t = DEFAULT_TOPICS[i];
    await prisma.topic.upsert({
      where: { id: t.id },
      create: { id: t.id, name: t.name, short: t.short, ico: t.ico, color: t.color, position: i },
      update: { name: t.name, short: t.short, ico: t.ico, color: t.color, position: i },
    });
  }

  if (process.env.SEED_ADMIN_EMAIL) {
    const email = process.env.SEED_ADMIN_EMAIL;
    console.log(`→ Promoting ${email} to admin`);
    await prisma.user.upsert({
      where: { email },
      create: { email, name: email.split("@")[0], role: "admin" },
      update: { role: "admin" },
    });
  }

  console.log("→ Seeding default whitelist entries");
  await prisma.userWhitelist.upsert({
    where: { email: "anhle.lha@gmail.com" },
    create: {
      email: "anhle.lha@gmail.com",
      role: "admin",
      plan: "vip",
      note: "Admin chính"
    },
    update: {
      role: "admin",
      plan: "vip"
    }
  });

  await prisma.userWhitelist.upsert({
    where: { email: "anhle.vinmec@gmail.com" },
    create: {
      email: "anhle.vinmec@gmail.com",
      role: "student",
      plan: "pro",
      note: "User PRO"
    },
    update: {
      role: "student",
      plan: "pro"
    }
  });

  console.log("→ Syncing existing User table roles/plans");
  await prisma.user.updateMany({
    where: { email: "anhle.lha@gmail.com" },
    data: { role: "admin", plan: "vip" },
  });

  await prisma.user.updateMany({
    where: { email: "anhle.vinmec@gmail.com" },
    data: { role: "student", plan: "pro" },
  });

  // ── PlanConfig seed ────────────────────────────────────────────────────────
  console.log("→ Seeding PlanConfig");
  const planConfigs: Array<{
    plan: string;
    label: string;
    topicSetLimit: number;
    referenceExamLimit: number;
    position: number;
  }> = [
    { plan: "free", label: "Miễn phí", topicSetLimit: 10, referenceExamLimit: 5, position: 0 },
    { plan: "pro",  label: "Pro",      topicSetLimit: 60, referenceExamLimit: 20, position: 1 },
    { plan: "vip",  label: "VIP",      topicSetLimit: -1, referenceExamLimit: -1, position: 2 },
  ];
  for (const pc of planConfigs) {
    await prisma.planConfig.upsert({
      where: { plan: pc.plan },
      create: pc,
      update: { label: pc.label, topicSetLimit: pc.topicSetLimit, referenceExamLimit: pc.referenceExamLimit, position: pc.position },
    });
  }

  // ── LevelConfig seed ───────────────────────────────────────────────────────
  console.log("→ Seeding LevelConfig");
  const levelConfigs: Array<{
    level: string;
    subject: string;
    label: string;
    sub: string;
    qcount: number;
    minutes: number;
    grades: string;
    tone: string;
    position: number;
    active: boolean;
  }> = [
    // Math
    {
      level: "L4",  subject: "math", label: "Cơ bản",        sub: "Lớp 4 — công thức đơn lẻ",
      qcount: 8,  minutes: 15, grades: '["L4"]',
      tone: "var(--success)", position: 0, active: true,
    },
    {
      level: "L5",  subject: "math", label: "Vừa",            sub: "Lớp 5 — 2-3 bước kết hợp",
      qcount: 10, minutes: 20, grades: '["L5","L4+5"]',
      tone: "var(--cg)",      position: 1, active: true,
    },
    {
      level: "NC",  subject: "math", label: "Nâng cao",       sub: "Olympic, biến đổi sáng tạo",
      qcount: 8,  minutes: 25, grades: '["NC"]',
      tone: "var(--ntt)",     position: 2, active: true,
    },
    {
      level: "MIX", subject: "math", label: "Phỏng đề thật", sub: "Trộn các mức như đề thi",
      qcount: 10, minutes: 30, grades: '["L4","L5","L4+5","NC"]',
      tone: "var(--accent)",  position: 3, active: true,
    },
    // English
    {
      level: "A1", subject: "english", label: "Cơ bản (A1)", sub: "Khởi động — từ vựng & câu ngắn",
      qcount: 8, minutes: 15, grades: '["A1"]',
      tone: "var(--success)", position: 0, active: true,
    },
    {
      level: "A2", subject: "english", label: "Vừa (A2)", sub: "Trình độ phổ biến trong đề",
      qcount: 10, minutes: 20, grades: '["A2"]',
      tone: "var(--cg)",      position: 1, active: true,
    },
    {
      level: "B1", subject: "english", label: "Nâng cao (B1)", sub: "Đọc hiểu & vận dụng",
      qcount: 10, minutes: 25, grades: '["B1"]',
      tone: "var(--ntt)",     position: 2, active: true,
    },
    // Vietnamese
    {
      level: "NB", subject: "vietnamese", label: "Nhận biết", sub: "Nhận diện kiến thức cơ bản",
      qcount: 8, minutes: 15, grades: '["NB"]',
      tone: "var(--success)", position: 0, active: true,
    },
    {
      level: "TH", subject: "vietnamese", label: "Thông hiểu", sub: "Hiểu & giải thích",
      qcount: 10, minutes: 20, grades: '["TH"]',
      tone: "var(--cg)",      position: 1, active: true,
    },
    {
      level: "VD", subject: "vietnamese", label: "Vận dụng", sub: "Vận dụng & cảm thụ",
      qcount: 10, minutes: 25, grades: '["VD"]',
      tone: "var(--ntt)",     position: 2, active: true,
    },
  ];
  for (const lc of levelConfigs) {
    await prisma.levelConfig.upsert({
      where: { level_subject: { level: lc.level, subject: lc.subject } },
      create: lc,
      update: {
        label: lc.label, sub: lc.sub, qcount: lc.qcount, minutes: lc.minutes,
        grades: lc.grades, tone: lc.tone, position: lc.position,
      },
    });
  }

  console.log("✓ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
