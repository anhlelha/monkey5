"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pill } from "@/components/ui";
import type { MathAnalyticalTopicMeta } from "@/lib/readiness-v4/analytical-topics";
import {
  sortSchoolProfileComparisonRows,
  type ComparisonSortMetric,
  type ComparisonWeightMode,
  type SchoolProfileComparisonRow,
  type SchoolProfileComparisonSummary,
} from "@/lib/readiness-v4/school-profile-comparison-service";
import styles from "./SchoolProfileComparison.module.css";

interface Props {
  rows: SchoolProfileComparisonRow[];
  summary: SchoolProfileComparisonSummary;
  topics: MathAnalyticalTopicMeta[];
  initialSchools?: string[];
  initialMetric?: ComparisonSortMetric;
  initialWeight?: ComparisonWeightMode;
  initialDirection?: "asc" | "desc";
}

const METRICS: Array<{ id: ComparisonSortMetric; label: string }> = [
  { id: "difficultyIndex", label: "Difficulty Index" },
  { id: "averageDifficulty", label: "Độ khó TB" },
  { id: "advancedShare", label: "Tỷ trọng D4–D5" },
  { id: "questionsPerMinute", label: "Áp lực thời gian" },
  { id: "examCount", label: "Số đề" },
  { id: "assessmentCoverage", label: "Coverage" },
  { id: "assessmentConfidence", label: "Confidence" },
];

const RELIABILITY_COPY: Record<string, string> = {
  LOW_EXAM_COUNT: "Số đề còn ít",
  SINGLE_YEAR: "Dữ liệu mới có một năm",
  POINT_WEIGHT_UNAVAILABLE: "Thiếu point weight đáng tin cậy",
};

const DIFFICULTY_COLORS = ["#2f806d", "#55a27d", "#6f4fb2", "#bd6877", "#93425d"];
const BAND_COLORS = { foundation: "#4e9a79", application: "#6f4fb2", advanced: "#aa4f68" };

function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function fmt(value: number, digits = 1): string {
  return value.toFixed(digits);
}

function metricValue(row: SchoolProfileComparisonRow, metric: ComparisonSortMetric): string {
  if (metric === "advancedShare" || metric === "assessmentCoverage") return pct(row[metric]);
  if (metric === "questionsPerMinute") return fmt(row[metric], 3);
  if (metric === "assessmentConfidence") return `${fmt(row[metric], 1)}/100`;
  if (metric === "averageDifficulty") return fmt(row[metric], 2);
  if (metric === "examCount") return String(row[metric]);
  return fmt(row[metric], 1);
}

function replaceQuery(input: {
  schools: string[];
  metric: ComparisonSortMetric;
  weight: ComparisonWeightMode;
  direction: "asc" | "desc";
}) {
  const params = new URLSearchParams();
  if (input.schools.length) params.set("schools", input.schools.join(","));
  params.set("metric", input.metric);
  params.set("weight", input.weight);
  params.set("sort", input.direction);
  window.history.replaceState(null, "", `/admin/readiness/compare?${params.toString()}`);
}

