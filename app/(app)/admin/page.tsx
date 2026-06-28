import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  hydrateUser,
  getMasteryStats,
  getUserActivityStats,
} from "@/lib/user-data";
import { DEFAULT_TOPICS } from "@/lib/static";
import { getAllSchools, getActiveSchools } from "@/lib/schools";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Pill } from "@/components/ui";
import { TopicsEditor } from "./TopicsEditor";
import { MasteryOverviewCard } from "./MasteryOverviewCard";
import { QAPanel } from "./QAPanel";
import { WhitelistPanel } from "./WhitelistPanel";
import { BankPanel } from "./BankPanel";
import { PlansPanel } from "./PlansPanel";
import { ExamsPanel } from "./ExamsPanel";
import { SchoolsPanel } from "./SchoolsPanel";
import { ReadinessPanel } from "./ReadinessPanel";
import { SettingsPanel } from "./SettingsPanel";
import { LLMPanel } from "./LLMPanel";
import { getQuietHours, getLandingTheme } from "@/lib/app-settings";
import { getPublicLLMSettings } from "@/lib/llm-settings";
import {
  getAuditResults,
  getQuestionsWithFigures,
  getBankStats,
  getBankQuestions,
  getPlanConfigs,
  getLevelConfigRows,
  getReadinessDistribution,
  getAdminOverviewExtra,
} from "./actions";

