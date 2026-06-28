"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Bar, Card, KindBadge } from "@/components/ui";
import { TopBar } from "@/components/TopBar";
import type { ExamHistoryItem } from "@/lib/user-data";

interface ExamRow {
  id: string;
  school: string;
  kind: "official" | "reference" | "mixed";
  year: string;
  qcount: number;
  minutes: number;
  basedOn: string | null;
  note: string | null;
  mixRatio: string | null;
  attempts: number;
  bestScore: number | null;
  addedAt?: string; // only for claimedExams
}

interface SchoolLite {
  id: string;
  short: string;
  name: string;
  full: string;
  color: string;
  tone: string;
  minutes: number;
  style: string;
  desc: string;
}

interface Props {
  exams: ExamRow[];
  schools: SchoolLite[];
  mixSchool: SchoolLite;
  readiness: Record<string, number>;
  referenceHistory: ExamHistoryItem[];
  userDoneOfficial: number;
  userDoneReference: number;
  initialSchool: string;
  initialKind: string;
  // Quota props
  userPlan: string;
  planLimit: number;
  claimedExams: ExamRow[];
}

type Kind = "official" | "reference";


export function LibraryView({
  exams,
  schools,
  mixSchool,
  readiness,
  referenceHistory,
  userDoneOfficial,
  userDoneReference,
  initialSchool,
  initialKind,
  userPlan,
  planLimit,
  claimedExams: initialClaimedExams,
}: Props) {
  const [school, setSchool] = useState(initialSchool);
  const [kind, setKind] = useState<Kind>(initialKind === "reference" ? "reference" : "official");

  const officialExams = useMemo(() => exams.filter((e) => e.kind === "official"), [exams]);
  const filteredOfficial = useMemo(
    () => officialExams.filter((e) => school === "all" || e.school === school),
    [officialExams, school],
  );

  const byYear = useMemo(() => {
    const m = new Map<string, ExamRow[]>();
    filteredOfficial.forEach((e) => {
      const list = m.get(e.year) ?? [];
      list.push(e);
      m.set(e.year, list);
    });
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredOfficial]);

  const officialCount = officialExams.length;
  const activeSchool = schools.find((s) => s.id === school);

  const kindTabs: { id: Kind; l: string; n: number | null; sub: string; ico: string }[] = [
    { id: "official", l: "Đề chính thức", n: officialCount, sub: "(đã thi thật)", ico: "check" },
    { id: "reference", l: "Đề tham khảo", n: null, sub: "(admin tạo · theo gói)", ico: "sparkle" },
  ];

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Trang chính", href: "/home" }, "Đề thi"]} />

      <div className="content">
        <div className="page-head">
          <div>
            <h2>Đề thi</h2>
            <p>
              Con đã làm <b className="mono">{userDoneOfficial}</b> đề chính thức ·{" "}
              <b className="mono">{userDoneReference}</b> đề tham khảo
            </p>
          </div>
        </div>

        {/* Kind switcher */}
        <div
          className="row"
          style={{
            gap: 0,
            marginBottom: 18,
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 3,
            background: "var(--surface-2)",
            width: "fit-content",
          }}
        >
          {kindTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setKind(t.id)}
              style={{
                padding: "8px 16px",
                border: 0,
                background: kind === t.id ? "var(--surface)" : "transparent",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13.5,
                fontWeight: kind === t.id ? 600 : 500,
                color: kind === t.id ? "var(--ink)" : "var(--ink-muted)",
                boxShadow: kind === t.id ? "var(--shadow-1)" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.15s",
              }}
            >
              <Icon name={t.ico === "check" ? "check" : "sparkle"} size={13} stroke={2.5} />
              {t.l}
              {t.n !== null && (
                <span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>
                  · {t.n}
                </span>
              )}
              <span className="muted" style={{ fontSize: 11, fontWeight: 400, marginLeft: -2 }}>
                {t.sub}
              </span>
            </button>
          ))}
        </div>

        {kind === "official" && (
          <OfficialTab
            schools={schools}
            mixSchool={mixSchool}
            school={school}
            setSchool={setSchool}
            officialExams={officialExams}
            filteredOfficial={filteredOfficial}
            byYear={byYear}
            activeSchool={activeSchool}
            readiness={readiness}
          />
        )}

        {kind === "reference" && (
          <ReferenceTab
            schools={schools}
            mixSchool={mixSchool}
            referenceHistory={referenceHistory}
            userPlan={userPlan}
            planLimit={planLimit}
            initialClaimedExams={initialClaimedExams}
          />
        )}
      </div>
    </div>
  );
}

// ─── Official tab ───────────────────────────────────────────────────────────

