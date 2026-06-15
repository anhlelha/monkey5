import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { getActiveSchools } from "@/lib/schools";
import { getQuietHours } from "@/lib/app-settings";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Card, Pill } from "@/components/ui";

const SCHOOL_EXAMPLES: Record<string, { bank: string; difficulty: string }> = {
  cg: {
    bank: "Đề chính thức 2018→2024 + đề phỏng tạo bám sát: 60 phút, 30 câu trắc nghiệm + 5 câu điền nhanh, ưu tiên số học & suy luận.",
    difficulty: "Trung bình – khó: nhiều câu chuyển đổi đơn vị, bài toán chuyển động và logic chuỗi.",
  },
  ntt: {
    bank: "Đề thật của Nguyễn Tất Thành 2019→2024: 60 phút, 25 câu trắc nghiệm + 3 câu tự luận ngắn.",
    difficulty: "Khó hơn mặt bằng chung: tỉ lệ câu Olympic nhẹ ~25%, đặc biệt là tổ hợp & hình học.",
  },
  ltv: {
    bank: "Đề Lương Thế Vinh các năm + đề phỏng tạo: 45 phút, 25 câu, nặng phần đại số cơ bản.",
    difficulty: "Trung bình: kiểm tra nền vững — phân số, tỉ số, tính nhanh.",
  },
  tx: {
    bank: "Đề THCS Thanh Xuân 2020→2024 + đề phỏng tạo: 60 phút, 20 câu hỗn hợp.",
    difficulty: "Trung bình – khó: nhiều câu lời văn dài, đo khả năng đọc hiểu đề.",
  },
};

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
              Tổng quan giải pháp Khỉ con, cách hệ thống đánh giá năng lực và chấm điểm,
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
            <div className="col" style={{ gap: 10, fontSize: 14, lineHeight: 1.6 }}>
              <p>
                Khỉ con không phải một &ldquo;app làm đề&rdquo; thông thường. Hệ thống đo năng lực
                thực của từng học sinh theo <b>10 chuyên đề</b> toán lớp 4–5, sau đó tự lựa chọn
                đề và bài tập đúng dạng các con còn yếu, thay vì học tràn lan.
              </p>
              <p>
                Ba mẹ luôn nhìn thấy chỉ số <b>sẵn sàng theo từng trường mục tiêu</b> — cập nhật
                sau mỗi bài làm và tăng dần đến ngày thi.
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>Ngân hàng đề thật của các trường top Hà Nội + đề phỏng tạo bám sát phong cách.</li>
                <li>Gia sư AI gợi mở từng bước, không đưa thẳng đáp án.</li>
                <li>Báo cáo tiến độ chi tiết cho phụ huynh.</li>
              </ul>
            </div>
          </Card>

          {/* ── 2. Phương pháp đánh giá & chấm điểm ─────────────────── */}
          <Card
            title="2 · Phương pháp đánh giá &amp; chấm điểm"
            sub="Cách hệ thống đo năng lực và tính điểm mỗi bài."
          >
            <div className="col" style={{ gap: 14, fontSize: 14, lineHeight: 1.6 }}>
              <div>
                <h4 style={{ margin: "0 0 6px" }}>Đo năng lực theo 10 chuyên đề</h4>
                <p style={{ margin: 0 }}>
                  Mỗi câu hỏi thuộc một chuyên đề (phân số, hình học, chuyển động, tỉ số, suy luận…).
                  Khi học sinh làm đúng/sai, mức thành thạo (<i>topic mastery</i>) ở chuyên đề đó
                  được cập nhật trong khoảng <b>0 → 100%</b>. Trang &ldquo;Luyện chuyên đề&rdquo; hiển thị tỉ lệ này.
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
                    <code>32,5</code>, <code>5;32</code>, <code>mẹ 32, con 5</code>… miễn là giá trị đúng.
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

          {/* ── 3. Cách xây bộ đề theo trường ──────────────────────── */}
          <Card
            title="3 · Cách xây bộ đề &amp; đánh giá độ khó từng trường"
            sub="Ví dụ một số trường tiêu biểu. Bộ đề liên tục được cập nhật theo năm thi mới."
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

          {/* ── 4. Khuyến cáo sức khoẻ ─────────────────────────────── */}
          <Card
            title="4 · Khuyến cáo sức khoẻ cho các con"
            sub="Học hiệu quả luôn đi kèm bảo vệ thị lực và giấc ngủ."
          >
            <div className="col" style={{ gap: 10, fontSize: 14, lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                Khỉ con là một công cụ phụ trợ — không thay thế việc luyện tập trên giấy, vận động và nghỉ ngơi.
                Vui lòng lưu ý:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>
                  <b>Hạn chế sử dụng thiết bị điện tử.</b> Khuyến nghị
                  {" "}<b>không quá 1 giờ/ngày</b> cho học sinh tiểu học, chia thành nhiều phiên ngắn
                  (mỗi phiên 20–30 phút) và cứ 20 phút nhìn ra xa 20 giây.
                </li>
                <li>
                  Ưu tiên <b>ghi ra giấy</b> các bài cần trình bày lời giải; chỉ nhập vào app phần đáp số.
                </li>
                <li>Khoảng cách mắt – màn hình tối thiểu 50cm; đủ ánh sáng phòng.</li>
                <li>Có người lớn đồng hành ở các phiên đầu để hướng dẫn cách dùng.</li>
              </ul>
            </div>
          </Card>

          {/* ── 5. Giờ ngừng hoạt động ─────────────────────────────── */}
          <Card
            title="5 · Giờ ngừng hoạt động của hệ thống"
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
