import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { getActiveSchools } from "@/lib/schools";
import { getQuietHours } from "@/lib/app-settings";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Card, Pill } from "@/components/ui";
import { Radar } from "@/components/Radar";

const SCHOOL_EXAMPLES: Record<string, { bank: string; difficulty: string }> = {
  cg: {
    bank: "Dựa trên lịch sử đề bài của CG kết hợp đề phỏng tạo bám sát phong cách: thiên về trắc nghiệm có thêm một phần điền nhanh, nặng số học và suy luận.",
    difficulty: "Trung bình – khó: nhiều câu chuyển đổi đơn vị, bài toán chuyển động và logic chuỗi.",
  },
  ntt: {
    bank: "Dựa trên lịch sử đề bài của NTT: kết hợp trắc nghiệm và một số câu tự luận ngắn, phong cách đề Olympic nhẹ.",
    difficulty: "Khó hơn mặt bằng chung: tỉ lệ câu Olympic nhẹ rõ rệt, đặc biệt ở tổ hợp và hình học.",
  },
  ltv: {
    bank: "Dựa trên lịch sử đề bài của LTV kết hợp đề phỏng tạo bám sát: nặng phần đại số cơ bản, phân số, tỉ số.",
    difficulty: "Trung bình: kiểm tra nền vững — phân số, tỉ số, tính nhanh.",
  },
  tx: {
    bank: "Dựa trên lịch sử đề bài của TX kết hợp đề phỏng tạo: nhiều dạng câu hỗn hợp, lời văn dài.",
    difficulty: "Trung bình – khó: nhiều câu lời văn, đo khả năng đọc hiểu đề.",
  },
};

const SAMPLE_RADAR = [
  { label: "Phân số", value: 0.62 },
  { label: "Hình học", value: 0.4 },
  { label: "Số học", value: 0.78 },
  { label: "Tỉ số", value: 0.55 },
  { label: "C.động", value: 0.38 },
  { label: "Suy luận", value: 0.7 },
  { label: "Tổ hợp", value: 0.48 },
  { label: "Đại lượng", value: 0.66 },
];

const SAMPLE_TOPIC_BARS: { label: string; value: number }[] = [
  { label: "Số học", value: 78 },
  { label: "Phân số", value: 62 },
  { label: "Suy luận", value: 70 },
  { label: "Tỉ số", value: 55 },
  { label: "Hình học", value: 40 },
  { label: "C.động", value: 32 },
];

