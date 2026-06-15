import { prisma } from "@/lib/prisma";

const SINGLETON_ID = "singleton";
const TIMEZONE = "Asia/Ho_Chi_Minh";

export interface QuietHours {
  enabled: boolean;
  /** HH:mm 24h, interpreted in Asia/Ho_Chi_Minh. */
  start: string;
  /** HH:mm 24h, interpreted in Asia/Ho_Chi_Minh. End may wrap past midnight. */
  end: string;
}

const DEFAULT_QUIET_HOURS: QuietHours = {
  enabled: true,
  start: "22:00",
  end: "07:00",
};

/** Read the quiet-hours config, lazily creating the singleton row on first read. */
export async function getQuietHours(): Promise<QuietHours> {
  const row = await prisma.appSetting.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) {
    await prisma.appSetting.create({
      data: {
        id: SINGLETON_ID,
        quietHoursEnabled: DEFAULT_QUIET_HOURS.enabled,
        quietHoursStart: DEFAULT_QUIET_HOURS.start,
        quietHoursEnd: DEFAULT_QUIET_HOURS.end,
      },
    });
    return DEFAULT_QUIET_HOURS;
  }
  return {
    enabled: row.quietHoursEnabled,
    start: row.quietHoursStart,
    end: row.quietHoursEnd,
  };
}

/** Persist a new quiet-hours config. Caller must validate input first. */
export async function setQuietHours(next: QuietHours): Promise<QuietHours> {
  const row = await prisma.appSetting.upsert({
    where: { id: SINGLETON_ID },
    create: {
      id: SINGLETON_ID,
      quietHoursEnabled: next.enabled,
      quietHoursStart: next.start,
      quietHoursEnd: next.end,
    },
    update: {
      quietHoursEnabled: next.enabled,
      quietHoursStart: next.start,
      quietHoursEnd: next.end,
    },
  });
  return {
    enabled: row.quietHoursEnabled,
    start: row.quietHoursStart,
    end: row.quietHoursEnd,
  };
}

/** Convert "HH:mm" to total minutes-of-day (0..1439). Returns null if invalid. */
export function parseHHmm(value: string): number | null {
  const match = /^([0-2]\d):([0-5]\d)$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23) return null;
  return hours * 60 + minutes;
}

/** Current wall-clock minute-of-day in Asia/Ho_Chi_Minh. */
function nowMinutesInVN(now: Date = new Date()): number {
  // Intl gives a Vietnam-local clock regardless of server TZ.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hh * 60 + mm;
}

/**
 * True when `now` falls inside the quiet-hours window (inclusive of start,
 * exclusive of end). Wraps across midnight when end < start.
 */
export function isInQuietHours(config: QuietHours, now: Date = new Date()): boolean {
  if (!config.enabled) return false;
  const start = parseHHmm(config.start);
  const end = parseHHmm(config.end);
  if (start === null || end === null || start === end) return false;
  const current = nowMinutesInVN(now);
  if (start < end) {
    // Same-day window, e.g. 13:00 → 14:00
    return current >= start && current < end;
  }
  // Wraps midnight, e.g. 22:00 → 07:00
  return current >= start || current < end;
}
