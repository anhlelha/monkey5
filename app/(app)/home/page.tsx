import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser, firstName, getExamHistory } from "@/lib/user-data";
import { SCHOOLS, DEFAULT_TOPICS } from "@/lib/static";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Pill } from "@/components/ui";
import { Radar } from "@/components/Radar";
import { daysBetween, greeting } from "@/lib/fmt";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);

  const topics = (await prisma.topic.findMany({ orderBy: { position: "asc" } })) ?? [];
  const TOPICS = topics.length > 0 ? topics : DEFAULT_TOPICS;
  const recent = (await getExamHistory(user.id)).slice(0, 5);

  const daysToExam = user.examDate ? daysBetween(user.examDate) : 96;
  const greet = greeting();
  const fn = firstName(user.name);

  const radarData = TOPICS.map((t) => ({
    label: t.short,
    value: user.topicMastery[t.id] ?? 0,
  }));

  const weakestEntry = Object.entries(user.topicMastery).sort((a, b) => a[1] - b[1])[0] ?? ["soh", 0.5];
  const weakest = TOPICS.find((t) => t.id === weakestEntry[0]) ?? TOPICS[0];

  return (
    <div className="main">
      <TopBar
        crumbs={["Trang chính"]}
        actions={
          <>
            <button className="btn">
              <Icon name="search" /> Tìm đề / chuyên đề
              <span className="mono muted" style={{ fontSize: 11, marginLeft: 8 }}>⌘K</span>
            </button>
          </>
        }
      />

      <div className="content">
        <div className="page-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {greet} · Còn <b className="mono" style={{ color: "var(--accent-ink)" }}>{daysToExam} ngày</b> đến kỳ thi mục tiêu
            </div>
            <h2>{greet}, {fn} 👋</h2>
            <p>
              Hôm nay Khỉ con đề xuất con luyện{" "}
              <b style={{ color: "var(--ink)" }}>{weakest.name}</b> — chuyên đề con đang yếu nhất.
            </p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Link href="/library" className="btn">
              <Icon name="library" /> Xem đề mẫu
            </Link>
            <Link href="/library" className="btn primary">
              <Icon name="bolt" /> Bắt đầu luyện đề
            </Link>
          </div>
        </div>

        {/* School readiness */}
        <div className="row between" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>
            Mức độ sẵn sàng theo trường mục tiêu
          </h3>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {recent.length > 0
              ? `Cập nhật hôm nay · dựa trên ${recent.length} hoạt động gần nhất`
              : "Chưa có hoạt động nào — hãy bắt đầu luyện đề đầu tiên"}
          </span>
        </div>

        <div className="grid cols-4">
          {SCHOOLS.map((s) => {
            const isTarget = user.targets.includes(s.id);
            const r = user.readiness[s.id] ?? 0;
            const tone = r >= 75 ? "green" : r >= 60 ? "amber" : "red";
            const status = r >= 75 ? "Sẵn sàng" : r >= 60 ? "Đang tiến triển" : "Cần luyện thêm";
            return (
              <Link
                key={s.id}
                href={`/library?school=${s.id}`}
                className={"school-card " + s.tone}
                style={{ opacity: isTarget ? 1 : 0.7 }}
              >
                <div className="row between">
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10 }}>{s.short}</div>
                    <div className="name">{s.name}</div>
                  </div>
                  {isTarget && (
                    <Pill tone={s.tone}><span className="dot" />Mục tiêu</Pill>
                  )}
                </div>
                <div className="pct">
                  <span className="num">{r}</span>
                  <span className="sym">%</span>
                </div>
                <Bar value={r} tone={s.tone} tall />
                <div className="row between">
                  <Pill tone={tone}>{status}</Pill>
                  <span className="muted" style={{ fontSize: 11.5 }}>{s.minutes} phút</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Topic mastery + activity */}
        <div className="grid cols-2" style={{ marginTop: 24 }}>
          <Card
            title="Năng lực theo 10 chuyên đề"
            sub="So sánh với mức yêu cầu trung bình của 4 trường"
            action={
              <Link href="/topics" className="btn sm ghost">
                Luyện chuyên đề <Icon name="chevR" size={12} />
              </Link>
            }
          >
            <div className="radar-wrap">
              <Radar data={radarData} size={340} max={1} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8, fontSize: 12 }}>
              <div className="row" style={{ gap: 6 }}>
                <span style={{ width: 12, height: 12, background: "var(--accent)", opacity: 0.3, border: "1.5px solid var(--accent)", borderRadius: 2 }} />
                <span className="muted">Năng lực hiện tại</span>
              </div>
              <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                <span className="muted">Cập nhật sau mỗi bài</span>
              </div>
            </div>
          </Card>

          <Card
            title="Tiến độ 14 ngày qua"
            sub={`Streak hiện tại: ${user.streak} ngày liên tiếp`}
            action={
              <span className="row" style={{ gap: 6 }}>
                <Icon name="fire" size={14} stroke={1.8} />
                <b className="mono" style={{ fontSize: 14 }}>{user.streak}</b>
              </span>
            }
          >
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120, padding: "8px 0" }}>
              {user.activity.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div
                    style={{
                      width: "100%",
                      height: v == null ? 2 : Math.max(3, (v / 100) * 100) + "px",
                      background:
                        v == null ? "var(--border)" :
                        v >= 70 ? "var(--success)" :
                        v >= 60 ? "var(--accent)" : "var(--warn)",
                      borderRadius: 3,
                      opacity: v == null ? 0.5 : 1,
                    }}
                  />
                  <span style={{ fontSize: 9, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>
                    {14 - i}
                  </span>
                </div>
              ))}
            </div>
            <div className="hr" />
            <div className="grid cols-3" style={{ gap: 12, fontSize: 12 }}>
              <div>
                <div className="muted">Bài đã làm</div>
                <div className="kpi" style={{ fontSize: 22, marginTop: 2 }}>23</div>
              </div>
              <div>
                <div className="muted">Câu đã trả lời</div>
                <div className="kpi" style={{ fontSize: 22, marginTop: 2 }}>184</div>
              </div>
              <div>
                <div className="muted">Tỉ lệ đúng TB</div>
                <div className="kpi" style={{ fontSize: 22, marginTop: 2, color: "var(--success)" }}>68<small>%</small></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent + recommended */}
        <div className="grid cols-2" style={{ marginTop: 16, gridTemplateColumns: "2fr 1fr" }}>
          <Card
            title="Hoạt động gần đây"
            sub="Bấm để xem lại bài làm và lời giải"
            action={<button className="btn sm ghost">Xem tất cả <Icon name="chevR" size={12} /></button>}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recent.length === 0 ? (
                <div
                  className="muted"
                  style={{ padding: "24px 0", textAlign: "center", fontSize: 13 }}
                >
                  Chưa có bài làm nào. Vào{" "}
                  <Link href="/library" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                    Thư viện đề
                  </Link>{" "}
                  để bắt đầu.
                </div>
              ) : (
                recent.map((r, i) => {
                  const school = SCHOOLS.find((s) => s.id === r.school);
                  const p = r.score;
                  return (
                    <Link
                      key={r.id}
                      href={`/exam/${r.examId}/results/${r.id}`}
                      className="row"
                      style={{
                        padding: "12px 0",
                        borderBottom: i < recent.length - 1 ? "1px solid var(--border-soft)" : "0",
                        gap: 14,
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: school ? `var(--${r.school}-soft)` : "var(--surface-sunk)",
                          color: school ? school.color : "var(--ink-soft)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {school ? school.short : "·"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5 }}>
                          {school ? `Đề ${school.name}` : "Đề"} · {r.year}
                        </div>
                        <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                          {r.when}
                        </div>
                      </div>
                      <div style={{ minWidth: 90 }}>
                        <Bar value={p} tone={p >= 70 ? "" : p >= 50 ? "ltv" : "ntt"} />
                      </div>
                      <div style={{ minWidth: 60, textAlign: "right" }}>
                        <span
                          className="mono"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color:
                              p >= 70 ? "var(--success)" : p >= 50 ? "var(--ink)" : "var(--danger)",
                          }}
                        >
                          {p}%
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </Card>

          <div className="col" style={{ gap: 16 }}>
            <Card>
              <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `color-mix(in oklch, ${weakest.color}, white 80%)`,
                    color: weakest.color,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                  }}
                >
                  {weakest.ico}
                </div>
                <Pill tone="red">Yếu nhất</Pill>
              </div>
              <h3 style={{ margin: 0, fontSize: 16, letterSpacing: "-0.01em" }}>{weakest.name}</h3>
              <p className="muted" style={{ fontSize: 12.5, margin: "4px 0 12px" }}>
                Mức {Math.round(weakestEntry[1] * 100)}% — thấp hơn TB mục tiêu 25%
              </p>
              <Bar value={weakestEntry[1] * 100} tone="ntt" tall />
              <Link
                href={`/topics/${weakest.id}`}
                className="btn primary"
                style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
              >
                <Icon name="bolt" /> Bắt đầu luyện ngay
              </Link>
            </Card>

            <Card title="Lộ trình tuần này" sub="3 / 5 nhiệm vụ hoàn thành">
              <Bar value={60} tall />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { done: true, txt: "1 đề Cầu Giấy đầy đủ" },
                  { done: true, txt: "20 bài Phân số" },
                  { done: true, txt: "1 đề Thanh Xuân" },
                  { done: false, txt: "20 bài Chuyển động" },
                  { done: false, txt: "1 đề NTT (60 phút)" },
                ].map((t, i) => (
                  <div key={i} className="row" style={{ gap: 10, fontSize: 13 }}>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: "1.5px solid " + (t.done ? "var(--success)" : "var(--border-strong)"),
                        background: t.done ? "var(--success)" : "transparent",
                        display: "grid",
                        placeItems: "center",
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {t.done && <Icon name="check" size={11} stroke={3} />}
                    </div>
                    <span style={{ color: t.done ? "var(--ink-muted)" : "var(--ink)", textDecoration: t.done ? "line-through" : "none" }}>
                      {t.txt}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Topic mastery table */}
        <Card
          title="Chi tiết theo chuyên đề"
          sub="Mức yêu cầu trung bình ≈ 70% cho top 4 trường"
          action={
            <Link href="/topics" className="btn sm ghost">
              Mở thư viện bài tập <Icon name="chevR" size={12} />
            </Link>
          }
          style={{ marginTop: 24 }}
        >
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Chuyên đề</th>
                <th style={{ width: 80 }}>Đã làm</th>
                <th style={{ width: 140 }}>Mức thành thạo</th>
                <th style={{ width: 80, textAlign: "right" }}>%</th>
                <th style={{ width: 110 }}>Khoảng cách</th>
                <th style={{ width: 100, textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {TOPICS.map((t) => {
                const v = user.topicMastery[t.id] ?? 0;
                const pct = Math.round(v * 100);
                const gap = 70 - pct;
                return (
                  <tr key={t.id}>
                    <td>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: `color-mix(in oklch, ${t.color}, white 86%)`,
                          color: t.color,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {t.ico}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {12 + Math.round(v * 28)} câu đã chấm
                      </div>
                    </td>
                    <td className="mono muted">{Math.round(v * 30) + 6}</td>
                    <td>
                      <Bar value={pct} tone={pct >= 70 ? "" : pct >= 55 ? "ltv" : "ntt"} />
                    </td>
                    <td style={{ textAlign: "right" }} className="mono">
                      <b style={{ fontSize: 14, color: pct >= 70 ? "var(--success)" : "var(--ink)" }}>{pct}%</b>
                    </td>
                    <td>
                      {gap > 0 ? <Pill tone="amber">cần +{gap}%</Pill> : <Pill tone="green">đạt mục tiêu</Pill>}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/topics/${t.id}`} className="btn sm">
                        Luyện <Icon name="chevR" size={11} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
