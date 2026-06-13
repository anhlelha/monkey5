/* =========================================================
   Dashboard — readiness + topic mastery + recent activity
   ========================================================= */
const { useState: useStateD, useMemo: useMemoD } = React;

const Dashboard = ({ user, onUpdateUser, onNav }) => {
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 11 ? "Chào buổi sáng" : greetingHour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const firstName = user.name.split(" ").slice(-1)[0];
  const [settingsOpen, setSettingsOpen] = useStateD(false);

  /* days until exam */
  const daysToExam = useMemoD(() => {
    if (!user.examDate) return 96;
    return Math.max(0, Math.ceil((new Date(user.examDate) - new Date()) / 86400000));
  }, [user.examDate]);

  /* readiness assessment line */
  const targetSchools = SCHOOLS.filter(s => user.targets.includes(s.id));

  /* topic data for radar */
  const radarData = TOPICS.map(t => ({
    label: t.short,
    value: user.topicMastery[t.id] || 0
  }));

  /* recommended action */
  const weakestTopic = Object.entries(user.topicMastery).sort((a, b) => a[1] - b[1])[0];
  const weakest = TOPICS.find(t => t.id === weakestTopic[0]);

  return (
    <div className="main">
      <TopBar
        crumbs={["Trang chính"]}
        actions={
          <Fragment>
            <button className="btn">
              <Ico name="search" /> Tìm đề / chuyên đề
              <span className="mono muted" style={{ fontSize: 11, marginLeft: 8 }}>⌘K</span>
            </button>
            <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Cài đặt"><Ico name="settings" /></button>
          </Fragment>
        }
      />

      <div className="content">
        <div className="page-head">
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {greeting} · Còn <b className="mono" style={{ color: "var(--accent-ink)" }}>{daysToExam} ngày</b> đến kỳ thi mục tiêu
            </div>
            <h2>{greeting}, {firstName} 👋</h2>
            <p>Hôm nay Khỉ con đề xuất con luyện <b style={{ color: "var(--ink)" }}>{weakest.name}</b> — chuyên đề con đang yếu nhất.</p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn">
              <Ico name="library" /> Xem đề mẫu
            </button>
            <button className="btn primary" onClick={() => onNav("exam")}>
              <Ico name="bolt" /> Bắt đầu đề ngắn 15p
            </button>
          </div>
        </div>

        {/* === School readiness cards === */}
        <div className="row between" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>
            Mức độ sẵn sàng theo trường mục tiêu
          </h3>
          <span className="muted" style={{ fontSize: 12.5 }}>
            Cập nhật {user.joinedDays > 1 ? "hôm nay" : "vừa rồi"} · dựa trên {RECENT.length} hoạt động gần nhất
          </span>
        </div>

        <div className="grid cols-4">
          {SCHOOLS.map(s => {
            const isTarget = user.targets.includes(s.id);
            const r = user.readiness[s.id];
            const tone = r >= 75 ? "green" : r >= 60 ? "amber" : "red";
            const status = r >= 75 ? "Sẵn sàng" : r >= 60 ? "Đang tiến triển" : "Cần luyện thêm";
            return (
              <div key={s.id}
                   className={"school-card " + s.tone}
                   onClick={() => onNav("library", { school: s.id })}
                   style={{ opacity: isTarget ? 1 : 0.7 }}>
                <div className="row between">
                  <div>
                    <div className="eyebrow" style={{ fontSize: 10 }}>{s.short}</div>
                    <div className="name">{s.name}</div>
                  </div>
                  {isTarget && <Pill tone={s.tone}><span className="dot" />Mục tiêu</Pill>}
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
              </div>
            );
          })}
        </div>

        {/* === Topic mastery + activity === */}
        <div className="grid cols-2" style={{ marginTop: 24 }}>
          <Card title="Năng lực theo 10 chuyên đề" sub="So sánh với mức yêu cầu trung bình của 4 trường"
                action={
                  <button className="btn sm ghost" onClick={() => onNav("topics")}>
                    Luyện chuyên đề <Ico name="chevR" size={12} />
                  </button>
                }>
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

          <Card title="Tiến độ 14 ngày qua" sub={`Streak hiện tại: ${user.streak} ngày liên tiếp`}
                action={
                  <span className="row" style={{ gap: 6 }}>
                    <Ico name="fire" size={14} stroke={1.8} />
                    <b className="mono" style={{ fontSize: 14 }}>{user.streak}</b>
                  </span>
                }>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 120, padding: "8px 0" }}>
              {user.activity.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%",
                    height: v == null ? 2 : Math.max(3, (v / 100) * 100) + "px",
                    background: v == null ? "var(--border)" : v >= 70 ? "var(--success)" : v >= 60 ? "var(--accent)" : "var(--warn)",
                    borderRadius: 3,
                    opacity: v == null ? 0.5 : 1
                  }} />
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

        {/* === Recent activity + Recommended === */}
        <div className="grid cols-2" style={{ marginTop: 16, gridTemplateColumns: "2fr 1fr" }}>
          <Card title="Hoạt động gần đây" sub="Bấm để xem lại bài làm và lời giải"
                action={<button className="btn sm ghost">Xem tất cả <Ico name="chevR" size={12} /></button>}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {RECENT.map((r, i) => {
                const school = r.school && SCHOOLS.find(s => s.id === r.school);
                const topic = r.topic && TOPICS.find(t => t.id === r.topic);
                const pct = (r.score / r.total) * 100;
                return (
                  <div key={i} className="row" style={{
                    padding: "12px 0",
                    borderBottom: i < RECENT.length - 1 ? "1px solid var(--border-soft)" : "0",
                    cursor: "pointer", gap: 14
                  }} onClick={() => i === 0 && onNav("results")}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: school ? `var(--${r.school}-soft)` : "var(--surface-sunk)",
                      color: school ? school.color : "var(--ink-soft)",
                      display: "grid", placeItems: "center",
                      fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)"
                    }}>
                      {school ? school.short : topic ? topic.ico : "·"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>{r.title}</div>
                      <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{r.when}</div>
                    </div>
                    <div style={{ minWidth: 90 }}>
                      <Bar value={pct} tone={pct >= 70 ? "" : pct >= 50 ? "ltv" : "ntt"} />
                    </div>
                    <div style={{ minWidth: 60, textAlign: "right" }}>
                      <span className="mono" style={{
                        fontSize: 14, fontWeight: 600,
                        color: pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--ink)" : "var(--danger)"
                      }}>
                        {r.kind === "exam" ? r.score + "%" : r.score + "/" + r.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="col" style={{ gap: 16 }}>
            <Card>
              <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `color-mix(in oklch, ${weakest.color}, white 80%)`,
                  color: weakest.color, display: "grid", placeItems: "center", fontWeight: 700
                }}>{weakest.ico}</div>
                <Pill tone="red">Yếu nhất</Pill>
              </div>
              <h3 style={{ margin: 0, fontSize: 16, letterSpacing: "-0.01em" }}>{weakest.name}</h3>
              <p className="muted" style={{ fontSize: 12.5, margin: "4px 0 12px" }}>
                Mức {Math.round(weakestTopic[1] * 100)}% — thấp hơn TB mục tiêu 25%
              </p>
              <Bar value={weakestTopic[1] * 100} tone="ntt" tall />
              <button className="btn primary" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
                      onClick={() => onNav("topics", { topic: weakest.id })}>
                <Ico name="bolt" /> Bắt đầu luyện ngay
              </button>
            </Card>

            <Card title="Lộ trình tuần này" sub="3 / 5 nhiệm vụ hoàn thành">
              <Bar value={60} tall />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { done: true, txt: "1 đề Cầu Giấy đầy đủ" },
                  { done: true, txt: "20 bài Phân số" },
                  { done: true, txt: "1 đề Thanh Xuân" },
                  { done: false, txt: "20 bài Chuyển động" },
                  { done: false, txt: "1 đề NTT (60 phút)" }
                ].map((t, i) => (
                  <div key={i} className="row" style={{ gap: 10, fontSize: 13 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: "1.5px solid " + (t.done ? "var(--success)" : "var(--border-strong)"),
                      background: t.done ? "var(--success)" : "transparent",
                      display: "grid", placeItems: "center", color: "white", flexShrink: 0
                    }}>
                      {t.done && <Ico name="check" size={11} stroke={3} />}
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

        {/* === Topic mastery table === */}
        <Card title="Chi tiết theo chuyên đề" sub="Mức yêu cầu trung bình ≈ 70% cho top 4 trường"
              action={
                <button className="btn sm ghost" onClick={() => onNav("topics")}>
                  Mở thư viện bài tập <Ico name="chevR" size={12} />
                </button>
              }
              style={{ marginTop: 24 }}>
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
              {TOPICS.map(t => {
                const v = user.topicMastery[t.id];
                const pct = Math.round(v * 100);
                const gap = 70 - pct;
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: `color-mix(in oklch, ${t.color}, white 86%)`,
                        color: t.color, display: "grid", placeItems: "center",
                        fontSize: 13, fontWeight: 700
                      }}>{t.ico}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        {12 + Math.round(v * 28)} câu đã chấm
                      </div>
                    </td>
                    <td className="mono muted">{Math.round(v * 30) + 6}</td>
                    <td><Bar value={pct} tone={pct >= 70 ? "" : pct >= 55 ? "ltv" : "ntt"} /></td>
                    <td style={{ textAlign: "right" }} className="mono">
                      <b style={{ fontSize: 14, color: pct >= 70 ? "var(--success)" : "var(--ink)" }}>{pct}%</b>
                    </td>
                    <td>
                      {gap > 0
                        ? <Pill tone="amber">cần +{gap}%</Pill>
                        : <Pill tone="green">đạt mục tiêu</Pill>}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn sm" onClick={() => onNav("topics", { topic: t.id })}>
                        Luyện <Ico name="chevR" size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {settingsOpen && (
        <SettingsPanel
          user={user}
          onClose={() => setSettingsOpen(false)}
          onSave={(patch) => {
            onUpdateUser(patch);
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
};

/* ===== Settings panel (slide-in from right) ===== */
const SettingsPanel = ({ user, onClose, onSave }) => {
  const [name, setName] = useStateD(user.name);
  const [targets, setTargets] = useStateD(user.targets);
  const [hours, setHours] = useStateD(user.hours || 5);
  const [examDate, setExamDate] = useStateD(user.examDate || "2026-09-01");
  const [readyTarget, setReadyTarget] = useStateD(user.readyTarget || 75);

  const toggle = (id) => setTargets(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);
  const dirty = name !== user.name || hours !== user.hours || examDate !== user.examDate
             || targets.join() !== user.targets.join() || readyTarget !== (user.readyTarget || 75);

  const days = Math.max(0, Math.ceil((new Date(examDate) - new Date()) / 86400000));

  return (
    <div className="tutor-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tutor-panel" style={{ width: 520 }}>
        <div className="tutor-head">
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-sunk)", display: "grid", placeItems: "center", color: "var(--ink-soft)" }}>
            <Ico name="settings" />
          </div>
          <div style={{ flex: 1 }}>
            <h4>Cài đặt</h4>
            <div className="sub">Hồ sơ · mục tiêu thi · lộ trình học</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico name="x" /></button>
        </div>

        <div className="tutor-body" style={{ gap: 24 }}>
          {/* Profile */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Hồ sơ</div>
            <div className="col" style={{ gap: 12 }}>
              <div className="field">
                <label>Tên hiển thị</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid cols-2" style={{ gap: 10 }}>
                <div className="field">
                  <label>Email (Google)</label>
                  <input className="input" value={user.email} readOnly style={{ background: "var(--surface-2)", color: "var(--ink-muted)" }} />
                </div>
                <div className="field">
                  <label>Lớp</label>
                  <input className="input" value={user.grade} readOnly style={{ background: "var(--surface-2)", color: "var(--ink-muted)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Target schools */}
          <div>
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="eyebrow">Trường mục tiêu</div>
              <span className="muted" style={{ fontSize: 11.5 }}>Đã chọn {targets.length}/{SCHOOLS.length}</span>
            </div>
            <div className="school-pick">
              {SCHOOLS.map(s => (
                <div key={s.id}
                     className={"school-pick-item " + (targets.includes(s.id) ? "checked" : "")}
                     onClick={() => toggle(s.id)}>
                  <div className={"badge " + s.tone}>{s.short}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.full}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{s.desc}</div>
                  </div>
                  <div className="check">
                    {targets.includes(s.id) && <Ico name="check" size={12} stroke={2.5} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exam date */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Ngày thi mục tiêu</div>
            <div className="col" style={{ gap: 10 }}>
              <input className="input mono" type="date"
                     value={examDate}
                     onChange={(e) => setExamDate(e.target.value)}
                     min="2026-01-01" max="2027-12-31" style={{ maxWidth: 200 }} />
              <div style={{
                padding: 10, background: "var(--accent-soft)",
                borderRadius: 8, fontSize: 12.5, color: "var(--accent-ink)"
              }}>
                <Ico name="clock" size={12} /> Còn <b className="mono">{days}</b> ngày từ hôm nay. Khỉ con sẽ chia lộ trình phù hợp.
              </div>
            </div>
          </div>

          {/* Hours per week */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Số giờ học mỗi tuần</div>
            <div className="grid cols-4" style={{ gap: 8 }}>
              {[3, 5, 8, 12].map(h => (
                <button key={h}
                        className={"chip " + (hours === h ? "active" : "")}
                        style={{ justifyContent: "center", padding: "10px 8px", flexDirection: "column", gap: 2, borderRadius: 8 }}
                        onClick={() => setHours(h)}>
                  <b style={{ fontSize: 16, fontFamily: "var(--font-mono)" }}>{h}h</b>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>
                    {h <= 3 ? "Nhẹ" : h <= 5 ? "Đều" : h <= 8 ? "Tăng tốc" : "Cao"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Readiness target */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Mức sẵn sàng mong muốn</div>
            <div className="row" style={{ gap: 14 }}>
              <input type="range" min="60" max="95" step="5" value={readyTarget}
                     onChange={(e) => setReadyTarget(parseInt(e.target.value))}
                     style={{ flex: 1, accentColor: "var(--accent)" }} />
              <b className="mono" style={{ fontSize: 18, width: 50, textAlign: "right", color: "var(--accent-ink)" }}>{readyTarget}%</b>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
              Khi đạt mức này cho trường mục tiêu, hệ thống sẽ báo "Đã sẵn sàng".
            </div>
          </div>

          {/* Notifications (stub) */}
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Thông báo</div>
            <div className="col" style={{ gap: 8 }}>
              {[
                { l: "Nhắc nhở lịch học hàng ngày", v: true },
                { l: "Tóm tắt tuần qua email", v: true },
                { l: "Thông báo khi đạt mốc mới", v: false }
              ].map((it, i) => (
                <div key={i} className="row between" style={{ padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border-soft)" : "0" }}>
                  <span style={{ fontSize: 13 }}>{it.l}</span>
                  <div style={{
                    width: 32, height: 18, borderRadius: 99,
                    background: it.v ? "var(--accent)" : "var(--border-strong)",
                    position: "relative", cursor: "pointer", transition: "background 0.15s"
                  }}>
                    <div style={{
                      position: "absolute", top: 2, left: it.v ? 16 : 2,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "white", transition: "left 0.15s"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="tutor-input" style={{ padding: 16, gap: 10 }}>
          <button className="btn ghost" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>Huỷ</button>
          <button className="btn primary" disabled={!dirty || targets.length === 0}
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => onSave({ name, targets, hours, examDate, readyTarget })}>
            <Ico name="check" stroke={2.5} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Dashboard, SettingsPanel });
