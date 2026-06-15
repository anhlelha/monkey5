import Script from "next/script";
import { TryButton } from "./TryButton";
import { LandingNavActions, LandingHeroActions } from "./LandingUserActions";

interface LandingUser {
  name: string | null;
  image: string | null;
  role: string;
}

type LandingTheme = "clay" | "ocean" | "forest" | "grape" | "coral";

interface LandingQuietHours {
  enabled: boolean;
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

interface LandingProps {
  hasGoogle: boolean;
  user?: LandingUser | null;
  theme?: LandingTheme;
  quietHours?: LandingQuietHours;
}

const DEFAULT_QUIET_HOURS: LandingQuietHours = { enabled: true, start: "22:00", end: "07:00" };

function parseHHmmHours(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) + (Number.isFinite(m) ? m : 0) / 60;
}

interface TimelineSegment {
  kind: "day" | "night";
  hours: number;
}

function buildTimeline(qh: LandingQuietHours): TimelineSegment[] {
  const s = parseHHmmHours(qh.start);
  const e = parseHHmmHours(qh.end);
  if (s === e) return [{ kind: "day", hours: 24 }];
  if (s > e) {
    // Wraps midnight: night(0→e) day(e→s) night(s→24)
    return [
      { kind: "night", hours: e },
      { kind: "day", hours: s - e },
      { kind: "night", hours: 24 - s },
    ];
  }
  // Same-day window: day(0→s) night(s→e) day(e→24)
  return [
    { kind: "day", hours: s },
    { kind: "night", hours: e - s },
    { kind: "day", hours: 24 - e },
  ];
}

function studyWindowLabel(qh: LandingQuietHours): string {
  const s = parseHHmmHours(qh.start);
  const e = parseHHmmHours(qh.end);
  if (s > e) return `${qh.end}–${qh.start}`; // wraps: study window is end → start
  return `00:00–${qh.start}, ${qh.end}–24:00`;
}

function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  );
}

function SunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </svg>
  );
}

