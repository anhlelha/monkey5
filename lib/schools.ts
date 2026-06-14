import { prisma } from "./prisma";

export interface SchoolRow {
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
  active: boolean;
}

let cachedActive: SchoolRow[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000;

function toRow(r: {
  id: string; short: string; name: string; full: string; color: string;
  tone: string; desc: string; minutes: number; style: string; position: number; active: boolean;
}): SchoolRow {
  return {
    id: r.id, short: r.short, name: r.name, full: r.full, color: r.color,
    tone: r.tone, desc: r.desc, minutes: r.minutes, style: r.style,
    position: r.position, active: r.active,
  };
}

export async function getActiveSchools(): Promise<SchoolRow[]> {
  if (cachedActive && Date.now() - cacheTime < CACHE_TTL_MS) return cachedActive;
  const rows = await prisma.school.findMany({
    where: { active: true },
    orderBy: { position: "asc" },
  });
  cachedActive = rows.map(toRow);
  cacheTime = Date.now();
  return cachedActive;
}

export async function getAllSchools(): Promise<SchoolRow[]> {
  const rows = await prisma.school.findMany({ orderBy: { position: "asc" } });
  return rows.map(toRow);
}

export async function getSchoolById(id: string): Promise<SchoolRow | null> {
  const r = await prisma.school.findUnique({ where: { id } });
  return r ? toRow(r) : null;
}

export function invalidateSchoolsCache(): void {
  cachedActive = null;
  cacheTime = 0;
}

export const MIX_SCHOOL: SchoolRow = {
  id: "mix",
  short: "MIX",
  name: "Tổng hợp các trường",
  full: "Tổng hợp các trường",
  color: "var(--accent)",
  tone: "",
  desc: "Phong cách cân bằng các trường.",
  minutes: 60,
  style: "Cân bằng phong cách.",
  position: 999,
  active: true,
};
