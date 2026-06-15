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
  theme: string;
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
  theme: string;
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
    theme: raw.theme ?? "clay",
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
// Counts every distinct submission, deduping the Attempt + TopicSession pair
// that gets written together when a topic practice set is submitted (see
// app/exam/[examId]/actions.ts — both rows share the same examId/setId).
export interface ActivityStats {
  setsDone: number;
  questionsAnswered: number;
  avgAccuracy: number | null; // 0..100, null when no activity
}

export async function getActivityStats(userId: string): Promise<ActivityStats> {
  const [attempts, sessions] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId, submitted: true },
      select: { examId: true, total: true, earned: true },
    }),
    prisma.topicSession.findMany({
      where: { userId },
      select: { setId: true, qcount: true, score: true },
    }),
  ]);

  const attemptExamIds = new Set(attempts.map((a) => a.examId));

  let setsDone = attempts.length;
  let totalQs = attempts.reduce((s, a) => s + a.total, 0);
  let totalCorrect = attempts.reduce((s, a) => s + a.earned, 0);

  for (const t of sessions) {
    if (t.setId && attemptExamIds.has(t.setId)) continue; // already counted via Attempt
    setsDone += 1;
    totalQs += t.qcount;
    totalCorrect += t.score;
  }

  return {
    setsDone,
    questionsAnswered: totalQs,
    avgAccuracy: totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : null,
  };
}

// Unified "recent activity" feed for the Kết quả gần đây page. Includes both
// full-exam attempts and topic practice sessions. When a TopicSession has a
// matching Attempt (same setId === examId), the entry is rendered as a topic
// row but links to the attempt's results page. TopicSessions without a
// matching Attempt (e.g. attempt was pruned) are still shown but disabled.
export type ActivityFeedItem =
  | {
      kind: "exam";
      id: string;             // attempt id
      examId: string;
      attemptId: string;
      createdAt: Date;
      schoolId: string;
      examTitle: string | null;
      examYear: string;
      qcount: number;
      minutes: number;
      score: number;          // 0..100
      earned: number;
      total: number;
    }
  | {
      kind: "topic";
      id: string;             // topicSession id
      examId: string | null;  // setId — may be null on very old rows
      attemptId: string | null; // null when paired Attempt was deleted
      createdAt: Date;
      topic: string;
      level: string;
      qcount: number;
      score: number;          // 0..100 (computed from correctCount/qcount)
      correctCount: number;
    };

export async function getRecentActivityFeed(
  userId: string,
  limit = 25,
): Promise<ActivityFeedItem[]> {
  const [attempts, sessions] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId, submitted: true },
      include: { exam: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.topicSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Index sessions by their setId so we can pair them with attempts.
  const sessionBySetId = new Map<string, (typeof sessions)[number]>();
  for (const s of sessions) {
    if (s.setId && !sessionBySetId.has(s.setId)) sessionBySetId.set(s.setId, s);
  }
  // Index attempts by examId for the inverse lookup (topic → attempt id).
  const attemptByExamId = new Map<string, (typeof attempts)[number]>();
  for (const a of attempts) {
    if (!attemptByExamId.has(a.examId)) attemptByExamId.set(a.examId, a);
  }

  const items: ActivityFeedItem[] = [];
  const consumedSessionIds = new Set<string>();

  for (const a of attempts) {
    const matched = a.examId ? sessionBySetId.get(a.examId) : undefined;
    if (matched) {
      // Render as topic row, link to attempt.
      consumedSessionIds.add(matched.id);
      const correctCount = matched.score;
      const pct = matched.qcount > 0 ? Math.round((correctCount / matched.qcount) * 100) : 0;
      items.push({
        kind: "topic",
        id: matched.id,
        examId: matched.setId,
        attemptId: a.id,
        createdAt: a.createdAt,
        topic: matched.topic,
        level: matched.level,
        qcount: matched.qcount,
        score: pct,
        correctCount,
      });
    } else {
      items.push({
        kind: "exam",
        id: a.id,
        examId: a.examId,
        attemptId: a.id,
        createdAt: a.createdAt,
        schoolId: a.exam.school,
        examTitle: a.exam.title ?? null,
        examYear: a.exam.year,
        qcount: a.exam.qcount,
        minutes: a.exam.minutes,
        score: a.score,
        earned: a.earned,
        total: a.total,
      });
    }
  }

  for (const s of sessions) {
    if (consumedSessionIds.has(s.id)) continue;
    const pct = s.qcount > 0 ? Math.round((s.score / s.qcount) * 100) : 0;
    items.push({
      kind: "topic",
      id: s.id,
      examId: s.setId,
      attemptId: null,
      createdAt: s.createdAt,
      topic: s.topic,
      level: s.level,
      qcount: s.qcount,
      score: pct,
      correctCount: s.score,
    });
  }

  items.sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime());
  return items.slice(0, limit);
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

