import { prisma } from "./prisma";
import { SCHOOLS as STATIC_SCHOOLS } from "./static";
import {
  SUBJECT_LEVELS,
  ENGLISH_FACTORS,
  englishDifficultyScore,
  skillOfTopic,
  VIETNAMESE_FACTORS,
  vietnameseDifficultyScore,
  type Subject,
  type EnglishFactors,
} from "./subjects";

// School IDs that look like schools in `Exam.school` but aren't real schools —
// excluded from auto-rebuild of School + SchoolProfile tables.
const PSEUDO_SCHOOL_IDS = new Set<string>(["mix"]);

export interface SchoolProfileData {
  school: string;
  subject: Subject;
  topicWeights: Record<string, number>;
  levelWeights: Record<string, number>;
  difficulty: number;
  minutes: number;
  totalQuestions: number;
  freeTextPct: number;
  olympicGeoPct: number;
  diversity: number;
  factors: EnglishFactors; // english 6-factor radar (empty for math)
  sourceHash: string;
}

const clamp100 = (n: number): number => Math.max(0, Math.min(100, n));

const parseTags = (raw: string): string[] => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
};

async function buildSchoolProfile(
  school: string,
  subject: Subject,
): Promise<Omit<SchoolProfileData, "sourceHash">> {
  const cfg = SUBJECT_LEVELS[subject];
  const questions = await prisma.question.findMany({
    where: {
      active: true,
      exam: { school, subject, kind: { in: ["official", "reference"] } },
    },
    select: { topic: true, grade: true, type: true, skill: true, tags: true },
  });
  const total = Math.max(1, questions.length);

  const topicCount: Record<string, number> = {};
  const levelCount: Record<string, number> = {};
  for (const q of questions) {
    topicCount[q.topic] = (topicCount[q.topic] ?? 0) + 1;
    levelCount[q.grade] = (levelCount[q.grade] ?? 0) + 1;
  }

  const topicWeights: Record<string, number> = {};
  for (const t of Object.keys(topicCount)) topicWeights[t] = topicCount[t] / total;

  const levelWeights: Record<string, number> = {};
  for (const l of cfg.levels) levelWeights[l] = (levelCount[l] ?? 0) / total;

  const exams = await prisma.exam.findMany({
    where: { school, subject, kind: { in: ["official", "reference"] } },
    select: { minutes: true },
  });
  const minutes = exams.length > 0 ? exams.reduce((s, e) => s + e.minutes, 0) / exams.length : 60;
  const yearsCount = Math.max(1, exams.length);
  const diversity = Object.values(topicCount).filter((c) => c > 0).length;

  if (subject === "english") {
    const p = buildEnglishProfile(questions, { total, minutes, yearsCount, diversity, topicWeights, levelWeights });
    return { ...p, school };
  }

  if (subject === "vietnamese") {
    const p = buildVietnameseProfile(questions, { total, minutes, yearsCount, diversity, topicWeights, levelWeights });
    return { ...p, school };
  }

  // ── Math difficulty (unchanged) ──
  let freeTextCount = 0;
  let olympicGeoCount = 0;
  for (const q of questions) {
    if (q.type === "essay") freeTextCount++;
    if (q.topic === "hinh" && q.grade === "NC") olympicGeoCount++;
  }
  const ncPct = (levelWeights.NC ?? 0) * 100;
  const l45Pct = (levelWeights["L4+5"] ?? 0) * 100;
  const timePressure = total / (yearsCount * minutes);
  const freeTextPct = (freeTextCount / total) * 100;
  const olympicGeoPct = (olympicGeoCount / total) * 100;
  const difficulty =
    ncPct * 0.3 +
    l45Pct * 0.15 +
    timePressure * 100 * 0.2 +
    freeTextPct * 0.15 +
    olympicGeoPct * 0.1 +
    diversity * 1.0;

  return {
    school,
    subject,
    topicWeights,
    levelWeights,
    difficulty,
    minutes,
    totalQuestions: questions.length,
    freeTextPct,
    olympicGeoPct,
    diversity,
    factors: {},
  };
}

interface EnglishCtx {
  total: number;
  minutes: number;
  yearsCount: number;
  diversity: number;
  topicWeights: Record<string, number>;
  levelWeights: Record<string, number>;
}