export function SchoolProfileComparison({
  rows,
  summary,
  topics,
  initialSchools,
  initialMetric = "difficultyIndex",
  initialWeight = "count",
  initialDirection = "desc",
}: Props) {
  const validInitial = (initialSchools ?? []).filter((id) => rows.some((row) => row.school === id)).slice(0, 4);
  const [selectedSchools, setSelectedSchools] = useState<string[]>(validInitial.length >= 2 ? validInitial : rows.slice(0, 3).map((row) => row.school));
  const [metric, setMetric] = useState<ComparisonSortMetric>(initialMetric);
  const [weight, setWeight] = useState<ComparisonWeightMode>(initialWeight);
  const [direction, setDirection] = useState<"asc" | "desc">(initialDirection);
  const sortedRows = useMemo(() => sortSchoolProfileComparisonRows(rows, metric, direction), [rows, metric, direction]);
  const selectedRows = useMemo(
    () => selectedSchools.flatMap((id) => rows.find((row) => row.school === id) ?? []),
    [rows, selectedSchools],
  );

  const updateState = (next: Partial<{
    schools: string[];
    metric: ComparisonSortMetric;
    weight: ComparisonWeightMode;
    direction: "asc" | "desc";
  }>) => {
    const state = {
      schools: next.schools ?? selectedSchools,
      metric: next.metric ?? metric,
      weight: next.weight ?? weight,
      direction: next.direction ?? direction,
    };
    if (next.schools) setSelectedSchools(next.schools);
    if (next.metric) setMetric(next.metric);
    if (next.weight) setWeight(next.weight);
    if (next.direction) setDirection(next.direction);
    replaceQuery(state);
  };

  const toggleSchool = (school: string) => {
    const exists = selectedSchools.includes(school);
    const next = exists
      ? selectedSchools.filter((id) => id !== school)
      : selectedSchools.length < 4
        ? [...selectedSchools, school]
        : selectedSchools;
    if (next.length >= 2) updateState({ schools: next });
  };

  const years = summary.yearRange.length > 0
    ? `${summary.yearRange[0]}–${summary.yearRange.at(-1)}`
    : "—";
  const maxMetric = Math.max(...sortedRows.map((row) => row[metric]), 1);
  const minDifficulty = Math.min(...rows.map((row) => row.difficultyIndex), 45) - 3;
  const maxDifficulty = Math.max(...rows.map((row) => row.difficultyIndex), 55) + 3;
  const minPressure = Math.min(...rows.map((row) => row.questionsPerMinute), 0);
  const maxPressure = Math.max(...rows.map((row) => row.questionsPerMinute), 1);
  const scatterX = (value: number) => 50 + ((value - minDifficulty) / Math.max(1, maxDifficulty - minDifficulty)) * 650;
  const scatterY = (value: number) => 270 - ((value - minPressure) / Math.max(0.01, maxPressure - minPressure)) * 220;

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>Admin · Readiness V4</div>
          <h1>So sánh School Profile V2</h1>
          <p>Đối chiếu cấu trúc đề official giữa các trường. Không chứa dữ liệu học sinh và không phải bảng xếp hạng xác suất đỗ.</p>
        </div>
        <div className={styles.heroNote}>
          <b>Difficulty Index</b>
          <span>Mô tả profile đề; anchor toàn hệ thống là 50. Không cộng trực tiếp vào Readiness học sinh.</span>
        </div>
      </section>

      <section className={styles.kpis} aria-label="Tổng quan School Profile">
        {[
          ["Profile active", summary.schoolCount, "trường"],
          ["Nguồn official", summary.examCount, "lượt đề theo profile"],
          ["Câu đã đánh giá", summary.questionCount, years],
          ["Coverage TB", pct(summary.averageCoverage, 0), "weighted theo số câu"],
          ["Confidence TB", `${fmt(summary.averageConfidence, 1)}/100`, "assessment confidence"],
          ["Cần lưu ý", summary.reliabilityWarningCount, "profile có warning"],
        ].map(([label, value, sub]) => (
          <article key={String(label)}><span>{label}</span><b>{value}</b><small>{sub}</small></article>
        ))}
      </section>

      <section className={styles.controls}>
        <div>
          <label>Metric sắp xếp
            <select value={metric} onChange={(event) => updateState({ metric: event.target.value as ComparisonSortMetric })}>
              {METRICS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>Chiều
            <select value={direction} onChange={(event) => updateState({ direction: event.target.value as "asc" | "desc" })}>
              <option value="desc">Cao → thấp</option>
              <option value="asc">Thấp → cao</option>
            </select>
          </label>
          <label>Trọng số heatmap
            <select value={weight} onChange={(event) => updateState({ weight: event.target.value as ComparisonWeightMode })}>
              <option value="count">Theo số câu</option>
              <option value="point">Theo điểm</option>
            </select>
          </label>
        </div>
        <div className={styles.selection}>
          <span>Chọn 2–4 trường để đối chiếu sâu</span>
          <div>
            {rows.map((row) => (
              <button
                key={row.school}
                type="button"
                className={selectedSchools.includes(row.school) ? styles.selected : ""}
                onClick={() => toggleSchool(row.school)}
                aria-pressed={selectedSchools.includes(row.school)}
              >
                <i style={{ background: row.color }} />{row.schoolShort}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Bảng tổng hợp</h2><p>Click tên trường để mở profile chi tiết.</p></div><Pill>{sortedRows.length} profile</Pill></div>
        <div className={styles.scroll}>
          <table className={styles.summaryTable}>
            <thead><tr><th>Trường</th><th>Đề / năm / câu</th><th>Difficulty Index</th><th>Độ khó TB</th><th>D4–D5</th><th>Câu/phút</th><th>Coverage</th><th>Confidence</th><th>Reliability</th></tr></thead>
            <tbody>{sortedRows.map((row) => (
              <tr key={row.school}>
                <td><Link href={`/admin/readiness/${row.school}`}><i style={{ background: row.color }} /> <b>{row.schoolShort}</b><span>{row.schoolName}</span></Link></td>
                <td>{row.examCount} / {row.yearCount} / {row.questionCount}</td>
                <td><b>{fmt(row.difficultyIndex, 1)}</b></td>
                <td>{fmt(row.averageDifficulty, 2)}</td>
                <td>{pct(row.advancedShare)}</td>
                <td>{fmt(row.questionsPerMinute, 3)}</td>
                <td>{pct(row.assessmentCoverage, 0)}</td>
                <td>{fmt(row.assessmentConfidence, 1)}/100</td>
                <td>{row.reliabilityFlags.length === 0 ? <Pill tone="green">Ổn định</Pill> : <Pill tone="amber">{row.reliabilityFlags.length} lưu ý</Pill>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.twoColumns}>
        <article className={styles.panel}>
          <div className={styles.panelHead}><div><h2>{METRICS.find((item) => item.id === metric)?.label}</h2><p>Đã sắp xếp {direction === "desc" ? "cao xuống thấp" : "thấp lên cao"}.</p></div></div>
          <div className={styles.barChart}>
            {sortedRows.map((row) => (
              <div key={row.school}><Link href={`/admin/readiness/${row.school}`}>{row.schoolShort}</Link><span><i style={{ width: `${Math.max(2, (row[metric] / maxMetric) * 100)}%`, background: row.color }} /></span><b>{metricValue(row, metric)}</b></div>
            ))}
          </div>
          {metric === "difficultyIndex" && <div className={styles.anchorNote}>Anchor Difficulty Index toàn hệ thống: 50</div>}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Độ khó × áp lực thời gian</h2><p>Kích thước điểm biểu thị số đề trong profile.</p></div></div>
          <div className={styles.scatterWrap}>
            <svg viewBox="0 0 740 310" role="img" aria-labelledby="scatter-title scatter-desc">
              <title id="scatter-title">Scatter Difficulty Index và số câu trên phút</title>
              <desc id="scatter-desc">Mỗi điểm là một trường; trục ngang là Difficulty Index, trục dọc là số câu trên phút.</desc>
              <line x1="50" y1="270" x2="710" y2="270" />
              <line x1="50" y1="40" x2="50" y2="270" />
              <line className={styles.anchorLine} x1={scatterX(50)} y1="40" x2={scatterX(50)} y2="270" />
              <text x="620" y="298">Difficulty Index</text><text x="8" y="28">Câu/phút</text>
              {rows.map((row) => (
                <g key={row.school}>
                  <circle cx={scatterX(row.difficultyIndex)} cy={scatterY(row.questionsPerMinute)} r={Math.max(7, Math.min(17, 5 + row.examCount))} fill={row.color} opacity="0.84">
                    <title>{row.schoolShort}: DI {fmt(row.difficultyIndex, 1)}, {fmt(row.questionsPerMinute, 3)} câu/phút, {row.examCount} đề</title>
                  </circle>
                  <text x={scatterX(row.difficultyIndex) + 11} y={scatterY(row.questionsPerMinute) - 10}>{row.schoolShort}</text>
                </g>
              ))}
            </svg>
          </div>
          <details><summary>Bảng thay thế biểu đồ</summary><div className={styles.miniTable}>{rows.map((row) => <div key={row.school}><b>{row.schoolShort}</b><span>DI {fmt(row.difficultyIndex, 1)}</span><span>{fmt(row.questionsPerMinute, 3)} câu/phút</span><span>{row.examCount} đề</span></div>)}</div></details>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Heatmap 13 topic × trường</h2><p>{weight === "point" ? "Trọng số theo điểm; profile thiếu point weight dùng count fallback và được đánh dấu *." : "Trọng số theo số câu."}</p></div></div>
        <div className={styles.scroll}>
          <table className={styles.heatmap}><thead><tr><th>Trường</th>{topics.map((topic) => <th key={topic.id} title={topic.name}>{topic.short}</th>)}</tr></thead>
            <tbody>{sortedRows.map((row) => <tr key={row.school}><th><Link href={`/admin/readiness/${row.school}`}>{row.schoolShort}{weight === "point" && !row.pointWeightAvailable ? "*" : ""}</Link></th>{topics.map((topic) => {
              const value = row.topicWeights[weight][topic.id] ?? 0;
              return <td key={topic.id} style={{ background: `color-mix(in oklab, ${row.color} ${Math.min(82, 8 + value * 330)}%, white)` }} title={`${row.schoolShort} · ${topic.name}: ${pct(value)}`}>{pct(value, 0)}</td>;
            })}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}><div><h2>Phân bố D1–D5</h2><p>Text và tỷ lệ nằm ngay dưới mỗi stacked bar.</p></div></div>
        <div className={styles.stackedList}>{sortedRows.map((row) => (
          <div key={row.school}><Link href={`/admin/readiness/${row.school}`}>{row.schoolShort}</Link><div className={styles.stack}>{(["D1", "D2", "D3", "D4", "D5"] as const).map((id, index) => <i key={id} style={{ width: `${row.difficultyDistribution[id] * 100}%`, background: DIFFICULTY_COLORS[index] }} title={`${id}: ${pct(row.difficultyDistribution[id])}`} />)}</div><span>{(["D1", "D2", "D3", "D4", "D5"] as const).map((id) => `${id} ${pct(row.difficultyDistribution[id], 0)}`).join(" · ")}</span></div>
        ))}</div>
        <div className={styles.legend}>{DIFFICULTY_COLORS.map((color, index) => <span key={color}><i style={{ background: color }} />D{index + 1}</span>)}</div>
      </section>

      <section className={styles.twoColumns}>
        <article className={styles.panel}>
          <div className={styles.panelHead}><div><h2>So sánh chọn lọc</h2><p>{selectedRows.length} trường · {weight === "point" ? "point weight" : "count weight"}</p></div></div>
          <div className={styles.selectedCards}>{selectedRows.map((row) => {
            const topTopics = [...topics].sort((left, right) => row.topicWeights[weight][right.id] - row.topicWeights[weight][left.id]).slice(0, 4);
            return <article key={row.school} style={{ borderTopColor: row.color }}><div><b>{row.schoolShort}</b><Link href={`/admin/readiness/${row.school}`}>Mở profile →</Link></div><p>DI {fmt(row.difficultyIndex, 1)} · D4–D5 {pct(row.advancedShare)}</p><div className={styles.bandStack}>{(["foundation", "application", "advanced"] as const).map((band) => <i key={band} style={{ width: `${row.bandWeights[weight][band] * 100}%`, background: BAND_COLORS[band] }} />)}</div><ul>{topTopics.map((topic) => <li key={topic.id}><span>{topic.short}</span><b>{pct(row.topicWeights[weight][topic.id])}</b></li>)}</ul></article>;
          })}</div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}><div><h2>Reliability</h2><p>Đọc kết luận cùng độ phủ nguồn và warning.</p></div></div>
          <div className={styles.reliability}>{sortedRows.map((row) => (
            <div key={row.school}><span><i style={{ background: row.color }} /><b>{row.schoolShort}</b></span><Pill tone={row.confidence === "high" ? "green" : row.confidence === "medium" ? "amber" : "red"}>{row.confidence === "high" ? "Cao" : row.confidence === "medium" ? "Vừa" : "Thấp"}</Pill><small>{row.reliabilityFlags.length ? row.reliabilityFlags.map((flag) => RELIABILITY_COPY[flag] ?? flag).join(" · ") : "Không có warning"}</small></div>
          ))}</div>
        </article>
      </section>
    </div>
  );
}
