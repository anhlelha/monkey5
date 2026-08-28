import type { CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Pill } from "@/components/ui";
import type { SchoolRow } from "@/lib/schools";
import type {
  ActiveSchoolProfileView,
  SchoolProfileMetricItem,
} from "@/lib/readiness-v4/school-profile-view-service";
import { SchoolProfileSelector } from "./SchoolProfileSelector";
import styles from "./SchoolProfileDashboard.module.css";

interface Props {
  school: SchoolRow;
  schools: SchoolRow[];
  profile: ActiveSchoolProfileView;
}

const BAND_LABELS: Record<string, string> = {
  foundation: "D1–D2 · Nền tảng",
  application: "D3 · Vận dụng",
  advanced: "D4–D5 · Phân hoá",
};

const CONFIDENCE_LABELS = {
  high: "Cao",
  medium: "Vừa",
  low: "Thấp",
} as const;

const RELIABILITY_COPY: Record<string, string> = {
  LOW_EXAM_COUNT: "Số đề còn ít",
  SINGLE_YEAR: "Dữ liệu mới có một năm",
  POINT_WEIGHT_UNAVAILABLE: "Chưa đủ dữ liệu trọng số điểm",
};

function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function fmt(value: number, digits = 1): string {
  return value.toFixed(digits);
}

function MetricList({ items }: { items: SchoolProfileMetricItem[] }) {
  return (
    <div className={styles.metricList}>
      {items.map((item) => (
        <div className={styles.metricRow} key={item.id}>
          <span className={styles.metricLabel} title={item.label}>{item.label}</span>
          <div className={styles.track} aria-hidden="true">
            <span
              className={styles.fill}
              style={{ width: `${Math.min(100, item.share * 100)}%`, background: item.color }}
            />
          </div>
          <span className={styles.metricValue}>{item.count} · {pct(item.share)}</span>
        </div>
      ))}
    </div>
  );
}

function PanelTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <div className={styles.panelHead}>
      <h2>{title}</h2>
      <p>{caption}</p>
    </div>
  );
}