// English 6-factor difficulty. Auto-computed from question tags/topics; data-
// driven so it may differ from the dashboard's hand-set [Inference] estimates.
// Admin can override later. Scaling multipliers chosen so realistic exams land
// in sane 0..100 ranges (e.g. ~35% reading → ~80 readingLoad; 0,87 câu/phút → ~70).
function buildEnglishProfile(
  questions: Array<{ topic: string; grade: string; type: string; skill: string | null; tags: string }>,
  ctx: EnglishCtx,
): Omit<SchoolProfileData, "sourceHash"> {
  const { total, minutes, yearsCount, diversity, topicWeights, levelWeights } = ctx;

  let readingCount = 0;
  let freeWriteCount = 0;
  let ctrlWriteCount = 0;
  let inferenceCount = 0;
  let vocabAdvCount = 0;
  const skills = new Set<string>();

  for (const q of questions) {
    const skill = q.skill ?? skillOfTopic(q.topic);
    skills.add(skill);
    const tags = parseTags(q.tags);
    if (q.topic === "en-read" || skill === "reading") readingCount++;
    if (q.topic === "en-fwrite") freeWriteCount++;
    if (q.topic === "en-cwrite") ctrlWriteCount++;
    if (tags.includes("inference") || tags.includes("application")) inferenceCount++;
    if (tags.includes("collocation") || tags.includes("idiom")) vocabAdvCount++;
  }

  const readingPct = readingCount / total;
  const freeWritePct = freeWriteCount / total;
  const ctrlWritePct = ctrlWriteCount / total;
  const inferencePct = inferenceCount / total;
  const vocabAdvPct = vocabAdvCount / total;
  const qpm = total / (yearsCount * minutes);
  const distinctSkills = skills.size;

  const factors: EnglishFactors = {
    readingLoad: clamp100(readingPct * 230),
    productiveWriting: clamp100((freeWriteCount > 0 ? 55 : 0) + freeWritePct * 800 + ctrlWritePct * 300),
    higherOrder: clamp100(30 + inferencePct * 250),
    timePressure: clamp100(qpm * 80),
    vocabDepth: clamp100(50 + vocabAdvPct * 400),
    skillDiversity: clamp100((distinctSkills / 5) * 100),
  };
  // Keep only known factor keys, in order.
  const cleanFactors: EnglishFactors = {};
  for (const f of ENGLISH_FACTORS) cleanFactors[f.key] = Math.round(factors[f.key] ?? 0);

  return {
    school: "", // set by caller
    subject: "english",
    topicWeights,
    levelWeights,
    difficulty: Math.round(englishDifficultyScore(cleanFactors) * 10) / 10,
    minutes,
    totalQuestions: total === 1 && questions.length === 0 ? 0 : questions.length,
    freeTextPct: Math.round(freeWritePct * 1000) / 10,
    olympicGeoPct: 0,
    diversity,
    factors: cleanFactors,
  };
}

// Vietnamese 6-factor difficulty. Auto-computed from topics/tags; data-driven so
// it may differ from the dashboard's hand-set [Inference] estimates. Scaling
// multipliers chosen so realistic exams land in sane 0..100 ranges (e.g. CG
// ~32% cảm thụ → ~80 litComprehension; NTT phủ 10/10 nhóm → ~100 breadth).
function buildVietnameseProfile(
  questions: Array<{ topic: string; grade: string; type: string; skill: string | null; tags: string }>,
  ctx: EnglishCtx,
): Omit<SchoolProfileData, "sourceHash"> {
  const { total, minutes, yearsCount, diversity, topicWeights, levelWeights } = ctx;

  let litCount = 0;       // đọc hiểu & cảm thụ
  let writeCount = 0;     // viết đoạn/bài
  let makeSentCount = 0;  // đặt câu/viết câu
  let higherCount = 0;    // vận dụng/suy luận (sắp xếp, phân loại…)
  let trickyCount = 0;    // bẫy phân hóa
  const topics = new Set<string>();

  for (const q of questions) {
    topics.add(q.topic);
    const tags = parseTags(q.tags);
    if (q.topic === "vn-reading" || tags.includes("camthu")) litCount++;
    if (q.topic === "vn-writing") writeCount++;
    if (q.topic === "vn-makesent") makeSentCount++;
    if (tags.includes("vandung")) higherCount++;
    if (tags.includes("bay")) trickyCount++;
  }

  const litPct = litCount / total;
  const writePct = writeCount / total;
  const higherPct = higherCount / total;
  const trickyPct = trickyCount / total;
  const qpm = total / (yearsCount * minutes);
  const distinctTopics = topics.size;

  const factors: Record<string, number> = {
    litComprehension: clamp100(litPct * 250),
    productiveWriting: clamp100((writeCount > 0 ? 45 : 0) + writePct * 600 + (makeSentCount / total) * 200),
    breadth: clamp100((distinctTopics / 10) * 100),
    higherOrder: clamp100(30 + higherPct * 250),
    timePressure: clamp100(qpm * 220),
    trickiness: clamp100(35 + trickyPct * 300),
  };
  const cleanFactors: Record<string, number> = {};
  for (const f of VIETNAMESE_FACTORS) cleanFactors[f.key] = Math.round(factors[f.key] ?? 0);

  return {
    school: "", // set by caller
    subject: "vietnamese",
    topicWeights,
    levelWeights,
    difficulty: Math.round(vietnameseDifficultyScore(cleanFactors) * 10) / 10,
    minutes,
    totalQuestions: total === 1 && questions.length === 0 ? 0 : questions.length,
    freeTextPct: Math.round(writePct * 1000) / 10,
    olympicGeoPct: 0,
    diversity,
    factors: cleanFactors,
  };
}

