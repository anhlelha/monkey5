/* =========================================================
   Mock data — Cùng Khỉ con vào lớp 6 CLC
   ========================================================= */

window.SCHOOLS = [
  { id: "cg",  short: "CG",  name: "THCS Cầu Giấy",                  full: "THCS Cầu Giấy",                  color: "var(--cg)",  tone: "cg",
    desc: "Trắc nghiệm + điền + 2 câu tự luận. 45 phút.", minutes: 45, style: "Gọn, lập luận sạch, ít tự luận." },
  { id: "ntt", short: "NTT", name: "Nguyễn Tất Thành",               full: "THCS & THPT Nguyễn Tất Thành",   color: "var(--ntt)", tone: "ntt",
    desc: "Đề kể chuyện thực tế, 30-32% tự luận. 60 phút.", minutes: 60, style: "Bài toán thực tế, đọc hiểu kỹ." },
  { id: "ltv", short: "LTV", name: "Lương Thế Vinh",                 full: "THCS & THPT Lương Thế Vinh",     color: "var(--ltv)", tone: "ltv",
    desc: "20 câu ghi đáp số. 60 phút. Nhiều hình học.",     minutes: 60, style: "Tốc độ + hình học Olympic nhẹ." },
  { id: "tx",  short: "TX",  name: "Thanh Xuân",                     full: "THCS Thanh Xuân",                 color: "var(--tx)",  tone: "tx",
    desc: "Cân bằng TN + điền + tự luận. 40 phút.",         minutes: 40, style: "Cân bằng, đa dạng dạng bài." }
];

window.TOPICS = [
  { id: "soh",   name: "Số học & Số tự nhiên",            short: "Số học",    ico: "123", color: "var(--cg)" },
  { id: "hinh",  name: "Hình học",                         short: "Hình học",  ico: "△",   color: "var(--ntt)" },
  { id: "phan",  name: "Phân số, Tỉ số & %",               short: "Phân số",   ico: "½",   color: "var(--ltv)" },
  { id: "cd",    name: "Chuyển động",                      short: "Chuyển động", ico: "→", color: "var(--tx)" },
  { id: "log",   name: "Suy luận logic",                   short: "Logic",     ico: "?",   color: "oklch(0.6 0.14 200)" },
  { id: "do",    name: "Đo lường & Đổi đơn vị",            short: "Đo lường",  ico: "↔",   color: "oklch(0.6 0.13 170)" },
  { id: "xs",    name: "Biểu đồ, Thống kê & Xác suất",     short: "Xác suất",  ico: "▥",   color: "oklch(0.62 0.13 330)" },
  { id: "tuoi",  name: "Toán tuổi",                        short: "Toán tuổi", ico: "Δt",  color: "oklch(0.62 0.13 130)" },
  { id: "ti",    name: "Đại lượng tỉ lệ & Bản đồ",         short: "Tỉ lệ",     ico: ":",   color: "oklch(0.62 0.14 50)" },
  { id: "tg",    name: "Thời gian (giờ - phút)",           short: "Thời gian", ico: "⌚",   color: "oklch(0.55 0.04 260)" }
];

/* ===== User profile (mocked) ===== */
window.USER = {
  name: "Nguyễn Minh Anh",
  email: "minhanh.nguyen@gmail.com",
  grade: "Lớp 5",
  avatar: "MA",
  joinedDays: 24,
  targets: ["cg", "ntt"],
  hours: 5,
  examDate: "2026-09-01",
  /* per-topic mastery 0-1 */
  topicMastery: {
    soh: 0.78, hinh: 0.52, phan: 0.71, cd: 0.46, log: 0.58,
    do: 0.83, xs: 0.62, tuoi: 0.74, ti: 0.55, tg: 0.69
  },
  /* per-school readiness 0-100 */
  readiness: {
    cg: 71,
    ntt: 58,
    ltv: 49,
    tx: 64
  },
  /* activity last 14 days (% correct each day a session occurred; null = no activity) */
  activity: [62, 58, null, 70, 65, 72, 68, null, 75, 71, 73, 70, 78, 76],
  streak: 6
};

