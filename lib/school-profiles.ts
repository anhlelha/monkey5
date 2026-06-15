import { prisma } from "./prisma";
import { SCHOOLS as STATIC_SCHOOLS } from "./static";

const LEVELS = ["L4", "L5", "L4+5", "NC"] as const;
type Level = (typeof LEVELS)[number];

// School IDs that look like schools in `Exam.school` but aren't real schools —
// excluded from auto-rebuild of School + SchoolProfile tables. "mix" is a
// style/placeholder used by spawn-exam.ts for topic-practice sets and by
// admin's "MIX (tổng hợp)" exams; it should not get its own readiness profile.
const PSEUDO_SCHOOL_IDS = new Set<string>(["mix"]);

export interface SchoolProfileData {
  school: string;
  topicWeights: Record<string, number>;
  levelWeights: Record<Level, number>;
  difficulty: number;
  minutes: number;
  totalQuestions: number;
  freeTextPct: number;
  olympicGeoPct: number;
  diversity: number;
  sourceHash: string;
}

async function buildSchoolProfile(school: string): Promise<Omit<SchoolProfileData, "sourceHash">> {
  const questions = await prisma.question.findMany({
    where: {
      active: true,
      exam: { school, kind: { in: ["official", "reference"] } },
    },
    select: { topic: true, grade: true, type: true },
  });
  const total = Math.max(1, questions.length);

  const topicCount: Record<string, number> = {};
  const levelCount: Record<string, number> = {};
  let freeTextCount = 0;
  let olympicGeoCount = 0;
  for (const q of questions) {
    topicCount[q.topic] = (topicCount[q.topic] ?? 0) + 1;
    levelCount[q.grade] = (levelCount[q.grade] ?? 0) + 1;
    if (q.type === "essay") freeTextCount++;
    if (q.topic === "hinh" && q.grade === "NC") olympicGeoCount++;
  }

  const topicWeights: Record<string, number> = {};
  for (const t of Object.keys(topicCount)) topicWeights[t] = topicCount[t] / total;

  const levelWeights: Record<Level, number> = { L4: 0, L5: 0, "L4+5": 0, NC: 0 };
  for (const l of LEVELS) levelWeights[l] = (levelCount[l] ?? 0) / total;

  const exams = await prisma.exam.findMany({
    where: { school, kind: { in: ["official", "reference"] } },
    select: { minutes: true },
  });
  const minutes = exams.length > 0 ? exams.reduce((s, e) => s + e.minutes, 0) / exams.length : 60;
  const yearsCount = Math.max(1, exams.length);

  const ncPct = levelWeights.NC * 100;
  const l45Pct = levelWeights["L4+5"] * 100;
  const timePressure = total / (yearsCount * minutes);
  const freeTextPct = (freeTextCount / total) * 100;
  const olympicGeoPct = (olympicGeoCount / total) * 100;
  const diversity = Object.values(topicCount).filter((c) => c > 0).length;

  const difficulty =
    ncPct * 0.30 +
    l45Pct * 0.15 +
    timePressure * 100 * 0.20 +
    freeTextPct * 0.15 +
    olympicGeoPct * 0.10 +
    diversity * 1.0;

  return {
    school,
    topicWeights,
    levelWeights,
    difficulty,
    minutes,
    totalQuestions: questions.length,
    freeTextPct,
    olympicGeoPct,
    diversity,
  };
}

interface SchoolDigest { school: string; qcount: number; latest: string }

async function getSchoolDigests(): Promise<SchoolDigest[]> {
  const rows = await prisma.$queryRaw<Array<{ school: string; qcount: bigint | number; latest: bigint | number | Date | string | null }>>`
    SELECT e.school as school,
           COUNT(q.id) as qcount,
           MAX(q.createdAt) as latest
    FROM Question q
    JOIN Exam e ON q.examId = e.id
    WHERE q.active = 1
      AND e.kind IN ('official', 'reference')
    GROUP BY e.school
  `;
  return rows.map((r) => {
    let latestStr = "0";
    if (r.latest !== null && r.latest !== undefined) {
      if (typeof r.latest === "bigint") {
        // SQLite stores DateTime as Unix ms; BigInt from $queryRaw
        latestStr = new Date(Number(r.latest)).toISOString();
      } else if (r.latest instanceof Date) {
        latestStr = r.latest.toISOString();
      } else if (typeof r.latest === "number") {
        latestStr = new Date(r.latest).toISOString();
      } else {
        latestStr = String(r.latest);
      }
    }
    return {
      school: r.school,
      qcount: typeof r.qcount === "bigint" ? Number(r.qcount) : r.qcount,
      latest: latestStr,
    };
  });
}