// ─── Admin: mastery overview (dashboard) ─────────────────────────────────────
// Aggregates `User.topicMastery` JSON across all users. A user "learns" a topic
// when their mastery for it is > 0; the average is computed only over those
// learners to avoid pulling weights toward 0 from users who never touched it.

export interface MasteryTopicStat {
  topicId: string;
  avg: number;          // 0..100 (rounded), averaged across learners
  learnerCount: number; // users with mastery > 0 on this topic
  weakCount: number;    // learners with mastery < 0.5
}

export interface MasteryStats {
  totalUsers: number;
  activeUsers: number;             // users with at least one topic > 0
  globalAvg: number;               // 0..100 — avg per-user-avg of learned topics
  perTopic: MasteryTopicStat[];    // sorted by topicId order of TOPICS
  distribution: [number, number, number, number]; // bucket counts: <25, 25-50, 50-75, ≥75
}

export async function getMasteryStats(): Promise<MasteryStats> {
  const rows = await prisma.user.findMany({
    select: { topicMastery: true },
  });

  const totals: Record<string, { sum: number; learners: number; weak: number }> = {};
  const perUserAvgs: number[] = [];

  for (const r of rows) {
    const m = parseJson<Record<string, number>>(r.topicMastery, {});
    const learnedValues: number[] = [];
    for (const [tid, raw] of Object.entries(m)) {
      const v = typeof raw === "number" && isFinite(raw) ? raw : 0;
      if (v <= 0) continue;
      const slot = totals[tid] ?? { sum: 0, learners: 0, weak: 0 };
      slot.sum += v;
      slot.learners += 1;
      if (v < 0.5) slot.weak += 1;
      totals[tid] = slot;
      learnedValues.push(v);
    }
    if (learnedValues.length > 0) {
      const userAvg = learnedValues.reduce((s, v) => s + v, 0) / learnedValues.length;
      perUserAvgs.push(userAvg);
    }
  }

  const perTopic: MasteryTopicStat[] = Object.entries(totals).map(([topicId, t]) => ({
    topicId,
    avg: t.learners > 0 ? Math.round((t.sum / t.learners) * 100) : 0,
    learnerCount: t.learners,
    weakCount: t.weak,
  }));

  const globalAvg =
    perUserAvgs.length > 0
      ? Math.round((perUserAvgs.reduce((s, v) => s + v, 0) / perUserAvgs.length) * 100)
      : 0;

  const distribution: [number, number, number, number] = [0, 0, 0, 0];
  for (const v of perUserAvgs) {
    const pct = v * 100;
    if (pct < 25) distribution[0] += 1;
    else if (pct < 50) distribution[1] += 1;
    else if (pct < 75) distribution[2] += 1;
    else distribution[3] += 1;
  }

  return {
    totalUsers: rows.length,
    activeUsers: perUserAvgs.length,
    globalAvg,
    perTopic,
    distribution,
  };
}

// ─── Admin: per-user activity summary ────────────────────────────────────────
// For the admin users table + user detail header. Returns aggregate counts so
// the table can show "X bài · TB Y%" without N+1 queries.

export interface UserActivitySummary {
  attemptCount: number;       // submitted attempts (full exams)
  topicSessionCount: number;
  avgScore: number | null;    // 0..100, null when no activity
  lastActiveAt: Date | null;
}