/* ===== Past-exam library =====
   kind: "official"  = đề chính thức từ các trường (đã thi)
         "reference" = đề tham khảo / phỏng tạo / luyện tập
*/
window.PAST_EXAMS = [
  /* Official — Cầu Giấy */
  { id: "cg-2025", school: "cg", kind: "official", year: "2025-2026", qcount: 10, minutes: 45, attempts: 1, bestScore: 78 },
  { id: "cg-2024", school: "cg", kind: "official", year: "2024-2025", qcount: 10, minutes: 45, attempts: 2, bestScore: 82 },
  { id: "cg-2023", school: "cg", kind: "official", year: "2023-2024", qcount: 10, minutes: 45, attempts: 0, bestScore: null },
  { id: "cg-2022", school: "cg", kind: "official", year: "2022-2023", qcount: 10, minutes: 45, attempts: 1, bestScore: 65 },
  { id: "cg-2021", school: "cg", kind: "official", year: "2021-2022", qcount: 10, minutes: 45, attempts: 0, bestScore: null },

  /* Official — NTT */
  { id: "ntt-2025", school: "ntt", kind: "official", year: "2025-2026", qcount: 15, minutes: 60, attempts: 1, bestScore: 60 },
  { id: "ntt-2024", school: "ntt", kind: "official", year: "2024-2025", qcount: 12, minutes: 60, attempts: 0, bestScore: null },
  { id: "ntt-2023", school: "ntt", kind: "official", year: "2023-2024", qcount: 10, minutes: 60, attempts: 1, bestScore: 55 },
  { id: "ntt-2022", school: "ntt", kind: "official", year: "2022-2023", qcount: 10, minutes: 60, attempts: 0, bestScore: null },

  /* Official — LTV */
  { id: "ltv-2025", school: "ltv", kind: "official", year: "2025-2026", qcount: 12, minutes: 60, attempts: 0, bestScore: null },
  { id: "ltv-2024", school: "ltv", kind: "official", year: "2024-2025", qcount: 20, minutes: 60, attempts: 1, bestScore: 50 },
  { id: "ltv-2023", school: "ltv", kind: "official", year: "2023-2024", qcount: 20, minutes: 60, attempts: 0, bestScore: null },
  { id: "ltv-2022", school: "ltv", kind: "official", year: "2022-2023", qcount: 20, minutes: 60, attempts: 0, bestScore: null },

  /* Official — TX */
  { id: "tx-2025", school: "tx", kind: "official", year: "2025-2026", qcount: 15, minutes: 40, attempts: 1, bestScore: 73 },
  { id: "tx-2024", school: "tx", kind: "official", year: "2024-2025", qcount: 16, minutes: 40, attempts: 0, bestScore: null },
  { id: "tx-2023", school: "tx", kind: "official", year: "2023-2024", qcount: 16, minutes: 40, attempts: 0, bestScore: null },

  /* Reference — generated or curated practice exams */
  { id: "ref-cg-1", school: "cg",  kind: "reference", year: "Phỏng CG 2026", qcount: 10, minutes: 45, attempts: 0, bestScore: null, generated: true, basedOn: "cg-2024" },
  { id: "ref-cg-2", school: "cg",  kind: "reference", year: "Phỏng CG · Khó",  qcount: 12, minutes: 45, attempts: 0, bestScore: null, generated: true, note: "Tăng tỉ lệ NC lên 25%" },
  { id: "ref-ntt-1", school: "ntt", kind: "reference", year: "Phỏng NTT 2026", qcount: 15, minutes: 60, attempts: 0, bestScore: null, generated: true },
  { id: "ref-mix-1", school: "mix", kind: "reference", year: "Tổng hợp 4 trường", qcount: 20, minutes: 60, attempts: 1, bestScore: 68, generated: true, note: "Cân bằng phong cách 4 trường" },
  { id: "ref-tx-1",  school: "tx",  kind: "reference", year: "Phỏng TX · 60p (dài hơn)", qcount: 18, minutes: 60, attempts: 0, bestScore: null, generated: true }
];

