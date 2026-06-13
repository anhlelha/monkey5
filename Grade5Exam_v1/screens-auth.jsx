/* =========================================================
   Auth screens — Sign-in + Onboarding
   ========================================================= */
const { useState: useStateA } = React;

/* ===== Sign-in ===== */
const SignIn = ({ onSignIn }) => {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Brand size={44} />
        <h1>Cùng Khỉ con vào lớp 6 CLC</h1>
        <p className="sub">
          Luyện đề · Đánh giá lộ trình · Học cùng AI<br />
          Dành cho học sinh lớp 5 thi vào trường chất lượng cao
        </p>

        <button className="google-btn" onClick={onSignIn}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" />
            <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.97 8.97 0 009 0 9 9 0 00.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Đăng nhập với Google
        </button>

        <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-faint)", fontSize: 11.5 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span>HOẶC</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button className="btn" style={{ width: "100%", justifyContent: "center" }} onClick={onSignIn}>
          Tiếp tục với tài khoản demo
        </button>

        <p className="auth-foot">
          Khi đăng nhập, bạn đồng ý với Điều khoản & Chính sách bảo mật của ứng dụng.
        </p>
      </div>
    </div>
  );
};

/* ===== Onboarding (2 steps) ===== */
const Onboarding = ({ user, onComplete }) => {
  const [step, setStep] = useStateA(0);
  const [targets, setTargets] = useStateA(user.targets || []);
  const [hours, setHours] = useStateA(5);

  const toggleSchool = (id) => {
    setTargets(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);
  };

  return (
    <div className="auth-shell" style={{ alignItems: "flex-start", paddingTop: 60 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div className="onboard-steps">
          <span className={step >= 0 ? "done" : ""} />
          <span className={step >= 1 ? "done" : ""} />
        </div>

        {step === 0 && (
          <div className="card onboard-card">
            <div className="row" style={{ gap: 12, marginBottom: 14 }}>
              <Brand size={32} />
              <Pill>Bước 1 / 2</Pill>
            </div>
            <h2>Chào {user.name.split(" ").slice(-1)[0]}! Con đang nhắm tới trường nào?</h2>
            <p className="lead">Chọn các trường con muốn thi. Khỉ con sẽ ưu tiên đề và bài tập theo phong cách của những trường này, và tính % sẵn sàng riêng cho mỗi trường.</p>

            <div className="school-pick">
              {SCHOOLS.map(s => (
                <div key={s.id}
                     className={"school-pick-item " + (targets.includes(s.id) ? "checked" : "")}
                     onClick={() => toggleSchool(s.id)}>
                  <div className={"badge " + s.tone}>{s.short}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.full}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{s.desc}</div>
                  </div>
                  <div className="check">
                    {targets.includes(s.id) && <Ico name="check" size={13} stroke={2.5} />}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
              <span className="muted" style={{ fontSize: 12.5 }}>
                Đã chọn {targets.length} trường — có thể đổi sau trong cài đặt.
              </span>
              <button className="btn primary" disabled={targets.length === 0} onClick={() => setStep(1)}>
                Tiếp tục
                <Ico name="arrow" />
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="card onboard-card">
            <div className="row" style={{ gap: 12, marginBottom: 14 }}>
              <Brand size={32} />
              <Pill>Bước 2 / 2</Pill>
            </div>
            <h2>Mỗi tuần con muốn dành bao nhiêu giờ luyện đề?</h2>
            <p className="lead">Khỉ con sẽ chia nhỏ lộ trình tới ngày thi cho phù hợp.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
              {[3, 5, 8, 12].map(h => (
                <button key={h}
                        className={"chip " + (hours === h ? "active" : "")}
                        style={{ justifyContent: "center", padding: "14px 10px", borderRadius: 10, flexDirection: "column", gap: 4 }}
                        onClick={() => setHours(h)}>
                  <b style={{ fontSize: 22, fontFamily: "var(--font-mono)" }}>{h}h</b>
                  <span style={{ fontSize: 11, opacity: 0.8 }}>
                    {h <= 3 ? "Nhẹ nhàng" : h <= 5 ? "Đều đặn" : h <= 8 ? "Tăng tốc" : "Cường độ cao"}
                  </span>
                </button>
              ))}
            </div>

            <div style={{
              marginTop: 20, padding: 14, background: "var(--accent-soft)",
              borderRadius: 10, fontSize: 13, color: "var(--accent-ink)",
              border: "1px solid oklch(0.92 0.04 40)"
            }}>
              <Ico name="sparkle" size={14} /> Với {hours} giờ/tuần và mục tiêu hiện tại, Khỉ con dự tính lộ trình ~14 tuần để đạt 85% sẵn sàng.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button className="btn ghost" onClick={() => setStep(0)}>
                <Ico name="back" /> Quay lại
              </button>
              <button className="btn primary" onClick={() => onComplete({ targets, hours })}>
                Vào trang chính
                <Ico name="arrow" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { SignIn, Onboarding });
