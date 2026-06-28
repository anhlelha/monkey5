import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser, firstName } from "@/lib/user-data";
import { SCHOOLS, DEFAULT_TOPICS } from "@/lib/static";
import { computeMastery, BASELINE_MASTERY } from "@/lib/mastery";
import { getAllSchoolProfiles } from "@/lib/school-profiles";
import { computeAllReadiness } from "@/lib/readiness";
import {
  SUBJECT_META,
  ENGLISH_TOPICS,
  ENGLISH_SKILLS,
  VIETNAMESE_TOPICS,
  VIETNAMESE_SKILLS,
  type Subject,
} from "@/lib/subjects";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Card, Pill } from "@/components/ui";
import { RingGauge } from "@/components/RingGauge";
import { daysBetween, greeting } from "@/lib/fmt";

const statusOf = (p: number): { label: string; tone: "green" | "amber" | "red" } =>
  p >= 75 ? { label: "Sẵn sàng", tone: "green" } : p >= 60 ? { label: "Đang tiến triển", tone: "amber" } : { label: "Cần luyện thêm", tone: "red" };

const HUB: Record<Subject, string> = { math: "/home", english: "/english", vietnamese: "/vietnamese" };

export default async function OverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);

  const mathTopicRows = await prisma.topic.findMany({ where: { subject: "math" }, select: { id: true } });
  const mathTopicIds = mathTopicRows.length ? mathTopicRows.map((t) => t.id) : DEFAULT_TOPICS.map((t) => t.id);

  const SUB: { key: Subject; topicIds: string[]; unitLabel: string }[] = [
    { key: "math", topicIds: mathTopicIds, unitLabel: `${mathTopicIds.length} chuyên đề` },
    { key: "english", topicIds: ENGLISH_TOPICS.map((t) => t.id), unitLabel: `${ENGLISH_SKILLS.length} kỹ năng` },
    { key: "vietnamese", topicIds: VIETNAMESE_TOPICS.map((t) => t.id), unitLabel: `${VIETNAMESE_SKILLS.length} kỹ năng` },
  ];

  const data = await Promise.all(
    SUB.map(async (s) => {
      const [mastery, profiles, attempts] = await Promise.all([
        computeMastery(user.id, s.key),
        getAllSchoolProfiles(s.key),
        prisma.attempt.count({ where: { userId: user.id, submitted: true, exam: { subject: s.key } } }),
      ]);
      const readiness = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);
      const vals = s.topicIds.map((id) => mastery.topicMastery[id] ?? BASELINE_MASTERY);
      const avg = Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length || 1)) * 100);
      return { key: s.key, meta: SUBJECT_META[s.key], unitLabel: s.unitLabel, avg, attempts, readiness };
    }),
  );

  const primaryTargetId = user.targets[0] ?? null;
  const primaryTarget = primaryTargetId ? SCHOOLS.find((s) => s.id === primaryTargetId) : null;

  // Combined school table: any school with a profile in any subject.
  const schoolIds = new Set<string>();
  data.forEach((d) => Object.keys(d.readiness).forEach((id) => schoolIds.add(id)));
  const orderedSchools = SCHOOLS.filter((s) => schoolIds.has(s.id)).sort((a, b) => {
    const at = user.targets.includes(a.id) ? 0 : 1;
    const bt = user.targets.includes(b.id) ? 0 : 1;
    return at - bt;
  });
  const rows = orderedSchools.map((s) => {
    const per = data.map((d) => ({ key: d.key, color: d.meta.color, r: d.readiness[s.id] ?? null }));
    const present = per.map((p) => p.r).filter((r): r is number => r !== null);
    const composite = present.length ? Math.round(present.reduce((a, b) => a + b, 0) / present.length) : null;
    return { school: s, per, composite, isTarget: user.targets.includes(s.id) };
  });

  // Header summary.
  const targetComposites = rows.filter((r) => r.isTarget && r.composite !== null).map((r) => r.composite as number);
  const avgTargets = targetComposites.length ? Math.round(targetComposites.reduce((a, b) => a + b, 0) / targetComposites.length) : null;
  const weakest = [...data].sort((a, b) => a.avg - b.avg)[0];
  const daysToExam = user.examDate ? daysBetween(user.examDate) : null;

  return (
    <div className="main">
      <TopBar />
      <div className="content">
        <div className="page-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {greeting()} · Tổng quan 3 môn
              {daysToExam !== null && (
                <> · Còn <b className="mono" style={{ color: "var(--accent-ink)" }}>{daysToExam} ngày</b> đến kỳ thi</>
              )}
            </div>
            <h2>{greeting()}, {firstName(user.name)} 👋</h2>
            <p>
              {avgTargets !== null ? (
                <>Mức sẵn sàng trung bình cho <b>{user.targets.length}</b> trường mục tiêu là <b style={{ color: "var(--ink)" }}>{avgTargets}%</b>. </>
              ) : (
                <>Chưa có đủ dữ liệu mục tiêu. </>
              )}
              Môn cần đẩy nhất: <b style={{ color: "var(--ink)" }}>{weakest.meta.name}</b>.
            </p>
          </div>
          <Link href={HUB[weakest.key]} className="btn primary">
            <Icon name="bolt" /> Luyện điểm yếu nhất
          </Link>
        </div>

        {/* Per-subject cards */}
        <div className="row between" style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>Năng lực theo môn</h3>
          <span className="muted" style={{ fontSize: 12.5 }}>Bấm để mở dashboard từng môn</span>
        </div>
        <div className="grid cols-3" style={{ gap: 16, marginBottom: 24 }}>
          {data.map((d) => {
            const st = statusOf(d.avg);
            const targetR = primaryTargetId ? d.readiness[primaryTargetId] ?? null : null;
            return (
              <Link key={d.key} href={HUB[d.key]} className="card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                <div className="row" style={{ gap: 12, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `color-mix(in oklch, ${d.meta.color}, white 84%)`, color: d.meta.color, display: "grid", placeItems: "center", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {d.meta.short[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: 15 }}>{d.meta.name}</b>
                    <div className="muted" style={{ fontSize: 12 }}>{d.unitLabel} · {d.attempts} bài đã làm</div>
                  </div>
                  <Icon name="chevR" size={14} />
                </div>
                <div className="row" style={{ gap: 16, alignItems: "center" }}>
                  <RingGauge value={d.avg} color={d.meta.color} size={104} />
                  <div className="col" style={{ gap: 6 }}>
                    <div className="eyebrow" style={{ fontSize: 10 }}>Năng lực TB</div>
                    <Pill tone={st.tone}>{st.label}</Pill>
                    {targetR !== null && primaryTarget && (
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        Sẵn sàng {primaryTarget.short} <b style={{ color: "var(--ink)" }}>{targetR}%</b>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Combined school readiness table */}
        <Card
          title="Mức sẵn sàng theo trường — tổng hợp 3 môn"
          sub="Cột Tổng hợp = trung bình Toán · Tiếng Anh · Tiếng Việt"
        >
          {rows.length === 0 ? (
            <div className="empty">Chưa có dữ liệu trường. Hãy làm vài đề để hệ thống tính mức sẵn sàng.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Trường</th>
                  <th>Toán</th>
                  <th>Tiếng Anh</th>
                  <th>Tiếng Việt</th>
                  <th>Tổng hợp</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ school, per, composite, isTarget }) => (
                  <tr key={school.id}>
                    <td>
                      <div className="row" style={{ gap: 10, alignItems: "center" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: `color-mix(in oklch, ${school.color}, white 84%)`, color: school.color, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                          {school.short}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{school.name}</div>
                          {isTarget && <div className="eyebrow" style={{ fontSize: 9.5, color: "var(--accent-ink)" }}>Mục tiêu</div>}
                        </div>
                      </div>
                    </td>
                    {per.map((p) => (
                      <td key={p.key}>
                        {p.r === null ? (
                          <span className="muted" style={{ fontSize: 12 }}>—</span>
                        ) : (
                          <div className="row" style={{ gap: 8, alignItems: "center" }}>
                            <div style={{ height: 8, width: 64, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${p.r}%`, background: p.color }} />
                            </div>
                            <b className="mono" style={{ fontSize: 12.5 }}>{p.r}%</b>
                          </div>
                        )}
                      </td>
                    ))}
                    <td>
                      {composite === null ? (
                        <span className="muted">—</span>
                      ) : (
                        <div className="row" style={{ gap: 8, alignItems: "center" }}>
                          <div style={{ height: 8, width: 64, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${composite}%`, background: composite >= 75 ? "var(--success)" : composite >= 60 ? "var(--accent)" : "var(--danger)" }} />
                          </div>
                          <b className="mono" style={{ fontSize: 13 }}>{composite}%</b>
                        </div>
                      )}
                    </td>
                    <td>{composite === null ? <span className="muted">—</span> : <Pill tone={statusOf(composite).tone}>{statusOf(composite).label}</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
