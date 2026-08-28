export interface MathAnalyticalTopicMeta {
  id: string;
  name: string;
  short: string;
  icon: string;
  color: string;
}

export const MATH_ANALYTICAL_TOPICS: MathAnalyticalTopicMeta[] = [
  { id: "num_div", name: "Số học & chia hết", short: "Số học", icon: "123", color: "#1886b7" },
  { id: "frac_decimal", name: "Phân số & số thập phân", short: "Phân số", icon: "½", color: "#7c5cc4" },
  { id: "ratio_percent", name: "Tỉ số & phần trăm", short: "Tỉ số", icon: "%", color: "#d17732" },
  { id: "sequence_pattern", name: "Dãy số & quy luật", short: "Dãy số", icon: "↗", color: "#4777c8" },
  { id: "plane_geometry", name: "Hình học phẳng", short: "Hình phẳng", icon: "△", color: "#328f75" },
  { id: "solid_geometry", name: "Hình học không gian", short: "Hình khối", icon: "◇", color: "#397d97" },
  { id: "measurement", name: "Đo lường & đổi đơn vị", short: "Đo lường", icon: "↔", color: "#a86b35" },
  { id: "motion", name: "Chuyển động", short: "Chuyển động", icon: "→", color: "#ce5f55" },
  { id: "work_rate", name: "Năng suất & công việc", short: "Công việc", icon: "⚙", color: "#6f7f3c" },
  { id: "time_calendar", name: "Thời gian & lịch", short: "Thời gian", icon: "◷", color: "#8b65a5" },
  { id: "data_probability", name: "Dữ liệu & xác suất", short: "Xác suất", icon: "▥", color: "#278b8d" },
  { id: "counting_combinatorics", name: "Đếm & tổ hợp", short: "Tổ hợp", icon: "Σ", color: "#bd5b84" },
  { id: "logic_strategy", name: "Logic & chiến lược", short: "Logic", icon: "?", color: "#59636f" },
];

export const MATH_ANALYTICAL_TOPIC_IDS = new Set(MATH_ANALYTICAL_TOPICS.map((topic) => topic.id));

export function getMathAnalyticalTopic(id: string): MathAnalyticalTopicMeta | null {
  return MATH_ANALYTICAL_TOPICS.find((topic) => topic.id === id) ?? null;
}