interface Props {
  searchParams: Promise<{ tab?: string; q?: string; subject?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");

  const { tab = "overview", q, subject: subjectParam } = await searchParams;
  const searchQuery = (q ?? "").trim();
  // Subject scope for content tabs (exams / topics / bank). Default math so the
  // existing experience is unchanged.
  const subject: "math" | "english" | "vietnamese" =
    subjectParam === "vietnamese" ? "vietnamese" : subjectParam === "english" ? "english" : "math";
  const userWhere =
    tab === "users" && searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery } },
            { email: { contains: searchQuery } },
          ],
        }
      : undefined;

  const [examsCount, questionsCount, attemptsCount, usersCount, exams, topics, users] =
    await Promise.all([
      // Admin chỉ quản lý đề do admin tạo/upload (generated=false).
      // Đề "Phỏng tự động" (set-*/ref-*) sinh ra khi user luyện tập bị loại trừ.
      prisma.exam.count({ where: { generated: false } }),
      // Ngân hàng câu hỏi gốc: chỉ tính câu trong đề thật + câu bổ sung.
      // Loại trừ bản clone trong đề "Phỏng tự động" (set-*/ref-*, generated=true)
      // do spawn-exam.ts sinh ra mỗi lần user luyện tập — nếu không sẽ phình số.
      prisma.question.count({
        where: {
          active: true,
          OR: [{ exam: { generated: false } }, { examId: null }],
        },
      }),
      prisma.attempt.count({ where: { submitted: true } }),
      prisma.user.count(),
      prisma.exam.findMany({
        where: { generated: false, subject },
        orderBy: [{ kind: "asc" }, { year: "desc" }],
      }),
      prisma.topic.findMany({ where: { subject }, orderBy: { position: "asc" } }),
      prisma.user.findMany({
        where: userWhere,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

  // Resolve owners for private remedial sets ("Bài thầy giao") so the exams
  // panel can label which student each set belongs to.
  const ownerIds = [...new Set(exams.map((e) => e.ownerUserId).filter((v): v is string => !!v))];
  const owners = ownerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const ownerMap = new Map(owners.map((u) => [u.id, u.name ?? u.email ?? "—"]));

  const masteryStats = tab === "overview" ? await getMasteryStats() : null;
  const overviewExtra = tab === "overview" ? await getAdminOverviewExtra() : null;
  const userActivityMap =
    tab === "users" ? await getUserActivityStats(users.map((u) => u.id)) : null;

  // Only fetch QA data when on QA tab (expensive)
  const flaggedQuestions = tab === "qa" ? await getAuditResults() : [];
  const figureQuestions = tab === "qa" ? await getQuestionsWithFigures() : [];

  const whitelistEntries = tab === "whitelist"
    ? await prisma.userWhitelist.findMany({ orderBy: { createdAt: "desc" } })
    : [];

  const bankStats = tab === "bank" ? await getBankStats(subject) : null;
  const bankPage  = tab === "bank" ? await getBankQuestions({ source: "all", page: 1, subject }) : null;

  const planConfigs  = tab === "plans" ? await getPlanConfigs()      : [];
  const levelConfigs = tab === "plans" ? await getLevelConfigRows()  : [];

  const schoolsList    = tab === "schools"   ? await getAllSchools()             : [];
  const readinessData  = tab === "readiness" ? await getReadinessDistribution(subject) : [];
  const readinessSchools = tab === "readiness" ? await getActiveSchools()       : [];
  const activeSchools  = tab === "overview"  ? await getActiveSchools()         : [];
  const quietHours     = tab === "settings"  ? await getQuietHours()             : null;
  const landingTheme   = tab === "settings"  ? await getLandingTheme()            : null;
  const llmSettings    = tab === "llm"        ? await getPublicLLMSettings()       : null;

  const TOPICS =
    topics.length > 0
      ? topics
      : subject === "english" || subject === "vietnamese"
        ? []
        : [...DEFAULT_TOPICS].map((t, i) => ({ ...t, position: i }));

  const TAB_META: Record<string, { crumb: string; title: string; sub: string }> = {
    overview: { crumb: "Dashboard", title: "Dashboard", sub: "Thống kê tổng quan người dùng, đề thi và lượt làm bài." },
    exams:    { crumb: "Đề bài", title: "Đề bài", sub: "Đề chính thức & đề tham khảo được upload từ code." },
    bank:     { crumb: "Câu hỏi", title: "Ngân hàng câu hỏi", sub: "Quản lý kho câu hỏi dùng cho luyện tập và đề tổng hợp." },
    users:    { crumb: "Tài khoản", title: "Tài khoản người dùng", sub: "Danh sách học sinh và quản trị viên trong hệ thống." },
    whitelist:{ crumb: "Whitelist", title: "Whitelist truy cập", sub: "Quản lý email được phép đăng nhập / nâng cấp." },
    settings: { crumb: "Cấu hình chung", title: "Cấu hình chung", sub: "Tham số mặc định áp dụng cho toàn bộ ứng dụng." },
    llm:      { crumb: "AI LLMs", title: "Setup AI LLMs", sub: "Cấu hình nhà cung cấp AI & cách chấm câu tự luận tự động." },
    topics:   { crumb: "Chuyên đề", title: "Cấu hình chuyên đề", sub: "Danh sách và thứ tự các chuyên đề luyện tập." },
    qa:       { crumb: "QA câu hỏi", title: "QA câu hỏi", sub: "Soát lỗi và rà soát câu hỏi bị flag / có hình." },
    plans:    { crumb: "Gói thành viên", title: "Gói VIP · Pro · Free", sub: "Cấu hình giới hạn và quyền lợi từng gói." },
    schools:  { crumb: "Trường", title: "Cấu hình trường", sub: "Quản lý danh sách trường + metadata hiển thị." },
    readiness:{ crumb: "Mức phù hợp", title: "Phân tích readiness", sub: "Phân bố user theo mức sẵn sàng + tools rebuild profile / recompute." },
  };
  const meta = TAB_META[tab] ?? TAB_META.overview;

  return (
    <div className="main">
      <TopBar
        crumbs={[{ label: "Quản trị", href: "/admin?tab=overview" }, meta.crumb]}
        actions={
          <button className="btn">
            <Icon name="download" /> Xuất báo cáo
          </button>
        }
      />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>{meta.title}</h2>
            <p>{meta.sub}</p>
          </div>
          {["exams", "topics", "bank", "readiness"].includes(tab) ? (
            <div className="subject-switch">
              <Link
                href={`/admin?tab=${tab}&subject=math`}
                className={"subject-pill " + (subject === "math" ? "active" : "")}
              >
                <Icon name="grid" /> Toán
              </Link>
              <Link
                href={`/admin?tab=${tab}&subject=english`}
                className={"subject-pill " + (subject === "english" ? "active" : "")}
              >
                <Icon name="book" /> Tiếng Anh
              </Link>
              <Link
                href={`/admin?tab=${tab}&subject=vietnamese`}
                className={"subject-pill " + (subject === "vietnamese" ? "active" : "")}
              >
                <Icon name="pencil" /> Tiếng Việt
              </Link>
            </div>
          ) : (
            tab === "exams" && (
              <Pill tone="amber">
                <span className="dot" />Đề & bài tập được upload từ code
              </Pill>
            )
          )}
        </div>

        {tab === "overview" && (
          <>
            <div className="grid cols-5" style={{ marginBottom: 22 }}>
              {[
                { k: "Người dùng đang học", v: usersCount.toLocaleString("vi-VN"), d: "tổng tài khoản", tone: "var(--accent-ink)" },
                { k: "Số trường", v: String(overviewExtra?.schoolCount ?? 0), d: "trường tuyển sinh", tone: "var(--ntt)" },
                { k: "Đề đã có", v: String(examsCount), d: "trong thư viện", tone: "var(--cg)" },
                { k: "Câu hỏi", v: questionsCount.toLocaleString("vi-VN"), d: "trong ngân hàng", tone: "var(--ltv)" },
                { k: "Đã hoàn thành", v: attemptsCount.toLocaleString("vi-VN"), d: "lượt làm bài", tone: "var(--success)" },
              ].map((s, i) => (
                <Card key={i} tight>
                  <div className="eyebrow">{s.k}</div>
                  <div className="kpi" style={{ color: s.tone, fontSize: 28, marginTop: 6 }}>{s.v}</div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{s.d}</div>
                </Card>
              ))}
            </div>

            {overviewExtra && (
              <div className="grid cols-2" style={{ gap: 16, marginBottom: 22 }}>
                <Card title="Thống kê theo môn" sub="Số đề, câu hỏi trong ngân hàng và lượt làm bài theo từng môn">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Môn</th>
                        <th style={{ textAlign: "right" }}>Đề</th>
                        <th style={{ textAlign: "right" }}>Câu hỏi</th>
                        <th style={{ textAlign: "right" }}>Lượt làm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overviewExtra.subjects.map((s) => (
                        <tr key={s.subject}>
                          <td><b style={{ fontWeight: 500 }}>{s.label}</b></td>
                          <td className="mono" style={{ textAlign: "right" }}>{s.exams}</td>
                          <td className="mono" style={{ textAlign: "right" }}>{s.questions.toLocaleString("vi-VN")}</td>
                          <td className="mono" style={{ textAlign: "right" }}>{s.attempts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card title="Sử dụng AI · chấm tự luận" sub="Token tính từ khi bật theo dõi — chỉ cộng các lần chấm có gọi AI">
                  <div className="grid cols-3" style={{ gap: 12, marginBottom: 14 }}>
                    <div>
                      <div className="eyebrow">Lượt chấm AI</div>
                      <div className="kpi" style={{ fontSize: 22, marginTop: 4 }}>{overviewExtra.ai.gradings}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {overviewExtra.ai.graded} ok
                        {overviewExtra.ai.errored > 0 && <span style={{ color: "var(--danger)" }}> · {overviewExtra.ai.errored} lỗi</span>}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow">Token vào</div>
                      <div className="kpi" style={{ fontSize: 22, marginTop: 4, color: "var(--ltv)" }}>{overviewExtra.ai.promptTokens.toLocaleString("vi-VN")}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>prompt tokens</div>
                    </div>
                    <div>
                      <div className="eyebrow">Token ra</div>
                      <div className="kpi" style={{ fontSize: 22, marginTop: 4, color: "var(--accent-ink)" }}>{overviewExtra.ai.completionTokens.toLocaleString("vi-VN")}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>completion tokens</div>
                    </div>
                  </div>
                  <div className="hr" />
                  <div className="row between" style={{ marginTop: 8, fontSize: 12.5 }}>
                    <span className="muted">Tổng token</span>
                    <b className="mono">{(overviewExtra.ai.promptTokens + overviewExtra.ai.completionTokens).toLocaleString("vi-VN")}</b>
                  </div>
                  {overviewExtra.ai.byModel.length > 0 ? (
                    <div className="col" style={{ gap: 6, marginTop: 10 }}>
                      {overviewExtra.ai.byModel.map((m) => (
                        <div key={m.model} className="row between" style={{ fontSize: 12.5 }}>
                          <span className="mono" style={{ color: "var(--ink-muted)" }}>{m.model}</span>
                          <span><b className="mono">{m.count}</b> lượt · <b className="mono">{m.tokens.toLocaleString("vi-VN")}</b> tok</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
                      Chưa có lượt chấm AI nào. Số liệu token sẽ xuất hiện sau khi học sinh nộp bài tự luận và AI chấm.
                    </div>
                  )}
                </Card>
              </div>
            )}

            <Card title="Phân bố trường mục tiêu" sub="Học sinh nhắm tới trường nào nhiều nhất">
              <div className="col" style={{ gap: 10 }}>
                {activeSchools.map((s) => {
                  const count = users.filter((u) => {
                    try {
                      return (JSON.parse(u.targets) as string[]).includes(s.id);
                    } catch {
                      return false;
                    }
                  }).length;
                  const pct = users.length > 0 ? (count / users.length) * 100 : 0;
                  return (
                    <div key={s.id}>
                      <div className="row between" style={{ marginBottom: 3 }}>
                        <span className="row" style={{ gap: 8, fontSize: 13 }}>
                          <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }} />
                          {s.full}
                        </span>
                        <b className="mono" style={{ fontSize: 13 }}>{count} HS</b>
                      </div>
                      <Bar value={pct} tone={s.tone} />
                    </div>
                  );
                })}
              </div>
            </Card>

            {masteryStats && (
              <div style={{ marginTop: 22 }}>
                <MasteryOverviewCard
                  stats={masteryStats}
                  topics={TOPICS.map((t) => ({
                    id: t.id,
                    name: t.name,
                    short: t.short,
                    color: t.color,
                    position: t.position ?? 0,
                  }))}
                />
              </div>
            )}
          </>
        )}

        {tab === "exams" && (
          <ExamsPanel
            exams={exams.map((e) => ({
              id: e.id,
              kind: e.kind,
              generated: e.generated,
              year: e.year,
              title: e.title,
              school: e.school,
              qcount: e.qcount,
              minutes: e.minutes,
              note: e.note,
              owner: e.ownerUserId ? ownerMap.get(e.ownerUserId) ?? "—" : null,
            }))}
            subject={subject}
          />
        )}

        {tab === "qa" && (
          <Card title="🔍 QA Câu hỏi" sub="Số liệu chi tiết hiển thị trên từng tab bên dưới.">
            <QAPanel flagged={flaggedQuestions} figures={figureQuestions} />
          </Card>
        )}

        {tab === "topics" && (
          <TopicsEditor
            subject={subject}
            initial={TOPICS.map((t) => ({
              id: t.id,
              name: t.name,
              short: t.short,
              ico: t.ico,
              color: t.color,
              position: t.position ?? 0,
              skill: (t as { skill?: string | null }).skill ?? null,
            }))}
          />
        )}

        {tab === "users" && (
          <Card>
            <form
              method="GET"
              className="row between"
              style={{ marginBottom: 16, gap: 12, alignItems: "center" }}
            >
              <input type="hidden" name="tab" value="users" />
              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <input
                  className="input"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Tìm theo tên hoặc email…"
                  style={{ width: 320 }}
                />
                <button className="btn sm" type="submit">
                  Tìm
                </button>
                {searchQuery && (
                  <Link href="/admin?tab=users" className="btn sm ghost">
                    Xoá
                  </Link>
                )}
              </div>
              <span className="muted" style={{ fontSize: 12 }}>
                {searchQuery
                  ? `${users.length} kết quả · trên tổng ${usersCount}`
                  : `${usersCount} người dùng`}
              </span>
            </form>
            <table className="tbl">
              <thead>
                <tr>
                  <th></th>
                  <th>Tên · Email</th>
                  <th>Vai trò</th>
                  <th>Gói</th>
                  <th>Lớp</th>
                  <th>Trường mục tiêu</th>
                  <th>Hoạt động</th>
                  <th>Tham gia</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  let targets: string[] = [];
                  try {
                    targets = JSON.parse(u.targets);
                  } catch {
                    targets = [];
                  }
                  const initials =
                    (u.name ?? u.email ?? "?")
                      .trim()
                      .split(/\s+/)
                      .slice(-2)
                      .map((s) => s[0])
                      .join("")
                      .toUpperCase() || "?";
                  const planTone = u.plan === "vip" ? "solid" : u.plan === "pro" ? "green" : "";
                  const planLabel = u.plan === "vip" ? "VIP" : u.plan === "pro" ? "Pro" : "Free";
                  const activity = userActivityMap?.get(u.id);
                  const totalDone =
                    (activity?.attemptCount ?? 0) + (activity?.topicSessionCount ?? 0);
                  const avgScore = activity?.avgScore;
                  const detailHref = `/admin/users/${u.id}`;
                  return (
                    <tr key={u.id} style={u.disabled ? { opacity: 0.55 } : undefined}>
                      <td>
                        <Link href={detailHref} className="avatar" style={{ textDecoration: "none" }}>
                          {initials}
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={detailHref}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <span className="row" style={{ gap: 6, alignItems: "center" }}>
                            <b style={{ fontWeight: 500 }}>{u.name ?? "—"}</b>
                            {u.disabled && <Pill tone="red">Đã khoá</Pill>}
                          </span>
                          <div className="muted" style={{ fontSize: 11.5 }}>{u.email}</div>
                        </Link>
                      </td>
                      <td>
                        <Pill tone={u.role === "admin" ? "solid" : ""}>{u.role}</Pill>
                      </td>
                      <td>
                        <Pill tone={planTone}>{planLabel}</Pill>
                      </td>
                      <td className="mono">{u.grade}</td>
                      <td>
                        {targets.length === 0 ? (
                          <span className="muted">Chưa chọn</span>
                        ) : (
                          targets.map((id) => {
                            return (
                              <Pill key={id}>{id.toUpperCase()}</Pill>
                            );
                          })
                        )}
                      </td>
                      <td>
                        {totalDone === 0 ? (
                          <span className="muted" style={{ fontSize: 12 }}>—</span>
                        ) : (
                          <span className="row" style={{ gap: 6, alignItems: "center" }}>
                            <b className="mono" style={{ fontSize: 13 }}>{totalDone} bài</b>
                            {avgScore !== null && avgScore !== undefined && (
                              <Pill
                                tone={
                                  avgScore >= 70 ? "green" : avgScore >= 50 ? "amber" : "red"
                                }
                              >
                                TB {avgScore}%
                              </Pill>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="muted">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <Link href={detailHref} className="btn sm ghost">
                          Xem
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty" style={{ textAlign: "center" }}>
                      Không có người dùng nào khớp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "whitelist" && (
          <WhitelistPanel entries={whitelistEntries} />
        )}

        {tab === "bank" && bankStats && bankPage && (
          <BankPanel
            stats={bankStats}
            initialPage={bankPage}
            topics={TOPICS.map((t) => ({ id: t.id, name: t.name, short: t.short }))}
            subject={subject}
          />
        )}

        {tab === "plans" && (
          <PlansPanel planConfigs={planConfigs} levelConfigs={levelConfigs} />
        )}

        {tab === "schools" && <SchoolsPanel schools={schoolsList} />}

        {tab === "readiness" && (
          <ReadinessPanel
            histograms={readinessData}
            schools={readinessSchools.map((s) => ({ id: s.id, full: s.full, tone: s.tone }))}
            subject={subject}
          />
        )}

        {tab === "settings" && quietHours && landingTheme && (
          <SettingsPanel initialQuietHours={quietHours} initialLandingTheme={landingTheme} />
        )}

        {tab === "llm" && llmSettings && (
          <LLMPanel initial={llmSettings} />
        )}
      </div>
    </div>
  );
}