interface SchoolDigest { school: string; qcount: number; latest: string }

async function getSchoolDigests(subject: Subject): Promise<SchoolDigest[]> {
  const rows = await prisma.$queryRaw<Array<{ school: string; qcount: bigint | number; latest: bigint | number | Date | string | null }>>`
    SELECT e.school as school,
           COUNT(q.id) as qcount,
           MAX(q.createdAt) as latest
    FROM Question q
    JOIN Exam e ON q.examId = e.id
    WHERE q.active = 1
      AND e.subject = ${subject}
      AND e.kind IN ('official', 'reference')
    GROUP BY e.school
  `;
  return rows.map((r) => {
    let latestStr = "0";
    if (r.latest !== null && r.latest !== undefined) {
      if (typeof r.latest === "bigint") {
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
  const color = palette[schoolId.length % palette.length];
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

export async function ensureSchoolProfilesFresh(
  subject: Subject = "math",
): Promise<{ rebuilt: string[]; created: string[]; unchanged: string[] }> {
  const digests = await getSchoolDigests(subject);
  const rebuilt: string[] = [];
  const created: string[] = [];
  const unchanged: string[] = [];

  for (const { school, qcount, latest } of digests) {
    if (PSEUDO_SCHOOL_IDS.has(school)) continue;
    const sourceHash = `${qcount}-${latest}`;
    const existing = await prisma.schoolProfile.findUnique({
      where: { school_subject: { school, subject } },
    });

    if (!existing) {
      const profile = await buildSchoolProfile(school, subject);
      await prisma.schoolProfile.create({ data: serialize(school, subject, profile, sourceHash) });
      await ensureSchoolMetadata(school);
      created.push(school);
    } else if (existing.sourceHash !== sourceHash) {
      const profile = await buildSchoolProfile(school, subject);
      await prisma.schoolProfile.update({
        where: { school_subject: { school, subject } },
        data: serializeUpdate(profile, sourceHash),
      });
      rebuilt.push(school);
    } else {
      unchanged.push(school);
    }
  }

  return { rebuilt, created, unchanged };
}

function serialize(
  school: string,
  subject: Subject,
  p: Omit<SchoolProfileData, "sourceHash">,
  sourceHash: string,
) {
  return {
    school,
    subject,
    topicWeights: JSON.stringify(p.topicWeights),
    levelWeights: JSON.stringify(p.levelWeights),
    difficulty: p.difficulty,
    minutes: p.minutes,
    totalQuestions: p.totalQuestions,
    freeTextPct: p.freeTextPct,
    olympicGeoPct: p.olympicGeoPct,
    diversity: p.diversity,
    factors: JSON.stringify(p.factors),
    sourceHash,
  };
}

function serializeUpdate(p: Omit<SchoolProfileData, "sourceHash">, sourceHash: string) {
  return {
    topicWeights: JSON.stringify(p.topicWeights),
    levelWeights: JSON.stringify(p.levelWeights),
    difficulty: p.difficulty,
    minutes: p.minutes,
    totalQuestions: p.totalQuestions,
    freeTextPct: p.freeTextPct,
    olympicGeoPct: p.olympicGeoPct,
    diversity: p.diversity,
    factors: JSON.stringify(p.factors),
    sourceHash,
  };
}

function deserialize(r: {
  school: string; subject: string; topicWeights: string; levelWeights: string;
  difficulty: number; minutes: number; totalQuestions: number; freeTextPct: number;
  olympicGeoPct: number; diversity: number; factors: string; sourceHash: string;
}): SchoolProfileData {
  return {
    school: r.school,
    subject: (r.subject as Subject) ?? "math",
    topicWeights: JSON.parse(r.topicWeights) as Record<string, number>,
    levelWeights: JSON.parse(r.levelWeights) as Record<string, number>,
    difficulty: r.difficulty,
    minutes: r.minutes,
    totalQuestions: r.totalQuestions,
    freeTextPct: r.freeTextPct,
    olympicGeoPct: r.olympicGeoPct,
    diversity: r.diversity,
    factors: (() => {
      try {
        return (JSON.parse(r.factors) as EnglishFactors) ?? {};
      } catch {
        return {};
      }
    })(),
    sourceHash: r.sourceHash,
  };
}

export async function getAllSchoolProfiles(
  subject: Subject = "math",
): Promise<Record<string, SchoolProfileData>> {
  const rows = await prisma.schoolProfile.findMany({ where: { subject } });
  const out: Record<string, SchoolProfileData> = {};
  for (const r of rows) out[r.school] = deserialize(r);
  return out;
}

export async function getSchoolProfile(
  school: string,
  subject: Subject = "math",
): Promise<SchoolProfileData | null> {
  const r = await prisma.schoolProfile.findUnique({
    where: { school_subject: { school, subject } },
  });
  return r ? deserialize(r) : null;
}

export { buildSchoolProfile };
