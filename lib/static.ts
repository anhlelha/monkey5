// Static reference data — schools and topics.
// Topics can also be edited via admin and persisted in the DB; the DB version
// takes priority when available (see lib/topics.ts).

export interface School {
  id: string;
  short: string;
  name: string;
  full: string;
  color: string;
  tone: string;
  desc: string;
  minutes: number;
  style: string;
}

export interface Topic {
  id: string;
  name: string;
  short: string;
  ico: string;
  color: string;
}

export const SCHOOLS: readonly School[] = [
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
  },
] as const;

export const DEFAULT_TOPICS: readonly Topic[] = [
  { id: "soh", name: "Số học & Số tự nhiên", short: "Số học", ico: "123", color: "var(--cg)" },
  { id: "hinh", name: "Hình học", short: "Hình học", ico: "△", color: "var(--ntt)" },
  { id: "phan", name: "Phân số, Tỉ số & %", short: "Phân số", ico: "½", color: "var(--ltv)" },
  { id: "cd", name: "Chuyển động", short: "Chuyển động", ico: "→", color: "var(--tx)" },
  { id: "log", name: "Suy luận logic", short: "Logic", ico: "?", color: "oklch(0.6 0.14 200)" },
  { id: "do", name: "Đo lường & Đổi đơn vị", short: "Đo lường", ico: "↔", color: "oklch(0.6 0.13 170)" },
  { id: "xs", name: "Biểu đồ, Thống kê & Xác suất", short: "Xác suất", ico: "▥", color: "oklch(0.62 0.13 330)" },
  { id: "tuoi", name: "Toán tuổi", short: "Toán tuổi", ico: "Δt", color: "oklch(0.62 0.13 130)" },
  { id: "ti", name: "Đại lượng tỉ lệ & Bản đồ", short: "Tỉ lệ", ico: ":", color: "oklch(0.62 0.14 50)" },
  { id: "tg", name: "Thời gian (giờ - phút)", short: "Thời gian", ico: "⌚", color: "oklch(0.55 0.04 260)" },
] as const;

export const schoolById = (id: string) => SCHOOLS.find((s) => s.id === id);

export const MIX_SCHOOL: School = {
  id: "mix",
  short: "MIX",
  name: "Tổng hợp 4 trường",
  full: "Tổng hợp 4 trường",
  color: "var(--accent)",
  tone: "",
  desc: "Phong cách cân bằng cả 4 trường.",
  minutes: 60,
  style: "Cân bằng phong cách 4 trường.",
};
