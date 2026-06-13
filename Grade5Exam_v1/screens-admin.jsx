/* =========================================================
   Admin (sketched) — overview, exams, users, questions
   ========================================================= */
const { useState: useStateAd } = React;

const Admin = () => {
  const [tab, setTab] = useStateAd("overview");

  return (
    <div className="main">
      <TopBar crumbs={["Quản trị"]}
              actions={
                <Fragment>
                  <button className="btn"><Ico name="download" /> Xuất báo cáo</button>
                  <button className="btn primary"><Ico name="plus" /> Thêm đề mới</button>
                </Fragment>
              } />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Trang quản trị</h2>
            <p>Quản lý đề thi, ngân hàng câu hỏi, người dùng, và xem thống kê tổng quan.</p>
          </div>
          <Pill tone="amber"><span className="dot" />Bản phác thảo · 5 chức năng</Pill>
        </div>

        <div className="admin-tabs">
          {[
            { id: "overview", l: "Tổng quan" },
            { id: "exams", l: "Đề thi" },
            { id: "bank", l: "Ngân hàng câu hỏi" },
            { id: "topics", l: "Chuyên đề" },
            { id: "users", l: "Người dùng" },
            { id: "settings", l: "Cấu hình" }
          ].map(t => (
            <div key={t.id} className={"tab " + (tab === t.id ? "active" : "")} onClick={() => setTab(t.id)}>
              {t.l}
            </div>
          ))}
        </div>

        {tab === "overview" && <AdminOverview />}
        {tab === "exams" && <AdminExams />}
        {tab === "bank" && <AdminBank />}
        {tab === "topics" && <AdminTopics />}
        {tab === "users" && <AdminUsers />}
        {tab === "settings" && <AdminSettings />}
      </div>
    </div>
  );
};