function MiniBars({ items }: { items: { label: string; value: number }[] }) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const weakestIdx = sorted.length - 1;
  return (
    <div className="col" style={{ gap: 6, width: "100%" }}>
      {sorted.map((it, i) => {
        const isWeak = i === weakestIdx;
        return (
          <div key={it.label} className="row" style={{ gap: 8, fontSize: 12 }}>
            <span
              style={{
                width: 64,
                color: isWeak ? "var(--accent-ink)" : "var(--ink-soft)",
                fontWeight: isWeak ? 600 : 400,
              }}
            >
              {it.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 8,
                background: "var(--surface-sunk)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${it.value}%`,
                  height: "100%",
                  background: isWeak ? "var(--accent)" : "var(--ink-faint)",
                  opacity: isWeak ? 1 : 0.55,
                }}
              />
            </div>
            <span
              style={{
                width: 30,
                textAlign: "right",
                fontFamily: "var(--font-mono)",
                color: "var(--ink-muted)",
              }}
            >
              {it.value}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MiniCalendar() {
  return (
    <svg viewBox="0 0 180 120" style={{ width: "100%", maxWidth: 220 }}>
      {[0, 1, 2].map((i) => {
        const x = 10 + i * 58;
        return (
          <g key={i}>
            <rect
              x={x}
              y={24}
              width={50}
              height={80}
              rx={6}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <rect x={x} y={24} width={50} height={16} rx={6} fill="var(--accent-soft)" />
            <line x1={x + 14} y1={18} x2={x + 14} y2={30} stroke="var(--ink-soft)" strokeWidth={2} strokeLinecap="round" />
            <line x1={x + 36} y1={18} x2={x + 36} y2={30} stroke="var(--ink-soft)" strokeWidth={2} strokeLinecap="round" />
            <circle cx={x + 25} cy={62} r={10} fill="var(--accent)" />
            <path
              d={`M${x + 19} ${62} L${x + 23} ${66} L${x + 31} ${58}`}
              stroke="white"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={x + 25}
              y={92}
              textAnchor="middle"
              fontSize={9}
              fill="var(--ink-muted)"
              fontFamily="var(--font-sans)"
            >
              Tháng {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function FlowDiagram() {
  const steps: { icon: "pencil" | "trend" | "school" | "target"; label: string }[] = [
    { icon: "pencil", label: "Học sinh làm bài" },
    { icon: "trend", label: "Cập nhật mastery 10 chuyên đề" },
    { icon: "school", label: "Khớp với hồ sơ trường" },
    { icon: "target", label: "Chỉ số sẵn sàng" },
  ];
  return (
    <div className="row" style={{ gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
      {steps.map((s, i) => (
        <div key={s.label} className="row" style={{ gap: 6 }}>
          <div
            className="col"
            style={{
              alignItems: "center",
              gap: 6,
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "var(--surface)",
              minWidth: 110,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--accent-ink)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name={s.icon} size={16} />
            </div>
            <span style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", lineHeight: 1.3 }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <Icon name="arrow" size={14} style={{ color: "var(--ink-faint)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default async function GuidePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);

  const [schools, quietHours] = await Promise.all([
    getActiveSchools(),
    getQuietHours(),
  ]);
  const featuredSchools = schools.filter((s) => SCHOOL_EXAMPLES[s.id]).slice(0, 4);

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Trang chính", href: "/home" }, "Hướng dẫn sử dụng"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Giới thiệu &amp; hướng dẫn sử dụng</h2>
            <p>
              Tổng quan giải pháp Khỉ con, cách dùng hiệu quả, phương pháp đánh giá &amp; chấm điểm,
              ví dụ bộ đề từng trường, cùng vài lưu ý sức khoẻ cho các con.
            </p>
          </div>
          <Pill tone="info" dot>
            Đang đăng nhập: <b style={{ marginLeft: 4 }}>{user.name ?? user.email ?? "—"}</b>
          </Pill>
        </div>

        <div className="col" style={{ gap: 16 }}>
          {/* ── 1. Giới thiệu giải pháp ────────────────────────────── */}
          <Card
            title="1 · Khỉ con là gì?"
            sub="Luyện thi toán cá nhân hoá cho học sinh lớp 5 vào lớp 6 trường chất lượng cao."
          >
            <div
              className="grid"
              style={{ gridTemplateColumns: "1.4fr 1fr", gap: 18, alignItems: "center" }}
            >
              <div className="col" style={{ gap: 10, fontSize: 14, lineHeight: 1.6 }}>
                <p style={{ margin: 0 }}>
                  Khỉ con không phải một &ldquo;app làm đề&rdquo; thông thường. Hệ thống đo năng lực
                  thực của từng học sinh theo <b>10 chuyên đề</b> toán lớp 4–5, sau đó tự lựa chọn
                  đề và bài tập đúng dạng các con còn yếu — thay vì học tràn lan.
                </p>
                <p style={{ margin: 0 }}>
                  Ba mẹ luôn nhìn thấy chỉ số <b>sẵn sàng theo từng trường mục tiêu</b>, cập nhật
                  sau mỗi bài làm và tăng dần đến ngày thi.
                </p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Ngân hàng đề thật của các trường top Hà Nội + đề phỏng tạo bám sát phong cách.</li>
                  <li>Gia sư AI gợi mở từng bước, không đưa thẳng đáp án.</li>
                  <li>Báo cáo tiến độ chi tiết cho phụ huynh.</li>
                </ul>
              </div>
              <div
                className="col"
                style={{
                  alignItems: "center",
                  gap: 8,
                  padding: 14,
                  background: "var(--surface-sunk)",
                  borderRadius: 12,
                }}
              >
                <Radar data={SAMPLE_RADAR} size={220} max={1} />
                <span style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                  Ví dụ minh hoạ — radar năng lực 10 chuyên đề
                </span>
              </div>
            </div>
          </Card>

          {/* ── 2. Cách dùng hiệu quả (NEW) ────────────────────────── */}
          <Card
            title="2 · Cách dùng hiệu quả"
            sub="Ba thói quen học giúp các con tiến bộ nhanh và đều."
          >
            <div className="grid cols-3" style={{ gap: 14 }}>
              {/* A. Chọn chuyên đề yếu */}
              <div
                className="col"
                style={{
                  gap: 10,
                  padding: 14,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--surface)",
                }}
              >
                <div className="row" style={{ gap: 8 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "var(--accent-soft)",
                      color: "var(--accent-ink)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="bolt" size={16} />
                  </div>
                  <b style={{ fontSize: 14 }}>Chọn chuyên đề đang yếu</b>
                </div>
                <MiniBars items={SAMPLE_TOPIC_BARS} />
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
                  Trang &ldquo;Luyện chuyên đề&rdquo; xếp các chuyên đề theo mức thành thạo. Bấm vào chuyên đề
                  thấp nhất để luyện thêm bài đúng dạng — bù lỗ hổng nhanh hơn là làm đề trộn.
                </p>
              </div>

              {/* B. Radar */}
              <div
                className="col"
                style={{
                  gap: 10,
                  padding: 14,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--surface)",
                }}
              >
                <div className="row" style={{ gap: 8 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "var(--accent-soft)",
                      color: "var(--accent-ink)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="target" size={16} />
                  </div>
                  <b style={{ fontSize: 14 }}>Theo dõi qua radar</b>
                </div>
                <div style={{ display: "grid", placeItems: "center" }}>
                  <Radar data={SAMPLE_RADAR} size={180} max={1} />
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
                  Tại bất kỳ thời điểm nào, nhìn vào radar năng lực để thấy ngay các đỉnh
                  &ldquo;lõm&rdquo; — đó là hướng nên cải thiện tiếp theo, không phải đoán mò.
                </p>
              </div>

              {/* C. Kiểm tra định kỳ */}
              <div
                className="col"
                style={{
                  gap: 10,
                  padding: 14,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--surface)",
                }}
              >
                <div className="row" style={{ gap: 8 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: "var(--accent-soft)",
                      color: "var(--accent-ink)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="clock" size={16} />
                  </div>
                  <b style={{ fontSize: 14 }}>Kiểm tra định kỳ hàng tháng</b>
                </div>
                <div style={{ display: "grid", placeItems: "center" }}>
                  <MiniCalendar />
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.55 }}>
                  Nên làm <b>một bài kiểm tra toàn diện mỗi tháng</b> để có bức tranh tổng thể về các
                  kỹ năng. Kết quả mỗi tháng giúp đánh giá tiến độ thật và điều chỉnh kế hoạch luyện.
                </p>
              </div>
            </div>
          </Card>

          {/* ── 3. Phương pháp đánh giá & chấm điểm ─────────────────── */}
          <Card
            title="3 · Phương pháp đánh giá &amp; chấm điểm"
            sub="Cách hệ thống đo năng lực và tính điểm mỗi bài."
          >
            <div className="col" style={{ gap: 14, fontSize: 14, lineHeight: 1.6 }}>
              <div
                style={{
                  padding: 12,
                  background: "var(--surface-sunk)",
                  borderRadius: 10,
                }}
              >
                <FlowDiagram />
              </div>
              <div>
                <h4 style={{ margin: "0 0 6px" }}>Đo năng lực theo 10 chuyên đề</h4>
                <p style={{ margin: 0 }}>
                  Mỗi câu hỏi thuộc một chuyên đề (phân số, hình học, chuyển động, tỉ số, suy luận…).
                  Khi học sinh làm đúng/sai, mức thành thạo (<i>topic mastery</i>) ở chuyên đề đó được
                  cập nhật trong khoảng <b>0 → 100%</b>. Trang &ldquo;Luyện chuyên đề&rdquo; hiển thị tỉ lệ này.
                </p>
              </div>
              <div>
                <h4 style={{ margin: "0 0 6px" }}>Chấm điểm theo loại câu</h4>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    <b>Trắc nghiệm (A/B/C/D):</b> so khớp đúng đáp án — 1 điểm/câu cơ bản, 2 điểm/câu khó tuỳ đề trường.
                  </li>
                  <li>
                    <b>Điền số:</b> chấp nhận số ở nhiều dạng — <code>6</code>, <code>a=6</code>,
                    {" "}<code>32,5</code>, <code>5;32</code>, <code>mẹ 32, con 5</code>… miễn là giá trị đúng.
                    Hệ thống tự nhận dạng dạng câu trả lời và chuẩn hoá để so sánh.
                  </li>
                  <li>
                    <b>Tự luận:</b> ghi nhận đã làm, không chấm tự động. Lời giải mẫu hiển thị sau khi nộp.
                  </li>
                </ul>
              </div>
              <div>
                <h4 style={{ margin: "0 0 6px" }}>Chỉ số sẵn sàng theo trường</h4>
                <p style={{ margin: 0 }}>
                  Mỗi trường có &ldquo;hồ sơ đề&rdquo; riêng — tỉ trọng các chuyên đề, độ khó trung bình,
                  thời lượng. Chỉ số sẵn sàng được tính bằng cách <b>khớp mức mastery của học sinh</b> với
                  &ldquo;hồ sơ đề&rdquo; của trường đó. Cùng một học sinh có thể sẵn sàng 75% với trường A
                  nhưng chỉ 50% với trường B nếu B nặng chuyên đề con đang yếu.
                </p>
              </div>
            </div>
          </Card>

          {/* ── 4. Cách xây bộ đề theo trường ──────────────────────── */}
          <Card
            title="4 · Cách xây bộ đề &amp; đánh giá độ khó từng trường"
            sub="Mỗi trường có phong cách đề riêng — Khỉ con bám sát phong cách đó. Bộ đề liên tục được cập nhật theo năm thi mới."
          >
            <div className="grid cols-2" style={{ gap: 12 }}>
              {featuredSchools.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  Chưa có trường nào được kích hoạt. Quản trị viên có thể bật trong{" "}
                  <code>/admin?tab=schools</code>.
                </p>
              ) : null}
              {featuredSchools.map((s) => {
                const ex = SCHOOL_EXAMPLES[s.id];
                return (
                  <div
                    key={s.id}
                    className="card"
                    style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "var(--accent-soft)",
                          color: "var(--accent-ink)",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <Icon name="school" size={16} />
                      </div>
                      <span className={`pill ${s.tone}`}>{s.short}</span>
                      <b style={{ fontSize: 14 }}>{s.full}</b>
                      <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 12 }}>
                        ⏱ {s.minutes} phút
                      </span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.55 }}>
                      <div style={{ marginBottom: 4 }}>
                        <b>Cách xây bộ đề:</b> {ex.bank}
                      </div>
                      <div>
                        <b>Độ khó:</b> {ex.difficulty}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── 5. Khuyến cáo sức khoẻ ─────────────────────────────── */}
          <Card
            title="5 · Khuyến cáo sức khoẻ cho các con"
            sub="Học hiệu quả luôn đi kèm bảo vệ thị lực và giấc ngủ."
          >
            <div className="col" style={{ gap: 10, fontSize: 14, lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                Khỉ con là một công cụ phụ trợ — không thay thế việc luyện tập trên giấy, vận động và nghỉ ngơi.
                Vui lòng lưu ý:
              </p>
              <div className="col" style={{ gap: 8 }}>
                {[
                  {
                    icon: "eye" as const,
                    text: (
                      <>
                        <b>Hạn chế sử dụng thiết bị điện tử.</b> Khuyến nghị{" "}
                        <b>không quá 1 giờ/ngày</b> cho học sinh tiểu học, chia thành nhiều phiên ngắn
                        (mỗi phiên 20–30 phút) và cứ 20 phút nhìn ra xa 20 giây.
                      </>
                    ),
                  },
                  {
                    icon: "pencil" as const,
                    text: (
                      <>
                        Ưu tiên <b>ghi ra giấy</b> các bài cần trình bày lời giải; chỉ nhập vào app phần đáp số.
                      </>
                    ),
                  },
                  {
                    icon: "bolt" as const,
                    text: <>Khoảng cách mắt – màn hình tối thiểu 50cm; đủ ánh sáng phòng.</>,
                  },
                  {
                    icon: "user" as const,
                    text: <>Có người lớn đồng hành ở các phiên đầu để hướng dẫn cách dùng.</>,
                  },
                ].map((it, i) => (
                  <div key={i} className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: "var(--accent-soft)",
                        color: "var(--accent-ink)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon name={it.icon} size={14} />
                    </div>
                    <div style={{ flex: 1 }}>{it.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── 6. Giờ ngừng hoạt động ─────────────────────────────── */}
          <Card
            title="6 · Giờ ngừng hoạt động của hệ thống"
            sub="Khoá truy cập tự động để bảo vệ giấc ngủ — do quản trị viên thiết lập."
          >
            <div className="col" style={{ gap: 10, fontSize: 14, lineHeight: 1.6 }}>
              {quietHours.enabled ? (
                <>
                  <p style={{ margin: 0 }}>
                    Hệ thống sẽ <b>tự động khoá</b> trong khung giờ:
                  </p>
                  <div
                    className="row"
                    style={{
                      gap: 12,
                      alignItems: "center",
                      background: "var(--bg-subtle)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontFamily: "var(--mono)",
                      fontSize: 18,
                    }}
                  >
                    <Icon name="clock" />
                    <b>
                      {quietHours.start} – {quietHours.end}
                    </b>
                    <span style={{ color: "var(--muted)", fontSize: 13 }}>
                      (giờ Việt Nam, GMT+7)
                    </span>
                  </div>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                    Trong khoảng thời gian này, các con sẽ không vào được trang luyện tập. Hãy nghỉ ngơi,
                    đi ngủ đúng giờ và quay lại học sau {quietHours.end} sáng nhé.
                  </p>
                </>
              ) : (
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  Hiện tại quản trị viên đang để hệ thống mở 24/7. Hãy tự thu xếp giờ học phù hợp để
                  đảm bảo nghỉ ngơi đầy đủ.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
