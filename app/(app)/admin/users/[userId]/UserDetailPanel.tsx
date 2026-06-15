import Link from "next/link";
import { Bar, Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import type {
  AdminAttemptRow,
  AdminTopicSessionRow,
  UserActivitySummary,
  UserShape,
} from "@/lib/user-data";

interface TopicMeta {
  id: string;
  name: string;
  short: string;
  color: string;
}

interface SchoolMeta {
  id: string;
  short: string;
  name: string;
  full: string;
  tone: string;
}

interface Props {
  user: UserShape;
  summary: UserActivitySummary;
  topics: TopicMeta[];
  schools: SchoolMeta[];
  attempts: {
    rows: AdminAttemptRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  topicSessions: {
    rows: AdminTopicSessionRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  activeTab: "exams" | "topics";
}

const toneFor = (pct: number): "" | "ltv" | "ntt" => {
  if (pct >= 70) return "";
  if (pct >= 50) return "ltv";
  return "ntt";
};

const pillToneFor = (pct: number): "green" | "amber" | "red" => {
  if (pct >= 70) return "green";
  if (pct >= 50) return "amber";
  return "red";
};

const fmtDateTime = (d: Date): string =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function UserDetailPanel({
  user,
  summary,
  topics,
  schools,
  attempts,
  topicSessions,
  activeTab,
}: Props) {
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));

  const initials =
    (user.name ?? user.email ?? "?")
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((s) => s[0])
      .join("")
      .toUpperCase() || "?";

  const planLabel = user.plan === "vip" ? "VIP" : user.plan === "pro" ? "Pro" : "Free";
  const planTone = user.plan === "vip" ? "solid" : user.plan === "pro" ? "green" : "";

  const masteryEntries = Object.entries(user.topicMastery)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .sort((a, b) => b[1] - a[1]);
  const masteryAvg =
    masteryEntries.length > 0
      ? Math.round(
          (masteryEntries.reduce((s, [, v]) => s + v, 0) / masteryEntries.length) * 100,
        )
      : 0;

  const targetSchools = user.targets
    .map((id) => schoolById.get(id))
    .filter((s): s is SchoolMeta => Boolean(s));

  const attemptTotalPages = Math.max(1, Math.ceil(attempts.total / attempts.pageSize));
  const topicTotalPages = Math.max(1, Math.ceil(topicSessions.total / topicSessions.pageSize));

  const pageHrefBuilder = (tab: "exams" | "topics", page: number) =>
    `/admin/users/${user.id}?tab=${tab}&page=${page}`;

  const activityMax = Math.max(
    1,
    ...user.activity.map((v) => (typeof v === "number" ? v : 0)),
  );

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card>
        <div className="row" style={{ gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div
            className="avatar"
            style={{
              width: 64,
              height: 64,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div className="row" style={{ gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{user.name ?? "Chưa đặt tên"}</h2>
              <Pill tone={user.role === "admin" ? "solid" : ""}>{user.role}</Pill>
              <Pill tone={planTone}>{planLabel}</Pill>
              <Pill>{user.grade}</Pill>
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {user.email ?? "—"}
            </div>
            <div className="row" style={{ gap: 16, marginTop: 10, flexWrap: "wrap" }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>Streak</div>
                <b className="mono">{user.streak} ngày</b>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>Đã tham gia</div>
                <b className="mono">{user.joinedDays} ngày</b>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>Mục tiêu sẵn sàng</div>
                <b className="mono">{user.readyTarget}%</b>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>Số giờ học/tuần</div>
                <b className="mono">{user.hours}h</b>
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 10 }}>Ngày thi</div>
                <b className="mono">
                  {user.examDate
                    ? new Date(user.examDate).toLocaleDateString("vi-VN")
                    : "—"}
                </b>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Link href="/admin?tab=users" className="btn ghost sm">
              <Icon name="chevR" size={11} /> Trở lại danh sách
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid cols-4" style={{ gap: 12 }}>
        <Card tight>
          <div className="eyebrow">Đề đã làm</div>
          <div
            className="kpi"
            style={{ color: "var(--accent-ink)", fontSize: 28, marginTop: 6 }}
          >
            {summary.attemptCount}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            lượt nộp đề
          </div>
        </Card>
        <Card tight>
          <div className="eyebrow">Phiên luyện chuyên đề</div>
          <div className="kpi" style={{ color: "var(--cg)", fontSize: 28, marginTop: 6 }}>
            {summary.topicSessionCount}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            phiên hoàn tất
          </div>
        </Card>
        <Card tight>
          <div className="eyebrow">Điểm TB</div>
          <div
            className="kpi"
            style={{
              color:
                summary.avgScore === null
                  ? "var(--ink-muted)"
                  : summary.avgScore >= 70
                    ? "var(--success)"
                    : summary.avgScore >= 50
                      ? "var(--ltv)"
                      : "var(--danger)",
              fontSize: 28,
              marginTop: 6,
            }}
          >
            {summary.avgScore === null ? "—" : `${summary.avgScore}%`}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            trên toàn bộ lượt
          </div>
        </Card>
        <Card tight>
          <div className="eyebrow">Mastery TB</div>
          <div
            className="kpi"
            style={{
              color:
                masteryAvg >= 70
                  ? "var(--success)"
                  : masteryAvg >= 50
                    ? "var(--ink)"
                    : "var(--danger)",
              fontSize: 28,
              marginTop: 6,
            }}
          >
            {masteryEntries.length > 0 ? `${masteryAvg}%` : "—"}
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            {masteryEntries.length} chuyên đề đã luyện
          </div>
        </Card>
      </div>

      <div className="grid cols-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Sẵn sàng theo trường" sub="Readiness hiện tại với các trường mục tiêu">
          {targetSchools.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>HS chưa chọn trường mục tiêu.</div>
          ) : (
            <div className="col" style={{ gap: 12 }}>
              {targetSchools.map((s) => {
                const current = user.readiness[s.id] ?? 0;
                return (
                  <div key={s.id}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <span className="row" style={{ gap: 8 }}>
                        <span className={"pill " + s.tone}>{s.short}</span>
                        <span style={{ fontSize: 13 }}>{s.full}</span>
                      </span>
                      <span className="mono" style={{ fontSize: 13 }}>
                        <b
                          style={{
                            color:
                              current >= 70
                                ? "var(--success)"
                                : current >= 50
                                  ? "var(--ink)"
                                  : "var(--danger)",
                          }}
                        >
                          {current}%
                        </b>
                      </span>
                    </div>
                    <Bar value={current} tone={s.tone} tall />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Mastery theo chuyên đề" sub="Mức thành thạo hiện tại của HS">
          {masteryEntries.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>HS chưa luyện chuyên đề nào.</div>
          ) : (
            <div className="col" style={{ gap: 8 }}>
              {masteryEntries.map(([tid, v]) => {
                const t = topicById.get(tid);
                const pct = Math.round(v * 100);
                return (
                  <div key={tid}>
                    <div className="row between" style={{ marginBottom: 3 }}>
                      <span className="row" style={{ gap: 8, fontSize: 13 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            background: t?.color ?? "var(--ink-muted)",
                            borderRadius: 2,
                          }}
                        />
                        {t?.name ?? tid}
                      </span>
                      <b
                        className="mono"
                        style={{
                          fontSize: 13,
                          color:
                            pct >= 70
                              ? "var(--success)"
                              : pct >= 50
                                ? "var(--ink)"
                                : "var(--danger)",
                        }}
                      >
                        {pct}%
                      </b>
                    </div>
                    <Bar value={pct} tone={toneFor(pct)} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card title="Hoạt động 14 ngày qua" sub="Tỉ lệ đúng (%) mỗi ngày — cột rỗng nghĩa là chưa luyện">
        <div className="row" style={{ gap: 6, alignItems: "flex-end", height: 80 }}>
          {(user.activity.length > 0 ? user.activity : Array(14).fill(null)).map((v, i) => {
            const val = typeof v === "number" ? v : 0;
            const h = v === null ? 4 : (val / activityMax) * 70 + 6;
            const color =
              v === null
                ? "var(--border)"
                : val >= 70
                  ? "var(--success)"
                  : val >= 50
                    ? "var(--ltv)"
                    : "var(--danger)";
            return (
              <div
                key={i}
                title={v === null ? "Không có dữ liệu" : `${val}%`}
                style={{
                  flex: 1,
                  height: h,
                  background: color,
                  borderRadius: 3,
                  minWidth: 6,
                }}
              />
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="row" style={{ gap: 8, marginBottom: 14 }}>
          <Link
            href={pageHrefBuilder("exams", 1)}
            className={"chip " + (activeTab === "exams" ? "active" : "")}
          >
            Đề thi · {attempts.total}
          </Link>
          <Link
            href={pageHrefBuilder("topics", 1)}
            className={"chip " + (activeTab === "topics" ? "active" : "")}
          >
            Chuyên đề · {topicSessions.total}
          </Link>
        </div>

        {activeTab === "exams" &&
          (attempts.rows.length === 0 ? (
            <div className="empty">HS chưa nộp đề nào.</div>
          ) : (
            <>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Trường</th>
                    <th>Đề</th>
                    <th>Loại</th>
                    <th>Điểm</th>
                    <th>Đúng / Tổng</th>
                    <th>Thời gian</th>
                    <th>Nộp lúc</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.rows.map((r) => {
                    const s = schoolById.get(r.school);
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className={"pill " + (s?.tone ?? "")}>
                            {s?.short ?? r.school.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <b style={{ fontWeight: 500 }}>{r.examTitle ?? r.examYear}</b>
                          <div className="muted" style={{ fontSize: 11.5 }}>
                            {r.qcount} câu · {r.minutes}p · {r.examYear}
                          </div>
                        </td>
                        <td>
                          <Pill tone={r.kind === "official" ? "solid" : ""}>
                            {r.kind === "official"
                              ? "Chính thức"
                              : r.kind === "reference"
                                ? "Tham khảo"
                                : "Trộn"}
                          </Pill>
                        </td>
                        <td>
                          <Pill tone={pillToneFor(r.score)}>{r.score}%</Pill>
                        </td>
                        <td className="mono">
                          {r.earned}/{r.total}
                        </td>
                        <td className="mono">
                          {Math.round(r.durationSec / 60)}p
                        </td>
                        <td className="muted" style={{ fontSize: 12 }}>
                          {fmtDateTime(r.createdAt)}
                        </td>
                        <td>
                          <Link
                            href={`/exam/${r.examId}/results/${r.id}`}
                            className="btn sm ghost"
                          >
                            Xem chi tiết <Icon name="chevR" size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pager
                page={attempts.page}
                totalPages={attemptTotalPages}
                hrefFor={(p) => pageHrefBuilder("exams", p)}
              />
            </>
          ))}

        {activeTab === "topics" &&
          (topicSessions.rows.length === 0 ? (
            <div className="empty">HS chưa hoàn thành phiên chuyên đề nào.</div>
          ) : (
            <>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Chuyên đề</th>
                    <th>Mức</th>
                    <th>Điểm</th>
                    <th>Đúng / Tổng</th>
                    <th>Khi nào</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {topicSessions.rows.map((r) => {
                    const t = topicById.get(r.topic);
                    return (
                      <tr key={r.id}>
                        <td>
                          <span className="row" style={{ gap: 8, alignItems: "center" }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                background: t?.color ?? "var(--ink-muted)",
                                borderRadius: 2,
                              }}
                            />
                            <b style={{ fontWeight: 500 }}>{t?.name ?? r.topic}</b>
                          </span>
                        </td>
                        <td>
                          <Pill tone={r.level === "NC" ? "red" : ""}>{r.level}</Pill>
                        </td>
                        <td>
                          <Pill tone={pillToneFor(r.score)}>{r.score}%</Pill>
                        </td>
                        <td className="mono">
                          {r.correctCount}/{r.qcount}
                        </td>
                        <td className="muted" style={{ fontSize: 12 }}>
                          {fmtDateTime(r.createdAt)}
                        </td>
                        <td>
                          {r.examId && r.attemptId ? (
                            <Link
                              href={`/exam/${r.examId}/results/${r.attemptId}`}
                              className="btn sm ghost"
                            >
                              Xem chi tiết <Icon name="chevR" size={11} />
                            </Link>
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>
                              Không còn dữ liệu
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pager
                page={topicSessions.page}
                totalPages={topicTotalPages}
                hrefFor={(p) => pageHrefBuilder("topics", p)}
              />
            </>
          ))}
      </Card>
    </div>
  );
}

function Pager({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="row" style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="btn sm ghost">
          <Icon name="chevR" size={11} /> Trước
        </Link>
      ) : (
        <span className="btn sm ghost" style={{ opacity: 0.4, pointerEvents: "none" }}>
          Trước
        </span>
      )}
      <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>
        Trang {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="btn sm ghost">
          Sau <Icon name="chevR" size={11} />
        </Link>
      ) : (
        <span className="btn sm ghost" style={{ opacity: 0.4, pointerEvents: "none" }}>
          Sau
        </span>
      )}
    </div>
  );
}