/* ===== Sample exam — Cầu Giấy 2024-2025 (faithful to format) ===== */
window.SAMPLE_EXAM = {
  id: "cg-2024",
  school: "cg",
  kind: "official",
  title: "Đề thi vào lớp 6 — THCS Cầu Giấy",
  year: "2024-2025",
  minutes: 45,
  intro: "Học sinh làm bài trên giấy nháp, sau đó điền đáp án/lời giải vào ô trả lời. Không sử dụng máy tính.",
  /* type: "fill" (điền đáp số), "mcq" (trắc nghiệm), "essay" (tự luận) */
  questions: [
    { id: "q1", num: 1, type: "fill", topic: "soh", grade: "L5", points: 1,
      stem: "Hỗn số 2¾ được viết dưới dạng số thập phân là:",
      unit: "", placeholder: "0,00", correct: "2,75" },

    { id: "q2", num: 2, type: "fill", topic: "do", grade: "L4", points: 1,
      stem: "Đổi: 2ha 15m² = … ha (viết dưới dạng số thập phân)",
      unit: "ha", placeholder: "0,0000", correct: "2,0015" },

    { id: "q3", num: 3, type: "fill", topic: "cd", grade: "L5", points: 1,
      stem: "Một người đi bộ được 1875m trong 3 phút. Hỏi vận tốc của người đó là bao nhiêu km/giờ?",
      unit: "km/giờ", placeholder: "0", correct: "37,5" },

    { id: "q4", num: 4, type: "fill", topic: "hinh", grade: "L5", points: 1,
      stem: "Một hình hộp chữ nhật có chu vi đáy là 36cm, chiều cao 8cm. Tính diện tích xung quanh.",
      unit: "cm²", placeholder: "0", correct: "288" },

    { id: "q5", num: 5, type: "mcq", topic: "xs", grade: "L5", points: 1,
      stem: "Biểu đồ thể hiện món ăn yêu thích của 1500 học sinh. Số học sinh thích phở là 30%. Hỏi có bao nhiêu bạn thích phở?",
      options: [
        { id: "A", text: "300 bạn" },
        { id: "B", text: "450 bạn" },
        { id: "C", text: "500 bạn" },
        { id: "D", text: "600 bạn" }
      ],
      correct: "B" },

    { id: "q6", num: 6, type: "fill", topic: "cd", grade: "L5", points: 1,
      stem: "Quãng đường AB dài 95km. Xe máy đi từ A đến B trong 30 phút đầu với vận tốc 50 km/h, thời gian còn lại với vận tốc 40 km/h. Hỏi xe máy đi hết quãng đường AB trong bao lâu?",
      unit: "giờ", placeholder: "0,0", correct: "2,25" },

    { id: "q7", num: 7, type: "fill", topic: "hinh", grade: "L5", points: 1,
      stem: "Cho hình vẽ, biết hình vuông có cạnh 10cm. Tính diện tích phần tô đậm (lấy π = 3,14).",
      unit: "cm²", placeholder: "0", correct: "21,5",
      figure: "square-circle" },

    { id: "q8", num: 8, type: "fill", topic: "tuoi", grade: "L4+5", points: 1,
      stem: "Ba năm trước, tuổi bố gấp 5 lần tuổi con. Năm nay, tổng số tuổi của hai bố con là 42. Hỏi năm nay con bao nhiêu tuổi?",
      unit: "tuổi", placeholder: "0", correct: "9" },

    { id: "q9", num: 9, type: "essay", topic: "phan", grade: "L5", points: 2,
      stem: "Bạn Liên đọc một quyển sách dày 375 trang. Ngày đầu Liên đọc được 2/5 quyển sách. Ngày thứ hai đọc được 3/4 số trang còn lại. Hỏi sau hai ngày Liên còn phải đọc bao nhiêu trang nữa thì hết quyển sách?",
      placeholder: "Trình bày lời giải...",
      modelAnswer: "56,25 trang (… → đáp số nguyên 56 trang nếu làm tròn)",
      correct: "56" },

    { id: "q10", num: 10, type: "essay", topic: "log", grade: "NC", points: 2,
      stem: "Tìm tất cả các cặp số tự nhiên (a, b) thoả mãn a × b × (a + b) = 30.",
      placeholder: "Trình bày lời giải...",
      modelAnswer: "(1; 5), (5; 1), (2; 3), (3; 2)",
      correct: "(1,5)(5,1)(2,3)(3,2)" }
  ]
};

/* Mock student's answers when reviewing the exam */
window.MOCK_ANSWERS = {
  q1: "2,75",
  q2: "2,0015",
  q3: "375",       /* sai — quên đổi đơn vị từ m sang km */
  q4: "288",
  q5: "B",
  q6: "2,25",
  q7: "21,5",
  q8: "12",        /* sai */
  q9: "60",        /* sai */
  q10: ""          /* bỏ */
};