async function ensureSchoolMetadata(schoolId: string): Promise<void> {
  if (PSEUDO_SCHOOL_IDS.has(schoolId)) return;
  const existing = await prisma.school.findUnique({ where: { id: schoolId } });
  if (existing) return;
  const fromStatic = STATIC_SCHOOLS.find((s) => s.id === schoolId);
  if (fromStatic) {
    await prisma.school.create({
      data: {
        id: fromStatic.id,
        short: fromStatic.short,
        name: fromStatic.name,
        full: fromStatic.full,
        color: fromStatic.color,
        tone: fromStatic.tone,
        desc: fromStatic.desc,
        minutes: fromStatic.minutes,
        style: fromStatic.style,
        position: 100,
        active: true,
      },
    });
    return;
  }
  const palette = ["#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#10b981", "#ec4899"];
  const color = palette[Math.floor(Math.random() * palette.length)];
  await prisma.school.create({
    data: {
      id: schoolId,
      short: schoolId.toUpperCase().slice(0, 4),
      name: schoolId.toUpperCase(),
      full: schoolId.toUpperCase(),
      color,
      tone: schoolId,
      desc: "",
      minutes: 60,
      style: "",
      position: 100,
      active: true,
    },
  });
}

export async function ensureSchoolProfilesFresh(): Promise<{ rebuilt: string[]; created: string[]; unchanged: string[] }> {
  const digests = await getSchoolDigests();
  const rebuilt: string[] = [];
  const created: string[] = [];
  const unchanged: string[] = [];

  for (const { school, qcount, latest } of digests) {
    if (PSEUDO_SCHOOL_IDS.has(school)) continue;
    const sourceHash = `${qcount}-${latest}`;
    const existing = await prisma.schoolProfile.findUnique({ where: { school } });

    if (!existing) {
      const profile = await buildSchoolProfile(school);
      await prisma.schoolProfile.create({
        data: {
          school,
          topicWeights: JSON.stringify(profile.topicWeights),
          levelWeights: JSON.stringify(profile.levelWeights),
          difficulty: profile.difficulty,
          minutes: profile.minutes,
          totalQuestions: profile.totalQuestions,
          freeTextPct: profile.freeTextPct,
          olympicGeoPct: profile.olympicGeoPct,
          diversity: profile.diversity,
          sourceHash,
        },
      });
      await ensureSchoolMetadata(school);
      created.push(school);
    } else if (existing.sourceHash !== sourceHash) {
      const profile = await buildSchoolProfile(school);
      await prisma.schoolProfile.update({
        where: { school },
        data: {
          topicWeights: JSON.stringify(profile.topicWeights),
          levelWeights: JSON.stringify(profile.levelWeights),
          difficulty: profile.difficulty,
          minutes: profile.minutes,
          totalQuestions: profile.totalQuestions,
          freeTextPct: profile.freeTextPct,
          olympicGeoPct: profile.olympicGeoPct,
          diversity: profile.diversity,
          sourceHash,
        },
      });
      rebuilt.push(school);
    } else {
      unchanged.push(school);
    }
  }

  return { rebuilt, created, unchanged };
}

export async function getAllSchoolProfiles(): Promise<Record<string, SchoolProfileData>> {
  const rows = await prisma.schoolProfile.findMany();
  const out: Record<string, SchoolProfileData> = {};
  for (const r of rows) {
    out[r.school] = {
      school: r.school,
      topicWeights: JSON.parse(r.topicWeights) as Record<string, number>,
      levelWeights: JSON.parse(r.levelWeights) as Record<Level, number>,
      difficulty: r.difficulty,
      minutes: r.minutes,
      totalQuestions: r.totalQuestions,
      freeTextPct: r.freeTextPct,
      olympicGeoPct: r.olympicGeoPct,
      diversity: r.diversity,
      sourceHash: r.sourceHash,
    };
  }
  return out;
}

export async function getSchoolProfile(school: string): Promise<SchoolProfileData | null> {
  const r = await prisma.schoolProfile.findUnique({ where: { school } });
  if (!r) return null;
  return {
    school: r.school,
    topicWeights: JSON.parse(r.topicWeights) as Record<string, number>,
    levelWeights: JSON.parse(r.levelWeights) as Record<Level, number>,
    difficulty: r.difficulty,
    minutes: r.minutes,
    totalQuestions: r.totalQuestions,
    freeTextPct: r.freeTextPct,
    olympicGeoPct: r.olympicGeoPct,
    diversity: r.diversity,
    sourceHash: r.sourceHash,
  };
}

export { buildSchoolProfile };
