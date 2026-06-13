export const pct = (n: number): string => `${Math.round(n)}%`;

const pad2 = (n: number): string => String(n).padStart(2, "0");

export const hms = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return (h > 0 ? `${pad2(h)}:` : "") + `${pad2(m)}:${pad2(ss)}`;
};

export const daysBetween = (fromIso: string, toIso?: string): number => {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  return Math.max(0, Math.ceil((from - to) / 86_400_000));
};

export const greeting = (now: Date = new Date()): string => {
  const h = now.getHours();
  if (h < 11) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};