export function SchoolProfileDashboard({ school, schools, profile }: Props) {
  const criticalTopics = profile.topics.filter((topic) => topic.critical);
  const yearCaption = profile.yearRange.length > 0
    ? `${profile.yearRange[0]} – ${profile.yearRange.at(-1)}`
    : "Chưa xác định";
  const heroStyle = { "--school-color": school.color } as CSSProperties;
  const kpis = [
    { label: "Số đề", value: String(profile.examCount), sub: `${profile.yearCount} năm học` },
    { label: "Số câu", value: String(profile.questionCount), sub: `assessment ${pct(profile.assessmentCoverage, 0)}` },
    { label: "Độ khó TB", value: fmt(profile.averageDifficulty, 2), sub: "thang D1–D5" },
    { label: "D4–D5", value: pct(profile.advancedShare), sub: "phần phân hoá" },
    { label: "Difficulty Index", value: fmt(profile.difficultyIndex, 1), sub: "anchor 50" },
    { label: "Áp lực thời gian", value: fmt(profile.averageQuestionsPerMinute, 3), sub: "câu/phút" },
  ];

  return (
    <div className={styles.dashboard} style={heroStyle}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroEyebrow}>School Profile v2 · Readiness V4</div>
          <div className={styles.schoolIdentity}>
            <span className={styles.schoolBadge}>{school.short}</span>
            <div>
              <h1>{school.full}</h1>
              <p>{school.style}</p>
            </div>
          </div>
          <div className={styles.heroMeta}>
            <span>{profile.examCount} đề chính thức</span>
            <span>{profile.yearCount} năm · {yearCaption}</span>
            <span>{profile.questionCount} câu đã đánh giá</span>
          </div>
        </div>

        <div className={styles.readinessCard}>
          <div className={styles.readinessTop}>
            <span>Profile đang áp dụng</span>
            <Pill tone="green">Active</Pill>
          </div>
          <div className={styles.readinessScore}>
            {fmt(profile.difficultyIndex, 1)}
            <small>/100</small>
          </div>
          <div className={styles.readinessTrack}>
            <span style={{ width: `${Math.min(100, profile.difficultyIndex)}%` }} />
          </div>
          <div className={styles.readinessBreakdown}>
            <div><span>Coverage</span><b>{pct(profile.assessmentCoverage, 0)}</b></div>
            <div><span>Confidence</span><b>{fmt(profile.averageAssessmentConfidence, 1)}</b></div>
          </div>
          <p>Difficulty Index v2 tổng hợp từ blueprint đề chính thức; không chứa dữ liệu học sinh.</p>
        </div>
      </section>

      <section className={styles.toolbar}>
        <div>
          <div className={styles.toolbarEyebrow}>Hồ sơ yêu cầu của trường</div>
          <p>Profile chỉ mô tả đề trường; không chứa dữ liệu riêng của học sinh.</p>
        </div>
        <div className={styles.toolbarActions}>
          <Link href="/admin/readiness/compare" className="btn">
            <Icon name="trend" size={13} /> So sánh tổng thể
          </Link>
          <SchoolProfileSelector
            currentSchool={school.id}
            schools={schools}
            className={styles.schoolSelector}
          />
          <Link href="/admin?tab=exams&subject=math" className="btn">
            <Icon name="library" size={13} /> Mở danh sách đề
          </Link>
        </div>
      </section>

      <section className={styles.kpiGrid} aria-label="Chỉ số School Profile">
        {kpis.map((kpi) => (
          <article className={styles.kpiCard} key={kpi.label}>
            <span>{kpi.label}</span>
            <b>{kpi.value}</b>
            <small>{kpi.sub}</small>
          </article>
        ))}
      </section>

      <section className={styles.twoColumns}>
        <article className={styles.panel}>
          <PanelTitle
            title="Phân bố độ khó D1–D5"
            caption="Cho thấy mặt bằng câu hỏi và phần đuôi phân hoá của toàn bộ profile."
          />
          <MetricList items={profile.difficultyDistribution} />
        </article>
        <article className={styles.panel}>
          <PanelTitle
            title="Mức nhận thức"
            caption="Dùng để đọc cấu trúc đề; không cộng độc lập lần hai vào Readiness."
          />
          <MetricList items={profile.cognitiveDistribution} />
        </article>
      </section>

      <section className={`${styles.panel} ${styles.tablePanel}`}>
        <PanelTitle
          title="Blueprint chuyên đề × dải độ khó"
          caption="Trọng số theo câu và theo điểm của từng chuyên đề trong toàn bộ nguồn đề chính thức."
        />
        <div className={styles.summaryChips}>
          <span><b>{criticalTopics.length}</b> chuyên đề trọng yếu ≥ {pct(profile.criticalTopicThreshold, 0)}</span>
          {criticalTopics.map((topic) => (
            <span key={topic.id} style={{ borderColor: `${topic.color}66` }}>
              <b>{topic.label}</b> · {pct(topic.countWeight)}
            </span>
          ))}
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.blueprintTable}>
            <thead>
              <tr>
                <th>Chuyên đề</th>
                <th>Số câu</th>
                <th>Count weight</th>
                <th>Point weight</th>
                <th>{BAND_LABELS.foundation}</th>
                <th>{BAND_LABELS.application}</th>
                <th>{BAND_LABELS.advanced}</th>
              </tr>
            </thead>
            <tbody>
              {profile.topics.map((topic) => (
                <tr key={topic.id}>
                  <td className={styles.topicCell}>
                    <b><i style={{ background: topic.color }} />{topic.label}</b>
                    <span>{topic.id}</span>
                    {topic.critical && <em>Trọng yếu</em>}
                  </td>
                  <td><strong>{topic.count}</strong></td>
                  <td><strong>{pct(topic.countWeight)}</strong></td>
                  <td>{topic.pointWeight === null ? "—" : <strong>{pct(topic.pointWeight)}</strong>}</td>
                  {(["foundation", "application", "advanced"] as const).map((band) => (
                    <td key={band} className={styles.bandCell}>
                      <b>{topic.bands[band].count} câu</b>
                      <span>{pct(topic.bands[band].countWeight)} toàn profile</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.twoColumns}>
        <article className={styles.panel}>
          <PanelTitle
            title="Cơ cấu chuyên đề"
            caption="Sắp xếp theo trọng số số câu; giúp thấy trường tập trung vào đâu."
          />
          <MetricList items={profile.topics.map((topic) => ({
            id: topic.id,
            label: topic.label,
            count: topic.count,
            share: topic.countWeight,
            color: topic.color,
          }))} />
        </article>
        <article className={styles.panel}>
          <PanelTitle
            title="Hình thức câu hỏi"
            caption="Cách trường yêu cầu học sinh chọn đáp án, điền kết quả hoặc trình bày lời giải."
          />
          <MetricList items={profile.formatDistribution} />
          <div className={styles.sourceGrid}>
            <div><b>Assessment run</b><code>{profile.assessmentRunId}</code></div>
            <div><b>Model</b><span>{profile.assessmentModel}</span></div>
            <div><b>Confidence</b><span>{fmt(profile.averageAssessmentConfidence, 1)}/100 · {CONFIDENCE_LABELS[profile.confidence]}</span></div>
            <div><b>Coverage</b><span>{pct(profile.assessmentCoverage)} assessment</span></div>
          </div>
        </article>
      </section>

      <section className={`${styles.panel} ${styles.tablePanel}`}>
        <PanelTitle
          title="Lịch sử đề trong profile"
          caption="Mỗi đề là một nguồn cấu thành profile và giúp review độ ổn định giữa các năm."
        />
        <div className={styles.tableScroll}>
          <table className={styles.examTable}>
            <thead>
              <tr>
                <th>Năm / đề</th>
                <th>Số câu</th>
                <th>Thời lượng</th>
                <th>Câu/phút</th>
                <th>Độ khó TB</th>
                <th>D4–D5</th>
                <th>Tổng điểm</th>
              </tr>
            </thead>
            <tbody>
              {profile.exams.map((exam) => (
                <tr key={exam.id}>
                  <td className={styles.examName}><b>{exam.year} · {exam.id}</b><span>{exam.title}</span></td>
                  <td>{exam.questionCount}{exam.questionCount !== exam.expectedQuestions ? ` / ${exam.expectedQuestions}` : ""}</td>
                  <td>{exam.minutes} phút</td>
                  <td>{fmt(exam.questionsPerMinute, 3)}</td>
                  <td><b>{exam.averageDifficulty === null ? "—" : fmt(exam.averageDifficulty, 2)}</b></td>
                  <td>{pct(exam.advancedShare)}</td>
                  <td>{exam.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className={styles.lineage}>
        <div>
          <b>Dữ liệu & phiên bản</b>
          <span>Profile <code>{profile.id}</code> · Taxonomy <code>{profile.taxonomyVersion}</code> · Methodology <code>{profile.methodologyVersion}</code></span>
        </div>
        <div>
          <b>Assessment & kích hoạt</b>
          <span>Run <code>{profile.assessmentRunId}</code> · {profile.activatedAt ? new Date(profile.activatedAt).toLocaleString("vi-VN") : "—"}</span>
        </div>
        <div>
          <b>Source hash</b>
          <span><code>{profile.sourceHash}</code></span>
        </div>
        {profile.reliabilityFlags.length > 0 && (
          <div>
            <b>Lưu ý độ tin cậy</b>
            <span>{profile.reliabilityFlags.map((flag) => RELIABILITY_COPY[flag] ?? flag).join(" · ")}</span>
          </div>
        )}
      </footer>
    </div>
  );
}
