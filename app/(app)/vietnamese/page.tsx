import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser, firstName, getActivityStats } from "@/lib/user-data";
import { SCHOOLS } from "@/lib/static";
import { computeMastery, BASELINE_MASTERY } from "@/lib/mastery";
import { getAllSchoolProfiles, getSchoolProfile } from "@/lib/school-profiles";
import { computeAllReadiness, computeGapTop3 } from "@/lib/readiness";
import { VIETNAMESE_TOPICS, vietnameseTopicById } from "@/lib/subjects";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Pill } from "@/components/ui";
import { Radar } from "@/components/Radar";
import { daysBetween, greeting } from "@/lib/fmt";

export default async function VietnameseHome() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);

  const [mastery, profiles, activity, vnAttempts] = await Promise.all([
    computeMastery(user.id, "vietnamese"),
    getAllSchoolProfiles("vietnamese"),
    getActivityStats(user.id),
    prisma.attempt.findMany({
      where: { userId: user.id, submitted: true, exam: { subject: "vietnamese" } },
      include: { exam: { select: { school: true, year: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const readiness = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);
  const recent = vnAttempts;

  // Schools that have vietnamese content → readiness cards (mirrors math 4-school grid).
  const SCHOOLS_VN = SCHOOLS.filter((s) => profiles[s.id]);

  const daysToExam = user.examDate ? daysBetween(user.examDate) : null;
  const greet = greeting();
  const fn = firstName(user.name);

  // Weakest practiced topic (fall back to first topic at baseline).
  const practiced = Object.entries(mastery.topicMastery).filter(
    ([id, v]) => Number.isFinite(v) && (mastery.topicSampleSize[id] ?? 0) > 0,
  );
  const weakestEntry = practiced.sort((a, b) => a[1] - b[1])[0] ?? [VIETNAMESE_TOPICS[0].id, BASELINE_MASTERY];
  const weakest = vietnameseTopicById(weakestEntry[0]) ?? VIETNAMESE_TOPICS[0];

  // Gap advice toward the primary target school (if it has a vietnamese profile).
  const primaryTargetId = user.targets[0] ?? null;
  let gapAdvice: {
    school: { full: string; tone: string; r: number };
    items: { topicId: string; topicName: string; currentMastery: number; gain: number }[];
  } | null = null;
  if (primaryTargetId && profiles[primaryTargetId]) {
    const profile = await getSchoolProfile(primaryTargetId, "vietnamese");
    const targetSchool = SCHOOLS.find((s) => s.id === primaryTargetId);
    if (profile && targetSchool) {
      const items = computeGapTop3(mastery.topicMastery, profile, 0.7, 3).map((g) => ({
        topicId: g.topicId,
        topicName: vietnameseTopicById(g.topicId)?.name ?? g.topicId,
        currentMastery: g.currentMastery,
        gain: g.potentialReadinessGain,
      }));
      gapAdvice = { school: { full: targetSchool.full, tone: targetSchool.tone, r: readiness[targetSchool.id] ?? 50 }, items };
    }
  }

  const radarData = VIETNAMESE_TOPICS.map((t) => ({ label: t.short, value: mastery.topicMastery[t.id] ?? BASELINE_MASTERY }));
  const fmtDate = (d: Date) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(d);

  return (
    <div className="main">
      <TopBar />

      <div className="content">
        <div className="page-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {greet}
              {daysToExam !== null && (
                <>
                  {" "}· Còn{" "}
                  <b className="mono" style={{ color: "var(--accent-ink)" }}>{daysToExam} ngày</b> đến kỳ thi mục tiêu
                </>
              )}
            </div>
            <h2>{greet}, {fn} 👋</h2>
            <p>
              Hôm nay Khỉ con đề xuất con luyện <b style={{ color: "var(--ink)" }}>{weakest.name}</b> — kỹ năng con đang yếu nhất.
            </p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Link href="/vietnamese/library" className="btn">
              <Icon name="library" /> Xem đề mẫu
            </Link>
            <Link href="/vietnamese/topics" className="btn primary">
              <Icon name="bolt" /> Luyện chuyên đề
            </Link>
          </div>
        </div>

        {/* School readiness */}
        <div className="row between" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>Mức độ sẵn sàng theo trường mục tiêu</h3>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {recent.length > 0 ? `Cập nhật theo ${recent.length} hoạt động gần nhất` : "Chưa có hoạt động — hãy làm đề đầu tiên"}
          </span>
        </div>

        {SCHOOLS_VN.length > 0 && (() => {
          const top = SCHOOLS_VN.map((s) => ({ ...s, r: readiness[s.id] ?? 50 })).sort((a, b) => b.r - a.r)[0];
          return top ? (
            <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
              💡 Hiện con phù hợp nhất với <b style={{ color: "var(--ink)" }}>{top.full}</b> ({top.r}%)
            </div>
          ) : null;
        })()}

        <div className="grid cols-4">
          {SCHOOLS_VN.map((s) => {
            const isTarget = user.targets.includes(s.id);
            const r = readiness[s.id] ?? 50;
            const tone = r >= 75 ? "green" : r >= 60 ? "amber" : "red";
            const status = r >= 75 ? "Sẵn sàng" : r >= 60 ? "Đang tiến triển" : "Cần luyện thêm";
            return (
              <Link key={s.id} href="/vietnamese/library" className={"school-card " + s.tone}>
                <div className="row between">
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10 }}>{s.short}</div>
                    <div className="name">{s.name}</div>
                  </div>
                  {isTarget && <Pill tone={s.tone}><span className="dot" />Mục tiêu</Pill>}
                </div>
                <div className="pct"><span className="num">{r}</span><span className="sym">%</span></div>
                <Bar value={r} tone={s.tone} tall />
                <div className="row between">
                  <Pill tone={tone}>{status}</Pill>
                  <span className="muted" style={{ fontSize: 11.5 }}>{s.minutes} phút</span>
                </div>
              </Link>
            );
          })}
        </div>

        {gapAdvice && gapAdvice.items.length > 0 && (
          <Card
            title={`🎯 Để đạt mục tiêu ${gapAdvice.school.full}`}
            sub={`Hiện ${gapAdvice.school.r}% — luyện thêm các chuyên đề sau để tăng:`}
            style={{ marginTop: 24 }}
          >
            <div className="col" style={{ gap: 12 }}>
              {gapAdvice.items.map((g, i) => (
                <div key={g.topicId} className="row" style={{ gap: 12, alignItems: "center" }}>
                  <span className="mono muted" style={{ width: 18, fontSize: 13 }}>{i + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <b style={{ fontSize: 13.5 }}>{g.topicName}</b>
                      <span className="mono" style={{ fontSize: 12.5 }}>
                        {Math.round(g.currentMastery * 100)}% → 70%
                        <Pill tone="green" style={{ marginLeft: 8 }}>+{g.gain}%</Pill>
                      </span>
                    </div>
                    <Bar value={g.currentMastery * 100} tone={gapAdvice!.school.tone} />
                  </div>
                  <Link href={`/vietnamese/practice?topic=${g.topicId}`} className="btn sm">Luyện</Link>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Topic mastery radar + activity */}
        <div className="grid cols-2" style={{ marginTop: 24 }}>
          <Card
            title="Năng lực theo 10 chuyên đề"
            sub="So với mức yêu cầu của trường mục tiêu"
            action={<Link href="/vietnamese/topics" className="btn sm ghost">Luyện chuyên đề <Icon name="chevR" size={12} /></Link>}
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
            action={<span className="row" style={{ gap: 6 }}><Icon name="fire" size={14} stroke={1.8} /><b className="mono" style={{ fontSize: 14 }}>{user.streak}</b></span>}
          >
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120, padding: "8px 0" }}>
              {user.activity.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", height: v == null ? 2 : Math.max(3, (v / 100) * 100) + "px", background: v == null ? "var(--border)" : v >= 70 ? "var(--success)" : v >= 60 ? "var(--accent)" : "var(--warn)", borderRadius: 3, opacity: v == null ? 0.5 : 1 }} />
                  <span style={{ fontSize: 9, color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>{14 - i}</span>
                </div>
              ))}
            </div>
            <div className="hr" />
            <div className="grid cols-3" style={{ gap: 12, fontSize: 12 }}>
              <div>
                <div className="muted">Bài đã làm</div>
                <div className="kpi" style={{ fontSize: 22, marginTop: 2 }}>{activity.setsDone}</div>
              </div>
              <div>
                <div className="muted">Câu đã trả lời</div>
                <div className="kpi" style={{ fontSize: 22, marginTop: 2 }}>{activity.questionsAnswered}</div>
              </div>
              <div>
                <div className="muted">Tỉ lệ đúng TB</div>
                <div className="kpi" style={{ fontSize: 22, marginTop: 2, color: activity.avgAccuracy !== null && activity.avgAccuracy >= 70 ? "var(--success)" : "var(--ink)" }}>
                  {activity.avgAccuracy !== null ? <>{activity.avgAccuracy}<small>%</small></> : <span className="muted" style={{ fontSize: 14 }}>—</span>}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent + weakest */}
        <div className="grid cols-2" style={{ marginTop: 16, gridTemplateColumns: "2fr 1fr" }}>
          <Card
            title="Hoạt động gần đây"
            sub="Bấm để xem lại bài làm và lời giải"
            action={<Link href="/results" className="btn sm ghost">Xem tất cả <Icon name="chevR" size={12} /></Link>}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recent.length === 0 ? (
                <div className="muted" style={{ padding: "24px 0", textAlign: "center", fontSize: 13 }}>
                  Chưa có bài làm nào. Vào{" "}
                  <Link href="/vietnamese/library" style={{ color: "var(--accent)", textDecoration: "underline" }}>Đề thi mẫu</Link>{" "}để bắt đầu.
                </div>
              ) : (
                recent.map((a, i) => {
                  const school = SCHOOLS.find((s) => s.id === a.exam.school);
                  const p = a.score;
                  return (
                    <Link key={a.id} href={`/exam/${a.examId}/results/${a.id}`} className="row"
                      style={{ padding: "12px 0", borderBottom: i < recent.length - 1 ? "1px solid var(--border-soft)" : "0", gap: 14, color: "inherit", textDecoration: "none" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: school ? school.color : "var(--surface-sunk)", color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {school ? school.short : "·"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5 }}>{a.exam.title ?? `Tiếng Việt ${a.exam.year}`}</div>
                        <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{fmtDate(a.createdAt)}</div>
                      </div>
                      <div style={{ minWidth: 90 }}><Bar value={p} tone={p >= 70 ? "" : p >= 50 ? "ltv" : "ntt"} /></div>
                      <div style={{ minWidth: 60, textAlign: "right" }}>
                        <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: p >= 70 ? "var(--success)" : p >= 50 ? "var(--ink)" : "var(--danger)" }}>{p}%</span>
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
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `color-mix(in oklch, ${weakest.color}, white 80%)`, color: weakest.color, display: "grid", placeItems: "center", fontWeight: 700 }}>
                  {weakest.ico}
                </div>
                <Pill tone="red">Yếu nhất</Pill>
              </div>
              <h3 style={{ margin: 0, fontSize: 16, letterSpacing: "-0.01em" }}>{weakest.name}</h3>
              <p className="muted" style={{ fontSize: 12.5, margin: "4px 0 12px" }}>
                {(() => {
                  const pct = Math.round(weakestEntry[1] * 100);
                  const gap = Math.max(0, 70 - pct);
                  return gap > 0 ? `Mức ${pct}% — cách mục tiêu 70% còn ${gap}%` : `Mức ${pct}% — đã đạt mục tiêu 70%`;
                })()}
              </p>
              <Bar value={weakestEntry[1] * 100} tone="ntt" tall />
              <Link href={`/vietnamese/practice?topic=${weakest.id}`} className="btn primary" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
                <Icon name="bolt" /> Bắt đầu luyện ngay
              </Link>
            </Card>
          </div>
        </div>

        {/* Topic detail table */}
        <Card
          title="Chi tiết theo chuyên đề"
          sub="Mục tiêu ≈ 70% cho trường mục tiêu"
          action={<Link href="/vietnamese/topics" className="btn sm ghost">Mở luyện chuyên đề <Icon name="chevR" size={12} /></Link>}
          style={{ marginTop: 24 }}
        >
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Chuyên đề</th>
                <th style={{ width: 90 }}>Đã chấm</th>
                <th style={{ width: 140 }}>Mức thành thạo</th>
                <th style={{ width: 80, textAlign: "right" }}>%</th>
                <th style={{ width: 110 }}>Khoảng cách</th>
                <th style={{ width: 100, textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {VIETNAMESE_TOPICS.map((t) => {
                const v = mastery.topicMastery[t.id] ?? BASELINE_MASTERY;
                const pct = Math.round(v * 100);
                const gap = 70 - pct;
                const samples = mastery.topicSampleSize[t.id] ?? 0;
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `color-mix(in oklch, ${t.color}, white 86%)`, color: t.color, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>{t.ico}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{samples > 0 ? `${samples} câu đã chấm` : "Chưa luyện"}</div>
                    </td>
                    <td className="mono muted">{samples}</td>
                    <td><Bar value={pct} tone={pct >= 70 ? "" : pct >= 55 ? "ltv" : "ntt"} /></td>
                    <td style={{ textAlign: "right" }} className="mono">
                      <b style={{ fontSize: 14, color: pct >= 70 ? "var(--success)" : "var(--ink)" }}>{pct}%</b>
                    </td>
                    <td>{gap > 0 ? <Pill tone="amber">cần +{gap}%</Pill> : <Pill tone="green">đạt mục tiêu</Pill>}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/vietnamese/practice?topic=${t.id}`} className="btn sm">Luyện <Icon name="chevR" size={11} /></Link>
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
