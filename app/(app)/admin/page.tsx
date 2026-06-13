import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { SCHOOLS, DEFAULT_TOPICS } from "@/lib/static";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Pill } from "@/components/ui";
import { TopicsEditor } from "./TopicsEditor";
import { QAPanel } from "./QAPanel";
import { WhitelistPanel } from "./WhitelistPanel";
import { BankPanel } from "./BankPanel";
import { PlansPanel } from "./PlansPanel";
import { ExamsPanel } from "./ExamsPanel";
import {
  getAuditResults,
  getQuestionsWithFigures,
  getBankStats,
  getBankQuestions,
  getPlanConfigs,
  getLevelConfigRows,
} from "./actions";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");

  const { tab = "overview" } = await searchParams;

  const [examsCount, topicsCount, attemptsCount, usersCount, exams, topics, users] =
    await Promise.all([
      prisma.exam.count(),
      prisma.customSet.count(),
      prisma.attempt.count({ where: { submitted: true } }),
      prisma.user.count(),
      prisma.exam.findMany({ orderBy: [{ kind: "asc" }, { year: "desc" }] }),
      prisma.topic.findMany({ orderBy: { position: "asc" } }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

  // Only fetch QA data when on QA tab (expensive)
  const flaggedQuestions = tab === "qa" ? await getAuditResults() : [];
  const figureQuestions = tab === "qa" ? await getQuestionsWithFigures() : [];

  const whitelistEntries = tab === "whitelist"
    ? await prisma.userWhitelist.findMany({ orderBy: { createdAt: "desc" } })
    : [];

  const bankStats = tab === "bank" ? await getBankStats() : null;
  const bankPage  = tab === "bank" ? await getBankQuestions({ source: "all", page: 1 }) : null;

  const planConfigs  = tab === "plans" ? await getPlanConfigs()      : [];
  const levelConfigs = tab === "plans" ? await getLevelConfigRows()  : [];

  const TOPICS = topics.length > 0 ? topics : [...DEFAULT_TOPICS].map((t, i) => ({ ...t, position: i }));

  const TAB_META: Record<string, { crumb: string; title: string; sub: string }> = {
    overview: { crumb: "Dashboard", title: "Dashboard", sub: "Thống kê tổng quan người dùng, đề thi và lượt làm bài." },
    exams:    { crumb: "Đề bài", title: "Đề bài", sub: "Đề chính thức & đề tham khảo được upload từ code." },
    bank:     { crumb: "Câu hỏi", title: "Ngân hàng câu hỏi", sub: "Quản lý kho câu hỏi dùng cho luyện tập và đề tổng hợp." },
    users:    { crumb: "Tài khoản", title: "Tài khoản người dùng", sub: "Danh sách học sinh và quản trị viên trong hệ thống." },
    whitelist:{ crumb: "Whitelist", title: "Whitelist truy cập", sub: "Quản lý email được phép đăng nhập / nâng cấp." },
    settings: { crumb: "Cấu hình chung", title: "Cấu hình chung", sub: "Tham số mặc định áp dụng cho toàn bộ ứng dụng." },
    llm:      { crumb: "AI LLMs", title: "Setup AI LLMs", sub: "Cấu hình nhà cung cấp & hành vi trợ giảng (sắp có)." },
    topics:   { crumb: "Chuyên đề", title: "Cấu hình chuyên đề", sub: "Danh sách và thứ tự các chuyên đề luyện tập." },
    qa:       { crumb: "QA câu hỏi", title: "QA câu hỏi", sub: "Soát lỗi và rà soát câu hỏi bị flag / có hình." },
    plans:    { crumb: "Gói thành viên", title: "Gói VIP · Pro · Free", sub: "Cấu hình giới hạn và quyền lợi từng gói." },
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
          {tab === "exams" && (
            <Pill tone="amber">
              <span className="dot" />Đề & bài tập được upload từ code
            </Pill>
          )}
        </div>

        {tab === "overview" && (
          <>
            <div className="grid cols-4" style={{ marginBottom: 22 }}>
              {[
                { k: "Người dùng đang học", v: usersCount.toLocaleString("vi-VN"), d: "tổng tài khoản", tone: "var(--accent-ink)" },
                { k: "Đề đã có", v: String(examsCount), d: "trong thư viện", tone: "var(--cg)" },
                { k: "Bộ luyện chuyên đề", v: String(topicsCount), d: "đã tạo", tone: "var(--ltv)" },
                { k: "Đã hoàn thành", v: attemptsCount.toLocaleString("vi-VN"), d: "lượt làm bài", tone: "var(--success)" },
              ].map((s, i) => (
                <Card key={i} tight>
                  <div className="eyebrow">{s.k}</div>
                  <div className="kpi" style={{ color: s.tone, fontSize: 28, marginTop: 6 }}>{s.v}</div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{s.d}</div>
                </Card>
              ))}
            </div>

            <Card title="Phân bố trường mục tiêu" sub="Học sinh nhắm tới trường nào nhiều nhất">
              <div className="col" style={{ gap: 10 }}>
                {SCHOOLS.map((s) => {
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
          </>
        )}

        {tab === "exams" && (
          <ExamsPanel
            exams={exams.map((e) => ({
              id: e.id,
              kind: e.kind,
              generated: e.generated,
              year: e.year,
              school: e.school,
              qcount: e.qcount,
              minutes: e.minutes,
              note: e.note,
            }))}
          />
        )}

        {tab === "qa" && (
          <Card title="🔍 QA Câu hỏi" sub="Số liệu chi tiết hiển thị trên từng tab bên dưới.">
            <QAPanel flagged={flaggedQuestions} figures={figureQuestions} />
          </Card>
        )}

        {tab === "topics" && (
          <TopicsEditor
            initial={TOPICS.map((t) => ({
              id: t.id,
              name: t.name,
              short: t.short,
              ico: t.ico,
              color: t.color,
              position: t.position ?? 0,
            }))}
          />
        )}

        {tab === "users" && (
          <Card>
            <div className="row between" style={{ marginBottom: 16 }}>
              <input className="input" placeholder="Tìm theo tên hoặc email…" style={{ width: 320 }} />
              <span className="muted" style={{ fontSize: 12 }}>{usersCount} người dùng</span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th></th>
                  <th>Tên · Email</th>
                  <th>Vai trò</th>
                  <th>Gói</th>
                  <th>Lớp</th>
                  <th>Trường mục tiêu</th>
                  <th>Tham gia</th>
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
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="avatar">{initials}</div>
                      </td>
                      <td>
                        <b style={{ fontWeight: 500 }}>{u.name ?? "—"}</b>
                        <div className="muted" style={{ fontSize: 11.5 }}>{u.email}</div>
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
                            const s = SCHOOLS.find((x) => x.id === id);
                            return s ? (
                              <Pill key={id} tone={s.tone}>{s.short}</Pill>
                            ) : null;
                          })
                        )}
                      </td>
                      <td className="muted">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  );
                })}
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
          />
        )}

        {tab === "plans" && (
          <PlansPanel planConfigs={planConfigs} levelConfigs={levelConfigs} />
        )}

        {tab === "settings" && (
          <Card title="Cấu hình chung" sub="Áp dụng toàn bộ ứng dụng">
            <div className="col" style={{ gap: 14, maxWidth: 480 }}>
              <div className="field">
                <label>Ngày thi mục tiêu mặc định</label>
                <input className="input mono" defaultValue="01/06/2026" readOnly />
              </div>
              <div className="field">
                <label>Mục tiêu giờ học/tuần mặc định</label>
                <input className="input mono" defaultValue="5" readOnly />
              </div>
              <div className="field">
                <label>Mức yêu cầu sẵn sàng để báo &quot;Đủ điều kiện&quot;</label>
                <input className="input mono" defaultValue="75%" readOnly />
              </div>
            </div>
          </Card>
        )}

        {tab === "llm" && (
          <Card title="Setup AI LLMs" sub="Cấu hình các nhà cung cấp mô hình & hành vi trợ giảng (sắp có)">
            <div className="col" style={{ gap: 14, maxWidth: 520 }}>
              <div className="field">
                <label>Nhà cung cấp mặc định</label>
                <div className="chip-group">
                  <button className="chip active" type="button">Anthropic</button>
                  <button className="chip" type="button">OpenAI</button>
                  <button className="chip" type="button">Google</button>
                  <button className="chip" type="button">Local</button>
                </div>
              </div>
              <div className="field">
                <label>Model mặc định cho trợ giảng</label>
                <input className="input mono" placeholder="claude-opus-4-7" disabled />
              </div>
              <div className="field">
                <label>Số gợi ý tối đa / câu</label>
                <input className="input mono" defaultValue="5" readOnly />
              </div>
              <div className="field">
                <label>Cho phép AI tiết lộ đáp án cuối?</label>
                <div className="chip-group">
                  <button className="chip active" type="button">Có (sau gợi ý cuối)</button>
                  <button className="chip" type="button">Không bao giờ</button>
                </div>
              </div>
              <div className="field">
                <label>Cho phép hỏi AI trong khi làm đề?</label>
                <div className="chip-group">
                  <button className="chip" type="button">Cho phép</button>
                  <button className="chip active" type="button">Khoá (mặc định)</button>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Tính năng cấu hình LLM provider/API key đang trong kế hoạch phát triển.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