export async function getUserActivityStats(
  userIds: string[],
): Promise<Map<string, UserActivitySummary>> {
  const map = new Map<string, UserActivitySummary>();
  for (const id of userIds) {
    map.set(id, {
      attemptCount: 0,
      topicSessionCount: 0,
      avgScore: null,
      lastActiveAt: null,
    });
  }
  if (userIds.length === 0) return map;

  const [attempts, sessions] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId: { in: userIds }, submitted: true },
      select: { userId: true, score: true, createdAt: true },
    }),
    prisma.topicSession.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, qcount: true, score: true, createdAt: true },
    }),
  ]);

  const sums: Record<string, { num: number; den: number }> = {};

  for (const a of attempts) {
    const slot = map.get(a.userId);
    if (!slot) continue;
    slot.attemptCount += 1;
    if (!slot.lastActiveAt || a.createdAt > slot.lastActiveAt) slot.lastActiveAt = a.createdAt;
    const s = sums[a.userId] ?? { num: 0, den: 0 };
    s.num += a.score;
    s.den += 1;
    sums[a.userId] = s;
  }

  for (const t of sessions) {
    const slot = map.get(t.userId);
    if (!slot) continue;
    slot.topicSessionCount += 1;
    if (!slot.lastActiveAt || t.createdAt > slot.lastActiveAt) slot.lastActiveAt = t.createdAt;
    if (t.qcount > 0) {
      const pct = (t.score / t.qcount) * 100;
      const s = sums[t.userId] ?? { num: 0, den: 0 };
      s.num += pct;
      s.den += 1;
      sums[t.userId] = s;
    }
  }

  for (const [uid, s] of Object.entries(sums)) {
    const slot = map.get(uid);
    if (slot && s.den > 0) slot.avgScore = Math.round(s.num / s.den);
  }

  return map;
}

// ─── Admin: paginated attempts for a specific user ───────────────────────────

export interface AdminAttemptRow {
  id: string;                 // attemptId
  examId: string;
  school: string;
  examTitle: string | null;
  examYear: string;
  kind: "official" | "reference" | "mixed";
  qcount: number;
  minutes: number;
  score: number;
  earned: number;
  total: number;
  durationSec: number;
  createdAt: Date;
}

export async function getAttemptsForAdmin(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ rows: AdminAttemptRow[]; total: number; page: number; pageSize: number }> {
  const safePage = Math.max(1, page);
  const [total, attempts] = await Promise.all([
    prisma.attempt.count({ where: { userId, submitted: true } }),
    prisma.attempt.findMany({
      where: { userId, submitted: true },
      include: { exam: true },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const rows: AdminAttemptRow[] = attempts.map((a) => ({
    id: a.id,
    examId: a.examId,
    school: a.exam.school,
    examTitle: a.exam.title,
    examYear: a.exam.year,
    kind: a.exam.kind as "official" | "reference" | "mixed",
    qcount: a.exam.qcount,
    minutes: a.exam.minutes,
    score: a.score,
    earned: a.earned,
    total: a.total,
    durationSec: a.durationSec,
    createdAt: a.createdAt,
  }));

  return { rows, total, page: safePage, pageSize };
}

// ─── Admin: topic sessions for a user (paired with attemptId when possible) ──

export interface AdminTopicSessionRow {
  id: string;
  topic: string;
  level: string;
  qcount: number;
  correctCount: number;
  score: number;            // 0..100
  examId: string | null;
  attemptId: string | null;
  createdAt: Date;
}

export async function getTopicSessionsForAdmin(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ rows: AdminTopicSessionRow[]; total: number; page: number; pageSize: number }> {
  const safePage = Math.max(1, page);
  const [total, sessions] = await Promise.all([
    prisma.topicSession.count({ where: { userId } }),
    prisma.topicSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const setIds = sessions.map((s) => s.setId).filter((v): v is string => Boolean(v));
  const attemptMap = new Map<string, string>();
  if (setIds.length > 0) {
    const attempts = await prisma.attempt.findMany({
      where: { userId, examId: { in: setIds }, submitted: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, examId: true },
    });
    for (const a of attempts) {
      if (!attemptMap.has(a.examId)) attemptMap.set(a.examId, a.id);
    }
  }

  const rows: AdminTopicSessionRow[] = sessions.map((s) => ({
    id: s.id,
    topic: s.topic,
    level: s.level,
    qcount: s.qcount,
    correctCount: s.score,
    score: s.qcount > 0 ? Math.round((s.score / s.qcount) * 100) : 0,
    examId: s.setId,
    attemptId: s.setId ? attemptMap.get(s.setId) ?? null : null,
    createdAt: s.createdAt,
  }));

  return { rows, total, page: safePage, pageSize };
}
