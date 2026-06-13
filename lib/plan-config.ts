// Centralised plan & level config helpers.
// Reads PlanConfig / LevelConfig from DB; falls back to hardcoded defaults so
// the app works correctly even before the seed has run.
// -1 in the DB means "unlimited" — exported numbers use Infinity for that.

import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanLimits {
  plan: string;
  label: string;
  topicSetLimit: number;      // Infinity when unlimited
  referenceExamLimit: number; // Infinity when unlimited
}

export interface LevelConfigRow {
  level: string;
  label: string;
  sub: string;
  qcount: number;
  minutes: number;
  grades: string[];   // parsed from JSON string in DB
  tone: string;
  position: number;
  active: boolean;
}

// ─── Internal sentinel ────────────────────────────────────────────────────────

/** The DB stores -1 to mean "no limit"; we surface Infinity to callers. */
function dbToLimit(raw: number): number {
  return raw === -1 ? Infinity : raw;
}

// ─── Static fallbacks (match seed values exactly) ────────────────────────────

const DEFAULT_PLAN_LIMITS: Record<string, Omit<PlanLimits, "plan">> = {
  free: { label: "Miễn phí", topicSetLimit: 10,       referenceExamLimit: 5 },
  pro:  { label: "Pro",      topicSetLimit: 60,       referenceExamLimit: 20 },
  vip:  { label: "VIP",      topicSetLimit: Infinity, referenceExamLimit: Infinity },
};

const DEFAULT_LEVEL_CONFIGS: LevelConfigRow[] = [
  {
    level: "L4",  label: "Cơ bản",        sub: "Lớp 4 — công thức đơn lẻ",
    qcount: 8,  minutes: 15, grades: ["L4"],
    tone: "var(--success)", position: 0, active: true,
  },
  {
    level: "L5",  label: "Vừa",            sub: "Lớp 5 — 2-3 bước kết hợp",
    qcount: 10, minutes: 20, grades: ["L5", "L4+5"],
    tone: "var(--cg)",      position: 1, active: true,
  },
  {
    level: "NC",  label: "Nâng cao",       sub: "Olympic, biến đổi sáng tạo",
    qcount: 8,  minutes: 25, grades: ["NC"],
    tone: "var(--ntt)",     position: 2, active: true,
  },
  {
    level: "MIX", label: "Phỏng đề thật", sub: "Trộn các mức như đề thi",
    qcount: 10, minutes: 30, grades: ["L4", "L5", "L4+5", "NC"],
    tone: "var(--accent)",  position: 3, active: true,
  },
];

// ─── effectivePlan ────────────────────────────────────────────────────────────

/**
 * Returns the plan string that should be used for quota checks.
 * Admins are always treated as "vip" regardless of their stored plan.
 * Mirrors the logic in app/api/reference-exams/claim/route.ts.
 */
export function effectivePlan(user: {
  role?: string | null;
  plan?: string | null;
}): string {
  if (user.role === "admin") return "vip";
  return user.plan ?? "free";
}

// ─── getPlanConfig ────────────────────────────────────────────────────────────

/**
 * Reads the PlanConfig row for the given plan key.
 * Falls back to DEFAULT_PLAN_LIMITS if the row is missing.
 * Converts -1 → Infinity for the numeric limit fields.
 */
export async function getPlanConfig(plan: string): Promise<PlanLimits> {
  const row = await prisma.planConfig.findUnique({ where: { plan } });

  if (row) {
    return {
      plan: row.plan,
      label: row.label,
      topicSetLimit: dbToLimit(row.topicSetLimit),
      referenceExamLimit: dbToLimit(row.referenceExamLimit),
    };
  }

  const fallback = DEFAULT_PLAN_LIMITS[plan] ?? DEFAULT_PLAN_LIMITS.free;
  return { plan, ...fallback };
}

// ─── getLevelConfigs ──────────────────────────────────────────────────────────

/**
 * Returns all active LevelConfig rows ordered by position.
 * Falls back to DEFAULT_LEVEL_CONFIGS if the DB is empty (e.g. before seed).
 * The `grades` field is parsed from the JSON string stored in the DB.
 */
export async function getLevelConfigs(): Promise<LevelConfigRow[]> {
  const rows = await prisma.levelConfig.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });

  if (rows.length === 0) {
    return DEFAULT_LEVEL_CONFIGS;
  }

  return rows.map((row) => ({
    level: row.level,
    label: row.label,
    sub: row.sub,
    qcount: row.qcount,
    minutes: row.minutes,
    grades: parseGrades(row.grades),
    tone: row.tone,
    position: row.position,
    active: row.active,
  }));
}

// ─── getLevelConfig ───────────────────────────────────────────────────────────

/**
 * Returns a single LevelConfig by level key.
 * Falls back to the L5 config if the requested level is not found —
 * mirrors the `TOPIC_LEVEL_CONFIG[lvl] ?? TOPIC_LEVEL_CONFIG.L5` pattern
 * in lib/spawn-exam.ts.
 */
export async function getLevelConfig(level: string): Promise<LevelConfigRow> {
  const configs = await getLevelConfigs();
  const found = configs.find((c) => c.level === level.toUpperCase());
  if (found) return found;

  // Fallback: L5 (or first available)
  return configs.find((c) => c.level === "L5") ?? configs[0] ?? DEFAULT_LEVEL_CONFIGS[1];
}

// ─── countTopicSets ───────────────────────────────────────────────────────────

/**
 * Counts the total number of topic-practice sets a user has ever spawned.
 * This is the lifetime quota counter (never resets).
 */
export async function countTopicSets(userId: string): Promise<number> {
  return prisma.userTopicSet.count({ where: { userId } });
}

// ─── remainingTopicSets ───────────────────────────────────────────────────────

/**
 * Returns how many more topic-practice sets the user is allowed to spawn.
 * Returns Infinity for unlimited plans. Never returns a negative number.
 */
export async function remainingTopicSets(
  userId: string,
  plan: string
): Promise<number> {
  const { topicSetLimit } = await getPlanConfig(plan);

  if (topicSetLimit === Infinity) return Infinity;

  const used = await countTopicSets(userId);
  return Math.max(0, topicSetLimit - used);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseGrades(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((g): g is string => typeof g === "string");
    }
  } catch {
    // fall through
  }
  return [];
}
