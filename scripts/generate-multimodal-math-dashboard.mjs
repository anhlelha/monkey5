import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const reportsDir = path.join(root, '.reports');
const assessments = JSON.parse(fs.readFileSync(path.join(reportsDir, 'du-lieu-tai-danh-gia-toan-da-phuong-thuc.json'), 'utf8'));
const visionInput = JSON.parse(fs.readFileSync(path.join(root, '.analysis', 'math-vision-input', 'questions-with-figures.json'), 'utf8'));
const summary = JSON.parse(fs.readFileSync(path.join(reportsDir, 'tom-tat-tai-danh-gia-toan-da-phuong-thuc.json'), 'utf8'));

const schoolMeta = {
  cg: { short: 'CG', name: 'Cầu Giấy', color: '#6b5ca5' },
  ntt: { short: 'NTT', name: 'Nguyễn Tất Thành', color: '#0d8495' },
  ltv: { short: 'LTV', name: 'Lương Thế Vinh', color: '#d06e36' },
  tx: { short: 'TX', name: 'Thanh Xuân', color: '#3e87bb' },
  nn: { short: 'NN', name: 'Ngoại ngữ', color: '#9c7190' },
  ntl: { short: 'NTL', name: 'Nam Từ Liêm', color: '#c44a5f' },
  nshn: { short: 'NSHN', name: 'Ngôi Sao Hà Nội', color: '#c07b26' },
  nshm: { short: 'NSHM', name: 'Ngôi Sao Hoàng Mai', color: '#5e9b69' },
  ams: { short: 'AMS', name: 'Amsterdam', color: '#3461a5' },
  arc: { short: 'ARC', name: 'Archimedes', color: '#7457a5' },
  nksp: { short: 'NKSP', name: 'Năng Khiếu Sư Phạm', color: '#278780' },
};
const topicMeta = {
  soh: 'Số học & Số tự nhiên', hinh: 'Hình học', phan: 'Phân số, Tỉ số & %', cd: 'Chuyển động',
  log: 'Suy luận logic', do: 'Đo lường & Đổi đơn vị', xs: 'Biểu đồ, Thống kê & Xác suất',
  tuoi: 'Toán tuổi', ti: 'Đại lượng tỉ lệ & Bản đồ', tg: 'Thời gian',
};
const levelMeta = {
  co_ban: { label: 'Cơ bản', color: '#63708a' },
  van_dung: { label: 'Vận dụng', color: '#4e75af' },
  nang_cao: { label: 'Nâng cao', color: '#9a5d82' },
  chuyen_sau: { label: 'Chuyên sâu', color: '#72458e' },
};

const questionMap = Object.fromEntries(visionInput.map((item) => [item.questionId, item]));
const questions = assessments.map((assessment) => {
  const source = questionMap[assessment.questionId] || {};
  return {
    id: assessment.questionId,
    school: source.school || 'unknown',
    year: source.year || '—',
    num: source.num || 0,
    topic: source.topic || 'unknown',
    systemGrade: source.systemGrade || '—',
    type: source.type || '—',
    points: source.points ?? 1,
    visual: Boolean(assessment.usedVisual),
    figureKey: assessment.figureKey || null,
    cognitive: assessment.cognitiveLevel,
    difficulty: assessment.difficulty,
    confidence: assessment.confidence,
    reasoning: assessment.reasoningType,
    figureRead: assessment.figureRead || '',
    note: assessment.assessmentNote || '',
  };
});

const dashboardData = {
  generatedAt: '24/08/2026',
  scope: summary.scope,
  pipeline: summary.overall,
  schools: schoolMeta,
  topics: topicMeta,
  levels: levelMeta,
  questions,
};

const serialisedData = JSON.stringify(dashboardData).replace(/</g, '\\u003c');
const output = path.join(root, 'dashboard-toan-da-phuong-thuc.html');

