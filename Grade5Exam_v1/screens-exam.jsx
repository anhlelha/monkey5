/* =========================================================
   Exam-taking + Results + AI Tutor
   ========================================================= */
const { useState: useStateE, useEffect: useEffectE, useRef: useRefE, useMemo: useMemoE } = React;

/* ===== Exam taking ===== */
const ExamTaking = ({ examId, onSubmit, onExit }) => {
  const exam = SAMPLE_EXAM;
  const school = SCHOOLS.find(s => s.id === exam.school);
  const [answers, setAnswers] = useStateE({});
  const [flags, setFlags] = useStateE({});
  const [secondsLeft, setSecondsLeft] = useStateE(exam.minutes * 60);
  const [paused, setPaused] = useStateE(false);
  const [showConfirm, setShowConfirm] = useStateE(false);
  const [showExit, setShowExit] = useStateE(false);

  useEffectE(() => {
    if (paused) return;
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [paused]);

  useEffectE(() => {
    if (secondsLeft === 0) onSubmit(answers);
  }, [secondsLeft]);

  const totalQs = exam.questions.length;
  const isAnswered = (q) => {
    const a = answers[q.id];
    if (a === undefined || a === null) return false;
    if (typeof a === "string") return a.trim() !== "";
    if (typeof a === "object") return (a.text && a.text.trim()) || (a.drawings && a.drawings.length > 0);
    return true;
  };
  const answered = exam.questions.filter(isAnswered).length;
  const progress = (answered / totalQs) * 100;

  const setAns = (id, v) => setAnswers(a => ({ ...a, [id]: v }));
  const toggleFlag = (id) => setFlags(f => ({ ...f, [id]: !f[id] }));

  const timerTone = secondsLeft < 300 ? "danger" : secondsLeft < 600 ? "warn" : "";

  return (
    <div className="exam-shell">
      <div className="exam-topbar">
        <button className="btn ghost" onClick={() => setShowExit(true)}>
          <Ico name="back" /> Thoát phòng thi
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <div className="row" style={{ gap: 8 }}>
            <span className={"pill " + school.tone} style={{ fontWeight: 600 }}>
              <span className="dot" />{school.short}
            </span>
            <KindBadge kind={exam.kind || "official"} compact />
            <b style={{ fontSize: 14, letterSpacing: "-0.005em" }}>{exam.title}</b>
            <span className="muted" style={{ fontSize: 12.5 }}>· {exam.year}</span>
          </div>
          <span className="muted" style={{ fontSize: 11.5 }}>
            {answered}/{totalQs} câu đã trả lời ·
            {Object.values(flags).filter(Boolean).length > 0 && <span> {Object.values(flags).filter(Boolean).length} câu đánh dấu ·</span>}
            <span> {exam.minutes} phút làm bài</span>
          </span>
        </div>
        <div className="spacer" />
        <div className="row" style={{ gap: 8 }}>
          <button className="icon-btn" onClick={() => setPaused(p => !p)} title={paused ? "Tiếp tục" : "Tạm dừng"}>
            <Ico name={paused ? "bolt" : "pause"} />
          </button>
          <div className={"exam-timer " + timerTone}>{fmt.hms(secondsLeft)}</div>
          <button className="btn primary" onClick={() => setShowConfirm(true)}>
            Nộp bài <Ico name="check" stroke={2.5} />
          </button>
        </div>
      </div>

      {/* Top progress bar */}
      <div style={{ height: 3, background: "var(--border-soft)", position: "sticky", top: 64, zIndex: 9 }}>
        <div style={{ height: "100%", width: progress + "%", background: "var(--accent)", transition: "width 0.3s" }} />
      </div>

      <div className="exam-body">
        <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          <h1 style={{ fontSize: 22, margin: "0 0 6px", letterSpacing: "-0.02em" }}>{exam.title}</h1>
          <div className="muted" style={{ fontSize: 13.5 }}>{exam.intro}</div>
          <div style={{
            marginTop: 14, padding: 10, background: "var(--warn-soft)",
            borderRadius: 8, fontSize: 12.5, color: "oklch(0.4 0.1 70)",
            border: "1px solid oklch(0.92 0.06 80)"
          }}>
            <Ico name="lock" size={12} /> <b>Chế độ tập trung:</b> Trong khi làm bài, con không thể hỏi AI. AI tutor sẽ mở sau khi nộp bài.
          </div>
        </div>

        {exam.questions.map(q => (
          <Question key={q.id} q={q}
                    value={answers[q.id]}
                    onChange={(v) => setAns(q.id, v)}
                    flagged={!!flags[q.id]}
                    onFlag={() => toggleFlag(q.id)} />
        ))}

        <div style={{ marginTop: 32, padding: 24, background: "var(--surface-2)", borderRadius: 12, textAlign: "center" }}>
          <h3 style={{ margin: "0 0 6px" }}>Đã xong hết các câu hỏi</h3>
          <p className="muted" style={{ margin: "0 0 16px", fontSize: 13.5 }}>
            Con đã trả lời <b>{answered}/{totalQs}</b> câu. Kiểm tra lại các câu đánh dấu trước khi nộp.
          </p>
          <button className="btn primary lg" onClick={() => setShowConfirm(true)}>
            Nộp bài và xem kết quả <Ico name="arrow" />
          </button>
        </div>
      </div>

      {/* Question navigator rail */}
      <div className="exam-rail">
        <h6>Bản đồ câu hỏi</h6>
        <div className="q-grid">
          {exam.questions.map(q => (
            <button key={q.id}
                    className={
                      (isAnswered(q) ? "answered " : "") +
                      (flags[q.id] ? "flagged" : "")
                    }
                    title={"Câu " + q.num + (flags[q.id] ? " — đánh dấu" : "")}
                    onClick={() => {
                      const el = document.getElementById("q-" + q.id);
                      if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: "smooth" });
                    }}>
              {q.num}
            </button>
          ))}
        </div>
        <div className="hr" />
        <div style={{ fontSize: 11.5, color: "var(--ink-muted)", lineHeight: 1.5 }}>
          <div className="row" style={{ gap: 6, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: 2 }} /> Đã trả lời
          </div>
          <div className="row" style={{ gap: 6, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, background: "var(--warn)", borderRadius: 2 }} /> Đánh dấu xem lại
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span style={{ width: 10, height: 10, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 2 }} /> Chưa làm
          </div>
        </div>
      </div>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Nộp bài?"
             actions={
               <Fragment>
                 <button className="btn" onClick={() => setShowConfirm(false)}>Quay lại làm tiếp</button>
                 <button className="btn primary" onClick={() => onSubmit(answers)}>Nộp bài</button>
               </Fragment>
             }>
        Con đã trả lời <b>{answered}/{totalQs}</b> câu.
        {totalQs - answered > 0 && <span> Còn <b style={{ color: "var(--warn)" }}>{totalQs - answered} câu chưa làm</b> — nếu nộp bây giờ những câu đó sẽ tính là sai.</span>}
        <br /><br />
        Sau khi nộp, con sẽ xem được điểm số, lời giải chi tiết, và <b>được hỏi AI</b> về từng câu.
      </Modal>

      <Modal open={showExit} onClose={() => setShowExit(false)} title="Thoát phòng thi?"
             actions={
               <Fragment>
                 <button className="btn" onClick={() => setShowExit(false)}>Ở lại làm tiếp</button>
                 <button className="btn danger" onClick={onExit}>Thoát (không lưu)</button>
               </Fragment>
             }>
        Nếu thoát bây giờ, các câu trả lời của con sẽ không được lưu lại.
      </Modal>
    </div>
  );
};