const AdminOverview = () => (
  <Fragment>
    <div className="grid cols-4" style={{ marginBottom: 22 }}>
      {[
        { k: "Người dùng đang học", v: "1.284", d: "+86 tuần này", tone: "var(--accent-ink)" },
        { k: "Đề đã có", v: "38", d: "+2 tuần này", tone: "var(--cg)" },
        { k: "Câu hỏi trong NHC", v: "476", d: "+24 tuần này", tone: "var(--ltv)" },
        { k: "Đã hoàn thành", v: "9.731", d: "lượt làm bài", tone: "var(--success)" }
      ].map((s, i) => (
        <Card key={i} tight>
          <div className="eyebrow">{s.k}</div>
          <div className="kpi" style={{ color: s.tone, fontSize: 28, marginTop: 6 }}>{s.v}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{s.d}</div>
        </Card>
      ))}
    </div>

    <div className="grid cols-2" style={{ marginBottom: 16 }}>
      <Card title="Lượt làm bài 14 ngày qua" sub="Theo trường">
        <div style={{ display: "flex", height: 200, gap: 4, alignItems: "flex-end", paddingTop: 16 }}>
          {Array.from({ length: 14 }, (_, i) => {
            const total = 50 + Math.round(Math.sin(i / 2) * 20 + Math.random() * 30);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 2 }}>
                <div style={{ height: total * 0.35 + "%", background: "var(--cg)", borderRadius: "3px 3px 0 0" }} />
                <div style={{ height: total * 0.25 + "%", background: "var(--ntt)" }} />
                <div style={{ height: total * 0.2 + "%", background: "var(--ltv)" }} />
                <div style={{ height: total * 0.2 + "%", background: "var(--tx)", borderRadius: "0 0 3px 3px" }} />
              </div>
            );
          })}
        </div>
        <div className="row" style={{ gap: 14, marginTop: 12, fontSize: 12 }}>
          {SCHOOLS.map(s => (
            <span key={s.id} className="row" style={{ gap: 5 }}>
              <span style={{ width: 8, height: 8, background: s.color, borderRadius: 2 }} />{s.short}
            </span>
          ))}
        </div>
      </Card>

      <Card title="Chuyên đề học sinh yếu nhất" sub="Tỉ lệ sai trung bình toàn hệ thống">
        <div className="col" style={{ gap: 10 }}>
          {[
            { t: "Hình học (NC)", v: 68 },
            { t: "Chuyển động (2 vật)", v: 64 },
            { t: "Suy luận logic", v: 58 },
            { t: "Toán tuổi", v: 42 },
            { t: "Phân số & %", v: 38 }
          ].map((r, i) => (
            <div key={i}>
              <div className="row between" style={{ marginBottom: 3 }}>
                <span style={{ fontSize: 13 }}>{r.t}</span>
                <b className="mono" style={{ fontSize: 13, color: r.v >= 60 ? "var(--danger)" : "var(--ink)" }}>{r.v}% sai</b>
              </div>
              <Bar value={r.v} tone={r.v >= 60 ? "ntt" : "ltv"} />
            </div>
          ))}
        </div>
      </Card>
    </div>

    <Card title="Hoạt động hệ thống mới nhất" sub="Realtime · auto-refresh">
      <table className="tbl">
        <thead>
          <tr><th>Người dùng</th><th>Hoạt động</th><th>Trường</th><th style={{ textAlign: "right" }}>Điểm</th><th style={{ textAlign: "right" }}>Khi</th></tr>
        </thead>
        <tbody>
          {[
            { u: "Trần Bảo An", act: "Nộp đề Cầu Giấy 2024-2025", s: "cg", sc: 78, t: "vừa xong" },
            { u: "Nguyễn Minh Anh", act: "Hỏi AI câu 8 (Toán tuổi)", s: null, sc: null, t: "1 phút trước" },
            { u: "Phạm Quốc Khánh", act: "Tạo đề mới (phong cách NTT, 15 câu)", s: "ntt", sc: null, t: "3 phút trước" },
            { u: "Lê Hà My", act: "Hoàn thành bộ Chuyển động Lớp 5", s: null, sc: 9, t: "5 phút trước" },
            { u: "Vũ Đức Anh", act: "Nộp đề Thanh Xuân 2025-2026", s: "tx", sc: 65, t: "8 phút trước" },
            { u: "Hoàng Khánh Linh", act: "Đăng ký mới (Gmail)", s: null, sc: null, t: "12 phút trước" }
          ].map((r, i) => (
            <tr key={i}>
              <td><b style={{ fontWeight: 500 }}>{r.u}</b></td>
              <td>{r.act}</td>
              <td>{r.s && <Pill tone={r.s}>{SCHOOLS.find(s => s.id === r.s).short}</Pill>}</td>
              <td style={{ textAlign: "right" }} className="mono">{r.sc !== null ? r.sc + (r.sc >= 10 ? "" : "%") : "—"}</td>
              <td style={{ textAlign: "right" }} className="muted">{r.t}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </Fragment>
);

const AdminExams = () => {
  const [kindF, setKindF] = useStateAd("all");
  const filtered = PAST_EXAMS.filter(e => kindF === "all" || e.kind === kindF);
  return (
    <Card>
      <div className="row between" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 8 }}>
          <input className="input" placeholder="Tìm theo tên, năm, trường…" style={{ width: 280 }} />
          <div className="row" style={{ gap: 0, border: "1px solid var(--border)", borderRadius: 8, padding: 3, background: "var(--surface-2)" }}>
            {[
              { id: "all", l: "Tất cả" },
              { id: "official", l: "Chính thức" },
              { id: "reference", l: "Tham khảo" }
            ].map(t => (
              <button key={t.id} onClick={() => setKindF(t.id)}
                      style={{
                        padding: "4px 12px", border: 0,
                        background: kindF === t.id ? "var(--surface)" : "transparent",
                        borderRadius: 6, cursor: "pointer", fontSize: 12.5,
                        fontWeight: kindF === t.id ? 600 : 500,
                        color: kindF === t.id ? "var(--ink)" : "var(--ink-muted)"
                      }}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
        <button className="btn primary"><Ico name="plus" /> Thêm đề chính thức</button>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Tên đề</th><th>Loại</th><th>Trường</th><th>Năm</th><th>Câu</th><th>Lượt làm</th><th>TB điểm</th><th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(e => {
            const s = SCHOOLS.find(x => x.id === e.school) || { short: "MIX", tone: "" };
            const att = 40 + Math.round(((e.id.charCodeAt(2) || 0) * 7) % 200);
            return (
              <tr key={e.id}>
                <td>
                  <b style={{ fontWeight: 500 }}>
                    {e.kind === "official" ? "Đề thi " + s.short + " · " + e.year : e.year}
                  </b>
                  {e.note && <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{e.note}</div>}
                </td>
                <td><KindBadge kind={e.kind} mixRatio={e.mixRatio} compact /></td>
                <td><Pill tone={s.tone}>{s.short}</Pill></td>
                <td className="mono">{e.year}</td>
                <td className="mono">{e.qcount}</td>
                <td className="mono">{att}</td>
                <td className="mono" style={{ color: "var(--ink-muted)" }}>{(58 + ((e.id.charCodeAt(0) || 0) % 25)).toFixed(1)}%</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn sm ghost"><Ico name="eye" size={12} /> Xem</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
};

const AdminBank = () => {
  const [kindF, setKindF] = useStateAd("all");

  /* Compose displayed questions: official (SAMPLE_EXAM) + a few reference stubs */
  const refQuestions = [
    { id: "ref-q1", stem: "Một xe đạp đi từ A đến B với vận tốc 12 km/giờ, hết 1 giờ 15 phút. Tính độ dài AB.",
      topic: "cd", grade: "L5", type: "fill",
      source: { kind: "reference", label: "Phỏng đề CG · 2026" } },
    { id: "ref-q2", stem: "Tính nhanh: 25 × 36 + 25 × 64",
      topic: "soh", grade: "L4", type: "fill",
      source: { kind: "reference", label: "Phỏng tạo · 2026" } },
    { id: "ref-q3", stem: "Cho hình chữ nhật có chu vi 36cm, chiều dài hơn chiều rộng 4cm. Diện tích là bao nhiêu?",
      topic: "hinh", grade: "L4", type: "fill",
      source: { kind: "reference", label: "Phỏng đề NTT · 2026" } },
    { id: "ref-q4", stem: "Tổng tuổi 2 mẹ con là 38. 4 năm trước tuổi mẹ gấp 6 lần tuổi con. Tính tuổi mỗi người.",
      topic: "tuoi", grade: "L4+5", type: "essay",
      source: { kind: "reference", label: "Phỏng đề LTV · 2026" } }
  ];
  const officialQuestions = SAMPLE_EXAM.questions.map(q => ({
    ...q,
    source: { kind: "official", label: "CG · 2024-2025" }
  }));
  const allQ = [...officialQuestions, ...refQuestions];
  const filteredQ = allQ.filter(q => kindF === "all" || q.source.kind === kindF);

  return (
    <Fragment>
      <div className="row between" style={{ marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15 }}>Ngân hàng câu hỏi</h3>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 12.5 }}>
            <b className="mono">{officialQuestions.length}</b> câu từ đề chính thức · <b className="mono">{refQuestions.length}</b> câu phỏng tạo / tham khảo
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn"><Ico name="upload" size={13} /> Import từ PDF</button>
          <button className="btn primary"><Ico name="plus" /> Thêm câu hỏi</button>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginBottom: 22 }}>
        {TOPICS.slice(0, 6).map(t => (
          <Card key={t.id} tight>
            <div className="row" style={{ gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `color-mix(in oklch, ${t.color}, white 86%)`,
                color: t.color, display: "grid", placeItems: "center", fontWeight: 700
              }}>{t.ico}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.short}</div>
                <div className="muted" style={{ fontSize: 11 }}>
                  <b>{Math.round(((t.id.charCodeAt(0) || 0) * 3) % 60) + 30}</b> câu
                  <span style={{ color: "var(--ink-faint)" }}> · </span>
                  <span style={{ color: "var(--ink)" }}>{Math.round(((t.id.charCodeAt(0) || 0) * 2) % 30) + 10} chính thức</span>
                </div>
              </div>
              <button className="btn sm ghost" style={{ marginLeft: "auto" }}><Ico name="plus" size={11} /></button>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 0, border: "1px solid var(--border)", borderRadius: 8, padding: 3, background: "var(--surface-2)" }}>
            {[
              { id: "all", l: "Tất cả · " + allQ.length },
              { id: "official", l: "Chính thức · " + officialQuestions.length },
              { id: "reference", l: "Tham khảo · " + refQuestions.length }
            ].map(t => (
              <button key={t.id} onClick={() => setKindF(t.id)}
                      style={{
                        padding: "4px 12px", border: 0,
                        background: kindF === t.id ? "var(--surface)" : "transparent",
                        borderRadius: 6, cursor: "pointer", fontSize: 12.5,
                        fontWeight: kindF === t.id ? 600 : 500,
                        color: kindF === t.id ? "var(--ink)" : "var(--ink-muted)"
                      }}>
                {t.l}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Tìm câu hỏi…" style={{ width: 240 }} />
        </div>

        <table className="tbl">
          <thead><tr><th style={{ width: 60 }}>Mã</th><th>Đề bài</th><th style={{ width: 110 }}>Loại</th><th style={{ width: 140 }}>Nguồn</th><th>Chuyên đề</th><th>Lớp</th><th>Dạng</th><th>Tỉ lệ đúng</th><th></th></tr></thead>
          <tbody>
            {filteredQ.map(q => {
              const t = TOPICS.find(x => x.id === q.topic);
              const acc = 30 + (((q.id.charCodeAt(q.id.length - 1) || 0) * 11) % 60);
              return (
                <tr key={q.id}>
                  <td className="mono muted">{q.id.toUpperCase()}</td>
                  <td style={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.stem}</td>
                  <td><KindBadge kind={q.source.kind} compact /></td>
                  <td className="muted" style={{ fontSize: 11.5 }}>{q.source.label}</td>
                  <td><Pill><span className="dot" style={{ background: t.color }} />{t.short}</Pill></td>
                  <td><Pill tone={q.grade === "NC" ? "red" : ""}>{q.grade}</Pill></td>
                  <td className="muted" style={{ fontSize: 12 }}>{q.type === "fill" ? "Điền" : q.type === "mcq" ? "TN" : "Tự luận"}</td>
                  <td className="mono" style={{ color: acc >= 70 ? "var(--success)" : acc >= 50 ? "var(--ink)" : "var(--danger)" }}>{acc}%</td>
                  <td><button className="btn sm ghost"><Ico name="more" size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </Fragment>
  );
};

const AdminTopics = () => {
  const COLORS = [
    "oklch(0.6 0.14 30)",   // terracotta
    "oklch(0.58 0.13 240)", // blue
    "oklch(0.6 0.16 25)",   // red
    "oklch(0.68 0.13 70)",  // amber
    "oklch(0.58 0.14 290)", // purple
    "oklch(0.6 0.14 200)",  // cyan
    "oklch(0.6 0.13 170)",  // teal
    "oklch(0.62 0.13 330)", // pink
    "oklch(0.62 0.13 130)", // green
    "oklch(0.55 0.04 260)", // slate
    "oklch(0.62 0.14 50)"   // orange
  ];
  const PRESET_ICONS = ["123", "△", "½", "→", "?", "↔", "▥", "Δt", ":", "⌚", "Σ", "π", "√", "%", "□", "∠", "○"];

  const [list, setList] = useStateAd(() => TOPICS.map(t => ({ ...t })));
  const [dirty, setDirty] = useStateAd(false);
  const [pickerFor, setPickerFor] = useStateAd(null); // { id, type: 'color'|'icon' }

  const update = (id, patch) => {
    setList(l => l.map(t => t.id === id ? { ...t, ...patch } : t));
    setDirty(true);
  };
  const remove = (id) => {
    if (list.length <= 3) return;
    setList(l => l.filter(t => t.id !== id));
    setDirty(true);
  };
  const move = (id, dir) => {
    const i = list.findIndex(t => t.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setList(copy);
    setDirty(true);
  };
  const add = () => {
    const newId = "new" + Date.now().toString(36).slice(-4);
    setList(l => [...l, {
      id: newId,
      name: "Chuyên đề mới",
      short: "Chưa đặt",
      ico: "★",
      color: COLORS[l.length % COLORS.length]
    }]);
    setDirty(true);
  };
  const save = () => {
    window.TOPICS.length = 0;
    list.forEach(t => window.TOPICS.push(t));
    setDirty(false);
  };
  const reset = () => {
    setList(TOPICS.map(t => ({ ...t })));
    setDirty(false);
  };

  /* Mock question count per topic */
  const counts = { soh: 68, hinh: 92, phan: 88, cd: 42, log: 38, do: 28, xs: 22, tuoi: 24, ti: 26, tg: 18 };

  return (
    <Fragment>
      <div className="row between" style={{ marginBottom: 18 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15 }}>Quản lý nhóm chuyên đề ({list.length} nhóm)</h3>
          <p className="muted" style={{ margin: "2px 0 0", fontSize: 12.5 }}>
            Thêm, đổi tên, đổi màu, sắp xếp lại các chuyên đề. Áp dụng cho toàn bộ ngân hàng câu hỏi & bài tập.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {dirty && <Pill tone="amber"><span className="dot" />Có thay đổi chưa lưu</Pill>}
          <button className="btn" onClick={reset} disabled={!dirty}>Hoàn tác</button>
          <button className="btn primary" onClick={save} disabled={!dirty}>
            <Ico name="check" stroke={2.5} /> Lưu thay đổi
          </button>
        </div>
      </div>

      <Card>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th style={{ width: 60 }}>Icon</th>
              <th style={{ width: 60 }}>Màu</th>
              <th>Tên đầy đủ</th>
              <th style={{ width: 180 }}>Tên ngắn (hiển thị thẻ)</th>
              <th style={{ width: 90 }}>Câu</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.map((t, i) => (
              <tr key={t.id}>
                <td>
                  <div className="col" style={{ gap: 2 }}>
                    <button className="icon-btn" style={{ width: 22, height: 22 }}
                            onClick={() => move(t.id, -1)} disabled={i === 0}>
                      <Ico name="chevL" size={10} stroke={2.5} style={{ transform: "rotate(90deg)" }} />
                    </button>
                    <button className="icon-btn" style={{ width: 22, height: 22 }}
                            onClick={() => move(t.id, 1)} disabled={i === list.length - 1}>
                      <Ico name="chevR" size={10} stroke={2.5} style={{ transform: "rotate(90deg)" }} />
                    </button>
                  </div>
                </td>
                <td>
                  <div className="units-pop" onClick={(e) => e.stopPropagation()}>
                    <button className="tool-btn"
                            style={{ width: 40, height: 36, justifyContent: "center", fontSize: 16,
                                     background: `color-mix(in oklch, ${t.color}, white 86%)`, color: t.color }}
                            onClick={() => setPickerFor(pickerFor?.id === t.id && pickerFor.type === "icon" ? null : { id: t.id, type: "icon" })}>
                      {t.ico}
                    </button>
                    {pickerFor?.id === t.id && pickerFor.type === "icon" && (
                      <div className="units-menu" style={{ minWidth: 240, gridTemplateColumns: "repeat(6, 1fr)" }}>
                        <h6>Chọn ký hiệu</h6>
                        {PRESET_ICONS.map(ic => (
                          <button key={ic} className="tool-btn" style={{ justifyContent: "center" }}
                                  onClick={() => { update(t.id, { ico: ic }); setPickerFor(null); }}>
                            {ic}
                          </button>
                        ))}
                        <input className="input" style={{ gridColumn: "1 / -1", marginTop: 4 }}
                               placeholder="Hoặc gõ tự do (1-3 ký tự)…"
                               maxLength={3}
                               defaultValue={t.ico}
                               onBlur={(e) => { update(t.id, { ico: e.target.value || "·" }); setPickerFor(null); }} />
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="units-pop" onClick={(e) => e.stopPropagation()}>
                    <button className="color-swatch"
                            style={{ background: t.color, width: 36, height: 36 }}
                            onClick={() => setPickerFor(pickerFor?.id === t.id && pickerFor.type === "color" ? null : { id: t.id, type: "color" })} />
                    {pickerFor?.id === t.id && pickerFor.type === "color" && (
                      <div className="units-menu" style={{ minWidth: 200, gridTemplateColumns: "repeat(6, 1fr)" }}>
                        <h6>Chọn màu (cùng độ chroma)</h6>
                        {COLORS.map((c, idx) => (
                          <button key={idx} className="color-swatch"
                                  style={{ background: c, width: 28, height: 28, borderColor: c === t.color ? "var(--ink)" : "var(--border-strong)" }}
                                  onClick={() => { update(t.id, { color: c }); setPickerFor(null); }} />
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <input className="input" value={t.name}
                         onChange={(e) => update(t.id, { name: e.target.value })} />
                </td>
                <td>
                  <input className="input" value={t.short}
                         onChange={(e) => update(t.id, { short: e.target.value })} />
                </td>
                <td className="mono muted">{counts[t.id] || 0} câu</td>
                <td>
                  <button className="btn sm danger" onClick={() => remove(t.id)}
                          disabled={list.length <= 3}
                          title={list.length <= 3 ? "Phải có ít nhất 3 chuyên đề" : "Xoá"}>
                    <Ico name="trash" size={12} /> Xoá
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "16px", borderBottom: 0 }}>
                <button className="btn" onClick={add}>
                  <Ico name="plus" /> Thêm chuyên đề mới
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <div style={{
        marginTop: 18, padding: 14, background: "var(--surface-2)",
        borderRadius: 10, fontSize: 12.5, color: "var(--ink-soft)",
        border: "1px solid var(--border)"
      }}>
        <b>Lưu ý khi sửa chuyên đề:</b>
        <ul style={{ margin: "6px 0 0 20px", lineHeight: 1.6 }}>
          <li>Câu hỏi gắn với chuyên đề bị <b>xoá</b> sẽ chuyển sang "Chưa phân loại" (mặc định).</li>
          <li>Đổi tên / icon / màu sẽ <b>cập nhật ngay</b> trên dashboard học sinh và bảng thống kê.</li>
          <li>Thứ tự ở đây quyết định thứ tự hiển thị trong "Luyện chuyên đề" và "Chi tiết theo chuyên đề".</li>
        </ul>
      </div>
    </Fragment>
  );
};

const AdminUsers = () => (
  <Card>
    <div className="row between" style={{ marginBottom: 16 }}>
      <input className="input" placeholder="Tìm theo tên hoặc email…" style={{ width: 320 }} />
      <span className="muted" style={{ fontSize: 12 }}>1.284 người dùng</span>
    </div>
    <table className="tbl">
      <thead><tr><th></th><th>Tên · Email</th><th>Lớp</th><th>Trường mục tiêu</th><th>Bài đã làm</th><th>Sẵn sàng</th><th>Tham gia</th></tr></thead>
      <tbody>
        {[
          { n: "Trần Bảo An", e: "tranbaoan10@gmail.com", t: ["cg"], at: 24, r: 78, j: "12 ngày" },
          { n: "Nguyễn Minh Anh", e: "minhanh.nguyen@gmail.com", t: ["cg", "ntt"], at: 23, r: 71, j: "24 ngày" },
          { n: "Phạm Quốc Khánh", e: "khanh.pham.04@gmail.com", t: ["ntt", "ltv"], at: 18, r: 64, j: "31 ngày" },
          { n: "Lê Hà My", e: "lehamy2014@gmail.com", t: ["tx"], at: 16, r: 60, j: "8 ngày" },
          { n: "Vũ Đức Anh", e: "ducanh.vu.05@gmail.com", t: ["cg", "tx"], at: 12, r: 55, j: "5 ngày" },
          { n: "Hoàng Khánh Linh", e: "khanhlinh.hoang@gmail.com", t: [], at: 1, r: null, j: "Hôm nay" }
        ].map((u, i) => (
          <tr key={i}>
            <td><div className="avatar">{u.n.split(" ").slice(-1)[0][0]}{u.n[0]}</div></td>
            <td><b style={{ fontWeight: 500 }}>{u.n}</b><div className="muted" style={{ fontSize: 11.5 }}>{u.e}</div></td>
            <td className="mono">5</td>
            <td>{u.t.length === 0 ? <span className="muted">Chưa chọn</span> : u.t.map(id => <Pill key={id} tone={id}>{SCHOOLS.find(s => s.id === id).short}</Pill>)}</td>
            <td className="mono">{u.at}</td>
            <td>{u.r !== null
              ? <span className="mono" style={{ color: u.r >= 70 ? "var(--success)" : "var(--ink)" }}>{u.r}%</span>
              : <span className="muted">—</span>}</td>
            <td className="muted">{u.j}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </Card>
);

const AdminSettings = () => (
  <div className="grid cols-2">
    <Card title="Cấu hình hệ thống" sub="Áp dụng toàn bộ ứng dụng">
      <div className="col" style={{ gap: 14 }}>
        <div className="field">
          <label>Ngày thi mục tiêu</label>
          <input className="input mono" defaultValue="01/06/2026" />
        </div>
        <div className="field">
          <label>Mục tiêu giờ học/tuần mặc định</label>
          <input className="input mono" defaultValue="5" />
        </div>
        <div className="field">
          <label>Mức yêu cầu sẵn sàng để báo "Đủ điều kiện"</label>
          <input className="input mono" defaultValue="75%" />
        </div>
      </div>
    </Card>

    <Card title="AI Tutor" sub="Cấu hình hành vi trợ giảng">
      <div className="col" style={{ gap: 14 }}>
        <div className="field">
          <label>Số gợi ý tối đa / câu</label>
          <input className="input mono" defaultValue="5" />
        </div>
        <div className="field">
          <label>Có cho phép AI tiết lộ đáp án cuối?</label>
          <div className="chip-group">
            <button className="chip active">Có (sau gợi ý cuối)</button>
            <button className="chip">Không bao giờ</button>
          </div>
        </div>
        <div className="field">
          <label>Cho phép hỏi AI trong khi làm đề?</label>
          <div className="chip-group">
            <button className="chip">Cho phép</button>
            <button className="chip active">Khoá (mặc định)</button>
          </div>
        </div>
      </div>
    </Card>
  </div>
);

Object.assign(window, { Admin });