const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Dashboard Toán đa phương thức</title>
  <style>
    :root{--ink:#182230;--muted:#667085;--line:#e4e7ec;--paper:#f7f8fc;--surface:#fff;--purple:#6753a8;--purple-2:#eeeafd;--blue:#4174b3;--green:#237b65;--amber:#b8651a;--rose:#b54d67;--shadow:0 10px 28px rgba(28,35,51,.08)}
    *{box-sizing:border-box} body{margin:0;background:var(--paper);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);line-height:1.45}
    .shell{max-width:1480px;margin:0 auto;padding:34px 30px 56px}.hero{display:flex;justify-content:space-between;gap:28px;align-items:flex-start;padding:28px 32px;border-radius:24px;background:radial-gradient(circle at 87% 0,#e9e3ff 0,transparent 31%),linear-gradient(125deg,#211a42,#463483);color:#fff;box-shadow:var(--shadow)}
    .eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#c7bfff;font-weight:700;margin:0 0 10px}.hero h1{font-size:clamp(27px,4vw,42px);letter-spacing:-.04em;margin:0 0 10px;line-height:1.08}.hero p{max-width:720px;margin:0;color:#e4e0f7;font-size:15px}.pill{align-self:flex-start;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.10);border-radius:999px;padding:8px 12px;color:#fbfaff;white-space:nowrap;font-size:12px;font-weight:700}
    .callout{margin-top:18px;padding:14px 18px;border-left:4px solid var(--purple);background:#f0edfc;border-radius:0 12px 12px 0;color:#413c58;font-size:14px}.callout b{color:#2f2860}
    .filters{display:flex;align-items:end;flex-wrap:wrap;gap:12px;margin:22px 0}.filter{min-width:195px;display:grid;gap:5px}.filter label{font-size:11px;letter-spacing:.08em;font-weight:800;text-transform:uppercase;color:var(--muted)}select{appearance:none;width:100%;padding:11px 34px 11px 13px;border:1px solid #d7dbe6;border-radius:10px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat calc(100% - 10px) center;color:var(--ink);font-size:14px;outline:none}select:focus{border-color:#7c68c1;box-shadow:0 0 0 3px #e7e0ff}.reset{border:1px solid #d7dbe6;background:#fff;color:#454b59;border-radius:10px;padding:11px 14px;font-size:14px;font-weight:700;cursor:pointer}.reset:hover{background:#fafaff}
    .kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.kpi{background:var(--surface);padding:18px;border:1px solid var(--line);border-radius:14px;box-shadow:0 2px 10px rgba(28,35,51,.025)}.kpi .value{font-size:27px;letter-spacing:-.04em;font-weight:800;margin:5px 0}.kpi .label{font-size:12px;color:var(--muted);font-weight:700}.kpi .sub{font-size:11px;color:#8991a1}
    .grid{display:grid;gap:16px;margin-top:16px}.grid.top{grid-template-columns:1.25fr 1fr .9fr}.grid.bottom{grid-template-columns:1.2fr .8fr}.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 2px 10px rgba(28,35,51,.025)}.card h2{font-size:16px;letter-spacing:-.015em;margin:0 0 2px}.card .caption{font-size:12px;color:var(--muted);margin:0 0 18px}.bar-row{display:grid;grid-template-columns:72px 1fr 44px;gap:10px;align-items:center;margin:10px 0;font-size:13px}.track{height:11px;border-radius:99px;background:#eef0f6;overflow:hidden}.fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#6e5baa,#9988d8)}.fill.d1{background:#a8adbd}.fill.d2{background:#7b86ae}.fill.d3{background:#5683b9}.fill.d4{background:#b26d84}.fill.d5{background:#754e9a}.matrix{width:100%;border-collapse:separate;border-spacing:5px}.matrix th{font-size:11px;color:var(--muted);font-weight:800;text-align:center}.matrix td{height:48px;text-align:center;border-radius:8px;font-size:13px;font-weight:800;background:#f4f3fb;color:#706c82}.matrix td.active{background:#ded7f5;color:#382d66}.matrix td.hot{background:#9c8bd0;color:#fff}.matrix .rowlabel{text-align:left;background:transparent;color:#4e5667;font-size:12px}.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--muted);margin-top:10px}.dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:5px}.topic-list{display:grid;gap:8px}.topic-item{display:grid;grid-template-columns:1fr 45px;gap:8px;align-items:center;font-size:12px}.topic-item .mini{height:7px;border-radius:99px;background:#eef0f6;overflow:hidden;margin-top:4px}.topic-item .mini b{display:block;height:100%;background:#5c88bd;border-radius:inherit}
    .table-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:12px}.table-head p{margin:2px 0 0;font-size:12px;color:var(--muted)}.scroll{overflow:auto;border:1px solid var(--line);border-radius:12px}.data-table{width:100%;border-collapse:collapse;min-width:740px;font-size:12px}.data-table th{background:#f8f9fc;color:#687083;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}.data-table th,.data-table td{padding:11px 12px;border-bottom:1px solid #edf0f5}.data-table tr:last-child td{border-bottom:0}.data-table tr:hover td{background:#fbfbff}.school-chip,.tag{display:inline-flex;align-items:center;gap:6px;border-radius:999px;font-weight:800;white-space:nowrap}.school-chip{font-size:11px;padding:4px 8px;background:#f1eff8;color:#433a72}.school-chip i{width:7px;height:7px;border-radius:50%;background:var(--color,#6753a8)}.tag{font-size:10px;padding:3px 7px}.tag.d1{background:#eff1f5;color:#556070}.tag.d2{background:#edf0f9;color:#53628e}.tag.d3{background:#e8f0f9;color:#346692}.tag.d4{background:#f8ebef;color:#9d5068}.tag.d5{background:#f0e7f7;color:#72458e}.tag.level{background:#eef0f7;color:#525d76}.yes{color:var(--green);font-weight:800}.no{color:#8d95a5}.question-note{max-width:410px;color:#5c6474;line-height:1.35}.details{margin-top:10px;padding:13px 15px;background:#f6f5fc;border:1px solid #e8e4f8;border-radius:10px;font-size:12px;color:#45405e;display:none}.details.open{display:block}.question-row{cursor:pointer}.chev{font-weight:900;color:#6957a7}.empty{padding:28px;text-align:center;color:var(--muted);font-size:13px}
    @media(max-width:1100px){.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.grid.top,.grid.bottom{grid-template-columns:1fr}.hero{flex-direction:column}.pill{align-self:auto}}@media(max-width:680px){.shell{padding:18px 14px 34px}.hero{padding:23px 20px;border-radius:18px}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi:last-child{grid-column:span 2}.filters{align-items:stretch}.filter{min-width:100%;width:100%}.reset{width:100%}.card{padding:16px}.hero h1{font-size:29px}}
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero"><div><p class="eyebrow">Monkey5 · Toán · Đa phương thức</p><h1>Dashboard phân tích đề Toán</h1><p>Tra cứu 849 câu hỏi đã được tái đánh giá với ngữ cảnh đầy đủ, bao gồm 98 hình minh họa được đọc trực tiếp trong pipeline.</p></div><div class="pill">Dữ liệu cập nhật: 24/08/2026</div></section>
    <div class="callout"><b>Đọc đúng confidence:</b> đây là mức độ đầy đủ và rõ ràng của đầu vào cho lượt đánh giá, không phải xác suất nhãn chuyên môn luôn đúng. Mức khó và mức nhận thức được gán như hai trục riêng.</div>
    <section class="filters" aria-label="Bộ lọc dashboard"><div class="filter"><label for="schoolFilter">Trường</label><select id="schoolFilter"></select></div><div class="filter"><label for="difficultyFilter">Mức độ khó</label><select id="difficultyFilter"></select></div><div class="filter"><label for="cognitiveFilter">Mức nhận thức</label><select id="cognitiveFilter"></select></div><button class="reset" id="resetBtn">Đặt lại bộ lọc</button></section>
    <section class="kpis" id="kpis"></section>
    <section class="grid top"><article class="card"><h2>Phân bố độ khó</h2><p class="caption">Số câu theo D1–D5 sau tái đánh giá.</p><div id="difficultyBars"></div></article><article class="card"><h2>Ma trận nhận thức × độ khó</h2><p class="caption">Ô đậm cho thấy cụm câu tập trung sau khi áp dụng bộ lọc.</p><div id="matrix"></div><div class="legend"><span><i class="dot" style="background:#ded7f5"></i>Ít hơn</span><span><i class="dot" style="background:#9c8bd0"></i>Nhiều hơn</span></div></article><article class="card"><h2>Chuyên đề nổi bật</h2><p class="caption">Năm chuyên đề xuất hiện nhiều nhất trong phạm vi đang xem.</p><div class="topic-list" id="topics"></div></article></section>
    <section class="grid bottom"><article class="card"><div class="table-head"><div><h2>Đối chiếu theo trường</h2><p id="schoolTableSubtitle">Toàn bộ các trường trong kho đề.</p></div></div><div class="scroll"><table class="data-table"><thead><tr><th>Trường</th><th>Số câu</th><th>Độ khó TB</th><th>D4–D5</th><th>Có hình</th><th>Confidence TB</th><th>Chuyên đề nổi bật</th></tr></thead><tbody id="schoolTable"></tbody></table></div></article><article class="card"><h2>Ghi chú từ pipeline</h2><p class="caption">Các chỉ số tổng quan của lượt tái đánh giá.</p><div id="pipelineNotes" class="topic-list"></div></article></section>
    <section class="card" style="margin-top:16px"><div class="table-head"><div><h2>Tra cứu từng câu hỏi</h2><p id="questionCount">Nhấp vào một hàng để xem mô hình đã đọc gì từ hình và lý do gán nhãn.</p></div></div><div class="scroll"><table class="data-table"><thead><tr><th></th><th>Mã câu</th><th>Trường</th><th>Chuyên đề</th><th>Nhận thức</th><th>Độ khó</th><th>Confidence</th><th>Hình</th><th>Ghi chú đánh giá</th></tr></thead><tbody id="questionTable"></tbody></table><div id="emptyState" class="empty" hidden>Không có câu hỏi phù hợp với bộ lọc đang chọn.</div></div></section>
  </main>
  <script>
    const DATA = ${serialisedData};
    const levels = Object.keys(DATA.levels);
    const difficultyLabels = {1:'D1 · Rất dễ',2:'D2 · Cơ bản',3:'D3 · Vừa–khá',4:'D4 · Khó',5:'D5 · Rất khó'};
    const $ = (id) => document.getElementById(id);
    const esc = (value='') => String(value).replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
    const schoolFilter=$('schoolFilter'), difficultyFilter=$('difficultyFilter'), cognitiveFilter=$('cognitiveFilter');
    function option(value,label){const node=document.createElement('option');node.value=value;node.textContent=label;return node}
    schoolFilter.append(option('all','Tất cả trường'));Object.entries(DATA.schools).sort((a,b)=>a[1].name.localeCompare(b[1].name,'vi')).forEach(([id,item])=>schoolFilter.append(option(id, item.short+' · '+item.name)));
    difficultyFilter.append(option('all','Tất cả mức độ'));for(let i=1;i<=5;i++)difficultyFilter.append(option(String(i),difficultyLabels[i]));
    cognitiveFilter.append(option('all','Tất cả mức nhận thức'));levels.forEach(id=>cognitiveFilter.append(option(id,DATA.levels[id].label)));
    const filterQuestions=()=>DATA.questions.filter(q=>(schoolFilter.value==='all'||q.school===schoolFilter.value)&&(difficultyFilter.value==='all'||q.difficulty===Number(difficultyFilter.value))&&(cognitiveFilter.value==='all'||q.cognitive===cognitiveFilter.value));
    const mean=(values)=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
    function difficultyTag(d){return '<span class="tag d'+d+'">D'+d+'</span>'}
    function levelTag(l){return '<span class="tag level">'+esc(DATA.levels[l]?.label||l)+'</span>'}
    function schoolChip(id){const s=DATA.schools[id]||{short:id.toUpperCase(),name:id,color:'#87909f'};return '<span class="school-chip" style="--color:'+s.color+'"><i></i>'+esc(s.short)+'</span>'}
    function renderKPIs(qs){const hard=qs.filter(q=>q.difficulty>=4).length;const visual=qs.filter(q=>q.visual).length;const avgDiff=mean(qs.map(q=>q.difficulty));const avgConf=mean(qs.map(q=>q.confidence));const advanced=qs.filter(q=>q.cognitive==='nang_cao'||q.cognitive==='chuyen_sau').length;$('kpis').innerHTML=[['Số câu',qs.length,'sau khi lọc'],['Độ khó TB',avgDiff.toFixed(2),'trên thang 1–5'],['Câu D4–D5',hard,qs.length?(hard/qs.length*100).toFixed(1)+'% tổng số':'—'],['Câu nâng cao',advanced,qs.length?(advanced/qs.length*100).toFixed(1)+'% tổng số':'—'],['Có hình minh họa',visual,qs.length?(visual/qs.length*100).toFixed(1)+'% tổng số':'—']].map(([label,value,sub])=>'<article class="kpi"><div class="label">'+label+'</div><div class="value">'+value+'</div><div class="sub">'+sub+'</div></article>').join('')}
    function renderDifficulty(qs){const counts=[1,2,3,4,5].map(d=>qs.filter(q=>q.difficulty===d).length);const max=Math.max(...counts,1);$('difficultyBars').innerHTML=counts.map((count,index)=>'<div class="bar-row"><b>D'+(index+1)+'</b><div class="track"><div class="fill d'+(index+1)+'" style="width:'+(count/max*100)+'%"></div></div><span>'+count+'</span></div>').join('')}
    function renderMatrix(qs){const counts=levels.map(l=>[1,2,3,4,5].map(d=>qs.filter(q=>q.cognitive===l&&q.difficulty===d).length));const max=Math.max(...counts.flat(),1);let html='<table class="matrix"><thead><tr><th></th><th>D1</th><th>D2</th><th>D3</th><th>D4</th><th>D5</th></tr></thead><tbody>';levels.forEach((level,row)=>{html+='<tr><td class="rowlabel">'+esc(DATA.levels[level].label)+'</td>';counts[row].forEach(value=>{const ratio=value/max;const klass=value===0?'':ratio>.58?'hot':'active';html+='<td class="'+klass+'" style="opacity:'+(value?(.35+.65*ratio):1)+'">'+value+'</td>'});html+='</tr>'});html+='</tbody></table>';$('matrix').innerHTML=html}
    function renderTopics(qs){const count={};qs.forEach(q=>count[q.topic]=(count[q.topic]||0)+1);const sorted=Object.entries(count).sort((a,b)=>b[1]-a[1]).slice(0,5);const max=sorted[0]?.[1]||1;$('topics').innerHTML=sorted.length?sorted.map(([topic,value])=>'<div class="topic-item"><div><span>'+esc(DATA.topics[topic]||topic)+'</span><div class="mini"><b style="width:'+(value/max*100)+'%"></b></div></div><b>'+value+'</b></div>').join(''):'<div class="empty">Chưa có dữ liệu.</div>'}
    function renderSchoolTable(qs){const allSchoolIds=schoolFilter.value==='all'?Object.keys(DATA.schools):[schoolFilter.value];const rows=allSchoolIds.map(id=>{const group=qs.filter(q=>q.school===id);const topics={};group.forEach(q=>topics[q.topic]=(topics[q.topic]||0)+1);const top=Object.entries(topics).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';return {id,n:group.length,diff:mean(group.map(q=>q.difficulty)),hard:group.filter(q=>q.difficulty>=4).length,visual:group.filter(q=>q.visual).length,conf:mean(group.map(q=>q.confidence)),top}}).sort((a,b)=>b.n-a.n);$('schoolTableSubtitle').textContent=(schoolFilter.value==='all'?'So sánh tất cả trường theo bộ lọc hiện tại.':'Thông số của trường đã chọn theo bộ lọc hiện tại.');$('schoolTable').innerHTML=rows.map(r=>'<tr><td>'+schoolChip(r.id)+' <span style="margin-left:6px;color:#596274">'+esc(DATA.schools[r.id]?.name||r.id)+'</span></td><td><b>'+r.n+'</b></td><td>'+ (r.n?r.diff.toFixed(2):'—')+'</td><td>'+r.hard+(r.n?' <span style="color:#8b94a4">('+(r.hard/r.n*100).toFixed(0)+'%)</span>':'')+'</td><td>'+r.visual+'</td><td>'+ (r.n?r.conf.toFixed(1):'—')+'</td><td>'+esc(DATA.topics[r.top]||r.top)+'</td></tr>').join('')}
    function renderPipelineNotes(qs){const overall=DATA.pipeline;const visual=qs.filter(q=>q.visual);const notes=[['Phạm vi dữ liệu',qs.length+' câu đang hiển thị'],['Confidence TB',mean(qs.map(q=>q.confidence)).toFixed(1)+' / 100'],['Hình đã dùng trực tiếp',visual.length+' câu'],['Cramér’s V (toàn kho)',overall.newCramersV.toFixed(3)],['Thay đổi nhận thức (toàn kho)',overall.cognitiveChanged+' câu'],['Thay đổi độ khó (toàn kho)',overall.difficultyChanged+' câu']];$('pipelineNotes').innerHTML=notes.map(([a,b])=>'<div class="topic-item"><span>'+a+'</span><b>'+b+'</b></div>').join('')}
    function renderQuestionTable(qs){const visible=[...qs].sort((a,b)=>b.difficulty-a.difficulty||b.confidence-a.confidence||a.school.localeCompare(b.school)).slice(0,250);$('questionCount').textContent='Hiển thị '+visible.length+' / '+qs.length+' câu. Nhấp vào một hàng để xem cách mô hình đọc hình và ghi chú phân tích.';$('emptyState').hidden=qs.length>0;$('questionTable').innerHTML=visible.map((q,i)=>'<tr class="question-row" data-detail="detail-'+i+'"><td class="chev">›</td><td><b>'+esc(q.id)+'</b><br><span style="color:#87909f">'+esc(q.year)+' · C'+q.num+'</span></td><td>'+schoolChip(q.school)+'</td><td>'+esc(DATA.topics[q.topic]||q.topic)+'</td><td>'+levelTag(q.cognitive)+'</td><td>'+difficultyTag(q.difficulty)+'</td><td><b>'+q.confidence+'</b></td><td>'+(q.visual?'<span class="yes">Đã đọc</span>':'<span class="no">Không</span>')+'</td><td class="question-note">'+esc(q.note)+'</td></tr><tr><td colspan="9" style="padding:0 12px;border-bottom:1px solid #edf0f5"><div id="detail-'+i+'" class="details"><b>Hình / biểu đồ mô hình đã nhận diện:</b> '+esc(q.figureRead||'Không có hình minh họa')+'<br><br><b>Dạng suy luận:</b> '+esc(q.reasoning)+' · <b>Khóa hình:</b> '+esc(q.figureKey||'—')+'</div></td></tr>').join('');document.querySelectorAll('.question-row').forEach(row=>row.addEventListener('click',()=>$(row.dataset.detail).classList.toggle('open')))}
    function render(){const qs=filterQuestions();renderKPIs(qs);renderDifficulty(qs);renderMatrix(qs);renderTopics(qs);renderSchoolTable(qs);renderPipelineNotes(qs);renderQuestionTable(qs)}
    [schoolFilter,difficultyFilter,cognitiveFilter].forEach(el=>el.addEventListener('change',render));$('resetBtn').addEventListener('click',()=>{schoolFilter.value='all';difficultyFilter.value='all';cognitiveFilter.value='all';render()});render();
  </script>
</body>
</html>`;

fs.writeFileSync(output, html, 'utf8');
console.log(JSON.stringify({ output, questions: questions.length, schools: Object.keys(schoolMeta).length }, null, 2));
