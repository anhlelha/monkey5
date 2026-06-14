// Helpers for parsing/serializing the JSON-string fields on User.

import { prisma } from "./prisma";

export interface UserShape {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  plan: string;
  grade: string;
  targets: string[];
  hours: number;
  examDate: string | null;
  readyTarget: number;
  streak: number;
  joinedDays: number;
  topicMastery: Record<string, number>;
  readiness: Record<string, number>;
  activity: (number | null)[];
}

type RawUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  plan: string;
  grade: string;
  targets: string;
  hours: number;
  examDate: string | null;
  readyTarget: number;
  streak: number;
  joinedDays: number;
  topicMastery: string;
  readiness: string;
  activity: string;
};

const parseJson = <T,>(raw: string, fallback: T): T => {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export function hydrateUser(raw: RawUser): UserShape {
  const targets = parseJson<string[]>(raw.targets, []);
  const topicMastery = parseJson<Record<string, number>>(raw.topicMastery, {});
  const readiness = parseJson<Record<string, number>>(raw.readiness, {});
  const activity = parseJson<(number | null)[]>(raw.activity, []);

  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    image: raw.image,
    role: raw.role,
    plan: raw.plan,
    grade: raw.grade,
    targets,
    hours: raw.hours,
    examDate: raw.examDate,
    readyTarget: raw.readyTarget,
    streak: raw.streak,
    joinedDays: raw.joinedDays,
    topicMastery,
    readiness,
    activity,
  };
}

// First name extraction — Vietnamese names: family-given order, given name is last.
export const firstName = (full: string | null | undefined): string => {
  if (!full) return "bạn";
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] ?? "bạn";
};

// Vietnamese relative-time label matching the design copy
// ("Hôm qua", "3 ngày trước", "Tuần trước", "2 tuần trước", "1 tháng trước", ...).
export function relativeVi(date: Date, now: Date = new Date()): string {
  const ms = now.getTime() - date.getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  if (days < 14) return "Tuần trước";
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks} tuần trước`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 tháng trước";
  return `${months} tháng trước`;
}

const fmtDateVi = (d: Date): string =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

const fmtDateShortVi = (d: Date): string =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

export interface ExamHistoryItem {
  id: string;
  kind: "official" | "reference" | "mixed";
  examId: string;
  school: string;
  year: string;
  style: string | null; // for reference exams ("Phỏng CG · Lớp 5 nâng dần")
  score: number;
  when: string;
  when_full: string;
}

export async function getExamHistory(userId: string): Promise<ExamHistoryItem[]> {
  const attempts = await prisma.attempt.findMany({
    where: { userId, submitted: true },
    include: { exam: true },
    orderBy: { createdAt: "desc" },
  });
  return attempts.map((a) => ({
    id: a.id,
    kind: a.exam.kind as "official" | "reference" | "mixed",
    examId: a.examId,
    school: a.exam.school,
    year: a.exam.year,
    style: a.exam.kind === "official" ? null : a.exam.title ?? a.exam.note ?? null,
    score: a.score,
    when: relativeVi(a.createdAt),
    when_full: fmtDateVi(a.createdAt),
  }));
}

// Aggregate activity stats for the dashboard's "Tiến độ 14 ngày qua" card.
// Counts every submitted attempt (full exams) plus every topic session
// (per-topic practice runs).
export interface ActivityStats {
  setsDone: number;       // total exam attempts + topic sessions
  questionsAnswered: number;
  avgAccuracy: number | null; // 0..100, null when no activity
}

export async function getActivityStats(userId: string): Promise<ActivityStats> {
  const [attempts, sessions] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId, submitted: true },
      select: { score: true, total: true, earned: true },
    }),
    prisma.topicSession.findMany({
      where: { userId },
      select: { qcount: true, score: true },
    }),
  ]);

  const examQs = attempts.reduce((s, a) => s + a.total, 0);
  const examCorrect = attempts.reduce((s, a) => s + a.earned, 0);
  const topicQs = sessions.reduce((s, t) => s + t.qcount, 0);
  const topicCorrect = sessions.reduce((s, t) => s + t.score, 0);

  const totalQs = examQs + topicQs;
  const totalCorrect = examCorrect + topicCorrect;
  const setsDone = attempts.length + sessions.length;

  return {
    setsDone,
    questionsAnswered: totalQs,
    avgAccuracy: totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : null,
  };
}

// Per-topic counts of attempted questions + finished sessions for the dashboard
// "Chi tiết theo chuyên đề" table. Returns a map keyed by topic id.
export interface TopicProgress {
  sessions: number;       // completed topic sessions
  questions: number;      // questions answered in topic sessions
}

export async function getTopicProgress(
  userId: string,
): Promise<Record<string, TopicProgress>> {
  const sessions = await prisma.topicSession.findMany({
    where: { userId },
    select: { topic: true, qcount: true },
  });
  const map: Record<string, TopicProgress> = {};
  for (const s of sessions) {
    const cur = map[s.topic] ?? { sessions: 0, questions: 0 };
    cur.sessions += 1;
    cur.questions += s.qcount;
    map[s.topic] = cur;
  }
  return map;
}

export interface TopicSessionItem {
  id: string;
  level: string;
  qcount: number;
  score: number;
  when: string;
  when_full: string;
  examId: string | null;   // setId of the spawned exam (also the Attempt.examId)
  attemptId: string | null; // most-recent submitted attempt — drives "Xem giải"
}

export async function getTopicSessions(
  userId: string,
  topicId: string,
): Promise<TopicSessionItem[]> {
  const rows = await prisma.topicSession.findMany({
    where: { userId, topic: topicId },
    orderBy: { createdAt: "desc" },
  });

  // Resolve attempt ids in one round-trip via groupBy on `examId`.
  const setIds = rows.map((r) => r.setId).filter((v): v is string => Boolean(v));
  const attemptMap = new Map<string, string>();
  if (setIds.length > 0) {
    const attempts = await prisma.attempt.findMany({
      where: { userId, examId: { in: setIds }, submitted: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, examId: true },
    });
    // findMany returns desc → first-seen-per-examId is the latest.
    for (const a of attempts) {
      if (!attemptMap.has(a.examId)) attemptMap.set(a.examId, a.id);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    level: r.level,
    qcount: r.qcount,
    score: r.score,
    when: relativeVi(r.createdAt),
    when_full: fmtDateShortVi(r.createdAt),
    examId: r.setId,
    attemptId: r.setId ? attemptMap.get(r.setId) ?? null : null,
  }));
}
