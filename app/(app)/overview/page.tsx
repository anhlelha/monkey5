import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser, firstName } from "@/lib/user-data";
import { SCHOOLS } from "@/lib/static";
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
import { getEffectiveReadinessV4 } from "@/lib/readiness-v4/read-service";
import { getEffectiveAnalyticalMasteryV4 } from "@/lib/readiness-v4/content-mastery-service";
import { MATH_ANALYTICAL_TOPICS } from "@/lib/readiness-v4/analytical-topics";
import type { EffectiveReadinessView } from "@/lib/readiness-v4/read-service";
import { presentReadiness } from "@/lib/readiness-v4/presentation";
import { ReadinessUserSummary } from "@/components/readiness/ReadinessUserSummary";

const HUB: Record<Subject, string> = { math: "/home", english: "/english", vietnamese: "/vietnamese" };

export default async function OverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);

  const SUB: { key: Subject; topicIds: string[]; unitLabel: string }[] = [
    { key: "math", topicIds: MATH_ANALYTICAL_TOPICS.map((topic) => topic.id), unitLabel: "13 topic V4" },
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
      const legacyReadiness = computeAllReadiness(mastery.topicMastery, mastery.levelMastery, profiles);
      const readinessViews = s.key === "math"
        ? await getEffectiveReadinessV4(user.id, Object.keys(profiles), legacyReadiness)
        : null;
      const readiness = readinessViews
        ? Object.fromEntries(Object.entries(readinessViews).map(([school, view]) => [school, view.score]))
        : legacyReadiness;
      const vals = s.key === "math"
        ? Object.values(await getEffectiveAnalyticalMasteryV4(
            user.id,
            MATH_ANALYTICAL_TOPICS.map((topic) => topic.id),
          )).flatMap((view) => typeof view.score === "number" ? [view.score] : [])
        : s.topicIds.map((id) => mastery.topicMastery[id] ?? BASELINE_MASTERY);
      const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) : null;
      return { key: s.key, meta: SUBJECT_META[s.key], unitLabel: s.unitLabel, avg, attempts, readiness, readinessViews };
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
    const per = data.map((d) => ({
      key: d.key,
      color: d.meta.color,
      r: d.readiness[s.id] ?? null,
      view: d.key === "math" ? d.readinessViews?.[s.id] ?? null : null,
    }));
    const present = per.map((p) => p.r).filter((r): r is number => r !== null);
    const composite = present.length ? Math.round(present.reduce((a, b) => a + b, 0) / present.length) : null;
    return { school: s, per, composite, isTarget: user.targets.includes(s.id) };
  });

  const mathData = data.find((item) => item.key === "math");

  // Header summary.
  const targetComposites = rows.filter((r) => r.isTarget && r.composite !== null).map((r) => r.composite as number);
  const avgTargets = targetComposites.length ? Math.round(targetComposites.reduce((a, b) => a + b, 0) / targetComposites.length) : null;
  const weakest = [...data].sort((a, b) => (a.avg ?? Number.POSITIVE_INFINITY) - (b.avg ?? Number.POSITIVE_INFINITY))[0];
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
                <>Trung bình tham khảo ba môn cho <b>{user.targets.length}</b> trường mục tiêu là <b style={{ color: "var(--ink)" }}>{avgTargets} / 100</b>. </>
              ) : (
                <>Chưa có đủ dữ liệu mục tiêu. </>
              )}
              Đây không phải trạng thái Readiness V4. Môn có chỉ số năng lực thấp nhất: <b style={{ color: "var(--ink)" }}>{weakest.meta.name}</b>.
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
            const targetR = primaryTargetId ? d.readiness[primaryTargetId] ?? null : null;
            const targetView = primaryTargetId && d.key === "math"
              ? d.readinessViews?.[primaryTargetId] ?? null
              : null;
            const targetPresentation = targetView ? presentReadiness(targetView as EffectiveReadinessView) : null;
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
                  {d.avg === null
                    ? <div style={{ width: 104, height: 104, borderRadius: "50%", border: "8px solid var(--border-soft)", display: "grid", placeItems: "center" }}><span className="muted">—</span></div>
                    : <RingGauge value={d.avg} color={d.meta.color} size={104} />}
                  <div className="col" style={{ gap: 6 }}>
                    <div className="eyebrow" style={{ fontSize: 10 }}>{d.key === "math" ? "Mastery V4 TB" : "Năng lực TB"}</div>
                    <Pill>{d.avg === null ? "Chưa xác minh" : "Đã có dữ liệu"}</Pill>
                    {targetR !== null && primaryTarget && (
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        {d.key === "math" ? "Readiness V4" : "Chỉ số môn"} {primaryTarget.short}{" "}
                        <b style={{ color: "var(--ink)" }}>{targetR} / 100</b>
                      </div>
                    )}
                    {targetPresentation && <Pill tone={targetPresentation.tone}>{targetPresentation.statusLabel}</Pill>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {mathData?.readinessViews && (
          <div style={{ marginBottom: 24 }}>
            <ReadinessUserSummary
              schools={SCHOOLS.map((school) => ({
                id: school.id,
                short: school.short,
                name: school.name,
                tone: school.tone,
                minutes: school.minutes,
              }))}
              readiness={mathData.readinessViews}
              targetIds={user.targets}
              title="Readiness V4 theo trường Toán"
              subtitle="Mastery theo blueprint trường, Evidence và status V4 được hiển thị riêng; trung bình ba môn bên dưới chỉ là tham khảo."
            />
          </div>
        )}

        {/* Combined school readiness table */}
        <Card
          title="Chỉ số tham khảo theo trường — ba môn độc lập"
          sub="Bảng này chỉ để xem từng môn cạnh nhau. Không dùng trung bình tham khảo để gán status Readiness V4."
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
                  <th>Trung bình tham khảo</th>
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
                            <div>
                              <b className="mono" style={{ fontSize: 12.5 }}>{p.r} / 100</b>
                              {p.view && (
                                <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>
                                  {presentReadiness(p.view).statusLabel}
                                </div>
                              )}
                            </div>
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
                            <div style={{ height: "100%", width: `${composite}%`, background: "var(--accent)" }} />
                          </div>
                          <b className="mono" style={{ fontSize: 13 }}>{composite} / 100</b>
                        </div>
                      )}
                    </td>
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
