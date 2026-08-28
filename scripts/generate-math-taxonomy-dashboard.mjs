import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const reportsDir = path.join(root, '.reports');
const canonicalDir = process.env.MATH_REASSESSMENT_DIR
  ? path.resolve(process.env.MATH_REASSESSMENT_DIR)
  : null;
const assessmentPath = canonicalDir
  ? path.join(canonicalDir, 'cognition-difficulty-assessments.json')
  : path.join(reportsDir, 'du-lieu-tai-danh-gia-toan-da-phuong-thuc.json');
const manifestPath = canonicalDir
  ? path.join(canonicalDir, 'questions-with-figures.json')
  : path.join(root, '.analysis', 'math-vision-input', 'questions-with-figures.json');
const taxonomyDir = path.join(root, '.analysis', 'topic-taxonomy-v1');
const taxonomyPath = canonicalDir
  ? path.join(canonicalDir, 'topic-taxonomy-v1-assessments.json')
  : path.join(taxonomyDir, 'topic-taxonomy-v1-assessments.json');
const taxonomySummaryPath = canonicalDir
  ? path.join(canonicalDir, 'run-summary.json')
  : path.join(taxonomyDir, 'topic-taxonomy-v1-summary.json');
const comparisonPath = canonicalDir
  ? path.join(canonicalDir, 'topic-taxonomy-v1-comparison.json')
  : path.join(taxonomyDir, 'topic-taxonomy-v1-comparison.json');

for (const file of [assessmentPath, manifestPath, taxonomyPath, taxonomySummaryPath, comparisonPath]) {
  if (!fs.existsSync(file)) throw new Error(`Missing required input: ${file}`);
}

