"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Card, KindBadge } from "@/components/ui";
import { TopBar } from "@/components/TopBar";

interface ExamRow {
  id: string;
  school: string;
  year: string;
  title: string | null;
  qcount: number;
  minutes: number;
  attempts: number;
  bestScore: number | null;
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
}

interface Props {
  exams: ExamRow[];
  schools: SchoolLite[];
  readiness: Record<string, number>;
  userDone: number;
}

type Kind = "official" | "reference";

// Mirrors the math LibraryView "Đề chính thức" tab so English looks identical.
export function EnglishLibraryView({ exams, schools, readiness, userDone }: Props) {
  const [school, setSchool] = useState("all");
  const [kind, setKind] = useState<Kind>("official");

  const filtered = useMemo(
    () => exams.filter((e) => school === "all" || e.school === school),
    [exams, school],
  );

  const byYear = useMemo(() => {
    const m = new Map<string, ExamRow[]>();
    filtered.forEach((e) => {
      const list = m.get(e.year) ?? [];
      list.push(e);
      m.set(e.year, list);
    });
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const activeSchool = schools.find((s) => s.id === school);

  const kindTabs: { id: Kind; l: string; n: number | null; sub: string; ico: string }[] = [
    { id: "official", l: "Đề chính thức", n: exams.length, sub: "(đã thi thật)", ico: "check" },
    { id: "reference", l: "Đề tham khảo", n: null, sub: "(sắp có)", ico: "sparkle" },
  ];

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Tiếng Anh", href: "/english" }, "Đề thi"]} />

      <div className="content">
        <div className="page-head">
          <div>
            <h2>Đề thi Tiếng Anh</h2>
            <p>
              Con đã làm <b className="mono">{userDone}</b> đề chính thức
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

        {kind === "reference" && (
          <Card>
            <div className="empty">Chưa có đề tham khảo Tiếng Anh. Sẽ bổ sung sau.</div>
          </Card>
        )}

        {kind === "official" && (
          <Fragment>
            <div className="chip-group" style={{ marginBottom: 18 }}>
              <button className={"chip " + (school === "all" ? "active" : "")} onClick={() => setSchool("all")}>
                Tất cả trường · {exams.length}
              </button>
              {schools.map((s) => {
                const count = exams.filter((e) => e.school === s.id).length;
                return (
                  <button
                    key={s.id}
                    className={"chip " + (school === s.id ? "active " + s.tone : "")}
                    onClick={() => setSchool(s.id)}
                  >
                    <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
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
                      <b className="mono" style={{ fontSize: 16 }}>{activeSchool.minutes} phút</b>
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
                <div className="section-title" style={{ margin: "0 0 10px" }}>{year}</div>
                <div className="col" style={{ gap: 8 }}>
                  {list.map((e) => {
                    const s = schools.find((x) => x.id === e.school);
                    return (
                      <Link key={e.id} href={`/exam/${e.id}`} className="exam-row">
                        <div className={"badge " + (s?.tone ?? "")}>{s?.short ?? e.school.toUpperCase()}</div>
                        <div>
                          <div className="row" style={{ gap: 8, alignItems: "center" }}>
                            <span className="title">{e.title ?? `Tiếng Anh ${s?.name ?? e.school} · ${e.year}`}</span>
                            <KindBadge kind="official" compact />
                          </div>
                          <div className="meta">
                            {e.qcount} câu · {e.minutes} phút ·
                            {e.attempts > 0 ? (
                              <Fragment>
                                <b className="mono"> {e.attempts}</b> lần làm · cao nhất{" "}
                                <b className="mono" style={{ color: (e.bestScore ?? 0) >= 70 ? "var(--success)" : "var(--ink)" }}>
                                  {e.bestScore ?? 0}%
                                </b>
                              </Fragment>
                            ) : (
                              <span className="muted"> chưa làm</span>
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
              </div>
            ))}

            {byYear.length === 0 && <div className="empty">Chưa có đề nào trong nhóm này.</div>}
          </Fragment>
        )}
      </div>
    </div>
  );
}