/* ===== Recent activity feed ===== */
window.RECENT = [
  { kind: "exam", title: "Đề thi Cầu Giấy 2024-2025", when: "Hôm qua", score: 82, total: 100, school: "cg" },
  { kind: "topic", title: "Bài tập Chuyển động — Mức L5", when: "2 ngày trước", score: 7, total: 10, topic: "cd" },
  { kind: "exam", title: "Đề thi Thanh Xuân 2025-2026", when: "3 ngày trước", score: 73, total: 100, school: "tx" },
  { kind: "topic", title: "Bài tập Hình học — Mức NC", when: "5 ngày trước", score: 4, total: 8, topic: "hinh" },
  { kind: "exam", title: "Đề thi NTT 2025-2026 (phỏng tạo)", when: "1 tuần trước", score: 60, total: 100, school: "ntt" }
];

/* ===== Topic-level practice sets =====
   kind: "official"  = 100% câu lấy từ đề thi chính thức các năm
         "reference" = câu phỏng tạo / tham khảo / nâng cao tự biên
         "mixed"     = trộn cả 2 (ghi tỉ lệ ở field mixRatio)
*/
window.TOPIC_SETS = {
  cd: [
    { id: "cd-l4", name: "Chuyển động — Lớp 4 cơ bản", qcount: 8, difficulty: "L4", kind: "official", source: "Trích đề CG/NTT 2018-2024", attempted: true, best: 6 },
    { id: "cd-l5", name: "Chuyển động — Lớp 5 nâng dần", qcount: 10, difficulty: "L5", kind: "mixed", mixRatio: "7/3", source: "70% đề chính thức + 30% phỏng tạo", attempted: true, best: 7 },
    { id: "cd-nc", name: "Chuyển động — Nâng cao (2 vật, ngược chiều, dòng nước)", qcount: 8, difficulty: "NC", kind: "reference", source: "Phỏng + Olympic", attempted: false },
    { id: "cd-mix", name: "Tổng hợp Chuyển động — phỏng đề CG", qcount: 6, difficulty: "Mix", kind: "reference", source: "Phỏng đề CG 2025", attempted: false }
  ],
  hinh: [
    { id: "h-l4", name: "Hình học — Chu vi, diện tích cơ bản", qcount: 10, difficulty: "L4", kind: "official", source: "Trích đề 4 trường", attempted: true, best: 8 },
    { id: "h-l5", name: "Hình học — Hình hộp, hình tròn", qcount: 10, difficulty: "L5", kind: "mixed", mixRatio: "8/2", source: "80% đề chính thức", attempted: true, best: 6 },
    { id: "h-nc", name: "Hình học Olympic — Tỉ số diện tích, tam giác", qcount: 8, difficulty: "NC", kind: "reference", source: "Olympic + Phỏng tạo", attempted: false }
  ]
  /* (other topics use defaults; will be auto-marked when generated via admin tool) */
};

