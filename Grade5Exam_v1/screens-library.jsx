/* =========================================================
   Library + Create + Topics
   ========================================================= */
const { useState: useStateL, useMemo: useMemoL } = React;

/* ===== Library: list of past exams ===== */
const Library = ({ initialSchool, onNav }) => {
  const [school, setSchool] = useStateL(initialSchool || "all");
  const [kind, setKind] = useStateL("official"); // official (default) | reference

  const officialExams = PAST_EXAMS.filter(e => e.kind === "official");
  const filteredOfficial = officialExams.filter(e => school === "all" || e.school === school);
  const byYear = useMemoL(() => {
    const m = {};
    filteredOfficial.forEach(e => { (m[e.year] ||= []).push(e); });
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredOfficial]);

  /* User's reference attempts (from history, kind="reference") */
  const refHistory = USER_HISTORY.exams.filter(h => h.kind === "reference");

  const officialCount = officialExams.length;
  const userDoneOfficial = USER_HISTORY.exams.filter(h => h.kind === "official").length;
  const userDoneRef = refHistory.length;

  return (
    <div className="main">
      <TopBar crumbs={["Trang chính", "Đề thi mẫu"]}
              actions={
                <button className="btn"><Ico name="search" /> Tìm đề</button>
              } />

      <div className="content">
        <div className="page-head">
          <div>
            <h2>Đề thi</h2>
            <p>
              <b className="mono">{officialCount}</b> đề chính thức của 4 trường (2019–2026) ·
              Con đã làm <b className="mono">{userDoneOfficial}</b> đề chính thức · <b className="mono">{userDoneRef}</b> đề tham khảo
            </p>
          </div>
        </div>

        {/* Kind switcher */}
        <div className="row" style={{ gap: 0, marginBottom: 18, border: "1px solid var(--border)", borderRadius: 10, padding: 3, background: "var(--surface-2)", width: "fit-content" }}>
          {[
            { id: "official", l: "Đề chính thức", n: officialCount, sub: "(đã thi thật)", ico: "check" },
            { id: "reference", l: "Đề tham khảo", n: null, sub: "(tự tạo · không giới hạn)", ico: "sparkle" }
          ].map(t => (
            <button key={t.id}
                    onClick={() => setKind(t.id)}
                    style={{
                      padding: "8px 16px", border: 0,
                      background: kind === t.id ? "var(--surface)" : "transparent",
                      borderRadius: 7, cursor: "pointer", fontSize: 13.5,
                      fontWeight: kind === t.id ? 600 : 500,
                      color: kind === t.id ? "var(--ink)" : "var(--ink-muted)",
                      boxShadow: kind === t.id ? "var(--shadow-1)" : "none",
                      display: "inline-flex", alignItems: "center", gap: 8,
                      transition: "background 0.15s"
                    }}>
              <Ico name={t.ico} size={13} stroke={2.5} />
              {t.l}
              {t.n !== null && <span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>· {t.n}</span>}
              <span className="muted" style={{ fontSize: 11, fontWeight: 400, marginLeft: -2 }}>{t.sub}</span>
            </button>
          ))}
        </div>

        {/* ===== OFFICIAL ===== */}
        {kind === "official" && (
          <Fragment>
            <div className="chip-group" style={{ marginBottom: 18 }}>
              <button className={"chip " + (school === "all" ? "active" : "")} onClick={() => setSchool("all")}>
                Tất cả trường · {officialExams.length}
              </button>
              {SCHOOLS.map(s => {
                const count = officialExams.filter(e => e.school === s.id).length;
                return (
                  <button key={s.id}
                          className={"chip " + (school === s.id ? "active " + s.tone : "")}
                          onClick={() => setSchool(s.id)}>
                    <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
                    {s.short} · {count}
                  </button>
                );
              })}
            </div>

            {byYear.map(([year, exams]) => (
              <div key={year} style={{ marginBottom: 22 }}>
                <div className="section-title" style={{ margin: "0 0 10px" }}>{year}</div>
                <div className="col" style={{ gap: 8 }}>
                  {exams.map(e => {
                    const s = SCHOOLS.find(x => x.id === e.school);
                    return (
                      <div key={e.id} className="exam-row" onClick={() => onNav("exam", { examId: e.id })}>
                        <div className={"badge " + s.tone}>{s.short}</div>
                        <div>
                          <div className="row" style={{ gap: 8, alignItems: "center" }}>
                            <span className="title">Đề thi {s.name} · {e.year}</span>
                            <KindBadge kind="official" compact />
                          </div>
                          <div className="meta">
                            {e.qcount} câu · {e.minutes} phút ·
                            {e.attempts > 0
                              ? <span> <b className="mono">{e.attempts}</b> lần làm · cao nhất <b className="mono" style={{ color: e.bestScore >= 70 ? "var(--success)" : "var(--ink)" }}>{e.bestScore}%</b></span>
                              : <span className="muted"> chưa làm</span>}
                          </div>
                        </div>
                        <div className="stat">
                          <div className="eyebrow" style={{ fontSize: 10 }}>Câu</div>
                          <b className="mono">{e.qcount}</b>
                        </div>
                        <div className="stat">
                          <div className="eyebrow" style={{ fontSize: 10 }}>Thời lượng</div>
                          <b className="mono">{e.minutes}p</b>
                        </div>
                        <button className="btn primary sm">
                          {e.attempts > 0 ? "Làm lại" : "Bắt đầu"} <Ico name="chevR" size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Fragment>
        )}

        {/* ===== REFERENCE ===== */}
        {kind === "reference" && (
          <Fragment>
            <div style={{
              padding: 14, marginBottom: 20,
              background: "var(--warn-soft)", borderRadius: 10,
              border: "1px solid oklch(0.92 0.06 80)",
              fontSize: 12.5, color: "oklch(0.4 0.1 70)"
            }}>
              <b><Ico name="sparkle" size={12} /> Đề tham khảo:</b> Được phỏng tạo từ ngân hàng câu hỏi mỗi lần con bấm.
              Không phải đề thật của trường — không tính vào % sẵn sàng, nhưng giúp con luyện không giới hạn.
            </div>

            {/* Big CTAs — "Tạo đề tham khảo phong cách X" */}
            <div className="section-title" style={{ margin: "0 0 12px" }}>Bấm để có một đề mới</div>
            <div className="grid cols-2" style={{ gap: 10, marginBottom: 28 }}>
              {[...SCHOOLS, {
                id: "mix", short: "MIX", name: "Tổng hợp 4 trường",
                full: "Phong cách kết hợp", color: "var(--accent)", tone: "",
                minutes: 60, desc: "Cân bằng cả 4 trường — dùng khi chưa quyết định trường"
              }].map(s => (
                <div key={s.id} className="topic-card"
                     style={{ cursor: "pointer", padding: 18 }}
                     onClick={() => onNav("exam", { examId: "ref-" + s.id + "-" + Date.now().toString(36).slice(-4) })}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <div className="row" style={{ gap: 10 }}>
                      <div className="badge" style={{
                        background: s.color, color: "white",
                        width: 36, height: 36, borderRadius: 9,
                        display: "grid", placeItems: "center",
                        fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12
                      }}>{s.short}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Phỏng đề {s.name}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{s.desc || s.style}</div>
                      </div>
                    </div>
                    <Ico name="arrow" />
                  </div>
                  <div className="row between" style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
                    <span>~{Math.round((s.minutes || 60) / 4.5)} câu · {s.minutes || 60} phút</span>
                    <span className="row" style={{ gap: 4 }}>
                      <Ico name="sparkle" size={11} /> Câu mới mỗi lần
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* History */}
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="section-title" style={{ margin: 0 }}>Đề tham khảo con đã làm</div>
              {refHistory.length > 0 && <span className="muted" style={{ fontSize: 12 }}>{refHistory.length} đề</span>}
            </div>

            {refHistory.length === 0 ? (
              <Card>
                <div className="empty">
                  Con chưa làm đề tham khảo nào.<br />
                  Bấm một phong cách ở trên để bắt đầu — sẽ có ngay đề đầu tiên.
                </div>
              </Card>
            ) : (
              <div className="col" style={{ gap: 8 }}>
                {refHistory.map(h => {
                  const s = SCHOOLS.find(x => x.id === h.school) || { short: "MIX", tone: "", name: "Tổng hợp 4 trường" };
                  return (
                    <div key={h.id} className="exam-row" onClick={() => onNav("results")}>
                      <div className="badge" style={{ background: s.color || "var(--accent)" }}>{s.short}</div>
                      <div>
                        <div className="row" style={{ gap: 8, alignItems: "center" }}>
                          <span className="title">{h.style}</span>
                          <KindBadge kind="reference" compact />
                        </div>
                        <div className="meta">
                          Làm xong {h.when_full || h.when}
                        </div>
                      </div>
                      <div className="stat" style={{ minWidth: 90 }}>
                        <Bar value={h.score} tone={h.score >= 70 ? "" : h.score >= 50 ? "ltv" : "ntt"} />
                      </div>
                      <div className="stat">
                        <b className="mono" style={{ fontSize: 14, color: h.score >= 70 ? "var(--success)" : "var(--ink)" }}>{h.score}%</b>
                      </div>
                      <button className="btn sm ghost">
                        Xem giải <Ico name="chevR" size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Fragment>
        )}
      </div>
    </div>
  );
};

/* ===== Create exam (wizard) ===== */
const Create = ({ onNav }) => {
  const [step, setStep] = useStateL(0);
  const [style, setStyle] = useStateL("cg");
  const [qcount, setQcount] = useStateL(10);
  const [minutes, setMinutes] = useStateL(45);
  const [topics, setTopics] = useStateL(TOPICS.map(t => t.id));
  const [difficulty, setDifficulty] = useStateL("mix");
  const [generating, setGenerating] = useStateL(false);

  const toggle = (id) => setTopics(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id]);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => { onNav("exam", { examId: "generated" }); }, 1600);
  };

  const steps = [
    { id: 0, label: "Phong cách trường" },
    { id: 1, label: "Cấu trúc đề" },
    { id: 2, label: "Chuyên đề & độ khó" },
    { id: 3, label: "Xem trước & tạo" }
  ];

  return (
    <div className="main">
      <TopBar crumbs={["Quản trị", "Tạo đề mới"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <Pill tone="amber"><span className="dot" />Chỉ admin</Pill>
              <span className="eyebrow">Công cụ quản trị</span>
            </div>
            <h2>Tạo đề luyện thi tuỳ chỉnh</h2>
            <p>Phỏng tạo đề theo phong cách trường mục tiêu, từ ngân hàng câu hỏi đã chuẩn hoá. Đề sau khi tạo sẽ xuất hiện trong thư viện cho học sinh.</p>
          </div>
        </div>

        <div className="wizard">
          <div className="wizard-steps">
            {steps.map(s => (
              <div key={s.id}
                   className={"step " + (step === s.id ? "active" : step > s.id ? "done" : "")}
                   onClick={() => step >= s.id && setStep(s.id)}
                   style={{ cursor: step >= s.id ? "pointer" : "default" }}>
                <span className="num">{step > s.id ? "✓" : s.id + 1}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="wizard-panel">
            {step === 0 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Chọn phong cách trường</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>Đề sẽ mô phỏng định dạng, độ khó và phong cách câu hỏi của trường đã chọn.</p>
                <div className="grid cols-2" style={{ gap: 10 }}>
                  {[...SCHOOLS, { id: "mix", short: "ALL", name: "Tổng hợp 4 trường", full: "Đề phỏng tạo tổng hợp", desc: "Cân bằng cả 4 phong cách. Hữu ích khi chưa quyết định trường mục tiêu.", color: "var(--accent)", tone: "" }].map(s => (
                    <div key={s.id}
                         className={"school-pick-item " + (style === s.id ? "checked" : "")}
                         onClick={() => { setStyle(s.id); if (s.minutes) setMinutes(s.minutes); }}>
                      <div className={"badge " + (s.tone || "")} style={{ background: s.color }}>{s.short}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.full || s.name}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{s.desc || s.style}</div>
                      </div>
                      <div className="check">
                        {style === s.id && <Ico name="check" size={13} stroke={2.5} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row" style={{ justifyContent: "flex-end", marginTop: 20 }}>
                  <button className="btn primary" onClick={() => setStep(1)}>
                    Tiếp tục <Ico name="arrow" />
                  </button>
                </div>
              </Card>
            )}

            {step === 1 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Cấu trúc đề</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>Số câu và thời lượng. Khỉ con đã set mặc định theo phong cách trường con chọn.</p>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Số câu hỏi</label>
                  <div className="chip-group">
                    {[6, 10, 12, 15, 20, 25].map(n => (
                      <button key={n} className={"chip " + (qcount === n ? "active" : "")} onClick={() => setQcount(n)}>
                        {n} câu
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Thời lượng làm bài</label>
                  <div className="chip-group">
                    {[15, 30, 45, 60, 90].map(n => (
                      <button key={n} className={"chip " + (minutes === n ? "active" : "")} onClick={() => setMinutes(n)}>
                        {n} phút
                      </button>
                    ))}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    Áp lực thời gian: <b style={{ color: minutes / qcount < 4 ? "var(--danger)" : minutes / qcount < 5 ? "var(--warn)" : "var(--success)" }}>
                      {(minutes / qcount).toFixed(1)} phút/câu
                    </b> — {minutes / qcount < 4 ? "khá căng" : minutes / qcount < 5 ? "vừa phải" : "thoải mái"}
                  </div>
                </div>

                <div className="field">
                  <label>Tỉ lệ dạng câu hỏi (giữ theo phong cách trường)</label>
                  <div className="row" style={{ height: 28, gap: 0, border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", marginTop: 4 }}>
                    <div style={{ flex: 5, background: "var(--cg)", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600 }}>Điền 50%</div>
                    <div style={{ flex: 3, background: "var(--tx)", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600 }}>Trắc nghiệm 30%</div>
                    <div style={{ flex: 2, background: "var(--ntt)", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600 }}>Tự luận 20%</div>
                  </div>
                </div>

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(0)}><Ico name="back" /> Quay lại</button>
                  <button className="btn primary" onClick={() => setStep(2)}>Tiếp tục <Ico name="arrow" /></button>
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Chuyên đề & mức độ</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>Bỏ chọn các chuyên đề con muốn tránh, hoặc giữ tất cả để giống đề thật.</p>

                <div className="field" style={{ marginBottom: 22 }}>
                  <label>Chuyên đề ({topics.length}/{TOPICS.length} chọn)</label>
                  <div className="chip-group">
                    {TOPICS.map(t => (
                      <button key={t.id}
                              className={"chip " + (topics.includes(t.id) ? "active" : "")}
                              onClick={() => toggle(t.id)}
                              style={topics.includes(t.id) ? { background: t.color, borderColor: t.color } : {}}>
                        {t.short}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Mức độ</label>
                  <div className="chip-group">
                    {[
                      { id: "easy", l: "Cơ bản (Lớp 4)" },
                      { id: "mid", l: "Vừa (Lớp 5)" },
                      { id: "hard", l: "Nâng cao" },
                      { id: "mix", l: "Trộn (giống đề thật)" }
                    ].map(d => (
                      <button key={d.id} className={"chip " + (difficulty === d.id ? "active" : "")} onClick={() => setDifficulty(d.id)}>
                        {d.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(1)}><Ico name="back" /> Quay lại</button>
                  <button className="btn primary" onClick={() => setStep(3)}>Tiếp tục <Ico name="arrow" /></button>
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Xem trước & tạo đề</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>Kiểm tra lại cấu hình. Khỉ con sẽ tạo đề trong vài giây.</p>

                <div style={{
                  background: "var(--surface-2)", borderRadius: 12,
                  padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18
                }}>
                  <div>
                    <div className="eyebrow">Phong cách</div>
                    <b style={{ fontSize: 15 }}>{(SCHOOLS.find(s => s.id === style) || { full: "Tổng hợp 4 trường" }).full}</b>
                  </div>
                  <div>
                    <div className="eyebrow">Số câu · Thời lượng</div>
                    <b style={{ fontSize: 15 }} className="mono">{qcount} câu · {minutes} phút</b>
                  </div>
                  <div>
                    <div className="eyebrow">Chuyên đề</div>
                    <b style={{ fontSize: 13 }}>{topics.length === TOPICS.length ? "Tất cả" : topics.length + "/" + TOPICS.length} chuyên đề</b>
                  </div>
                  <div>
                    <div className="eyebrow">Mức độ</div>
                    <b style={{ fontSize: 13 }}>{({ easy: "Cơ bản", mid: "Vừa", hard: "Nâng cao", mix: "Trộn (giống đề thật)" })[difficulty]}</b>
                  </div>
                </div>

                <div style={{
                  marginTop: 18, padding: 14, background: "var(--accent-soft)",
                  borderRadius: 10, fontSize: 13, color: "var(--accent-ink)",
                  border: "1px solid oklch(0.92 0.04 40)"
                }}>
                  <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                    <KindBadge kind="reference" compact />
                    <b style={{ color: "var(--accent-ink)" }}>Đề tạo ra là "Đề tham khảo"</b>
                  </div>
                  <b><Ico name="sparkle" size={13} /> Khỉ con sẽ:</b>
                  <ul style={{ margin: "6px 0 0 22px", padding: 0, lineHeight: 1.6 }}>
                    <li>Lấy mẫu câu hỏi từ ngân hàng 476 câu (38 đề các năm)</li>
                    <li>Phỏng tạo biến thể (đổi số, đổi tình huống) để con không thuộc lòng</li>
                    <li>Sắp xếp độ khó tăng dần như đề thật của {(SCHOOLS.find(s => s.id === style) || { short: "ALL" }).short}</li>
                    <li>Đề được gắn nhãn <b>"Tham khảo"</b> trong thư viện học sinh — kết quả không tính vào % sẵn sàng</li>
                  </ul>
                </div>

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(2)} disabled={generating}><Ico name="back" /> Quay lại</button>
                  <button className="btn primary lg" onClick={generate} disabled={generating}>
                    {generating
                      ? <Fragment><Ico name="refresh" /> Đang tạo đề…</Fragment>
                      : <Fragment><Ico name="sparkle" /> Tạo đề và bắt đầu làm</Fragment>}
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ===== Topics — landing showing all 10 topic groups ===== */
const Topics = ({ initialTopic, onNav }) => {
  const [selected, setSelected] = useStateL(initialTopic || null);

  if (selected) return <TopicDetail topicId={selected} onNav={onNav} onBack={() => setSelected(null)} />;

  return (
    <div className="main">
      <TopBar crumbs={["Trang chính", "Luyện chuyên đề"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Luyện theo 10 chuyên đề</h2>
            <p>Mỗi chuyên đề có bộ bài tập tăng dần độ khó (Lớp 4 → Lớp 5 → Nâng cao). Sau mỗi bộ, con có thể hỏi AI lời giải.</p>
          </div>
        </div>

        <div className="grid cols-4" style={{ gap: 14 }}>
          {TOPICS.map(t => {
            const v = USER.topicMastery[t.id];
            const pct = Math.round(v * 100);
            const sessions = (USER_HISTORY.topicSessions[t.id] || []);
            const done = sessions.length;
            const questionsDone = sessions.reduce((s, x) => s + x.qcount, 0);
            return (
              <div key={t.id} className="topic-card" onClick={() => setSelected(t.id)}>
                <div className="row between">
                  <div className="ico" style={{ background: `color-mix(in oklch, ${t.color}, white 86%)`, color: t.color, fontWeight: 700 }}>{t.ico}</div>
                  <Pill tone={pct >= 70 ? "green" : pct >= 55 ? "amber" : "red"}>{pct}%</Pill>
                </div>
                <div className="name">{t.name}</div>
                <Bar value={pct} tone={pct >= 70 ? "" : pct >= 55 ? "ltv" : "ntt"} />
                <div className="row between">
                  <span className="stat">
                    {done > 0
                      ? <span><b className="mono" style={{ color: "var(--ink)" }}>{done}</b> bài đã luyện · {questionsDone} câu</span>
                      : <span className="muted">Chưa luyện</span>}
                  </span>
                  <span className="row" style={{ gap: 4, fontSize: 12, color: "var(--accent-ink)", fontWeight: 600 }}>
                    {done > 0 ? "Mở" : "Bắt đầu"} <Ico name="chevR" size={11} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TopicDetail = ({ topicId, onNav, onBack }) => {
  const t = TOPICS.find(x => x.id === topicId);
  const sessions = USER_HISTORY.topicSessions[topicId] || [];
  const totalQs = sessions.reduce((s, x) => s + x.qcount, 0);
  const totalCorrect = sessions.reduce((s, x) => s + x.score, 0);
  const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : null;

  const v = USER.topicMastery[topicId];
  const pct = Math.round(v * 100);

  /* count appearance across 4 schools */
  const schoolBreakdown = SCHOOLS.map(s => ({
    school: s,
    count: { soh: 28, hinh: 42, phan: 38, cd: 18, log: 22, do: 12, xs: 14, tuoi: 10, ti: 10, tg: 6 }[topicId] || 15
  }));

  /* Practice levels (CTAs that pull a fresh random set) */
  const LEVELS = [
    { id: "L4", l: "Cơ bản", sub: "Lớp 4 — công thức đơn lẻ", q: 8, mins: 15, tone: "var(--success)" },
    { id: "L5", l: "Vừa", sub: "Lớp 5 — 2-3 bước kết hợp", q: 10, mins: 20, tone: "var(--cg)" },
    { id: "NC", l: "Nâng cao", sub: "Olympic, biến đổi sáng tạo", q: 8, mins: 25, tone: "var(--ntt)" },
    { id: "MIX", l: "Phỏng đề thật", sub: "Trộn các mức như đề thi", q: 10, mins: 30, tone: "var(--accent)" }
  ];

  return (
    <div className="main">
      <TopBar crumbs={["Trang chính", "Luyện chuyên đề", t.short]}
              actions={<button className="btn ghost" onClick={onBack}><Ico name="back" /> Tất cả chuyên đề</button>} />
      <div className="content">
        <div className="grid cols-2" style={{ gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "stretch" }}>
          <div>
            <div className="row" style={{ gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `color-mix(in oklch, ${t.color}, white 86%)`,
                color: t.color, display: "grid", placeItems: "center",
                fontSize: 20, fontWeight: 700
              }}>{t.ico}</div>
              <div>
                <h2 style={{ margin: 0, letterSpacing: "-0.02em" }}>{t.name}</h2>
                <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>
                  {sessions.length > 0
                    ? <span>Con đã luyện <b className="mono" style={{ color: "var(--ink)" }}>{sessions.length}</b> bài · <b className="mono" style={{ color: "var(--ink)" }}>{totalQs}</b> câu · đúng <b className="mono" style={{ color: accuracy >= 70 ? "var(--success)" : "var(--ink)" }}>{accuracy}%</b></span>
                    : <span>Con chưa luyện chuyên đề này. Bắt đầu một bài mới nhé!</span>}
                </p>
              </div>
            </div>

            {/* Level CTAs */}
            <div className="section-title" style={{ marginTop: 28 }}>Luyện bài mới</div>
            <p className="muted" style={{ margin: "0 0 14px", fontSize: 12.5 }}>
              Mỗi lần bấm, Khỉ con đẩy ra một bài mới từ ngân hàng câu hỏi — không trùng bài cũ.
            </p>
            <div className="grid cols-2" style={{ gap: 10 }}>
              {LEVELS.map(L => (
                <div key={L.id}
                     className="topic-card"
                     style={{ cursor: "pointer", padding: 16 }}
                     onClick={() => onNav("exam", { setId: topicId + "-" + L.id.toLowerCase() })}>
                  <div className="row between">
                    <div className="row" style={{ gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: `color-mix(in oklch, ${L.tone}, white 84%)`,
                        color: L.tone, display: "grid", placeItems: "center",
                        fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12
                      }}>{L.id}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{L.l}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{L.sub}</div>
                      </div>
                    </div>
                    <Ico name="arrow" />
                  </div>
                  <div className="row between" style={{ marginTop: 4, fontSize: 11.5, color: "var(--ink-muted)" }}>
                    <span>~{L.q} câu</span>
                    <span>{L.mins} phút</span>
                    <span className="row" style={{ gap: 4 }}>
                      <Ico name="sparkle" size={11} />
                      Câu mới mỗi lần
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* History */}
            <div className="row between" style={{ marginTop: 32, marginBottom: 10 }}>
              <div className="section-title" style={{ margin: 0 }}>Lịch sử luyện tập</div>
              {sessions.length > 0 && <span className="muted" style={{ fontSize: 12 }}>{sessions.length} bài gần đây</span>}
            </div>
            {sessions.length === 0 ? (
              <Card>
                <div className="empty">
                  Con chưa luyện bài nào trong chuyên đề này.<br />
                  Bấm một mức ở trên để bắt đầu — sẽ có ngay câu hỏi đầu tiên.
                </div>
              </Card>
            ) : (
              <div className="col" style={{ gap: 8 }}>
                {sessions.map(h => {
                  const pct = Math.round((h.score / h.qcount) * 100);
                  return (
                    <div key={h.id} className="exam-row" style={{ gridTemplateColumns: "auto 1fr auto auto auto" }}
                         onClick={() => onNav("results")}>
                      <div className="badge" style={{
                        background: h.level === "L4" ? "var(--success)" :
                                    h.level === "L5" ? "var(--cg)" :
                                    h.level === "NC" ? "var(--ntt)" : "var(--accent)"
                      }}>{h.level}</div>
                      <div>
                        <div className="title">{t.name} · Mức {h.level}</div>
                        <div className="meta">{h.qcount} câu · làm xong {h.when_full || h.when}</div>
                      </div>
                      <div className="stat" style={{ minWidth: 90 }}>
                        <Bar value={pct} tone={pct >= 70 ? "" : pct >= 50 ? "ltv" : "ntt"} />
                      </div>
                      <div className="stat">
                        <b className="mono" style={{ fontSize: 14, color: pct >= 70 ? "var(--success)" : "var(--ink)" }}>
                          {h.score}/{h.qcount}
                        </b>
                      </div>
                      <button className="btn sm ghost">
                        Xem giải <Ico name="chevR" size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col" style={{ gap: 16 }}>
            <Card>
              <div className="eyebrow">Năng lực hiện tại</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span className="mono" style={{ fontSize: 36, fontWeight: 700, color: t.color }}>{pct}</span>
                <span className="muted" style={{ fontSize: 14 }}>%</span>
              </div>
              <Bar value={pct} tone={pct >= 70 ? "" : "ntt"} tall />
              <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Tính từ <b style={{ color: "var(--ink)" }}>{totalQs || 0}</b> câu con đã trả lời trong chuyên đề này.
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Khoảng cách đến mục tiêu: <b style={{ color: 70 - pct > 0 ? "var(--warn)" : "var(--success)" }}>{Math.max(0, 70 - pct)}%</b>
              </div>
            </Card>

            <Card title="Tần suất trong đề thật" sub="Số câu thuộc chuyên đề này">
              <div className="col" style={{ gap: 10 }}>
                {schoolBreakdown.map(({ school, count }) => (
                  <div key={school.id}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <span className="row" style={{ gap: 6, fontSize: 13 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: school.color }} />
                        {school.short}
                      </span>
                      <b className="mono" style={{ fontSize: 13 }}>{count} câu</b>
                    </div>
                    <Bar value={count} max={50} tone={school.tone} />
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Sai sót thường gặp" sub="Tổng hợp từ bài làm của con">
              <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
                <li>Quên đổi đơn vị (m → km, phút → giờ)</li>
                <li>Nhầm khi đề có 2 vận tốc khác nhau</li>
                <li>Bỏ qua thời gian nghỉ giữa chừng</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Library, Create, Topics, TopicDetail });

/* ===== Create exercise set (per chuyên đề) ===== */
const CreateExercise = ({ initialTopic, onNav }) => {
  const [step, setStep] = useStateL(0);
  const [topicId, setTopicId] = useStateL(initialTopic || null);
  const [setName, setSetName] = useStateL("");
  const [difficulty, setDifficulty] = useStateL("L5");
  const [qcount, setQcount] = useStateL(10);
  const [minutes, setMinutes] = useStateL(30);
  const [types, setTypes] = useStateL({ fill: true, mcq: true, essay: false });
  const [style, setStyleSel] = useStateL("mix"); // school style
  const [tags, setTags] = useStateL([]);
  const [generating, setGenerating] = useStateL(false);

  const topic = TOPICS.find(t => t.id === topicId);

  /* Suggested set names based on topic + difficulty */
  const suggestedName = topic
    ? `${topic.name} — ${difficulty === "L4" ? "Lớp 4 cơ bản" : difficulty === "L5" ? "Lớp 5 nâng dần" : difficulty === "NC" ? "Nâng cao Olympic" : "Tổng hợp"}`
    : "";
  const finalName = setName || suggestedName;

  /* Common tags by topic */
  const tagOptions = {
    cd: ["1 vật", "2 vật cùng chiều", "2 vật ngược chiều", "Có thời gian nghỉ", "Dòng nước", "Tàu qua cầu/hầm"],
    hinh: ["Chu vi", "Diện tích", "Hình tròn", "Hình hộp", "Lập phương", "Tỉ số diện tích", "Cắt ghép"],
    phan: ["Tìm phân số", "Cộng/trừ", "Nhân/chia", "Bài toán phần trăm", "Lãi/giảm giá"],
    soh: ["Tính nhanh", "Tìm x", "Chia hết", "Tận cùng", "Dãy số"],
    tuoi: ["1 cặp tuổi", "2 thời điểm", "Tổng-tỉ", "Hiệu-tỉ"],
    log: ["Suy luận", "Dirichlet", "Bảng logic", "Tìm quy luật"],
    do: ["Độ dài", "Diện tích", "Thể tích", "Khối lượng", "Thời gian"],
    xs: ["Đọc biểu đồ", "Tính xác suất", "Tung xúc xắc/đồng xu"],
    ti: ["Tỉ lệ thuận", "Tỉ lệ nghịch", "Bản đồ"],
    tg: ["Giờ - phút", "Múi giờ", "Cộng/trừ thời gian"]
  };

  const toggleType = (k) => setTypes(t => ({ ...t, [k]: !t[k] }));
  const toggleTag = (t) => setTags(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);

  const steps = [
    { id: 0, label: "Chọn chuyên đề" },
    { id: 1, label: "Mức độ & số câu" },
    { id: 2, label: "Dạng câu & tag" },
    { id: 3, label: "Xem trước & tạo" }
  ];

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      /* Add to TOPIC_SETS — generated sets are always "reference" */
      if (!window.TOPIC_SETS[topicId]) window.TOPIC_SETS[topicId] = [];
      window.TOPIC_SETS[topicId].push({
        id: topicId + "-" + Date.now().toString(36).slice(-4),
        name: finalName,
        qcount, difficulty,
        kind: "reference",
        source: tags.length > 0 ? tags.join(" · ") : "Phỏng tạo từ ngân hàng",
        attempted: false
      });
      onNav("topics", { topic: topicId });
    }, 1400);
  };

  return (
    <div className="main">
      <TopBar crumbs={["Quản trị", "Tạo bài tập"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 6 }}>
              <Pill tone="amber"><span className="dot" />Chỉ admin</Pill>
              <span className="eyebrow">Công cụ quản trị</span>
            </div>
            <h2>Tạo bộ bài tập theo chuyên đề</h2>
            <p>Bộ bài tập sẽ xuất hiện trong "Luyện chuyên đề" tương ứng. Dùng để cho học sinh luyện chuyên sâu 1 dạng cụ thể.</p>
          </div>
        </div>

        <div className="wizard">
          <div className="wizard-steps">
            {steps.map(s => {
              const can = step >= s.id || (s.id === 1 && topicId);
              return (
                <div key={s.id}
                     className={"step " + (step === s.id ? "active" : step > s.id ? "done" : "")}
                     onClick={() => can && setStep(s.id)}
                     style={{ cursor: can ? "pointer" : "default" }}>
                  <span className="num">{step > s.id ? "✓" : s.id + 1}</span>
                  <span>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div className="wizard-panel">
            {/* Step 0: Pick topic */}
            {step === 0 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Chọn chuyên đề</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>
                  Bộ bài tập sẽ thuộc về chuyên đề con chọn. Có thể thay đổi sau.
                </p>
                <div className="grid cols-2" style={{ gap: 8 }}>
                  {TOPICS.map(t => (
                    <div key={t.id}
                         className={"school-pick-item " + (topicId === t.id ? "checked" : "")}
                         onClick={() => setTopicId(t.id)}>
                      <div className="badge"
                           style={{ background: `color-mix(in oklch, ${t.color}, white 80%)`,
                                    color: t.color, fontSize: 16, fontFamily: "var(--font-sans)" }}>
                        {t.ico}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>
                          {(TOPIC_SETS[t.id] || []).length || 0} bộ bài đã có
                        </div>
                      </div>
                      <div className="check">
                        {topicId === t.id && <Ico name="check" size={12} stroke={2.5} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row" style={{ justifyContent: "flex-end", marginTop: 20 }}>
                  <button className="btn primary" disabled={!topicId} onClick={() => setStep(1)}>
                    Tiếp tục <Ico name="arrow" />
                  </button>
                </div>
              </Card>
            )}

            {/* Step 1: Difficulty & count */}
            {step === 1 && (
              <Card>
                <div className="row" style={{ gap: 10, marginBottom: 18 }}>
                  <div className="badge" style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 14, fontWeight: 700,
                    background: `color-mix(in oklch, ${topic.color}, white 86%)`,
                    color: topic.color, display: "grid", placeItems: "center"
                  }}>{topic.ico}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{topic.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>Mức độ và số câu</div>
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Mức độ</label>
                  <div className="chip-group">
                    {[
                      { id: "L4", l: "Lớp 4 cơ bản", desc: "Dạng quen thuộc, công thức đơn lẻ" },
                      { id: "L5", l: "Lớp 5 nâng dần", desc: "Kết hợp 2-3 bước" },
                      { id: "NC", l: "Nâng cao", desc: "Olympic, biến đổi sáng tạo" },
                      { id: "Mix", l: "Trộn (giống đề thật)", desc: "Tăng dần độ khó" }
                    ].map(d => (
                      <button key={d.id}
                              className={"chip " + (difficulty === d.id ? "active" : "")}
                              onClick={() => setDifficulty(d.id)}
                              title={d.desc}>
                        {d.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Số câu hỏi</label>
                  <div className="chip-group">
                    {[5, 8, 10, 12, 15, 20].map(n => (
                      <button key={n} className={"chip " + (qcount === n ? "active" : "")} onClick={() => setQcount(n)}>
                        {n} câu
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Thời lượng đề xuất (phút)</label>
                  <div className="chip-group">
                    {[15, 20, 30, 45, 60].map(n => (
                      <button key={n} className={"chip " + (minutes === n ? "active" : "")} onClick={() => setMinutes(n)}>
                        {n} phút
                      </button>
                    ))}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    Trung bình <b className="mono">{(minutes / qcount).toFixed(1)} phút/câu</b>
                  </div>
                </div>

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(0)}><Ico name="back" /> Quay lại</button>
                  <button className="btn primary" onClick={() => setStep(2)}>Tiếp tục <Ico name="arrow" /></button>
                </div>
              </Card>
            )}

            {/* Step 2: Question types & tags */}
            {step === 2 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Dạng câu & chủ đề con</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>Chọn các dạng câu sẽ xuất hiện và lọc theo chủ đề con.</p>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Dạng câu hỏi (chọn ít nhất 1)</label>
                  <div className="chip-group">
                    <button className={"chip " + (types.fill ? "active" : "")} onClick={() => toggleType("fill")}>
                      Điền đáp số
                    </button>
                    <button className={"chip " + (types.mcq ? "active" : "")} onClick={() => toggleType("mcq")}>
                      Trắc nghiệm A/B/C/D
                    </button>
                    <button className={"chip " + (types.essay ? "active" : "")} onClick={() => toggleType("essay")}>
                      Tự luận trình bày
                    </button>
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Phong cách trường (tuỳ chọn)</label>
                  <div className="chip-group">
                    <button className={"chip " + (style === "mix" ? "active" : "")} onClick={() => setStyleSel("mix")}>
                      Chung
                    </button>
                    {SCHOOLS.map(s => (
                      <button key={s.id}
                              className={"chip " + (style === s.id ? "active " + s.tone : "")}
                              onClick={() => setStyleSel(s.id)}>
                        {s.short}
                      </button>
                    ))}
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                    Nếu chọn trường cụ thể, câu hỏi sẽ phỏng theo phong cách trường đó.
                  </div>
                </div>

                {(tagOptions[topicId] || []).length > 0 && (
                  <div className="field">
                    <label>Chủ đề con (chọn nhiều — để trống nếu muốn trộn tất cả)</label>
                    <div className="chip-group">
                      {tagOptions[topicId].map(tag => (
                        <button key={tag}
                                className={"chip " + (tags.includes(tag) ? "active" : "")}
                                onClick={() => toggleTag(tag)}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(1)}><Ico name="back" /> Quay lại</button>
                  <button className="btn primary" disabled={!Object.values(types).some(Boolean)} onClick={() => setStep(3)}>
                    Tiếp tục <Ico name="arrow" />
                  </button>
                </div>
              </Card>
            )}

            {/* Step 3: Preview & generate */}
            {step === 3 && (
              <Card>
                <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Xem trước & tạo bộ bài tập</h3>
                <p className="muted" style={{ margin: "0 0 18px", fontSize: 13 }}>Đặt tên hiển thị và xác nhận.</p>

                <div className="field" style={{ marginBottom: 18 }}>
                  <label>Tên bộ bài tập</label>
                  <input className="input" placeholder={suggestedName}
                         value={setName} onChange={(e) => setSetName(e.target.value)} />
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                    Để trống = dùng tên gợi ý ở trên.
                  </div>
                </div>

                <div style={{
                  background: "var(--surface-2)", borderRadius: 12,
                  padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16
                }}>
                  <div>
                    <div className="eyebrow">Chuyên đề</div>
                    <div className="row" style={{ gap: 8, marginTop: 4 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: `color-mix(in oklch, ${topic.color}, white 86%)`,
                        color: topic.color, display: "grid", placeItems: "center",
                        fontSize: 11, fontWeight: 700
                      }}>{topic.ico}</span>
                      <b style={{ fontSize: 14 }}>{topic.name}</b>
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow">Tên hiển thị</div>
                    <b style={{ fontSize: 14 }}>{finalName}</b>
                  </div>
                  <div>
                    <div className="eyebrow">Mức · Số câu · Thời lượng</div>
                    <b className="mono" style={{ fontSize: 14 }}>{difficulty} · {qcount} câu · {minutes} phút</b>
                  </div>
                  <div>
                    <div className="eyebrow">Dạng câu</div>
                    <b style={{ fontSize: 13 }}>
                      {[types.fill && "Điền", types.mcq && "Trắc nghiệm", types.essay && "Tự luận"].filter(Boolean).join(" · ")}
                    </b>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="eyebrow">Phong cách & tag</div>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                      <Pill tone={style === "mix" ? "" : style}>{style === "mix" ? "Chung" : SCHOOLS.find(s => s.id === style)?.short}</Pill>
                      {tags.length > 0
                        ? tags.map(t => <Pill key={t}>{t}</Pill>)
                        : <span className="muted" style={{ fontSize: 12 }}>Tất cả chủ đề con</span>}
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: 18, padding: 14, background: "var(--accent-soft)",
                  borderRadius: 10, fontSize: 13, color: "var(--accent-ink)",
                  border: "1px solid oklch(0.92 0.04 40)"
                }}>
                  <b><Ico name="sparkle" size={13} /> Khỉ con sẽ:</b>
                  <ul style={{ margin: "6px 0 0 22px", padding: 0, lineHeight: 1.6 }}>
                    <li>Lấy {qcount} câu thuộc chuyên đề <b>{topic.short}</b> từ ngân hàng</li>
                    <li>Lọc theo mức <b>{difficulty}</b> và {tags.length > 0 ? tags.length + " chủ đề con" : "tất cả chủ đề con"}</li>
                    <li>Phỏng tạo biến thể, sắp xếp khó tăng dần</li>
                    <li>Bộ bài sẽ xuất hiện trong "Luyện chuyên đề → {topic.short}" của học sinh</li>
                  </ul>
                </div>

                <div className="row between" style={{ marginTop: 22 }}>
                  <button className="btn ghost" onClick={() => setStep(2)} disabled={generating}><Ico name="back" /> Quay lại</button>
                  <button className="btn primary lg" onClick={generate} disabled={generating}>
                    {generating
                      ? <Fragment><Ico name="refresh" /> Đang tạo bộ bài tập…</Fragment>
                      : <Fragment><Ico name="sparkle" /> Tạo bộ bài và mở ngay</Fragment>}
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { CreateExercise });