// SVG icon for the right-arrow inside primary CTAs
function ArrowIcon() {
  return (
    <svg
      className="arrow"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Small check icon used in pricing feature lists
function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// Plus icon for FAQ <summary>
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function Landing({ hasGoogle, user, theme = "ocean", quietHours = DEFAULT_QUIET_HOURS }: LandingProps) {
  const isLoggedIn = Boolean(user);
  const safeTheme = JSON.stringify(theme);
  const segments = buildTimeline(quietHours);
  const studyRange = studyWindowLabel(quietHours);
  return (
    <>
      <link rel="stylesheet" href="/landing.css" />
      <Script id="landing-tweaks" strategy="beforeInteractive">
        {`window.TWEAKS = { theme: ${safeTheme} };`}
      </Script>
      <Script src="/landing.js" strategy="afterInteractive" />

      {/* ============================ NAV ============================ */}
      <header className="nav" id="nav">
        <div className="wrap">
          <a className="brand" href="#top">
            <span className="brand-mark">K</span>
            <span className="name">
              <b>Khỉ con vào lớp 6 CLC</b>
              <span>Luyện thi toán · Lớp 5</span>
            </span>
          </a>
          <nav className="nav-links">
            <a href="#features">Tính năng</a>
            <a href="#how">Cách hoạt động</a>
            <a href="#pricing">Bảng giá</a>
            <a href="#faq">Câu hỏi</a>
          </nav>
          <div className="nav-cta">
            {isLoggedIn && user ? (
              <LandingNavActions user={user} />
            ) : (
              <>
                <TryButton plan="login" hasGoogle={hasGoogle} className="btn ghost">
                  Đăng nhập
                </TryButton>
                <TryButton plan="free" hasGoogle={hasGoogle} className="btn primary">
                  Dùng thử miễn phí
                </TryButton>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================ HERO ============================ */}
      <section className="hero" id="top">
        <div className="wrap">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="dot"></span>Luyện thi vào các trường top Hà Nội
            </span>
            <h1>
              Lộ trình <span className="hl">cá nhân hoá</span> đưa con vào lớp 6 trường chất lượng cao
            </h1>
            <p className="lead">
              Ứng dụng luyện thi toán dành riêng cho học sinh lớp 5: đo đúng điểm mạnh — yếu, luyện đúng dạng đề của từng trường, và cho ba mẹ thấy chỉ số sẵn sàng tăng dần đến ngày thi.
            </p>
            <div className="hero-actions">
              {isLoggedIn && user ? (
                <LandingHeroActions user={user} size="lg" />
              ) : (
                <>
                  <TryButton plan="free" hasGoogle={hasGoogle} className="btn primary lg">
                    Dùng thử miễn phí <ArrowIcon />
                  </TryButton>
                  <a className="btn lg" href="#how">
                    Xem cách hoạt động
                  </a>
                </>
              )}
            </div>
            <div className="hero-trust">
              <span className="lbl">Bám sát đề thi thật của các trường CLC hàng đầu Hà Nội:</span>
              <div className="school-chips">
                <span className="school-chip"><span className="tag cg">CG</span>THCS Cầu Giấy</span>
                <span className="school-chip"><span className="tag arc">ARC</span>Archimedes</span>
                <span className="school-chip"><span className="tag ntt">NTT</span>Nguyễn Tất Thành</span>
                <span className="school-chip"><span className="tag ltv">LTV</span>Lương Thế Vinh</span>
                <span className="school-chip"><span className="tag ns">NS</span>Ngôi Sao Hà Nội</span>
                <span className="school-chip"><span className="tag tx">TX</span>Thanh Xuân</span>
                <span className="school-chip more">+ nhiều trường khác</span>
              </div>
            </div>
          </div>

          {/* Animated product preview */}
          <div className="hero-stage" id="stage">
            <div className="float float-spark bob" id="fl-spark">
              <div className="k">Tiến bộ tuần này</div>
              <div className="v">
                +12<span>%</span>
              </div>
              <svg width="120" height="30" viewBox="0 0 120 30" fill="none">
                <path
                  d="M2 24 L20 21 L38 22 L56 15 L74 16 L92 9 L118 4"
                  stroke="var(--success)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 24 L20 21 L38 22 L56 15 L74 16 L92 9 L118 4 L118 30 L2 30 Z"
                  fill="var(--success-soft)"
                  opacity="0.6"
                />
              </svg>
            </div>

            <div className="float float-badges bob b2" id="fl-badges">
              <span className="ttl">Trường mục tiêu</span>
              <div className="cluster">
                <span className="b cg" style={{ "--d": "0ms" } as React.CSSProperties}>CG</span>
                <span className="b ntt" style={{ "--d": "90ms" } as React.CSSProperties}>NTT</span>
                <span className="b ltv" style={{ "--d": "180ms" } as React.CSSProperties}>LTV</span>
                <span className="b ns" style={{ "--d": "270ms" } as React.CSSProperties}>NS</span>
              </div>
            </div>

            <div className="preview" id="preview">
              <div className="preview-head">
                <div className="avatar">MA</div>
                <div className="who">
                  <b>Minh Anh</b>
                  <span>Lớp 5 · còn 80 ngày đến kỳ thi</span>
                </div>
                <span className="live"><span className="dot"></span>Đang học</span>
              </div>

              <div className="preview-route">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M14 7h7v7" />
                </svg>
                Lộ trình cá nhân hoá · cập nhật theo mỗi bài làm
              </div>

              <div className="preview-label">
                Chỉ số sẵn sàng theo trường
                <span className="up">▲ tăng dần</span>
              </div>

              <div className="ready-list" id="readyList">
                <div className="ready-row" data-target="71">
                  <span className="badge cg">CG</span>
                  <span className="meter"><i className="cg"></i></span>
                  <span className="pct">0%</span>
                </div>
                <div className="ready-row" data-target="58">
                  <span className="badge ntt">NTT</span>
                  <span className="meter"><i className="ntt"></i></span>
                  <span className="pct">0%</span>
                </div>
                <div className="ready-row" data-target="49">
                  <span className="badge ltv">LTV</span>
                  <span className="meter"><i className="ltv"></i></span>
                  <span className="pct">0%</span>
                </div>
                <div className="ready-row" data-target="64">
                  <span className="badge ns">NS</span>
                  <span className="meter"><i className="ns"></i></span>
                  <span className="pct">0%</span>
                </div>
              </div>

              <div className="preview-divider"></div>

              <div className="preview-label">
                Tiến bộ theo nhóm chuyên đề
                <span className="up">▲ mở rộng</span>
              </div>
              <div className="radar-wrap">
                <svg id="radarSvg" viewBox="0 0 240 188" aria-hidden="true"></svg>
              </div>
              <div className="radar-legend">
                <span><i className="dash"></i>Lúc bắt đầu</span>
                <span><i className="solid"></i>Hiện tại</span>
              </div>
            </div>

            <div className="float float-tutor bob b3" id="fl-tutor">
              <div className="top"><span className="ai">AI</span><b>Gia sư Khỉ con</b></div>
              <p>
                Câu này con hỏi km/giờ — nhớ <span className="em">đổi đơn vị</span> về km và giờ trước khi tính nhé!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section className="section alt" id="features">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow"><span className="dot"></span>Vì sao chọn Khỉ con</span>
            <h2>Học đúng thứ con cần, không học dàn trải</h2>
            <p>Mỗi học sinh có một lộ trình riêng — dựa trên năng lực thật và trường con muốn thi.</p>
          </div>

          <div className="feature-grid">
            <div className="feature reveal">
              <div className="ico">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83" />
                </svg>
              </div>
              <h3>Lộ trình cá nhân hoá</h3>
              <p>Bài kiểm tra đầu vào đo năng lực theo 10 chuyên đề. App tự chọn đúng dạng bài con còn yếu để luyện, thay vì học tràn lan.</p>
              <div className="tags"><span>10 chuyên đề</span><span>Theo điểm yếu</span><span>Tự điều chỉnh</span></div>
            </div>

            <div className="feature t-cg reveal">
              <div className="ico">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                  <path d="M8 11h6M11 8v6" />
                </svg>
              </div>
              <h3>Gia sư AI theo phương pháp gợi mở</h3>
              <p>Không đưa đáp án ngay. Gia sư AI dẫn dắt từng bước để con tự nghĩ ra cách giải — và hiểu chỗ sai của mình.</p>
              <div className="tags"><span>Gợi ý từng bước</span><span>Giải thích lỗi sai</span><span>24/7</span></div>
            </div>

            <div className="feature t-ntt reveal">
              <div className="ico">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
                  <path d="M14 3v6h6M8 13h8M8 17h5" />
                </svg>
              </div>
              <h3>Ngân hàng đề thi thật</h3>
              <p>Đề chính thức các năm của Cầu Giấy, Archimedes, NTT, Lương Thế Vinh, Ngôi Sao, Thanh Xuân… — kèm đề phỏng tạo bám sát phong cách và thời lượng riêng của từng trường.</p>
              <div className="tags"><span>Đề chính thức</span><span>Đề phỏng tạo</span><span>Đúng định dạng</span></div>
            </div>

            <div className="feature t-ns reveal">
              <div className="ico">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M7 15l4-5 3 3 5-7" />
                </svg>
              </div>
              <h3>Chỉ số sẵn sàng theo trường</h3>
              <p>Ba mẹ luôn biết con đang ở đâu: % sẵn sàng cho từng trường mục tiêu, cập nhật sau mỗi bài làm và tăng dần đến ngày thi.</p>
              <div className="tags"><span>Theo dõi tiến độ</span><span>Báo cáo rõ ràng</span><span>An tâm</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow"><span className="dot"></span>Cách hoạt động</span>
            <h2>Bốn bước để bắt đầu</h2>
            <p>Chỉ vài phút để thiết lập, sau đó con luyện theo lộ trình được cá nhân hoá mỗi ngày.</p>
          </div>

          <div className="steps">
            <div className="step reveal">
              <div className="n">1</div>
              <h3>Chọn trường mục tiêu</h3>
              <p>Đặt 1–2 trường CLC con muốn thi. Mỗi trường có định dạng đề và phong cách riêng.</p>
            </div>
            <div className="step reveal">
              <div className="n">2</div>
              <h3>Làm bài kiểm tra đầu vào</h3>
              <p>App đo điểm mạnh — yếu của con trên 10 chuyên đề toán lớp 4–5.</p>
            </div>
            <div className="step reveal">
              <div className="n">3</div>
              <h3>Luyện theo lộ trình riêng</h3>
              <p>Đề và chuyên đề được chọn đúng nhu cầu, gia sư AI đồng hành từng bước.</p>
            </div>
            <div className="step reveal">
              <div className="n">4</div>
              <h3>Theo dõi chỉ số sẵn sàng</h3>
              <p>Xem % sẵn sàng cho từng trường tăng dần — biết khi nào con đã sẵn sàng thi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ STATS ============================ */}
      <section className="section alt">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow"><span className="dot"></span>Con số</span>
            <h2>Đủ rộng để luyện, đủ sâu để giỏi</h2>
          </div>
          <div className="stats reveal" id="stats">
            <div className="stat-cell">
              <div className="v" data-count="12" data-suffix="+">0</div>
              <div className="k">Trường CLC mục tiêu</div>
              <div className="sub">Cầu Giấy · Archimedes · NTT · LTV · Ngôi Sao…</div>
            </div>
            <div className="stat-cell">
              <div className="v" data-count="10">0</div>
              <div className="k">Chuyên đề toán</div>
              <div className="sub">Bám sát đề thi lớp 6 CLC</div>
            </div>
            <div className="stat-cell">
              <div className="v" data-count="2000" data-suffix="+">0</div>
              <div className="k">Câu hỏi &amp; đề luyện tập</div>
              <div className="sub">Không giới hạn với gói VIP</div>
            </div>
            <div className="stat-cell">
              <div className="v" data-text="24/7">24/7</div>
              <div className="k">Gia sư AI đồng hành</div>
              <div className="sub">Gợi ý ngay khi con bí</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ HEALTH / WELLBEING ============================ */}
      <section className="section" id="health">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow"><span className="dot"></span>Học khoẻ, không học vội</span>
            <h2>Ôn luyện là tốt — nhưng con vẫn cần được là trẻ con</h2>
            <p>
              Chúng tôi tin một đứa trẻ học hiệu quả là một đứa trẻ được nghỉ ngơi đủ.
              App chủ động đặt ra giới hạn lành mạnh, thay vì khuyến khích con học không ngừng.
            </p>
          </div>

          <div className="health-grid reveal">
            <div className="health-items">
              <div className="health-item">
                <div className="ico" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <div className="body">
                  <h3>Giới hạn thời gian mỗi ngày</h3>
                  <p>
                    Mặc định tối đa <b>45 phút/ngày</b>. Hết hạn mức, app nhẹ nhàng mời con dừng lại —
                    ba mẹ có thể điều chỉnh.
                  </p>
                </div>
              </div>

              <div className="health-item">
                <div className="ico" aria-hidden="true">
                  <MoonIcon size={22} />
                </div>
                <div className="body">
                  <h3>Khoá nghỉ ban đêm</h3>
                  <p>
                    Từ <b>{quietHours.start} đến {quietHours.end}</b> app tự khoá để con đi ngủ đúng giờ.
                    Không học khuya, không màn hình trước giấc ngủ.
                  </p>
                </div>
              </div>

              <div className="health-item">
                <div className="ico" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="body">
                  <h3>Nhắc giải lao &amp; bảo vệ mắt</h3>
                  <p>
                    Sau mỗi <b>20 phút</b>, app nhắc con nghỉ mắt và vươn vai. Không xếp hạng,
                    không &ldquo;chuỗi ngày&rdquo; gây áp lực phải học liên tục.
                  </p>
                </div>
              </div>
            </div>

            <div className="health-panel" aria-label="Nhịp học lành mạnh trong ngày">
              <div className="health-panel-head">
                <b>Nhịp học lành mạnh trong ngày</b>
                <span className="health-pill">45 phút / ngày</span>
              </div>

              <div
                className="health-timeline"
                role="img"
                aria-label={`Khoá nghỉ ban đêm ${quietHours.start}–${quietHours.end}, giờ học ${studyRange}`}
              >
                {segments.map((seg, i) =>
                  seg.hours <= 0 ? null : (
                    <div
                      key={i}
                      className={`seg ${seg.kind}`}
                      style={{ flexGrow: seg.hours }}
                    >
                      {seg.hours >= 1.5 ? (
                        seg.kind === "night" ? <MoonIcon /> : <SunIcon />
                      ) : null}
                    </div>
                  ),
                )}
              </div>

              <div className="health-axis">
                <span>0h</span>
                <span>6h</span>
                <span>12h</span>
                <span>18h</span>
                <span>24h</span>
              </div>

              <div className="health-legend">
                <span><i className="day"></i>Giờ học ({studyRange})</span>
                <span><i className="night"></i>Khoá nghỉ ban đêm ({quietHours.start}–{quietHours.end})</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ PRICING ============================ */}
      <section className="section" id="pricing">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow"><span className="dot"></span>Bảng giá</span>
            <h2>Chọn gói phù hợp với con</h2>
            <p>Bắt đầu miễn phí. Nâng cấp bất cứ lúc nào khi con cần luyện sâu hơn.</p>
          </div>

          <div className="price-grid">
            {/* FREE */}
            <div className="plan reveal">
              <div className="tier">Free</div>
              <p className="tagline">Bắt đầu làm quen, không mất phí</p>
              <div className="price"><span className="amt">0đ</span></div>
              <div className="price-note">Miễn phí trọn đời</div>
              <TryButton plan="free" hasGoogle={hasGoogle} className="btn lg">
                Dùng thử miễn phí
              </TryButton>
              <div className="feat-head">Bao gồm</div>
              <ul>
                <li><CheckIcon />Đề thi chính thức các năm</li>
                <li><CheckIcon />Luyện chuyên đề cơ bản (L4–L5)</li>
                <li><CheckIcon />Chỉ số sẵn sàng cơ bản</li>
              </ul>
            </div>

            {/* PRO */}
            <div className="plan featured reveal">
              <span className="ribbon">Phổ biến nhất</span>
              <div className="tier">Pro</div>
              <p className="tagline">Luyện sâu, theo sát từng trường</p>
              <div className="price">
                <span className="amt">500K</span>
                <span className="per">/ năm</span>
              </div>
              <div className="price-note">≈ 42.000đ / tháng</div>
              <TryButton plan="pro" hasGoogle={hasGoogle} className="btn primary lg">
                Chọn gói Pro
              </TryButton>
              <div className="feat-head">Mọi thứ ở Free, cộng thêm</div>
              <ul>
                <li className="hl"><CheckIcon />Chuyên đề nâng cao (NC, Olympic nhẹ)</li>
                <li><CheckIcon />Đề phỏng tạo bám sát từng trường</li>
                <li><CheckIcon />Báo cáo tiến độ chi tiết cho ba mẹ</li>
              </ul>
            </div>

            {/* VIP */}
            <div className="plan reveal">
              <span className="ribbon" style={{ background: "var(--ink)", boxShadow: "none" }}>Trọn đời</span>
              <div className="tier">VIP</div>
              <p className="tagline">Toàn quyền, đồng hành đến ngày thi</p>
              <div className="price">
                <span className="amt">2tr</span>
                <span className="per">/ trọn đời</span>
              </div>
              <div className="price-note"><b>Trả một lần · dùng mãi mãi</b></div>
              <TryButton plan="vip" hasGoogle={hasGoogle} className="btn lg">
                Mua VIP trọn đời
              </TryButton>
              <div className="feat-head">Mọi thứ ở Pro, cộng thêm</div>
              <ul>
                <li className="hl"><CheckIcon />Số đề thi không giới hạn</li>
                <li className="hl"><CheckIcon />Gia sư AI 24/7 không giới hạn</li>
                <li><CheckIcon />Ưu tiên cập nhật đề mới mỗi năm</li>
              </ul>
            </div>
          </div>
          <p className="price-foot">Tất cả các gói đều dùng được ngay trên trình duyệt — không cần cài đặt. Hỗ trợ đổi/hoàn trong 7 ngày.</p>
        </div>
      </section>

      {/* ============================ FAQ ============================ */}
      <section className="section alt" id="faq">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow"><span className="dot"></span>Câu hỏi thường gặp</span>
            <h2>Ba mẹ thường hỏi</h2>
          </div>

          <div className="faq reveal">
            <details open>
              <summary>
                Con đang học lớp mấy thì dùng được?
                <span className="q-ico"><PlusIcon /></span>
              </summary>
              <div className="answer">
                <p>App dành cho học sinh lớp 5 ôn thi vào lớp 6 trường chất lượng cao. Nội dung bao quát toán lớp 4–5 và có cả phần nâng cao, nên học sinh lớp 4 muốn học sớm cũng phù hợp.</p>
              </div>
            </details>
            <details>
              <summary>
                Đề thi có sát thực tế không?
                <span className="q-ico"><PlusIcon /></span>
              </summary>
              <div className="answer">
                <p>Có. Chúng tôi số hoá đề thi chính thức các năm của từng trường và giữ đúng định dạng — số câu, thời lượng, tỉ lệ trắc nghiệm/điền/tự luận. Đề phỏng tạo cũng bám sát phong cách riêng của từng trường: Cầu Giấy, Archimedes, NTT, Lương Thế Vinh, Ngôi Sao, Thanh Xuân và nhiều trường CLC khác.</p>
              </div>
            </details>
            <details>
              <summary>
                Gia sư AI có làm hộ bài cho con không?
                <span className="q-ico"><PlusIcon /></span>
              </summary>
              <div className="answer">
                <p>Không. Gia sư AI đi theo phương pháp gợi mở: đặt câu hỏi và gợi ý từng bước để con tự tìm ra lời giải, đồng thời chỉ rõ con sai ở đâu. Mục tiêu là con <em>hiểu</em>, không phải chép đáp án.</p>
              </div>
            </details>
            <details>
              <summary>
                Gói VIP &quot;trọn đời&quot; nghĩa là gì?
                <span className="q-ico"><PlusIcon /></span>
              </summary>
              <div className="answer">
                <p>Trả một lần 2 triệu và dùng mãi mãi cho tài khoản của con — bao gồm mọi quyền lợi của Pro, số đề không giới hạn, gia sư AI không giới hạn và ưu tiên cập nhật đề mới mỗi năm.</p>
              </div>
            </details>
            <details>
              <summary>
                Có cần cài đặt phần mềm không?
                <span className="q-ico"><PlusIcon /></span>
              </summary>
              <div className="answer">
                <p>Không. App chạy ngay trên trình duyệt máy tính. Con có thể bắt đầu với gói Free chỉ trong vài phút, không cần thẻ thanh toán.</p>
              </div>
            </details>
            <details>
              <summary>
                Tôi có thể đổi hoặc hoàn tiền không?
                <span className="q-ico"><PlusIcon /></span>
              </summary>
              <div className="answer">
                <p>Có. Mọi gói trả phí đều được hỗ trợ đổi gói hoặc hoàn tiền trong vòng 7 ngày kể từ khi mua nếu con chưa sử dụng đáng kể.</p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="cta-band reveal">
            {isLoggedIn && user ? (
              <>
                <h2>
                  Chào {user.name?.split(/\s+/).slice(-1)[0] ?? "bạn"} — tiếp tục hành
                  trình thôi nào!
                </h2>
                <p>Lộ trình học của bạn đã sẵn sàng. Quay lại học bất cứ lúc nào.</p>
                <div className="row">
                  <LandingHeroActions user={user} size="lg" />
                </div>
              </>
            ) : (
              <>
                <h2>Bắt đầu hành trình vào lớp 6 CLC cùng con</h2>
                <p>Đăng ký dùng thử miễn phí hôm nay — đo năng lực, nhận lộ trình riêng và thấy chỉ số sẵn sàng tăng dần.</p>
                <div className="row">
                  <TryButton plan="free" hasGoogle={hasGoogle} className="btn primary lg">
                    Dùng thử miễn phí <ArrowIcon />
                  </TryButton>
                  <TryButton plan="login" hasGoogle={hasGoogle} className="btn lg">
                    Đã có tài khoản? Đăng nhập
                  </TryButton>
                </div>
                <div className="fine">Không cần thẻ thanh toán · Bắt đầu trong 2 phút</div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="footer">
        <div className="wrap">
          <div className="brand">
            <span className="brand-mark">K</span>
            <span>
              <b>Cùng Khỉ con vào lớp 6 CLC</b>
              <span>Luyện thi toán cá nhân hoá cho học sinh lớp 5</span>
            </span>
          </div>
          <nav className="links">
            <a href="#features">Tính năng</a>
            <a href="#how">Cách hoạt động</a>
            <a href="#pricing">Bảng giá</a>
            <a href="#faq">Câu hỏi</a>
          </nav>
          <div className="copy">© 2026 Khỉ con Education. Sản phẩm luyện thi độc lập, không liên kết chính thức với các trường được nhắc đến.</div>
        </div>
      </footer>
    </>
  );
}
