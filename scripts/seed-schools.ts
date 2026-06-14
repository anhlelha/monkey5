/**
 * One-shot migration: copy SCHOOLS hard-coded array (from old lib/static.ts) into
 * the new School Prisma table. Safe to re-run (uses upsert).
 *
 * Run AFTER applying schema changes:
 *   npx tsx scripts/seed-schools.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SchoolRow {
  id: string;
  short: string;
  name: string;
  full: string;
  color: string;
  tone: string;
  desc: string;
  minutes: number;
  style: string;
  position: number;
}

const SCHOOL_SEED: readonly SchoolRow[] = [
  {
    id: "cg",
    short: "CG",
    name: "THCS Cầu Giấy",
    full: "THCS Cầu Giấy",
    color: "var(--cg)",
    tone: "cg",
    desc: "Trắc nghiệm + điền + 2 câu tự luận. 45 phút.",
    minutes: 45,
    style: "Gọn, lập luận sạch, ít tự luận.",
    position: 0,
  },
  {
    id: "ntt",
    short: "NTT",
    name: "Nguyễn Tất Thành",
    full: "THCS & THPT Nguyễn Tất Thành",
    color: "var(--ntt)",
    tone: "ntt",
    desc: "Đề kể chuyện thực tế, 30-32% tự luận. 60 phút.",
    minutes: 60,
    style: "Bài toán thực tế, đọc hiểu kỹ.",
    position: 1,
  },
  {
    id: "ltv",
    short: "LTV",
    name: "Lương Thế Vinh",
    full: "THCS & THPT Lương Thế Vinh",
    color: "var(--ltv)",
    tone: "ltv",
    desc: "20 câu ghi đáp số. 60 phút. Nhiều hình học.",
    minutes: 60,
    style: "Tốc độ + hình học Olympic nhẹ.",
    position: 2,
  },
  {
    id: "tx",
    short: "TX",
    name: "Thanh Xuân",
    full: "THCS Thanh Xuân",
    color: "var(--tx)",
    tone: "tx",
    desc: "Cân bằng TN + điền + tự luận. 40 phút.",
    minutes: 40,
    style: "Cân bằng, đa dạng dạng bài.",
    position: 3,
  },
  {
    id: "nn",
    short: "NN",
    name: "Ngoại ngữ",
    full: "THCS Ngoại ngữ (UMS)",
    color: "var(--nn)",
    tone: "nn",
    desc: "Trắc nghiệm + điền + tự luận. 45 phút.",
    minutes: 45,
    style: "Đề ngắn gọn, nhấn vào hình học và phân số.",
    position: 4,
  },
  {
    id: "ntl",
    short: "NTL",
    name: "Nam Từ Liêm",
    full: "THCS Nam Từ Liêm",
    color: "var(--ntl)",
    tone: "ntl",
    desc: "10–11 câu điền đáp số + 2 bài tự luận. 50 phút.",
    minutes: 50,
    style: "Số học + hình học cevian, có suy luận logic.",
    position: 5,
  },
  {
    id: "nshn",
    short: "NSHN",
    name: "Ngôi Sao Hà Nội",
    full: "Trường Liên cấp Tiểu học & THCS Ngôi Sao Hà Nội",
    color: "var(--nshn)",
    tone: "nshn",
    desc: "Học bổng khối 5 — 9 câu điền đáp số + 3 bài tự luận. 60 phút.",
    minutes: 60,
    style: "Phân số, %, hình học và bài toán đếm.",
    position: 6,
  },
] as const;

async function main(): Promise<void> {
  let upserted = 0;
  for (const row of SCHOOL_SEED) {
    await prisma.school.upsert({
      where: { id: row.id },
      update: {
        short: row.short,
        name: row.name,
        full: row.full,
        color: row.color,
        tone: row.tone,
        desc: row.desc,
        minutes: row.minutes,
        style: row.style,
        position: row.position,
      },
      create: row,
    });
    upserted++;
  }
  console.log(`✓ Seeded ${upserted} schools.`);

  const all = await prisma.school.findMany({ orderBy: { position: "asc" } });
  for (const s of all) {
    console.log(`  ${s.id.padEnd(6)} ${s.short.padEnd(5)} ${s.name}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