/* ===== Single question renderer ===== */
const Question = ({ q, value, onChange, flagged, onFlag, readOnly, correct }) => {
  const topic = TOPICS.find(t => t.id === q.topic);
  return (
    <div className="question" id={"q-" + q.id}>
      <div className="q-num">Câu {q.num}.</div>
      <div className="q-body">
        <div className="q-stem">{q.stem}</div>

        {q.figure === "square-circle" && (
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: "block" }}>
            <rect x="10" y="10" width="100" height="100" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth="1.5" />
            <circle cx="60" cy="60" r="50" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
            <path d="M10,10 L110,10 L110,110 L10,110 Z M60,60 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0"
                  fill="oklch(0.85 0.04 40)" fillRule="evenodd" />
            <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--ink-muted)" fontFamily="JetBrains Mono">10cm</text>
          </svg>
        )}

        <div className="q-tags">
          <Pill tone={topic ? "" : ""} style={{ borderColor: topic.color }}>
            <span className="dot" style={{ background: topic.color }} />{topic.short}
          </Pill>
          <Pill tone={q.grade === "NC" ? "red" : q.grade === "L4+5" ? "amber" : ""}>{q.grade}</Pill>
          {q.type === "essay" && <Pill tone="solid">Tự luận · {q.points}đ</Pill>}
          {!readOnly && (
            <button className={"chip sm " + (flagged ? "active" : "")}
                    style={{ padding: "2px 9px", fontSize: 11.5, background: flagged ? "var(--warn)" : undefined, borderColor: flagged ? "var(--warn)" : undefined, color: flagged ? "white" : undefined }}
                    onClick={onFlag}>
              <Ico name="flag" size={11} /> {flagged ? "Đã đánh dấu" : "Đánh dấu xem lại"}
            </button>
          )}
        </div>

        {q.type === "fill" && (
          <div className="q-answer">
            <label>Đáp án</label>
            <div className="q-input-row">
              <input className="input" type="text"
                     placeholder={q.placeholder}
                     value={value || ""}
                     readOnly={readOnly}
                     onChange={(e) => onChange(e.target.value)}
                     style={readOnly ? {
                       background: value === q.correct ? "var(--success-soft)" : "var(--danger-soft)",
                       color: value === q.correct ? "var(--success)" : "var(--danger)",
                       borderColor: value === q.correct ? "var(--success)" : "var(--danger)"
                     } : {}} />
              {q.unit && <span className="unit">{q.unit}</span>}
              {readOnly && value !== q.correct && (
                <span style={{ fontSize: 13, color: "var(--ink-muted)", marginLeft: 6 }}>
                  Đáp án đúng: <b className="mono" style={{ color: "var(--success)" }}>{q.correct}</b> {q.unit}
                </span>
              )}
              {readOnly && value === q.correct && (
                <Pill tone="green"><Ico name="check" size={11} stroke={3} /> Đúng</Pill>
              )}
            </div>
          </div>
        )}

        {q.type === "mcq" && (
          <div className="mcq-list">
            {q.options.map(o => {
              const sel = value === o.id;
              const isCorrect = readOnly && o.id === q.correct;
              const isWrong = readOnly && sel && o.id !== q.correct;
              return (
                <div key={o.id}
                     className={"mcq-opt" + (sel && !readOnly ? " selected" : "") + (isCorrect ? " correct" : "") + (isWrong ? " wrong" : "")}
                     onClick={() => !readOnly && onChange(o.id)}>
                  <div className="marker">{o.id}</div>
                  <span style={{ flex: 1 }}>{o.text}</span>
                  {isCorrect && <Ico name="check" size={14} stroke={2.5} />}
                  {isWrong && <Ico name="x" size={14} stroke={2.5} />}
                </div>
              );
            })}
          </div>
        )}

        {q.type === "essay" && (
          <div className="q-answer q-essay">
            <label>Trình bày lời giải chi tiết</label>
            <MathInput value={typeof value === "object" && value !== null ? value.text : value}
                       drawings={typeof value === "object" && value !== null ? value.drawings : []}
                       onChange={(t) => onChange({
                         text: t,
                         drawings: (typeof value === "object" && value !== null) ? value.drawings : []
                       })}
                       onDrawingsChange={(d) => onChange({
                         text: (typeof value === "object" && value !== null) ? value.text : (value || ""),
                         drawings: d
                       })}
                       placeholder={q.placeholder}
                       readOnly={readOnly}
                       rows={8} />
            {readOnly && (
              <div style={{
                marginTop: 8, padding: 12,
                background: "var(--surface-2)", borderRadius: 8,
                borderLeft: "3px solid " + (value === q.correct ? "var(--success)" : "var(--danger)"),
                fontSize: 13
              }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Đáp số đúng</div>
                <b className="mono">{q.modelAnswer}</b>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== Results ===== */
const Results = ({ examId, answers, onNav, onRetry }) => {
  const exam = SAMPLE_EXAM;
  const useAnswers = answers || MOCK_ANSWERS;
  const school = SCHOOLS.find(s => s.id === exam.school);

  const graded = exam.questions.map(q => {
    const a = useAnswers[q.id];
    const correct = a === q.correct;
    const empty = a === undefined || a === null || a === "";
    return { q, answer: a, correct, empty, earned: correct ? q.points : 0 };
  });

  const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0);
  const earnedPoints = graded.reduce((s, g) => s + g.earned, 0);
  const score10 = ((earnedPoints / totalPoints) * 10).toFixed(1);
  const scorePct = Math.round((earnedPoints / totalPoints) * 100);
  const correctCount = graded.filter(g => g.correct).length;
  const wrongCount = graded.filter(g => !g.correct && !g.empty).length;
  const skipCount = graded.filter(g => g.empty).length;

  /* by topic */
  const byTopic = {};
  graded.forEach(g => {
    const tid = g.q.topic;
    if (!byTopic[tid]) byTopic[tid] = { correct: 0, total: 0, points: 0, max: 0 };
    byTopic[tid].total += 1;
    byTopic[tid].max += g.q.points;
    if (g.correct) { byTopic[tid].correct += 1; byTopic[tid].points += g.q.points; }
  });

  const [tutorQ, setTutorQ] = useStateE(null);

  return (
    <div className="main">
      <TopBar crumbs={["Trang chính", "Đề thi mẫu", "Kết quả"]}
              actions={
                <Fragment>
                  <button className="btn" onClick={onRetry}><Ico name="refresh" /> Làm lại đề này</button>
                  <button className="btn" onClick={() => onNav("library")}><Ico name="library" /> Chọn đề khác</button>
                </Fragment>
              } />
      <div className="content">
        {/* Hero */}
        <div className="score-hero" style={{ marginBottom: 24 }}>
          <Donut value={earnedPoints} max={totalPoints} size={140}
                 color="var(--accent)" label={score10} subLabel={"/ 10"} />
          <div className="score-summary" style={{ flex: 1 }}>
            <div className="row" style={{ gap: 10, marginBottom: 4 }}>
              <Pill tone={school.tone}><span className="dot" />{school.short}</Pill>
              <KindBadge kind={exam.kind || "official"} compact />
              <span className="eyebrow">{exam.year}</span>
            </div>
            <h2>Điểm tổng: <span className="mono" style={{ color: "var(--accent-ink)" }}>{score10}/10</span></h2>
            <p>{exam.title} · {Math.round((earnedPoints / totalPoints) * 100)}% — {scorePct >= 80 ? "Xuất sắc, con đã sẵn sàng!" : scorePct >= 65 ? "Khá tốt, còn vài chỗ cần luyện." : scorePct >= 50 ? "Tạm ổn, mình cùng xem lại các câu sai nhé." : "Cố lên! Khỉ con sẽ giúp con hiểu từng câu."}</p>
            <div className="score-stats">
              <div className="stat">
                <div className="k">Đúng</div>
                <div className="v" style={{ color: "var(--success)" }}>{correctCount}<small style={{ fontSize: 13, color: "var(--ink-muted)" }}>/{exam.questions.length}</small></div>
              </div>
              <div className="stat">
                <div className="k">Sai</div>
                <div className="v" style={{ color: "var(--danger)" }}>{wrongCount}</div>
              </div>
              <div className="stat">
                <div className="k">Bỏ trống</div>
                <div className="v" style={{ color: "var(--ink-muted)" }}>{skipCount}</div>
              </div>
              <div className="stat">
                <div className="k">Thời gian dùng</div>
                <div className="v">28<small style={{ fontSize: 13, color: "var(--ink-muted)" }}>/{exam.minutes}p</small></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid cols-2" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card title="Phân tích theo chuyên đề" sub="Điểm số con đạt được trong từng nhóm">
            <div className="col" style={{ gap: 12 }}>
              {Object.entries(byTopic).map(([tid, st]) => {
                const t = TOPICS.find(x => x.id === tid);
                const pct = st.max > 0 ? (st.points / st.max) * 100 : 0;
                return (
                  <div key={tid}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <span className="row" style={{ gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 2, background: t.color }} />
                        <b style={{ fontSize: 13 }}>{t.name}</b>
                        <span className="muted" style={{ fontSize: 11.5 }}>{st.correct}/{st.total} câu</span>
                      </span>
                      <b className="mono" style={{ fontSize: 13, color: pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--ink)" : "var(--danger)" }}>{Math.round(pct)}%</b>
                    </div>
                    <Bar value={pct} tone={pct >= 70 ? "" : pct >= 50 ? "ltv" : "ntt"} />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Tác động đến % sẵn sàng" sub="Sau bài này, mức sẵn sàng được cập nhật">
            <div className="col" style={{ gap: 14 }}>
              {SCHOOLS.filter(s => USER.targets.includes(s.id)).map(s => {
                const before = USER.readiness[s.id];
                const delta = s.id === "cg" ? 3 : 1;
                const after = before + delta;
                return (
                  <div key={s.id}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <span className="row" style={{ gap: 8 }}>
                        <span className={"pill " + s.tone}>{s.short}</span>
                        <span style={{ fontSize: 13 }}>{s.name}</span>
                      </span>
                      <span className="mono" style={{ fontSize: 13 }}>
                        <span className="muted">{before}%</span>
                        <span style={{ color: "var(--success)", margin: "0 6px" }}>→ {after}%</span>
                        <Pill tone="green">+{delta}</Pill>
                      </span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <Bar value={after} tone={s.tone} tall />
                      <div style={{
                        position: "absolute", top: 0, left: 0, height: "100%",
                        width: before + "%", borderRight: "2px dashed white", opacity: 0.7
                      }} />
                    </div>
                  </div>
                );
              })}
              <div style={{
                marginTop: 4, padding: 12, background: "var(--accent-soft)",
                borderRadius: 8, fontSize: 12.5, color: "var(--accent-ink)"
              }}>
                <b><Ico name="sparkle" size={12} /> Gợi ý của Khỉ con:</b> Hai câu sai liên quan đến <b>Chuyển động</b> và <b>Phân số</b>. Khỉ con đề xuất 1 bộ bài Chuyển động Lớp 5 (10 câu) trước khi làm đề tiếp theo.
              </div>
            </div>
          </Card>
        </div>

        {/* Review */}
        <div className="row between" style={{ margin: "8px 0 16px" }}>
          <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>Xem lại từng câu</h3>
          <div className="row" style={{ gap: 8 }}>
            <Pill tone="green">{correctCount} đúng</Pill>
            <Pill tone="red">{wrongCount} sai</Pill>
            <Pill>{skipCount} bỏ</Pill>
          </div>
        </div>

        <div className="col" style={{ gap: 10 }}>
          {graded.map(g => {
            const t = TOPICS.find(x => x.id === g.q.topic);
            const klass = g.empty ? "skip" : g.correct ? "ok" : "no";
            return (
              <div key={g.q.id} className={"review-q " + klass}>
                <div className="num">Câu {g.q.num}.</div>
                <div>
                  <div className="stem">
                    <div style={{ marginBottom: 6 }}>{g.q.stem}</div>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <Pill><span className="dot" style={{ background: t.color }} />{t.short}</Pill>
                      <Pill tone={g.q.grade === "NC" ? "red" : ""}>{g.q.grade}</Pill>
                      <span style={{ fontSize: 13 }}>
                        Trả lời: {g.empty
                          ? <span className="muted">bỏ trống</span>
                          : <span className={"ans " + (g.correct ? "ok" : "no")}>{g.answer}</span>}
                        {!g.correct && !g.empty && <span> · đúng: <span className="ans ok">{g.q.correct}</span></span>}
                        {g.empty && <span> · đúng: <span className="ans ok">{g.q.correct}</span></span>}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="actions">
                  {!g.correct && (
                    <button className="btn sm primary" onClick={() => setTutorQ(g.q)}>
                      <Ico name="sparkle" size={12} /> Hỏi AI
                    </button>
                  )}
                  {g.correct && (
                    <button className="btn sm ghost" onClick={() => setTutorQ(g.q)}>
                      <Ico name="eye" size={12} /> Xem giải
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tutorQ && <AITutor question={tutorQ} studentAnswer={useAnswers[tutorQ.id]} onClose={() => setTutorQ(null)} />}
    </div>
  );
};

/* ===== AI Tutor — Socratic ===== */
const AITutor = ({ question, studentAnswer, onClose }) => {
  const dialog = SOCRATIC[question.id] || {
    intro: "Cô cùng con đi qua câu này nhé. Mình bắt đầu từ đề bài.",
    hints: [
      "Trước hết, con đọc kỹ đề và nêu cho cô biết: đề cho gì và hỏi gì?",
      "Tiếp theo, con thử nghĩ xem ta có thể dùng công thức/phương pháp nào?",
      "Bây giờ con thử áp dụng công thức đó vào số liệu đề cho, và cho cô biết kết quả nha.",
      "Tốt lắm. Mình kiểm tra lại đơn vị xem có khớp với câu hỏi không nhé."
    ]
  };

  const [messages, setMessages] = useStateE([
    {
      from: "ai",
      content: (
        <Fragment>
          <p>{dialog.intro}</p>
          <p style={{ marginTop: 6, fontSize: 12.5, color: "var(--ink-muted)" }}>
            <b>Cách Khỉ con học:</b> cô gợi mở từng bước. Con suy nghĩ rồi trả lời "Tiếp đi" để nhận gợi ý tiếp theo, hoặc hỏi cô bất cứ điều gì.
          </p>
        </Fragment>
      )
    },
    {
      from: "ai", isHint: true, hintIdx: 0,
      content: <p><span className="hint-num">Gợi ý 1</span>{dialog.hints[0]}</p>
    }
  ]);
  const [hintIdx, setHintIdx] = useStateE(1);
  const [input, setInput] = useStateE("");
  const bodyRef = useRefE(null);

  useEffectE(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const nextHint = () => {
    if (hintIdx >= dialog.hints.length) return;
    setMessages(m => [
      ...m,
      { from: "you", content: <p>Tiếp đi</p> },
      { from: "ai", isHint: true, hintIdx,
        content: <p><span className="hint-num">Gợi ý {hintIdx + 1}</span>{dialog.hints[hintIdx]}</p> }
    ]);
    setHintIdx(i => i + 1);
  };

  const send = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages(m => [...m, { from: "you", content: <p>{text}</p> }]);
    setInput("");
    setTimeout(() => {
      setMessages(m => [...m, {
        from: "ai", content: (
          <Fragment>
            <p>Tốt câu hỏi! Mình thử nghĩ thế này: <i>{text.toLowerCase().includes("đáp") || text.toLowerCase().includes("kết quả") ? "Cô chưa cho đáp án ngay đâu — mình đi từng bước nha." : "đúng hướng rồi."}</i></p>
            <p style={{ marginTop: 6 }}>Con thử trả lời gợi ý <b>{hintIdx}</b> phía trên, hoặc bấm "Gợi ý tiếp theo" để mình đi tiếp.</p>
          </Fragment>
        )
      }]);
    }, 500);
  };

  const isStudentWrong = studentAnswer !== undefined && studentAnswer !== "" && studentAnswer !== question.correct;

  return (
    <div className="tutor-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="tutor-panel">
        <div className="tutor-head">
          <div className="ai-mark">AI</div>
          <div style={{ flex: 1 }}>
            <h4>Khỉ con — Trợ giảng Socratic</h4>
            <div className="sub">Hướng dẫn từng bước · không cho đáp án ngay</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Ico name="x" /></button>
        </div>

        <div className="tutor-body" ref={bodyRef}>
          <div className="tutor-q-ref">
            <div className="lbl">Câu {question.num} · {TOPICS.find(t => t.id === question.topic).short}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{question.stem}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-muted)" }}>
              {isStudentWrong
                ? <span>Bài làm của con: <span className="mono" style={{ color: "var(--danger)" }}>{studentAnswer}</span> — cô giúp con tìm chỗ sai.</span>
                : studentAnswer === undefined || studentAnswer === ""
                  ? <span>Con để trống — không sao, mình bắt đầu từ đầu.</span>
                  : <span>Con đã làm đúng! Mình cùng xem lại cách làm để con nhớ lâu hơn.</span>}
            </div>
          </div>

          {messages.map((m, i) => (
            <div key={i} className={"msg " + m.from}>
              {m.from === "ai" && <div className="av">K</div>}
              <div className="bubble">{m.content}</div>
            </div>
          ))}

          {hintIdx < dialog.hints.length && messages[messages.length - 1].from === "ai" && (
            <div className="suggest-chips" style={{ marginLeft: 38 }}>
              <button className="chip" onClick={nextHint}>
                <Ico name="sparkle" size={12} /> Gợi ý tiếp theo
              </button>
              <button className="chip" onClick={() => {
                setMessages(m => [...m, { from: "you", content: <p>Con hiểu rồi, cảm ơn cô!</p> },
                                          { from: "ai", content: <p>Tuyệt vời! Để chắc chắn, con thử làm lại 1 câu tương tự trong bộ <b>{TOPICS.find(t => t.id === question.topic).short} — Lớp 5</b> nhé.</p> }]);
              }}>Con hiểu rồi</button>
              <button className="chip" onClick={() => {
                setMessages(m => [...m, { from: "you", content: <p>Con vẫn chưa hiểu chỗ này.</p> },
                                          { from: "ai", content: <p>Không sao đâu — cô diễn đạt lại theo cách khác nhé. Con thử nói cho cô nghe: trong đề bài, dữ kiện <i>quan trọng nhất</i> theo con là gì?</p> }]);
              }}>Con chưa hiểu</button>
            </div>
          )}

          {hintIdx >= dialog.hints.length && (
            <div style={{
              marginLeft: 38, padding: 12, background: "var(--success-soft)",
              borderRadius: 10, fontSize: 12.5, color: "var(--success)",
              border: "1px solid color-mix(in oklch, var(--success), white 70%)"
            }}>
              <b><Ico name="check" size={12} stroke={2.5} /> Đã đi hết các bước.</b> Con đã thấy được logic giải rồi nhé. Khỉ con sẽ thêm 2 câu tương tự vào bộ luyện chuyên đề.
            </div>
          )}
        </div>

        <div className="tutor-input">
          <textarea className="textarea"
                    placeholder="Hỏi cô về bước con đang vướng…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    rows={1} />
          <button className="icon-btn" style={{ background: "var(--accent)", color: "white", borderColor: "var(--accent)", width: 40, height: 40 }} onClick={send}>
            <Ico name="send" />
          </button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ExamTaking, Results, AITutor, Question });