/* ===== User practice history =====
   This is the ONLY way users see "how many" — based on their own activity,
   not on the system catalog. The bank of reference exercises is effectively infinite.
*/
window.USER_HISTORY = {
  /* exam attempts (both official and reference) */
  exams: [
    { id: "hx-1", kind: "official", examId: "cg-2024", school: "cg", year: "2024-2025", score: 82, when: "Hôm qua",       when_full: "25/05/2026" },
    { id: "hx-2", kind: "official", examId: "cg-2025", school: "cg", year: "2025-2026", score: 78, when: "3 ngày trước",  when_full: "23/05/2026" },
    { id: "hx-3", kind: "reference", school: "cg", style: "Phỏng CG · Lớp 5 nâng dần", score: 76, when: "Tuần trước", when_full: "19/05/2026" },
    { id: "hx-4", kind: "official", examId: "tx-2025", school: "tx", year: "2025-2026", score: 73, when: "Tuần trước",  when_full: "18/05/2026" },
    { id: "hx-5", kind: "reference", school: "ntt", style: "Phỏng NTT · Mix", score: 64, when: "2 tuần trước", when_full: "12/05/2026" },
    { id: "hx-6", kind: "official", examId: "cg-2022", school: "cg", year: "2022-2023", score: 65, when: "1 tháng trước", when_full: "26/04/2026" },
    { id: "hx-7", kind: "official", examId: "ntt-2023", school: "ntt", year: "2023-2024", score: 55, when: "1 tháng trước", when_full: "20/04/2026" },
    { id: "hx-8", kind: "reference", school: "mix", style: "Tổng hợp 4 trường · Mix", score: 68, when: "5 tuần trước", when_full: "15/04/2026" }
  ],
  /* topic-level practice sessions */
  topicSessions: {
    cd: [
      { id: "ts-1", level: "L5", qcount: 10, score: 7, when: "Hôm qua",       when_full: "25/05" },
      { id: "ts-2", level: "L4", qcount: 8,  score: 6, when: "1 tuần trước",  when_full: "18/05" },
      { id: "ts-3", level: "NC", qcount: 8,  score: 4, when: "2 tuần trước",  when_full: "11/05" },
      { id: "ts-4", level: "L5", qcount: 10, score: 8, when: "3 tuần trước",  when_full: "04/05" }
    ],
    hinh: [
      { id: "ts-5", level: "L4", qcount: 10, score: 8, when: "3 ngày trước",  when_full: "23/05" },
      { id: "ts-6", level: "L5", qcount: 10, score: 6, when: "1 tuần trước",  when_full: "18/05" },
      { id: "ts-7", level: "L5", qcount: 12, score: 9, when: "2 tuần trước",  when_full: "10/05" }
    ],
    soh: [
      { id: "ts-8", level: "L5", qcount: 10, score: 9, when: "2 ngày trước",  when_full: "24/05" },
      { id: "ts-9", level: "L4", qcount: 10, score: 8, when: "1 tuần trước",  when_full: "17/05" }
    ],
    phan: [
      { id: "ts-10", level: "L5", qcount: 10, score: 7, when: "4 ngày trước", when_full: "22/05" },
      { id: "ts-11", level: "L4", qcount: 8,  score: 6, when: "2 tuần trước", when_full: "11/05" }
    ],
    tuoi: [
      { id: "ts-12", level: "L4+5", qcount: 8, score: 6, when: "1 tuần trước", when_full: "18/05" }
    ],
    do: [
      { id: "ts-13", level: "L4", qcount: 10, score: 9, when: "5 ngày trước", when_full: "21/05" }
    ],
    log: [
      { id: "ts-14", level: "L5", qcount: 8, score: 5, when: "1 tuần trước", when_full: "19/05" }
    ],
    xs: [
      { id: "ts-15", level: "L5", qcount: 6, score: 4, when: "2 tuần trước", when_full: "12/05" }
    ],
    ti: [],
    tg: []
  }
};
/* ===== Sample topic exercise set ===== */
window.SAMPLE_TOPIC_SET = {
  id: "cd-l5",
  topic: "cd",
  name: "Chuyển động — Lớp 5 nâng dần",
  minutes: 30,
  questions: [
    { id: "t1", num: 1, type: "fill", topic: "cd", grade: "L5", points: 1,
      stem: "Một ô tô đi từ A đến B với vận tốc 60 km/h trong 2,5 giờ. Tính độ dài quãng đường AB.",
      unit: "km", placeholder: "0", correct: "150" },
    { id: "t2", num: 2, type: "fill", topic: "cd", grade: "L5", points: 1,
      stem: "Quãng đường AB dài 120km. Một xe máy đi với vận tốc 40 km/h. Hỏi xe máy đi từ A đến B mất bao lâu?",
      unit: "giờ", placeholder: "0", correct: "3" },
    { id: "t3", num: 3, type: "fill", topic: "cd", grade: "L5", points: 1,
      stem: "Một người đi xe đạp trong 45 phút được 12 km. Tính vận tốc của người đó.",
      unit: "km/giờ", placeholder: "0", correct: "16" }
  ]
};

/* ===== Helpers ===== */
window.fmt = {
  pct: (n) => Math.round(n) + "%",
  schoolById: (id) => SCHOOLS.find(s => s.id === id),
  topicById: (id) => TOPICS.find(t => t.id === id),
  pad2: (n) => String(n).padStart(2, "0"),
  /* hh:mm:ss */
  hms: (sec) => {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h > 0 ? fmt.pad2(h) + ":" : "") + fmt.pad2(m) + ":" + fmt.pad2(s);
  }
};