interface OfficialTabProps {
  schools: SchoolLite[];
  mixSchool: SchoolLite;
  school: string;
  setSchool: (s: string) => void;
  officialExams: ExamRow[];
  filteredOfficial: ExamRow[];
  byYear: [string, ExamRow[]][];
  activeSchool: SchoolLite | undefined;
  readiness: Record<string, number>;
}

function OfficialTab({
  schools,
  mixSchool,
  school,
  setSchool,
  officialExams,
  filteredOfficial,
  byYear,
  activeSchool,
  readiness,
}: OfficialTabProps) {
  return (
    <Fragment>
      <div className="chip-group" style={{ marginBottom: 18 }}>
        <button
          className={"chip " + (school === "all" ? "active" : "")}
          onClick={() => setSchool("all")}
        >
          Tất cả trường · {officialExams.length}
        </button>
        {schools.map((s) => {
          const count = officialExams.filter((e) => e.school === s.id).length;
          return (
            <button
              key={s.id}
              className={"chip " + (school === s.id ? "active " + s.tone : "")}
              onClick={() => setSchool(s.id)}
            >
              <span
                className="dot"
                style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }}
              />
              {s.short} · {count}
            </button>
          );
        })}
      </div>

      {school !== "all" && activeSchool && (
        <Card style={{ marginBottom: 20, background: "var(--surface-2)" }}>
          <div className="row" style={{ gap: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: activeSchool.color,
                color: "white",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
              }}
            >
              {activeSchool.short}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>{activeSchool.full}</h3>
              <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
                {activeSchool.style}
              </p>
            </div>
            <div className="row" style={{ gap: 24 }}>
              <div style={{ textAlign: "right" }}>
                <div className="eyebrow">Thời lượng</div>
                <b className="mono" style={{ fontSize: 16 }}>
                  {activeSchool.minutes} phút
                </b>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="eyebrow">% sẵn sàng</div>
                <b className="mono" style={{ fontSize: 16, color: "var(--accent-ink)" }}>
                  {readiness[activeSchool.id] ?? 0}%
                </b>
              </div>
            </div>
          </div>
        </Card>
      )}

      {byYear.map(([year, list]) => (
        <div key={year} style={{ marginBottom: 22 }}>
          <div className="section-title" style={{ margin: "0 0 10px" }}>
            {year}
          </div>
          <div className="col" style={{ gap: 8 }}>
            {list.map((e) => {
              const s = schools.find((x) => x.id === e.school) ?? mixSchool;
              return (
                <Link key={e.id} href={`/exam/${e.id}`} className="exam-row">
                  <div className={"badge " + s.tone}>{s.short}</div>
                  <div>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <span className="title">
                        Đề thi {s.name} · {e.year}
                      </span>
                      <KindBadge kind="official" compact />
                    </div>
                    <div className="meta">
                      {e.qcount} câu · {e.minutes} phút ·
                      {e.attempts > 0 ? (
                        <Fragment>
                          <b className="mono"> {e.attempts}</b> lần làm · cao nhất{" "}
                          <b
                            className="mono"
                            style={{
                              color: (e.bestScore ?? 0) >= 70 ? "var(--success)" : "var(--ink)",
                            }}
                          >
                            {e.bestScore ?? 0}%
                          </b>
                        </Fragment>
                      ) : (
                        <span className="muted"> chưa làm</span>
                      )}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="eyebrow" style={{ fontSize: 10 }}>
                      Câu
                    </div>
                    <b className="mono">{e.qcount}</b>
                  </div>
                  <div className="stat">
                    <div className="eyebrow" style={{ fontSize: 10 }}>
                      Thời lượng
                    </div>
                    <b className="mono">{e.minutes}p</b>
                  </div>
                  <button className="btn primary sm">
                    {e.attempts > 0 ? "Làm lại" : "Bắt đầu"} <Icon name="chevR" size={11} />
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {byYear.length === 0 && <div className="empty">Chưa có đề nào trong nhóm này.</div>}
    </Fragment>
  );
}

// ─── Reference tab ──────────────────────────────────────────────────────────

interface ReferenceTabProps {
  schools: SchoolLite[];
  mixSchool: SchoolLite;
  referenceHistory: ExamHistoryItem[];
  userPlan: string;
  planLimit: number;
  initialClaimedExams: ExamRow[];
}

const PLAN_DISPLAY: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "var(--ink-muted)" },
  pro: { label: "Pro", color: "var(--ltv)" },
  vip: { label: "VIP", color: "var(--accent-ink)" },
};

function ReferenceTab({
  schools,
  mixSchool,
  referenceHistory,
  userPlan,
  planLimit,
  initialClaimedExams,
}: ReferenceTabProps) {
  const router = useRouter();
  const [claimedExams, setClaimedExams] = useState<ExamRow[]>(initialClaimedExams);
  const [isPending, startTransition] = useTransition();
  const [claimError, setClaimError] = useState<string | null>(null);

  const styleSchools: SchoolLite[] = [...schools, mixSchool];
  const claimedCount = claimedExams.length;
  const isVip = planLimit === Infinity;
  const atLimit = !isVip && claimedCount >= planLimit;
  const planInfo = PLAN_DISPLAY[userPlan] ?? PLAN_DISPLAY.free;

  function handleClaim() {
    setClaimError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/reference-exams/claim", { method: "POST" });
        const data = await res.json();
        if (data.success && data.exam) {
          setClaimedExams((prev) => [...prev, { ...data.exam, attempts: 0, bestScore: null }]);
        } else if (data.error === "limit_reached") {
          setClaimError("Bạn đã đạt giới hạn đề tham khảo của gói " + planInfo.label + ".");
        } else if (data.error === "no_more_exams") {
          setClaimError("Ngân hàng đề tham khảo đã hết. Admin sẽ bổ sung thêm sớm!");
        } else {
          setClaimError("Có lỗi xảy ra, vui lòng thử lại.");
        }
      } catch {
        setClaimError("Không thể kết nối. Vui lòng thử lại.");
      }
    });
  }

  return (
    <Fragment>
      {/* Info banner */}
      <div
        style={{
          padding: 14,
          marginBottom: 20,
          background: "var(--warn-soft)",
          borderRadius: 10,
          border: "1px solid oklch(0.92 0.06 80)",
          fontSize: 12.5,
          color: "oklch(0.4 0.1 70)",
        }}
      >
        <b>
          <Icon name="sparkle" size={12} /> Đề tham khảo:
        </b>{" "}
        Do admin tạo và phát hành. Con nhận từng đề một vào danh sách cá nhân để luyện tập.
        Không phải đề thật của trường — không tính vào % sẵn sàng.
      </div>

      {/* ── Ngân hàng đề của tôi ── */}
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="section-title" style={{ margin: 0 }}>
          Ngân hàng đề của tôi
        </div>
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          {/* Quota badge */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: planInfo.color,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "2px 10px",
            }}
          >
            Gói {planInfo.label} ·{" "}
            {isVip ? (
              <>
                {claimedCount} đề <span style={{ opacity: 0.6 }}>(không giới hạn)</span>
              </>
            ) : (
              <>
                {claimedCount}/{planLimit} đề
              </>
            )}
          </span>

          {/* Claim button */}
          <button
            className="btn primary sm"
            onClick={handleClaim}
            disabled={isPending || atLimit}
            style={{ opacity: isPending || atLimit ? 0.5 : 1 }}
          >
            <Icon name="plus" size={12} />
            {isPending ? "Đang lấy…" : "+ Lấy đề mới"}
          </button>
        </div>
      </div>

      {/* Error message */}
      {claimError && (
        <div
          style={{
            padding: "10px 14px",
            marginBottom: 14,
            background: "var(--error-soft, oklch(0.97 0.02 20))",
            border: "1px solid oklch(0.88 0.06 20)",
            borderRadius: 8,
            fontSize: 13,
            color: "oklch(0.42 0.12 20)",
          }}
        >
          {claimError}
          {atLimit && (
            <span style={{ marginLeft: 8 }}>
              <a href="#" style={{ color: "var(--accent-ink)", fontWeight: 600 }}>
                Nâng cấp gói →
              </a>
            </span>
          )}
        </div>
      )}

      {/* Claimed exams list */}
      {claimedExams.length === 0 ? (
        <Card style={{ marginBottom: 28 }}>
          <div className="empty">
            Chưa có đề nào trong ngân hàng của con.
            <br />
            Bấm <b>&ldquo;+ Lấy đề mới&rdquo;</b> để nhận đề đầu tiên từ admin.
          </div>
        </Card>
      ) : (
        <div className="col" style={{ gap: 8, marginBottom: 28 }}>
          {claimedExams.map((e) => {
            const s = schools.find((x) => x.id === e.school) ?? mixSchool;
            return (
              <Link key={e.id} href={`/exam/${e.id}`} className="exam-row">
                <div className={"badge " + s.tone}>{s.short}</div>
                <div>
                  <div className="row" style={{ gap: 8, alignItems: "center" }}>
                    <span className="title">{e.note ?? `Đề tham khảo ${s.name} · ${e.year}`}</span>
                    <KindBadge kind="reference" compact />
                  </div>
                  <div className="meta">
                    {e.qcount} câu · {e.minutes} phút
                    {e.attempts > 0 ? (
                      <Fragment>
                        · <b className="mono">{e.attempts}</b> lần làm · cao nhất{" "}
                        <b
                          className="mono"
                          style={{ color: (e.bestScore ?? 0) >= 70 ? "var(--success)" : "var(--ink)" }}
                        >
                          {e.bestScore ?? 0}%
                        </b>
                      </Fragment>
                    ) : (
                      <span className="muted"> · chưa làm</span>
                    )}
                  </div>
                </div>
                <div className="stat">
                  <div className="eyebrow" style={{ fontSize: 10 }}>Câu</div>
                  <b className="mono">{e.qcount}</b>
                </div>
                <div className="stat">
                  <div className="eyebrow" style={{ fontSize: 10 }}>Thời lượng</div>
                  <b className="mono">{e.minutes}p</b>
                </div>
                <button className="btn primary sm">
                  {e.attempts > 0 ? "Làm lại" : "Bắt đầu"} <Icon name="chevR" size={11} />
                </button>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Phỏng tạo ngẫu nhiên (giữ nguyên) ── */}
      <div className="section-title" style={{ margin: "0 0 12px" }}>
        Phỏng đề theo phong cách trường
      </div>
      <div
        style={{
          padding: "10px 14px",
          marginBottom: 14,
          background: "var(--surface-2)",
          borderRadius: 8,
          fontSize: 12,
          color: "var(--ink-muted)",
        }}
      >
        <Icon name="sparkle" size={11} /> Câu hỏi ngẫu nhiên từ ngân hàng mỗi lần bấm — không giới hạn.
      </div>
      <div className="grid cols-2" style={{ gap: 10, marginBottom: 28 }}>
        {styleSchools.map((s) => {
          const estQ = Math.round(s.minutes / 4.5);
          return (
            <button
              key={s.id}
              onClick={() => {
                const rand = Math.random().toString(36).slice(-4);
                router.push(`/exam/ref-${s.id}-${rand}`);
              }}
              className="topic-card"
              style={{ padding: 18, width: "100%", textAlign: "left", border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface)", borderRadius: 10 }}
            >
              <div className="row between" style={{ marginBottom: 6 }}>
                <div className="row" style={{ gap: 10 }}>
                  <div
                    className="badge"
                    style={{
                      background: s.color,
                      color: "white",
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {s.short}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Phỏng đề {s.name}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      {s.desc || s.style}
                    </div>
                  </div>
                </div>
                <Icon name="arrow" />
              </div>
              <div
                className="row between"
                style={{ fontSize: 11.5, color: "var(--ink-muted)" }}
              >
                <span>
                  ~{estQ} câu · {s.minutes} phút
                </span>
                <span className="row" style={{ gap: 4 }}>
                  <Icon name="sparkle" size={11} /> Câu mới mỗi lần
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── History ── */}
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="section-title" style={{ margin: 0 }}>
          Đề tham khảo con đã làm
        </div>
        {referenceHistory.length > 0 && (
          <span className="muted" style={{ fontSize: 12 }}>
            {referenceHistory.length} đề
          </span>
        )}
      </div>

      {referenceHistory.length === 0 ? (
        <Card>
          <div className="empty">
            Con chưa làm đề tham khảo nào.
            <br />
            Bấm một phong cách ở trên hoặc lấy đề từ ngân hàng để bắt đầu.
          </div>
        </Card>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {referenceHistory.map((h) => {
            const s = schools.find((x) => x.id === h.school) ?? mixSchool;
            const label = h.style ?? `Phỏng đề ${s.name}`;
            const tone = h.score >= 70 ? "" : h.score >= 50 ? "ltv" : "ntt";
            return (
              <Link key={h.id} href={`/exam/${h.examId}`} className="exam-row">
                <div
                  className={"badge " + s.tone}
                  style={s.id === "mix" ? { background: "var(--accent)" } : undefined}
                >
                  {s.short}
                </div>
                <div>
                  <div className="row" style={{ gap: 8, alignItems: "center" }}>
                    <span className="title">{label}</span>
                    <KindBadge kind="reference" compact />
                  </div>
                  <div className="meta">Làm xong {h.when_full}</div>
                </div>
                <div className="stat" style={{ minWidth: 90 }}>
                  <Bar value={h.score} tone={tone} />
                </div>
                <div className="stat">
                  <b
                    className="mono"
                    style={{
                      fontSize: 14,
                      color: h.score >= 70 ? "var(--success)" : "var(--ink)",
                    }}
                  >
                    {h.score}%
                  </b>
                </div>
                <button className="btn sm ghost">
                  Xem giải <Icon name="chevR" size={11} />
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </Fragment>
  );
}