const cognitiveAssessments = JSON.parse(fs.readFileSync(assessmentPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const taxonomyAssessments = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
const taxonomySummary = JSON.parse(fs.readFileSync(taxonomySummaryPath, 'utf8'));
const comparison = JSON.parse(fs.readFileSync(comparisonPath, 'utf8'));

const schoolMeta = {
  cg: { short: 'CG', name: 'Cầu Giấy', color: '#7868b6' },
  ntt: { short: 'NTT', name: 'Nguyễn Tất Thành', color: '#0b8b94' },
  ltv: { short: 'LTV', name: 'Lương Thế Vinh', color: '#d2713f' },
  tx: { short: 'TX', name: 'Thanh Xuân', color: '#3f83b8' },
  nn: { short: 'NN', name: 'Ngoại ngữ', color: '#9b7292' },
  ntl: { short: 'NTL', name: 'Nam Từ Liêm', color: '#c55063' },
  nshn: { short: 'NSHN', name: 'Ngôi Sao Hà Nội', color: '#bd7b2a' },
  nshm: { short: 'NSHM', name: 'Ngôi Sao Hoàng Mai', color: '#619a6f' },
  ams: { short: 'AMS', name: 'Amsterdam', color: '#3e66aa' },
  arc: { short: 'ARC', name: 'Archimedes', color: '#795bb1' },
  nksp: { short: 'NKSP', name: 'Năng Khiếu Sư Phạm', color: '#278a83' },
};

const topicMeta = {
  num_div: { label: 'Số tự nhiên, chữ số & chia hết', group: 'Số & Đại số', color: '#4267a7' },
  frac_decimal: { label: 'Phân số & số thập phân', group: 'Số & Đại số', color: '#6a62b3' },
  ratio_percent: { label: 'Tỉ số, phần trăm & tỉ lệ', group: 'Số & Đại số', color: '#3d87a1' },
  sequence_pattern: { label: 'Dãy số, quy luật & đại số sơ cấp', group: 'Số & Đại số', color: '#8a6db5' },
  plane_geometry: { label: 'Hình phẳng & diện tích', group: 'Hình học & Đo lường', color: '#cf7447' },
  solid_geometry: { label: 'Hình khối & thể tích', group: 'Hình học & Đo lường', color: '#b8586e' },
  measurement: { label: 'Đo lường, đơn vị & ước lượng', group: 'Hình học & Đo lường', color: '#b8843d' },
  time_calendar: { label: 'Thời gian & lịch', group: 'Hình học & Đo lường', color: '#60778d' },
  motion: { label: 'Chuyển động đều', group: 'Hình học & Đo lường', color: '#2f8990' },
  work_rate: { label: 'Công việc, năng suất & lưu lượng', group: 'Số & Đại số', color: '#4f9d78' },
  data_probability: { label: 'Dữ liệu, thống kê & xác suất', group: 'Thống kê & Xác suất', color: '#8065a5' },
  counting_combinatorics: { label: 'Đếm & tổ hợp', group: 'Giải quyết vấn đề', color: '#a46083' },
  logic_strategy: { label: 'Logic, bất biến & chiến lược', group: 'Giải quyết vấn đề', color: '#7e618f' },
};

const tagMeta = {
  ctx_age: 'Bài toán tuổi',
  ctx_map_scale: 'Tỉ lệ bản đồ / scale',
  ctx_finance_commerce: 'Tài chính / mua bán',
  rep_diagram_required: 'Cần đọc hình / biểu đồ',
  cross_domain: 'Liên chuyên đề thực sự',
};

const sourceTopicMeta = {
  soh: 'Số học & số tự nhiên', hinh: 'Hình học', phan: 'Phân số, tỉ số & %', cd: 'Chuyển động',
  log: 'Suy luận logic', do: 'Đo lường & đổi đơn vị', xs: 'Biểu đồ, thống kê & xác suất',
  tuoi: 'Toán tuổi', ti: 'Đại lượng tỉ lệ & bản đồ', tg: 'Thời gian',
};

const levelMeta = {
  co_ban: { label: 'Cơ bản', color: '#64748b' },
  van_dung: { label: 'Vận dụng', color: '#4779b2' },
  nang_cao: { label: 'Nâng cao', color: '#a05c7c' },
  chuyen_sau: { label: 'Chuyên sâu', color: '#71468d' },
};

const manifestById = new Map(manifest.map((row) => [row.questionId, row]));
const taxonomyById = new Map(taxonomyAssessments.map((row) => [row.questionId, row]));
if (taxonomyAssessments.length !== cognitiveAssessments.length || taxonomyAssessments.length !== manifest.length) {
  throw new Error(`Coverage mismatch: taxonomy=${taxonomyAssessments.length}, cognitive=${cognitiveAssessments.length}, manifest=${manifest.length}`);
}

const questions = cognitiveAssessments.map((assessment) => {
  const source = manifestById.get(assessment.questionId);
  const topic = taxonomyById.get(assessment.questionId);
  if (!source || !topic) throw new Error(`Missing join record: ${assessment.questionId}`);
  return {
    id: assessment.questionId,
    school: source.school || 'unknown',
    year: source.year || '—',
    num: source.num ?? source.questionNo ?? 0,
    sourceTopic: source.topic ?? source.systemTopic ?? 'unknown',
    type: source.type ?? source.questionType ?? '—',
    points: source.points ?? 1,
    primary: topic.topicPrimary,
    secondary: topic.topicSecondary || [],
    tags: topic.contextTags || [],
    topicConfidence: topic.topicConfidence,
    topicRationale: topic.topicRationale || '',
    topicFigureRead: topic.figureRead || '',
    visual: Boolean(topic.usedVisual),
    figureKey: topic.figureKey || null,
    cognitive: assessment.cognitiveLevel,
    difficulty: assessment.difficulty,
    assessmentConfidence: assessment.confidence ?? assessment.assessmentConfidence ?? 0,
    reasoning: assessment.reasoningType,
    assessmentNote: assessment.assessmentNote || '',
  };
});

const normalizedTaxonomySummary = canonicalDir
  ? {
      finishedAt: taxonomySummary.completedAt,
      taxonomyVersion: 'math-topic-taxonomy-v1',
      usedVisual: taxonomySummary.coverage.usedVisual ?? taxonomySummary.coverage.usedVisualPassB,
      model: 'gpt-5-mini',
    }
  : taxonomySummary;
const finished = new Date(normalizedTaxonomySummary.finishedAt);
const generatedAt = Number.isNaN(finished.valueOf()) ? '24/08/2026' : finished.toLocaleDateString('vi-VN');
const dashboardData = {
  generatedAt,
  taxonomyVersion: normalizedTaxonomySummary.taxonomyVersion,
  scope: { total: questions.length, schools: Object.keys(schoolMeta).length, visual: normalizedTaxonomySummary.usedVisual, model: normalizedTaxonomySummary.model },
  schools: schoolMeta,
  topics: topicMeta,
  tags: tagMeta,
  sourceTopics: sourceTopicMeta,
  levels: levelMeta,
  questions,
  comparison,
};

const serialisedData = JSON.stringify(dashboardData).replace(/</g, '\\u003c');
const outputPath = canonicalDir
  ? path.join(canonicalDir, 'dashboard.html')
  : path.join(root, 'dashboard-toan-taxonomy-v1.html');

const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dashboard Toán · Taxonomy độc lập v1</title>
  <style>
    :root{--ink:#172033;--muted:#657083;--line:#e5e8ef;--paper:#f7f8fc;--card:#fff;--blue:#3f72b4;--purple:#6046a4;--green:#277a67;--amber:#b36b1c;--rose:#aa526b;--shadow:0 12px 32px rgba(20,30,47,.075)}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.45}.shell{max-width:1540px;margin:auto;padding:30px 28px 58px}
    .hero{padding:31px 34px;border-radius:23px;color:#fff;background:radial-gradient(circle at 88% 0,#dad0ff 0,transparent 29%),radial-gradient(circle at 68% 130%,#085d72 0,transparent 36%),linear-gradient(123deg,#191537,#44327c);box-shadow:var(--shadow);display:flex;gap:20px;justify-content:space-between}.eyebrow{margin:0 0 9px;font-size:11px;letter-spacing:.14em;font-weight:800;text-transform:uppercase;color:#d6ceff}.hero h1{margin:0 0 10px;font-size:clamp(27px,4vw,42px);line-height:1.08;letter-spacing:-.045em}.hero p{margin:0;max-width:850px;color:#e7e4f7;font-size:15px}.stamp{align-self:flex-start;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.11);border-radius:999px;padding:8px 12px;font-weight:800;font-size:12px;white-space:nowrap}
    .note{margin-top:17px;padding:13px 17px;border-radius:12px;border-left:4px solid #7056b4;background:#eeebfa;color:#42395a;font-size:13px}.note b{color:#2f2356}.filters{display:flex;gap:11px;align-items:end;flex-wrap:wrap;margin:22px 0}.filter{display:grid;gap:5px;min-width:172px;flex:1}.filter label{font-size:10px;letter-spacing:.1em;color:var(--muted);font-weight:900;text-transform:uppercase}select{height:42px;padding:0 34px 0 12px;appearance:none;border:1px solid #d8dde7;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23657083' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat calc(100% - 10px) center;border-radius:10px;color:var(--ink);font-size:13px;outline:none}select:focus{border-color:#806dc2;box-shadow:0 0 0 3px #e5e0fa}.reset{height:42px;padding:0 14px;border-radius:10px;border:1px solid #d8dde7;background:#fff;color:#4c5668;font-weight:800;cursor:pointer}.reset:hover{background:#fbfbff}
    .kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.kpi,.card{background:var(--card);border:1px solid var(--line);box-shadow:0 2px 10px rgba(20,30,47,.025)}.kpi{border-radius:14px;padding:17px}.kpi .label{font-size:11px;color:var(--muted);font-weight:800}.kpi .value{font-size:27px;letter-spacing:-.045em;font-weight:850;margin:4px 0}.kpi .sub{font-size:11px;color:#8a93a3}.grid{display:grid;gap:15px;margin-top:15px}.grid-a{grid-template-columns:1.12fr 1fr .9fr}.grid-b{grid-template-columns:1.28fr .72fr}.card{border-radius:16px;padding:19px}.card h2{margin:0 0 2px;font-size:16px;letter-spacing:-.02em}.caption{margin:0 0 16px;color:var(--muted);font-size:12px}.bar-row{display:grid;grid-template-columns:minmax(122px,1.3fr) 2.3fr 42px;gap:9px;align-items:center;margin:8px 0;font-size:12px}.bar-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.track{height:10px;background:#edf0f6;border-radius:999px;overflow:hidden}.fill{height:100%;border-radius:inherit}.matrix{border-collapse:separate;border-spacing:5px;width:100%}.matrix th{font-size:10px;color:var(--muted);font-weight:850;text-align:center}.matrix td{height:45px;text-align:center;border-radius:8px;font-size:13px;font-weight:850;background:#f2f0fa;color:#6b6680}.matrix td.hot{color:#fff;background:#7962b9}.matrix td.active{color:#403666;background:#ded6f4}.matrix .rowlabel{background:transparent;text-align:left;color:#596375;font-size:11px}.tag-cloud{display:flex;gap:7px;flex-wrap:wrap}.ctx{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#f1eff9;color:#594d7e;font-size:11px;font-weight:800}.ctx b{color:#322958}.hint{color:var(--muted);font-size:12px}.scroll{overflow:auto;border:1px solid var(--line);border-radius:12px}.data-table{width:100%;min-width:820px;border-collapse:collapse;font-size:12px}.data-table th{padding:10px 11px;background:#f8f9fc;text-align:left;text-transform:uppercase;letter-spacing:.06em;font-size:10px;color:#6b7484;white-space:nowrap}.data-table td{padding:10px 11px;border-bottom:1px solid #edf0f4;vertical-align:top}.data-table tr:last-child td{border:0}.data-table tr:hover td{background:#fbfbfe}.school{display:inline-flex;gap:6px;align-items:center;font-size:11px;font-weight:850;color:#3f4857}.school i{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--c)}.primary{font-weight:800;color:#364c70}.source{color:#7e8797}.badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:850;white-space:nowrap}.badge.d1{background:#eff1f5;color:#556070}.badge.d2{background:#edf1fa;color:#52638f}.badge.d3{background:#e7f0f8;color:#346993}.badge.d4{background:#f9e9ee;color:#9b506a}.badge.d5{background:#f1e6f7;color:#72458e}.badge.level{background:#eff1f6;color:#596476}.badge.topic{background:#eef3fa;color:#436286}.q-note{max-width:290px;color:#5d6777;line-height:1.35}.q-row{cursor:pointer}.chev{font-weight:900;color:#6c56a8}.detail{display:none;margin:0;padding:13px 15px;border-radius:10px;background:#f6f5fc;border:1px solid #e7e3f6;color:#48415d;font-size:12px;line-height:1.45}.detail.open{display:block}.empty{padding:28px;text-align:center;color:var(--muted);font-size:13px}.legend{margin-top:10px;color:var(--muted);font-size:11px}.mapping{display:grid;grid-template-columns:minmax(110px,1fr) 1.75fr 42px;align-items:center;gap:9px;margin:10px 0;font-size:12px}.mapping .arrow{color:#8b94a3}.mapping b{font-size:12px}
    @media(max-width:1160px){.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.grid-a,.grid-b{grid-template-columns:1fr}.hero{flex-direction:column}.stamp{align-self:auto}}@media(max-width:680px){.shell{padding:16px 13px 36px}.hero{padding:23px 20px;border-radius:18px}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi:last-child{grid-column:span 2}.filter{min-width:100%}.reset{width:100%}.card{padding:15px}.hero h1{font-size:29px}.bar-row{grid-template-columns:105px 1fr 35px}}
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero"><div><p class="eyebrow">Monkey5 · Đề chính thức · Toán · Taxonomy độc lập v1</p><h1>Dashboard tổng thể chuyên đề Toán</h1><p>Tra cứu đồng thời chuyên đề độc lập, nhãn phụ, mức nhận thức và độ khó của ${questions.length} câu hỏi. Tất cả ${normalizedTaxonomySummary.usedVisual} câu có figure đều đã được đọc trực tiếp trong pipeline đa phương thức.</p></div><div class="stamp">Cập nhật: ${generatedAt}</div></section>
    <section class="note"><b>Nguyên tắc đọc số liệu:</b> <code>topicPrimary</code> là đúng một trục kiến thức mở khóa cách giải; <code>topicSecondary</code> và <code>contextTags</code> chỉ là lớp bổ sung. Nhãn nguồn được giữ nguyên và chỉ đối chiếu sau phân loại — không phải kết luận nhãn nguồn đúng hoặc sai.</section>
    <section class="filters"><div class="filter"><label for="school">Trường</label><select id="school"></select></div><div class="filter"><label for="year">Năm học</label><select id="year"></select></div><div class="filter"><label for="primary">Chuyên đề chính</label><select id="primary"></select></div><div class="filter"><label for="difficulty">Độ khó</label><select id="difficulty"></select></div><div class="filter"><label for="cognitive">Mức nhận thức</label><select id="cognitive"></select></div><div class="filter"><label for="context">Nhãn phụ / context</label><select id="context"></select></div><button class="reset" id="reset">Đặt lại bộ lọc</button></section>
    <section class="kpis" id="kpis"></section>
    <section class="grid grid-a"><article class="card"><h2>Phân bố chuyên đề chính</h2><p class="caption">Các nhãn độc lập sau khi áp dụng bộ lọc; thanh màu biểu thị số câu tương đối.</p><div id="primaryBars"></div></article><article class="card"><h2>Ma trận nhận thức × độ khó</h2><p class="caption">Hai trục độc lập; màu đậm biểu thị ô tập trung hơn trong phạm vi đang xem.</p><div id="matrix"></div><p class="legend">Cognition: loại thao tác tư duy. Difficulty: mức cản trở thực tế với học sinh lớp 5 luyện thi.</p></article><article class="card"><h2>Nhãn phụ và biểu diễn</h2><p class="caption">Bối cảnh và trường hợp cần đọc hình/biểu đồ.</p><div id="contexts"></div></article></section>
    <section class="grid grid-b"><article class="card"><div><h2>Hồ sơ chuyên đề theo trường</h2><p class="caption">So sánh theo bộ lọc hiện thời; chuyên đề hiển thị là <code>topicPrimary</code> nổi bật nhất.</p></div><div class="scroll"><table class="data-table"><thead><tr><th>Trường</th><th>Số câu</th><th>Độ khó TB</th><th>D4–D5</th><th>Confidence chủ đề</th><th>Đọc hình</th><th>Chuyên đề nổi bật</th></tr></thead><tbody id="schoolTable"></tbody></table></div></article><article class="card"><h2>Đối chiếu nhãn nguồn → taxonomy v1</h2><p class="caption">Phân bố mapping để rà soát cấu trúc dữ liệu, không phải tỷ lệ “đúng/sai”.</p><div id="mappings"></div></article></section>
    <section class="card" style="margin-top:15px"><div><h2>Tra cứu từng câu hỏi</h2><p class="caption" id="questionCaption">Nhấp vào một hàng để xem rationale chuyên đề, nhãn phụ và cách model đọc hình.</p></div><div class="scroll"><table class="data-table"><thead><tr><th></th><th>Mã câu</th><th>Trường</th><th>Chuyên đề chính</th><th>Phụ / context</th><th>Nhận thức</th><th>Độ khó</th><th>Tin cậy chuyên đề</th><th>Đánh giá</th></tr></thead><tbody id="questionTable"></tbody></table><div id="empty" class="empty" hidden>Không có câu hỏi phù hợp với bộ lọc.</div></div></section>
  </main>
  <script>
    const DATA=${serialisedData};
    const $=id=>document.getElementById(id);const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const levels=Object.keys(DATA.levels);const difficultyLabels={1:'D1 · Rất dễ',2:'D2 · Cơ bản',3:'D3 · Vừa–khá',4:'D4 · Khó',5:'D5 · Rất khó'};
    const school=$('school'),year=$('year'),primary=$('primary'),difficulty=$('difficulty'),cognitive=$('cognitive'),context=$('context');
    function option(value,label){const o=document.createElement('option');o.value=value;o.textContent=label;return o}
    school.append(option('all','Tất cả trường'));Object.entries(DATA.schools).sort((a,b)=>a[1].name.localeCompare(b[1].name,'vi')).forEach(([id,s])=>school.append(option(id,s.short+' · '+s.name)));
    year.append(option('all','Tất cả năm'));[...new Set(DATA.questions.map(q=>q.year))].sort().reverse().forEach(v=>year.append(option(v,v)));
    primary.append(option('all','Tất cả chuyên đề'));Object.entries(DATA.topics).sort((a,b)=>a[1].label.localeCompare(b[1].label,'vi')).forEach(([id,t])=>primary.append(option(id,t.label)));
    difficulty.append(option('all','Tất cả mức'));[1,2,3,4,5].forEach(d=>difficulty.append(option(String(d),difficultyLabels[d])));
    cognitive.append(option('all','Tất cả mức'));levels.forEach(id=>cognitive.append(option(id,DATA.levels[id].label)));
    context.append(option('all','Tất cả nhãn phụ'));Object.entries(DATA.tags).forEach(([id,label])=>context.append(option(id,label)));
    const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;const pct=(a,b)=>b?(a/b*100).toFixed(1):'—';
    function filtered(){return DATA.questions.filter(q=>(school.value==='all'||q.school===school.value)&&(year.value==='all'||q.year===year.value)&&(primary.value==='all'||q.primary===primary.value)&&(difficulty.value==='all'||q.difficulty===Number(difficulty.value))&&(cognitive.value==='all'||q.cognitive===cognitive.value)&&(context.value==='all'||q.tags.includes(context.value)))}
    function topicName(id){return DATA.topics[id]?.label||id}function sourceName(id){return DATA.sourceTopics[id]||id}function schoolChip(id){const s=DATA.schools[id]||{short:id.toUpperCase(),color:'#8a94a5'};return '<span class="school" style="--c:'+s.color+'"><i></i>'+esc(s.short)+'</span>'}function dBadge(d){return '<span class="badge d'+d+'">D'+d+'</span>'}function levelBadge(l){return '<span class="badge level">'+esc(DATA.levels[l]?.label||l)+'</span>'}
    function renderKpis(qs){const hard=qs.filter(q=>q.difficulty>=4).length,visual=qs.filter(q=>q.visual).length,advanced=qs.filter(q=>q.cognitive==='nang_cao'||q.cognitive==='chuyen_sau').length;const cards=[['Số câu',qs.length,'sau khi lọc'],['Độ khó TB',mean(qs.map(q=>q.difficulty)).toFixed(2),'thang 1–5'],['D4–D5',hard,pct(hard,qs.length)+'% tổng số'],['Nâng cao / chuyên sâu',advanced,pct(advanced,qs.length)+'% tổng số'],['Confidence chuyên đề',mean(qs.map(q=>q.topicConfidence)).toFixed(1),visual+' câu dùng hình trực tiếp']];$('kpis').innerHTML=cards.map(([l,v,s])=>'<article class="kpi"><div class="label">'+l+'</div><div class="value">'+v+'</div><div class="sub">'+s+'</div></article>').join('')}
    function renderPrimary(qs){const c={};qs.forEach(q=>c[q.primary]=(c[q.primary]||0)+1);const rows=Object.entries(c).sort((a,b)=>b[1]-a[1]);const max=rows[0]?.[1]||1;$('primaryBars').innerHTML=rows.length?rows.map(([id,n])=>{const t=DATA.topics[id]||{label:id,color:'#667085'};return '<div class="bar-row"><span class="bar-name" title="'+esc(t.label)+'">'+esc(t.label)+'</span><div class="track"><div class="fill" style="width:'+(n/max*100)+'%;background:'+t.color+'"></div></div><b>'+n+'</b></div>'}).join(''):'<p class="hint">Chưa có dữ liệu.</p>'}
    function renderMatrix(qs){const grid=levels.map(l=>[1,2,3,4,5].map(d=>qs.filter(q=>q.cognitive===l&&q.difficulty===d).length));const max=Math.max(...grid.flat(),1);let out='<table class="matrix"><thead><tr><th></th><th>D1</th><th>D2</th><th>D3</th><th>D4</th><th>D5</th></tr></thead><tbody>';levels.forEach((l,i)=>{out+='<tr><td class="rowlabel">'+esc(DATA.levels[l].label)+'</td>';grid[i].forEach(n=>{const r=n/max;out+='<td class="'+(n?(r>.58?'hot':'active'):'')+'" style="opacity:'+(n?(.35+.65*r):1)+'">'+n+'</td>'});out+='</tr>'});$('matrix').innerHTML=out+'</tbody></table>'}
    function renderContexts(qs){const c={};qs.forEach(q=>q.tags.forEach(tag=>c[tag]=(c[tag]||0)+1));const rows=Object.entries(c).sort((a,b)=>b[1]-a[1]);$('contexts').innerHTML=rows.length?'<div class="tag-cloud">'+rows.map(([id,n])=>'<span class="ctx">'+esc(DATA.tags[id]||id)+' <b>'+n+'</b></span>').join('')+'</div><p class="hint" style="margin:15px 0 0">'+qs.filter(q=>q.visual).length+' câu trong phạm vi hiện tại được phân loại có ảnh trực tiếp.</p>':'<p class="hint">Không có context tag trong phạm vi đang xem.</p>'}
    function renderSchools(qs){const ids=school.value==='all'?Object.keys(DATA.schools):[school.value];const rows=ids.map(id=>{const x=qs.filter(q=>q.school===id),c={};x.forEach(q=>c[q.primary]=(c[q.primary]||0)+1);const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0];return{id,x,top,hard:x.filter(q=>q.difficulty>=4).length,visual:x.filter(q=>q.visual).length}}).sort((a,b)=>b.x.length-a.x.length);$('schoolTable').innerHTML=rows.map(r=>'<tr><td>'+schoolChip(r.id)+' <span class="source">'+esc(DATA.schools[r.id]?.name||r.id)+'</span></td><td><b>'+r.x.length+'</b></td><td>'+ (r.x.length?mean(r.x.map(q=>q.difficulty)).toFixed(2):'—')+'</td><td>'+r.hard+' <span class="source">('+pct(r.hard,r.x.length)+'%)</span></td><td>'+ (r.x.length?mean(r.x.map(q=>q.topicConfidence)).toFixed(1):'—')+'</td><td>'+r.visual+'</td><td class="primary">'+esc(r.top?topicName(r.top):'—')+'</td></tr>').join('')}
    function renderMappings(qs){const by={};qs.forEach(q=>{const x=by[q.sourceTopic]||(by[q.sourceTopic]={n:0,primary:{}});x.n++;x.primary[q.primary]=(x.primary[q.primary]||0)+1});const rows=Object.entries(by).map(([src,x])=>{const [top,n]=Object.entries(x.primary).sort((a,b)=>b[1]-a[1])[0];return{src,n:x.n,top,topN:n}}).sort((a,b)=>b.n-a.n).slice(0,10);$('mappings').innerHTML=rows.length?rows.map(r=>'<div class="mapping"><span>'+esc(sourceName(r.src))+'</span><span><span class="arrow">→</span> <b>'+esc(topicName(r.top))+'</b><div class="track" style="margin-top:4px"><div class="fill" style="width:'+(r.topN/r.n*100)+'%;background:'+(DATA.topics[r.top]?.color||'#607287')+'"></div></div></span><b>'+r.topN+'/'+r.n+'</b></div>').join(''):'<p class="hint">Không có dữ liệu theo bộ lọc.</p>'}
    function renderQuestions(qs){const visible=[...qs].sort((a,b)=>b.difficulty-a.difficulty||a.topicConfidence-b.topicConfidence||a.school.localeCompare(b.school)).slice(0,250);$('questionCaption').textContent='Hiển thị '+visible.length+' / '+qs.length+' câu. Nhấp vào một hàng để mở rationale và thông tin hình.';$('empty').hidden=qs.length>0;$('questionTable').innerHTML=visible.map((q,i)=>{const extra=[...q.secondary.map(topicName),...q.tags.map(t=>DATA.tags[t]||t)];return '<tr class="q-row" data-id="detail-'+i+'"><td class="chev">›</td><td><b>'+esc(q.id)+'</b><br><span class="source">'+esc(q.year)+' · C'+q.num+'</span></td><td>'+schoolChip(q.school)+'</td><td class="primary">'+esc(topicName(q.primary))+'</td><td>'+ (extra.length?extra.map(v=>'<span class="badge topic">'+esc(v)+'</span>').join(' '):'<span class="source">—</span>')+'</td><td>'+levelBadge(q.cognitive)+'</td><td>'+dBadge(q.difficulty)+'</td><td><b>'+q.topicConfidence+'</b></td><td class="q-note">'+esc(q.assessmentNote)+'</td></tr><tr><td colspan="9" style="padding:0 11px"><div id="detail-'+i+'" class="detail"><b>Rationale chuyên đề:</b> '+esc(q.topicRationale)+'<br><br><b>Hình / biểu đồ:</b> '+esc(q.topicFigureRead||'Không có hình minh họa')+'<br><br><b>Truy vết:</b> nhãn nguồn = '+esc(sourceName(q.sourceTopic))+' · figureKey = '+esc(q.figureKey||'—')+' · '+(q.visual?'đã đọc hình trực tiếp':'không có hình')+' · confidence đánh giá nhận thức/độ khó = '+esc(q.assessmentConfidence)+'</div></td></tr>'}).join('');document.querySelectorAll('.q-row').forEach(row=>row.addEventListener('click',()=>$(row.dataset.id).classList.toggle('open')))}
    function render(){const qs=filtered();renderKpis(qs);renderPrimary(qs);renderMatrix(qs);renderContexts(qs);renderSchools(qs);renderMappings(qs);renderQuestions(qs)}
    [school,year,primary,difficulty,cognitive,context].forEach(el=>el.addEventListener('change',render));$('reset').addEventListener('click',()=>{[school,year,primary,difficulty,cognitive,context].forEach(el=>el.value='all');render()});render();
  </script>
</body>
</html>`;

fs.writeFileSync(outputPath, html, 'utf8');
console.log(JSON.stringify({ output: outputPath, questions: questions.length, visualQuestions: normalizedTaxonomySummary.usedVisual, schools: Object.keys(schoolMeta).length }, null, 2));