/* ===== AI tutor canned Socratic dialog (for mock + LLM fallback) ===== */
/* Each question has a sequence of hints; AI never gives full answer up front */
window.SOCRATIC = {
  q3: {
    intro: "Câu này con bị nhầm về đơn vị — kết quả của con là **375** nhưng đề hỏi vận tốc theo **km/giờ**. Cô gợi ý từng bước, con thử nhé.",
    hints: [
      "Trước hết, con xác định đề cho gì và hỏi gì? Quãng đường là **1875 m** trong **3 phút**, đề hỏi vận tốc theo **km/giờ**. Đơn vị có khớp nhau không?",
      "Đúng rồi — m và phút không khớp với km/giờ. Vậy con cần đổi: 1875 m = ? km, và 3 phút = ? giờ.",
      "1875 m = **1,875 km**. 3 phút = **3/60 = 0,05 giờ**. Bây giờ áp dụng công thức v = s ÷ t, con tính được bao nhiêu?",
      "Chính xác: v = 1,875 ÷ 0,05 = **37,5 km/giờ**. Lần sau khi đề hỏi km/giờ, con luôn đổi đơn vị về km và giờ trước khi tính nhé."
    ]
  },
  q8: {
    intro: "Đây là dạng toán tuổi quen thuộc — con đoán đáp án 12 nhưng chưa đúng. Mình cùng làm lại từ đầu nha.",
    hints: [
      "Ba năm trước, tuổi bố gấp **5 lần** tuổi con. Nếu gọi tuổi con ba năm trước là **a**, thì tuổi bố ba năm trước là gì?",
      "Tốt — tuổi bố là **5a**. Vậy năm nay (sau 3 năm), tuổi con là **a + 3**, tuổi bố là **5a + 3**. Đề cho tổng tuổi năm nay là 42, con lập được phương trình gì?",
      "Đúng vậy: (a + 3) + (5a + 3) = 42, tức **6a + 6 = 42**. Con giải tiếp xem nào.",
      "6a = 36 → a = 6. Đó là tuổi con **ba năm trước**. Câu hỏi là tuổi con **năm nay**, vậy là bao nhiêu?",
      "Chính xác là **9 tuổi**. Mẹo nhỏ: với toán tuổi, luôn ghi chú rõ \"ba năm trước\" và \"năm nay\" để không nhầm như vừa rồi nhé."
    ]
  },
  q9: {
    intro: "Câu này con ghi 60 trang — sai. Mình lần lượt phân tích để con tự ra số đúng.",
    hints: [
      "Ngày đầu Liên đọc được **2/5** của 375 trang. Con tính ra bao nhiêu trang?",
      "2/5 × 375 = **150 trang**. Vậy sau ngày đầu, còn lại bao nhiêu trang chưa đọc?",
      "Đúng — còn lại **225 trang**. Ngày thứ hai đọc tiếp **3/4** của 225. Con tính nhé.",
      "3/4 × 225 = **168,75 trang**. Vậy sau hai ngày, tổng cộng đã đọc 150 + 168,75 = 318,75 trang. Còn cần đọc bao nhiêu trang nữa thì hết sách?",
      "375 − 318,75 = **56,25 trang** (thực tế lấy phần nguyên là **56 trang** vì số trang phải nguyên). Sai sót của con là đã bỏ qua bước \"3/4 của số trang **còn lại**\" mà tính 3/4 của 375 — chú ý đọc kỹ \"còn lại\" nhé."
    ]
  },
  q10: {
    intro: "Câu này con để trống — không sao, mình bắt đầu từ con số 30 nhé.",
    hints: [
      "Đề yêu cầu tìm các cặp số tự nhiên (a, b) sao cho **a × b × (a + b) = 30**. Vì a, b là số tự nhiên, a × b và a + b đều là số tự nhiên. Con phân tích 30 thành tích của các số nhỏ xem.",
      "Đúng rồi: 30 = 1×30 = 2×15 = 3×10 = 5×6. Bây giờ ta thử: nếu a × b = m thì a + b = 30/m. Với m = 5, a + b = 6. Con tìm được a, b thoả mãn không?",
      "a × b = 5 và a + b = 6 → hai số là **2 và 3** (vì 2×3=6, sai!). Khoan — 2×3 = 6 ≠ 5. Con thử lại: a × b = 6 và a + b = 5 → hai số có tổng 5, tích 6 là **2 và 3**. Vậy (2; 3) là một cặp. Đảo lại có (3; 2). Còn cặp nào nữa không?",
      "Thử m = 30 → a + b = 1, không có nghiệm tự nhiên dương. m = 15 → a + b = 2, a×b = 15, không tồn tại. m = 10 → a + b = 3, a×b = 10, không tồn tại. m = 5 → a + b = 6, a×b = 5, được **(1; 5)** và (5; 1). Vậy đáp án cuối cùng là 4 cặp: **(1; 5), (5; 1), (2; 3), (3; 2)**."
    ]
  }
};
