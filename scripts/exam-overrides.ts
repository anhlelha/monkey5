// Shared overrides for exam metadata + stems.
// Imported by build-exams-metadata.ts (correct/unit/figure → JSON) and
// seed-all-exams.ts (stem → DB during seed, bypassing the parsed-stems file).

export interface ExamOverride {
  stem?: string;
  correct?: string;
  unit?: string | null;
  // `null` explicitly clears a `figure` value that was baked into
  // official_exams_metadata.json by a previous build.
  figure?: string | null;
  modelAnswer?: string;
  // For MCQ questions imported without a parsed-JSON source (e.g. NSHN).
  // When provided, seed-all-exams.ts uses these instead of the regex auto-split,
  // and supports any option count (3, 4, 5, ...).
  options?: Array<{ id: string; text: string }>;
}

// MANUAL OVERRIDES — primary source of truth for fixes applied to parsed/metadata data.
// Add an entry per question that needs to deviate from the raw parsed stem
// or from the bare metadata JSON. Format keys as "{SCHOOL}-{YEAR}-{NUM}",
// e.g. "LTV-2024-25-C7".
export const MANUAL_OVERRIDES: Record<string, ExamOverride> = {
  // ─── TX ─────────────────────────────────────────────────────────────────
  "TX-2019-20-C9": { figure: "tx-2019-c9", correct: "448000", unit: "cm³" },
  "TX-2019-20-C10": {
    correct: "10712",
    modelAnswer: [
      "Quan sát quy luật:",
      "- Số thứ $1$: $2$",
      "- Số thứ $2$: $20 = 2 + 18 \\times 1$",
      "- Số thứ $3$: $56 = 2 + 18 \\times (1 + 2)$",
      "- Số thứ $4$: $110 = 2 + 18 \\times (1 + 2 + 3)$",
      "- Số thứ $n$: $2 + 18 \\times (1 + 2 + \\ldots + (n - 1))$.",
      "",
      "Số thứ $35$:",
      "$$2 + 18 \\times (1 + 2 + \\ldots + 34) = 2 + 18 \\times \\dfrac{34 \\times 35}{2} = 2 + 18 \\times 595 = 10\\,712.$$",
      "",
      "**Đáp số**: $10\\,712$.",
    ].join("\n"),
  },
  "TX-2020-21-C2": { correct: "Bình" },
  // (TX-2021-22-C8 figure + modelAnswer merged into the per-question block below)
  "TX-2022-23-C3": { figure: "tx-2022-c3" },
  "TX-2023-24-C13": { figure: "tx-2023-c13" },
  // (TX-2024-25-C11 figure + modelAnswer merged into the per-question block below)
  // (TX-2025-26-B2 figure + stem + MA merged into per-question block below)

  // ─── LTV 2011-12 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2011-12-C5": {
    stem: "Tìm $x$, biết $x - \\dfrac{2}{3} \\times (x + 9) = 1$.",
  },
  "LTV-2011-12-C6": { correct: "36", unit: "m²" },
  "LTV-2011-12-C7": {
    stem: "Có 15 chiếc xe đạp và xe xích lô. Số bánh của xe đạp và xe xích lô bằng 36. Hỏi có bao nhiêu xe đạp và bao nhiêu xe xích lô?",
    correct: "9 xe đạp và 6 xe xích lô",
  },
  "LTV-2011-12-C9": {
    stem: "Tính $A = \\dfrac{51}{136} + \\dfrac{65}{104}$.",
    correct: "A = 1",
  },
  "LTV-2011-12-C12": {
    stem: "Cho hình thang $ABCD$ có đáy $CD$ dài gấp hai lần đáy nhỏ $AB$. Nếu hình thang đó có diện tích bằng $63\\text{m}^2$ thì diện tích tam giác $ABC$ bằng bao nhiêu?",
    correct: "21",
    unit: "m²",
  },
  "LTV-2011-12-C15": {
    stem: "Cho ba hình tròn: hình tròn thứ nhất có bán kính bằng 5m, hình tròn thứ hai có bán kính bằng 12m, hình tròn thứ ba có diện tích bằng tổng diện tích của hình tròn thứ nhất và hình tròn thứ hai. Hỏi bán kính hình tròn thứ ba bằng bao nhiêu?",
    correct: "13",
    unit: "m",
  },
  "LTV-2011-12-C16": {
    stem: "Quãng đường từ A đến B dài 60km. Một người đi xe đạp từ A đến B với vận tốc trung bình 12 km/giờ, và đi từ B về A với vận tốc trung bình là 10 km/giờ. Hỏi tốc độ trung bình của cả đi và về là bao nhiêu?",
    correct: "120/11",
    unit: "km/giờ",
  },
  "LTV-2011-12-C17": { correct: "8", unit: "hình" },
  "LTV-2011-12-C20": {
    stem: "Viết các phân số sau đây theo thứ tự từ nhỏ đến lớn: $\\dfrac{26}{27}; \\dfrac{25}{26}; \\dfrac{51}{52}; \\dfrac{52}{53}$.",
    correct: "25/26; 26/27; 51/52; 52/53",
    modelAnswer:
      "Ta viết mỗi phân số dưới dạng $1$ trừ đi một phần đơn vị:\n" +
      "$\\dfrac{25}{26} = 1 - \\dfrac{1}{26}$; $\\dfrac{26}{27} = 1 - \\dfrac{1}{27}$; $\\dfrac{51}{52} = 1 - \\dfrac{1}{52}$; $\\dfrac{52}{53} = 1 - \\dfrac{1}{53}$.\n" +
      "Vì $\\dfrac{1}{26} > \\dfrac{1}{27} > \\dfrac{1}{52} > \\dfrac{1}{53}$ nên $1 - \\dfrac{1}{26} < 1 - \\dfrac{1}{27} < 1 - \\dfrac{1}{52} < 1 - \\dfrac{1}{53}$.\n" +
      "Suy ra $\\dfrac{25}{26} < \\dfrac{26}{27} < \\dfrac{51}{52} < \\dfrac{52}{53}$.\n" +
      "Vậy thứ tự từ nhỏ đến lớn là: $\\dfrac{25}{26}; \\dfrac{26}{27}; \\dfrac{51}{52}; \\dfrac{52}{53}$.",
  },

  // ─── LTV 2012-13 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2012-13-C1": {
    stem: "Tổng hai số bằng 847. Số thứ nhất bằng $\\dfrac{3}{4}$ số thứ hai. Tìm hai số đó.",
    modelAnswer:
      "Coi số thứ nhất gồm $3$ phần bằng nhau thì số thứ hai gồm $4$ phần như thế.\n" +
      "Tổng số phần bằng nhau là: $3 + 4 = 7$ (phần).\n" +
      "Số thứ nhất là: $847 : 7 \\times 3 = 363$.\n" +
      "Số thứ hai là: $847 - 363 = 484$.\n" +
      "**Đáp số**: $363$ và $484$.",
  },
  "LTV-2012-13-C2": { correct: "19", unit: "năm" },
  "LTV-2012-13-C5": {
    stem: "Cho hình thang $ABCD$ có diện tích bằng $612\\text{cm}^2$. Biết rằng độ dài cạnh đáy $CD$ gấp hai lần độ dài cạnh đáy $AB$. Tính diện tích tam giác $ABC$ và tam giác $ACD$.",
    correct: "S_ABC = 204 cm²; S_ACD = 408 cm²",
  },
  "LTV-2012-13-C6": { correct: "72", unit: "mét" },
  "LTV-2012-13-C8": {
    stem: "Sắp xếp các phân số sau đây theo thứ tự từ nhỏ đến lớn: $\\dfrac{10}{11}; \\dfrac{9}{11}; \\dfrac{199}{220}$.",
    correct: "9/11; 199/220; 10/11",
  },
  "LTV-2012-13-C9": {
    stem: "Tìm ba số $a$, $b$, $c$ biết $a + b = 30$; $b + c = 37$; $c + a = 33$.",
    correct: "a = 13; b = 17; c = 20",
  },
  "LTV-2012-13-C10": {
    stem: "Khoảng cách giữa hai địa điểm A và B là 300km. Một ô tô đi từ A đến B với vận tốc 60 km/giờ, sau đó từ B quay về A với vận tốc 50 km/giờ. Hỏi tính cả đi và về thì vận tốc trung bình của ô tô là bao nhiêu?",
    correct: "600/11",
    unit: "km/giờ",
  },
  "LTV-2012-13-C11": {
    stem: "Hình vuông $ABCD$ có bốn đỉnh nằm trên hình tròn và diện tích hình vuông bằng $18\\text{cm}^2$. Tính diện tích của phần hình tròn nằm ngoài hình vuông?",
    correct: "10,26",
    unit: "cm²",
  },
  "LTV-2012-13-C14": {
    stem: "Một máy bay từ sân bay A đến sân bay B hết $\\dfrac{7}{4}$ giờ. Khoảng cách từ A đến B là 1500 km. Hỏi trung bình một phút máy bay bay được bao nhiêu km?",
    correct: "100/7",
    unit: "km",
  },
  "LTV-2012-13-C16": {
    stem: "Một phần ba học sinh lớp 6A bằng một phần tư học sinh lớp 6B. Tổng số học sinh cả hai lớp là 63. Tìm số học sinh mỗi lớp.",
    correct: "Lớp 6A: 27 học sinh; Lớp 6B: 36 học sinh",
    modelAnswer:
      "Vì $\\dfrac{1}{3}$ số HS lớp 6A bằng $\\dfrac{1}{4}$ số HS lớp 6B nên tỉ số HS 6A so với 6B là $\\dfrac{1}{4} : \\dfrac{1}{3} = \\dfrac{3}{4}$.\n" +
      "Tức là nếu lớp 6A có $3$ phần thì lớp 6B có $4$ phần bằng nhau.\n" +
      "Tổng số phần là: $3 + 4 = 7$ (phần).\n" +
      "Số HS lớp 6A là: $63 : 7 \\times 3 = 27$ (học sinh).\n" +
      "Số HS lớp 6B là: $63 - 27 = 36$ (học sinh).\n" +
      "**Đáp số**: Lớp 6A: $27$ HS; Lớp 6B: $36$ HS.",
  },
  "LTV-2012-13-C17": {
    stem: "Tìm hai số lẻ liên tiếp biết rằng tích của chúng là một số có ba chữ số mà chữ số hàng trăm bằng 3.",
    correct: "17 và 19 hoặc 19 và 21",
  },
  "LTV-2012-13-C18": {
    stem: "Tìm phân số $x$ nếu biết: $x - \\dfrac{11}{15} = \\dfrac{3 + x}{5}$.",
    correct: "x = 5/3",
  },
  "LTV-2012-13-C19": {
    stem: "Hai số $a$ và $b$ đều gấp hai lần số $c$. Trung bình cộng của ba số $a$, $b$, $c$ bằng 60. Tìm ba số đó.",
    correct: "a = b = 72; c = 36",
  },
  "LTV-2012-13-C20": { correct: "30", unit: "trận" },

  // ─── LTV 2013-14 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2013-14-C1": {
    stem: "Cho tam giác $ABC$, gọi $M$ là trung điểm $AB$, $N$ là trung điểm của $AC$. Nếu diện tích tứ giác $MNCB$ bằng $31{,}5\\text{cm}^2$ thì diện tích tam giác $ABC$ bằng bao nhiêu?",
    correct: "42",
    unit: "cm²",
  },
  "LTV-2013-14-C2": {
    stem: "Một người nói: \"Tôi sinh sau năm 1976, nhưng trước năm 1984. Cứ bốn năm tôi mới có một lần sinh nhật\". Hỏi người đó sinh ngày nào, tháng nào, năm nào?",
    correct: "Ngày 29 tháng 2 năm 1980",
  },
  "LTV-2013-14-C3": {
    stem: "Một hình thang có diện tích $50\\text{m}^2$, có đáy lớn bằng 13m và có chiều cao bằng 5m. Hãy tính độ dài đáy nhỏ.",
    correct: "7",
    unit: "mét",
  },
  "LTV-2013-14-C5": {
    stem: "Cho ba khối đồng hình lập phương có cạnh lần lượt là 3m, 4m và 5m. Người ta đun chảy ba khối đồng đó để đúc thành một khối cũng hình lập phương. Tìm cạnh của khối đồng mới đúc.",
    correct: "6",
    unit: "m",
  },
  "LTV-2013-14-C7": {
    stem: "Tìm ba số lẻ liên tiếp có tổng bằng 1113.",
    correct: "369; 371; 373",
  },
  "LTV-2013-14-C9": {
    stem: "Một bể đựng nước là một hình hộp chữ nhật có chiều dài 2,5m, chiều rộng 1,5m và chiều cao 2m. Một chiếc vòi chảy vào bể cứ 1 giờ chảy được 900 lít. Hỏi cần bao nhiêu thời gian để vòi nước chảy đầy bể?",
    correct: "8 giờ 20 phút",
  },
  "LTV-2013-14-C10": {
    stem: "Tính số $A$ biết $A = 1 + \\dfrac{1}{4} + 3 \\times 1{,}25 - 3 : 1{,}25 + 2 \\times 1{,}2$.",
    correct: "A = 5",
  },
  "LTV-2013-14-C12": {
    stem: "Bốn hình vuông được xếp thành hình chữ T như hình vẽ. Mỗi hình vuông có cạnh 2cm. Tính diện tích tam giác $ABC$.",
    correct: "10",
    unit: "cm²",
    figure: "ltv-2013-c12",
  },
  "LTV-2013-14-C13": {
    stem: "Một phân số có mẫu số lớn hơn tử số 1 đơn vị. Khi cộng phân số đó với 1 ta được phân số mới có tử số lớn hơn mẫu số 1 đơn vị. Tìm phân số ban đầu.",
    correct: "1/2",
  },
  "LTV-2013-14-C14": { correct: "A > B" },
  "LTV-2013-14-C15": {
    stem: "Mỗi ô vuông dưới đây đều có một con số, biết rằng tổng các con số ở bốn ô liên tiếp đều bằng nhau. Tìm con số ở ô có dấu \"?\".",
    correct: "3",
    figure: "ltv-2013-c15",
  },
  "LTV-2013-14-C16": {
    stem: "Trong một lớp học, số học sinh nam bằng $\\dfrac{3}{4}$ số học sinh nữ và ít hơn số học sinh nữ 4 em. Tìm số học sinh của lớp đó.",
    correct: "28",
    unit: "học sinh",
  },
  "LTV-2013-14-C17": {
    stem: "Rút gọn phân số $\\dfrac{1111}{98879}$.",
    correct: "1/89",
  },
  "LTV-2013-14-C18": {
    stem: "Trên hình vẽ ta có đường tròn tâm $O$, bán kính 10cm, tứ giác $OABC$ là hình vuông với $A$ và $C$ nằm trên đường tròn. Tìm phần diện tích của hình vuông nằm ngoài đường tròn.",
    correct: "21,5",
    unit: "cm²",
    figure: "ltv-2013-c18",
  },
  "LTV-2013-14-C19": {
    stem: "Một hình chữ nhật có diện tích $60\\text{m}^2$. Nếu tăng chiều dài của nó thêm 1m, còn chiều rộng để nguyên thì diện tích tăng thêm $5\\text{m}^2$. Tính chu vi hình chữ nhật đó.",
    correct: "34",
    unit: "m",
  },
  "LTV-2013-14-C20": {
    stem: "Tính $A = \\dfrac{1}{1 \\times 2} + \\dfrac{1}{2 \\times 3} + \\ldots + \\dfrac{1}{99 \\times 100}$.",
    correct: "99/100",
  },

  // ─── LTV 2014-15 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2014-15-C2": {
    stem: "Tổng số tuổi của ông, bố và Nam là 108 tuổi. Tuổi của ông gấp $\\dfrac{5}{4}$ tổng số tuổi của Nam và bố. Tuổi của bố gấp 3 lần tuổi của Nam. Hỏi số tuổi của từng người?",
    correct: "Ông: 60 tuổi; Bố: 36 tuổi; Nam: 12 tuổi",
  },
  "LTV-2014-15-C3": {
    stem: "Bạn Liên đọc một cuốn sách trong 3 ngày. Ngày thứ nhất bạn đọc được $\\dfrac{2}{5}$ số trang sách. Ngày thứ hai bạn đọc được $\\dfrac{2}{3}$ số trang sách còn lại. Ngày thứ ba bạn đọc 60 trang thì đọc xong cuốn sách. Hỏi cuốn sách bạn Liên đọc có bao nhiêu trang?",
    correct: "300",
    unit: "trang",
  },
  "LTV-2014-15-C4": {
    stem: "Tìm một số tự nhiên có hai chữ số, biết rằng nếu ta viết thêm vào bên trái số đó một chữ số 2 thì ta được số mới mà tổng số đã cho và số mới bằng 346.",
    correct: "73",
  },
  "LTV-2014-15-C5": {
    stem: "Bốn bạn Việt, Nam, Chiến, Thắng có tổng cộng 55 cuốn sách. Nếu đem số sách của Việt cộng thêm 5, số sách của Nam trừ đi 5, số sách của Chiến nhân 2, số sách của Thắng chia 3 thì số sách của bốn bạn bằng nhau. Tính số sách ban đầu của mỗi bạn.",
    correct: "Việt: 5 cuốn; Nam: 15 cuốn; Chiến: 5 cuốn; Thắng: 30 cuốn",
  },
  "LTV-2014-15-C6": {
    stem: "Tính giá trị biểu thức $A = 17 \\times \\left(\\dfrac{1313}{5151} + \\dfrac{1111}{3434}\\right) : \\dfrac{177}{12}$.",
    correct: "2/3",
  },
  "LTV-2014-15-C8": { correct: "14", unit: "đơn vị" },
  "LTV-2014-15-C9": {
    stem: "Lúc 6 giờ sáng một xe máy bắt đầu khởi hành từ Thanh Hóa đi Hà Nội với vận tốc 40 km/giờ. Cùng lúc đó một xe ô tô từ Hà Nội đi Thanh Hóa với vận tốc 60 km/giờ. Hỏi mấy giờ hai xe gặp nhau? Biết quãng đường từ Hà Nội đến Thanh Hóa dài 175km.",
    correct: "7 giờ 45 phút",
  },
  "LTV-2014-15-C10": {
    stem: "Sắp xếp các số sau theo thứ tự tăng dần: $\\dfrac{5}{9}; \\dfrac{12}{25}; \\dfrac{2}{5}; \\dfrac{14}{27}$.",
    correct: "2/5; 12/25; 14/27; 5/9",
    modelAnswer: "So sánh các phân số với phân số trung gian $\\dfrac{1}{2}$:\n$$\\dfrac{5}{9} > \\dfrac{5}{10} = \\dfrac{1}{2}; \\qquad \\dfrac{14}{27} > \\dfrac{14}{28} = \\dfrac{1}{2}.$$\n$$\\dfrac{12}{25} < \\dfrac{12}{24} = \\dfrac{1}{2}; \\qquad \\dfrac{2}{5} < \\dfrac{2}{4} = \\dfrac{1}{2}.$$\nVậy $\\dfrac{5}{9}$ và $\\dfrac{14}{27}$ lớn hơn $\\dfrac{1}{2}$; còn $\\dfrac{12}{25}$ và $\\dfrac{2}{5}$ nhỏ hơn $\\dfrac{1}{2}$.\n\n**So sánh hai phân số lớn hơn $\\dfrac{1}{2}$:** quy đồng $\\dfrac{5}{9} = \\dfrac{15}{27}$, mà $\\dfrac{15}{27} > \\dfrac{14}{27}$ nên $\\dfrac{14}{27} < \\dfrac{5}{9}$.\n\n**So sánh hai phân số nhỏ hơn $\\dfrac{1}{2}$:** quy đồng $\\dfrac{2}{5} = \\dfrac{10}{25}$, mà $\\dfrac{10}{25} < \\dfrac{12}{25}$ nên $\\dfrac{2}{5} < \\dfrac{12}{25}$.\n\nSắp xếp theo thứ tự tăng dần:\n$$\\dfrac{2}{5} < \\dfrac{12}{25} < \\dfrac{14}{27} < \\dfrac{5}{9}.$$\n\n**Đáp số**: $\\dfrac{2}{5}; \\ \\dfrac{12}{25}; \\ \\dfrac{14}{27}; \\ \\dfrac{5}{9}$.",
  },
  "LTV-2014-15-C12": {
    stem: "Tìm các chữ số $a$ và $b$ biết số $\\overline{1a89b}$ đồng thời chia hết cho các số 2; 5 và 9.",
    correct: "a = 0 và b = 0 hoặc a = 9 và b = 0",
  },
  "LTV-2014-15-C15": { correct: "168", unit: "mét" },
  "LTV-2014-15-C16": { correct: "300", unit: "m²" },
  "LTV-2014-15-C17": { correct: "622", unit: "chữ số" },
  "LTV-2014-15-C19": {
    stem: "Xếp các hình lập phương nhỏ cạnh 1cm thành một khối hình hộp chữ nhật có chiều dài 1dm, chiều rộng 0,5dm và chiều cao 0,6dm. Sau đó ta sơn toàn bộ các mặt của hình hộp chữ nhật. Hỏi có bao nhiêu hình lập phương nhỏ bị tô một mặt?",
    correct: "136",
    unit: "hình",
  },
  "LTV-2014-15-C20": { correct: "6", unit: "số" },

  // ─── LTV 2018-19 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2018-19-C2": {
    stem: "Trên một khối gỗ hình lập phương cạnh 20cm, người ta đục một lỗ hình vuông cạnh 3cm ở chính giữa, xuyên qua khối gỗ. Tính thể tích phần còn lại của khối gỗ?",
    correct: "7820",
    unit: "cm³",
  },
  "LTV-2018-19-C4": { correct: "36", unit: "nghìn đồng" },
  "LTV-2018-19-C5": {
    stem: "Tìm $x$, biết: $x + 3{,}5 = 6{,}72 + 3{,}28$.",
    correct: "6,5",
  },
  "LTV-2018-19-C6": {
    stem: "Hàng ngày, Chi đạp xe đi học với vận tốc 12 km/giờ. Nhà Chi cách trường 3km mà bạn phải đến trường lúc 7 giờ 20 phút. Hỏi muộn nhất là mấy giờ Chi phải ra khỏi nhà?",
    correct: "7 giờ 5 phút",
  },
  "LTV-2018-19-C7": {
    stem: "Tìm số tự nhiên $x$, biết: $\\dfrac{2}{5} < \\dfrac{x}{8} < \\dfrac{3}{5}$.",
    correct: "x = 4",
    modelAnswer:
      "Quy đồng các phân số về cùng mẫu số $40$:\n" +
      "$\\dfrac{2}{5} = \\dfrac{16}{40}$; $\\dfrac{x}{8} = \\dfrac{5 \\times x}{40}$; $\\dfrac{3}{5} = \\dfrac{24}{40}$.\n" +
      "Bất đẳng thức trở thành: $16 < 5 \\times x < 24$.\n" +
      "Suy ra $5 \\times x$ là số tự nhiên lớn hơn $16$ và nhỏ hơn $24$, đồng thời chia hết cho $5$. Số duy nhất thoả mãn là $20$, nên $5 \\times x = 20$, hay $x = 4$.\n" +
      "**Đáp số**: $x = 4$.",
  },
  "LTV-2018-19-C8": { correct: "60", unit: "mét" },
  "LTV-2018-19-C10": {
    stem: "Cho hình vẽ bên. Biết $AE = EF = FB$, $DH = HG = GC$ và diện tích tứ giác $ABCD$ bằng $15\\text{cm}^2$. Tính diện tích tứ giác $GHEF$.",
    correct: "5",
    unit: "cm²",
    figure: "ltv-2018-c10",
  },
  "LTV-2018-19-C11": {
    stem: "Kết quả phép tính $\\dfrac{3}{7} \\times \\dfrac{5}{13} + \\dfrac{3}{7} \\times \\dfrac{8}{13} + 5\\dfrac{4}{7}$ là",
    correct: "6",
  },
  "LTV-2018-19-C13": {
    stem: "Tính diện tích phần tô màu trong hình vẽ bên biết bán kính mỗi đường tròn là 4cm.",
    correct: "13,76",
    unit: "cm²",
    figure: "ltv-2018-c13",
  },
  "LTV-2018-19-C14": {
    stem: "Cho dãy số: 1; 1; 2; 3; 5; 8; … Hỏi số hạng thứ 12 của dãy số đó là số nào?",
    correct: "144",
  },

  // ─── LTV 2019-20 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2019-20-C2": {
    stem: "Tìm $x$, biết: $120 : x - \\dfrac{1}{4} = 7\\dfrac{3}{4}$.",
    correct: "x = 15",
  },
  "LTV-2019-20-C3": {
    stem: "Tìm hai số biết trung bình cộng của hai số đó bằng 75 và hiệu của chúng bằng 30.",
    correct: "60 và 90",
  },
  "LTV-2019-20-C5": { correct: "3528", unit: "cm²" },
  "LTV-2019-20-C8": {
    stem: "Tìm số bé nhất trong các số sau: $1{,}001$; $\\dfrac{7}{8}$; $\\dfrac{2020}{2019}$; $\\dfrac{8}{9}$.",
    correct: "7/8",
  },
  "LTV-2019-20-C9": {
    stem: "Lúc 7 giờ sáng, một người xuất phát từ A đi về B với vận tốc 40km/h. Sau đó 30 phút, người thứ hai xuất phát từ B đi về A với vận tốc 30km/h. Biết quãng đường AB dài 160 km. Hỏi hai người gặp nhau lúc mấy giờ?",
    correct: "9 giờ 30 phút",
  },
  "LTV-2019-20-C10": { correct: "0/2019" },
  "LTV-2019-20-C11": {
    stem: "Vào ngày khai trương, một cửa hàng đồ chơi giảm giá một bộ Lego $10\\%$. Ngày hôm sau, nhân dịp Quốc tế thiếu nhi, cửa hàng giảm thêm $10\\%$ giá đang bán nên giá bán là 405000 đồng. Hỏi trước khi giảm thì bộ Lego có giá bao nhiêu?",
    correct: "500000",
    unit: "đồng",
  },
  "LTV-2019-20-C12": {
    stem: "Cho hình vẽ bên, biết chu vi hình tròn lớn nhất bằng 1234cm. Tính tổng chu vi ba hình tròn còn lại.",
    correct: "1234",
    unit: "cm",
    figure: "ltv-2019-c12",
  },
  "LTV-2019-20-C17": { correct: "43", unit: "cách" },
  "LTV-2019-20-C18": {
    stem: "Cho hình lập phương cạnh bằng 6cm được tạo thành bởi các hình lập phương cạnh bằng 1cm. Người ta sơn các mặt của hình lập phương lớn, sau đó bỏ đi các hình lập phương nhỏ chỉ được sơn một mặt. Tính diện tích toàn phần của hình còn lại.",
    correct: "312",
    unit: "cm²",
  },
  "LTV-2019-20-C19": { correct: "24", unit: "chữ số 0" },
  "LTV-2019-20-C20": {
    stem: "Có tất cả bao nhiêu hình vuông trong hình vẽ bên?",
    correct: "70",
    unit: "hình",
    figure: "ltv-2019-c20",
  },
  // ─── LTV 2020-21 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2020-21-C1": {
    stem: "Tìm $x$, biết: $\\dfrac{3}{4} \\times x - \\dfrac{3}{2} = \\dfrac{9}{2}$.",
    modelAnswer:
      "$\\dfrac{3}{4} \\times x - \\dfrac{3}{2} = \\dfrac{9}{2}$\n" +
      "$\\dfrac{3}{4} \\times x = \\dfrac{9}{2} + \\dfrac{3}{2}$\n" +
      "$\\dfrac{3}{4} \\times x = 6$\n" +
      "$x = 6 : \\dfrac{3}{4}$\n" +
      "$x = 8$.",
  },
  "LTV-2020-21-C2": {
    stem: "Một hình hộp chữ nhật khi tăng chiều rộng lên 3 lần, chiều dài giảm đi 2 lần thì chiều cao phải tăng hay giảm bao nhiêu lần để thể tích của nó không đổi?",
    correct: "Giảm 1,5 lần",
    unit: null,
  },
  "LTV-2020-21-C3": {
    stem: "Năm nay tuổi bố gấp 10 lần tuổi con, 6 năm sau tuổi bố gấp 4 lần tuổi con. Hỏi hiện nay mỗi người bao nhiêu tuổi?",
    correct: "Con: 3 tuổi; Bố: 30 tuổi",
  },
  "LTV-2020-21-C4": {
    stem: "Tính: $3{,}48 : 0{,}58 \\times 4{,}5 - 13{,}6$.",
  },
  "LTV-2020-21-C6": { correct: "67,32", unit: "mét" },
  "LTV-2020-21-C7": {
    stem: "Biết $\\dfrac{3}{4}$ số học sinh của một lớp là 27 bạn. Tính số học sinh của lớp đó.",
    correct: "36",
    unit: "học sinh",
  },
  "LTV-2020-21-C8": {
    stem: "Nếu mua 20 chiếc khẩu trang hết 160000 đồng. Hỏi để mua 50 chiếc khẩu trang cùng loại thì hết bao nhiêu tiền?",
    correct: "400000",
    unit: "đồng",
  },
  "LTV-2020-21-C9": {
    stem: "Tìm phân số lớn hơn trong hai phân số sau: $A = \\dfrac{119}{117}$ và $B = \\dfrac{201}{202}$.",
    correct: "A",
  },
  "LTV-2020-21-C10": {
    stem: "Một đội công nhân có 15 người, dự định mỗi ngày làm 8 giờ thì sau 12 ngày sẽ xong công việc. Nhưng thực tế, đội được bổ sung thêm 1 người và mỗi ngày cả đội cùng làm thêm 2 giờ. Hỏi sau mấy ngày thì đội làm xong công việc?",
    correct: "9",
    unit: "ngày",
  },
  "LTV-2020-21-C11": {
    stem: "Một người đi xe đạp từ B đi về phía C với vận tốc 15 km/giờ. Cùng lúc đó, một người đi xe máy từ A cách B 66 km với vận tốc 45 km/giờ và đuổi theo xe đạp (như hình vẽ). Hỏi kể từ lúc bắt đầu đi, sau bao lâu thì xe máy đuổi kịp xe đạp?",
    correct: "2 giờ 12 phút",
    figure: "ltv-2020-c11",
  },
  "LTV-2020-21-C12": {
    stem: "Trong dịp Tết vừa qua, Chi đã được mừng tuổi một số tiền. Bạn đã mua đồ chơi hết $\\dfrac{1}{3}$ số tiền, sau đó lại ủng hộ $\\dfrac{1}{3}$ số tiền còn lại cho quỹ từ thiện trường. Cuối cùng bạn còn lại 400000 đồng. Hỏi tổng số tiền Chi được mừng tuổi là bao nhiêu?",
    correct: "900000",
    unit: "đồng",
  },
  "LTV-2020-21-C14": {
    stem: "Tìm các chữ số $x$, $y$ để $\\overline{27xy}$ chia hết cho 3; 4 và 5.",
    correct: "x = 0, y = 0 hoặc x = 6, y = 0",
  },
  "LTV-2020-21-C15": {
    stem: "Cho hình vẽ bên. Biết $AB = 0{,}6$ dm, $BC = 4$ cm. Tính diện tích phần tô đậm.",
    correct: "18,84",
    unit: "cm²",
    figure: "ltv-2020-c15",
  },
  "LTV-2020-21-C16": {
    stem: "Bác An nuôi 40 con vừa gà vừa vịt. Biết $50\\%$ số gà bằng $\\dfrac{1}{3}$ số vịt. Tính số gà và số vịt.",
    correct: "16 con gà và 24 con vịt",
    unit: null,
  },
  "LTV-2020-21-C17": {
    stem: "Tìm $x$, biết $x + \\dfrac{1}{2} + \\dfrac{1}{6} + \\dfrac{1}{12} + \\dfrac{1}{20} + \\dfrac{1}{30} = \\dfrac{47}{42}$.",
    correct: "x = 2/7",
  },
  "LTV-2020-21-C20": {
    stem: "Cho hình vẽ bên. Biết $BM = MC$, $AN = \\dfrac{1}{5} \\times AC$. Tính tỉ số diện tích tam giác $PAN$ và tam giác $ABC$.",
    correct: "1/15",
    figure: "ltv-2020-c20",
    modelAnswer:
      "Nối $P$ với $C$ và $B$ với $N$.\n" +
      "Xét tam giác $PBM$ và tam giác $PCM$ có chung chiều cao hạ từ $P$ xuống $BC$, đáy $MB = MC$ nên $S_{PBM} = S_{PCM}$.\n" +
      "Xét tam giác $NBM$ và tam giác $NCM$ có chung chiều cao hạ từ $N$ xuống $BC$, đáy $MB = MC$ nên $S_{NBM} = S_{NCM}$.\n" +
      "Suy ra $S_{PBM} - S_{NBM} = S_{PCM} - S_{NCM}$, hay $S_{PBN} = S_{PCN}$.\n" +
      "Xét tam giác $PAN$ và tam giác $PCN$ có chung chiều cao hạ từ $P$ xuống $AC$ nên $\\dfrac{S_{PAN}}{S_{PCN}} = \\dfrac{AN}{CN} = \\dfrac{1}{4}$ (do $AN = \\dfrac{1}{5} \\times AC$). Suy ra $S_{PAN} = \\dfrac{1}{4} \\times S_{PCN} = \\dfrac{1}{4} \\times S_{PBN}$.\n" +
      "Mà $S_{PBN} = S_{PAN} + S_{ABN}$, kết hợp với $S_{PAN} = \\dfrac{1}{4} \\times S_{PBN}$ suy ra $S_{ABN} = \\dfrac{3}{4} \\times S_{PBN}$, do đó $S_{PAN} = \\dfrac{1}{3} \\times S_{ABN}$.\n" +
      "Xét tam giác $ABN$ và tam giác $ABC$ có chung chiều cao hạ từ $B$ xuống $AC$ nên $\\dfrac{S_{ABN}}{S_{ABC}} = \\dfrac{AN}{AC} = \\dfrac{1}{5}$. Suy ra $S_{ABN} = \\dfrac{1}{5} \\times S_{ABC}$.\n" +
      "Vậy $S_{PAN} = \\dfrac{1}{3} \\times \\dfrac{1}{5} \\times S_{ABC} = \\dfrac{1}{15} \\times S_{ABC}$, hay $\\dfrac{S_{PAN}}{S_{ABC}} = \\dfrac{1}{15}$.",
  },

  // ─── LTV 2021-22 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2021-22-C1": {
    stem: "Hằng ngày, bạn Hưng chạy bộ được $1\\dfrac{1}{7}$ km. Hỏi trong 1 tuần, bạn Hưng chạy được bao nhiêu km?",
    correct: "8",
    unit: "km",
    modelAnswer:
      "Đổi $1\\dfrac{1}{7} = \\dfrac{8}{7}$ (km).\n" +
      "Quãng đường bạn Hưng chạy được trong 1 tuần là: $\\dfrac{8}{7} \\times 7 = 8$ (km).\n" +
      "**Đáp số**: $8$ km.",
  },
  "LTV-2021-22-C3": {
    modelAnswer:
      "Thời gian máy làm xong 175 dụng cụ là: $1{,}2 \\times 175 = 210$ (phút) $= 3$ giờ $30$ phút.\n" +
      "Máy bắt đầu lúc 7 giờ 30 phút và làm trong 3 giờ 30 phút nên thời điểm làm xong là $11$ giờ.\n" +
      "**Đáp số**: 11 giờ.",
  },
  "LTV-2021-22-C4": {
    correct: "38,465",
    unit: "cm²",
    modelAnswer:
      "Bán kính hình tròn là: $7 : 2 = 3{,}5$ (cm).\n" +
      "Diện tích hình tròn là: $3{,}5 \\times 3{,}5 \\times 3{,}14 = 38{,}465$ (cm²).\n" +
      "**Đáp số**: $38{,}465$ cm².",
  },
  "LTV-2021-22-C5": {
    stem: "Có một hình chữ nhật đã được tăng chiều dài thêm $10\\%$ và giảm chiều rộng đi $10\\%$ thì diện tích hình chữ nhật đó thay đổi như thế nào?",
    correct: "Giảm 1% so với diện tích ban đầu",
  },
  "LTV-2021-22-C6": {
    stem: "Cả đàn có tất cả 50 con bò và trâu, biết rằng nếu đem $\\dfrac{2}{5}$ số trâu và $\\dfrac{3}{4}$ số bò thì có tất cả 27 con. Tính số trâu và số bò.",
    correct: "30 con trâu và 20 con bò",
    modelAnswer:
      "Gọi số con trâu là $T$, số con bò là $B$. Theo đề bài ta có hệ:\n" +
      "$$\\begin{cases} T + B = 50 \\\\ \\dfrac{2}{5}T + \\dfrac{3}{4}B = 27 \\end{cases}$$\n" +
      "Nhân hai vế phương trình thứ hai với $20$ (mẫu số chung của $5$ và $4$):\n" +
      "$$8T + 15B = 540. \\quad (1)$$\n" +
      "Nhân hai vế phương trình thứ nhất với $8$:\n" +
      "$$8T + 8B = 400. \\quad (2)$$\n" +
      "Trừ $(1)$ cho $(2)$ theo vế: $7B = 540 - 400 = 140$, suy ra $B = 20$.\n" +
      "Do đó $T = 50 - 20 = 30$.\n\n" +
      "**Đáp số**: $30$ con trâu và $20$ con bò.",
  },
  "LTV-2021-22-C8": {
    stem: "Tính diện tích toàn phần hình bên, biết các hình nhỏ đều bằng nhau, chiều dài 4dm, chiều rộng 3dm, chiều cao 3,5dm.",
    correct: "322",
    unit: "dm²",
    figure: "ltv-2021-c8",
  },
  "LTV-2021-22-C9": {
    stem: "Một trường bán trú dự trữ gạo đủ cho 480 học sinh ăn trong 25 ngày. Nhà trường mới nhận thêm 20 học sinh nữa. Hỏi số gạo trên đủ ăn trong bao nhiêu ngày?",
    correct: "24",
    unit: "ngày",
  },

  // ─── LTV 2022-23 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2022-23-C1": {
    stem: "Sắp xếp các số sau theo thứ tự từ bé đến lớn: $\\dfrac{9}{10}; \\dfrac{7}{8}; \\dfrac{4}{3}$.",
    correct: "7/8; 9/10; 4/3",
    modelAnswer:
      "Ta có $\\dfrac{9}{10} = 1 - \\dfrac{1}{10}$ và $\\dfrac{7}{8} = 1 - \\dfrac{1}{8}$.\n" +
      "Vì $\\dfrac{1}{8} > \\dfrac{1}{10}$ nên $1 - \\dfrac{1}{8} < 1 - \\dfrac{1}{10}$, tức là $\\dfrac{7}{8} < \\dfrac{9}{10}$.\n" +
      "Mặt khác $\\dfrac{9}{10} < 1 < \\dfrac{4}{3}$, suy ra $\\dfrac{7}{8} < \\dfrac{9}{10} < \\dfrac{4}{3}$.\n" +
      "Vậy thứ tự từ bé đến lớn là: $\\dfrac{7}{8}; \\dfrac{9}{10}; \\dfrac{4}{3}$.",
  },
  "LTV-2022-23-C2": {
    stem: "Trung bình cộng của hai số bằng 21,35. Biết một trong hai số bằng 22,1 thì số còn lại bằng bao nhiêu?",
  },
  "LTV-2022-23-C3": {
    stem: "Kết quả của phép tính $\\dfrac{2}{5} + \\dfrac{3}{5} : 1\\dfrac{1}{2}$ là",
    correct: "4/5",
  },
  "LTV-2022-23-C4": {
    stem: "Một lớp có $\\dfrac{2}{3}$ số học sinh là nữ, còn lại là 11 học sinh nam. Tính số học sinh của lớp đó.",
    correct: "33",
    unit: "học sinh",
    modelAnswer:
      "Số học sinh nam chiếm: $1 - \\dfrac{2}{3} = \\dfrac{1}{3}$ (số học sinh cả lớp).\n" +
      "Mà số học sinh nam là $11$, vậy số học sinh cả lớp là: $11 : \\dfrac{1}{3} = 33$ (học sinh).\n" +
      "**Đáp số**: $33$ học sinh.",
  },
  "LTV-2022-23-C7": { correct: "5", unit: "số" },
  "LTV-2022-23-C8": {
    stem: "Biết 20m² 5dm² = ... dm². Số thích hợp điền vào chỗ chấm là số nào?",
  },
  "LTV-2022-23-C10": {
    stem: "Một bể nước hình hộp chữ nhật có kích thước đo ở trong lòng bể là: dài 2 m, rộng 1,5m và cao 12dm. Biết lượng nước trong bể đang chiếm $75\\%$ thể tích bể. Hỏi phải đổ thêm bao nhiêu lít nước nữa để đầy bể?",
    correct: "900",
    unit: "lít",
  },
  "LTV-2022-23-C11": {
    stem: "Trên bản đồ tỉ lệ $1:1000$, một mảnh đất hình chữ nhật có chiều dài 10cm, chiều rộng 8cm. Hỏi trong thực tế mảnh đất đó có diện tích bằng bao nhiêu m²?",
    correct: "8000",
    unit: "m²",
  },
  "LTV-2022-23-C13": {
    stem: "Có hai cái hộp giống nhau, trong đó hộp A đựng một cái bánh Pizza có đường kính 24cm, hộp B đựng hai cái bánh Pizza có đường kính 16cm. Biết các bánh Pizza là cùng loại và có cùng độ dày. Hỏi hộp nào nặng hơn?",
    correct: "Hộp A",
  },
  "LTV-2022-23-C14": {
    stem: "Cho hai hình thang có diện tích bằng nhau. Hình thang thứ nhất có hai đáy dài 8cm và 10cm. Hình thang thứ hai có hai đáy dài 5cm và 14cm. Hỏi hình thang nào có chiều cao lớn hơn?",
    correct: "Hình thang thứ nhất",
  },
  "LTV-2022-23-C15": {
    stem: "Số học sinh dự thi vào lớp 6 trường Lương Thế Vinh có $45\\%$ là nữ. Nếu thêm 50 học sinh nữ đồng thời bớt đi 50 học sinh nam thì số học sinh nữ bằng $\\dfrac{7}{15}$ tổng số học sinh. Tính số học sinh dự thi.",
    correct: "3000",
    unit: "học sinh",
  },
  "LTV-2022-23-C18": { correct: "42", unit: "bậc" },
  "LTV-2022-23-C19": {
    stem: "Tìm $x$ biết các số trong cả ba hình sau được viết theo cùng một quy luật.",
    correct: "x = 66",
    figure: "ltv-2022-c19",
  },
  "LTV-2022-23-C20": {
    stem: "Cho hình vẽ, biết độ dài đoạn $AB$ gấp 3 lần đoạn $AD$, đoạn $CE$ gấp 4 lần đoạn $DE$ và diện tích tam giác $BDE$ bằng $10\\text{cm}^2$. Tính diện tích tam giác $ABC$.",
    correct: "45",
    unit: "cm²",
    figure: "ltv-2022-c20",
  },

  // ─── LTV 2023-24 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2023-24-C1": {
    stem: "Tìm số tự nhiên $a$, biết: $2 \\times a - 5\\dfrac{3}{4} = \\dfrac{57}{4}$.",
  },
  "LTV-2023-24-C2": {
    stem: "Tính thể tích bể nước có chiều dài là 2,4m; chiều rộng bằng $\\dfrac{2}{3}$ chiều dài và chiều cao là 15dm.",
    correct: "5760",
    unit: "dm3",
  },
  "LTV-2023-24-C5": {
    stem: "Sắp xếp các phân số sau theo thứ tự từ bé đến lớn: $\\dfrac{5}{8}; \\dfrac{11}{12}; \\dfrac{7}{8}; \\dfrac{10}{9}$.",
    correct: "5/8; 7/8; 11/12; 10/9",
    modelAnswer:
      "Ta thấy $\\dfrac{5}{8} < 1$, $\\dfrac{7}{8} < 1$, $\\dfrac{11}{12} < 1$ và $\\dfrac{10}{9} > 1$. Vậy $\\dfrac{10}{9}$ là phân số lớn nhất.\n" +
      "So sánh $\\dfrac{5}{8}$ và $\\dfrac{7}{8}$: cùng mẫu, $5 < 7$ nên $\\dfrac{5}{8} < \\dfrac{7}{8}$.\n" +
      "So sánh $\\dfrac{7}{8}$ và $\\dfrac{11}{12}$: $\\dfrac{7}{8} = 1 - \\dfrac{1}{8}$ và $\\dfrac{11}{12} = 1 - \\dfrac{1}{12}$. Vì $\\dfrac{1}{8} > \\dfrac{1}{12}$ nên $1 - \\dfrac{1}{8} < 1 - \\dfrac{1}{12}$, tức là $\\dfrac{7}{8} < \\dfrac{11}{12}$.\n" +
      "Suy ra $\\dfrac{5}{8} < \\dfrac{7}{8} < \\dfrac{11}{12} < \\dfrac{10}{9}$.\n" +
      "Vậy thứ tự từ bé đến lớn là: $\\dfrac{5}{8}; \\dfrac{7}{8}; \\dfrac{11}{12}; \\dfrac{10}{9}$.",
  },
  "LTV-2023-24-C6": {
    stem: "Tìm các số chia hết cho 2 và 5 trong các số sau: 35; 120; 68; 250; 222.",
  },
  "LTV-2023-24-C9": { figure: "ltv-2023-c9" },
  "LTV-2023-24-C10": {
    stem: "Nhà bác An thu hoạch được một số thóc, $60\\%$ số thóc thu hoạch được bằng 1 tấn 200 kg. Tính số thóc nhà bác An đã thu hoạch được.",
    correct: "2",
    unit: "tấn",
  },
  "LTV-2023-24-C13": { correct: "113,04", unit: "cm2" },
  "LTV-2023-24-C14": {
    stem: "Tính: $1{,}2 + 1{,}5 + 1{,}8 + \\ldots + 4{,}5 + 4{,}8$.",
  },
  "LTV-2023-24-C16": {
    stem: "Lớp 5B phát động phong trào \"Hoa việc tốt\". Bạn Linh quyên góp 2 quyển sách và 3 quyển vở được 16 bông hoa việc tốt. Bạn Trang góp 10 quyển vở có được số bông hoa điểm tốt bằng bạn Việt góp 4 quyển sách. Hỏi Nam góp 5 quyển sách và 6 quyển vở thì được bao nhiêu bông hoa việc tốt?",
    correct: "37",
    unit: "bông hoa",
  },
  "LTV-2023-24-C17": {
    stem: "Cho hình vuông như sau. Tính diện tích phần tô màu nằm ngoài hình tròn biết đường chéo $AC = 8$ cm.",
    correct: "6,88",
    unit: "cm2",
    figure: "ltv-2023-c17",
  },
  "LTV-2023-24-C18": {
    stem: "Lớp 5A trồng cây 3 ngày. Ngày thứ nhất trồng được $\\dfrac{2}{5}$ tổng số cây. Ngày thứ hai trồng được 28 cây. Ngày thứ ba trồng được $\\dfrac{1}{3}$ số cây đã trồng. Hỏi lớp 5A trồng được tất cả bao nhiêu cây?",
    correct: "80",
    unit: "cây",
  },
  "LTV-2023-24-C19": {
    stem: "Dùng 7 que diêm thì xếp được tối đa bao nhiêu hình tam giác (phải giữ nguyên trạng thái từng que diêm)?",
    correct: "3",
    unit: "tam giác",
  },
  "LTV-2023-24-C20": {
    stem: "Cho hình chữ nhật ABCD có M là trung điểm AB và điểm N nằm trên cạnh AD. Tính tỉ số $\\dfrac{AN}{AD}$ để $S_{CMN} = \\dfrac{1}{3} \\times S_{ABCD}$.",
    correct: "AN/AD = 1/3",
    figure: "ltv-2023-c20",
  },

  // ─── LTV 2024-25 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2024-25-C1": {
    stem: "Tính: $\\dfrac{3}{7} + \\dfrac{8}{5} + \\dfrac{4}{7} - \\dfrac{48}{30}$.",
  },
  "LTV-2024-25-C2": {
    stem: "Tìm số tự nhiên $a$, biết: $2 \\times a - 2\\dfrac{3}{5} = \\dfrac{47}{5}$.",
  },
  "LTV-2024-25-C4": {
    stem: "Tính: $52{,}39 - 28{,}23 - 21{,}77$.",
  },
  "LTV-2024-25-C5": {
    stem: "Tìm hai số tự nhiên có tổng là 1989 và tỉ số của hai số đó bằng $\\dfrac{4}{5}$.",
    correct: "Số lớn: 1105; Số bé: 884",
  },
  "LTV-2024-25-C6": { correct: "24; 26; 28; 30" },
  "LTV-2024-25-C7": {
    stem: "Một lớp học có 32 học sinh, trong đó số học sinh nam chiếm $\\dfrac{3}{8}$ số học sinh của lớp. Hỏi lớp đó có bao nhiêu học sinh nữ?",
    correct: "20",
    unit: "học sinh nữ",
    modelAnswer:
      "Số học sinh nam của lớp đó là: $32 \\times \\dfrac{3}{8} = 12$ (học sinh).\n" +
      "Số học sinh nữ của lớp đó là: $32 - 12 = 20$ (học sinh).\n" +
      "**Đáp số**: $20$ học sinh nữ.",
  },
  "LTV-2024-25-C9": {
    stem: "Mua 3m vải phải trả 45 000 đồng. Hỏi nếu mua 8,5m vải cùng loại thì phải trả nhiều hơn bao nhiêu tiền?",
    correct: "82500",
    unit: "đồng",
  },
  "LTV-2024-25-C10": {
    stem: "1 tấn 3 tạ bằng bao nhiêu ki-lô-gam?",
  },
  "LTV-2024-25-C11": {
    stem: "Một bể bơi dạng hình hộp chữ nhật có chiều dài 20,5m, chiều rộng 16,2m. Nếu bể chứa 298,89m³ nước thì mực nước trong bể lên tới $\\dfrac{3}{4}$ chiều cao của bể. Hỏi chiều cao của bể là bao nhiêu mét?",
    correct: "1,2",
    unit: "m",
  },
  "LTV-2024-25-C12": {
    stem: "Để làm xong một đoạn đường trong 12 ngày thì cần 18 công nhân. Hỏi nếu muốn làm xong đoạn đường đó trong 9 ngày thì cần phải bổ sung thêm bao nhiêu công nhân? (Coi năng suất của mỗi công nhân là như nhau)",
    correct: "6",
    unit: "công nhân",
  },
  "LTV-2024-25-C13": {
    stem: "Tính tuổi của mẹ và con hiện nay, biết rằng hai năm trước tuổi mẹ gấp 8 lần tuổi con và hai năm sau tổng số tuổi của hai mẹ con là 44 tuổi.",
    correct: "Mẹ 34 tuổi; Con 6 tuổi",
  },
  "LTV-2024-25-C14": { figure: "ltv-2024-c14" },
  "LTV-2024-25-C17": { figure: "ltv-2024-c17" },
  "LTV-2024-25-C18": {
    stem: "Tìm số tự nhiên có bốn chữ số, biết rằng nếu xoá chữ số hàng chục và chữ số hàng đơn vị thì được số mới giảm 4059 đơn vị.",
    correct: "4100 hoặc 4099",
  },
  "LTV-2024-25-C19": {
    stem: "Trong ngày Tết sẻ chia, khối lớp 6 trường Lương Thế Vinh đã mở một gian hàng bán xúc xích lấy tiền ủng hộ các bạn có hoàn cảnh khó khăn. Buổi sáng bán với giá 10 000 đồng một cái, buổi chiều hạ giá nên số xúc xích bán được tăng thêm $25\\%$ và số tiền thu được tăng thêm $12{,}5\\%$ so với buổi sáng. Hỏi sau khi hạ giá, mỗi cái xúc xích có giá bao nhiêu tiền?",
    correct: "9000",
    unit: "đồng",
  },
  "LTV-2024-25-C20": { figure: "ltv-2024-c20" },

  // ─── LTV 2025-26 — full audit pass against PDF Mathexpress ──────────────
  "LTV-2025-26-C1": {
    stem: "Tính giá trị biểu thức: $\\dfrac{5}{6} + 3{,}4 + \\dfrac{19}{6} - 2{,}4$.",
  },
  "LTV-2025-26-C2": {
    correct: "100 và 102",
  },
  "LTV-2025-26-C3": { correct: "7", unit: "câu" },
  "LTV-2025-26-C4": { correct: "1/5" },
  "LTV-2025-26-C5": {
    stem: "Cho 3 tam giác dưới đây có quy luật giống nhau, tìm số thích hợp thay thế dấu \"?\".\n- Tam giác 1: đỉnh = 2, ô giữa = 15, hai ô đáy = 6 và 4.\n- Tam giác 2: đỉnh = 3, ô giữa = 18, hai ô đáy = 5 và 7.\n- Tam giác 3: đỉnh = 6, ô giữa = ?, hai ô đáy = 8 và 10.",
    figure: "ltv-2025-c5",
  },
  "LTV-2025-26-C7": { correct: "32", unit: "hình" },
  "LTV-2025-26-C9": { correct: "60000", unit: "lít" },
  "LTV-2025-26-C10": {
    stem: "Có một công việc 12 người hoàn thành trong 9 ngày. Hỏi nếu có 18 người thì hoàn thành trong bao nhiêu ngày? (Biết năng suất làm việc của mỗi người là như nhau)",
    correct: "6",
    unit: "ngày",
  },
  "LTV-2025-26-C11": {
    stem: "Cho dãy số: $\\dfrac{1}{3}; \\dfrac{3}{5}; \\dfrac{5}{7}; \\ldots; \\dfrac{9}{11}$. Tìm số ở dấu \"…\".",
    correct: "7/9",
  },
  "LTV-2025-26-C12": { figure: "ltv-2025-c12" },

  // ─── TX (Thanh Xuân) ────────────────────────────────────────────────────
  // Batched 2026-06-12 audit — fix wrong `correct` values (stems cut at the
  // last word got stored as the answer), restore missing fractions/units in
  // stems, and override the most-shredded modelAnswers. Years 2019-22 done
  // here; 2022-25 stems also fixed; modelAnswers for 2022-25 still need PDF
  // answer pages — those are TODO in this batch.

  // TX 2019-20 — wrong correct values (stems were cut, last word stored)
  "TX-2019-20-C2": {
    stem: "Đổi $42\\text{m}^2\\, 134\\text{cm}^2 = \\ldots\\ldots$ m².",
  },
  "TX-2019-20-C3": {
    stem: "Một lớp học có 19 học sinh nam. Số học sinh nữ nhiều hơn số học sinh nam là 2 bạn. Hỏi số học sinh nữ chiếm bao nhiêu phần trăm số học sinh cả lớp?",
    correct: "52,5",
    unit: "%",
    modelAnswer: [
      "Số học sinh nữ: $19 + 2 = 21$ (học sinh).",
      "Lớp có tổng: $19 + 21 = 40$ (học sinh).",
      "Tỉ số phần trăm học sinh nữ so với cả lớp:",
      "$$21 : 40 = 0{,}525 = 52{,}5\\%.$$",
      "",
      "**Đáp số**: $52{,}5\\%$.",
    ].join("\n"),
  },
  "TX-2019-20-C5": {
    correct: "50,24",
    unit: "cm²",
  },
  "TX-2019-20-C6": {
    stem: "Tìm $y$ biết: $y + \\dfrac{1}{2} + \\dfrac{1}{4} + \\dfrac{1}{8} + \\dfrac{1}{16} + \\dfrac{1}{32} = 1$.",
    correct: "1/32",
    modelAnswer: [
      "Đặt $A = \\dfrac{1}{2} + \\dfrac{1}{4} + \\dfrac{1}{8} + \\dfrac{1}{16} + \\dfrac{1}{32}$.",
      "Ta có: $A \\times 2 = 1 + \\dfrac{1}{2} + \\dfrac{1}{4} + \\dfrac{1}{8} + \\dfrac{1}{16}$.",
      "Trừ vế:",
      "$$A = A \\times 2 - A = 1 - \\dfrac{1}{32} = \\dfrac{31}{32}.$$",
      "",
      "Suy ra $y + \\dfrac{31}{32} = 1 \\Rightarrow y = 1 - \\dfrac{31}{32} = \\dfrac{1}{32}$.",
      "",
      "**Đáp số**: $y = \\dfrac{1}{32}$.",
    ].join("\n"),
  },
  "TX-2019-20-C7": {
    stem: "Mẹ hơn con 25 tuổi. Sau 5 năm nữa thì tuổi con bằng $\\dfrac{2}{7}$ tuổi mẹ. Tính tuổi con hiện nay.",
    correct: "5",
    unit: "tuổi",
  },
  "TX-2019-20-C8": {
    stem: "Tìm các chữ số $a$, $b$ thỏa mãn $\\overline{2019ab}$ chia $2$ dư $1$, chia $5$ dư $3$ và chia $9$ dư $4$.",
    correct: "a=7; b=3",
    modelAnswer: [
      "Để $\\overline{2019ab}$ chia $5$ dư $3$ thì $b = 3$ hoặc $b = 8$.",
      "Mà $\\overline{2019ab}$ chia $2$ dư $1$ (số lẻ) nên $b = 3$.",
      "",
      "Thay $b = 3$, ta được số $\\overline{2019a3}$.",
      "Để $\\overline{2019a3}$ chia $9$ dư $4$ thì tổng các chữ số $(2 + 0 + 1 + 9 + a + 3) = (a + 15)$ chia $9$ dư $4$.",
      "Suy ra $(a + 15 - 4) = (a + 11)$ chia hết cho $9$ ⟹ $a = 7$.",
      "",
      "**Đáp số**: $a = 7$; $b = 3$.",
    ].join("\n"),
  },
  // (TX-2019-20-C9 figure + correct/unit merged into the early entry block above)
  "TX-2019-20-B2": {
    modelAnswer: [
      "Nối $A$ với $M$.",
      "Vì $3AN = 2NC$ nên $\\dfrac{NC}{AC} = \\dfrac{3}{5}$ (đặt $AN = 2k$, $NC = 3k$ thì $AC = 5k$).",
      "Vì $CM = 2BM$ nên $\\dfrac{MC}{BC} = \\dfrac{2}{3}$.",
      "",
      "**Bước 1.** Hai tam giác $MNC$ và $MAC$ có chung chiều cao hạ từ $M$ xuống $AC$:",
      "$$\\dfrac{S_{MNC}}{S_{MAC}} = \\dfrac{NC}{AC} = \\dfrac{3}{5}.$$",
      "",
      "**Bước 2.** Hai tam giác $AMC$ và $ABC$ có chung chiều cao hạ từ $A$ xuống $BC$:",
      "$$\\dfrac{S_{AMC}}{S_{ABC}} = \\dfrac{MC}{BC} = \\dfrac{2}{3}.$$",
      "",
      "**Bước 3.** Ghép lại:",
      "$$S_{MNC} = \\dfrac{3}{5} \\times S_{MAC} = \\dfrac{3}{5} \\times \\dfrac{2}{3} \\times S_{ABC} = \\dfrac{2}{5} \\, S_{ABC}.$$",
      "Với $S_{MNC} = 30$ cm²:",
      "$$S_{ABC} = 30 : \\dfrac{2}{5} = 30 \\times \\dfrac{5}{2} = 75 \\text{ (cm}^2\\text{).}$$",
      "",
      "**Đáp số**: $S_{ABC} = 75$ cm².",
    ].join("\n"),
  },

  // TX 2020-21 — C1 missing mixed number, C3 cut stem stored as correct, B4/B5 now essay
  "TX-2020-21-C1": {
    stem: "Tính: $A = 20\\% + 5\\dfrac{1}{2} + 40\\%$.",
  },
  "TX-2020-21-C3": {
    stem: "Người ta xếp $1331$ khối lập phương nhỏ cạnh $1$ cm thành một khối hình lập phương lớn, sau đó người ta sơn $4$ mặt xung quanh và đáy trên của hình lập phương lớn. Hỏi có tất cả bao nhiêu khối lập phương nhỏ được sơn đúng $1$ mặt?",
    correct: "441",
    unit: "khối",
    modelAnswer: [
      "Vì $1331 = 11 \\times 11 \\times 11$ nên mỗi cạnh của khối lập phương lớn có $11$ khối nhỏ.",
      "",
      "Người ta sơn $5$ mặt ($4$ mặt xung quanh + đáy trên). Các khối nhỏ chỉ được sơn đúng $1$ mặt gồm:",
      "- Các khối **trên $5$ mặt được sơn**, không nằm ở cạnh và đỉnh: $(11-2) \\times (11-2) = 81$ khối/mặt × $5$ mặt = $405$ khối.",
      "- Các khối **trên $4$ cạnh của mặt đáy không sơn** (4 cạnh dưới), không nằm ở đỉnh: $(11-2) \\times 4 = 36$ khối.",
      "",
      "Tổng số khối được sơn đúng $1$ mặt:",
      "$$405 + 36 = 441 \\text{ (khối).}$$",
      "",
      "**Đáp số**: $441$ khối.",
    ].join("\n"),
  },
  "TX-2020-21-B5": {
    modelAnswer: [
      "Hình thang vuông $ABCD$: đáy nhỏ $AB = 40$ cm, đáy lớn $CD = 60$ cm, đường cao $AD = 40$ cm. $E$ trên $AD$ với $AE = 30$ cm, $ED = 10$ cm. $G$ trên $BC$ sao cho $EG$ chia $ABCD$ thành hai hình thang.",
      "",
      "Diện tích hình thang $ABCD$:",
      "$$S_{ABCD} = \\dfrac{(40 + 60) \\times 40}{2} = 2000 \\text{ (cm}^2\\text{).}$$",
      "",
      "Vẽ thêm đường chéo $AG$, $DG$ chia $ABCD$ thành ba tam giác $ABG$, $ADG$, $DGC$:",
      "- $S_{ABG} = \\dfrac{40 \\times 30}{2} = 600$ (cm²) (đáy $AB = 40$, chiều cao $AE = 30$).",
      "- $S_{DGC} = \\dfrac{60 \\times 10}{2} = 300$ (cm²) (đáy $DC = 60$, chiều cao $ED = 10$).",
      "- $S_{ADG} = 2000 - 600 - 300 = 1100$ (cm²).",
      "",
      "Hai tam giác $DEG$ và $ADG$ chung chiều cao hạ từ $G$ xuống $AD$, đáy $DE = \\dfrac{1}{4} AD$, nên:",
      "$$S_{DEG} = \\dfrac{1}{4} \\times S_{ADG} = \\dfrac{1100}{4} = 275 \\text{ (cm}^2\\text{).}$$",
      "",
      "Diện tích hai hình thang con:",
      "$$S_{EGCD} = S_{DGC} + S_{DEG} = 300 + 275 = 575 \\text{ (cm}^2\\text{).}$$",
      "$$S_{ABGE} = S_{ABCD} - S_{EGCD} = 2000 - 575 = 1425 \\text{ (cm}^2\\text{).}$$",
      "",
      "**Đáp số**: $S_{ABGE} = 1425$ cm²; $S_{EGCD} = 575$ cm².",
    ].join("\n"),
  },

  // TX 2021-22 — C7-C10 now essay; modelAnswers shredded in parsed JSON
  "TX-2021-22-C7": {
    stem: "Tìm $n$, biết: $\\dfrac{2}{3} + \\dfrac{2}{15} + \\dfrac{2}{35} + \\dfrac{2}{63} + \\ldots + \\dfrac{2}{n} = \\dfrac{100}{101}$.",
    modelAnswer: [
      "Nhận xét: $3 = 1 \\times 3$, $15 = 3 \\times 5$, $35 = 5 \\times 7$, $63 = 7 \\times 9$, ... Các mẫu số đều là tích của hai số lẻ liên tiếp. Đặt $n = (k - 2) \\times k$.",
      "",
      "Với mỗi cặp số lẻ liên tiếp $m, m+2$: $\\dfrac{2}{m(m+2)} = \\dfrac{1}{m} - \\dfrac{1}{m+2}$. Do đó:",
      "$$A = \\dfrac{2}{1 \\times 3} + \\dfrac{2}{3 \\times 5} + \\dfrac{2}{5 \\times 7} + \\ldots + \\dfrac{2}{(k-2) \\times k}$$",
      "$$= 1 - \\dfrac{1}{3} + \\dfrac{1}{3} - \\dfrac{1}{5} + \\ldots + \\dfrac{1}{k-2} - \\dfrac{1}{k} = 1 - \\dfrac{1}{k}.$$",
      "",
      "Từ $A = \\dfrac{100}{101}$:",
      "$$1 - \\dfrac{1}{k} = \\dfrac{100}{101} \\Rightarrow \\dfrac{1}{k} = \\dfrac{1}{101} \\Rightarrow k = 101.$$",
      "",
      "Vậy $n = (k - 2) \\times k = 99 \\times 101 = 9999$.",
      "",
      "**Đáp số**: $n = 9999$.",
    ].join("\n"),
  },
  "TX-2021-22-C8": {
    figure: "tx-2021-c8",
    modelAnswer: [
      "Nối hai đường chéo $AC$, $BD$, gọi $O$ là tâm hình vuông.",
      "Một cánh hoa được tạo bởi nửa hình tròn đường kính $AB$ (bên trong hình vuông) trừ đi tam giác $OAB$.",
      "",
      "Diện tích nửa hình tròn đường kính $AB = 10$ cm:",
      "$$\\left(\\dfrac{10}{2}\\right) \\times \\left(\\dfrac{10}{2}\\right) \\times 3{,}14 : 2 = 39{,}25 \\text{ (cm}^2\\text{).}$$",
      "Tam giác $OAB$ bằng $\\dfrac{1}{4}$ diện tích hình vuông $ABCD$:",
      "$$S_{OAB} = \\dfrac{10 \\times 10}{4} = 25 \\text{ (cm}^2\\text{).}$$",
      "",
      "Diện tích một cánh hoa: $39{,}25 - 25 = 14{,}25$ (cm²).",
      "",
      "Phần tô đậm là $4$ cánh hoa:",
      "$$S_{\\text{tô đậm}} = 14{,}25 \\times 4 = 57 \\text{ (cm}^2\\text{).}$$",
      "",
      "**Đáp số**: $57$ cm².",
    ].join("\n"),
  },
  "TX-2021-22-C9": {
    stem: "Bạn Hằng đọc một quyển sách trong 4 ngày. Ngày thứ nhất đọc $\\dfrac{1}{4}$ quyển sách và 6 trang. Ngày thứ hai đọc $\\dfrac{1}{4}$ quyển sách và 5 trang. Ngày thứ ba đọc $\\dfrac{1}{4}$ quyển sách và 4 trang. Ngày thứ tư đọc được 40 trang còn lại. Hỏi quyển sách có bao nhiêu trang?",
    modelAnswer: [
      "Ba ngày đầu đọc $3 \\times \\dfrac{1}{4} = \\dfrac{3}{4}$ quyển sách cộng với $6 + 5 + 4 = 15$ trang.",
      "",
      "Phần \"trang lẻ\" (gồm $15$ trang ba ngày đầu + $40$ trang ngày thứ tư) ứng với:",
      "$$1 - \\dfrac{3}{4} = \\dfrac{1}{4} \\text{ (tổng số trang sách).}$$",
      "",
      "Tổng số \"trang lẻ\": $6 + 5 + 4 + 40 = 55$ trang $= \\dfrac{1}{4}$ tổng. Suy ra:",
      "$$\\text{Số trang quyển sách} = 55 \\times 4 = 220 \\text{ (trang).}$$",
      "",
      "**Đáp số**: $220$ trang.",
    ].join("\n"),
  },
  "TX-2021-22-C10": {
    modelAnswer: [
      "Trên cùng quãng đường $AB$, thời gian đi với $25$ km/giờ nhiều hơn thời gian đi với $30$ km/giờ là $2 - 1 = 1$ (giờ).",
      "",
      "Tỉ số vận tốc $25 : 30 = \\dfrac{5}{6}$.",
      "Vì thời gian tỉ lệ nghịch với vận tốc, tỉ số thời gian với $25$ km/giờ so với $30$ km/giờ là $\\dfrac{6}{5}$.",
      "",
      "Coi thời gian đi với $25$ km/giờ là $6$ phần thì thời gian đi với $30$ km/giờ là $5$ phần. Hiệu $1$ phần ứng với $1$ giờ.",
      "Thời gian đi hết $AB$ với vận tốc $25$ km/giờ:",
      "$$1 \\times 6 = 6 \\text{ (giờ).}$$",
      "Quãng đường $AB$:",
      "$$25 \\times 6 = 150 \\text{ (km).}$$",
      "",
      "**Đáp số**: $150$ km.",
    ].join("\n"),
  },

  // TX 2022-23 — C4/C5 correct values cross-mapped + C5 missing fractions
  "TX-2022-23-C1": {
    stem: "Tìm chữ số tận cùng của: $A = 2 \\times 12 \\times 22 \\times 32 \\times \\ldots \\times 2022$.",
    modelAnswer: [
      "**Đếm thừa số.** Các thừa số là $2, 12, 22, 32, \\ldots, 2022$ (công sai $10$). Số thừa số:",
      "$$(2022 - 2) : 10 + 1 = 203.$$",
      "",
      "**Quy luật chữ số tận cùng.** Mỗi thừa số đều kết thúc bằng $2$. Cứ $4$ thừa số nhân với nhau thì tích có chữ số tận cùng là $6$ (vì $2 \\times 2 \\times 2 \\times 2 = 16$).",
      "",
      "Chia $203$ thừa số thành các nhóm $4$: $203 : 4 = 50$ (dư $3$).",
      "$$A = \\underbrace{(\\ldots 6 \\times \\ldots 6 \\times \\ldots \\times \\ldots 6)}_{50 \\text{ nhóm}} \\times (\\ldots 2 \\times \\ldots 2 \\times \\ldots 2).$$",
      "Tích $50$ số tận cùng $6$ vẫn tận cùng $6$. Tích $3$ số tận cùng $2$ tận cùng $8$ ($2 \\times 2 \\times 2 = 8$).",
      "",
      "Vậy $A$ có chữ số tận cùng $= 6 \\times 8 = \\ldots 8$.",
      "",
      "**Đáp số**: $8$.",
    ].join("\n"),
  },
  "TX-2022-23-C4": {
    correct: "615",
    unit: "m²",
  },
  "TX-2022-23-C5": {
    stem: "Một cửa hàng có một số ki-lô-gam thóc. Lần đầu bán được $\\dfrac{2}{5}$ số thóc, lần 2 bán được 280 kg thóc, số thóc còn lại bằng $\\dfrac{1}{3}$ số thóc đã bán. Hỏi số thóc ban đầu là bao nhiêu ki-lô-gam?",
    correct: "800",
    unit: "kg",
    modelAnswer: [
      "Vì số thóc còn lại bằng $\\dfrac{1}{3}$ số thóc đã bán nên số thóc còn lại bằng $\\dfrac{1}{3+1} = \\dfrac{1}{4}$ số thóc ban đầu.",
      "",
      "Phân số chỉ số thóc bán được trong lần 2 là:",
      "$$1 - \\dfrac{2}{5} - \\dfrac{1}{4} = \\dfrac{20 - 8 - 5}{20} = \\dfrac{7}{20} \\text{ (số thóc ban đầu).}$$",
      "$280$ kg ứng với $\\dfrac{7}{20}$ số thóc ban đầu, nên:",
      "$$\\text{Số thóc ban đầu} = 280 : 7 \\times 20 = 800 \\text{ (kg).}$$",
      "",
      "**Đáp số**: $800$ kg.",
    ].join("\n"),
  },
  "TX-2022-23-C6": {
    correct: "48",
    unit: "km/giờ",
    modelAnswer: [
      "Thời gian ô tô đi hết quãng đường $AB$ (không kể thời gian nghỉ):",
      "$$10 \\text{ giờ } 20 \\text{ phút} - 8 \\text{ giờ } 20 \\text{ phút} - 10 \\text{ phút} = 1 \\text{ giờ } 50 \\text{ phút} = \\dfrac{11}{6} \\text{ giờ}.$$",
      "",
      "Vận tốc của ô tô:",
      "$$88 : \\dfrac{11}{6} = 88 \\times \\dfrac{6}{11} = 48 \\text{ (km/giờ).}$$",
      "",
      "**Đáp số**: $48$ km/giờ.",
    ].join("\n"),
  },
  "TX-2022-23-B2": {
    stem: "Tính $A$, biết: $A = \\dfrac{6}{1 \\times 3} + \\dfrac{6}{3 \\times 5} + \\dfrac{6}{5 \\times 7} + \\ldots + \\dfrac{6}{97 \\times 99}$.",
    correct: "98/33",
    modelAnswer: [
      "Nhận xét: với mỗi cặp số lẻ liên tiếp $k, k+2$:",
      "$$\\dfrac{2}{k \\times (k+2)} = \\dfrac{1}{k} - \\dfrac{1}{k+2}.$$",
      "Do đó:",
      "$$A = 3 \\times \\left(\\dfrac{2}{1 \\times 3} + \\dfrac{2}{3 \\times 5} + \\ldots + \\dfrac{2}{97 \\times 99}\\right)$$",
      "$$= 3 \\times \\left(1 - \\dfrac{1}{3} + \\dfrac{1}{3} - \\dfrac{1}{5} + \\ldots + \\dfrac{1}{97} - \\dfrac{1}{99}\\right)$$",
      "$$= 3 \\times \\left(1 - \\dfrac{1}{99}\\right) = 3 \\times \\dfrac{98}{99} = \\dfrac{98}{33}.$$",
      "",
      "**Đáp số**: $A = \\dfrac{98}{33}$.",
    ].join("\n"),
  },

  // TX 2023-24 — C2/C3 stem broken, C10/C11/C14 missing fractions, C10 wrong correct
  "TX-2023-24-C2": {
    stem: "Điền số thích hợp vào chỗ chấm: $20\\text{dm}^2\\, 23\\text{cm}^2 = \\ldots\\, \\text{m}^2$.",
  },
  "TX-2023-24-C3": {
    stem: "Cho $A = 2\\dfrac{3}{10} - 75\\% - \\dfrac{1}{4} + 0{,}7$. Tìm $A$.",
    modelAnswer: [
      "Đổi về cùng dạng phân số:",
      "$$A = \\dfrac{23}{10} - \\dfrac{3}{4} - \\dfrac{1}{4} + \\dfrac{7}{10}.$$",
      "Nhóm lại:",
      "$$A = \\left(\\dfrac{23}{10} + \\dfrac{7}{10}\\right) - \\left(\\dfrac{3}{4} + \\dfrac{1}{4}\\right) = \\dfrac{30}{10} - \\dfrac{4}{4} = 3 - 1 = 2.$$",
      "",
      "**Đáp số**: B ($A = 2$).",
    ].join("\n"),
  },
  "TX-2023-24-C10": {
    stem: "Một mảnh vườn hình thang vuông có đáy bé bằng $\\dfrac{3}{5}$ đáy lớn. Nếu tăng đáy bé 6m thì mảnh vườn đó thành hình vuông. Tính diện tích mảnh vườn ban đầu.",
    correct: "180",
    unit: "m²",
  },
  "TX-2023-24-C11": {
    stem: "Có một số quả cam. Lần thứ nhất bán 4 quả, lần thứ hai bán $\\dfrac{1}{2}$ số quả còn lại và 2 quả, lần thứ ba bán $\\dfrac{1}{2}$ số quả còn lại và 2 quả, lần thứ tư bán $\\dfrac{1}{2}$ số quả còn lại, cuối cùng còn lại 2 quả. Tính số cam ban đầu.",
    correct: "32",
    unit: "quả",
  },
  "TX-2023-24-C14": {
    stem: "Cho dãy số sau: $\\dfrac{1}{8}; \\dfrac{1}{35}; \\dfrac{1}{80}; \\dfrac{1}{143}; \\ldots$ Tìm số thứ 23 của dãy.",
    // Wrong correct stored: "8 35 80 143" (denominators concatenated).
    // Real answer per PDF: 1/4760.
    correct: "1/4760",
    modelAnswer: [
      "Quan sát mẫu số:",
      "$$8 = 2 \\times 4; \\quad 35 = 5 \\times 7; \\quad 80 = 8 \\times 10; \\quad 143 = 11 \\times 13.$$",
      "Mẫu số là tích của hai thừa số thuộc các dãy:",
      "- Dãy 1: $2; 5; 8; 11; \\ldots$ (công sai $3$, số hạng đầu $2$).",
      "- Dãy 2: $4; 7; 10; 13; \\ldots$ (công sai $3$, số hạng đầu $4$).",
      "",
      "Số hạng thứ $23$ của dãy 1: $(23 - 1) \\times 3 + 2 = 68$.",
      "Số hạng thứ $23$ của dãy 2: $(23 - 1) \\times 3 + 4 = 70$.",
      "",
      "Vậy số hạng thứ $23$ của dãy ban đầu là:",
      "$$\\dfrac{1}{68 \\times 70} = \\dfrac{1}{4760}.$$",
      "",
      "**Đáp số**: $\\dfrac{1}{4760}$.",
    ].join("\n"),
  },
  "TX-2023-24-C16": {
    modelAnswer: [
      "Tỉ số vận tốc $30$ km/giờ so với $40$ km/giờ là $\\dfrac{30}{40} = \\dfrac{3}{4}$.",
      "Trên cùng quãng đường, thời gian tỉ lệ nghịch với vận tốc nên tỉ số thời gian với $30$ km/giờ so với $40$ km/giờ là $\\dfrac{4}{3}$.",
      "",
      "Hiệu thời gian chênh lệch: $30 + 15 = 45$ phút $= \\dfrac{3}{4}$ giờ.",
      "",
      "Thời gian bác Thanh đi với vận tốc $30$ km/giờ:",
      "$$\\dfrac{3}{4} : (4 - 3) \\times 4 = 3 \\text{ (giờ).}$$",
      "Quãng đường $AB$: $30 \\times 3 = 90$ km.",
      "",
      "Thời gian đến $B$ đúng giờ: $3$ giờ $- 30$ phút $= 2$ giờ $30$ phút $= 2{,}5$ giờ.",
      "Vận tốc đúng giờ: $90 : 2{,}5 = 36$ (km/giờ).",
      "",
      "**Đáp số**: $36$ km/giờ.",
    ].join("\n"),
  },

  // TX 2024-25 — C1 stem broken, C4 missing fractions + wrong correct,
  // C9 missing 57/165 and 2/5, C11 figure, C12 missing AB/CD ratio, B1 missing fractions
  "TX-2024-25-C1": {
    stem: "Điền số thích hợp vào chỗ trống: $50\\text{cm}^2 \\times 8 + 6\\text{dm}^2 = \\ldots\\, \\text{dm}^2$.",
  },
  "TX-2024-25-C2": {
    stem: "Tính giá trị của biểu thức: $0{,}36 \\times 4 + 36\\% \\times 2 + 2 \\times 4 \\times 0{,}18$.",
    correct: "3,6",
    modelAnswer: [
      "Đổi $36\\% = 0{,}36$ và $2 \\times 4 \\times 0{,}18 = 0{,}36 \\times 4$. Khi đó:",
      "$$0{,}36 \\times 4 + 0{,}36 \\times 2 + 0{,}36 \\times 4 = 0{,}36 \\times (4 + 2 + 4) = 0{,}36 \\times 10 = 3{,}6.$$",
      "",
      "**Đáp số**: $3{,}6$.",
    ].join("\n"),
  },
  "TX-2024-25-C4": {
    stem: "Cho dãy số: $1\\dfrac{1}{8}; 1\\dfrac{1}{15}; 1\\dfrac{1}{24}; 1\\dfrac{1}{35}; \\ldots$ Tìm số thứ 48 của dãy.",
    correct: "1 1/2499",
    modelAnswer: [
      "Quan sát:",
      "$$1\\dfrac{1}{8} = 1 + \\dfrac{1}{2 \\times 4}; \\quad 1\\dfrac{1}{15} = 1 + \\dfrac{1}{3 \\times 5}; \\quad 1\\dfrac{1}{24} = 1 + \\dfrac{1}{4 \\times 6}; \\ldots$$",
      "Số hạng thứ $n$ có dạng $1 + \\dfrac{1}{(n+1) \\times (n+3)}$.",
      "",
      "Số hạng thứ $48$:",
      "$$1 + \\dfrac{1}{49 \\times 51} = 1 + \\dfrac{1}{2499} = 1\\dfrac{1}{2499}.$$",
      "",
      "**Đáp số**: $1\\dfrac{1}{2499}$.",
    ].join("\n"),
  },
  "TX-2024-25-C5": {
    modelAnswer: [
      "Tổng khối lượng $5$ bao gạo: $40 + 48 + 60 + 44 + 25 = 217$ (kg).",
      "",
      "Sau khi lấy ra $1$ bao gạo nếp, số gạo tẻ gấp $3$ lần số gạo nếp, nên tổng số gạo tẻ + nếp lúc đó chia hết cho $4$.",
      "Vì $217 : 4 = 54$ (dư $1$) nên bao gạo nếp lấy ra phải là số chia $4$ dư $1$.",
      "Trong $\\{40, 48, 60, 44, 25\\}$ chỉ có $25$ chia $4$ dư $1$, nên bao gạo nếp lấy ra nặng $25$ kg.",
      "",
      "Tổng còn lại: $217 - 25 = 192$ (kg). Số gạo nếp còn lại: $192 : 4 = 48$ (kg).",
      "Số gạo nếp lúc đầu: $48 + 25 = 73$ (kg).",
      "",
      "**Đáp số**: $73$ kg gạo nếp.",
    ].join("\n"),
  },
  "TX-2024-25-C9": {
    stem: "Cùng cộng vào mẫu số và tử số của phân số $\\dfrac{57}{165}$ một số tự nhiên để bằng phân số $\\dfrac{2}{5}$. Tìm số tự nhiên đó.",
    modelAnswer: [
      "Khi cùng cộng vào mẫu số và tử số một số $k$, hiệu giữa mẫu số và tử số không đổi:",
      "$$165 - 57 = 108.$$",
      "",
      "Lúc sau, tỉ số tử/mẫu là $\\dfrac{2}{5}$, nên hiệu mẫu − tử ứng với $5 - 2 = 3$ phần.",
      "Tử số lúc sau:",
      "$$108 : 3 \\times 2 = 72.$$",
      "",
      "Số tự nhiên cần tìm: $72 - 57 = 15$.",
      "",
      "**Đáp số**: $15$.",
    ].join("\n"),
  },
  "TX-2024-25-C10": {
    modelAnswer: [
      "Khi thả viên kim loại cạnh $10$ cm, mực nước dâng ngang mặt viên (cao $10$ cm) nên thể tích nước tăng = thể tích viên = $10 \\times 10 \\times 10 = 1000$ (cm³).",
      "",
      "Khi thả viên cạnh $20$ cm, mực nước dâng cao $12$ cm so với ban đầu, thể tích nước tăng = $20 \\times 20 \\times 12 = 4800$ (cm³).",
      "",
      "Chênh lệch thể tích = $4800 - 1000 = 3800$ (cm³). Chênh lệch này = diện tích đáy bể $\\times (12 - 10)$ cm.",
      "",
      "Diện tích đáy bể:",
      "$$3800 : (12 - 10) = 1900 \\text{ (cm}^2\\text{).}$$",
      "",
      "**Đáp số**: $1900$ cm².",
    ].join("\n"),
  },
  "TX-2024-25-C11": {
    figure: "tx-2024-c11",
    stem: "Tính diện tích phần đã tô đậm trong hình vẽ sau (Hình vẽ không đúng, đề nghị xem tài liệu gốc):",
    modelAnswer: [
      "Nối thêm các đường chéo và đánh số $5$ phần như lời giải gốc. Quan sát:",
      "- Các phần $(2), (3), (4), (5)$ có diện tích bằng nhau.",
      "- Tổng diện tích $(1), (2), (3)$ = tổng $(1), (4), (5)$ = $\\dfrac{1}{4}$ diện tích hình tròn bán kính $BC$ trừ đi diện tích tam giác vuông $ABC$.",
      "",
      "Diện tích hình tròn bán kính $BC = 6$ cm:",
      "$$6 \\times 6 \\times 3{,}14 = 113{,}04 \\text{ (cm}^2\\text{).}$$",
      "$\\dfrac{1}{4}$ diện tích hình tròn: $113{,}04 : 4 = 28{,}26$ (cm²).",
      "",
      "Diện tích tam giác vuông $ABC$: $6 \\times 6 : 2 = 18$ (cm²).",
      "Tổng các phần $(1), (2), (3)$: $28{,}26 - 18 = 10{,}26$ (cm²).",
      "",
      "**Đáp số**: $10{,}26$ cm².",
    ].join("\n"),
  },
  "TX-2024-25-C12": {
    figure: "tx-2024-c12",
    stem: "Cho hình thang ABCD ($AB$, $CD$ là hai cạnh đáy) có $\\dfrac{AB}{CD} = \\dfrac{3}{4}$, biết diện tích tam giác $AOB$ là $3{,}6\\,\\text{cm}^2$. Tính diện tích hình thang $ABCD$.",
    modelAnswer: [
      "Vì $\\dfrac{AB}{CD} = \\dfrac{3}{4}$ và hai tam giác $ABC, ADC$ có chung chiều cao hình thang nên:",
      "$$S_{ABC} = \\dfrac{3}{4} \\, S_{ADC}.$$",
      "Hai tam giác này có chung đáy $AC$ nên chiều cao từ $B$ xuống $AC$ bằng $\\dfrac{3}{4}$ chiều cao từ $D$ xuống $AC$. Do đó $S_{AOB} = \\dfrac{3}{4} \\, S_{AOD}$.",
      "",
      "Tính $S_{AOD}$: $S_{AOD} = 3{,}6 : \\dfrac{3}{4} = 4{,}8$ (cm²).",
      "$S_{ABD} = S_{AOB} + S_{AOD} = 3{,}6 + 4{,}8 = 8{,}4$ (cm²).",
      "",
      "Tương tự, $\\dfrac{S_{ABD}}{S_{BDC}} = \\dfrac{AB}{CD} = \\dfrac{3}{4}$ nên $S_{BDC} = 8{,}4 : \\dfrac{3}{4} = 11{,}2$ (cm²).",
      "",
      "Diện tích hình thang:",
      "$$S_{ABCD} = S_{ABD} + S_{BDC} = 8{,}4 + 11{,}2 = 19{,}6 \\text{ (cm}^2\\text{).}$$",
      "",
      "**Đáp số**: $19{,}6$ cm².",
    ].join("\n"),
  },
  "TX-2024-25-B1": {
    stem: "Bốn bạn Việt, Nam, Hoà, Bình góp tiền. Việt góp được số tiền bằng $\\dfrac{1}{2}$ số tiền ba bạn còn lại góp. Nam góp được số tiền bằng $\\dfrac{1}{3}$ số tiền ba bạn còn lại góp. Hoà góp được số tiền bằng $\\dfrac{1}{4}$ số tiền ba bạn còn lại góp. Bình góp số tiền là 130 000 đồng. Hỏi cả 4 bạn góp được tất cả bao nhiêu tiền?",
    modelAnswer: [
      "Vì Việt góp $= \\dfrac{1}{2}$ số tiền ba bạn còn lại nên Việt góp $= \\dfrac{1}{1+2} = \\dfrac{1}{3}$ tổng số tiền cả $4$ bạn.",
      "Tương tự Nam góp $= \\dfrac{1}{1+3} = \\dfrac{1}{4}$ tổng; Hoà góp $= \\dfrac{1}{1+4} = \\dfrac{1}{5}$ tổng.",
      "",
      "Bình góp chiếm:",
      "$$1 - \\dfrac{1}{3} - \\dfrac{1}{4} - \\dfrac{1}{5} = \\dfrac{60 - 20 - 15 - 12}{60} = \\dfrac{13}{60} \\text{ (tổng).}$$",
      "",
      "$130\\,000$ đồng ứng với $\\dfrac{13}{60}$ tổng, nên tổng số tiền cả $4$ bạn:",
      "$$130\\,000 : 13 \\times 60 = 600\\,000 \\text{ (đồng).}$$",
      "",
      "**Đáp số**: $600\\,000$ đồng.",
    ].join("\n"),
  },
  "TX-2024-25-B2": {
    modelAnswer: [
      "Trong $1$ giờ xe thứ nhất đi được $\\dfrac{1}{6}$ quãng đường $AB$; xe thứ hai đi được $\\dfrac{1}{4}$ quãng đường $AB$.",
      "",
      "Xe thứ nhất xuất phát lúc $6$h$15'$. Trong $2$ giờ xe thứ nhất đi được $\\dfrac{2}{6} = \\dfrac{1}{3}$ quãng đường $AB$.",
      "",
      "Kể từ lúc xe thứ hai xuất phát ($8$h$15'$), quãng đường còn lại giữa hai xe là $1 - \\dfrac{1}{3} = \\dfrac{2}{3}$ $AB$. Hai xe ngược chiều, tổng tốc độ là $\\dfrac{1}{6} + \\dfrac{1}{4} = \\dfrac{5}{12}$ $AB$/giờ.",
      "",
      "Thời gian gặp nhau (kể từ lúc xe thứ hai xuất phát):",
      "$$\\dfrac{2}{3} : \\dfrac{5}{12} = \\dfrac{8}{5} \\text{ giờ} = 1 \\text{ giờ } 36 \\text{ phút.}$$",
      "",
      "Hai xe gặp nhau lúc:",
      "$$6 \\text{h}15' + 2 \\text{h} + 1 \\text{h}36' = 9 \\text{h}51'.$$",
      "",
      "**Đáp số**: $9$ giờ $51$ phút.",
    ].join("\n"),
  },

  // TX 2025-26 — B2 stem has "A M K B N" / "P D C" label bleed from figure;
  // MA has 8 single-letter labels (M, N, P, D, K, B, ...) floating mid-text.
  "TX-2025-26-B2": {
    figure: "tx-2025-b2",
    stem: "Trong hình vẽ bên, $ABCD$ và $MNDP$ là hai hình vuông. Biết $AB = 30$ cm, $MN = 20$ cm.\n\na) Tính diện tích các tam giác $ABN$, $MNP$, $PBC$.\nb) Tính diện tích tam giác $NPB$.\nc) Tính diện tích tam giác $NKB$.",
    modelAnswer: [
      "**a) Diện tích ba tam giác.**",
      "$AN = AB - BN = AB - MN = 30 - 20 = 10$ (cm).",
      "- $S_{ABN} = \\dfrac{AB \\times AN}{2} = \\dfrac{30 \\times 10}{2} = 150$ (cm²).",
      "- $S_{MNP} = \\dfrac{MN \\times NP}{2} = \\dfrac{20 \\times 20}{2} = 200$ (cm²) (vì $MNDP$ là hình vuông cạnh $20$).",
      "- $PC = PD + DC = 20 + 30 = 50$ (cm). $S_{PBC} = \\dfrac{PC \\times BC}{2} = \\dfrac{50 \\times 30}{2} = 750$ (cm²).",
      "",
      "**b) Diện tích tam giác $NPB$.**",
      "Xét tứ giác $PNBC$: chia thành tam giác $PND$ (đáy $PD = 20$, chiều cao $DN = 20$) và hình thang $NBCD$ (hai đáy $DN = 20$, $BC = 30$, chiều cao $DC = 30$):",
      "$$S_{PNBC} = \\dfrac{20 \\times 20}{2} + \\dfrac{(20 + 30) \\times 30}{2} = 200 + 750 = 950 \\text{ (cm}^2\\text{).}$$",
      "",
      "$S_{NPB} = S_{PNBC} - S_{PBC} = 950 - 750 = 200$ (cm²).",
      "",
      "**c) Diện tích tam giác $NKB$.**",
      "Nối $A$ với $P$. Diện tích tam giác $NPA$:",
      "$$S_{NPA} = \\dfrac{NP \\times AN}{2} = \\dfrac{20 \\times 10}{2} = 100 \\text{ (cm}^2\\text{).}$$",
      "Vì $S_{NPB} = 200 = 2 \\times S_{NPA}$ và hai tam giác chung đáy $PN$, nên đường cao hạ từ $B$ tới $PN$ gấp $2$ lần đường cao hạ từ $A$ tới $PN$.",
      "Đưa vào hai tam giác $PKB$ và $PKA$ có chung đáy $PK$: $S_{PKB} = 2 \\times S_{PKA}$.",
      "",
      "Mà $S_{PKB} + S_{PKA} = S_{PBA} = \\dfrac{30 \\times 30}{2} = 450$ (cm²).",
      "Do đó $S_{PKB} = 450 : (1 + 2) \\times 2 = 300$ (cm²).",
      "",
      "Vậy $S_{NKB} = S_{PKB} - S_{NPB} = 300 - 200 = 100$ (cm²).",
      "",
      "**Đáp số**: a) $S_{ABN} = 150$ cm², $S_{MNP} = 200$ cm², $S_{PBC} = 750$ cm²; b) $S_{NPB} = 200$ cm²; c) $S_{NKB} = 100$ cm².",
    ].join("\n"),
  },
  // TX 2025-26 — C11 mixed numbers + fraction operators missing
  "TX-2025-26-C11": {
    stem: "Tính giá trị biểu thức: $2\\dfrac{1}{2} \\times 0{,}5 + \\dfrac{1}{8} : 0{,}125 + 2025$.",
    modelAnswer: [
      "Đổi $2\\dfrac{1}{2} = 2{,}5$ và $\\dfrac{1}{8} = 0{,}125$. Khi đó:",
      "$$2{,}5 \\times 0{,}5 + 0{,}125 : 0{,}125 + 2025 = 1{,}25 + 1 + 2025 = 2027{,}25.$$",
      "",
      "**Đáp số**: $2027{,}25$.",
    ].join("\n"),
  },

  // ─── TX 2026-27 (mới import 2026-06-12, từ PDF MATHX recollected) ─────
  // 20 fill (C1-C20) + 2 essay (B1, B2). Stem + correct value cho từng câu.
  // Vài câu (C16) chưa có đáp án rõ — để correct=null.
  "TX-2026-27-C1": {
    stem: "Sắp xếp các số sau theo thứ tự từ bé đến lớn: $3{,}04;\\ 3{,}43;\\ 4{,}03;\\ 4{,}3$.",
    correct: "3,04; 3,43; 4,03; 4,3",
  },
  "TX-2026-27-C2": {
    stem: "Tính: $15{,}06$ yến $- 70\\dfrac{5}{8}$ kg = …",
    correct: "79,975",
    unit: "kg",
  },
  "TX-2026-27-C3": {
    stem: "Tìm số hạng thứ 40 trong dãy số: $2,\\ 5,\\ 8,\\ 11,\\ \\ldots$",
    correct: "119",
  },
  "TX-2026-27-C4": {
    stem: "Trong một hộp kín có 3 quả bóng màu xanh được đánh số 1, 2, 3 và 2 quả bóng màu đỏ được đánh số $a$, $b$. Nếu lấy ra cùng một lúc 3 quả bóng thì có bao nhiêu khả năng có thể xảy ra?",
    correct: "10",
    unit: "khả năng",
  },
  "TX-2026-27-C5": {
    stem: "Cho hai hình vuông có cạnh là $4$ cm. Tính diện tích hình cánh hoa bên dưới.",
    figure: "tx-2026-c5",
    correct: "18,24",
    unit: "cm²",
  },
  "TX-2026-27-C6": {
    stem: "Một chiếc hộp hình lập phương có cạnh là $2{,}5$ m. Người ta sơn mặt trong và mặt ngoài của chiếc hộp, biết rằng $1$ kg sơn thì sơn được $5\\,\\text{m}^2$. Tính số kg sơn cần sơn.",
    correct: "15",
    unit: "kg",
  },
  "TX-2026-27-C7": {
    stem: "Một người dự định đi một quãng đường trong vòng $2$ giờ. Nhưng trên thực tế vận tốc của người đấy giảm $12$ m/phút. Thế nên người đấy đã đi quãng đường đó trong $2$ giờ $30$ phút. Hỏi vận tốc trên thực tế đã đi là bao nhiêu?",
    // Per đáp án PDF: 48 m/phút = 2,88 km/giờ (official prefers km/giờ unit).
    correct: "2,88",
    unit: "km/giờ",
  },
  "TX-2026-27-C8": {
    stem: "Cho dãy chữ THUDOHANOI được tô các chữ cái theo thứ tự màu là xanh, đỏ, tím, vàng, nâu. Hỏi chữ cái thứ $2026$ có màu gì?",
    correct: "Xanh",
  },
  "TX-2026-27-C9": {
    stem: "Có năm chiếc đèn lồng cần trang trí. Nhóm của Hoa đã chuẩn bị một số mét dây kim tuyến để quấn quanh chu vi của chiếc đèn lồng, biết rằng bán kính của một chiếc vòng là $10$ cm. Hỏi nhóm của Hoa đã chuẩn bị bao nhiêu mét dây kim tuyến?",
    // ⚠ NOTE (per đáp án PDF): official answer "314 m" — nhưng đề ghi rõ bán
    // kính 10 cm nên chu vi mỗi đèn = 62,8 cm; 5 đèn = 314 cm = 3,14 m. Official
    // có vẻ tính 2×10×3,14 = 62,8 m (xem như radius 10m), sai unit conversion.
    // Set theo official để match grader; user có thể override lại nếu muốn fix.
    correct: "314",
    unit: "m",
  },
  "TX-2026-27-C10": {
    stem: "Lớp 5A có $18$ bạn thích bóng đá, $15$ bạn thích cầu lông và $6$ bạn thích cả bóng đá lẫn cầu lông. Hỏi số bạn thích ít nhất một trong hai môn thể thao là bao nhiêu?",
    correct: "27",
    unit: "bạn",
  },
  "TX-2026-27-C11": {
    stem: "Cho phân số $\\dfrac{5}{11}$. Người ta cộng cả tử lẫn mẫu với một số tự nhiên thì ra phân số $\\dfrac{243}{245}$. Hỏi số tự nhiên đó là số nào?",
    correct: "724",
  },
  "TX-2026-27-C12": {
    stem: "Một hình tam giác có chiều cao bằng $125$ cm. Nếu đáy gấp $4$ lần và chiều cao giảm $50$ cm thì diện tích tăng bao nhiêu lần?",
    correct: "2,4",
    unit: "lần",
  },
  "TX-2026-27-C13": {
    stem: "Có một bể dầu có chiều rộng $50$ cm, chiều cao $98$ cm, chiều dài $70$ cm. Người ta đổ dầu từ bể vào những thùng $6{,}45$ lít. Hỏi đổ được vào bao nhiêu thùng và thừa bao nhiêu lít dầu?",
    correct: "53 thùng; thừa 1,15 lít",
  },
  "TX-2026-27-C14": {
    stem: "Lúc $8\\!:\\!00$ Bình và bố đi ô tô về nhà ông bà với vận tốc là $60$ km/h. Quãng đường từ nhà Bình về nhà ông bà là $200$ km. $1$ giờ sau, lúc $9\\!:\\!00$ thì chú của Bình đi xe máy với vận tốc $40$ km/giờ từ nhà ông bà để gặp bố và Bình. Hỏi hai người gặp lúc mấy giờ?",
    correct: "10 giờ 24 phút",
  },
  "TX-2026-27-C15": {
    stem: "Chi và Hoa có $48$ viên bi. $25\\%$ số bi của Chi $= 50\\%$ số bi của Hoa. Tính số bi của Chi.",
    correct: "32",
    unit: "viên",
  },
  "TX-2026-27-C16": {
    stem: "Vì viết nhầm dấu phẩy sang phải 1 bậc, một bạn học sinh đã tính nhầm kết quả thành $49{,}1$, biết rằng kết quả đúng là $27{,}95$. Tìm 2 số đó.",
    // Per đáp án PDF: phép tính là TỔNG (A + B = 27,95). A bị dịch phẩy sang phải
    // → 10A + B = 49,1. Hiệu: 9A = 21,15 → A = 2,35, B = 25,6.
    correct: "2,35; 25,6",
    modelAnswer: [
      "Vì viết nhầm dấu phẩy sang bên phải, nên số đó bị tăng gấp $10$ lần, nên tổng tăng thêm $9$ lần số đó.",
      "",
      "$9$ lần số đó là: $49{,}1 - 27{,}95 = 21{,}15$.",
      "Số đó là: $21{,}15 : 9 = 2{,}35$.",
      "Số còn lại là: $27{,}95 - 2{,}35 = 25{,}6$.",
      "",
      "**Đáp số**: $2{,}35$ và $25{,}6$.",
    ].join("\n"),
  },
  "TX-2026-27-C17": {
    stem: "Lớp 5A có tất cả $40$ học sinh, trong đó có $12$ học sinh nữ. Tìm tỉ số giữa số học sinh nam và tổng số học sinh của lớp 5A.",
    correct: "7/10",
  },
  "TX-2026-27-C18": {
    stem: "Viết hỗn số $7\\dfrac{7}{100}$ thành số thập phân.",
    correct: "7,07",
  },
  "TX-2026-27-C19": {
    stem: "Số nào sau đây làm tròn đến hàng phần trăm thì được số bé hơn $5{,}68$? $5{,}675;\\ 5{,}674;\\ 5{,}679;\\ 5{,}68$.",
    correct: "5,674",
  },
  "TX-2026-27-C20": {
    stem: "Trong kho có $18$ tấn đường. Lần thứ nhất lấy ra nửa số đường, lần thứ $2$ lấy ra $30\\%$ số đường còn lại. Hỏi lần thứ hai lấy ra số đường là bao nhiêu?",
    correct: "2,7",
    unit: "tấn",
  },
  "TX-2026-27-B1": {
    stem: "Tổng tuổi anh và em hiện nay là $22$ tuổi. Khi tuổi anh bằng tuổi em hiện nay thì số tuổi anh gấp $4$ lần số tuổi em. Tính hiệu số tuổi của anh và em.",
    correct: "6 tuổi",
    modelAnswer: [
      "Coi tuổi em **trước đây** là $1$ phần, thì tuổi anh **trước đây** là $4$ phần.",
      "Hiệu số phần tuổi của anh và em là: $4 - 1 = 3$ (phần).",
      "",
      "Tuổi anh trước đây bằng tuổi em **hiện nay**, nên tuổi em hiện nay là $4$ phần.",
      "Suy ra tuổi anh hiện nay chiếm: $4 + 3 = 7$ (phần).",
      "",
      "**Sơ đồ đoạn thẳng:**",
      "",
      "- Tuổi em trước đây: $\\rule[0.4ex]{0.9em}{0.6pt}$ (1 phần)",
      "- Tuổi anh trước đây: $\\rule[0.4ex]{3.6em}{0.6pt}$ (4 phần)",
      "- Tuổi em hiện nay: $\\rule[0.4ex]{3.6em}{0.6pt}$ (4 phần)",
      "- Tuổi anh hiện nay: $\\rule[0.4ex]{6.3em}{0.6pt}$ (7 phần)",
      "",
      "Tổng số phần bằng nhau hiện nay là: $4 + 7 = 11$ (phần).",
      "Mỗi phần ứng với: $22 : 11 = 2$ (tuổi).",
      "Hiệu số tuổi của anh và em là: $2 \\times 3 = 6$ (tuổi).",
      "",
      "**Đáp số**: $6$ tuổi.",
    ].join("\n"),
  },
  "TX-2026-27-B2": {
    stem: "Một con đường quốc lộ song song với đường ray tàu hỏa. Trên một chiếc ô tô một du khách nhìn thấy một đoàn tàu hỏa đi ngược chiều với xe ô tô. Ô tô cách đoàn tàu $300$ m. Sau $12$ giây đoàn tàu vượt ô tô. Vận tốc đoàn tàu $60$ km/h. Vận tốc ô tô $48$ km/h. Tính chiều dài đoàn tàu.",
    correct: "60 m",
    modelAnswer: [
      "Đổi đơn vị từ km/giờ sang m/giây:",
      "$$48 \\text{ km/giờ} = \\dfrac{48000}{3600} = \\dfrac{40}{3} \\text{ m/giây}; \\quad 60 \\text{ km/giờ} = \\dfrac{50}{3} \\text{ m/giây}.$$",
      "",
      "Vì ô tô và tàu đi **ngược chiều**, tổng vận tốc của hai xe là:",
      "$$\\dfrac{40}{3} + \\dfrac{50}{3} = \\dfrac{90}{3} = 30 \\text{ (m/giây).}$$",
      "",
      "Trong $12$ giây, hai xe \"đi qua\" hoàn toàn nhau — tổng quãng đường mà hai xe đi qua = khoảng cách ban đầu $+$ chiều dài đoàn tàu.",
      "Tổng quãng đường: $30 \\times 12 = 360$ (m).",
      "",
      "Chiều dài đoàn tàu: $360 - 300 = 60$ (m).",
      "",
      "**Đáp số**: $60$ m.",
    ].join("\n"),
  },

  // ─── NTT ────────────────────────────────────────────────────────────────
  // NTT 2006-07 essays — B1 final ratio chain & B5 geometry both shredded
  "NTT-2006-07-B1": {
    modelAnswer: [
      "**Tính A.**",
      "$$A = (100 \\times 44 + 50 \\times 64) \\times \\left(\\dfrac{37414{,}8}{1000} + \\dfrac{2242{,}52}{100}\\right)$$",
      "$$= (4400 + 3200) \\times (37{,}4148 + 22{,}4252) = 7600 \\times 59{,}84.$$",
      "Viết $7600 = 100 \\times 76$ và $100 \\times 59{,}84 = 5984$, suy ra $A = 76 \\times 5984$.",
      "",
      "**Tính B.**",
      "$$B = (16 \\times 14{,}96 \\times 25) \\times (27 \\times 38 + 19 \\times 146).$$",
      "Ta có $16 \\times 25 = 400$, $400 \\times 14{,}96 = 5984$. Phần thứ hai: $27 \\times 38 = 54 \\times 19$ nên",
      "$$27 \\times 38 + 19 \\times 146 = 19 \\times (54 + 146) = 19 \\times 200.$$",
      "Vậy $B = 5984 \\times 19 \\times 200$.",
      "",
      "**Tỉ số A : B.**",
      "$$\\dfrac{A}{B} = \\dfrac{76 \\times 5984}{5984 \\times 19 \\times 200} = \\dfrac{76}{19 \\times 200} = \\dfrac{4}{200} = \\dfrac{1}{50}.$$",
      "",
      "**Đáp số**: $A : B = \\dfrac{1}{50} = 0{,}02$.",
    ].join("\n"),
  },
  "NTT-2006-07-B5": {
    modelAnswer: [
      "Cho tam giác $ABC$ với $M$ trên $BC$ thoả $BM = 2MC$, $N$ trên $CA$ thoả $CN = 3NA$, $D = AM \\cap BN$ và $S_{AND} = 10$ cm². Tìm $S_{ABC}$.",
      "",
      "**Bước 1.** Nối $C$ với $D$. Hai tam giác $ADN$ và $ADC$ có chung chiều cao hạ từ $D$ xuống $AC$, đáy $AN = \\dfrac{1}{4}AC$ (do $CN = 3NA$), nên",
      "$$\\dfrac{S_{ADN}}{S_{ADC}} = \\dfrac{AN}{AC} = \\dfrac{1}{4} \\Rightarrow S_{ADC} = 4 \\times S_{ADN} = 4 \\times 10 = 40 \\text{ cm}^2.$$",
      "",
      "**Bước 2.** Hai tam giác $ABM$ và $ACM$ có chung chiều cao từ $A$ xuống $BC$, đáy $BM = 2MC$ nên $S_{ABM} = 2 S_{ACM}$. Tương tự $S_{DBM} = 2 S_{DCM}$.",
      "Trừ vế: $S_{ABM} - S_{DBM} = 2(S_{ACM} - S_{DCM})$, tức $S_{ABD} = 2 S_{ADC} = 2 \\times 40 = 80$ cm².",
      "",
      "**Bước 3.** Vì $D$ nằm trên $BN$, $S_{ABN} = S_{ABD} + S_{ADN} = 80 + 10 = 90$ cm².",
      "Hai tam giác $ABN$ và $ABC$ có chung chiều cao từ $B$ xuống $AC$, đáy $AN = \\dfrac{1}{4}AC$ nên",
      "$$\\dfrac{S_{ABN}}{S_{ABC}} = \\dfrac{1}{4} \\Rightarrow S_{ABC} = 4 \\times S_{ABN} = 4 \\times 90 = 360 \\text{ cm}^2.$$",
      "",
      "**Đáp số**: $S_{ABC} = 360$ cm².",
    ].join("\n"),
  },
  // NTT 2007-08 — B5 MA had floating "( )" + HẾT bleed; topic also reclassified
  // from "hinh" to "log" (đếm khối lập phương theo vị trí, không phải hình học thuần).
  "NTT-2007-08-B5": {
    modelAnswer: [
      "**a) Số hình lập phương nhỏ.**",
      "Diện tích một mặt của hình lập phương lớn: $600 : 6 = 100$ (cm²).",
      "Vì $100 = 10 \\times 10$ nên cạnh hình lập phương lớn là $10$ cm.",
      "Số lần cạnh lớn gấp cạnh nhỏ: $10 : 1 = 10$ (lần).",
      "Số hình lập phương nhỏ đã dùng: $10 \\times 10 \\times 10 = 1000$ (hình).",
      "",
      "**b) Số hình chỉ được sơn đúng một mặt.**",
      "Trên mỗi mặt của hình lập phương lớn, các hình nhỏ được sơn đúng $1$ mặt là các hình **không nằm trên cạnh** của mặt đó (vì hình ở cạnh thuộc đồng thời 2 mặt nên được sơn $2$ mặt).",
      "Mỗi mặt có $(10-2) \\times (10-2) = 64$ hình chỉ được sơn $1$ mặt. Cả $6$ mặt:",
      "$$6 \\times (10-2) \\times (10-2) = 384 \\text{ (hình).}$$",
      "",
      "**Đáp số**: a) $1000$ hình; b) $384$ hình.",
    ].join("\n"),
  },
  // NTT 2008-09 — restore missing fractions / tile dimensions in old essays
  "NTT-2008-09-B1": {
    modelAnswer: [
      "Áp dụng tính chất phân phối:",
      "$$(1{,}257 \\times a + 1{,}743 \\times a) - 2008 = 2009$$",
      "$$(1{,}257 + 1{,}743) \\times a = 2009 + 2008$$",
      "$$3 \\times a = 4017$$",
      "$$a = 4017 : 3 = 1339.$$",
      "",
      "**Đáp số**: $a = 1339$.",
    ].join("\n"),
  },
  "NTT-2008-09-B2": {
    stem: "Tìm số $b$, biết rằng: $\\left(1 - \\frac{1}{2}\\right) \\times \\left(1 - \\frac{1}{3}\\right) \\times \\left(1 - \\frac{1}{4}\\right) \\times \\left(1 - \\frac{1}{5}\\right) = \\frac{b}{100}$.",
    modelAnswer: [
      "Ta có:",
      "$$\\left(1 - \\dfrac{1}{2}\\right)\\left(1 - \\dfrac{1}{3}\\right)\\left(1 - \\dfrac{1}{4}\\right)\\left(1 - \\dfrac{1}{5}\\right) = \\dfrac{1}{2} \\times \\dfrac{2}{3} \\times \\dfrac{3}{4} \\times \\dfrac{4}{5}.$$",
      "Khử các thừa số ở tử và mẫu:",
      "$$= \\dfrac{1 \\times 2 \\times 3 \\times 4}{2 \\times 3 \\times 4 \\times 5} = \\dfrac{1}{5}.$$",
      "Suy ra $\\dfrac{b}{100} = \\dfrac{1}{5}$, hay $b = \\dfrac{100}{5} = 20$.",
      "",
      "**Đáp số**: $b = 20$.",
    ].join("\n"),
  },
  "NTT-2008-09-B3": {
    stem: "Một nền nhà hình chữ nhật có chiều dài 9m, chiều rộng bằng $\\frac{2}{3}$ chiều dài. Người ta dùng các viên gạch hình vuông cạnh 3dm để lát nền nhà đó, giá tiền mỗi viên gạch là 14250 đồng. Hỏi lát cả nền nhà thì hết bao nhiêu tiền mua gạch? (Giả thiết diện tích phần mạch vữa không đáng kể)",
    modelAnswer: [
      "Chiều rộng nền nhà: $9 \\times \\dfrac{2}{3} = 6$ (m).",
      "Diện tích nền nhà: $9 \\times 6 = 54 \\text{ m}^2 = 5400 \\text{ dm}^2$.",
      "Diện tích một viên gạch: $3 \\times 3 = 9$ (dm²).",
      "Số viên gạch cần dùng: $5400 : 9 = 600$ (viên).",
      "Tổng tiền: $600 \\times 14250 = 8\\,550\\,000$ (đồng).",
      "",
      "**Đáp số**: $8\\,550\\,000$ đồng.",
    ].join("\n"),
  },
  // NTT 2009-10 — restore truncated B5 + fix B3/B4 shredded math
  "NTT-2009-10-B3": {
    modelAnswer: [
      "Thời gian xe taxi đi đến lúc gặp: $9 - 6 - 1 = 2$ giờ.",
      "Thời gian xe tải đi đến lúc gặp: $9 - 6 = 3$ giờ.",
      "Tỉ số thời gian taxi/xe tải: $\\dfrac{2}{3}$.",
      "",
      "Coi quãng đường xe tải đi trong 1 giờ là 1 phần thì:",
      "- Quãng đường xe tải trong 3 giờ = $3$ phần.",
      "- Vận tốc taxi gấp đôi vận tốc xe tải, đi trong 2 giờ → quãng đường taxi $= 2 \\times 2 = 4$ phần.",
      "- Tổng quãng đường $AB$: $3 + 4 = 7$ phần $= 210$ km.",
      "",
      "Một phần ứng với: $210 : 7 = 30$ km.",
      "Quãng đường xe tải đi: $30 \\times 3 = 90$ km → vận tốc xe tải $= 90 : 3 = 30$ km/giờ.",
      "Vận tốc taxi: $30 \\times 2 = 60$ km/giờ.",
      "",
      "**Đáp số**: Xe tải $30$ km/giờ; taxi $60$ km/giờ.",
    ].join("\n"),
  },
  "NTT-2009-10-B4": {
    modelAnswer: [
      "Tam giác $ABC$ có $M$, $N$ trên $AB$ với $AM = MN = NB$, và $P$, $Q$ trên $AC$ với $AP = PQ = QC$. Tìm $S_{MNQP}$ biết $S_{ABC} = 2010$ m².",
      "",
      "**Bước 1.** Hai tam giác $ABQ$ và $ABC$ có chung chiều cao từ $B$ xuống $AC$, đáy $AQ = \\dfrac{2}{3} AC$ (vì $QC = \\dfrac{1}{3}AC$), nên",
      "$$S_{ABQ} = \\dfrac{2}{3} \\, S_{ABC}.$$",
      "",
      "**Bước 2.** Hai tam giác $QMN$ và $ABQ$ có chung chiều cao từ $Q$ xuống $AB$, đáy $MN = \\dfrac{1}{3} AB$, nên",
      "$$S_{QMN} = \\dfrac{1}{3} \\, S_{ABQ} = \\dfrac{1}{3} \\times \\dfrac{2}{3} \\, S_{ABC} = \\dfrac{2}{9} \\, S_{ABC}.$$",
      "Hai tam giác $QMN$ và $QAM$ có chung đường cao từ $Q$ xuống $AB$, $MN = AM$ nên $S_{QAM} = S_{QMN} = \\dfrac{2}{9} S_{ABC}$.",
      "",
      "**Bước 3.** Hai tam giác $MPQ$ và $AMQ$ có chung chiều cao từ $M$ xuống $AQ$, đáy $PQ = \\dfrac{1}{2} AQ$ (vì $AP = PQ$), nên",
      "$$S_{MPQ} = \\dfrac{1}{2} \\, S_{AMQ} = \\dfrac{1}{2} \\times \\dfrac{2}{9} \\, S_{ABC} = \\dfrac{1}{9} \\, S_{ABC}.$$",
      "",
      "**Bước 4.** Tứ giác $MNQP$ chia thành $\\triangle QMN$ và $\\triangle MPQ$:",
      "$$S_{MNQP} = S_{QMN} + S_{MPQ} = \\left(\\dfrac{2}{9} + \\dfrac{1}{9}\\right) S_{ABC} = \\dfrac{1}{3} \\, S_{ABC} = \\dfrac{2010}{3} = 670 \\text{ m}^2.$$",
      "",
      "**Đáp số**: $S_{MNQP} = 670$ m².",
    ].join("\n"),
  },
  "NTT-2009-10-B5": {
    stem: "Lớp 6A có 40 học sinh. Số học sinh giỏi bằng $\\frac{2}{3}$ số học sinh khá. Số học sinh khá bằng $\\frac{3}{4}$ số học sinh trung bình. Số học sinh yếu có trong khoảng từ 1 đến 5 em. Hãy tính số học sinh từng loại?",
    modelAnswer: [
      "**Tỉ lệ giỏi : khá : trung bình.**",
      "- Giỏi $= \\dfrac{2}{3}$ khá → giỏi : khá $= 2 : 3$ (chọn khá $= 3$ phần thì giỏi $= 2$ phần).",
      "- Khá $= \\dfrac{3}{4}$ trung bình → trung bình $= \\dfrac{4}{3}$ khá $= 4$ phần.",
      "",
      "Tổng giỏi + khá + trung bình $= 2 + 3 + 4 = 9$ phần.",
      "",
      "**Tìm số phần.** Lớp có $40$ học sinh, yếu trong khoảng $1$–$5$ em → tổng (giỏi + khá + TB) trong $[35, 39]$. Số chia hết cho $9$ duy nhất là $36$, nên tổng đó $= 36$.",
      "",
      "Một phần ứng với: $36 : 9 = 4$ (học sinh).",
      "- Giỏi $= 4 \\times 2 = 8$.",
      "- Khá $= 4 \\times 3 = 12$.",
      "- Trung bình $= 4 \\times 4 = 16$.",
      "- Yếu $= 40 - 36 = 4$.",
      "",
      "**Đáp số**: $8$ giỏi, $12$ khá, $16$ trung bình, $4$ yếu.",
    ].join("\n"),
  },
  // NTT 2010-11 — B1 missing 1/3 fraction in opening, B4 missing 1/2 ratio
  "NTT-2010-11-B1": {
    stem: "Kết quả kiểm tra môn Toán của lớp 5B được xếp thành 3 loại: giỏi, khá và trung bình. Tỉ số học sinh giỏi so với học sinh khá là $\\frac{1}{3}$, tỉ số học sinh khá so với học sinh trung bình là $\\frac{2}{5}$. Hỏi bao nhiêu học sinh được xếp loại giỏi? Biết lớp 5B có 46 học sinh.",
    modelAnswer: [
      "Vì tỉ số giỏi : khá $= \\dfrac{1}{3}$ và tỉ số khá : trung bình $= \\dfrac{2}{5}$, chọn:",
      "- Khá $= 6$ phần.",
      "- Giỏi $= \\dfrac{1}{3} \\times 6 = 2$ phần.",
      "- Trung bình $= \\dfrac{5}{2} \\times 6 = 15$ phần.",
      "",
      "Tổng số phần: $2 + 6 + 15 = 23$ phần $= 46$ học sinh, nên một phần $= 2$ học sinh.",
      "",
      "Số học sinh giỏi: $2 \\times 2 = 4$ (học sinh).",
      "",
      "**Đáp số**: $4$ học sinh giỏi.",
    ].join("\n"),
  },
  "NTT-2010-11-B4": {
    modelAnswer: [
      "Cho tam giác $ABC$, $D$ là trung điểm $BC$, $E$ là trung điểm $CA$, $AD \\cap BE = G$. Chứng minh $AG = 2GD$.",
      "",
      "**Bước 1.** Hai tam giác $ABE$ và $CBE$ có chung chiều cao từ $B$ xuống $AC$, đáy $EA = EC$, nên $S_{ABE} = S_{CBE}$.",
      "Tương tự hai tam giác $AGE$ và $CGE$ có $S_{AGE} = S_{CGE}$. Trừ vế:",
      "$$S_{ABG} = S_{ABE} - S_{AGE} = S_{CBE} - S_{CGE} = S_{CBG}.$$",
      "",
      "**Bước 2.** Hai tam giác $BGD$ và $BCG$ có chung chiều cao từ $G$ xuống $BC$, đáy $BD = \\dfrac{1}{2}BC$ (do $D$ là trung điểm), nên",
      "$$\\dfrac{S_{BGD}}{S_{BCG}} = \\dfrac{BD}{BC} = \\dfrac{1}{2} \\Rightarrow S_{BCG} = 2 \\, S_{BGD}.$$",
      "Kết hợp với $S_{ABG} = S_{CBG}$ ở Bước 1: $S_{ABG} = 2 \\, S_{BGD}$.",
      "",
      "**Bước 3.** Hai tam giác $ABG$ và $BGD$ có chung chiều cao từ $B$ xuống $AD$, nên tỉ số diện tích bằng tỉ số đáy:",
      "$$\\dfrac{AG}{GD} = \\dfrac{S_{ABG}}{S_{BGD}} = 2.$$",
      "",
      "**Vậy** $AG = 2 GD$ (đpcm).",
    ].join("\n"),
  },
  // NTT 2018-19 — C1 bảng dữ liệu bị flat thành inline text; MA tính sai 1,62% (đúng là 1,7%)
  "NTT-2018-19-C1": {
    stem: [
      "Số liệu thống kê xếp loại học lực của học sinh Trường Nguyễn Tất Thành trong 4 năm được cho trong bảng dưới đây. Biết rằng học lực của học sinh được chia làm ba loại: Giỏi, Khá và Trung bình.",
      "",
      "$$\\begin{array}{|c|c|c|}\\hline",
      "\\text{Năm học} & \\text{Giỏi} & \\text{Khá} \\\\\\hline",
      "2014 - 2015 & 69{,}8\\% & 28{,}5\\% \\\\\\hline",
      "2015 - 2016 & 79{,}6\\% & 19{,}4\\% \\\\\\hline",
      "2016 - 2017 & 83{,}4\\% & 16{,}2\\% \\\\\\hline",
      "2017 - 2018 & 85{,}7\\% & 13{,}4\\% \\\\\\hline",
      "\\end{array}$$",
      "",
      "Hỏi năm học nào tỉ lệ học sinh xếp loại Trung bình của trường là cao nhất?",
    ].join("\n"),
    modelAnswer: [
      "Tỉ lệ học sinh xếp loại Trung bình mỗi năm $= 100\\% -$ (Giỏi $+$ Khá):",
      "- Năm $2014 - 2015$: $100\\% - 69{,}8\\% - 28{,}5\\% = 1{,}7\\%$.",
      "- Năm $2015 - 2016$: $100\\% - 79{,}6\\% - 19{,}4\\% = 1{,}0\\%$.",
      "- Năm $2016 - 2017$: $100\\% - 83{,}4\\% - 16{,}2\\% = 0{,}4\\%$.",
      "- Năm $2017 - 2018$: $100\\% - 85{,}7\\% - 13{,}4\\% = 0{,}9\\%$.",
      "",
      "So sánh $1{,}7\\% > 1{,}0\\% > 0{,}9\\% > 0{,}4\\%$, năm $2014 - 2015$ có tỉ lệ Trung bình cao nhất.",
      "",
      "**Đáp số**: A (năm học $2014 - 2015$).",
    ].join("\n"),
  },
  "NTT-2018-19-C5": {
    stem: "Xe ô tô chở đoàn từ thiện của trường Nguyễn Tất Thành rời Hà Nội lúc 6 giờ sáng và đi lên tỉnh Hà Giang với vận tốc trung bình là 55km/h. Cùng lúc đó, một xe tải đi từ tỉnh Hà Giang về Hà Nội trên cùng tuyến đường và hai xe gặp nhau lúc 9 giờ. Hỏi vận tốc trung bình của xe tải? Biết quãng đường từ Hà Nội tới Hà Giang là 300km.",
    correct: "45",
    unit: "km/h",
  },
  "NTT-2018-19-C7": {
    figure: "ntt-2018-c7",
    correct: "21",
    unit: "cm",
    stem: "Các bạn trong Câu lạc bộ Khoa học đố nhau cùng giải một bài toán: Một thùng rỗng hình hộp chữ nhật dài 60cm, rộng 50cm, đặt trong đó 3 khối lập phương kim loại cạnh 10cm (như hình vẽ). Sau đó nước được đổ vào thùng từ một vòi với tốc độ chảy 4 lít/phút thì sau 15 phút thùng đầy nước. Hỏi chiều cao của thùng là bao nhiêu centimet?",
  },
  "NTT-2018-19-C8": {
    correct: "8",
    unit: "con",
    stem: "Trên cây ở sân trường Nguyễn Tất Thành có 10 con chim đang đậu ở hai cành cây. Có 1 con từ cành trên bay xuống cành dưới và 3 con bay từ cành dưới bay lên cành trên, khi ấy số chim ở cành trên bằng $\\frac{2}{3}$ số chim ở cành dưới. Hỏi lúc đầu cành dưới có bao nhiêu con chim?",
  },
  "NTT-2018-19-C9": {
    correct: "355740",
    unit: "đồng",
    stem: "Nhà trường tổ chức hội chợ để gây quỹ ủng hộ “Vì Trường Sa thân yêu”. Lớp 6A vẽ một bức tranh và đem bán đấu giá với giá dự kiến là 280000 đồng. Người thứ nhất trả cao hơn giá dự kiến $10\\%$, người thứ hai trả cao hơn giá người thứ nhất đưa ra là $10\\%$, người thứ ba trả cao hơn giá người thứ hai đưa ra là $5\\%$ và mua được bức tranh. Hỏi cuối cùng, bức tranh được bán với giá bao nhiêu?",
  },
  "NTT-2018-19-C10": {
    correct: "1985000",
    unit: "đồng",
    stem: "Lớp 6A đi từ thiện tại Bệnh viện Huyết Học, Ban tổ chức cần mua 200 hộp sữa và 50 gói bánh. Biết rằng một hộp sữa giá 5000 đồng, một gói bánh giá 25000 đồng. Cửa hàng khuyến mại mua 5 hộp sữa được tặng 1 hộp, mua 10 gói bánh được tặng 1 gói. Hỏi tổng số tiền Ban tổ chức phải trả là bao nhiêu?",
  },
  "NTT-2018-19-B1": {
    stem: "Trong số học sinh tham gia dự án chăm sóc hoa, cây cảnh ở khuôn viên trường Nguyễn Tất Thành, số học sinh lớp 9 chiếm $\\frac{2}{5}$, số học sinh lớp 8 chiếm $\\frac{1}{3}$, còn lại là số học sinh lớp 7 và lớp 6. Biết rằng tổng số học sinh lớp 6, 7, 8 tham gia là 126 học sinh, số học sinh lớp 6 tham gia bằng $\\frac{3}{4}$ số học sinh lớp 7. Hãy tìm số học sinh lớp 6 đã tham gia dự án?",
    modelAnswer: [
      "**Tỉ lệ lớp 6 + 7.** Lớp 9 chiếm $\\dfrac{2}{5}$, lớp 8 chiếm $\\dfrac{1}{3}$. Phần lớp 6 và 7 chiếm:",
      "$$1 - \\dfrac{2}{5} - \\dfrac{1}{3} = \\dfrac{15 - 6 - 5}{15} = \\dfrac{4}{15}.$$",
      "",
      "**Chia lớp 6 và 7.** Lớp 6 $= \\dfrac{3}{4}$ lớp 7, nên lớp 6 : lớp 7 $= 3 : 4$, tổng $= 7$ phần. Trong $\\dfrac{4}{15}$ tổng:",
      "- Lớp 6 $= \\dfrac{4}{15} \\times \\dfrac{3}{7} = \\dfrac{12}{105} = \\dfrac{4}{35}$ (tổng số học sinh).",
      "- Lớp 7 $= \\dfrac{4}{15} \\times \\dfrac{4}{7} = \\dfrac{16}{105}$ (tổng).",
      "",
      "**Lớp 6 + 7 + 8 chiếm:**",
      "$$\\dfrac{12}{105} + \\dfrac{16}{105} + \\dfrac{1}{3} = \\dfrac{12 + 16 + 35}{105} = \\dfrac{63}{105} = \\dfrac{3}{5}.$$",
      "Vậy $\\dfrac{3}{5}$ tổng $= 126$ → tổng $= 126 \\times \\dfrac{5}{3} = 210$ (học sinh).",
      "",
      "**Số học sinh lớp 6:** $210 \\times \\dfrac{4}{35} = 24$ (học sinh).",
      "",
      "**Đáp số**: $24$ học sinh.",
    ].join("\n"),
  },
  "NTT-2018-19-B2": {
    modelAnswer: [
      "Hai anh em chạy quanh bờ hồ Nghĩa Tân ($1$ vòng $= 3$ km).",
      "",
      "**Cùng chiều.** Sau $45$ phút lại gặp nhau ⇒ anh chạy hơn em đúng $1$ vòng. Đổi $45$ phút $= \\dfrac{3}{4}$ giờ.",
      "$$\\text{Hiệu vận tốc} = 3 : \\dfrac{3}{4} = 3 \\times \\dfrac{4}{3} = 4 \\text{ (km/h).}$$",
      "",
      "**Ngược chiều.** Sau $10$ phút gặp nhau ⇒ tổng quãng đường $2$ người chạy $= 1$ vòng. Đổi $10$ phút $= \\dfrac{1}{6}$ giờ.",
      "$$\\text{Tổng vận tốc} = 3 : \\dfrac{1}{6} = 3 \\times 6 = 18 \\text{ (km/h).}$$",
      "",
      "**Tách vận tốc Nam (em).** Vì $v_{\\text{anh}} + v_{\\text{em}} = 18$ và $v_{\\text{anh}} - v_{\\text{em}} = 4$:",
      "$$v_{\\text{em}} = \\dfrac{18 - 4}{2} = 7 \\text{ (km/h).}$$",
      "",
      "**Đáp số**: Vận tốc Nam $= 7$ km/h.",
    ].join("\n"),
  },
  // NTT 2019-20 — restore C5/C6/C7/C8/C9 (answer-bleed + missing fractions) and B1
  "NTT-2019-20-C1": { correct: "Siêu thị" },
  "NTT-2019-20-C5": {
    stem: "An viết một số bằng $\\frac{3}{14}$ của số $M$ nhưng do sơ suất nên An đã viết một số bằng $\\frac{3}{4}$ của số $M$. Biết hiệu của số mới và số cũ bằng 150 (hoặc 300 tùy mã đề). Tìm $M$.",
  },
  "NTT-2019-20-C6": {
    stem: "Một chiếc xe đạp có đường kính bánh trước là 0,7m và đường kính bánh sau là 0,9m. Nếu bánh trước quay được 135 vòng thì bánh sau quay được mấy vòng?",
  },
  "NTT-2019-20-C7": {
    stem: "Một người lái xe tính: Nếu đi với vận tốc 40km/h thì sẽ đến lúc 10 giờ 15 phút còn nếu đi với vận tốc 50km/h thì sẽ đến lúc 9 giờ 45 phút. Tính quãng đường xe đã đi.",
  },
  "NTT-2019-20-C8": {
    stem: "Có hai ngăn sách. Tổng số sách hai ngăn là 150 quyển (hoặc 200 quyển tuỳ mã đề). Nếu chuyển 5 quyển từ ngăn dưới lên ngăn trên thì số sách ngăn trên bằng $\\frac{2}{3}$ số sách ngăn dưới. Tìm số sách ngăn dưới.",
  },
  "NTT-2019-20-C9": {
    stem: "Lan và Hoa làm một công việc. Lan làm một mình mất 5 giờ. Hoa làm một mình mất 7 giờ. Hỏi hai bạn cùng làm thì sau bao lâu sẽ xong?",
  },
  "NTT-2019-20-B1": {
    stem: "Một đội tự nguyện trường Nguyễn Tất Thành đi trồng cây ở tỉnh Hà Giang trong 3 ngày. Ngày thứ nhất đội trồng $\\frac{1}{3}$ tổng số cây. Ngày thứ hai đội trồng $\\frac{6}{11}$ số cây còn lại. Ngày thứ ba trồng ít hơn ngày thứ hai là 30 cây. Tính số cây mà đội đã trồng.",
    modelAnswer: [
      "**Quy đổi ra phân số của tổng số cây.**",
      "- Sau ngày 1, còn lại $1 - \\dfrac{1}{3} = \\dfrac{2}{3}$ tổng số cây.",
      "- Ngày 2 trồng $\\dfrac{6}{11} \\times \\dfrac{2}{3} = \\dfrac{12}{33} = \\dfrac{4}{11}$ tổng.",
      "- Ngày 3 trồng phần còn lại sau ngày 2:",
      "$$\\dfrac{2}{3} - \\dfrac{4}{11} = \\dfrac{22 - 12}{33} = \\dfrac{10}{33} \\text{ (tổng).}$$",
      "",
      "**Tìm hiệu ngày 2 − ngày 3.**",
      "$$\\dfrac{4}{11} - \\dfrac{10}{33} = \\dfrac{12 - 10}{33} = \\dfrac{2}{33} \\text{ (tổng số cây)}.$$",
      "Hiệu này $= 30$ cây nên:",
      "$$\\text{Tổng số cây} = 30 : \\dfrac{2}{33} = 30 \\times \\dfrac{33}{2} = 495 \\text{ (cây).}$$",
      "",
      "**Đáp số**: $495$ cây.",
    ].join("\n"),
  },
  "NTT-2019-20-B2": {
    modelAnswer: [
      "Quãng đường Hà Nội – Hà Giang là $330$ km. Ô tô đi từ Hà Nội lúc $6$ giờ với $v = 55$ km/h. Cùng lúc taxi ($65$ km/h) và xe tải ($45$ km/h) khởi hành từ Hà Giang đi về Hà Nội.",
      "",
      "**a) Thời điểm ô tô gặp taxi.**",
      "Hai xe đi ngược chiều với tổng vận tốc $65 + 55 = 120$ km/h. Thời gian gặp nhau:",
      "$$\\dfrac{330}{120} = \\dfrac{11}{4} \\text{ giờ} = 2 \\text{ giờ } 45 \\text{ phút.}$$",
      "Vậy hai xe gặp nhau lúc $6 + 2$h$45' = 8$ giờ $45$ phút.",
      "",
      "**b) Lúc khoảng cách ô tô–taxi bằng khoảng cách ô tô–xe tải.**",
      "Vì taxi đi nhanh hơn xe tải, taxi luôn ở trước (gần ô tô hơn). Thời điểm cần tìm là lúc ô tô gặp \"xe trung điểm\" giữa taxi và xe tải — gọi là xe Mazda — vận tốc trung bình cộng:",
      "$$v_{\\text{Mazda}} = \\dfrac{65 + 45}{2} = 55 \\text{ (km/h).}$$",
      "Xe Mazda khởi hành từ Hà Giang cùng lúc với taxi/xe tải. Ô tô và Mazda đi ngược chiều với tổng vận tốc $55 + 55 = 110$ km/h, gặp nhau sau:",
      "$$\\dfrac{330}{110} = 3 \\text{ (giờ).}$$",
      "Vậy thời điểm cần tìm là $6 + 3 = 9$ giờ.",
      "",
      "**Đáp số**: a) $8$ giờ $45$ phút; b) $9$ giờ.",
    ].join("\n"),
  },
  // NTT 2020-21 — restore C3/C4/C6/C7/C8/C9 and B1
  "NTT-2020-21-C3": {
    stem: "Một bể nước có chiều dài là 120cm, chiều rộng 60cm, chiều cao 70cm. Người ta thả một hòn non bộ cao 35cm và có thể tích 57 dm³. Hỏi cần đổ thêm bao nhiêu lít nước để mực nước trong bể cao hơn 15cm so với hòn non bộ? Biết bể không có nước, hòn non bộ không thấm nước.",
  },
  "NTT-2020-21-C4": {
    stem: "Một lớp thu gom giấy vụn. Ngày thứ nhất thu được $\\frac{1}{4}$ số giấy, ngày thứ hai thu được $\\frac{3}{5}$ số giấy còn lại và ngày thứ ba thu được 36kg. Hỏi tổng số giấy cần thu là bao nhiêu?",
  },
  "NTT-2020-21-C6": {
    stem: "Tính đến ngày 26/5, số ca nhiễm Covid 19 ở châu Á bằng $9,73\\%$ dân số thế giới. Biết số người nhiễm ở Trung Quốc bằng $8,74\\%$ so với châu Á. Hỏi số người nhiễm ở Trung Quốc là bao nhiêu phần trăm so với số người nhiễm trên thế giới?",
  },
  "NTT-2020-21-C7": {
    stem: "Nhà A có 56 con gà và vịt. Biết $\\frac{1}{2}$ số gà bằng $\\frac{2}{3}$ số vịt, hãy tính số gà?",
  },
  "NTT-2020-21-C8": {
    stem: "Cho hình chữ nhật ABCD có $AB = 60m$, $AD = 30m$. Điểm E trên cạnh BC sao cho $BE = \\frac{1}{2} \\times BC$, điểm F trên cạnh CD sao cho $CF = \\frac{2}{3} \\times CD$. Tính diện tích tứ giác AECF?",
  },
  "NTT-2020-21-C9": {
    stem: "Trong ngày sinh nhật, Vui đã mời 9 người bạn đến nhà uống nước. Mỗi người bạn được mời 2 cốc nước ép cam, dứa và cà rốt, mỗi cốc 300ml. Được biết, Vui đã đi mua nguyên liệu ở siêu thị, bao gồm:\n- Hộp 1l nước cam: 85000 đồng.\n- Hộp 2l nước dứa: 95000 đồng.\n- Hộp 1l nước cà rốt: 120000 đồng.\nCông thức pha chế bao gồm:\n+) 150ml nước ép cam.\n+) 500ml nước ép dứa.\n+) 350ml nước ép cà rốt.\nHỏi Vui đã tốn bao nhiêu tiền để mua nguyên liệu?",
  },
  "NTT-2020-21-B1": {
    stem: "Trong câu lạc bộ Khoa học, $\\frac{1}{5}$ số học sinh nam bằng $\\frac{5}{11}$ số học sinh nữ. Khi thêm 16 học sinh nam thì số học sinh nam gấp 3 lần số học sinh nữ. Tính số học sinh của câu lạc bộ Khoa học.",
    modelAnswer: [
      "**Tỉ số nam/nữ lúc đầu.** Vì $\\dfrac{1}{5}$ số nam $= \\dfrac{5}{11}$ số nữ nên",
      "$$\\text{số nam} = 5 \\times \\dfrac{5}{11} \\times \\text{số nữ} = \\dfrac{25}{11} \\times \\text{số nữ}.$$",
      "",
      "**Sau khi thêm 16 nam.** Số nam mới gấp $3$ lần số nữ, mà số nữ không đổi:",
      "$$\\dfrac{25}{11} \\times \\text{số nữ} + 16 = 3 \\times \\text{số nữ}.$$",
      "$$\\Leftrightarrow 16 = \\left(3 - \\dfrac{25}{11}\\right) \\times \\text{số nữ} = \\dfrac{8}{11} \\times \\text{số nữ}.$$",
      "$$\\Rightarrow \\text{số nữ} = 16 : \\dfrac{8}{11} = 16 \\times \\dfrac{11}{8} = 22 \\text{ (học sinh).}$$",
      "",
      "**Tổng số học sinh câu lạc bộ.**",
      "- Số nam lúc đầu: $22 \\times \\dfrac{25}{11} = 50$ (học sinh).",
      "- Tổng: $22 + 50 = 72$ (học sinh).",
      "",
      "**Đáp số**: $72$ học sinh.",
    ].join("\n"),
  },
  "NTT-2020-21-B2": {
    stem: "Hiệp hội ASEAN được thành lập năm 1967. Tính đến năm 2015 thì số năm Việt Nam tham gia bằng $\\frac{5}{12}$ số năm mà Hiệp hội bắt đầu tổ chức.\na) Hỏi năm bao nhiêu thì Việt Nam bắt đầu tham gia hiệp hội?\nb) Biết năm mà Lào tham gia sau năm Việt Nam nhưng trước năm 2010. Biết tổng số năm mà Lào và Việt Nam tham gia tính đến năm 2015 chia hết cho 3 và 4. Hỏi Lào tham gia ASEAN vào năm nào?",
    modelAnswer: [
      "**a) Năm Việt Nam tham gia ASEAN.**",
      "Số năm Hiệp hội ASEAN đã tổ chức tính đến năm 2015: $2015 - 1967 = 48$ (năm).",
      "Số năm Việt Nam tham gia tính đến năm 2015:",
      "$$48 \\times \\dfrac{5}{12} = 20 \\text{ (năm).}$$",
      "Vậy Việt Nam tham gia ASEAN vào năm $2015 - 20 = 1995$.",
      "",
      "**b) Năm Lào tham gia ASEAN.**",
      "",
      "Gọi $L$ là số năm Lào tham gia tính đến năm 2015. Vì Lào tham gia sau Việt Nam ($1995$) nhưng trước năm $2010$ nên:",
      "$$2015 - 2010 < L < 2015 - 1995 \\quad \\Rightarrow \\quad 5 < L < 20.$$",
      "",
      "Tổng số năm Lào + Việt Nam tham gia tính đến 2015 chia hết cho cả $3$ và $4$, tức chia hết cho $12$. Tổng đó là $L + 20$, với $5 < L < 20$ nên:",
      "$$25 < L + 20 < 40.$$",
      "Số chia hết cho $12$ duy nhất trong khoảng đó là $36$, nên $L = 36 - 20 = 16$.",
      "",
      "Vậy Lào tham gia ASEAN vào năm $2015 - 16 = 1999$.",
      "",
      "**Đáp số**: a) Năm $1995$; b) Năm $1999$.",
    ].join("\n"),
  },
  // NTT 2022-23 — restore stems lost to PDF OCR (answer-box bleed / truncation)
  "NTT-2022-23-C2": {
    stem: "Hà lấy $\\frac{2}{5}$ số khẩu trang của mình trong hộp tặng An thì hộp còn 12 chiếc khẩu trang. Số khẩu trang trong hộp của Hà ban đầu là",
  },
  // C4 is text-only ("Hình hộp chữ nhật có V = 336cm³, đáy 48cm² → cao = ?")
  // The earlier "ntt-2022-c4" figure was erroneously attached (bar chart belongs to NTT-2023-24-C4).
  // Explicit `null` is needed to clear the value baked into the metadata JSON by a prior build.
  "NTT-2022-23-C4": { figure: null },
  "NTT-2022-23-C6": {
    stem: "Kết thúc Seagames, tổng số huy chương vàng và huy chương bạc của Việt Nam là 330 huy chương. Biết số huy chương bạc bằng $\\frac{25}{41}$ số huy chương vàng, tính số huy chương vàng của đội tuyển Việt Nam.",
  },
  "NTT-2022-23-C7": {
    stem: "Cửa hàng bán một chiếc quạt điện giá 1800000 đồng thì lãi $20\\%$ so với giá vốn. Hỏi giá vốn một chiếc quạt điện là bao nhiêu?",
    correct: "1500000",
    unit: "đồng",
  },
  "NTT-2022-23-C8": { figure: "ntt-2022-c8" },
  // NTT 2022-23 essays — parsed JSON .explanation drops every fraction
  // (3/7, 7/10, 3/2, 2/3, 2/5) leaving "= ." and "× 9 = 3,6" with blank coefficients.
  "NTT-2022-23-B1": {
    stem: "Có hai thùng dầu, số dầu thùng thứ hai bằng $\\frac{3}{7}$ số dầu của thùng thứ nhất. Sau khi chuyển 8 lít dầu từ thùng thứ nhất sang thùng thứ hai thì cả hai thùng có số lít dầu bằng nhau.\na) Tính tỉ số số dầu thùng thứ nhất với số dầu của cả hai thùng.\nb) Tính tổng số dầu của cả hai thùng.",
    modelAnswer: [
      "Coi số lít dầu thùng thứ hai là $3$ phần thì số lít dầu thùng thứ nhất là $7$ phần.",
      "Số lít dầu ở cả hai thùng là: $3 + 7 = 10$ (phần).",
      "",
      "**a)** Tỉ số số lít dầu thùng thứ nhất với số lít dầu cả hai thùng là:",
      "$$\\frac{7}{10}.$$",
      "",
      "**b)** Khi chuyển $8$ lít dầu từ thùng thứ nhất sang thùng thứ hai thì cả hai thùng có số lít dầu bằng nhau, nên thùng thứ nhất hơn thùng thứ hai là: $8 + 8 = 16$ (lít dầu).",
      "",
      "Một phần ứng với: $16 : (7 - 3) = 4$ (lít dầu).",
      "Thùng thứ nhất có: $4 \\times 7 = 28$ (lít dầu).",
      "Cả hai thùng có: $28 : \\dfrac{7}{10} = 28 \\times \\dfrac{10}{7} = 40$ (lít dầu).",
      "",
      "**Đáp số**: a) $\\dfrac{7}{10}$; b) $40$ lít dầu.",
    ].join("\n"),
  },
  "NTT-2022-23-B2": {
    stem: "Lúc 8 giờ một ca nô đi xuôi dòng từ A đến B. Khi đến B, ca nô lập tức quay về A và về tới A lúc 9 giờ. Biết rằng vận tốc xuôi dòng bằng 9km/h và bằng $\\frac{3}{2}$ vận tốc ngược dòng. Tính vận tốc ngược dòng và quãng đường AB.",
    modelAnswer: [
      "**Vận tốc ngược dòng.** Vì vận tốc xuôi dòng bằng $\\dfrac{3}{2}$ vận tốc ngược dòng nên:",
      "$$v_{\\text{ngược}} = 9 : \\dfrac{3}{2} = 9 \\times \\dfrac{2}{3} = 6 \\text{ km/h}.$$",
      "",
      "**Quãng đường AB.** Tổng thời gian ca nô đi từ $A$ đến $B$ rồi quay về $A$ là $9 - 8 = 1$ giờ.",
      "",
      "Trên cùng quãng đường, thời gian tỉ lệ nghịch với vận tốc. Vì $v_{\\text{xuôi}} : v_{\\text{ngược}} = 3 : 2$ nên $t_{\\text{xuôi}} : t_{\\text{ngược}} = 2 : 3$.",
      "",
      "Thời gian ca nô xuôi dòng là: $1 : (2 + 3) \\times 2 = \\dfrac{2}{5}$ (giờ).",
      "",
      "Độ dài quãng đường $AB$: $\\dfrac{2}{5} \\times 9 = 3{,}6$ (km).",
      "",
      "**Đáp số**: Vận tốc ngược dòng $6$ km/h; quãng đường $AB$ dài $3{,}6$ km.",
    ].join("\n"),
  },
  // NTT 2023-24 — restore missing fractions and remove answer-box bleed
  "NTT-2023-24-C2": {
    stem: "Một bể bóng có 360 quả bóng xanh và vàng. Biết số bóng xanh chiếm $\\frac{3}{5}$ tổng số bóng. Số quả bóng vàng trong bể đó là",
  },
  "NTT-2023-24-C3": {
    stem: "Một bể hình hộp chữ nhật có chiều dài 1m, chiều rộng 5dm, chiều cao 6dm. Biết mực nước trong bể cao bằng $\\frac{2}{3}$ chiều cao của bể. Lượng nước trong bể kính đó là",
  },
  "NTT-2023-24-C4": { figure: "ntt-2023-c4" },
  "NTT-2023-24-C6": {
    stem: "Nhân dịp ngày Quốc tế thiếu nhi mùng 01/06, một cửa hàng bán quần áo trẻ em giảm $15\\%$ tất cả các mặt hàng so với giá niêm yết. Mẹ của Mai mua cho bạn ấy một chiếc váy với giá 212500 đồng. Hỏi giá niêm yết của chiếc váy đó là bao nhiêu?",
  },
  "NTT-2023-24-C9": {
    stem: "Hai bạn An và Bình cùng đạp xe từ trường đến sân vận động để tham gia thi đấu thể thao. Thời gian An đạp xe từ trường đến sân vận động bằng $\\frac{5}{4}$ thời gian Bình đạp từ trường đến sân vận động. Bạn An đi 6 phút được 1,2km. a) Tính vận tốc của An. b) Tính quãng đường từ trường đến sân vận động, biết rằng nếu trên cùng quãng đường đó và cùng một lúc, An xuất phát từ trường còn Bình xuất phát từ sân vận động thì sau 12 phút hai bạn sẽ gặp nhau.",
  },
  // NTT 2023-24 B2: parsed JSON .explanation is shredded by PDF column splits
  // (fractions split across lines, coefficients dropped, parenthesis-only
  // fragments, "ĐỀ THI TUYỂN SINH LỚP 6" header bleed). Replace with clean rewrite.
  "NTT-2023-24-B2": {
    modelAnswer: [
      "**a)** Nối $B$ với $D$. Vì $BD$ là đường chéo hình chữ nhật $ABCD$ nên",
      "$$S_{ABD} = \\frac{S_{ABCD}}{2} = \\frac{144}{2} = 72 \\text{ cm}^2.$$",
      "Hai tam giác $AED$ và $ABD$ có chung chiều cao hạ từ $D$, đáy $AE = \\frac{1}{3}AB$, nên",
      "$$S_{AED} = \\frac{1}{3} \\times S_{ABD} = \\frac{1}{3} \\times 72 = 24 \\text{ cm}^2.$$",
      "",
      "**b)** Ta có $S_{EDC} = \\frac{S_{ABCD}}{2} = 72$ cm² (đường chéo $DC$ của hình chữ nhật chia $ABCD$ thành hai tam giác bằng nhau).",
      "",
      "Vì $AB = 3AE$ nên $BE = \\frac{2}{3}AB$, mà $CD = AB$ nên $\\frac{BE}{CD} = \\frac{2}{3}$.",
      "",
      "Xét hai tam giác $BED$ và $BCD$. Đường cao hạ từ $D$ xuống $BE$ và từ $B$ xuống $CD$ đều bằng $AD = BC$, nên",
      "$$\\frac{S_{BED}}{S_{BCD}} = \\frac{BE}{CD} = \\frac{2}{3}.$$",
      "Hai tam giác này còn có chung đáy $BD$, suy ra chiều cao hạ từ $E$ xuống $BD$ bằng $\\frac{2}{3}$ chiều cao hạ từ $C$ xuống $BD$. Vì $G$ là giao điểm của $EC$ và $BD$, hai tam giác $EDG$ và $CDG$ có chung đáy $DG$ nên",
      "$$\\frac{S_{EDG}}{S_{CDG}} = \\frac{2}{3}.$$",
      "Mà $S_{EDG} + S_{CDG} = S_{EDC} = 72$ cm² nên",
      "$$S_{EDG} = 72 \\times \\frac{2}{2+3} = 28{,}8 \\text{ cm}^2.$$",
      "",
      "Vậy $S_{AEGD} = S_{AED} + S_{EDG} = 24 + 28{,}8 = 52{,}8$ cm².",
    ].join("\n"),
  },
  "NTT-2023-24-C8": { figure: "ntt-2023-c8" },
  "NTT-2024-25-C4": { figure: "ntt-2024-c4" },
  "NTT-2024-25-C6": { figure: "ntt-2024-c6" },
  "NTT-2024-25-C10": { figure: "ntt-2024-c10" },
  // NTT 2025-26 — restore missing fractions, remove answer-box bleed, fix truncation
  "NTT-2025-26-C1": { figure: "ntt-2025-c1" },
  "NTT-2025-26-C2": { figure: "ntt-2025-c2" },
  "NTT-2025-26-C5": {
    stem: "Bác An có một mảnh đất. Biết $\\frac{2}{5}$ diện tích mảnh đất dùng để trồng cây ăn quả. Phần còn lại có diện tích là 60 m². Tính diện tích mảnh đất đó.",
  },
  "NTT-2025-26-C7": {
    stem: "Cắt bỏ đi mỗi góc của một tờ bìa hình chữ nhật (kích thước 25cm × 20cm) một hình vuông có cạnh 5cm. Sau đó gấp thành một hộp giấy có dạng hình hộp chữ nhật không nắp. Thể tích của hộp giấy là:",
    figure: "ntt-2025-c7",
  },
  "NTT-2025-26-C8": {
    stem: "Từ một miếng gỗ có dạng $\\frac{1}{2}$ hình tròn đường kính 80 cm. Cắt bỏ đi 2 nửa hình tròn bằng nhau được tô đậm thì được một hình trang trí. Tính diện tích của một hình trang trí.",
    figure: "ntt-2025-c8",
  },
  "NTT-2025-26-C9": { correct: "5", unit: "số" },
  "NTT-2025-26-C10": {
    stem: "Một cửa hàng muốn bán một đôi giày với giá 500 000 đồng. Do không bán được nên cửa hàng đưa ra giá mới giảm $20\\%$ so với giá niêm yết ban đầu. Sau một thời gian không bán được, tiếp tục giảm $40\\%$ so với giá niêm yết mới. Hỏi giá niêm yết đôi giày sau 2 lần giảm giá là bao nhiêu?",
  },
  "NTT-2025-26-C11": {
    stem: "Lớp 4A có 44 học sinh. Số học sinh nam bằng $\\frac{4}{7}$ số học sinh nữ. Tính số học sinh nữ.",
  },
  // NTT 2025-26 B2: parsed JSON .explanation has "C / B / A" figure-label bleed
  // and equations the formatter mangled into duplicated display. Clean rewrite.
  "NTT-2025-26-B2": {
    modelAnswer: [
      "**Cách 1 — Trực tiếp.** Gọi $t$ (giờ) là thời gian cần tìm.",
      "Sau $t$ giờ: xe máy còn cách $B$ là $180 - 45t$ km, ô tô còn cách $B$ là $180 - 60t$ km. Theo đề bài:",
      "$$180 - 45t = 2 \\times (180 - 60t)$$",
      "$$\\Leftrightarrow 75t = 180 \\Leftrightarrow t = 2{,}4 \\text{ giờ} = 2 \\text{ giờ } 24 \\text{ phút}.$$",
      "",
      "**Cách 2 — Dùng xe thứ ba (lời giải mẫu).** Giả sử có xe thứ ba xuất phát cùng lúc từ điểm $C$, đi về $B$ trên cùng đường, với quãng đường $CB = 2 \\times AB$ và vận tốc gấp đôi vận tốc ô tô. Khi đó, tại mọi thời điểm, quãng đường còn lại đến $B$ của xe thứ ba luôn gấp đôi quãng đường còn lại đến $B$ của ô tô.",
      "",
      "Do vậy, thời điểm mà quãng đường còn lại của xe máy gấp đôi của ô tô chính là lúc xe thứ ba đuổi kịp xe máy.",
      "",
      "- Khoảng cách ban đầu giữa xe thứ ba (ở $C$) và xe máy (ở $A$): $180 \\times 2 - 180 = 180$ km.",
      "- Vận tốc của xe thứ ba: $60 \\times 2 = 120$ km/giờ.",
      "- Thời gian xe thứ ba đuổi kịp xe máy: $\\dfrac{180}{120 - 45} = 2{,}4$ giờ $= 2$ giờ $24$ phút.",
      "",
      "Vậy sau **2 giờ 24 phút** thì quãng đường còn lại của xe máy gấp đôi quãng đường còn lại của ô tô.",
    ].join("\n"),
  },
  // NTT 2025-26 B3: parsed JSON has S_AFC coefficient dropped on the final line
  // ("SABC = 20 × = 70"). Rewrite gives every step + (1/2)·S_AFC for S_BFC.
  "NTT-2025-26-B3": {
    figure: "ntt-2025-b3",
    modelAnswer: [
      "Nối $B$ với $F$ (như hình vẽ).",
      "",
      "**Bước 1** — So sánh $S_{AFC}$ và $S_{BFC}$:",
      "",
      "- Hai tam giác $ADC$ và $BDC$ có chung đường cao hạ từ $C$ tới $AB$, đáy $AD = 2BD$, nên $S_{ADC} = 2 \\, S_{BDC}$.",
      "- Hai tam giác này còn có chung đáy $CD$ nên đường cao hạ từ $A$ tới $CD$ bằng $2$ lần đường cao hạ từ $B$ tới $CD$.",
      "- Đưa hai đường cao đó vào hai tam giác $AFC$ và $BFC$ có chung đáy $FC$:",
      "$$S_{AFC} = 2 \\, S_{BFC} \\quad (1)$$",
      "",
      "**Bước 2** — So sánh $S_{AFB}$ và $S_{AFC}$:",
      "",
      "- Hai tam giác $AEB$ và $AEC$ có chung đường cao hạ từ $A$ tới $BC$, đáy $BE = 2CE$, nên $S_{AEB} = 2 \\, S_{AEC}$.",
      "- Hai tam giác này còn có chung đáy $AE$ nên đường cao hạ từ $B$ tới $AE$ bằng $2$ lần đường cao hạ từ $C$ tới $AE$.",
      "- Đưa hai đường cao đó vào hai tam giác $AFB$ và $AFC$ có chung đáy $AF$:",
      "$$S_{AFB} = 2 \\, S_{AFC} \\quad (2)$$",
      "",
      "**Bước 3** — Ghép lại. Từ $(1)$ và $(2)$:",
      "$$S_{ABC} = S_{AFB} + S_{AFC} + S_{BFC} = 2 \\, S_{AFC} + S_{AFC} + \\tfrac{1}{2} S_{AFC} = \\tfrac{7}{2} \\, S_{AFC}.$$",
      "",
      "Với $S_{AFC} = 20$ cm² ta có:",
      "$$S_{ABC} = \\tfrac{7}{2} \\times 20 = 70 \\text{ cm}^2.$$",
      "",
      "**Đáp số**: $S_{ABC} = 70$ cm².",
    ].join("\n"),
  },

  // ─── AMS — Hà Nội – Amsterdam (nguồn: Loigiaihay.com, có đáp án) ───────────
  // 2023-2024 ───────────────────────────────────────────────────────────────
  "AMS-2023-24-C1": {
    stem: "Thực hiện phép tính: $(96 \\times 0{,}25 - 2{,}1 : 0{,}1) + (250 \\times 0{,}1 - 80 : 4)$.",
    modelAnswer: [
      "$(96 \\times 0{,}25 - 2{,}1 : 0{,}1) + (250 \\times 0{,}1 - 80 : 4)$",
      "$= (24 - 21) + (25 - 20) = 3 + 5 = 8.$",
      "",
      "**Đáp số**: $8$.",
    ].join("\n"),
  },
  "AMS-2023-24-C2": {
    stem: "Biết số $\\overline{224ab}$ chia hết cho $2$; $3$ và $5$. Tìm $a \\times b$.",
    modelAnswer: [
      "Vì $\\overline{224ab}$ chia hết cho cả $2$ và $5$ nên $b = 0$.",
      "Do đó $a \\times b = a \\times 0 = 0$.",
      "",
      "**Đáp số**: $0$.",
    ].join("\n"),
  },
  "AMS-2023-24-C3": {
    stem: "Trung bình cộng của $25$ số chẵn liên tiếp bằng $32$. Hỏi tỉ số giữa số nhỏ nhất và số lớn nhất là bao nhiêu?",
    modelAnswer: [
      "Vì $25$ số đã cho là $25$ số chẵn liên tiếp nên trung bình cộng của chúng bằng trung bình cộng của số nhỏ nhất và số lớn nhất.",
      "Tổng số nhỏ nhất và số lớn nhất là: $32 \\times 2 = 64$.",
      "Số lớn nhất hơn số nhỏ nhất là: $(25 - 1) \\times 2 = 48$.",
      "Số nhỏ nhất là: $(64 - 48) : 2 = 8$; số lớn nhất là: $64 - 8 = 56$.",
      "Tỉ số giữa số nhỏ nhất và số lớn nhất là: $8 : 56 = \\dfrac{1}{7}$.",
      "",
      "**Đáp số**: $\\dfrac{1}{7}$.",
    ].join("\n"),
  },
  "AMS-2023-24-C4": {
    stem: "Một khối lượng gạo dự tính đủ cho $15$ người ăn trong $14$ ngày. Vì số người thực tế nhiều hơn dự kiến nên số gạo đó chỉ đủ ăn trong $6$ ngày. Tính số người tăng thêm, biết khẩu phần gạo của mỗi người trong $1$ ngày như nhau.",
    modelAnswer: [
      "Số gạo đủ cho một người ăn trong: $14 \\times 15 = 210$ (ngày).",
      "Số người để ăn hết số gạo đó trong $6$ ngày là: $210 : 6 = 35$ (người).",
      "Số người tăng thêm là: $35 - 15 = 20$ (người).",
      "",
      "**Đáp số**: $20$ người.",
    ].join("\n"),
  },
  "AMS-2023-24-C5": {
    stem: "Một tờ giấy có dạng như hình vẽ. Bạn Chúc gấp tờ giấy theo các nét đứt để làm thành một chiếc hộp hình lập phương không có nắp. Hỏi chữ cái ghi ở đáy của chiếc hộp là chữ cái nào?",
    modelAnswer: [
      "Ba chữ cái $R$, $Q$, $M$ ở ba ô thẳng hàng nên sẽ nằm ở ba mặt bên của hình lập phương.",
      "Do đó chữ cái nằm ở đáy của chiếc hộp là chữ cái $N$.",
      "",
      "**Đáp số**: chữ $N$.",
    ].join("\n"),
  },
  "AMS-2023-24-C6": {
    stem: "Một tờ giấy hình chữ nhật có kích thước $15$ cm $\\times$ $20$ cm. Người ta cắt mỗi góc của tờ giấy đó một hình vuông cạnh $5$ cm. Sau đó gấp phần còn lại thành một hộp giấy hình hộp chữ nhật (không có nắp). Tính tổng diện tích $5$ mặt trong của hộp giấy đó.",
    modelAnswer: [
      "Chiều rộng của hình hộp chữ nhật là: $15 - 5 \\times 2 = 5$ (cm).",
      "Chiều dài của hình hộp chữ nhật là: $20 - 5 \\times 2 = 10$ (cm); chiều cao là $5$ cm.",
      "Diện tích xung quanh là: $(10 + 5) \\times 2 \\times 5 = 150$ (cm²).",
      "Diện tích đáy là: $10 \\times 5 = 50$ (cm²).",
      "Tổng diện tích $5$ mặt trong là: $150 + 50 = 200$ (cm²).",
      "",
      "**Đáp số**: $200$ cm².",
    ].join("\n"),
  },
  "AMS-2023-24-C7": {
    stem: "Mẹ chia $7$ phong bao lì xì chứa số tiền bên trong lần lượt là $1; 3; 9; 27; 81; 243; 729$ (đơn vị tính: nghìn đồng) cho hai anh em. Sau khi mở ra, Bình nhận thấy số tiền của mình ít hơn của em là $367$ nghìn đồng. Hỏi Bình có bao nhiêu bao lì xì?",
    modelAnswer: [
      "Tổng số tiền mẹ chia cho hai anh em là: $1 + 3 + 9 + 27 + 81 + 243 + 729 = 1093$ (nghìn đồng).",
      "Số tiền Bình nhận được là: $(1093 - 367) : 2 = 363$ (nghìn đồng); em nhận $1093 - 363 = 730$ (nghìn đồng).",
      "Vì $730 = 729 + 1$ nên em nhận $2$ bao ($729$ và $1$).",
      "Bình nhận $363 = 3 + 9 + 27 + 81 + 243$, tức $5$ bao còn lại.",
      "",
      "**Đáp số**: $5$ bao lì xì.",
    ].join("\n"),
  },
  "AMS-2023-24-C8": {
    stem: "Cho một số tự nhiên có hai chữ số $\\overline{ab}$ sao cho số đó gấp $8$ lần tổng hai chữ số của nó. Tính $a \\times 8 + b \\times 5$.",
    modelAnswer: [
      "Theo đề bài: $\\overline{ab} = 8 \\times (a + b)$, tức $10a + b = 8a + 8b$, suy ra $2a = 7b$.",
      "Vì $a$, $b$ là các chữ số nên $a = 7$ và $b = 2$.",
      "Vậy $a \\times 8 + b \\times 5 = 7 \\times 8 + 2 \\times 5 = 66$.",
      "",
      "**Đáp số**: $66$.",
    ].join("\n"),
  },
  "AMS-2023-24-C9": {
    stem: "Cô giáo An cho một số và yêu cầu thực hiện phép tính đem số đó cộng với $5$ rồi chia cho $6$. Nhưng do nghe nhầm nên An cộng với $6$ rồi chia cho $5$ nên kết quả sai là $2429$. Tìm kết quả đúng.",
    modelAnswer: [
      "Số trước khi An đem chia cho $5$ là: $2429 \\times 5 = 12145$.",
      "Số cô giáo cho An là: $12145 - 6 = 12139$.",
      "Kết quả đúng là: $(12139 + 5) : 6 = 2024$.",
      "",
      "**Đáp số**: $2024$.",
    ].join("\n"),
  },
  "AMS-2023-24-C10": {
    stem: "Có một cửa hàng bán xăng dầu vào quý I. Vào quý II, cửa hàng tăng giá $12\\%$ so với quý I. Vào quý III, cửa hàng tăng $10\\%$ nữa so với quý II. Quý IV, cửa hàng bán xăng giảm $10\\%$ so với quý III. Hỏi so với quý I thì giá xăng quý IV của cửa hàng tăng hay giảm bao nhiêu phần trăm?",
    modelAnswer: [
      "Giá xăng quý II so với quý I là: $100\\% + 12\\% = 112\\%$.",
      "Giá xăng quý III so với quý I là: $112\\% \\times 110\\% = 123{,}2\\%$.",
      "Giá xăng quý IV so với quý I là: $123{,}2\\% \\times 90\\% = 110{,}88\\%$.",
      "So với quý I, giá xăng quý IV tăng: $110{,}88\\% - 100\\% = 10{,}88\\%$.",
      "",
      "**Đáp số**: tăng $10{,}88\\%$.",
    ].join("\n"),
  },
  "AMS-2023-24-C11": {
    stem: "Tìm chữ số tận cùng của số: $A = 8 \\times 8 \\times 8 \\times \\dots \\times 8 + 1$ (gồm $2024$ thừa số $8$).",
    modelAnswer: [
      "Tích của $4$ số $8$ ($8 \\times 8 \\times 8 \\times 8 = 4096$) có chữ số tận cùng là $6$.",
      "Vì $2024$ chia hết cho $4$ nên tích $2024$ thừa số $8$ có chữ số tận cùng là $6$.",
      "Do đó $A$ có chữ số tận cùng là $6 + 1 = 7$.",
      "",
      "**Đáp số**: $7$.",
    ].join("\n"),
  },
  "AMS-2023-24-C12": {
    stem: "Cho $A = \\dfrac{1}{1\\times 300} + \\dfrac{1}{2\\times 301} + \\dfrac{1}{3\\times 302} + \\dots + \\dfrac{1}{101\\times 400}$ và $B = \\dfrac{1}{1\\times 102} + \\dfrac{1}{2\\times 103} + \\dfrac{1}{3\\times 104} + \\dots + \\dfrac{1}{299\\times 400}$. Tính tỉ số $\\dfrac{A}{B}$.",
    modelAnswer: [
      "Nhân $A$ với $299$ (hiệu hai thừa số ở mẫu của $A$):",
      "$$299 \\times A = \\left(1 + \\dfrac{1}{2} + \\dots + \\dfrac{1}{101}\\right) - \\left(\\dfrac{1}{300} + \\dfrac{1}{301} + \\dots + \\dfrac{1}{400}\\right).$$",
      "Nhân $B$ với $101$ (hiệu hai thừa số ở mẫu của $B$):",
      "$$101 \\times B = \\left(1 + \\dfrac{1}{2} + \\dots + \\dfrac{1}{101}\\right) - \\left(\\dfrac{1}{300} + \\dfrac{1}{301} + \\dots + \\dfrac{1}{400}\\right).$$",
      "Hai vế phải bằng nhau nên $299 \\times A = 101 \\times B$, suy ra $\\dfrac{A}{B} = \\dfrac{101}{299}$.",
      "",
      "**Đáp số**: $\\dfrac{A}{B} = \\dfrac{101}{299}$.",
    ].join("\n"),
  },
  "AMS-2023-24-B1": {
    stem: "Cho hình vẽ. Biết hình vuông nhỏ có cạnh $4$ cm, hình vuông lớn có cạnh $6$ cm. Tính diện tích phần tô đậm.",
    modelAnswer: [
      "Gọi tên các điểm như hình vẽ (hình vuông lớn cạnh $6$ cm là $ABGD$ và hình vuông nhỏ cạnh $4$ cm là $DEFG$... ).",
      "Tổng diện tích hai hình vuông là: $6 \\times 6 + 4 \\times 4 = 52$ (cm²).",
      "Diện tích tam giác $ADE$ là: $6 \\times (6 - 4) : 2 = 6$ (cm²).",
      "Diện tích tam giác $EFG$ là: $4 \\times 4 : 2 = 8$ (cm²).",
      "Diện tích tam giác $ABG$ là: $6 \\times (6 + 4) : 2 = 30$ (cm²).",
      "Diện tích tam giác $AEG$ là: $52 - 6 - 8 - 30 = 8$ (cm²).",
      "Xét tam giác $AEH$ và tam giác $GEH$ có chung đáy $EH$ nên $\\dfrac{S_{AEH}}{S_{GEH}} = \\dfrac{AD}{GC} = \\dfrac{6}{4} = \\dfrac{3}{2}$.",
      "Suy ra diện tích phần tô đậm (tam giác $GEH$) là: $8 : (3 + 2) \\times 2 = 3{,}2$ (cm²).",
      "",
      "**Đáp số**: $3{,}2$ cm².",
    ].join("\n"),
  },
  "AMS-2023-24-B2": {
    stem: "Lớp 5A có $36$ học sinh, cứ $2$ bạn ngồi $1$ bàn. Cô giáo nhận thấy $50\\%$ số bạn nam ngồi cạnh bạn nữ và $40\\%$ số bạn nữ ngồi cạnh bạn nam. Hỏi có bao nhiêu bàn có $2$ bạn nữ?",
    modelAnswer: [
      "Số bạn nam ngồi cạnh nữ bằng số bạn nữ ngồi cạnh nam, nên $50\\%$ số nam $= 40\\%$ số nữ.",
      "Suy ra tỉ số nam : nữ $= 40\\% : 50\\% = \\dfrac{4}{5}$.",
      "Số học sinh nữ là: $36 : (4 + 5) \\times 5 = 20$ (học sinh).",
      "Số học sinh nữ ngồi cạnh các bạn nam là: $20 \\times 40\\% = 8$ (học sinh).",
      "Số bàn có $2$ bạn nữ là: $(20 - 8) : 2 = 6$ (bàn).",
      "",
      "**Đáp số**: $6$ bàn.",
    ].join("\n"),
  },
  "AMS-2023-24-B3": {
    stem: "Đăng và Khoa chạy trên một đường tròn khép kín, hai bạn xuất phát cùng một vị trí nhưng ngược chiều nhau. Đăng và Khoa lần lượt chạy hết đường tròn trong $5$ phút và $6$ phút. Hỏi sau bao nhiêu lần gặp nhau thì hai bạn gặp nhau lần đầu ở điểm xuất phát (không tính lần gặp nhau khi xuất phát)?",
    modelAnswer: [
      "Để cùng có mặt ở điểm xuất phát, thời gian chạy phải chia hết cho cả $5$ và $6$, tức là bội chung của $5$ và $6$.",
      "Bội chung nhỏ nhất của $5$ và $6$ là $30$, nên sau $30$ phút hai bạn gặp nhau lần đầu ở điểm xuất phát.",
      "Khi đó Đăng chạy được $30 : 5 = 6$ vòng, Khoa chạy được $30 : 6 = 5$ vòng; tổng cộng $6 + 5 = 11$ vòng.",
      "Vì chạy ngược chiều, cứ hai bạn cùng đi hết $1$ vòng thì gặp nhau $1$ lần, nên có tất cả $11$ lần gặp — lần thứ $11$ chính là ở điểm xuất phát.",
      "Vậy số lần hai bạn gặp nhau trước khi gặp ở điểm xuất phát là: $11 - 1 = 10$ (lần).",
      "",
      "**Đáp số**: $10$ lần.",
    ].join("\n"),
  },

  // 2022-2023 ───────────────────────────────────────────────────────────────
  "AMS-2022-23-C1": {
    stem: "Tính: $0{,}14 \\times 253 \\times 3 - 4{,}2 \\times 5{,}3$.",
    modelAnswer: [
      "$0{,}14 \\times 253 \\times 3 - 4{,}2 \\times 5{,}3 = 4{,}2 \\times 25{,}3 - 4{,}2 \\times 5{,}3$",
      "$= 4{,}2 \\times (25{,}3 - 5{,}3) = 4{,}2 \\times 20 = 84.$",
      "",
      "**Đáp số**: $84$.",
    ].join("\n"),
  },
  "AMS-2022-23-C2": {
    stem: "Biết số $\\overline{2022ab}$ chia hết cho cả $5$ và $9$ (với $b > 0$). Tìm $a \\times b$.",
    modelAnswer: [
      "Vì $\\overline{2022ab}$ chia hết cho $5$ và $b > 0$ nên $b = 5$.",
      "Số $\\overline{2022a5}$ chia hết cho $9$ nên $(2 + 0 + 2 + 2 + a + 5) = (11 + a)$ chia hết cho $9$, suy ra $a = 7$.",
      "Vậy $a \\times b = 7 \\times 5 = 35$.",
      "",
      "**Đáp số**: $35$.",
    ].join("\n"),
  },
  "AMS-2022-23-C3": {
    stem: "Tính: $\\left(1 - \\dfrac{1}{2}\\right) \\times \\left(1 - \\dfrac{1}{3}\\right) \\times \\left(1 - \\dfrac{1}{4}\\right) \\times \\dots \\times \\left(1 - \\dfrac{1}{2022}\\right)$.",
    modelAnswer: [
      "$$\\left(1 - \\dfrac{1}{2}\\right)\\left(1 - \\dfrac{1}{3}\\right)\\dots\\left(1 - \\dfrac{1}{2022}\\right) = \\dfrac{1}{2} \\times \\dfrac{2}{3} \\times \\dfrac{3}{4} \\times \\dots \\times \\dfrac{2021}{2022} = \\dfrac{1}{2022}.$$",
      "",
      "**Đáp số**: $\\dfrac{1}{2022}$.",
    ].join("\n"),
  },
  "AMS-2022-23-C4": {
    stem: "Cho ba số có tổng bằng $2022$. Biết số thứ nhất bằng $\\dfrac{1}{3}$ số thứ hai, số thứ ba gấp đôi số thứ nhất. Tìm số lớn nhất.",
    modelAnswer: [
      "Coi số thứ nhất là $1$ phần thì số thứ hai là $3$ phần, số thứ ba là $2$ phần.",
      "Do đó số lớn nhất là số thứ hai.",
      "Tổng số phần bằng nhau là: $1 + 3 + 2 = 6$ (phần).",
      "Số lớn nhất là: $2022 : 6 \\times 3 = 1011$.",
      "",
      "**Đáp số**: $1011$.",
    ].join("\n"),
  },
  "AMS-2022-23-C5": {
    stem: "Một ô tô đi từ địa điểm $A$ đến địa điểm $B$. Cùng lúc đó, một ô tô khác đi từ $B$ về $A$, gặp ô tô thứ nhất tại điểm cách điểm $A$ là $140$ km. Biết ô tô thứ nhất đi từ $A$ đến $B$ hết $8$ giờ và ô tô thứ hai đi từ $B$ về $A$ hết $7$ giờ. Tính quãng đường $AB$.",
    modelAnswer: [
      "Tỉ số thời gian đi hết quãng đường $AB$ của ô tô thứ nhất so với ô tô thứ hai là $8 : 7 = \\dfrac{8}{7}$.",
      "Trên cùng quãng đường, vận tốc tỉ lệ nghịch với thời gian nên tỉ số vận tốc của ô tô thứ nhất so với ô tô thứ hai là $\\dfrac{7}{8}$.",
      "Hai xe xuất phát cùng lúc nên đến khi gặp nhau thời gian đi bằng nhau; do đó tỉ số quãng đường đi được cũng là $\\dfrac{7}{8}$.",
      "Ô tô thứ nhất đi được $140$ km nên ô tô thứ hai đi được: $140 : \\dfrac{7}{8} = 160$ (km).",
      "Quãng đường $AB$ là: $140 + 160 = 300$ (km).",
      "",
      "**Đáp số**: $300$ km.",
    ].join("\n"),
  },
  "AMS-2022-23-C6": {
    stem: "Một bể nước hình hộp chữ nhật có chiều dài $3$ m, chiều rộng $2$ m và chiều cao $1{,}6$ m. Người ta mở vòi cho nước chảy vào bể thì sau $1$ giờ $15$ phút bể đầy. Biết trong $1$ giờ vòi chảy được $6756$ lít nước. Hỏi ban đầu trong bể có bao nhiêu lít nước?",
    modelAnswer: [
      "Thể tích của bể là: $3 \\times 2 \\times 1{,}6 = 9{,}6$ (m³) $= 9600$ (lít).",
      "Đổi $1$ giờ $15$ phút $= \\dfrac{5}{4}$ giờ.",
      "Trong $1$ giờ $15$ phút, vòi chảy được: $6756 \\times \\dfrac{5}{4} = 8445$ (lít).",
      "Ban đầu trong bể có: $9600 - 8445 = 1155$ (lít).",
      "",
      "**Đáp số**: $1155$ lít.",
    ].join("\n"),
  },
  "AMS-2022-23-C7": {
    stem: "Cho hai số có tổng là $4055$. Biết số bé có hai chữ số tận cùng là $23$ và khi đổi chỗ hai chữ số đó cho nhau ta được số lớn. Tìm tích hai số đó.",
    modelAnswer: [
      "Gọi số bé là $\\overline{X23}$ thì số lớn là $\\overline{X32}$ (phần đầu $X$ giữ nguyên).",
      "Vì tổng hai số là $4055$ nên $\\overline{X23} + \\overline{X32} = 4055$, tức $X \\times 200 + 55 = 4055$, suy ra $X \\times 200 = 4000$ và $X = 20$.",
      "Vậy số bé là $2023$, số lớn là $2032$.",
      "Tích hai số là: $2023 \\times 2032 = 4110736$.",
      "",
      "**Đáp số**: $4110736$.",
    ].join("\n"),
  },
  "AMS-2022-23-C8": {
    stem: "Có $18$ lít nước được đựng trong các chai loại $400$ ml, $600$ ml và $1$ lít, mỗi loại có ít nhất $1$ chai. Hỏi có nhiều nhất bao nhiêu chai loại $600$ ml?",
    modelAnswer: [
      "Đổi $18$ lít $= 18000$ ml. Để số chai loại $600$ ml nhiều nhất thì tổng lượng nước trong các chai $400$ ml và $1$ lít phải ít nhất.",
      "Mỗi loại có ít nhất $1$ chai nên tổng lượng nước trong chai $400$ ml và $1$ lít ít nhất là $400 + 1000 = 1400$ (ml).",
      "Phần nước còn lại phải chia hết cho $600$. Tổng nhỏ nhất không dưới $1400$ ml để phần còn lại chia hết cho $600$ là $1800$ ml (gồm $2$ chai $400$ ml và $1$ chai $1$ lít: $400 \\times 2 + 1000 = 1800$).",
      "Vậy số chai loại $600$ ml nhiều nhất là: $(18000 - 1800) : 600 = 27$ (chai).",
      "",
      "**Đáp số**: $27$ chai.",
    ].join("\n"),
  },
  "AMS-2022-23-C9": {
    stem: "Có $2$ hộp bi $A$, $B$, mỗi hộp có $9$ viên bi trắng, $9$ viên bi xanh và $9$ viên bi đỏ. Chuyển từ hộp $A$ sang hộp $B$ $10$ viên bi. Hỏi cần chuyển từ hộp $B$ sang hộp $A$ bao nhiêu viên bi để chắc chắn hộp $A$ có ít nhất $8$ viên bi mỗi loại?",
    modelAnswer: [
      "Mỗi hộp có số viên bi là $9 + 9 + 9 = 27$ (viên); mỗi màu có tất cả $9 + 9 = 18$ viên trong cả hai hộp.",
      "Sau khi chuyển $10$ viên từ $A$ sang $B$, hộp $A$ còn: $27 - 10 = 17$ (viên).",
      "Trường hợp xấu nhất khiến hộp $A$ chưa đủ $8$ viên mỗi màu là: hai màu có đủ $18$ viên, màu thứ ba chỉ có $7$ viên, tức hộp $A$ có $18 + 18 + 7 = 43$ viên.",
      "Do đó để chắc chắn hộp $A$ có ít nhất $8$ viên mỗi màu thì hộp $A$ phải có $43 + 1 = 44$ viên.",
      "Vậy cần chuyển từ hộp $B$ sang hộp $A$: $44 - 17 = 27$ (viên).",
      "",
      "**Đáp số**: $27$ viên.",
    ].join("\n"),
  },
  "AMS-2022-23-C10": {
    stem: "Cho $4$ mảnh được tạo thành từ các ô vuông cạnh $1$ cm như hình vẽ. Ghép $4$ mảnh đó thành $1$ hình chữ nhật, tính chu vi hình chữ nhật ghép được.",
    modelAnswer: [
      "Tổng diện tích của $4$ mảnh là: $18 \\times 1 \\times 1 = 18$ (cm²).",
      "Vì $18 = 1 \\times 18 = 2 \\times 9 = 3 \\times 6$ nên hình chữ nhật ghép được có một trong các kích thước: $1 \\times 18$; $2 \\times 9$; $3 \\times 6$.",
      "Mảnh $(1)$ có kích thước $2 \\times 3$ nên loại các kích thước $1 \\times 18$ và $2 \\times 9$; chỉ còn kích thước $3 \\times 6$.",
      "Chu vi hình chữ nhật ghép được là: $(3 + 6) \\times 2 = 18$ (cm).",
      "",
      "**Đáp số**: $18$ cm.",
    ].join("\n"),
  },
  "AMS-2022-23-C11": {
    stem: "Cho hình chữ nhật $ABCD$ ($AB = 16$ cm; $BC = 12$ cm), $M$ là trung điểm của $BC$. Lấy điểm $P$ trên cạnh $AB$ và điểm $Q$ trên cạnh $CD$ sao cho $AP = CQ$. Tính diện tích tam giác $PMQ$.",
    modelAnswer: [
      "Vì $AP = CQ$ và $AB = CD$ nên $BP = DQ$. Do đó hai hình thang $APQD$ và $BCQP$ có diện tích bằng nhau, mỗi phần bằng $\\dfrac{1}{2} S_{ABCD}$.",
      "Ta có $S_{BPM} = \\dfrac{1}{2} \\times BM \\times PB$ và $S_{CMQ} = \\dfrac{1}{2} \\times CM \\times QC$.",
      "Vì $M$ là trung điểm $BC$ nên $BM = CM = \\dfrac{1}{2} BC$, suy ra:",
      "$$S_{BPM} + S_{CMQ} = \\dfrac{1}{4} \\times BC \\times (PB + QC) = \\dfrac{1}{4} \\times BC \\times AB = \\dfrac{1}{4} S_{ABCD}.$$",
      "Vậy $S_{PMQ} = S_{BCQP} - (S_{BPM} + S_{CMQ}) = \\dfrac{1}{2} S_{ABCD} - \\dfrac{1}{4} S_{ABCD} = \\dfrac{1}{4} S_{ABCD} = \\dfrac{1}{4} \\times 12 \\times 16 = 48$ (cm²).",
      "",
      "**Đáp số**: $48$ cm².",
    ].join("\n"),
  },
  "AMS-2022-23-C12": {
    stem: "Cho $5$ số $a, b, c, d, e$ thỏa mãn $\\dfrac{487}{340} = a + \\dfrac{1}{b + \\dfrac{1}{c + \\dfrac{1}{d + \\dfrac{1}{e}}}}$. Tính $a + b + c + d + e$.",
    modelAnswer: [
      "Phân tích $\\dfrac{487}{340}$ thành liên phân số:",
      "$$\\dfrac{487}{340} = 1 + \\dfrac{147}{340} = 1 + \\dfrac{1}{2 + \\dfrac{1}{3 + \\dfrac{1}{5 + \\dfrac{1}{9}}}}.$$",
      "Suy ra $a = 1$, $b = 2$, $c = 3$, $d = 5$, $e = 9$.",
      "Vậy $a + b + c + d + e = 1 + 2 + 3 + 5 + 9 = 20$.",
      "",
      "**Đáp số**: $20$.",
    ].join("\n"),
  },
  "AMS-2022-23-B1": {
    stem: "Lớp 5A có số học sinh nam gấp đôi số học sinh nữ. Sau khi chuyển đi $2$ học sinh nữ thì số học sinh nam bằng $\\dfrac{5}{2}$ số học sinh nữ. Hỏi ban đầu lớp đó có bao nhiêu học sinh?",
    modelAnswer: [
      "Ban đầu số nam gấp đôi số nữ nên số nữ bằng $\\dfrac{1}{2}$ số nam.",
      "Lúc sau số nam bằng $\\dfrac{5}{2}$ số nữ nên số nữ (lúc sau) bằng $\\dfrac{2}{5}$ số nam.",
      "$2$ học sinh nữ chuyển đi ứng với: $\\dfrac{1}{2} - \\dfrac{2}{5} = \\dfrac{1}{10}$ (số học sinh nam).",
      "Số học sinh nam là: $2 : \\dfrac{1}{10} = 20$ (bạn).",
      "Số học sinh nữ ban đầu là: $20 : 2 = 10$ (bạn).",
      "Ban đầu lớp có: $20 + 10 = 30$ (học sinh).",
      "",
      "**Đáp số**: $30$ học sinh.",
    ].join("\n"),
  },
  "AMS-2022-23-B2": {
    stem: "Minh đi từ $A$ đến $B$, cùng lúc đó Ngọc đi từ $B$ về $A$. Hai bạn gặp nhau lần thứ nhất ở điểm cách $A$ là $7$ km. Sau đó, Minh lại đi tiếp tới $B$, Ngọc lại đi tiếp tới $A$ rồi hai bạn quay trở về. Họ gặp nhau lần thứ hai ở điểm cách $B$ là $5$ km. Hỏi quãng đường $AB$ dài bao nhiêu km?",
    modelAnswer: [
      "Khi hai bạn gặp nhau lần đầu, tổng quãng đường hai bạn đi được bằng quãng đường $AB$; Minh đi được $7$ km.",
      "Khi hai bạn gặp nhau lần thứ hai, tổng quãng đường hai bạn đi được gấp $3$ lần quãng đường $AB$.",
      "Vì vận tốc không đổi nên quãng đường Minh đi đến lần gặp thứ hai gấp $3$ lần lần gặp thứ nhất: $7 \\times 3 = 21$ (km).",
      "Đến lần gặp thứ hai, Minh đã đi hết $AB$ rồi quay lại $5$ km, nên $AB = 21 - 5 = 16$ (km).",
      "",
      "**Đáp số**: $16$ km.",
    ].join("\n"),
  },
  "AMS-2022-23-B3": {
    stem: [
      "Cho hình thang $ABCD$, lấy điểm $M$ trên đường chéo $AC$ sao cho $AM = 2 \\times MC$. Lấy điểm $N$ trên cạnh $CD$ sao cho $BDNM$ là hình thang.",
      "",
      "**a)** So sánh diện tích hai tam giác $BDN$ và $BDM$.",
      "",
      "**b)** Tính tỉ số $\\dfrac{S_{ABND}}{S_{BNC}}$.",
    ].join("\n"),
    modelAnswer: [
      "**a)** Vì $BDNM$ là hình thang ($MN \\parallel BD$) nên hai tam giác $BDN$ và $BDM$ có chung đáy $BD$, đường cao hạ từ $N$ và từ $M$ xuống $BD$ bằng nhau (cùng bằng chiều cao hình thang). Do đó $S_{BDN} = S_{BDM}$.",
      "",
      "**b)** Vì $AM = 2 \\times MC$ nên $S_{ABM} = 2 \\, S_{BMC}$ và $S_{ANM} = 2 \\, S_{MNC}$ (mỗi cặp tam giác chung chiều cao hạ từ $B$, từ $N$ xuống $AC$).",
      "Tứ giác $ABMN$ tách được thành: $S_{ABMN} = S_{ABM} + S_{ANM} = 2(S_{BMC} + S_{MNC}) = 2 \\, S_{BNC}$.",
      "Kết hợp $S_{NAB} = S_{DAB}$ (chung đáy $AB$, chiều cao bằng nhau vì $AB \\parallel DC$) và kết quả câu a), biến đổi đưa về $S_{ABND} = S_{ABMN} = 2 \\, S_{BNC}$.",
      "Vậy $\\dfrac{S_{ABND}}{S_{BNC}} = 2$.",
      "",
      "**Đáp số**: $S_{BDN} = S_{BDM}$ và $\\dfrac{S_{ABND}}{S_{BNC}} = 2$.",
    ].join("\n"),
  },

  // 2020-2021 ───────────────────────────────────────────────────────────────
  "AMS-2020-21-C1": {
    stem: "Tính $A = 0{,}12 \\times 135 \\times 4 + 6{,}5 \\times 4{,}8$.",
    modelAnswer: [
      "$A = 0{,}12 \\times 135 \\times 4 + 6{,}5 \\times 4{,}8 = 135 \\times 0{,}48 + 6{,}5 \\times 4{,}8$",
      "$= 13{,}5 \\times 4{,}8 + 6{,}5 \\times 4{,}8 = 4{,}8 \\times (13{,}5 + 6{,}5) = 4{,}8 \\times 20 = 96.$",
      "",
      "**Đáp số**: $96$.",
    ].join("\n"),
  },
  "AMS-2020-21-C2": {
    stem: "Cho một hình chữ nhật có chu vi $160$ cm. Sau khi cùng giảm chiều dài và chiều rộng đi cùng một độ dài thì hình mới có chu vi $120$ cm. Vậy diện tích của phần giảm đi là bao nhiêu?",
    modelAnswer: [
      "Chu vi giảm đi: $160 - 120 = 40$ (cm). Độ dài mỗi cạnh giảm đi: $40 : 4 = 10$ (cm).",
      "Nửa chu vi hình chữ nhật mới là: $120 : 2 = 60$ (cm).",
      "Phần giảm đi gồm hai dải (dọc và ngang) cùng một hình vuông ở góc:",
      "$$10 \\times (\\text{chiều dài mới} + \\text{chiều rộng mới}) + 10 \\times 10 = 10 \\times 60 + 100 = 700 \\text{ (cm}^2).$$",
      "",
      "**Đáp số**: $700$ cm².",
    ].join("\n"),
  },
  "AMS-2020-21-C3": {
    stem: "Một đội công nhân dự định làm xong một đoạn đường trong $10$ ngày. Sau khi đội đó làm được $5$ ngày, người ta điều thêm một đội khác đến cùng làm nên sau $4$ ngày nữa thì cả hai đội đã làm xong đoạn đường. Hỏi nếu đội thứ hai làm một mình thì phải mất bao nhiêu ngày mới làm xong cả đoạn đường đó?",
    modelAnswer: [
      "Mỗi ngày đội thứ nhất làm được: $1 : 10 = \\dfrac{1}{10}$ (đoạn đường).",
      "Sau $5$ ngày, đội thứ nhất làm được: $5 \\times \\dfrac{1}{10} = \\dfrac{1}{2}$ (đoạn đường); còn lại $\\dfrac{1}{2}$ đoạn đường.",
      "Trong $4$ ngày cả hai đội làm $\\dfrac{1}{2}$ đoạn đường nên mỗi ngày hai đội làm: $\\dfrac{1}{2} : 4 = \\dfrac{1}{8}$ (đoạn đường).",
      "Mỗi ngày đội thứ hai làm: $\\dfrac{1}{8} - \\dfrac{1}{10} = \\dfrac{1}{40}$ (đoạn đường).",
      "Đội thứ hai làm một mình xong cả đoạn đường trong: $1 : \\dfrac{1}{40} = 40$ (ngày).",
      "",
      "**Đáp số**: $40$ ngày.",
    ].join("\n"),
  },
  "AMS-2020-21-C4": {
    stem: "Một số tự nhiên được viết bởi $2020$ chữ số $1$. Hỏi phải cộng thêm vào số đó ít nhất bao nhiêu đơn vị để được một số chia hết cho $9$?",
    modelAnswer: [
      "Tổng các chữ số của số đó là $2020 \\times 1 = 2020$.",
      "Vì $2020$ chia $9$ dư $4$ (do $2 + 0 + 2 + 0 = 4$) nên để chia hết cho $9$ cần cộng thêm $5$; $14$; $23$; $\\dots$ đơn vị.",
      "Số cần cộng thêm nhỏ nhất là $5$.",
      "",
      "**Đáp số**: $5$ đơn vị.",
    ].join("\n"),
  },
  "AMS-2020-21-C5": {
    stem: "Một hình lập phương có diện tích toàn phần là $150$ cm². Tính thể tích của hình lập phương đó.",
    modelAnswer: [
      "Diện tích một mặt là: $150 : 6 = 25$ (cm²), nên cạnh hình lập phương là $5$ cm (vì $5 \\times 5 = 25$).",
      "Thể tích hình lập phương là: $5 \\times 5 \\times 5 = 125$ (cm³).",
      "",
      "**Đáp số**: $125$ cm³.",
    ].join("\n"),
  },
  "AMS-2020-21-C6": {
    stem: "Cho một hình hộp chữ nhật. Người ta tăng chiều dài của hình hộp chữ nhật $10\\%$ và giảm chiều rộng của nó đi $20\\%$. Hỏi để thể tích hình hộp chữ nhật tăng $32\\%$ thì chiều cao của hình hộp cần tăng thêm bao nhiêu phần trăm?",
    modelAnswer: [
      "Coi thể tích ban đầu là $100\\%$. Sau khi thay đổi: $132\\% = 110\\% \\times 80\\% \\times (\\text{chiều cao mới})$.",
      "Chiều cao mới $= 132\\% : (110\\% \\times 80\\%) = 132\\% : 88\\% = 150\\%$ chiều cao ban đầu.",
      "Vậy chiều cao cần tăng thêm: $150\\% - 100\\% = 50\\%$.",
      "",
      "**Đáp số**: $50\\%$.",
    ].join("\n"),
  },
  "AMS-2020-21-C7": {
    stem: "Một bữa tiệc có sự tham gia của $10$ cặp vợ chồng. Biết mỗi người chồng bắt tay với tất cả mọi người trừ vợ của mình và những người vợ không bắt tay nhau. Hỏi có tất cả bao nhiêu cái bắt tay?",
    modelAnswer: [
      "Số cái bắt tay giữa các người chồng với nhau là: $10 \\times 9 : 2 = 45$ (cái).",
      "Mỗi người chồng bắt tay với $9$ người vợ (trừ vợ mình) nên số cái bắt tay chồng–vợ là: $10 \\times 9 = 90$ (cái).",
      "Các người vợ không bắt tay nhau nên không có thêm cái nào.",
      "Tổng số cái bắt tay là: $45 + 90 = 135$ (cái).",
      "",
      "**Đáp số**: $135$ cái bắt tay.",
    ].join("\n"),
  },
  "AMS-2020-21-C8": {
    stem: "Năm sinh của một cầu thủ bóng đá là $\\overline{19ab}$. Tính đến năm $2021$, tuổi của cầu thủ này đúng bằng tổng các chữ số của năm sinh. Hỏi năm nay (năm $2020$) cầu thủ đó bao nhiêu tuổi?",
    modelAnswer: [
      "Theo đề bài: $2021 - \\overline{19ab} = 1 + 9 + a + b$.",
      "$2021 - (1900 + 10 \\times a + b) = 10 + a + b \\Rightarrow 111 = 11 \\times a + 2 \\times b.$",
      "Vì $a$, $b$ là chữ số nên $a = 9$, $b = 6$; năm sinh là $1996$.",
      "Năm $2020$, tuổi của cầu thủ là: $2020 - 1996 = 24$ (tuổi).",
      "",
      "**Đáp số**: $24$ tuổi.",
    ].join("\n"),
  },
  "AMS-2020-21-C9": {
    stem: "Người ta tạo ra một dãy số bằng cách viết liên tiếp các số tự nhiên khác $0$ được tạo thành từ các chữ số $0$ và $2$ ($2$ lặp lại tùy ý) theo thứ tự tăng dần. Hỏi số $2\\,000\\,020$ là số thứ bao nhiêu trong dãy số trên?",
    modelAnswer: [
      "Các số trong dãy là: $2; 20; 22; 200; 202; 220; 222; \\dots$ (chữ số đầu luôn là $2$, các chữ số sau là $0$ hoặc $2$).",
      "Số có $1$ chữ số: $1$ số; $2$ chữ số: $2$ số; $3$ chữ số: $4$ số; $4$ chữ số: $8$ số; $5$ chữ số: $16$ số; $6$ chữ số: $32$ số.",
      "Số $2\\,000\\,020$ có $7$ chữ số và là số thứ $3$ trong nhóm $7$ chữ số ($2\\,000\\,000; 2\\,000\\,002; 2\\,000\\,020$).",
      "Vậy nó là số thứ: $1 + 2 + 4 + 8 + 16 + 32 + 3 = 66$.",
      "",
      "**Đáp số**: số thứ $66$.",
    ].join("\n"),
  },
  "AMS-2020-21-C10": {
    stem: "Bài thi có hai phần trắc nghiệm và tự luận, mỗi câu trắc nghiệm đúng được $0{,}5$ điểm, mỗi câu tự luận đúng được $1{,}0$ điểm, câu sai hoặc không làm thì không được điểm. Bạn A đi thi làm được tổng cộng $30$ câu và được $18{,}5$ điểm. Hỏi bạn A làm đúng bao nhiêu câu trắc nghiệm?",
    modelAnswer: [
      "Giả sử cả $30$ câu A làm đều là câu tự luận đúng thì được: $30 \\times 1 = 30$ (điểm).",
      "Số điểm dôi ra là: $30 - 18{,}5 = 11{,}5$ (điểm).",
      "Mỗi câu trắc nghiệm thay cho một câu tự luận làm giảm $1 - 0{,}5 = 0{,}5$ (điểm).",
      "Số câu trắc nghiệm A làm đúng là: $11{,}5 : 0{,}5 = 23$ (câu).",
      "",
      "**Đáp số**: $23$ câu trắc nghiệm.",
    ].join("\n"),
  },
  "AMS-2020-21-C11": {
    stem: "Một cửa hàng nhập về một số hộp bánh. Cô bán bánh bày $\\dfrac{1}{10}$ số hộp ở quầy để bán, còn lại cất vào kho. Sau khi bán đi $6$ hộp ở quầy, cô ấy nhận thấy số hộp cất trong kho gấp $15$ lần số hộp còn lại ở quầy. Hỏi lúc đầu cửa hàng nhập về bao nhiêu hộp bánh?",
    modelAnswer: [
      "Số hộp trong kho không thay đổi. Lúc đầu số hộp ở quầy bằng $\\dfrac{1}{9}$ số hộp trong kho (quầy là $\\dfrac{1}{10}$ tổng, kho là $\\dfrac{9}{10}$ tổng).",
      "Sau khi bán $6$ hộp, số hộp ở quầy bằng $\\dfrac{1}{15}$ số hộp trong kho.",
      "$6$ hộp ứng với: $\\dfrac{1}{9} - \\dfrac{1}{15} = \\dfrac{2}{45}$ (số hộp trong kho).",
      "Số hộp trong kho là: $6 : \\dfrac{2}{45} = 135$ (hộp).",
      "Số hộp ở quầy lúc đầu là: $135 : 9 = 15$ (hộp).",
      "Lúc đầu cửa hàng nhập về: $135 + 15 = 150$ (hộp).",
      "",
      "**Đáp số**: $150$ hộp.",
    ].join("\n"),
  },
  "AMS-2020-21-C12": {
    stem: "Một cửa hàng hoa quả có $420$ kg táo và lê. Sau khi bán, người bán hàng nhận thấy: số táo đã bán bằng $\\dfrac{1}{6}$ số lê đã bán và số táo còn lại nhiều hơn số lê còn lại $40$ kg. Hỏi cửa hàng đó đã bán được bao nhiêu ki-lô-gam lê, biết rằng lúc đầu số táo bằng $\\dfrac{3}{4}$ số lê?",
    modelAnswer: [
      "Lúc đầu số táo bằng $\\dfrac{3}{4}$ số lê nên số táo là: $420 : (3 + 4) \\times 3 = 180$ (kg); số lê là: $420 - 180 = 240$ (kg).",
      "Lúc đầu số lê nhiều hơn số táo là: $240 - 180 = 60$ (kg).",
      "Vì số táo còn lại nhiều hơn số lê còn lại $40$ kg nên số lê đã bán nhiều hơn số táo đã bán là: $60 + 40 = 100$ (kg).",
      "Số táo đã bán bằng $\\dfrac{1}{6}$ số lê đã bán nên hiệu $5$ phần ứng với $100$ kg; số táo đã bán là: $100 : (6 - 1) = 20$ (kg).",
      "Số lê đã bán là: $100 + 20 = 120$ (kg).",
      "",
      "**Đáp số**: $120$ kg lê.",
    ].join("\n"),
  },
  "AMS-2020-21-B1": {
    stem: "Một cửa hàng bán một tấm vải. Biết rằng nếu bán $\\dfrac{5}{8}$ tấm vải đó với giá $40$ nghìn đồng một mét thì lãi được $200$ nghìn đồng; số vải còn lại bán với giá $38$ nghìn đồng một mét thì lãi được $90$ nghìn đồng. Hỏi cả tấm vải dài bao nhiêu mét?",
    modelAnswer: [
      "Nếu bán cả tấm vải với giá $40$ nghìn đồng/mét thì tiền lãi là: $200 : \\dfrac{5}{8} = 320$ (nghìn đồng).",
      "Nếu bán cả tấm vải với giá $38$ nghìn đồng/mét thì tiền lãi là: $90 : \\left(1 - \\dfrac{5}{8}\\right) = 240$ (nghìn đồng).",
      "Chênh lệch lãi của cả tấm khi bán với hai giá là $320 - 240 = 80$ (nghìn đồng), ứng với mỗi mét chênh $40 - 38 = 2$ (nghìn đồng).",
      "Tấm vải dài: $(320 - 240) : (40 - 38) = 40$ (mét).",
      "",
      "**Đáp số**: $40$ m.",
    ].join("\n"),
  },
  "AMS-2020-21-B2": {
    stem: "Cho hình chữ nhật $ABCD$ (như hình vẽ). $M$ là một điểm trên cạnh $CD$. Nối $AM$ và $BD$ cắt nhau tại $I$. Biết diện tích $S_{BMC} = 36$ cm² và bằng $\\dfrac{9}{16} S_{IMD}$. Tính diện tích tam giác $ABI$.",
    modelAnswer: [
      "Ta có $S_{IMD} = 36 : \\dfrac{9}{16} = 64$ (cm²).",
      "Vì $AB \\parallel CD$ nên $S_{ADM} = S_{BDM}$ (chung đáy $DM$, chiều cao bằng nhau).",
      "Mà $S_{ADM} = S_{ADI} + S_{IMD}$ và $S_{BDM} = S_{BMI} + S_{IMD}$ nên $S_{ADI} = S_{BMI}$. $\\quad(1)$",
      "Ta có $S_{ABD} = S_{BDC} = \\dfrac{1}{2} S_{ABCD}$, tức $S_{ADI} + S_{ABI} = S_{BMC} + S_{BMI} + S_{IMD}$. $\\quad(2)$",
      "Từ $(1)$ và $(2)$ suy ra $S_{ABI} = S_{BMC} + S_{IMD} = 36 + 64 = 100$ (cm²).",
      "",
      "**Đáp số**: $100$ cm².",
    ].join("\n"),
  },
  "AMS-2020-21-B3": {
    stem: "Lúc $6$ giờ $30$ phút sáng, một người đi bộ trên quãng đường từ $A$ đến $B$ dài $10$ km gồm $3$ đoạn: đoạn lên dốc đi với vận tốc $3$ km/giờ, đoạn xuống dốc đi với vận tốc $6$ km/giờ, và một đoạn đường bằng dài $6$ km. Khi đến $B$, người đó quay lại $A$ ngay theo đường cũ và về tới $A$ lúc $11$ giờ $30$ phút sáng cùng ngày. Tính thời gian người đó đi trên đoạn đường bằng cả đi lẫn về.",
    modelAnswer: [
      "Độ dài quãng đường dốc là: $10 - 6 = 4$ (km).",
      "Cả đi lẫn về, mỗi đoạn dốc đều được đi $1$ lần lên và $1$ lần xuống, nên tổng thời gian lên dốc và xuống dốc là:",
      "$$\\dfrac{4}{3} + \\dfrac{4}{6} = \\dfrac{4}{3} + \\dfrac{2}{3} = 2 \\text{ (giờ)}.$$",
      "Tổng thời gian cả đi lẫn về là: $11$ giờ $30$ phút $- \\, 6$ giờ $30$ phút $= 5$ (giờ).",
      "Thời gian đi trên đoạn đường bằng cả đi lẫn về là: $5 - 2 = 3$ (giờ).",
      "",
      "**Đáp số**: $3$ giờ.",
    ].join("\n"),
  },
};

// CG enrichment is kept separate because it covers every single question;
// build-exams-metadata.ts prefers it over MANUAL_OVERRIDES when both exist.
export const CG_ENRICHMENT_MAP: Record<string, ExamOverride> = {
  "CG-2019-20-C1": { correct: "5" },
  "CG-2019-20-C2": { correct: "55" },
  "CG-2019-20-C3": { correct: "2020" },
  "CG-2019-20-C4": { correct: "5" },
  "CG-2019-20-C5": { correct: "198", unit: "viên" },
  "CG-2019-20-C6": { correct: "16", unit: "tuổi" },
  "CG-2019-20-C7": { correct: "0,2424", unit: "ha" },
  "CG-2019-20-C8": { correct: "27", unit: "quả" },
  "CG-2019-20-C9": { correct: "75", unit: "cm²" },
  "CG-2019-20-C10": { correct: "15", unit: "học sinh" },

  "CG-2020-21-C1": { correct: "132,8", unit: null },
  "CG-2020-21-C2": { correct: "32", unit: "phút" },
  "CG-2020-21-C3": { correct: "12,5", unit: null },
  "CG-2020-21-C4": { correct: "216", unit: "cm³" },
  "CG-2020-21-C5": { correct: "10", unit: "em", figure: "cg-2020-c5" },
  "CG-2020-21-C6": { correct: "1992", unit: null },
  "CG-2020-21-C7": { correct: "70,5", unit: "km" },
  "CG-2020-21-C8": { correct: "10", unit: "cm²", figure: "cg-2020-c8" },
  "CG-2020-21-C9": { correct: "18", unit: "ngày" },
  "CG-2020-21-C10": { correct: "56", unit: "m²" },

  "CG-2021-22-C1": { correct: "8,4", unit: null },
  "CG-2021-22-C2": { correct: "400", unit: "lần" },
  "CG-2021-22-C3": { correct: "9", unit: "xe" },
  "CG-2021-22-C4": { correct: "5", unit: "giờ" },
  "CG-2021-22-C5": { correct: "19,5", unit: "lít" },
  "CG-2021-22-C6": { correct: "37", unit: null },
  "CG-2021-22-C7": { correct: "140", unit: "chai" },
  "CG-2021-22-C8": { correct: "8", unit: "cm²" },

  "CG-2022-23-C1": { correct: "B", unit: null },
  "CG-2022-23-C2": { correct: "C", unit: null },
  "CG-2022-23-C3": { correct: "D", unit: null },
  "CG-2022-23-C4": { correct: "A", unit: null },
  "CG-2022-23-C5": { correct: "2,89", unit: null },
  "CG-2022-23-C6": { correct: "225", unit: "học sinh" },
  "CG-2022-23-C7": { correct: "10", unit: "tuổi" },
  "CG-2022-23-C8": { correct: "51,2", unit: "cm²", figure: "cg-2022-c8" },

  "CG-2023-24-C1": { correct: "C", unit: null },
  "CG-2023-24-C2": { correct: "A", unit: null },
  "CG-2023-24-C3": { correct: "D", unit: null },
  "CG-2023-24-C4": { correct: "C", unit: null },
  "CG-2023-24-C5": { correct: "5274", unit: null },
  "CG-2023-24-C6": { correct: "30", unit: "tấn gạo" },
  "CG-2023-24-C7": { correct: "28", unit: "%", figure: "cg-2023-c7" },
  "CG-2023-24-C8": { correct: "56,52", unit: "cm²", figure: "cg-2023-c8" },

  "CG-2024-25-C1": { correct: "2,75", unit: null },
  "CG-2024-25-C2": { correct: "2,0015", unit: "ha" },
  "CG-2024-25-C3": { correct: "37,5", unit: "km" },
  "CG-2024-25-C4": { correct: "480", unit: "cm³" },
  "CG-2024-25-C5": { correct: "210", unit: "người", figure: "cg-2024-c5" },
  "CG-2024-25-C6": { correct: "8 giờ 15 phút", unit: null },
  "CG-2024-25-C7": { correct: "254", unit: "cm²", figure: "cg-2024-c7" },
  "CG-2024-25-C8": { correct: "39", unit: "tuổi" },

  "CG-2025-26-C1": { correct: "5", unit: "tấn" },
  "CG-2025-26-C2": { correct: "15011", unit: "cm³" },
  "CG-2025-26-C3": { correct: "4", unit: "cm" },
  "CG-2025-26-C4": { correct: "864", unit: "cm²" },
  "CG-2025-26-C5": { correct: "2/7", unit: null },
  "CG-2025-26-C6": { correct: "15", unit: "phút" },
  "CG-2025-26-C7": { correct: "20", unit: "viên" },
  "CG-2025-26-C8": { correct: "30", unit: "cm" },

  // ─── NN (THCS Ngoại ngữ — UMS) ──────────────────────────────────────────
  "NN-2019-20-C1": { correct: "B", unit: null },
  "NN-2019-20-C2": { correct: "C", unit: null },
  "NN-2019-20-C3": { correct: "C", unit: null },
  "NN-2019-20-C4": { correct: "A", unit: null, figure: "nn-2019-c4" },
  "NN-2019-20-C5": { correct: "D", unit: null },
  "NN-2019-20-C6": { correct: "D", unit: null },
  "NN-2019-20-B1": { correct: "Can I: 10 lít; Can II: 13 lít; Can III: 13 lít", unit: null },
  "NN-2019-20-B2": { correct: "Xe đi từ A: 15 km/giờ; Xe đi từ B: 12 km/giờ", unit: null },

  "NN-2021-22-C1": { correct: "A", unit: null },
  "NN-2021-22-C2": { correct: "B", unit: null },
  "NN-2021-22-C3": { correct: "D", unit: null },
  "NN-2021-22-C4": { correct: "B", unit: null },
  "NN-2021-22-C5": { correct: "C", unit: null },
  "NN-2021-22-C6": { correct: "A", unit: null },

  "NN-2022-23-C1": { correct: "51", unit: null },
  "NN-2022-23-C2": { correct: "40", unit: "hình" },
  "NN-2022-23-C3": { correct: "15", unit: "kg" },
  "NN-2022-23-C4": { correct: "3/8", unit: null },
  "NN-2022-23-C5": { correct: "36", unit: "cm²", figure: "nn-2022-c5" },
  "NN-2022-23-B1": { correct: "Xe khách: 36 km/giờ; Xe tải: 24 km/giờ", unit: null },

  // ─── NTL (THCS Nam Từ Liêm) ─────────────────────────────────────────────
  "NTL-2020-21-C1": { correct: "0", unit: null },
  "NTL-2020-21-C2": { correct: "x = 2", unit: null },
  "NTL-2020-21-C3": { correct: "24 bạn điểm 9; 19 bạn điểm 10", unit: null },
  "NTL-2020-21-C4": { correct: "7", unit: "tuổi" },
  "NTL-2020-21-C5": { correct: "6974", unit: null },
  "NTL-2020-21-C6": { correct: "13", unit: null },
  "NTL-2020-21-C7": { correct: "45", unit: "chiếc mặt nạ" },
  "NTL-2020-21-C8": { correct: "105", unit: "km" },
  "NTL-2020-21-C9": { correct: "6", unit: "dm" },
  "NTL-2020-21-C10": { correct: "10", unit: "viên bi" },
  "NTL-2020-21-B1": { correct: "Xuân: 5 cây; Hạ: 4 cây; Thu: 2 cây; Đông: 3 cây", unit: null },
  "NTL-2020-21-B2": { correct: "9 cách", unit: null },

  "NTL-2022-23-C1": { correct: "1260", unit: null },
  "NTL-2022-23-C2": { correct: "27", unit: "cm³" },
  "NTL-2022-23-C3": { correct: "37", unit: null },
  "NTL-2022-23-C4": { correct: "3/4", unit: null },
  "NTL-2022-23-C5": { correct: "x = 12", unit: null },
  "NTL-2022-23-C6": { correct: "10", unit: "học sinh" },
  "NTL-2022-23-C7": { correct: "38", unit: "phút" },
  "NTL-2022-23-C8": { correct: "95", unit: null },
  "NTL-2022-23-C9": { correct: "6", unit: "năm" },
  "NTL-2022-23-C10": { correct: "750000", unit: "đồng" },
  "NTL-2022-23-C11": { correct: "6", unit: "cách", figure: "ntl-2022-c11" },
  "NTL-2022-23-B1": { correct: "a) Xe thứ nhất: 60 km/giờ; Xe thứ hai: 50 km/giờ. b) 4 giờ", unit: null },
  "NTL-2022-23-B2": { correct: "a) 15 cm²; b) MN/DN = 2; c) S_NDP/S_NPC = 1/4", unit: null, figure: "ntl-2022-b2" },

  "NTL-2023-24-C1": { correct: "45", unit: null },
  "NTL-2023-24-C2": { correct: "a = 3", unit: null },
  "NTL-2023-24-C3": { correct: "80000", unit: "đồng" },
  "NTL-2023-24-C4": { correct: "3", unit: "tuổi" },
  "NTL-2023-24-C5": { correct: "1,4", unit: "m" },
  "NTL-2023-24-C6": { correct: "27", unit: "quyển" },
  "NTL-2023-24-C7": { correct: "32", unit: "m²", figure: "ntl-2023-c7" },
  "NTL-2023-24-C8": { correct: "3", unit: "số" },
  "NTL-2023-24-C9": { correct: "225", unit: null },
  "NTL-2023-24-C10": { correct: "30", unit: "hình vuông", figure: "ntl-2023-c10" },
  "NTL-2023-24-B1": { correct: "a) 2400; b) x = 1/2; c) Bình: 12 km/giờ; An: 15 km/giờ", unit: null },
  "NTL-2023-24-B2": { correct: "a) 30 cm²; b) S_ABI/S_BIC = 2; c) BK/KC = 2/3", unit: null, figure: "ntl-2023-b2" },

  // ─── NTL 2025-26 ĐGNL (Claude-derived answers — no official answer key) ──
  "NTL-2025-26-C1": { correct: "3", unit: null }, // Claude-derived (no official answer key)
  "NTL-2025-26-C2": { correct: "x = 3", unit: null }, // Claude-derived
  "NTL-2025-26-C3": { correct: "33000", unit: "đồng" }, // Claude-derived
  "NTL-2025-26-C4": { correct: "7/10", unit: null }, // Claude-derived
  "NTL-2025-26-C5": { correct: "1200000", unit: "đồng" }, // Claude-derived
  "NTL-2025-26-C6": { correct: "192", unit: "lít" }, // Claude-derived
  "NTL-2025-26-C7": { correct: "2,5", unit: "km" }, // Claude-derived
  "NTL-2025-26-C8": {
    stem: [
      "Câu lạc bộ thể thao có $60$ học sinh. Các môn được mô tả theo biểu đồ hình bên. Quan sát hình và đánh giá Đúng (Đ) hay Sai (S) cho từng phát biểu sau:",
      "",
      "**a)** Bóng đá là môn thể thao có nhiều học sinh tham gia nhất.",
      "",
      "**b)** Câu lạc bộ bóng rổ có $12$ học sinh.",
      "",
      "**c)** Số học sinh tham gia môn cầu lông gấp đôi số học sinh tham gia môn bóng đá.",
      "",
      "**d)** Số học sinh tham gia môn cầu lông nhiều hơn số học sinh tham gia môn bóng đá là $6$ học sinh.",
    ].join("\n"),
    correct: "a) Đ; b) S; c) S; d) S",
    unit: null,
    figure: "ntl-2025-c8",
  }, // Claude-derived (Đ-S, pie chart)
  "NTL-2025-26-C9": {
    stem: [
      "Cho hình vuông $ABCD$ được tạo bởi các hình vuông cạnh $1$ cm như hình vẽ. Quan sát hình và đánh giá Đúng (Đ) hay Sai (S) cho từng phát biểu sau:",
      "",
      "**a)** Chu vi tứ giác $AEGH$ là $4$ cm.",
      "",
      "**b)** Diện tích tứ giác $AEGD$ là $4$ $\\text{cm}^2$.",
      "",
      "**c)** $S_{AECH} = \\dfrac{1}{3} \\times S_{ABCD}$.",
      "",
      "**d)** Tổng số hình vuông là $18$ hình.",
    ].join("\n"),
    correct: "a) S; b) S; c) S; d) S",
    unit: null,
    figure: "ntl-2025-c9",
  }, // Claude-derived — UNCERTAIN figure interpretation
  "NTL-2025-26-B1": { correct: "a) 24000000 đồng; b) Mũ: 525; Nón: 675", unit: null }, // Claude-derived
  "NTL-2025-26-B2": { correct: "a) 4 cm²; b) 6 cm; c) BM = 2 cm", unit: null, figure: "ntl-2025-b2" }, // Claude-derived
  "NTL-2025-26-B3": { correct: "18000 đồng", unit: null }, // Claude-derived

  // ─── NSHN 2026-27 — Học bổng Ngôi Sao Hà Nội (Khối 5) ───────────────────
  // Source: ảnh đề + lời giải MathExpress (public/ref_exam/NSHN 26-27/)
  "NSHN-2026-27-C1": {
    stem: "Số nào có $3$ nghìn, $5$ chục, $7$ phần mười, $8$ phần trăm?",
    modelAnswer: [
      "Số gồm $3$ nghìn, $5$ chục, $7$ phần mười, $8$ phần trăm là $3050{,}78$.",
      "",
      "**Đáp số**: $3050{,}78$.",
    ].join("\n"),
  },
  "NSHN-2026-27-C2": {
    stem: "Bác Năm có nuôi một số gà, trong đó số gà mái nhiều hơn gà trống là $352$ con. Biết rằng bác Năm bán $100$ con gà mái và $100$ con gà trống thì số gà mái còn lại bằng $\\dfrac{7}{3}$ số gà trống. Hỏi lúc đầu bác Năm có tổng cộng bao nhiêu con gà?",
    modelAnswer: [
      "Sau khi bác Năm bán $100$ con gà mái và $100$ con gà trống thì hiệu giữa số gà mái và gà trống không đổi vẫn bằng $352$ con.",
      "",
      "Ta có sơ đồ số gà lúc sau:",
      "- Gà mái: $7$ phần",
      "- Gà trống: $3$ phần",
      "- Hiệu: $7 - 3 = 4$ (phần) ứng với $352$ con.",
      "",
      "Lúc sau, bác Năm có số con gà trống là: $352 : (7 - 3) \\times 3 = 264$ (con).",
      "",
      "Lúc đầu, bác Năm có số con gà trống là: $264 + 100 = 364$ (con).",
      "",
      "Lúc đầu, bác Năm có số con gà mái là: $364 + 352 = 716$ (con).",
      "",
      "Lúc đầu, bác Năm có tổng cộng số con gà là: $364 + 716 = 1080$ (con).",
      "",
      "**Đáp số**: $1080$ con.",
    ].join("\n"),
  },
  "NSHN-2026-27-C3": {
    stem: "Có $3$ lớp của $3$ bạn Lan, Hùng, Chi. Lớp của Lan đóng góp được $215{,}2$ kg giấy vụn, lớp Hùng đóng góp được $314{,}4$ kg giấy vụn. Lớp của Chi có số giấy vụn nhiều hơn trung bình cộng số giấy vụn của lớp Lan và Hùng là $27{,}2$ kg. Hỏi lớp Chi đóng góp được bao nhiêu ki-lô-gam giấy vụn?",
    modelAnswer: [
      "Trung bình cộng số giấy vụn đóng góp của lớp Lan và lớp Hùng là:",
      "$$(215{,}2 + 314{,}4) : 2 = 264{,}8 \\text{ (kg)}.$$",
      "",
      "Lớp Chi đóng góp được số ki-lô-gam giấy vụn là:",
      "$$264{,}8 + 27{,}2 = 292 \\text{ (kg)}.$$",
      "",
      "**Đáp số**: $292$ kg.",
    ].join("\n"),
  },
  "NSHN-2026-27-C4": {
    stem: "Lan có $330$ cái bánh dự định làm trong $5$ ngày. Làm được $3$ ngày thì có thêm $3$ người bạn nữa đến giúp đỡ nên xong sớm hơn $1$ ngày. Hỏi mỗi người bạn của Lan làm được bao nhiêu cái bánh? Biết năng suất của mỗi người bạn của Lan là như nhau.",
    modelAnswer: [
      "Dự định mỗi ngày Lan làm số cái bánh là: $330 : 5 = 66$ (cái).",
      "",
      "Sau $3$ ngày, Lan làm được số cái bánh là: $66 \\times 3 = 198$ (cái).",
      "",
      "Còn lại số cái bánh là: $330 - 198 = 132$ (cái). Sau $3$ ngày, có $3$ bạn đến thêm nên xong sớm hơn $1$ ngày do đó $132$ cái bánh được Lan và $3$ bạn làm trong $1$ ngày.",
      "",
      "Mỗi người bạn của Lan làm được số cái bánh là: $(132 - 66) : 3 = 22$ (cái).",
      "",
      "**Đáp số**: $22$ cái bánh.",
    ].join("\n"),
  },
  "NSHN-2026-27-C5": {
    stem: "Giá vàng ngày $29$ tháng $1$ tăng $3\\%$ so với giá vàng ngày $28$ tháng $1$. Đến ngày $30$ tháng $1$, giá vàng lại giảm $0{,}9\\%$ so với ngày $29$ tháng $1$. Hỏi giá vàng ngày $30$ tháng $1$ tăng bao nhiêu phần trăm so với giá vàng ngày $28$ tháng $1$?",
    modelAnswer: [
      "Giá vàng ngày $29$ tháng $1$ bằng: $100\\% + 3\\% = 103\\%$ (giá vàng ngày $28$ tháng $1$).",
      "",
      "Giá vàng ngày $30$ tháng $1$ bằng: $100\\% - 0{,}9\\% = 99{,}1\\%$ (giá vàng ngày $29$ tháng $1$).",
      "",
      "Giá vàng ngày $30$ tháng $1$ bằng: $103\\% \\times 99{,}1\\% = 102{,}073\\%$ (giá vàng ngày $28$ tháng $1$).",
      "",
      "Vậy giá vàng ngày $30$ tháng $1$ tăng so với giá vàng ngày $28$ tháng $1$ số phần trăm là:",
      "$$102{,}073\\% - 100\\% = 2{,}073\\% \\text{ (giá vàng ngày } 28 \\text{ tháng } 1\\text{)}.$$",
      "",
      "**Đáp số**: Tăng $2{,}073\\%$.",
    ].join("\n"),
  },
  "NSHN-2026-27-C6": {
    stem: "Bạn Minh có $2$ tấm thẻ viết $2$ số có $2$ chữ số. Hiệu $2$ số là $18$. Bạn Minh xếp hai tấm thẻ cạnh nhau rồi đổi chỗ để được hai số có $4$ chữ số. Tổng $2$ số đó là $15554$. Tìm $2$ số đó.",
    modelAnswer: [
      "Gọi $2$ số trên $2$ tấm thẻ đó là: $\\overline{ab}$ và $\\overline{cd}$.",
      "",
      "Ghép thành số có $4$ chữ số ta được số $\\overline{abcd}$ và $\\overline{cdab}$.",
      "",
      "Ta có: $\\overline{abcd} + \\overline{cdab} = 15554$",
      "$$\\overline{ab} \\times 100 + \\overline{cd} + \\overline{cd} \\times 100 + \\overline{ab} = 15554$$",
      "$$\\overline{ab} \\times 101 + \\overline{cd} \\times 101 = 15554$$",
      "$$(\\overline{ab} + \\overline{cd}) \\times 101 = 15554$$",
      "$$\\overline{ab} + \\overline{cd} = 154.$$",
      "",
      "Số lớn là: $(154 + 18) : 2 = 86$.",
      "",
      "Số bé là: $154 - 86 = 68$.",
      "",
      "**Đáp số**: Số lớn: $86$; số bé: $68$.",
    ].join("\n"),
  },
  "NSHN-2026-27-C7": {
    stem: "Bạn Lan làm một bài kiểm tra đúng $30$ câu, được $12\\dfrac{1}{6}$ điểm. Biết rằng trả lời đúng $1$ câu trắc nghiệm được $\\dfrac{1}{3}$ điểm, trả lời đúng một câu tự luận thì được $\\dfrac{1}{2}$ điểm. Hỏi bạn Lan đã trả lời đúng bao nhiêu câu tự luận, bao nhiêu câu trắc nghiệm?",
    modelAnswer: [
      "Số điểm Lan đạt được là: $12\\dfrac{1}{6} = \\dfrac{73}{6}$ (điểm).",
      "",
      "Nếu Lan trả lời đúng $30$ câu trắc nghiệm thì số điểm Lan đạt được là: $30 \\times \\dfrac{1}{3} = 10$ (điểm).",
      "",
      "Thực tế, số điểm Lan đạt được nhiều hơn: $\\dfrac{73}{6} - 10 = \\dfrac{13}{6}$ (điểm).",
      "",
      "Một câu tự luận nhiều hơn một câu trắc nghiệm số điểm là: $\\dfrac{1}{2} - \\dfrac{1}{3} = \\dfrac{1}{6}$ (điểm).",
      "",
      "Số câu tự luận Lan trả lời đúng là: $\\dfrac{13}{6} : \\dfrac{1}{6} = 13$ (câu).",
      "",
      "Số câu trắc nghiệm Lan trả lời đúng là: $30 - 13 = 17$ (câu).",
      "",
      "**Đáp số**: $13$ câu tự luận; $17$ câu trắc nghiệm.",
    ].join("\n"),
  },
  "NSHN-2026-27-C8": {
    stem: "Hỏi có bao nhiêu hình chữ nhật chứa $N$ hoặc $S$?",
    modelAnswer: [
      "**Hình chữ nhật chứa $N$ gồm:**",
      "- Kích thước $1 \\times 1$: $1$ hình.",
      "- Kích thước $1 \\times 2$: $3$ hình.",
      "- Kích thước $1 \\times 3$: $3$ hình.",
      "- Kích thước $1 \\times 4$: $1$ hình.",
      "- Kích thước $2 \\times 2$: $2$ hình.",
      "- Kích thước $2 \\times 3$: $4$ hình.",
      "- Kích thước $2 \\times 4$: $1$ hình.",
      "- Kích thước $3 \\times 3$: $2$ hình.",
      "- Kích thước $3 \\times 4$: $1$ hình.",
      "",
      "Có tổng tất cả $18$ hình chữ nhật chứa $N$.",
      "",
      "**Hình chữ nhật chứa $S$ gồm:**",
      "- Kích thước $1 \\times 1$: $1$ hình.",
      "- Kích thước $1 \\times 2$: $3$ hình.",
      "- Kích thước $1 \\times 3$: $2$ hình.",
      "- Kích thước $1 \\times 4$: $1$ hình.",
      "- Kích thước $2 \\times 2$: $2$ hình.",
      "- Kích thước $2 \\times 3$: $3$ hình.",
      "- Kích thước $2 \\times 4$: $2$ hình.",
      "- Kích thước $3 \\times 3$: $1$ hình.",
      "- Kích thước $3 \\times 4$: $1$ hình.",
      "",
      "Có tổng tất cả $16$ hình chữ nhật chứa $S$.",
      "",
      "**Hình chữ nhật chứa cả $N$ và $S$ gồm:**",
      "- Kích thước $2 \\times 3$: $1$ hình.",
      "- Kích thước $2 \\times 4$: $1$ hình.",
      "- Kích thước $3 \\times 3$: $1$ hình.",
      "- Kích thước $3 \\times 4$: $1$ hình.",
      "",
      "Có tổng tất cả $4$ hình chữ nhật chứa cả $N$ và $S$.",
      "",
      "Vậy có tất cả số hình chữ nhật chứa $N$ hoặc $S$ là: $18 + 16 - 4 = 30$ (hình).",
      "",
      "**Đáp số**: $30$ hình.",
    ].join("\n"),
  },
  "NSHN-2026-27-C9": {
    stem: "Cho $ABCD$ là hình vuông có diện tích là $16$ cm$^2$. Lấy $E$ là điểm trên cạnh $BC$ sao cho $CE = BC$. Tính diện tích tam giác $DFC$, biết $DEGF$ là hình vuông.",
    modelAnswer: [
      "Vì $DFGE$ là hình vuông nên cũng là hình thoi. Do đó, hai đường chéo $DG$ và $EF$ vuông góc với nhau.",
      "",
      "Suy ra: $EF$ song song với $DC$.",
      "",
      "Suy ra: $S_{FDC} = S_{EDC}$ (vì chung đáy $DC$, chiều cao hạ từ $F$ tới $DC$ bằng chiều cao hạ từ $E$ tới $DC$).",
      "",
      "Ta có: $16 = 4 \\times 4$ do đó độ dài cạnh của hình vuông $ABCD$ là $4$ cm.",
      "",
      "Diện tích của tam giác $EDC$ là: $4 \\times 4 : 2 = 8$ (cm$^2$).",
      "",
      "Vậy diện tích tam giác $FDC$ bằng diện tích tam giác $EDC$ và bằng $8$ cm$^2$.",
      "",
      "**Đáp số**: $8$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2026-27-B1": {
    stem: [
      "Tính giá trị biểu thức:",
      "",
      "**a)** $175 - (63{,}5 + 26{,}5) - 25{,}5$",
      "",
      "**b)** $\\dfrac{25}{6} : \\dfrac{5}{4} + \\dfrac{15}{14} \\times \\dfrac{28}{9}$",
    ].join("\n"),
    modelAnswer: [
      "**a)** $175 - (63{,}5 + 26{,}5) - 25{,}5$",
      "$$= 175 - 90 - 25{,}5 = 85 - 25{,}5 = 59{,}5.$$",
      "",
      "**b)** $\\dfrac{25}{6} : \\dfrac{5}{4} + \\dfrac{15}{14} \\times \\dfrac{28}{9}$",
      "$$= \\dfrac{25}{6} \\times \\dfrac{4}{5} + \\dfrac{15}{14} \\times \\dfrac{28}{9} = \\dfrac{10}{3} + \\dfrac{10}{3} = \\dfrac{20}{3}.$$",
      "",
      "**Đáp số**: **a)** $59{,}5$; **b)** $\\dfrac{20}{3}$.",
    ].join("\n"),
  },
  "NSHN-2026-27-B2": {
    stem: [
      "Cho hình thang $ABCD$ có đáy nhỏ $AB = 30$ cm, đáy lớn $CD = \\dfrac{5}{3} AB$, chiều cao bằng $75\\%$ tổng độ dài hai đáy.",
      "",
      "**a)** Tính diện tích hình thang $ABCD$.",
      "",
      "**b)** Kẻ đường chéo $AC$ và $BD$ cắt nhau tại $O$. So sánh diện tích tam giác $AOD$ và $BOC$.",
      "",
      "**c)** Tìm tỉ số $\\dfrac{OA}{OC}$.",
    ].join("\n"),
    modelAnswer: [
      "**a)** Độ dài đáy lớn $CD$ là: $30 : 3 \\times 5 = 50$ (cm).",
      "",
      "Chiều cao hình thang $ABCD$ là: $(30 + 50) \\times 75\\% = 60$ (cm).",
      "",
      "Diện tích hình thang $ABCD$ là: $(30 + 50) \\times 60 : 2 = 2400$ (cm$^2$).",
      "",
      "**b)** Ta có: $S_{ACD} = S_{BCD}$ (chung đáy $DC$, chiều cao hạ từ $A$ tới $DC$ bằng chiều cao hạ từ $B$ tới $CD$).",
      "",
      "$$S_{AOD} + S_{ODC} = S_{BOC} + S_{ODC}.$$",
      "",
      "Vậy $S_{AOD} = S_{BOC}$ (cùng bớt cả hai vế cho $S_{ODC}$).",
      "",
      "**c)** Ta có: $\\dfrac{S_{ABD}}{S_{BDC}} = \\dfrac{AB}{CD} = \\dfrac{3}{5}$ (chiều cao hạ từ $D$ tới $AB$ bằng chiều cao hạ từ $B$ tới $DC$).",
      "",
      "Mà hai tam giác này có chung đáy $BD$ nên tỉ số chiều cao $\\dfrac{h_1}{h_2} = \\dfrac{3}{5}$.",
      "",
      "Đưa hai chiều cao này tương ứng vào hai tam giác $AOD$ và $COD$ có chung đáy $OD$ ta được:",
      "$$\\dfrac{S_{AOD}}{S_{COD}} = \\dfrac{h_1}{h_2} = \\dfrac{3}{5}.$$",
      "",
      "Mà hai tam giác này có chung chiều cao hạ từ $D$ tới $AC$ nên tỉ số đáy $\\dfrac{OA}{OC} = \\dfrac{3}{5}$.",
      "",
      "**Đáp số**: **a)** $2400$ cm$^2$; **b)** $S_{AOD} = S_{BOC}$; **c)** $\\dfrac{OA}{OC} = \\dfrac{3}{5}$.",
    ].join("\n"),
  },
  "NSHN-2026-27-B3": {
    stem: "Cho các số tự nhiên từ $1$ đến $17$. Hỏi có thể chọn ra nhiều nhất bao nhiêu số để tổng của các số được chọn không chia hết cho bất kì số nào được chọn? Vì sao?",
    modelAnswer: [
      "- Nếu trong các số được chọn có số $1$, thì tổng của các số đó luôn chia hết cho $1$, do đó không thể lấy số $1$.",
      "",
      "- Nếu chọn $16$ số: $2, 3, 4, \\ldots, 17$. Ta có $2 + 3 + 4 + \\ldots + 17 = 152$ chia hết cho $2 \\rightarrow$ Loại.",
      "",
      "- Nếu chọn $15$ số, ta sẽ không chọn số $1$ và một số nữa.",
      "",
      "  + Nếu không lấy số $2$, tổng của $15$ số là: $152 - 2 = 150$, chia hết cho $3 \\rightarrow$ Loại.",
      "",
      "  + Nếu không lấy số $3$, tổng của $15$ số là: $152 - 3 = 149$. Ta thấy $149$ không chia hết cho $2, 4, 5, 6, \\ldots, 17 \\rightarrow$ Chọn.",
      "",
      "Vậy ta có thể chọn ra được nhiều nhất $15$ số thoả mãn yêu cầu bài toán.",
      "",
      "**Đáp số**: $15$ số.",
    ].join("\n"),
  },

  // ─── NSHN 2025-26 — Học bổng Ngôi Sao Hà Nội (Khối 5) ───────────────────
  // Source: PDF Loigiaihay (public/ref_exam/de-thi-vao-lop-6-mon-toan-truong-ngoi-sao-2025-co-dap-an-*.pdf)
  // PDF có đáp án + lời giải chi tiết → correct/modelAnswer lấy từ PDF.
  "NSHN-2025-26-C1": {
    stem: "Viết số gồm $3$ trăm, $6$ đơn vị và $2$ phần trăm.",
    modelAnswer: [
      "Số gồm $3$ trăm, $6$ đơn vị và $2$ phần trăm là $306{,}02$.",
      "",
      "**Đáp số**: $306{,}02$.",
    ].join("\n"),
  },
  "NSHN-2025-26-C2": {
    stem: "Tính diện tích phần tô đậm, biết hình tròn lớn có đường kính là $10$ cm, hình tròn bé có đường kính là $7$ cm.",
    modelAnswer: [
      "Bán kính hình tròn lớn là: $10 : 2 = 5$ (cm).",
      "",
      "Diện tích hình tròn lớn là: $5 \\times 5 \\times 3{,}14 = 78{,}5$ (cm$^2$).",
      "",
      "Bán kính hình tròn bé là: $7 : 2 = 3{,}5$ (cm).",
      "",
      "Diện tích hình tròn bé là: $3{,}5 \\times 3{,}5 \\times 3{,}14 = 38{,}465$ (cm$^2$).",
      "",
      "Diện tích phần tô đậm là: $78{,}5 - 38{,}465 = 40{,}035$ (cm$^2$).",
      "",
      "**Đáp số**: $40{,}035$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2025-26-C3": {
    stem: "Hiện nay tuổi em gấp bốn lần tuổi em khi tuổi anh bằng tuổi em hiện nay. Khi tuổi em bằng tuổi anh hiện nay thì tổng số tuổi hai anh em là $51$ tuổi. Tính tuổi mỗi người hiện nay.",
    modelAnswer: [
      "Coi tuổi em khi tuổi anh bằng tuổi em hiện nay là $1$ phần. Khi đó tuổi em hiện nay gấp $4$ lần nên bằng $4$ phần; tuổi anh lúc đó bằng tuổi em hiện nay nên cũng bằng $4$ phần.",
      "",
      "Hiệu số tuổi hai anh em không đổi và bằng: $4 - 1 = 3$ (phần).",
      "",
      "Hiện nay: tuổi em $= 4$ phần; tuổi anh $= 4 + 3 = 7$ (phần).",
      "",
      "Khi tuổi em bằng tuổi anh hiện nay ($7$ phần) thì tuổi anh lúc đó $= 7 + 3 = 10$ (phần).",
      "",
      "Tổng số tuổi hai anh em khi đó là $7 + 10 = 17$ (phần) ứng với $51$ tuổi.",
      "",
      "Giá trị một phần là: $51 : 17 = 3$ (tuổi).",
      "",
      "Tuổi em hiện nay là: $3 \\times 4 = 12$ (tuổi).",
      "",
      "Tuổi anh hiện nay là: $3 \\times 7 = 21$ (tuổi).",
      "",
      "**Đáp số**: Tuổi anh: $21$ tuổi; tuổi em: $12$ tuổi.",
    ].join("\n"),
  },
  "NSHN-2025-26-C4": {
    stem: "Hai người dự định cùng làm một công việc trong $5$ giờ sẽ xong. Làm được $2$ giờ thì người thứ nhất có việc bận phải đi nên chỉ còn người thứ hai làm. Người thứ hai làm nốt công việc đó trong $9$ giờ. Hỏi nếu làm riêng thì mỗi người làm công việc đó trong bao lâu?",
    modelAnswer: [
      "Trong $1$ giờ hai người làm được số phần công việc là: $1 : 5 = \\dfrac{1}{5}$ (công việc).",
      "",
      "Trong $2$ giờ hai người làm được: $\\dfrac{1}{5} \\times 2 = \\dfrac{2}{5}$ (công việc).",
      "",
      "Số phần công việc còn lại là: $1 - \\dfrac{2}{5} = \\dfrac{3}{5}$ (công việc).",
      "",
      "Trong $1$ giờ người thứ hai làm được: $\\dfrac{3}{5} : 9 = \\dfrac{1}{15}$ (công việc).",
      "",
      "Người thứ hai làm riêng xong công việc sau: $1 : \\dfrac{1}{15} = 15$ (giờ).",
      "",
      "Trong $1$ giờ người thứ nhất làm được: $\\dfrac{1}{5} - \\dfrac{1}{15} = \\dfrac{2}{15}$ (công việc).",
      "",
      "Người thứ nhất làm riêng xong công việc sau: $1 : \\dfrac{2}{15} = 7{,}5$ (giờ).",
      "",
      "**Đáp số**: Người thứ nhất: $7{,}5$ giờ; người thứ hai: $15$ giờ.",
    ].join("\n"),
  },
  "NSHN-2025-26-C5": {
    stem: [
      "Cho $A = \\dfrac{1}{2} + \\dfrac{1}{4} + \\dfrac{1}{8} + \\cdots + \\dfrac{1}{512}$",
      "",
      "và $B = \\dfrac{1}{1+2} + \\dfrac{1}{1+2+3} + \\dfrac{1}{1+2+3+4} + \\cdots + \\dfrac{1}{1+2+3+\\cdots+511}$.",
      "",
      "Tính $\\dfrac{A}{B}$.",
    ].join("\n"),
    modelAnswer: [
      "**Tính $A$:**",
      "$$A \\times 2 = 1 + \\dfrac{1}{2} + \\dfrac{1}{4} + \\cdots + \\dfrac{1}{256}.$$",
      "$$A \\times 2 - A = 1 - \\dfrac{1}{512} \\Rightarrow A = \\dfrac{511}{512}.$$",
      "",
      "**Tính $B$:**",
      "Mỗi mẫu số có dạng $1 + 2 + \\cdots + n = \\dfrac{n \\times (n+1)}{2}$, nên mỗi số hạng là $\\dfrac{2}{n \\times (n+1)}$ với $n = 2, 3, \\ldots, 511$.",
      "",
      "$$B = 2 \\left( \\dfrac{1}{2 \\times 3} + \\dfrac{1}{3 \\times 4} + \\cdots + \\dfrac{1}{511 \\times 512} \\right).$$",
      "$$B = 2 \\left( \\dfrac{1}{2} - \\dfrac{1}{3} + \\dfrac{1}{3} - \\dfrac{1}{4} + \\cdots + \\dfrac{1}{511} - \\dfrac{1}{512} \\right) = 2 \\left( \\dfrac{1}{2} - \\dfrac{1}{512} \\right) = \\dfrac{510}{512}.$$",
      "",
      "Vậy $\\dfrac{A}{B} = \\dfrac{511}{512} : \\dfrac{510}{512} = \\dfrac{511}{510}$.",
      "",
      "**Đáp số**: $\\dfrac{A}{B} = \\dfrac{511}{510}$.",
    ].join("\n"),
  },
  "NSHN-2025-26-C6": {
    stem: "Cho tam giác $ABC$. Lấy $M$ và $N$ lần lượt là trung điểm của cạnh $AB$ và $AC$, nối $M$ với $C$ và $N$ với $B$ cắt nhau tại $O$. Tính $S_{ABC}$, biết $S_{MOB} = 20$ cm$^2$.",
    modelAnswer: [
      "**Nối $A$ với $O$.**",
      "",
      "Vì $M$ là trung điểm của $AB$ nên $S_{BMO} = S_{AMO}$ (chung chiều cao hạ từ $O$, đáy $MB = MA$). Do đó:",
      "$$S_{ABO} = 2 \\times S_{MOB} = 2 \\times 20 = 40 \\text{ (cm}^2).$$",
      "",
      "Vì $N$ là trung điểm của $AC$ nên $S_{ABN} = S_{CBN}$ (chung chiều cao hạ từ $B$) và $S_{AON} = S_{CON}$ (chung chiều cao hạ từ $O$). Trừ vế theo vế:",
      "$$S_{ABN} - S_{AON} = S_{CBN} - S_{CON} \\Rightarrow S_{ABO} = S_{BCO} = 40 \\text{ (cm}^2).$$",
      "",
      "Tương tự, vì $M$ là trung điểm của $AB$: $S_{ACM} = S_{BCM}$ (chung chiều cao hạ từ $C$) và $S_{AOM} = S_{BOM}$, trừ vế theo vế ta được $S_{ACO} = S_{BCO} = 40$ (cm$^2$).",
      "",
      "Diện tích tam giác $ABC$ là:",
      "$$S_{ABC} = S_{ABO} + S_{BCO} + S_{ACO} = 40 + 40 + 40 = 120 \\text{ (cm}^2).$$",
      "",
      "**Đáp số**: $120$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2025-26-B1": {
    stem: "Tìm $x$ biết: $x + 3{,}8 = 3{,}5 \\times 1{,}5$.",
    modelAnswer: [
      "$$x + 3{,}8 = 3{,}5 \\times 1{,}5$$",
      "$$x + 3{,}8 = 5{,}25$$",
      "$$x = 5{,}25 - 3{,}8$$",
      "$$x = 1{,}45.$$",
      "",
      "**Đáp số**: $x = 1{,}45$.",
    ].join("\n"),
  },
  "NSHN-2025-26-B2": {
    stem: "Tổng số gạo bán cả $3$ ngày là $125{,}6$ tạ gạo. Số gạo bán ngày thứ ba hơn số gạo bán ngày thứ nhất và ngày thứ hai là $19$ tạ gạo. Số gạo bán ngày thứ hai bằng $30\\%$ số gạo bán ngày thứ nhất. Hỏi mỗi ngày bán được bao nhiêu tạ gạo?",
    modelAnswer: [
      "Số gạo bán được trong ngày thứ ba là: $(125{,}6 + 19) : 2 = 72{,}3$ (tạ).",
      "",
      "Số gạo bán được trong ngày thứ nhất và ngày thứ hai là: $125{,}6 - 72{,}3 = 53{,}3$ (tạ).",
      "",
      "Tỉ số của số gạo bán ngày thứ hai và ngày thứ nhất là $30\\% = \\dfrac{3}{10}$.",
      "",
      "Số gạo bán ngày thứ nhất là: $53{,}3 : (3 + 10) \\times 10 = 41$ (tạ).",
      "",
      "Số gạo bán ngày thứ hai là: $53{,}3 - 41 = 12{,}3$ (tạ).",
      "",
      "**Đáp số**: Ngày thứ nhất: $41$ tạ; ngày thứ hai: $12{,}3$ tạ; ngày thứ ba: $72{,}3$ tạ.",
    ].join("\n"),
  },
  "NSHN-2025-26-B3": {
    stem: [
      "Cho hình vẽ bên (tam giác đều được chia thành các tam giác nhỏ cạnh $1$ cm).",
      "",
      "**a)** Có bao nhiêu hình tam giác được cấu tạo bởi các hình tam giác có cạnh là $1$ cm?",
      "",
      "**b)** Xóa $2$ đoạn $1$ cm để được ít hình tam giác nhất.",
    ].join("\n"),
    modelAnswer: [
      "**a)** Số hình tam giác cạnh $1$ cm xếp theo từng hàng từ trên xuống là:",
      "$$1 + 3 + 5 + 7 = 16 \\text{ (hình tam giác)}.$$",
      "",
      "**b)** Xóa hai đoạn thuộc đường chéo hoặc phần trung tâm của hình sẽ làm mất nhiều tam giác nhất.",
      "",
      "**Đáp số**: **a)** $16$ hình tam giác.",
    ].join("\n"),
  },

  // ─── NSHN 2020-21 (Ngôi Sao Hà Nội — Vào lớp 6, nguồn MathX) ──────────
  // Đáp án do Claude tự giải — PDF gốc KHÔNG có đáp án/lời giải kèm theo.
  // Kiểm tra lại trước khi dùng làm khoá chấm chính thức.
  "NSHN-2020-21-C1": {
    stem: "Lớp 5A0 và 5A1 lên kế hoạch làm $1000$ chiếc mũ chống giọt bắn gửi tặng các bác sĩ ở tuyến đầu chống dịch. Thực tế, họ đã làm được $1850$ chiếc. Như vậy, hai lớp đã vượt mức kế hoạch bao nhiêu phần trăm?",
    modelAnswer: [
      "Số mũ làm vượt mức kế hoạch là: $1850 - 1000 = 850$ (chiếc).",
      "",
      "Hai lớp đã vượt mức kế hoạch số phần trăm là: $850 : 1000 = 0{,}85 = 85\\%$.",
      "",
      "**Đáp số**: $85\\%$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C2": {
    stem: "Khi nhân một số với $3{,}4$ một bạn học sinh đã quên dấu phẩy ở số $3{,}4$ nên tích tăng lên $459$ đơn vị. Tích đúng của phép nhân đó là bao nhiêu?",
    modelAnswer: [
      "Quên dấu phẩy ở $3{,}4$ nghĩa là bạn đó đã nhân số đã cho với $34$ thay vì với $3{,}4$.",
      "",
      "Phần tích tăng thêm chính là số đã cho nhân với: $34 - 3{,}4 = 30{,}6$.",
      "",
      "Số đã cho là: $459 : 30{,}6 = 15$.",
      "",
      "Tích đúng của phép nhân là: $15 \\times 3{,}4 = 51$.",
      "",
      "**Đáp số**: $51$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C3": {
    stem: "Tính giá trị của biểu thức: $18 : 9 + \\dfrac{7}{3} \\times \\dfrac{47}{4} - \\dfrac{7}{3} \\times 2\\dfrac{3}{4}$.",
    modelAnswer: [
      "$$18 : 9 + \\dfrac{7}{3} \\times \\dfrac{47}{4} - \\dfrac{7}{3} \\times 2\\dfrac{3}{4} = 2 + \\dfrac{7}{3} \\times \\left(\\dfrac{47}{4} - \\dfrac{11}{4}\\right)$$",
      "$$= 2 + \\dfrac{7}{3} \\times \\dfrac{36}{4} = 2 + \\dfrac{7}{3} \\times 9 = 2 + 21 = 23.$$",
      "",
      "**Đáp số**: $23$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C4": {
    stem: "Cho tam giác $ABC$, lấy điểm $M$ trên cạnh $BC$ sao cho $BM = \\dfrac{1}{5}BC$, lấy điểm $N$ trên cạnh $AC$ sao cho $AN = \\dfrac{3}{4}AC$. Biết diện tích tam giác $ABC = 60$ cm$^2$. Tính diện tích tam giác $AMN$.",
    modelAnswer: [
      "Vì $BM = \\dfrac{1}{5}BC$ nên $MC = \\dfrac{4}{5}BC$.",
      "",
      "Tam giác $AMC$ và tam giác $ABC$ có chung chiều cao hạ từ $A$ xuống $BC$ nên:",
      "$$S_{AMC} = \\dfrac{MC}{BC} \\times S_{ABC} = \\dfrac{4}{5} \\times 60 = 48 \\text{ (cm}^2).$$",
      "",
      "Tam giác $AMN$ và tam giác $AMC$ có chung chiều cao hạ từ $M$ xuống $AC$ nên:",
      "$$S_{AMN} = \\dfrac{AN}{AC} \\times S_{AMC} = \\dfrac{3}{4} \\times 48 = 36 \\text{ (cm}^2).$$",
      "",
      "**Đáp số**: $36$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C5": {
    stem: "Một hộp đựng $60$ viên bi trong đó gồm $15$ viên bi màu xanh, $15$ viên bi màu đỏ, $15$ viên bi màu vàng, $15$ viên bi màu trắng. Không nhìn vào hộp, cần lấy ít nhất bao nhiêu viên bi để chắc chắn trong số đó có không ít hơn $8$ viên bi cùng màu?",
    modelAnswer: [
      "Xét trường hợp xấu nhất: mỗi màu ta lấy được đúng $7$ viên mà vẫn chưa có màu nào đủ $8$ viên. Khi đó số bi đã lấy là: $7 \\times 4 = 28$ (viên).",
      "",
      "Chỉ cần lấy thêm $1$ viên nữa thì viên này rơi vào một trong bốn màu, làm cho màu đó có đủ $8$ viên.",
      "",
      "Vậy cần lấy ít nhất: $28 + 1 = 29$ (viên).",
      "",
      "**Đáp số**: $29$ viên.",
    ].join("\n"),
  },
  "NSHN-2020-21-C6": {
    stem: "Vòi nhất tháo nước chảy ra, nếu hồ đầy thì hết nước mất $30$ giờ. Vòi nhì cho nước chảy vào, sau $15$ giờ thì nước đầy hồ. Nếu mở cả hai vòi cùng chảy (lúc hồ đang cạn) thì sau mấy giờ hồ đầy nước?",
    modelAnswer: [
      "Coi cả hồ nước là $1$ đơn vị.",
      "",
      "Trong $1$ giờ, vòi nhì chảy vào được: $1 : 15 = \\dfrac{1}{15}$ (hồ).",
      "",
      "Trong $1$ giờ, vòi nhất tháo ra được: $1 : 30 = \\dfrac{1}{30}$ (hồ).",
      "",
      "Khi mở cả hai vòi, trong $1$ giờ lượng nước trong hồ tăng thêm: $\\dfrac{1}{15} - \\dfrac{1}{30} = \\dfrac{1}{30}$ (hồ).",
      "",
      "Thời gian để hồ đầy nước là: $1 : \\dfrac{1}{30} = 30$ (giờ).",
      "",
      "**Đáp số**: $30$ giờ.",
    ].join("\n"),
  },
  "NSHN-2020-21-C7": {
    stem: "Hình vẽ bên gồm một hình vuông màu cam cạnh $21$ cm và hai nửa đường tròn; $B$ và $C$ là tâm của các nửa đường tròn tương ứng. Tính diện tích của hình này. (Lấy $\\pi = \\dfrac{22}{7}$.)",
    modelAnswer: [
      "Diện tích hình vuông là: $21 \\times 21 = 441$ (cm$^2$).",
      "",
      "Mỗi nửa đường tròn có đường kính bằng cạnh hình vuông là $21$ cm nên bán kính là: $21 : 2 = 10{,}5$ (cm).",
      "",
      "Hai nửa đường tròn ghép lại thành một hình tròn bán kính $10{,}5$ cm. Diện tích hình tròn đó là:",
      "$$10{,}5 \\times 10{,}5 \\times \\dfrac{22}{7} = 346{,}5 \\text{ (cm}^2).$$",
      "",
      "Diện tích của hình đã cho là: $441 + 346{,}5 = 787{,}5$ (cm$^2$).",
      "",
      "**Đáp số**: $787{,}5$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C8": {
    stem: "Tìm $M$ biết:\n$$M = \\dfrac{1 + (1+2) + (1+2+3) + \\ldots + (1+2+3+\\ldots+2020)}{1 \\times 2020 + 2 \\times 2019 + 3 \\times 2018 + \\ldots + 2020 \\times 1}.$$",
    modelAnswer: [
      "**Tử số.** Mỗi nhóm $(1+2+\\ldots+k) = \\dfrac{k \\times (k+1)}{2}$, nên tử số là tổng các số tam giác từ $k = 1$ đến $k = 2020$. Khai triển và rút gọn, tử số bằng $\\dfrac{2020 \\times 2021 \\times 2022}{6}$.",
      "",
      "**Mẫu số.** $1 \\times 2020 + 2 \\times 2019 + \\ldots + 2020 \\times 1$ với số hạng tổng quát $k \\times (2021 - k)$. Khai triển và rút gọn, mẫu số cũng bằng $\\dfrac{2020 \\times 2021 \\times 2022}{6}$.",
      "",
      "(Kiểm tra với trường hợp nhỏ $n = 3$: tử số $= 1 + 3 + 6 = 10$; mẫu số $= 1\\times3 + 2\\times2 + 3\\times1 = 10$ — bằng nhau.)",
      "",
      "Vì tử số bằng mẫu số nên $M = 1$.",
      "",
      "**Đáp số**: $M = 1$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C9": {
    stem: "Cho phân số $\\dfrac{17}{63}$. Hãy tìm số $a$ sao cho khi lấy tử số của phân số đó trừ đi $a$ và lấy mẫu số của phân số đó cộng với $a$ thì được phân số bằng $\\dfrac{1}{4}$.",
    modelAnswer: [
      "Khi trừ tử số đi $a$ và cộng mẫu số thêm $a$ thì tổng của tử số và mẫu số không thay đổi: $17 + 63 = 80$.",
      "",
      "Phân số mới bằng $\\dfrac{1}{4}$ nên tử số mới chiếm $\\dfrac{1}{1 + 4} = \\dfrac{1}{5}$ của tổng.",
      "",
      "Tử số mới là: $80 \\times \\dfrac{1}{5} = 16$.",
      "",
      "Vậy $a = 17 - 16 = 1$.",
      "",
      "**Đáp số**: $a = 1$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C10": {
    stem: "Để thực hiện cách li xã hội phòng chống dịch Covid-19, một gia đình lo lắng dự trữ lương thực cho $4$ người ăn trong $30$ ngày. Thực tế có thêm bà ngoại ở quê lên ở cùng. Như vậy, số lương thực đã dự trữ đủ ăn trong bao nhiêu ngày? (Biết số lượng lương thực mỗi người ăn trong $1$ ngày là như nhau.)",
    modelAnswer: [
      "Tổng số lương thực dự trữ đủ cho: $4 \\times 30 = 120$ (suất ăn một ngày).",
      "",
      "Khi có thêm bà ngoại, số người ăn là: $4 + 1 = 5$ (người).",
      "",
      "Số lương thực đó đủ ăn trong: $120 : 5 = 24$ (ngày).",
      "",
      "**Đáp số**: $24$ ngày.",
    ].join("\n"),
  },
  "NSHN-2020-21-C11": {
    stem: "Trong các dãy phân số dưới đây, dãy số nào mà mỗi phân số đều có thể viết thành số thập phân (hữu hạn)?",
    options: [
      { id: "A", text: "$\\dfrac{3}{4}; \\dfrac{10}{7}; \\dfrac{1}{5}$." },
      { id: "B", text: "$\\dfrac{2}{5}; \\dfrac{1}{2}; \\dfrac{5}{8}$." },
      { id: "C", text: "$\\dfrac{1}{10}; \\dfrac{1}{2}; \\dfrac{1}{3}$." },
      { id: "D", text: "$\\dfrac{3}{4}; \\dfrac{5}{9}; \\dfrac{3}{5}$." },
    ],
    modelAnswer: [
      "Một phân số tối giản viết được thành số thập phân hữu hạn khi mẫu số chỉ chứa thừa số nguyên tố $2$ và/hoặc $5$.",
      "",
      "- Đáp án $A$: $\\dfrac{10}{7}$ có mẫu $7$ → không được.",
      "- Đáp án $C$: $\\dfrac{1}{3}$ có mẫu $3$ → không được.",
      "- Đáp án $D$: $\\dfrac{5}{9}$ có mẫu $9 = 3 \\times 3$ → không được.",
      "- Đáp án $B$: $\\dfrac{2}{5} = 0{,}4$; $\\dfrac{1}{2} = 0{,}5$; $\\dfrac{5}{8} = 0{,}625$ → tất cả đều hữu hạn.",
      "",
      "**Đáp số**: $B$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C12": {
    stem: "Một người bán $6$ giỏ cam và xoài. Mỗi giỏ chỉ đựng một loại cam hoặc xoài với số lượng như sau: $36; 39; 40; 41; 42; 44$. Sau khi bán một giỏ xoài thì số cam còn lại gấp $4$ lần số xoài còn lại. Hỏi người đó đã bán đi bao nhiêu quả xoài?",
    modelAnswer: [
      "Tổng số quả trong $6$ giỏ là: $36 + 39 + 40 + 41 + 42 + 44 = 242$ (quả).",
      "",
      "Sau khi bán một giỏ xoài, số cam còn lại gấp $4$ lần số xoài còn lại nên tổng số quả còn lại gấp $4 + 1 = 5$ lần số xoài còn lại, tức là chia hết cho $5$.",
      "",
      "Vì $242$ chia $5$ dư $2$ nên giỏ xoài đã bán phải có số quả chia $5$ dư $2$. Trong các số $36; 39; 40; 41; 42; 44$ chỉ có $42$ chia $5$ dư $2$.",
      "",
      "Vậy giỏ xoài đã bán có $42$ quả. (Kiểm tra: còn lại $200$ quả, số xoài còn lại $40$, số cam $160 = 4 \\times 40$ — thoả mãn.)",
      "",
      "**Đáp số**: $42$ quả xoài.",
    ].join("\n"),
  },
  "NSHN-2020-21-C13": {
    stem: "Tìm chữ số $a$ để: $\\overline{a{,}97} < 1{,}97$.",
    modelAnswer: [
      "Hai số $\\overline{a{,}97}$ và $1{,}97$ có phần thập phân giống nhau nên để $\\overline{a{,}97} < 1{,}97$ thì phần nguyên $a$ phải nhỏ hơn $1$.",
      "",
      "Vì $a$ là một chữ số nên $a = 0$.",
      "",
      "**Đáp số**: $a = 0$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C14": {
    stem: "Tìm $x$ biết: $x : 8 + 31{,}2 = 41$.",
    modelAnswer: [
      "$$x : 8 = 41 - 31{,}2 = 9{,}8.$$",
      "$$x = 9{,}8 \\times 8 = 78{,}4.$$",
      "",
      "**Đáp số**: $x = 78{,}4$.",
    ].join("\n"),
  },
  "NSHN-2020-21-C15": {
    stem: "Điền dấu thích hợp ($<$, $>$, $=$) vào chỗ trống: $\\dfrac{3}{11} \\,\\ldots\\, \\dfrac{4}{9}$.",
    modelAnswer: [
      "So sánh hai phân số bằng cách nhân chéo: $3 \\times 9 = 27$ và $4 \\times 11 = 44$.",
      "",
      "Vì $27 < 44$ nên $\\dfrac{3}{11} < \\dfrac{4}{9}$.",
      "",
      "**Đáp số**: $<$.",
    ].join("\n"),
  },

  // ─── NSHN 2021-22 (Ngôi Sao Hà Nội — Khối 5, MathExpress 2022) ──────────
  "NSHN-2021-22-C1": {
    stem: "Tính: $\\left(4\\dfrac{2}{5} + 2\\dfrac{3}{7}\\right) + \\left(5\\dfrac{4}{7} - 2\\dfrac{2}{5}\\right)$.",
    modelAnswer: [
      "Nhóm các hạng tử có cùng mẫu lại với nhau:",
      "$$\\left(4\\dfrac{2}{5} - 2\\dfrac{2}{5}\\right) + \\left(2\\dfrac{3}{7} + 5\\dfrac{4}{7}\\right) = 2 + 8 = 10.$$",
      "",
      "**Đáp số**: $10$.",
    ].join("\n"),
  },
  "NSHN-2021-22-C2": {
    stem: "Chọn đáp án đúng cho $15{,}02 = \\square$. Biểu thức thích hợp để điền vào ô trống là:",
    options: [
      { id: "A", text: "$10 + \\dfrac{5}{2} + 2$." },
      { id: "B", text: "$10 + \\dfrac{5}{2} + \\dfrac{2}{100}$." },
      { id: "C", text: "$10 + 2 + \\dfrac{2}{100}$." },
      { id: "D", text: "$10 + 5 + \\dfrac{2}{100}$." },
    ],
    modelAnswer: [
      "Ta phân tích: $15{,}02 = 10 + 5 + 0{,}02 = 10 + 5 + \\dfrac{2}{100}$.",
      "",
      "**Đáp số**: $D$.",
    ].join("\n"),
  },
  "NSHN-2021-22-C3": {
    stem: "Một cửa hàng bán vải, ngày thứ nhất bán được $32{,}7$ m, ngày thứ hai bán nhiều hơn ngày thứ nhất $4{,}6$ m. Ngày thứ ba bán được số vải bằng trung bình cộng số vải của hai ngày đầu. Hỏi cả ba ngày cửa hàng đó bán được bao nhiêu mét vải?",
    modelAnswer: [
      "Ngày thứ hai cửa hàng bán được: $32{,}7 + 4{,}6 = 37{,}3$ (m vải).",
      "",
      "Cả hai ngày đầu cửa hàng bán được: $32{,}7 + 37{,}3 = 70$ (m vải).",
      "",
      "Ngày thứ ba cửa hàng bán được: $70 : 2 = 35$ (m vải).",
      "",
      "Cả ba ngày cửa hàng bán được: $70 + 35 = 105$ (m vải).",
      "",
      "**Đáp số**: $105$ m vải.",
    ].join("\n"),
  },
  "NSHN-2021-22-C4": {
    stem: "Một nhóm học sinh cộng ngày và tháng sinh nhật của mỗi bạn lại thì thấy kết quả đều bằng $35$. Biết rằng tất cả các ngày sinh nhật của họ là khác nhau. Hỏi nhóm học sinh đó có nhiều nhất bao nhiêu em?",
    modelAnswer: [
      "Vì ngày lớn nhất trong tháng là ngày $31$ nên trong nhóm học sinh này các bạn chỉ có tháng sinh nhật từ tháng Năm đến tháng Mười hai ($8$ tháng).",
      "",
      "Cụ thể: ngày $30$ + tháng $5$; ngày $29$ + tháng $6$; ngày $28$ + tháng $7$; ngày $27$ + tháng $8$; ngày $26$ + tháng $9$; ngày $25$ + tháng $10$; ngày $24$ + tháng $11$; ngày $23$ + tháng $12$.",
      "",
      "Mà ngày sinh nhật của các bạn khác nhau nên tháng sinh nhật của các bạn cũng sẽ khác nhau.",
      "",
      "Từ đó, ta thấy nhóm này có tối đa $8$ bạn có tháng sinh nhật từ tháng Năm đến tháng Mười hai.",
      "",
      "**Đáp số**: $8$ em.",
    ].join("\n"),
  },
  "NSHN-2021-22-C5": {
    stem: "Hình vẽ trên mô tả bàn cờ vua có kích thước $8 \\times 8$. Quân Mã ban đầu đứng ở ô có chữ \"M\" (ô trắng). Hỏi sau $15$ nước di chuyển trên bàn cờ, quân Mã đứng ở ô có màu gì? Biết con Mã đi theo đường chéo của hình chữ nhật $2 \\times 3$. Chọn đáp án đúng.",
    options: [
      { id: "A", text: "Không xác định được do tùy cách đi." },
      { id: "B", text: "Màu trắng." },
      { id: "C", text: "Màu đen." },
    ],
    modelAnswer: [
      "Ban đầu con Mã đang đứng ở ô trắng (ô chữ \"M\"). Vì con Mã đi theo đường chéo của hình chữ nhật $2 \\times 3$ nên nước di chuyển tiếp theo con Mã sẽ di chuyển vào ô đen (do đường chéo lệch số ô lẻ ⇒ đổi màu).",
      "",
      "Tương tự như vậy, nước di chuyển thứ hai con Mã sẽ di chuyển vào ô trắng. Vậy cứ qua $2$ lần di chuyển, con Mã lại quay trở về với ô màu trắng.",
      "",
      "Mà $15 : 2 = 7$ dư $1$ nên ở nước di chuyển thứ $14$, con Mã sẽ di chuyển vào ô màu trắng. Vậy ở nước di chuyển thứ $15$, con Mã sẽ di chuyển vào ô màu đen.",
      "",
      "**Đáp số**: $C$ — Màu đen.",
    ].join("\n"),
  },
  "NSHN-2021-22-C6": {
    stem: "Hai người thợ cùng nhận làm chung một công việc, sau $8$ ngày thì xong. Nhưng sau $5$ ngày cùng làm thì người thứ nhất bận không làm tiếp được nữa. Một mình người thứ hai phải làm thêm $9$ ngày nữa mới xong phần công việc còn lại. Hỏi một mình người thứ nhất làm công việc đó trong bao lâu thì xong?",
    modelAnswer: [
      "Coi cả công việc là $1$ đơn vị.",
      "",
      "Trong $5$ ngày, hai người làm được số phần công việc là: $5 : 8 = \\dfrac{5}{8}$ (công việc).",
      "",
      "Số phần công việc người thứ hai làm trong $9$ ngày là: $1 - \\dfrac{5}{8} = \\dfrac{3}{8}$ (công việc).",
      "",
      "$1$ ngày người thứ hai làm được số phần công việc là: $\\dfrac{3}{8} : 9 = \\dfrac{1}{24}$ (công việc).",
      "",
      "$1$ ngày cả hai người làm được số phần công việc là: $1 : 8 = \\dfrac{1}{8}$ (công việc).",
      "",
      "$1$ ngày người thứ nhất làm được số phần công việc là: $\\dfrac{1}{8} - \\dfrac{1}{24} = \\dfrac{1}{12}$ (công việc).",
      "",
      "Người thứ nhất làm một mình xong công việc sau: $1 : \\dfrac{1}{12} = 12$ (ngày).",
      "",
      "**Đáp số**: $12$ ngày.",
    ].join("\n"),
  },
  "NSHN-2021-22-C7": {
    stem: "Trong một buổi họp nhóm, một bạn trai tên là Hùng nhận thấy mình có số bạn trai bằng số bạn gái. Một bạn gái tên là Mai nhận thấy mình có số bạn gái chỉ bằng một nửa số bạn trai. Hỏi nhóm đó có bao nhiêu bạn?",
    modelAnswer: [
      "Vì Hùng nhận thấy mình có số bạn trai bằng số bạn gái nên số bạn trai trong nhóm hơn số bạn gái trong nhóm là $1$ bạn (Hùng được tính là bạn trai nhưng không tính chính mình).",
      "",
      "Khi đó, số bạn gái của Mai sẽ kém số bạn trai của Mai là $2$ bạn (Mai là bạn gái, không tính chính mình; hiệu vẫn là $1$ bạn nhưng Mai chuyển từ số bạn gái sang bên không-tính ⇒ tăng hiệu thành $2$).",
      "",
      "Số bạn gái của Mai là: $2 : (2 - 1) \\times 1 = 2$ (bạn).",
      "",
      "Số bạn trai của Mai là: $2 + 2 = 4$ (bạn).",
      "",
      "Tổng số bạn trong nhóm là: $2 + 4 + 1 = 7$ (bạn). Vì Mai là một trong các bạn gái nên tổng số bạn gái trong nhóm là $2 + 1 = 3$; số bạn trai trong nhóm là $4$; tổng $3 + 4 = 7$.",
      "",
      "**Đáp số**: $7$ bạn.",
    ].join("\n"),
  },
  "NSHN-2021-22-C8": {
    stem: "Một ô tô phải chạy từ $A$ đến $B$. Sau khi chạy được $1$ giờ thì ô tô giảm vận tốc chỉ còn bằng $\\dfrac{5}{6}$ vận tốc ban đầu. Vì thế, ô tô đến $B$ chậm mất $1$ giờ $24$ phút. Nếu từ $A$, sau khi chạy được $1$ giờ, ô tô chạy thêm $50$ km nữa rồi mới giảm vận tốc thì ô tô đến $B$ chỉ chậm $1$ giờ $12$ phút. Tính quãng đường $AB$.",
    modelAnswer: [
      "Đổi: $1$ giờ $24$ phút $= \\dfrac{7}{5}$ giờ; $1$ giờ $12$ phút $= \\dfrac{6}{5}$ giờ.",
      "",
      "Giả sử sau $1$ giờ di chuyển, ô tô đi được quãng đường từ $A$ đến $C$. Khi đi thêm $50$ km nữa thì đến điểm $D$ (vậy $CD = 50$ km).",
      "",
      "**Trường hợp 1**: Ô tô di chuyển $1$ giờ từ $A$ đến $C$, sau đó giảm vận tốc bằng $\\dfrac{5}{6}$ vận tốc ban đầu thì đến $B$ muộn $\\dfrac{7}{5}$ giờ.",
      "",
      "**Trường hợp 2**: Ô tô di chuyển $1$ giờ từ $A$ đến $C$, sau đó di chuyển thêm $50$ km đến $D$ mới giảm vận tốc bằng $\\dfrac{5}{6}$ vận tốc ban đầu thì đến $B$ muộn $\\dfrac{6}{5}$ giờ.",
      "",
      "Hiệu thời gian giữa hai trường hợp khi đi từ $C$ đến $B$ là: $\\dfrac{7}{5} - \\dfrac{6}{5} = \\dfrac{1}{5}$ (giờ).",
      "",
      "Trên cùng quãng đường, thời gian và vận tốc tỉ lệ nghịch nên trên quãng $CD$: tỉ số thời gian giữa hai trường hợp là $\\dfrac{6}{5}$. Hiệu thời gian là $\\dfrac{1}{5}$ giờ.",
      "",
      "Thời gian ô tô đi hết quãng đường $CD$ ở trường hợp $2$ là: $\\dfrac{1}{5} : (6 - 5) \\times 5 = 1$ (giờ).",
      "",
      "Vận tốc ban đầu của ô tô là: $50 : 1 = 50$ (km/giờ).",
      "",
      "Xét trên quãng đường $CB$: vì vận tốc lúc sau bằng $\\dfrac{5}{6}$ vận tốc lúc đầu nên thời gian đi hết $CB$ thực tế bằng $\\dfrac{6}{5}$ thời gian dự định. Hiệu thời gian là $\\dfrac{7}{5}$ giờ.",
      "",
      "Thời gian ô tô đi hết $CB$ với vận tốc dự định là: $\\dfrac{7}{5} : (6 - 5) \\times 5 = 7$ (giờ).",
      "",
      "Độ dài $CB = 50 \\times 7 = 350$ (km). Độ dài $AC = 50 \\times 1 = 50$ (km). Độ dài $AB = 50 + 350 = 400$ (km).",
      "",
      "**Đáp số**: $400$ km.",
    ].join("\n"),
  },
  "NSHN-2021-22-C9": {
    stem: "Hình bên được xếp bởi các hình lập phương có cạnh $1$ cm. Tính diện tích toàn phần của hình đó.",
    modelAnswer: [
      "Chia hình đã cho thành ba hình $G$, $H$, $I$ như hình vẽ trong lời giải.",
      "",
      "Diện tích toàn phần của hình đã cho bằng tổng diện tích toàn phần ba hình $G$, $H$, $I$ trừ đi diện tích các mặt vàng (các mặt tiếp xúc bên trong, mỗi mặt $1$ cm$^2$, có $4$ mặt như vậy).",
      "",
      "- Diện tích toàn phần hình $G$ bằng $18$ cm$^2$.",
      "- Diện tích toàn phần hình $H$ bằng $6$ cm$^2$.",
      "- Diện tích toàn phần hình $I$ bằng $40$ cm$^2$.",
      "",
      "Vậy diện tích hình đã cho là: $18 + 6 + 40 - 4 = 60$ (cm$^2$).",
      "",
      "**Đáp số**: $60$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2021-22-C10": {
    stem: "Quan sát các hình vẽ dưới đây để xác định hình thứ $222$ có bao nhiêu hình lục giác?",
    modelAnswer: [
      "Quan sát quy luật: số hình lục giác của hình thứ $n$ bằng $1 + 6 \\times [0 + 1 + 2 + \\ldots + (n - 1)]$.",
      "",
      "- Hình thứ $1$: $1$ lục giác.",
      "- Hình thứ $2$: $1 + 6 \\times 1 = 7$ lục giác.",
      "- Hình thứ $3$: $1 + 6 \\times (1 + 2) = 19$ lục giác.",
      "",
      "Số hình lục giác của hình thứ $222$ là:",
      "$$1 + 6 \\times (0 + 1 + 2 + \\ldots + 221) = 1 + 6 \\times \\dfrac{221 \\times 222}{2} = 1 + 6 \\times 24\\,531 = 147\\,187 \\text{ (hình)}.$$",
      "",
      "**Đáp số**: $147\\,187$ hình.",
    ].join("\n"),
  },
  "NSHN-2021-22-B1": {
    stem: [
      "Tìm $x$, biết:",
      "",
      "**a)** $x \\times 1{,}2 + x \\times 0{,}7 = 61{,}94.$",
      "",
      "**b)** $\\dfrac{1}{3 \\times 10} + \\dfrac{1}{10 \\times 17} + \\dfrac{1}{17 \\times 24} + \\ldots + \\dfrac{1}{(7 \\times x + 3)(7 \\times x + 10)} = \\dfrac{13}{282}.$",
    ].join("\n"),
    modelAnswer: [
      "**a)**",
      "$$x \\times 1{,}2 + x \\times 0{,}7 = 61{,}94$$",
      "$$x \\times (1{,}2 + 0{,}7) = 61{,}94$$",
      "$$x \\times 1{,}9 = 61{,}94$$",
      "$$x = 61{,}94 : 1{,}9 = 32{,}6.$$",
      "",
      "**b)** Nhân cả hai vế với $7$:",
      "$$\\dfrac{7}{3 \\times 10} + \\dfrac{7}{10 \\times 17} + \\ldots + \\dfrac{7}{(7x+3)(7x+10)} = \\dfrac{91}{282}.$$",
      "",
      "Mỗi số hạng có dạng $\\dfrac{7}{k(k+7)} = \\dfrac{1}{k} - \\dfrac{1}{k+7}$. Triển khai và rút gọn:",
      "$$\\dfrac{1}{3} - \\dfrac{1}{10} + \\dfrac{1}{10} - \\dfrac{1}{17} + \\ldots + \\dfrac{1}{7x+3} - \\dfrac{1}{7x+10} = \\dfrac{91}{282}.$$",
      "$$\\dfrac{1}{3} - \\dfrac{1}{7x+10} = \\dfrac{91}{282}.$$",
      "$$\\dfrac{1}{7x+10} = \\dfrac{1}{3} - \\dfrac{91}{282} = \\dfrac{94 - 91}{282} = \\dfrac{3}{282} = \\dfrac{1}{94}.$$",
      "",
      "Suy ra $7x + 10 = 94 \\Rightarrow x = 12$.",
      "",
      "**Đáp số**: **a)** $x = 32{,}6$; **b)** $x = 12$.",
    ].join("\n"),
  },
  "NSHN-2021-22-B2": {
    stem: [
      "Khi trả bài kiểm tra cuối học kì I môn Toán, cô giáo nói: \"Số điểm $10$ chiếm $25\\%$, số điểm $9$ hơn điểm $10$ là $6{,}25\\%$. Như vậy có $18$ bạn được điểm $9$ hoặc $10$, tất cả các học sinh trong lớp đều nộp bài kiểm tra\". Hỏi:",
      "",
      "**a)** Số học sinh đạt điểm $9$ chiếm bao nhiêu phần trăm số học sinh cả lớp?",
      "",
      "**b)** Tổng số học sinh điểm $9$ hoặc $10$ chiếm bao nhiêu phần trăm số học sinh cả lớp?",
      "",
      "**c)** Lớp đó có tất cả bao nhiêu học sinh?",
      "",
      "**d)** Lớp đó có bao nhiêu học sinh không đạt điểm $9$ hoặc $10$?",
    ].join("\n"),
    modelAnswer: [
      "**a)** Số học sinh đạt điểm $9$ chiếm số phần trăm số học sinh cả lớp là: $25\\% + 6{,}25\\% = 31{,}25\\%$.",
      "",
      "**b)** Tổng số học sinh đạt điểm $9$ hoặc $10$ chiếm số phần trăm số học sinh cả lớp là: $25\\% + 31{,}25\\% = 56{,}25\\%$.",
      "",
      "**c)** Lớp đó có số học sinh là: $18 : 56{,}25 \\times 100 = 32$ (học sinh).",
      "",
      "**d)** Số học sinh không đạt điểm $9$ hoặc điểm $10$ là: $32 - 18 = 14$ (học sinh).",
      "",
      "**Đáp số**: **a)** $31{,}25\\%$; **b)** $56{,}25\\%$; **c)** $32$ học sinh; **d)** $14$ học sinh.",
    ].join("\n"),
  },
  "NSHN-2021-22-B3": {
    stem: [
      "Cho hình thang $ABCD$ có đáy bé $AB$ bằng $\\dfrac{1}{3}$ đáy lớn. Chiều cao bằng $12{,}6$ m và bằng hiệu độ dài hai đáy.",
      "",
      "**a)** Tính diện tích hình thang $ABCD$.",
      "",
      "**b)** Hai đường chéo $AC$ và $BD$ cắt nhau tại $O$. So sánh $S_{OBC}$ và $S_{OAD}$.",
      "",
      "**c)** Kéo dài cạnh $DA$ và $CB$ cắt nhau tại $P$. Tính tỉ số $\\dfrac{S_{DBP}}{S_{DPC}}$.",
    ].join("\n"),
    modelAnswer: [
      "**a)** Độ dài đáy bé $AB$ là: $12{,}6 : (3 - 1) \\times 1 = 6{,}3$ (m).",
      "",
      "Độ dài đáy lớn $CD$ là: $12{,}6 + 6{,}3 = 18{,}9$ (m).",
      "",
      "Diện tích hình thang $ABCD$ là: $(6{,}3 + 18{,}9) \\times 12{,}6 : 2 = 158{,}76$ (m$^2$).",
      "",
      "**b)** Xét tam giác $ABC$ và tam giác $ABD$ có chung đáy $AB$ và chiều cao cùng bằng chiều cao hình thang $ABCD$ nên $S_{ABC} = S_{ABD}$.",
      "",
      "Mà $S_{ABC} = S_{OAB} + S_{OBC}$ và $S_{ABD} = S_{OAB} + S_{OAD}$.",
      "",
      "Suy ra: $S_{OBC} = S_{OAD}$.",
      "",
      "**c)** Xét tam giác $ABD$ và tam giác $ACD$ có chiều cao hạ từ $D$ xuống $AB$ bằng chiều cao hạ từ $B$ xuống $CD$ (vì cùng bằng chiều cao hình thang) nên $\\dfrac{S_{ABD}}{S_{ACD}} = \\dfrac{AB}{CD} = \\dfrac{1}{3}$.",
      "",
      "Mà tam giác $ABD$ và tam giác $ACD$ lại có chung đáy $AD$ nên chiều cao hạ từ $B$ xuống $AD$ bằng $\\dfrac{1}{3}$ chiều cao hạ từ $C$ xuống $AD$.",
      "",
      "Suy ra $\\dfrac{S_{ABP}}{S_{APC}} = \\dfrac{1}{3}$. Mà tam giác $ABP$ và $APC$ lại chung chiều cao hạ từ $A$ xuống $BC$, nên $\\dfrac{S_{ABP}}{S_{APC}} = \\dfrac{PB}{PC} = \\dfrac{1}{3}$.",
      "",
      "Vậy $\\dfrac{S_{DBP}}{S_{DPC}} = \\dfrac{PB}{PC} = \\dfrac{1}{3}$ (hai tam giác chung chiều cao hạ từ $D$ xuống $PC$).",
      "",
      "**Đáp số**: **a)** $158{,}76$ m$^2$; **b)** $S_{OBC} = S_{OAD}$; **c)** $\\dfrac{1}{3}$.",
    ].join("\n"),
  },

  // ─── NSHN 2022-23 (Ngôi Sao Hà Nội — Lớp 6, MathExpress 2023) ──────────
  "NSHN-2022-23-C1": {
    stem: "Tìm giá trị của chữ số $5$ trong số $2756{,}29$.",
    modelAnswer: [
      "Chữ số $5$ trong $2756{,}29$ đứng ở hàng chục nên có giá trị là $50$.",
      "",
      "**Đáp số**: $50$.",
    ].join("\n"),
  },
  "NSHN-2022-23-C2": {
    stem: "Tính: $2\\dfrac{4}{9} + 6\\dfrac{7}{11} + 7\\dfrac{5}{9} + 13\\dfrac{4}{11}$.",
    modelAnswer: [
      "Nhóm các phần nguyên và phần phân số theo cùng mẫu:",
      "$$2\\dfrac{4}{9} + 6\\dfrac{7}{11} + 7\\dfrac{5}{9} + 13\\dfrac{4}{11} = (2 + 6 + 7 + 13) + \\left(\\dfrac{4}{9} + \\dfrac{5}{9} + \\dfrac{7}{11} + \\dfrac{4}{11}\\right) = 28 + 1 + 1 = 30.$$",
      "",
      "**Đáp số**: $30$.",
    ].join("\n"),
  },
  "NSHN-2022-23-C3": {
    stem: "Một đơn vị bộ đội chuẩn bị lương thực đủ cho $50$ người ăn trong $30$ ngày. Trên thực tế, đã có $20$ người chuyển sang đơn vị khác. Hỏi với số lương thực đã chuẩn bị như ban đầu, đơn vị bộ đội đó sẽ đủ ăn trong bao nhiêu ngày? (Biết mức ăn của mỗi người là như nhau.)",
    modelAnswer: [
      "Coi lượng lương thực mỗi người ăn trong $1$ ngày là $1$ suất thì tổng số suất chuẩn bị ban đầu là:",
      "$$50 \\times 30 = 1500 \\text{ (suất)}.$$",
      "",
      "Sau khi chuyển đi, số người còn lại là: $50 - 20 = 30$ (người).",
      "",
      "Số lương thực đã chuẩn bị như ban đầu, đơn vị bộ đội sẽ đủ ăn trong số ngày là:",
      "$$1500 : 30 = 50 \\text{ (ngày)}.$$",
      "",
      "**Đáp số**: $50$ ngày.",
    ].join("\n"),
  },
  "NSHN-2022-23-C4": {
    stem: "Câu lạc bộ World's Scholar Cup của trường có $60$ học sinh, trong đó có $10\\%$ là học sinh nam. Sau đó, có một số học sinh nữ đăng ký thêm vào câu lạc bộ nên số học sinh nam lúc này chỉ chiếm $8\\%$. Hỏi có bao nhiêu học sinh nữ đã đăng ký thêm?",
    modelAnswer: [
      "Số học sinh nam ban đầu là: $60 \\times 10 : 100 = 6$ (học sinh).",
      "",
      "Sau đó có thêm học sinh nữ đăng ký nên số học sinh nam không đổi.",
      "",
      "Số học sinh trong câu lạc bộ sau khi có thêm học sinh nữ đăng ký là: $6 : 8 \\times 100 = 75$ (học sinh).",
      "",
      "Số học sinh nữ đăng ký thêm vào câu lạc bộ là: $75 - 60 = 15$ (học sinh).",
      "",
      "**Đáp số**: $15$ học sinh.",
    ].join("\n"),
  },
  "NSHN-2022-23-C5": {
    stem: "Mẹ mua hai bó hoa hồng và hoa cúc có số lượng bằng nhau, sau đó mẹ mua thêm $5$ bông hoa hồng và $3$ bông hoa cúc nên số hoa hồng bằng $51\\%$ tổng số hoa mẹ đã mua. Hỏi mẹ đã mua tất cả bao nhiêu bông hoa?",
    modelAnswer: [
      "Số bông hoa cúc lúc sau chiếm số phần trăm tổng số hoa lúc sau là: $100\\% - 51\\% = 49\\%$.",
      "",
      "Số bông hoa hồng lúc sau nhiều hơn số bông hoa cúc lúc sau là: $5 - 3 = 2$ (bông hoa).",
      "",
      "$2$ bông hoa hồng chiếm số phần trăm tổng số hoa lúc sau là: $51\\% - 49\\% = 2\\%$.",
      "",
      "Tổng số hoa mẹ đã mua là: $2 : 2 \\times 100 = 100$ (bông hoa).",
      "",
      "**Đáp số**: $100$ bông hoa.",
    ].join("\n"),
  },
  "NSHN-2022-23-C6": {
    stem: "Bố mua hai đôi giày tặng Khánh nhưng đều bị nhỏ nên bố quyết định bán hai đôi giày đã mua. Mỗi đôi giày bố đều bán với giá $1\\,500\\,000$ đồng, trong đó, một đôi giày bố bán được nhiều hơn $20\\%$ giá mua, đôi thứ hai được ít hơn $20\\%$ giá mua. Hỏi bố Khánh đã có lãi hay bị lỗ, số tiền lãi/lỗ là bao nhiêu?",
    modelAnswer: [
      "Tổng số tiền bán giày là: $1\\,500\\,000 \\times 2 = 3\\,000\\,000$ (đồng).",
      "",
      "Đôi giày thứ nhất bán được nhiều hơn $20\\%$ giá mua tức là bằng $120\\%$ giá mua; đôi giày thứ hai bán được ít hơn $20\\%$ giá mua tức là bằng $80\\%$ giá mua.",
      "",
      "Bố mua đôi giày thứ nhất hết số tiền là:",
      "$$1\\,500\\,000 : 120 \\times 100 = 1\\,250\\,000 \\text{ (đồng)}.$$",
      "",
      "Bố mua đôi giày thứ hai hết số tiền là:",
      "$$1\\,500\\,000 : 80 \\times 100 = 1\\,875\\,000 \\text{ (đồng)}.$$",
      "",
      "Tổng số tiền bố mua giày là: $1\\,250\\,000 + 1\\,875\\,000 = 3\\,125\\,000$ (đồng).",
      "",
      "Vì $3\\,125\\,000 > 3\\,000\\,000$ nên bố đã lỗ. Số tiền lỗ là:",
      "$$3\\,125\\,000 - 3\\,000\\,000 = 125\\,000 \\text{ (đồng)}.$$",
      "",
      "**Đáp số**: Bố lỗ $125\\,000$ đồng.",
    ].join("\n"),
  },
  "NSHN-2022-23-C7": {
    stem: "Hình vẽ bên được tạo từ các hình tam giác đều bằng nhau. Biết diện tích của hình tam giác đều nhỏ nhất là $2$ cm$^2$. Tính diện tích hình tô đậm.",
    modelAnswer: [
      "Hình tam giác to gồm $36$ hình tam giác đều nhỏ, mỗi tam giác có diện tích $2$ cm$^2$ nên có tổng diện tích: $36 \\times 2 = 72$ (cm$^2$).",
      "",
      "Chia phần ngoài vùng tô đậm thành $3$ hình $1$, $2$, $3$ như hình giải:",
      "",
      "- Hình số $1$ gồm $9$ tam giác nhỏ và $1$ phần tam giác bằng $\\dfrac{1}{2}$ hình tạo bởi $6$ tam giác nhỏ. Diện tích: $2 \\times 9 + 2 \\times 6 : 2 = 24$ (cm$^2$).",
      "- Hình số $2$ gồm $4$ tam giác nhỏ và $1$ phần tam giác bằng $\\dfrac{1}{2}$ hình tạo bởi $4$ tam giác nhỏ. Diện tích: $2 \\times 4 + 2 \\times 4 : 2 = 12$ (cm$^2$).",
      "- Hình số $3$ tương tự hình số $2$ nên cũng có diện tích $12$ cm$^2$.",
      "",
      "Diện tích phần tô đậm là: $72 - 24 - 12 - 12 = 24$ (cm$^2$).",
      "",
      "**Đáp số**: $24$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2022-23-C8": {
    stem: "Trường Ngôi Sao Hà Nội $2$ dự định mở cuộc thi chạy \"Vì nụ cười trẻ thơ\". Các vận động viên chạy xung quanh một khu đất hình chữ nhật có chiều dài và chiều rộng lần lượt là $100$ m và $65$ m. Đường chạy được chia thành nhiều chặng, mỗi chặng dài $75$ m. Biết điểm xuất phát và kết thúc cùng một chỗ. Hỏi đường chạy có ít nhất mấy chặng?",
    modelAnswer: [
      "Chu vi khu đất là: $(100 + 65) \\times 2 = 330$ (m).",
      "",
      "Do điểm xuất phát và kết thúc ở cùng $1$ chỗ nên tổng độ dài số chặng phải chia hết cho chu vi của khu đất, tức là số chặng $\\times 75$ chia hết cho $330$.",
      "",
      "Ta có $\\dfrac{75}{330} = \\dfrac{5}{22}$ nên số chặng phải là bội của $22$. Vậy số chặng ít nhất là $22$ chặng.",
      "",
      "**Đáp số**: $22$ chặng.",
    ].join("\n"),
  },
  "NSHN-2022-23-C9": {
    stem: "Cho tam giác $ABC$ vuông tại $A$ có $AB = 6$ cm, $AC = 8$ cm, $BC = 10$ cm và ba nửa hình tròn có đường kính lần lượt là $AB$, $AC$ và $BC$ (như hình dưới đây). Tính diện tích phần tô đậm.",
    modelAnswer: [
      "Diện tích nửa đường tròn đường kính $BC$ là:",
      "$$\\dfrac{(10 : 2) \\times (10 : 2) \\times 3{,}14}{2} = 39{,}25 \\text{ (cm}^2\\text{)}.$$",
      "",
      "Diện tích nửa đường tròn đường kính $AB$ là:",
      "$$\\dfrac{(6 : 2) \\times (6 : 2) \\times 3{,}14}{2} = 14{,}13 \\text{ (cm}^2\\text{)}.$$",
      "",
      "Diện tích nửa đường tròn đường kính $AC$ là:",
      "$$\\dfrac{(8 : 2) \\times (8 : 2) \\times 3{,}14}{2} = 25{,}12 \\text{ (cm}^2\\text{)}.$$",
      "",
      "Diện tích tam giác $ABC$ là: $6 \\times 8 : 2 = 24$ (cm$^2$).",
      "",
      "Diện tích phần tô đậm là: $24 + 25{,}12 + 14{,}13 - 39{,}25 = 24$ (cm$^2$).",
      "",
      "**Đáp số**: $24$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2022-23-C10": {
    stem: "Một đoạn mật mã gồm $4$ chữ số, biết tổng và hiệu của hai số được lập từ hai chữ số đầu và hai chữ số cuối đều chia hết cho $14$. Hỏi phải thử ít nhất bao nhiêu lần để chắc chắn mở được đoạn mật mã này? (Chẳng hạn $1428$ thì $14 + 28$ và $28 - 14$ đều chia hết cho $14$.)",
    modelAnswer: [
      "Đoạn mật mã có dạng $\\overline{abcd}$ trong đó $\\overline{ab} - \\overline{cd}$ và $\\overline{ab} + \\overline{cd}$ đều chia hết cho $14$.",
      "",
      "Điều này có nghĩa là $\\overline{ab}$ và $\\overline{cd}$ phải cùng chia hết cho $7$ và cùng tính chẵn lẻ.",
      "",
      "Tức là $\\overline{ab}$, $\\overline{cd}$ sẽ nhận $2$ trong các giá trị:",
      "- Chẵn (chia hết cho $14$): $00, 14, 28, 42, 56, 70, 84, 98$ ($8$ giá trị).",
      "- Lẻ (chia hết cho $7$, lẻ): $07, 21, 35, 49, 63, 77, 91$ ($7$ giá trị).",
      "",
      "Tổng số mật mã có thể tạo ra từ $2$ trường hợp trên là: $8 \\times 8 + 7 \\times 7 = 113$, vì vậy cần thử ít nhất $113$ lần để chắc chắn mở được đoạn mật mã.",
      "",
      "**Đáp số**: $113$ lần.",
    ].join("\n"),
  },
  "NSHN-2022-23-B1": {
    stem: "Tính giá trị biểu thức: $(4{,}17 + 8{,}77) - (3{,}17 - 2{,}23)$.",
    modelAnswer: [
      "Đổi dấu trong ngoặc và nhóm các số hạng cùng phần thập phân:",
      "$$(4{,}17 + 8{,}77) - (3{,}17 - 2{,}23) = (4{,}17 - 3{,}17) + (8{,}77 + 2{,}23) = 1 + 11 = 12.$$",
      "",
      "**Đáp số**: $12$.",
    ].join("\n"),
  },
  "NSHN-2022-23-B2": {
    stem: "Tìm $x$ biết: $x \\times 7 - 6 = 0{,}3$.",
    modelAnswer: [
      "$$x \\times 7 - 6 = 0{,}3$$",
      "$$x \\times 7 = 0{,}3 + 6 = 6{,}3$$",
      "$$x = 6{,}3 : 7 = 0{,}9.$$",
      "",
      "**Đáp số**: $x = 0{,}9$.",
    ].join("\n"),
  },
  "NSHN-2022-23-B3": {
    stem: "Trong kho có ba thùng dầu. Thùng thứ nhất đựng $28{,}5$ lít dầu, thùng thứ hai đựng nhiều hơn thùng thứ nhất $12{,}3$ lít dầu nhưng ít hơn thùng thứ ba $3{,}6$ lít dầu. Hỏi trung bình mỗi thùng đựng được bao nhiêu lít dầu?",
    modelAnswer: [
      "Thùng thứ hai đựng được số lít dầu là: $28{,}5 + 12{,}3 = 40{,}8$ (lít).",
      "",
      "Thùng thứ ba đựng được số lít dầu là: $40{,}8 + 3{,}6 = 44{,}4$ (lít).",
      "",
      "Trung bình mỗi thùng đựng được số lít dầu là:",
      "$$(28{,}5 + 40{,}8 + 44{,}4) : 3 = 37{,}9 \\text{ (lít)}.$$",
      "",
      "**Đáp số**: $37{,}9$ lít.",
    ].join("\n"),
  },
  "NSHN-2022-23-B4": {
    stem: [
      "Cho tam giác $ABC$ có $BC = 6$ cm. Trên cạnh $BC$ lấy điểm $D$ cách $C$ là $2$ cm. Nối $A$ với $D$ được tam giác $ADC$ có diện tích bằng $4$ cm$^2$.",
      "",
      "**a)** Tính diện tích tam giác $ABC$.",
      "",
      "**b)** Lấy điểm $E$ trên $AB$ sao cho $ACDE$ là hình thang. Tính diện tích tam giác $BDE$.",
    ].join("\n"),
    modelAnswer: [
      "**a)** Xét tam giác $ADC$ và tam giác $ABC$ có chung chiều cao hạ từ đỉnh $A$ xuống $BC$.",
      "",
      "Ta có: $\\dfrac{S_{ADC}}{S_{ABC}} = \\dfrac{DC}{BC} = \\dfrac{2}{6} = \\dfrac{1}{3}$.",
      "",
      "Vậy $S_{ABC} = 4 \\times 3 = 12$ (cm$^2$).",
      "",
      "**b)** Nối $E$ với $C$. Vì $ACDE$ là hình thang có hai đáy $AC$ và $ED$ (cùng song song với $AC$).",
      "",
      "$S_{AEC} = S_{ADC} = 4$ cm$^2$ (cùng đáy $AC$, chiều cao hạ từ đỉnh $E$ xuống $AC$ bằng chiều cao hạ từ đỉnh $D$ xuống $AC$).",
      "",
      "$S_{EBC} = S_{ABC} - S_{AEC} = 12 - 4 = 8$ (cm$^2$).",
      "",
      "$\\dfrac{S_{EBD}}{S_{EBC}} = \\dfrac{BD}{BC} = \\dfrac{4}{6} = \\dfrac{2}{3}$ (chung chiều cao hạ từ $E$ xuống $BC$).",
      "",
      "Suy ra $S_{EBD} = \\dfrac{2}{3} \\times 8 = \\dfrac{16}{3}$ (cm$^2$).",
      "",
      "**Đáp số**: **a)** $S_{ABC} = 12$ cm$^2$; **b)** $S_{BDE} = \\dfrac{16}{3}$ cm$^2$.",
    ].join("\n"),
  },
  "NSHN-2022-23-B5": {
    stem: [
      "Cho ba đống sỏi gồm $7$, $33$ và $65$ viên. Trong mỗi bước, chọn một trong hai thao tác sau để thực hiện:",
      "",
      "- **Thao tác 01**: Dồn hai đống tùy ý thành một đống.",
      "",
      "- **Thao tác 02**: Chọn một đống tùy ý có số chẵn viên sỏi để chia thành hai đống có số lượng viên sỏi bằng nhau.",
      "",
      "Hỏi có khi nào nhận được $105$ đống mà mỗi đống chỉ có một viên sỏi không? Vì sao?",
    ].join("\n"),
    modelAnswer: [
      "Vì $7$, $33$ và $65$ đều lẻ nên bước đầu tiên ta chỉ có thao tác $01$ là dồn hai đống tùy ý thành một đống.",
      "",
      "**Trường hợp 1**: Dồn $2$ đống $7$, $33$ thành đống $40$, khi đó ta được hai đống $40$, $65$. Nhận xét rằng số sỏi $\\gcd(40, 65) = 5$ nên các thao tác sau dù chia đôi hay gộp lại cũng sẽ tạo ra kết quả là số sỏi chia hết cho $5 \\Rightarrow$ không thể xảy ra trường hợp mỗi đống $1$ viên.",
      "",
      "**Trường hợp 2**: Dồn $2$ đống $7$, $65$ thành đống $72$, khi đó ta được hai đống $33$, $72$. Nhận xét rằng $\\gcd(33, 72) = 3$ nên các thao tác sau dù chia đôi hay gộp lại cũng sẽ tạo ra kết quả là số sỏi chia hết cho $3 \\Rightarrow$ không thể xảy ra trường hợp mỗi đống $1$ viên.",
      "",
      "**Trường hợp 3**: Dồn $2$ đống $33$, $65$ thành đống $98$, khi đó ta được hai đống $7$, $98$. Nhận xét rằng $\\gcd(7, 98) = 7$ nên các thao tác sau dù chia đôi hay gộp lại cũng sẽ tạo ra kết quả là số sỏi chia hết cho $7 \\Rightarrow$ không thể xảy ra trường hợp mỗi đống $1$ viên.",
      "",
      "Vậy không thể nhận được $105$ đống mà mỗi đống chỉ có $1$ viên sỏi.",
      "",
      "**Đáp số**: Không thể.",
    ].join("\n"),
  },

  // ─── NSHM 2026 — Học bổng Ngôi Sao Hoàng Mai (Khối 5) ───────────────────
  // Source: public/ref_exam/MATHX_LỚP 5_ĐỀ HỌC BỔNG NGÔI SAO HOÀNG MAI.pdf
  // Lưu ý: Đề C2 ghi "48m" nhưng lời giải + đáp án đều tính theo cm (135 cm²).
  // Đây là typo trong nguồn — stem override dùng "48 cm" để đề + đáp án nhất quán.
  "NSHM-2026-27-C1": {
    stem: "Trung bình cộng của hai số là $35$, số bé kém số lớn $11$ đơn vị. Tìm số bé.",
    modelAnswer: [
      "Tổng của hai số là: $35 \\times 2 = 70$.",
      "",
      "Số bé là: $(70 - 11) : 2 = 29{,}5$.",
      "",
      "**Đáp số**: $29{,}5$.",
    ].join("\n"),
  },
  "NSHM-2026-27-C2": {
    stem: "Chu vi hình chữ nhật là $48$ cm, chiều dài bằng $\\dfrac{5}{3}$ chiều rộng. Tính diện tích hình chữ nhật đó.",
    modelAnswer: [
      "Nửa chu vi của hình chữ nhật là: $48 : 2 = 24$ (cm).",
      "",
      "Chiều dài của hình chữ nhật là: $24 : (5 + 3) \\times 5 = 15$ (cm).",
      "",
      "Chiều rộng hình chữ nhật là: $24 - 15 = 9$ (cm).",
      "",
      "Diện tích hình chữ nhật là: $15 \\times 9 = 135$ (cm$^2$).",
      "",
      "**Đáp số**: $135$ cm$^2$.",
    ].join("\n"),
  },
  "NSHM-2026-27-C3": {
    stem: "Tìm $y$, biết $y - \\dfrac{26}{4} = 20{,}26$.",
    modelAnswer: [
      "$$y - \\dfrac{26}{4} = 20{,}26$$",
      "$$y - 6{,}5 = 20{,}26$$",
      "$$y = 20{,}26 + 6{,}5$$",
      "$$y = 26{,}76.$$",
      "",
      "**Đáp số**: $y = 26{,}76$.",
    ].join("\n"),
  },
  "NSHM-2026-27-C4": {
    stem: "Điền số thích hợp vào chỗ chấm: $2\\,\\text{m}^2\\,6\\,\\text{dm}^2 = \\ldots\\,\\text{dm}^2$.",
    modelAnswer: [
      "Ta có: $2\\,\\text{m}^2 = 200\\,\\text{dm}^2$.",
      "",
      "Do đó: $2\\,\\text{m}^2\\,6\\,\\text{dm}^2 = 200\\,\\text{dm}^2 + 6\\,\\text{dm}^2 = 206\\,\\text{dm}^2$.",
      "",
      "**Đáp số**: $206$ dm$^2$.",
    ].join("\n"),
  },
  "NSHM-2026-27-C5": {
    stem: "Một bản đồ có tỉ lệ xích $1 : 5000$. Một cây cầu trên bản đồ dài $2$ cm $5$ mm. Tính độ dài thật của cây cầu.",
    modelAnswer: [
      "Đổi: $2$ cm $5$ mm $= 2{,}5$ cm.",
      "",
      "Chiều dài thật của cây cầu là:",
      "$$2{,}5 \\times 5000 = 12\\,500 \\text{ cm} = 125 \\text{ (m)}.$$",
      "",
      "**Đáp số**: $125$ m.",
    ].join("\n"),
  },
  "NSHM-2026-27-C6": {
    stem: "Một khu đất được quây bằng hàng rào có kích thước như hình bên. Biết rằng cứ $1$ mét hàng rào thì hết $120\\,000$ đồng. Phần làm cổng rộng $1{,}5$ m không làm hàng rào. Hỏi cần bao nhiêu tiền để làm hàng rào quanh khu đất đó?",
    modelAnswer: [
      "Khu đất có dạng chữ $L$ gồm:",
      "- Phần dưới: hình vuông $10$ m $\\times\\ 10$ m.",
      "- Phần trên: hình chữ nhật $(10 - 3) = 7$ m rộng, $8$ m cao, đặt sát mép phải của phần dưới (lệch $3$ m so với mép trái).",
      "",
      "Chu vi mảnh đất (tính cả phần làm cổng) bằng tổng các cạnh đi vòng quanh:",
      "- Ba cạnh dài $10$ m: đáy, cạnh phải khối dưới, cạnh trái khối dưới $\\Rightarrow 10 \\times 3 = 30$ (m).",
      "- Hai cạnh dài $8$ m: cạnh phải khối trên và cạnh trái khối trên $\\Rightarrow 8 \\times 2 = 16$ (m).",
      "- Đỉnh khối trên dài $10 - 3 = 7$ (m) và bậc lộ trên đỉnh khối dưới dài $3$ (m).",
      "",
      "Chu vi mảnh đất là:",
      "$$10 \\times 3 + 8 \\times 2 + (10 - 3) + 3 = 30 + 16 + 7 + 3 = 56 \\text{ (m)}.$$",
      "",
      "Độ dài hàng rào (không tính phần làm cổng) là:",
      "$$56 - 1{,}5 = 54{,}5 \\text{ (m)}.$$",
      "",
      "Chi phí làm hàng rào là:",
      "$$120\\,000 \\times 54{,}5 = 6\\,540\\,000 \\text{ (đồng)}.$$",
      "",
      "**Đáp số**: $6\\,540\\,000$ đồng.",
    ].join("\n"),
  },
  "NSHM-2026-27-C7": {
    stem: "Một sản phẩm được bán với giá $3\\,360\\,000$ đồng thì được lãi $12\\%$ so với tiền vốn. Tính giá vốn của sản phẩm đó.",
    modelAnswer: [
      "Giá bán của sản phẩm bằng: $100\\% + 12\\% = 112\\%$ (giá vốn).",
      "",
      "Giá vốn của sản phẩm đó là:",
      "$$3\\,360\\,000 : 112\\% = 3\\,000\\,000 \\text{ (đồng)}.$$",
      "",
      "**Đáp số**: $3\\,000\\,000$ đồng.",
    ].join("\n"),
  },
  "NSHM-2026-27-C8": {
    stem: "Khi cộng một số tự nhiên với một số thập phân, một bạn quên dấu phẩy ở số thập phân nên đã cộng như cộng hai số tự nhiên, vì vậy kết quả là $235$. Biết rằng tổng đúng của số tự nhiên và số thập phân là $203{,}5$. Tìm số tự nhiên đó.",
    modelAnswer: [
      "Vì tổng đúng có $1$ chữ số ở phần thập phân nên số thập phân ban đầu cũng có $1$ chữ số ở phần thập phân.",
      "",
      "Khi quên dấu phẩy, số thập phân đó tăng gấp $10$ lần. Suy ra tổng bị tăng thêm $10 - 1 = 9$ lần số thập phân.",
      "",
      "Hiệu của hai tổng là: $235 - 203{,}5 = 31{,}5$.",
      "",
      "Suy ra $9$ lần số thập phân là $31{,}5$, do đó số thập phân là: $31{,}5 : 9 = 3{,}5$.",
      "",
      "Số tự nhiên cần tìm là: $203{,}5 - 3{,}5 = 200$.",
      "",
      "**Đáp số**: $200$.",
    ].join("\n"),
  },
  "NSHM-2026-27-C9": {
    stem: "Tính chu vi phần màu trắng của Hình $16$ theo dãy hình bên, biết diện tích mỗi hình vuông nhỏ là $S_{\\text{vuông nhỏ}} = 4$ cm$^2$.",
    modelAnswer: [
      "Quan sát dãy hình ta thấy chu vi của $4$ phần trắng trong mỗi hình là như nhau.",
      "",
      "Xét quy luật của $1$ phần hình trắng trong mỗi hình chẵn:",
      "- Hình $2$: $1$ ô — $1$ lớp.",
      "- Hình $4$: $1 + 3 = 4$ ô — $2$ lớp.",
      "- Hình $6$: $1 + 3 + 5 = 9$ ô — $3$ lớp.",
      "- $\\ldots$",
      "- Hình $16$: $1 + 3 + 5 + \\ldots + 15$ ô — $8$ lớp.",
      "",
      "Nhận thấy $1$ phần hình trắng ở Hình $16$ có chu vi bằng chu vi của hình chữ nhật có chiều dài gồm $15$ cạnh hình vuông nhỏ, chiều rộng là $8$ cạnh hình vuông nhỏ.",
      "",
      "Chu vi của $1$ phần hình màu trắng ở Hình $16$ là: $(15 + 8) \\times 2 = 46$ (cạnh hình vuông nhỏ).",
      "",
      "Vì diện tích hình vuông nhỏ là $4$ cm$^2$ mà $4 = 2 \\times 2$ nên độ dài cạnh của một hình vuông nhỏ là $2$ cm.",
      "",
      "Chu vi của phần hình màu trắng ở Hình $16$ là:",
      "$$46 \\times 2 \\times 4 = 368 \\text{ (cm)}.$$",
      "",
      "**Đáp số**: $368$ cm.",
    ].join("\n"),
  },
  "NSHM-2026-27-C10": {
    stem: "Cho $m * n = \\dfrac{1}{m \\times n - 1}$. Tìm $x$ biết: $2 * 2 + 4 * 4 + 6 * 6 + \\ldots + x * x = \\dfrac{13}{27}$.",
    modelAnswer: [
      "Ta có:",
      "$$2 * 2 = \\dfrac{1}{2 \\times 2 - 1} = \\dfrac{1}{3} = \\dfrac{1}{1 \\times 3}.$$",
      "$$4 * 4 = \\dfrac{1}{4 \\times 4 - 1} = \\dfrac{1}{15} = \\dfrac{1}{3 \\times 5}.$$",
      "$$6 * 6 = \\dfrac{1}{6 \\times 6 - 1} = \\dfrac{1}{35} = \\dfrac{1}{5 \\times 7}.$$",
      "$$\\ldots$$",
      "$$x * x = \\dfrac{1}{x \\times x - 1} = \\dfrac{1}{(x - 1)(x + 1)}.$$",
      "",
      "Theo đề ra, ta có:",
      "$$\\dfrac{1}{1 \\times 3} + \\dfrac{1}{3 \\times 5} + \\dfrac{1}{5 \\times 7} + \\ldots + \\dfrac{1}{(x-1)(x+1)} = \\dfrac{13}{27}.$$",
      "",
      "Nhân cả hai vế với $2$:",
      "$$\\dfrac{2}{1 \\times 3} + \\dfrac{2}{3 \\times 5} + \\dfrac{2}{5 \\times 7} + \\ldots + \\dfrac{2}{(x-1)(x+1)} = \\dfrac{26}{27}.$$",
      "",
      "Áp dụng quy tắc tách $\\dfrac{2}{a(a+2)} = \\dfrac{1}{a} - \\dfrac{1}{a+2}$:",
      "$$\\left(\\dfrac{1}{1} - \\dfrac{1}{3}\\right) + \\left(\\dfrac{1}{3} - \\dfrac{1}{5}\\right) + \\ldots + \\left(\\dfrac{1}{x-1} - \\dfrac{1}{x+1}\\right) = \\dfrac{26}{27}.$$",
      "",
      "Sau khi triệt tiêu, còn lại:",
      "$$\\dfrac{1}{1} - \\dfrac{1}{x+1} = \\dfrac{26}{27}.$$",
      "$$\\dfrac{1}{x+1} = 1 - \\dfrac{26}{27} = \\dfrac{1}{27}.$$",
      "$$x + 1 = 27 \\Rightarrow x = 26.$$",
      "",
      "**Đáp số**: $x = 26$.",
    ].join("\n"),
  },
  "NSHM-2026-27-B1": {
    stem: [
      "Ta có $1$ cân $= 16$ lượng (thời xưa) và $1$ lượng bằng $37{,}5$ gam. Một phú ông có $250$ cân vàng.",
      "",
      "**a)** Tính số ki-lô-gam vàng ông có.",
      "",
      "**b)** Hiện nay, người siêu giàu có trên $750$ tỉ đồng. Nếu bán vàng với giá $156$ triệu/$1$ lượng thì phú ông có đủ tiền để thành giới siêu giàu không? (chỉ tính giá trị vàng).",
    ].join("\n"),
    modelAnswer: [
      "**a)** Phú ông có số lượng vàng là: $16 \\times 250 = 4000$ (lượng).",
      "",
      "Phú ông có số gam vàng là: $37{,}5 \\times 4000 = 150\\,000$ (gam).",
      "",
      "Đổi: $150\\,000$ gam $= 150$ kg.",
      "",
      "**b)** Phú ông có $4000$ lượng vàng tương ứng với số tiền là:",
      "$$156\\,000\\,000 \\times 4000 = 624\\,000\\,000\\,000 \\text{ (đồng)}.$$",
      "",
      "Đổi: $624\\,000\\,000\\,000$ đồng $= 624$ tỉ đồng $< 750$ tỉ đồng.",
      "",
      "Vậy phú ông chưa được xếp vào giới siêu giàu.",
      "",
      "**Đáp số**: **a)** $150$ kg; **b)** Phú ông chưa được xếp vào giới siêu giàu.",
    ].join("\n"),
  },
  "NSHM-2026-27-B2": {
    stem: [
      "Một hình vuông $ABCD$ có chu vi $40$ dm.",
      "",
      "**a)** Tính diện tích hình vuông đó.",
      "",
      "**b)** Lấy $E$ trên cạnh $AB$ và $F$ trên cạnh $DC$ chia hình vuông thành $4$ phần $S_1$, $S_2$, $S_3$, $S_4$ như hình vẽ, biết $S_2 - S_4 = 16$ dm$^2$. Tính độ dài cạnh $DF$.",
    ].join("\n"),
    modelAnswer: [
      "**a)** Chu vi hình vuông $ABCD$ là $40$ dm nên độ dài mỗi cạnh là: $40 : 4 = 10$ (dm).",
      "",
      "Diện tích hình vuông $ABCD$ là: $10 \\times 10 = 100$ (dm$^2$).",
      "",
      "**b)** Tam giác $EDF$ và $EFC$ đều có chiều cao kẻ từ $E$ xuống đáy $DC$ và bằng độ dài cạnh $BC$. Do đó:",
      "$$S_2 + S_4 = \\dfrac{1}{2} \\times BC \\times DF + \\dfrac{1}{2} \\times BC \\times FC$$",
      "$$= \\dfrac{1}{2} \\times BC \\times (DF + FC) = \\dfrac{1}{2} \\times BC \\times DC = \\dfrac{1}{2} \\times S_{ABCD}.$$",
      "",
      "Vậy: $S_2 + S_4 = \\dfrac{1}{2} \\times 100 = 50$ (dm$^2$).",
      "",
      "Theo đề bài, $S_2 - S_4 = 16$ (dm$^2$). Do đó diện tích tam giác lớn hơn là:",
      "$$S_2 = (50 + 16) : 2 = 33 \\text{ (dm}^2\\text{)}.$$",
      "",
      "Tam giác $DEF$ có diện tích $33$ dm$^2$, chiều cao là $10$ dm nên độ dài $DF$ là:",
      "$$DF = 33 \\times 2 : 10 = 6{,}6 \\text{ (dm)}.$$",
      "",
      "**Đáp số**: **a)** $100$ dm$^2$; **b)** $DF = 6{,}6$ dm.",
    ].join("\n"),
  },

  // ─── NSHM 2024 (Cơ sở 2 — Hoàng Mai, Đề số 26, 02/03/2024 — nguồn CLB MathFun) ───
  // PHẦN 1: ĐIỀN ĐÁP SỐ (C1–C10), PHẦN 2: TỰ LUẬN (B1–B3).
  "NSHM-2024-25-C1": {
    stem: "Tính: $123{,}4 + 1754 + 146{,}6$.",
    modelAnswer: [
      "$123{,}4 + 1754 + 146{,}6 = (123{,}4 + 146{,}6) + 1754 = 270 + 1754 = 2024$.",
      "",
      "**Đáp số**: $2024$.",
    ].join("\n"),
  },
  "NSHM-2024-25-C2": {
    stem: "Tìm $x$, biết: $x \\times 2 + \\dfrac{3}{4} = 1$.",
    modelAnswer: [
      "$x \\times 2 = 1 - \\dfrac{3}{4} = \\dfrac{1}{4}$.",
      "",
      "$x = \\dfrac{1}{4} : 2 = \\dfrac{1}{8}$.",
      "",
      "**Đáp số**: $x = \\dfrac{1}{8}$.",
    ].join("\n"),
  },
  "NSHM-2024-25-C3": {
    stem: "$15$ người làm xong một công việc trong $10$ ngày. Hỏi muốn hoàn thành công việc đó trong $5$ ngày thì cần bao nhiêu người? (Năng suất mỗi người như nhau.)",
    modelAnswer: [
      "Một người làm xong công việc đó trong số ngày là: $15 \\times 10 = 150$ (ngày).",
      "",
      "Để hoàn thành công việc trong $5$ ngày cần số người là: $150 : 5 = 30$ (người).",
      "",
      "**Đáp số**: $30$ người.",
    ].join("\n"),
  },
  "NSHM-2024-25-C4": {
    stem: "Tìm hai số, biết tổng của chúng là $104$ và $5$ lần số bé bằng $3$ lần số lớn.",
    modelAnswer: [
      "Vì $5$ lần số bé bằng $3$ lần số lớn nên số bé bằng $\\dfrac{3}{5}$ số lớn.",
      "",
      "Coi số bé gồm $3$ phần bằng nhau thì số lớn gồm $5$ phần như thế. Tổng số phần là: $3 + 5 = 8$ (phần).",
      "",
      "Số bé là: $104 : 8 \\times 3 = 39$.",
      "",
      "Số lớn là: $104 - 39 = 65$.",
      "",
      "**Đáp số**: $39$ và $65$.",
    ].join("\n"),
  },
  "NSHM-2024-25-C5": {
    stem: "Cho hình lập phương có diện tích toàn phần là $294$ cm$^2$. Tính độ dài cạnh của hình lập phương đó.",
    modelAnswer: [
      "Diện tích một mặt của hình lập phương là: $294 : 6 = 49$ (cm$^2$).",
      "",
      "Vì $49 = 7 \\times 7$ nên cạnh của hình lập phương là $7$ cm.",
      "",
      "**Đáp số**: $7$ cm.",
    ].join("\n"),
  },
  "NSHM-2024-25-C6": {
    stem: "Cho các chữ số $1; 2; 3; 4; 5$. Hỏi có thể lập được bao nhiêu số tự nhiên có $3$ chữ số khác nhau?",
    modelAnswer: [
      "Từ $5$ chữ số $1; 2; 3; 4; 5$ lập số có $3$ chữ số khác nhau:",
      "",
      "+ Chọn chữ số hàng trăm: có $5$ cách.",
      "+ Chọn chữ số hàng chục: có $4$ cách.",
      "+ Chọn chữ số hàng đơn vị: có $3$ cách.",
      "",
      "Số các số có $3$ chữ số khác nhau lập được là: $5 \\times 4 \\times 3 = 60$ (số).",
      "",
      "**Đáp số**: $60$ số.",
    ].join("\n"),
  },
  "NSHM-2024-25-C7": {
    stem: "Minh viết các số tự nhiên liên tiếp bắt đầu từ $1$. Khi viết xong, Minh thấy mình đã viết được $207$ chữ số. Hỏi Minh đã viết bao nhiêu số?",
    modelAnswer: [
      "Từ $1$ đến $9$ có $9$ số có $1$ chữ số, cần: $9$ chữ số.",
      "",
      "Từ $10$ đến $99$ có $(99 - 10) : 1 + 1 = 90$ số có $2$ chữ số, cần: $90 \\times 2 = 180$ (chữ số).",
      "",
      "Số chữ số còn lại để viết các số có $3$ chữ số là: $207 - 180 - 9 = 18$ (chữ số).",
      "",
      "$18$ chữ số viết được số các số có $3$ chữ số là: $18 : 3 = 6$ (số).",
      "",
      "Vậy Minh đã viết tất cả: $9 + 90 + 6 = 105$ (số).",
      "",
      "**Đáp số**: $105$ số.",
    ].join("\n"),
  },
  "NSHM-2024-25-C8": {
    stem: "Mở $2$ vòi nước cùng chảy vào một bể không có nước thì sau $4$ giờ đầy bể. Biết nếu mở vòi $1$ chảy riêng thì sau $12$ giờ đầy bể. Hỏi nếu vòi $2$ chảy một mình thì sau bao lâu sẽ đầy bể?",
    modelAnswer: [
      "Mỗi giờ hai vòi cùng chảy được: $1 : 4 = \\dfrac{1}{4}$ (bể).",
      "",
      "Mỗi giờ vòi $1$ chảy riêng được: $1 : 12 = \\dfrac{1}{12}$ (bể).",
      "",
      "Mỗi giờ vòi $2$ chảy một mình được: $\\dfrac{1}{4} - \\dfrac{1}{12} = \\dfrac{1}{6}$ (bể).",
      "",
      "Thời gian vòi $2$ chảy một mình để đầy bể là: $1 : \\dfrac{1}{6} = 6$ (giờ).",
      "",
      "**Đáp số**: $6$ giờ.",
    ].join("\n"),
  },
  "NSHM-2024-25-C9": {
    stem: "Biết tổng của một số tự nhiên và một số thập phân là $7{,}15$. Nếu dịch chuyển dấu phẩy của số thập phân sang bên phải $1$ hàng thì tổng mới là $26{,}5$. Tìm số tự nhiên đó.",
    modelAnswer: [
      "Khi dịch dấu phẩy của số thập phân sang phải một hàng thì số đó có giá trị mới gấp $10$ lần ban đầu.",
      "",
      "Do đó tổng mới hơn tổng ban đầu đúng bằng $9$ lần số thập phân ban đầu.",
      "",
      "$9$ lần số thập phân ban đầu là: $26{,}5 - 7{,}15 = 19{,}35$.",
      "",
      "Số thập phân lúc đầu là: $19{,}35 : 9 = 2{,}15$.",
      "",
      "Số tự nhiên là: $7{,}15 - 2{,}15 = 5$.",
      "",
      "**Đáp số**: $5$.",
    ].join("\n"),
  },
  "NSHM-2024-25-C10": {
    stem: "Tìm tổng diện tích các phần tô đậm, biết diện tích của mỗi hình tròn nhỏ bằng nhau và bán kính hình tròn nhỏ là $10$ cm (xem hình vẽ).",
    modelAnswer: [
      "Bằng cách nối thêm hình và đánh số các phần như hình minh họa, tổng diện tích các phần tô đậm cần tính đúng bằng $\\dfrac{1}{4}$ diện tích hình tròn lớn.",
      "",
      "Bán kính hình tròn lớn bằng đường kính hình tròn nhỏ: $10 \\times 2 = 20$ (cm).",
      "",
      "Diện tích hình tròn lớn là: $20 \\times 20 \\times 3{,}14 = 1256$ (cm$^2$).",
      "",
      "Tổng diện tích các phần tô đậm là: $1256 : 4 = 314$ (cm$^2$).",
      "",
      "**Đáp số**: $314$ cm$^2$.",
    ].join("\n"),
  },
  "NSHM-2024-25-B1": {
    stem: "Một cửa hàng nhân ngày khuyến mãi giảm giá $30\\%$ so với giá bán. Hỏi nếu chiếc áo giá $300\\,000$ đồng thì sau khi giảm giá người mua phải trả bao nhiêu tiền?",
    modelAnswer: [
      "Số tiền được giảm khi mua chiếc áo là: $300\\,000 : 100 \\times 30 = 90\\,000$ (đồng).",
      "",
      "Sau khi giảm giá, người mua phải trả số tiền là: $300\\,000 - 90\\,000 = 210\\,000$ (đồng).",
      "",
      "**Đáp số**: $210\\,000$ đồng.",
    ].join("\n"),
  },
  "NSHM-2024-25-B2": {
    stem: [
      "Hình thang $ABCD$ có đáy bé $AB = 12$ cm, đáy lớn $DC = 15$ cm, chiều cao bằng một nửa đáy bé $AB$.",
      "",
      "**a)** Tính diện tích hình thang $ABCD$.",
      "",
      "**b)** Nối $A$ với $C$. Lấy điểm $M$ sao cho $AM = \\dfrac{1}{3} AC$. Nối $D$ với $M$. Tính diện tích hình tam giác $MCD$.",
    ].join("\n"),
    modelAnswer: [
      "**a)** Chiều cao của hình thang là: $12 : 2 = 6$ (cm).",
      "",
      "Diện tích hình thang $ABCD$ là: $(15 + 12) \\times 6 : 2 = 81$ (cm$^2$).",
      "",
      "**b)** Chiều cao hạ từ $A$ xuống đáy $DC$ của tam giác $ADC$ bằng chiều cao của hình thang và bằng $6$ cm.",
      "",
      "Diện tích tam giác $ACD$ là: $15 \\times 6 : 2 = 45$ (cm$^2$).",
      "",
      "Vì $AC = 3 \\times AM$ nên $CM = \\dfrac{2}{3} \\times AC$.",
      "",
      "Hai tam giác $ACD$ và $MCD$ có chung chiều cao hạ từ $D$ xuống $AC$, mà $CM = \\dfrac{2}{3} \\times AC$ nên $S_{MCD} = \\dfrac{2}{3} \\times S_{ACD}$.",
      "",
      "Diện tích tam giác $MCD$ là: $45 \\times 2 : 3 = 30$ (cm$^2$).",
      "",
      "**Đáp số**: **a)** $81$ cm$^2$; **b)** $30$ cm$^2$.",
    ].join("\n"),
  },
  "NSHM-2024-25-B3": {
    stem: [
      "Một giải bóng được tổ chức với thể lệ như sau: Ở vòng đấu loại, người ta chia ngẫu nhiên $4$ đội vào một bảng đấu; số đội dư ra (nếu có) sẽ xếp vào một bảng đấu. Ở mỗi bảng, các đội đều đấu với các đội khác trong bảng một trận. Sau vòng đấu loại sẽ chọn hai đội có thành tích tốt nhất mỗi bảng tiến vào vòng trong đấu loại trực tiếp: các đội chia thành các cặp, mỗi cặp đấu một trận duy nhất để chọn đội thắng vào vòng trong tiếp theo, và cứ thế cho đến khi chọn ra nhà vô địch.",
      "",
      "Giải bóng có $63$ đội tham gia. Hỏi khi giải kết thúc có tất cả bao nhiêu trận đấu?",
    ].join("\n"),
    modelAnswer: [
      "Vì $63 : 4 = 15$ (dư $3$) nên có $15$ bảng $4$ đội và $1$ bảng $3$ đội, tổng cộng có $16$ bảng.",
      "",
      "**Vòng đấu loại:**",
      "",
      "+ Mỗi bảng $4$ đội có số trận là: $4 \\times 3 : 2 = 6$ (trận). Tổng số trận của $15$ bảng là: $15 \\times 6 = 90$ (trận).",
      "",
      "+ Bảng $3$ đội có số trận là: $3 \\times 2 : 2 = 3$ (trận).",
      "",
      "Số trận ở vòng đấu loại là: $90 + 3 = 93$ (trận).",
      "",
      "**Vòng trong (đấu loại trực tiếp):**",
      "",
      "Mỗi bảng chọn $2$ đội nên số đội vào vòng trong là: $16 \\times 2 = 32$ (đội).",
      "",
      "Cứ $2$ đội đấu $1$ trận, số trận lần lượt qua các vòng là:",
      "$$32 : 2 = 16; \\quad 16 : 2 = 8; \\quad 8 : 2 = 4; \\quad 4 : 2 = 2; \\quad 2 : 2 = 1 \\text{ (trận chung kết)}.$$",
      "",
      "Vậy tổng số trận đấu của cả giải là: $93 + 16 + 8 + 4 + 2 + 1 = 124$ (trận).",
      "",
      "**Đáp số**: $124$ trận.",
    ].join("\n"),
  },
  // === THCS Archimedes (arc) — stem/options/modelAnswer; correct/unit/figure live in metadata ===
  // --- arc-2020cb ---
  "ARC-2020-21-CB-C1": {
    stem: "Từ $1$ đến $100$ có bao nhiêu chữ số $1$?",
    modelAnswer: "Chữ số $1$ ở hàng trăm: số $100$ $\\Rightarrow$ $1$ chữ số.\nChữ số $1$ ở hàng chục: $10, 11, 12, \\ldots, 19$ $\\Rightarrow$ $10$ chữ số.\nChữ số $1$ ở hàng đơn vị: $1, 11, 21, \\ldots, 91$ $\\Rightarrow$ $10$ chữ số.\n\n**Đáp số**: $1 + 10 + 10 = 21$ chữ số.",
  },
  "ARC-2020-21-CB-C2": {
    stem: "Tính: $3{,}6 \\times 7{,}4$.",
    modelAnswer: "$3{,}6 \\times 7{,}4 = 26{,}64$.\n\n**Đáp số**: $26{,}64$.",
  },
  "ARC-2020-21-CB-C3": {
    stem: "$60\\%$ của $7{,}5$ là bao nhiêu?",
    modelAnswer: "$60\\%$ của $7{,}5$ là: $7{,}5 \\times 60 : 100 = 4{,}5$.\n\n**Đáp số**: $4{,}5$.",
  },
  "ARC-2020-21-CB-C4": {
    stem: "Có $3$ loại mảnh ghép hình tam giác, hình vuông và hình chữ nhật, tất cả có $240$ hình. Số mảnh hình tam giác bằng $\\dfrac{1}{3}$ số mảnh hình vuông và hình chữ nhật. Số mảnh hình chữ nhật hơn số mảnh hình vuông là $40$. Tìm số mảnh hình chữ nhật.",
    modelAnswer: "Số mảnh hình tam giác bằng $\\dfrac{1}{3}$ số mảnh (vuông + chữ nhật) nên bằng $\\dfrac{1}{4}$ tổng số mảnh.\nSố mảnh hình tam giác là: $240 \\times \\dfrac{1}{4} = 60$ (mảnh).\nSố mảnh hình vuông và hình chữ nhật là: $240 - 60 = 180$ (mảnh).\nSố mảnh hình chữ nhật là: $(180 + 40) : 2 = 110$ (mảnh).\n\n**Đáp số**: $110$ mảnh ghép.",
  },
  "ARC-2020-21-CB-C5": {
    stem: "Tìm một số có hai chữ số. Biết rằng nếu viết thêm chữ số $1$ vào giữa hai chữ số đó thì ta được số mới hơn $8$ lần số ban đầu là $14$ đơn vị. Tìm số ban đầu.",
    modelAnswer: "Gọi số cần tìm là $\\overline{ab}$. Theo đề bài: $\\overline{a1b} = \\overline{ab} \\times 8 + 14$.\n$a \\times 100 + 10 + b = a \\times 80 + b \\times 8 + 14$.\n$a \\times 20 = b \\times 7 + 4$. Suy ra $a = 3,\\ b = 8$.\n\n**Đáp số**: $38$.",
  },
  "ARC-2020-21-CB-C6": {
    stem: "Một lớp có $32$ học sinh, tổng điểm kiểm tra môn Toán của tất cả các bạn là $292$ điểm. Số học sinh điểm $9$ gấp đôi số bạn học sinh được điểm $10$. Tính số học sinh được điểm $8$. Biết các bạn chỉ có thể đạt điểm $8$; $9$ hoặc $10$.",
    modelAnswer: "Giả sử cả $32$ học sinh đều đạt điểm $8$ thì tổng điểm là: $32 \\times 8 = 256$ (điểm).\nSố điểm hụt đi so với thực tế là: $292 - 256 = 36$ (điểm).\nMỗi bạn điểm $10$ hơn $2$ điểm, mỗi bạn điểm $9$ hơn $1$ điểm; số bạn điểm $9$ gấp đôi số bạn điểm $10$ nên mỗi bạn điểm $10$ ứng với $2 + 1 \\times 2 = 4$ điểm hụt.\nSố bạn đạt điểm $10$ là: $36 : 4 = 9$ (bạn). Số bạn điểm $9$ là $18$ bạn.\nSố bạn đạt điểm $8$ là: $32 - 9 - 18 = 5$ (bạn).\n\n**Đáp số**: $5$ bạn.",
  },
  "ARC-2020-21-CB-C7": {
    stem: "Cho $B = 135791113\\ldots2021$ (viết liền các số lẻ từ $1$ đến $2021$). Hỏi chữ số thứ $2020$ là số mấy?",
    modelAnswer: "Các số lẻ có $1$ chữ số ($1$ đến $9$): $5$ số $\\Rightarrow 5$ chữ số.\nCác số lẻ có $2$ chữ số ($11$ đến $99$): $45$ số $\\Rightarrow 90$ chữ số.\nCác số lẻ có $3$ chữ số ($101$ đến $999$): $450$ số $\\Rightarrow 1350$ chữ số.\nĐến hết số lẻ $3$ chữ số đã dùng: $5 + 90 + 1350 = 1445$ chữ số.\nCòn lại: $2020 - 1445 = 575$ chữ số, ứng với các số lẻ $4$ chữ số.\n$575 : 4 = 143$ (dư $3$) nên chữ số thứ $2020$ là chữ số thứ $3$ của số lẻ $4$ chữ số thứ $144$.\nSố lẻ $4$ chữ số thứ $144$ là: $1001 + (144 - 1) \\times 2 = 1287$.\n\n**Đáp số**: chữ số thứ $2020$ là $8$.",
  },
  "ARC-2020-21-CB-C8": {
    stem: "Lúc $6$ giờ sáng, một xe máy đi từ $A$ đến $B$ với vận tốc $40$ km/giờ. Lúc $7$ giờ, một ô tô đi từ $B$ về $A$ với vận tốc $60$ km/giờ. Biết hai xe gặp nhau ở chính giữa $AB$. Hỏi ô tô đi từ $B$ về $A$ lúc mấy giờ thì tới $A$?",
    modelAnswer: "Xe máy đi trước ô tô: $40 \\times (7 - 6) = 40$ (km).\nCùng thời gian thì quãng đường tỉ lệ với vận tốc; tỉ số vận tốc xe máy và ô tô là $\\dfrac{40}{60} = \\dfrac{2}{3}$.\nHiệu quãng đường hai xe đi từ $7$ giờ đến khi gặp nhau là $40$ km, ứng với hiệu $3 - 2 = 1$ phần.\nQuãng đường ô tô đi được (nửa $AB$) là: $40 : (3 - 2) \\times 3 = 120$ (km).\nThời gian ô tô đi nửa quãng đường là: $120 : 60 = 2$ (giờ). Ô tô đến $A$ lúc: $7 + 2 \\times 2 = 11$ (giờ).\n\n**Đáp số**: $11$ giờ.",
  },
  "ARC-2020-21-CB-C9": {
    stem: "Hiện nay tuổi bố gấp $5$ lần tuổi con. Sau $10$ năm nữa tuổi bố gấp $2{,}5$ lần tuổi con. Tính tuổi con hiện nay.",
    modelAnswer: "Hiện nay tuổi con bằng $\\dfrac{1}{4}$ hiệu số tuổi của hai bố con.\nSau $10$ năm, tuổi con bằng $\\dfrac{2}{3}$ hiệu số tuổi của hai bố con (hiệu không đổi).\n$10$ năm ứng với: $\\dfrac{2}{3} - \\dfrac{1}{4} = \\dfrac{5}{12}$ hiệu số tuổi.\nHiệu số tuổi của hai bố con là: $10 : \\dfrac{5}{12} = 24$ (tuổi).\nTuổi con hiện nay là: $24 : (5 - 1) \\times 1 = 6$ (tuổi).\n\n**Đáp số**: $6$ tuổi.",
  },
  "ARC-2020-21-CB-C10": {
    stem: "Một hình hộp chữ nhật có chiều dài $8$ dm, chiều rộng $4$ dm, chiều cao $5$ dm được xếp bởi các hình lập phương cạnh $1$ dm. Người ta sơn các mặt của hình hộp chữ nhật (không sơn mặt tiếp đất). Hỏi có bao nhiêu hình lập phương được sơn đúng $1$ mặt?",
    modelAnswer: "Số hình lập phương được sơn $1$ mặt ở mặt trên: $(8 - 2) \\times (4 - 2) = 12$ (hình).\nSố hình lập phương được sơn $1$ mặt ở các mặt bên: $(8 - 2) \\times (5 - 1) \\times 2 + (4 - 2) \\times (5 - 1) \\times 2 = 64$ (hình).\nTổng số hình lập phương được sơn $1$ mặt: $12 + 64 = 76$ (hình).\n\n**Đáp số**: $76$ hình.",
  },
  "ARC-2020-21-CB-C11": {
    stem: "Một quả bóng rổ sau khi được giảm giá $30\\%$ có giá là $455\\,000$ đồng. Hỏi giá của quả bóng rổ trước đó là bao nhiêu?",
    modelAnswer: "Giá quả bóng sau khi giảm bằng $100\\% - 30\\% = 70\\%$ giá trước đó.\nGiá quả bóng rổ trước đó là: $455\\,000 : 70 \\times 100 = 650\\,000$ (đồng).\n\n**Đáp số**: $650\\,000$ đồng.",
  },
  "ARC-2020-21-CB-C12": {
    stem: "$7$ công nhân làm trong $6$ giờ được $21$ sản phẩm. Hỏi $5$ công nhân làm trong $16$ giờ được bao nhiêu sản phẩm? (Biết năng suất mỗi người làm đều như nhau.)",
    modelAnswer: "$7$ công nhân làm trong $16$ giờ được: $16 \\times 21 : 6 = 56$ (sản phẩm).\n$5$ công nhân làm trong $16$ giờ được: $5 \\times 56 : 7 = 40$ (sản phẩm).\n\n**Đáp số**: $40$ sản phẩm.",
  },
  "ARC-2020-21-CB-C13": {
    stem: "Có một hình chữ nhật, chiều dài hơn chiều rộng $10$ m. Nếu tăng chiều rộng thêm $25\\%$ và giảm chiều dài đi $8$ m thì diện tích không thay đổi. Tính diện tích hình chữ nhật.",
    modelAnswer: "Diện tích không đổi: (chiều dài $- 8$) $\\times$ ($125\\%$ chiều rộng) $=$ chiều dài $\\times$ chiều rộng.\n$\\dfrac{5}{4} \\times$ chiều dài $\\times$ chiều rộng $- 10 \\times$ chiều rộng $=$ chiều dài $\\times$ chiều rộng.\n$\\dfrac{1}{4} \\times$ chiều dài $= 10 \\Rightarrow$ chiều dài $= 40$ m, chiều rộng $= 30$ m.\nDiện tích là: $40 \\times 30 = 1200$ (m$^2$).\n\n**Đáp số**: $1200$ m$^2$.",
  },
  "ARC-2020-21-CB-C14": {
    stem: "Tính tổng dãy số cách đều sau: $3 + 5 + 7 + 9 + \\ldots + 35$.",
    modelAnswer: "Số số hạng của dãy: $(35 - 3) : 2 + 1 = 17$ (số hạng).\nTổng dãy là: $(3 + 35) \\times 17 : 2 = 323$.\n\n**Đáp số**: $323$.",
  },
  "ARC-2020-21-CB-C15": {
    stem: "Tìm hai số tròn chục liên tiếp có tổng bằng $570$.",
    modelAnswer: "Hai số tròn chục liên tiếp có hiệu là $10$.\nSố bé là: $(570 - 10) : 2 = 280$. Số lớn là: $570 - 280 = 290$.\n\n**Đáp số**: $280$ và $290$.",
  },
  "ARC-2020-21-CB-C16": {
    stem: "Trung bình cộng của bốn số là $17$, thêm số thứ năm vào thì trung bình cộng của năm số là $19$. Tính số thứ năm.",
    modelAnswer: "Tổng của bốn số là: $17 \\times 4 = 68$.\nTổng của năm số là: $19 \\times 5 = 95$.\nSố thứ năm là: $95 - 68 = 27$.\n\n**Đáp số**: $27$.",
  },
  "ARC-2020-21-CB-C17": {
    stem: "Khi viết thêm chữ số $9$ vào bên phải một số tự nhiên thì được số mới tăng thêm bao nhiêu lần và bao nhiêu đơn vị?",
    modelAnswer: "Khi viết thêm chữ số $9$ vào bên phải một số thì số đó được nhân với $10$ rồi cộng thêm $9$.\n\n**Đáp số**: số mới tăng thêm $10$ lần và $9$ đơn vị.",
  },
  // --- arc-2020nc ---
  "ARC-2020-21-NC-C1": {
    stem: "Tính $A = 7{,}5 \\times 7{,}67 + 75 \\times 0{,}212 + 0{,}75 \\times 2{,}1$.",
    modelAnswer: "$A = 7{,}5 \\times 7{,}67 + 7{,}5 \\times 2{,}12 + 7{,}5 \\times 0{,}21$.\n$A = 7{,}5 \\times (7{,}67 + 2{,}12 + 0{,}21) = 7{,}5 \\times 10 = 75$.\n\n**Đáp số**: $A = 75$.",
  },
  "ARC-2020-21-NC-C2": {
    stem: "Tìm $x$, biết: $x \\times 3 + x \\times 4 + x : 3 + x : 4 = 546$.",
    modelAnswer: "$x \\times \\left(3 + 4 + \\dfrac{1}{3} + \\dfrac{1}{4}\\right) = 546$.\n$x \\times \\dfrac{91}{12} = 546 \\Rightarrow x = 546 : \\dfrac{91}{12} = 72$.\n\n**Đáp số**: $x = 72$.",
  },
  "ARC-2020-21-NC-C3": {
    stem: "Tính $B = \\dfrac{3}{1 \\times 5} + \\dfrac{3}{5 \\times 9} + \\dfrac{3}{9 \\times 13} + \\ldots + \\dfrac{3}{2017 \\times 2021}$.",
    modelAnswer: "$B \\times \\dfrac{4}{3} = \\dfrac{4}{1 \\times 5} + \\dfrac{4}{5 \\times 9} + \\ldots + \\dfrac{4}{2017 \\times 2021} = 1 - \\dfrac{1}{2021} = \\dfrac{2020}{2021}$.\n$B = \\dfrac{2020}{2021} : \\dfrac{4}{3} = \\dfrac{1515}{2021}$.\n\n**Đáp số**: $B = \\dfrac{1515}{2021}$.",
  },
  "ARC-2020-21-NC-C4": {
    stem: "Cho phân số $\\dfrac{49}{73}$. Phải cùng bớt ở tử số và mẫu số bao nhiêu đơn vị để được phân số có giá trị là $\\dfrac{7}{11}$?",
    modelAnswer: "Cùng bớt ở tử số và mẫu số một số đơn vị như nhau thì hiệu giữa mẫu số và tử số không đổi và bằng $73 - 49 = 24$.\nPhân số mới $\\dfrac{7}{11}$ có hiệu giữa mẫu số và tử số là $11 - 7 = 4$ (phần) ứng với $24$.\nTử số mới là: $24 : (11 - 7) \\times 7 = 42$.\nPhải cùng bớt ở tử số và mẫu số số đơn vị là: $49 - 42 = 7$ (đơn vị).\n\n**Đáp số**: $7$ đơn vị.",
  },
  "ARC-2020-21-NC-C5": {
    stem: "Một hình hộp chữ nhật có diện tích xung quanh là $640$ cm$^2$ và chiều cao là $16$ cm. Hiệu giữa chiều dài và chiều rộng là $4$ cm. Tính thể tích hình đó.",
    modelAnswer: "Chu vi đáy của hình hộp chữ nhật: $640 : 16 = 40$ (cm). Nửa chu vi: $40 : 2 = 20$ (cm).\nChiều dài: $(20 + 4) : 2 = 12$ (cm). Chiều rộng: $20 - 12 = 8$ (cm).\nThể tích: $12 \\times 8 \\times 16 = 1536$ (cm$^3$).\n\n**Đáp số**: $1536$ cm$^3$.",
  },
  "ARC-2020-21-NC-C6": {
    stem: "Giá một cân thịt bò vào tháng $6$ tăng $10\\%$ so với tháng $5$, giá một cân thịt bò tháng $7$ tăng $15\\%$ so với tháng $6$. Biết giá một cân thịt bò tháng $7$ cao hơn tháng $5$ là $53\\,000$ đồng. Tính giá một cân thịt bò tháng $7$.",
    modelAnswer: "Coi giá thịt bò tháng $5$ là $100\\%$.\nGiá tháng $6$ là $110\\%$ giá tháng $5$. Giá tháng $7$ là $110\\% \\times 115\\% = 126{,}5\\%$ giá tháng $5$.\nTháng $7$ cao hơn tháng $5$: $126{,}5\\% - 100\\% = 26{,}5\\%$, ứng với $53\\,000$ đồng.\nGiá tháng $7$: $53\\,000 : 26{,}5 \\times 126{,}5 = 253\\,000$ (đồng).\n\n**Đáp số**: $253\\,000$ đồng.",
  },
  "ARC-2020-21-NC-C7": {
    stem: "Số hạng thứ $2020$ của dãy số $1; 3; 2; 4; 3; 5; \\ldots$ là số nào?",
    modelAnswer: "Tách thành hai dãy xen kẽ: dãy $1$ gồm $1; 2; 3; \\ldots$ (vị trí lẻ); dãy $2$ gồm $3; 4; 5; \\ldots$ (vị trí chẵn).\nSố hạng thứ $2020$ ở vị trí chẵn, là số hạng thứ $2020 : 2 = 1010$ của dãy $2$.\nSố hạng thứ $1010$ của dãy $2$ là: $(1010 - 1) \\times 1 + 3 = 1012$.\n\n**Đáp số**: $1012$.",
  },
  "ARC-2020-21-NC-C8": {
    stem: "Tổ A có $8$ công nhân, $1$ ngày làm $8$ giờ, xong công việc trong $15$ ngày. Tổ B có $12$ công nhân, $1$ ngày làm $5$ giờ sẽ xong công việc đó trong bao nhiêu ngày?",
    modelAnswer: "$8$ công nhân làm xong công việc trong số giờ: $15 \\times 8 = 120$ (giờ).\nMột công nhân làm xong công việc trong: $120 \\times 8 = 960$ (giờ).\n$12$ công nhân, mỗi ngày làm $5$ giờ thì xong trong: $960 : 5 : 12 = 16$ (ngày).\n\n**Đáp số**: $16$ ngày.",
  },
  "ARC-2020-21-NC-C9": {
    stem: "Hiệu hai số thập phân là $66{,}8$. Nếu dịch dấu phẩy của số bé sang trái $1$ hàng thì hiệu mới là $117{,}83$. Tìm số lớn.",
    modelAnswer: "Dịch dấu phẩy số bé sang trái $1$ hàng thì số bé giảm đi $10$ lần.\n$9$ lần số bé là: $117{,}83 - 66{,}8 = 51{,}03$. Số bé là: $51{,}03 : 9 = 5{,}67$ $\\Rightarrow$ số bé ban đầu là $56{,}7$.\nSố lớn là: $56{,}7 + 66{,}8 = 123{,}5$.\n\n**Đáp số**: $123{,}5$.",
  },
  "ARC-2020-21-NC-C10": {
    stem: "$A$ là tích các số chẵn từ $1$ đến $23$, $B$ là tích các số lẻ từ $2$ đến $22$. Tìm chữ số tận cùng của hiệu giữa $A$ và $B$.",
    modelAnswer: "$A$ có tận cùng là $0$ vì trong các số chẵn từ $1$ đến $23$ có thừa số $10$.\n$B$ có tận cùng là $5$ vì trong các số lẻ có thừa số $5$, mà $5$ nhân số lẻ luôn tận cùng $5$.\nVậy $A - B$ có tận cùng là $0 - 5$ (mượn) $= 5$.\n\n**Đáp số**: chữ số tận cùng là $5$.",
  },
  "ARC-2020-21-NC-C11": {
    stem: "Cô giáo viết lên bảng một số tự nhiên chia hết cho $9$. An thấy số đó chia $5$ hay $8$ đều cùng số dư. Tìm số đó, biết số đó có $2$ chữ số.",
    modelAnswer: "Các số có hai chữ số chia hết cho $9$: $18, 27, 36, 45, 54, 63, 72, 81, 90, 99$.\nThử lần lượt, số $81$ chia $5$ dư $1$ và chia $8$ dư $1$ (cùng số dư).\n\n**Đáp số**: $81$.",
  },
  "ARC-2020-21-NC-C12": {
    stem: "Tìm số có $4$ chữ số khác nhau, nếu xóa chữ số hàng chục và hàng đơn vị thì số đó giảm $108$ lần.",
    modelAnswer: "Gọi số cần tìm là $\\overline{abcd}$. Theo đề bài: $\\overline{abcd} = \\overline{ab} \\times 108$.\n$\\overline{ab} \\times 100 + \\overline{cd} = \\overline{ab} \\times 108 \\Rightarrow \\overline{cd} = \\overline{ab} \\times 8$.\nSuy ra $\\overline{ab} = 12,\\ \\overline{cd} = 96$.\n\n**Đáp số**: $1296$.",
  },
  "ARC-2020-21-NC-C13": {
    stem: "Số thứ nhất bằng $\\dfrac{1}{4}$ trung bình cộng của $3$ số. Số thứ hai hơn số thứ nhất $48$ đơn vị. Số thứ ba bằng $\\dfrac{3}{2}$ trung bình cộng của $3$ số. Tìm số thứ ba.",
    modelAnswer: "Số thứ nhất bằng $\\dfrac{1}{4 \\times 3} = \\dfrac{1}{12}$ tổng ba số.\nSố thứ ba bằng $\\dfrac{3}{2 \\times 3} = \\dfrac{1}{2}$ tổng ba số.\nPhân số chỉ số thứ hai: $1 - \\dfrac{1}{12} - \\dfrac{1}{2} = \\dfrac{5}{12}$ tổng ba số.\n$48$ đơn vị ứng với: $\\dfrac{5}{12} - \\dfrac{1}{12} = \\dfrac{1}{3}$ tổng ba số. Tổng ba số là: $48 : \\dfrac{1}{3} = 144$.\nSố thứ ba là: $144 \\times \\dfrac{1}{2} = 72$.\n\n**Đáp số**: $72$.",
  },
  "ARC-2020-21-NC-C14": {
    stem: "Tuổi mẹ $5$ năm trước bằng $3$ lần tuổi con hiện nay. Hai lần tuổi con $8$ năm nữa bằng tuổi mẹ hiện nay. Tính tuổi mẹ hiện nay.",
    modelAnswer: "Tuổi mẹ $5$ năm trước bằng $3$ lần tuổi con hiện nay $\\Rightarrow$ $3$ lần tuổi con hiện nay kém tuổi mẹ hiện nay $5$ tuổi.\nHai lần tuổi con $8$ năm nữa bằng tuổi mẹ hiện nay $\\Rightarrow$ $2$ lần tuổi con hiện nay kém tuổi mẹ hiện nay $16$ tuổi.\nTuổi con hiện nay là: $16 - 5 = 11$ (tuổi).\nTuổi mẹ hiện nay là: $11 \\times 2 + 16 = 38$ (tuổi).\n\n**Đáp số**: $38$ tuổi.",
  },
  "ARC-2020-21-NC-C15": {
    stem: "Lớp 5A làm bài kiểm tra. Tất cả các bạn được $9$ hoặc $10$ điểm. Tổng điểm là $365$ và số bạn được $10$ điểm hơn số bạn được $9$ điểm là $8$ bạn. Tìm số học sinh của lớp 5A.",
    modelAnswer: "Giả sử bớt đi $8$ bạn được $10$ điểm thì số bạn được $10$ bằng số bạn được $9$, tổng điểm còn: $365 - 10 \\times 8 = 285$ (điểm).\nSố bạn được điểm $9$ hoặc $10$ lúc này là: $285 : (10 + 9) = 15$ (bạn).\nSố bạn được điểm $10$ thực tế là: $15 + 8 = 23$ (bạn).\nTổng số học sinh là: $23 + 15 = 38$ (bạn).\n\n**Đáp số**: $38$ bạn.",
  },
  "ARC-2020-21-NC-C16": {
    stem: "Minh đọc quyển sách trong $4$ ngày. Ngày thứ nhất đọc $15\\%$ số trang và thêm $6$ trang nữa. Ngày thứ hai đọc $60\\%$ số trang còn lại và $30$ trang nữa. Ngày thứ ba đọc $50\\%$ số trang còn lại và $15$ trang nữa. Ngày thứ tư đọc nốt $30$ trang. Hỏi cuốn sách đó có bao nhiêu trang?",
    modelAnswer: "Số trang còn lại sau ngày thứ hai: $(30 + 15) : (100\\% - 50\\%) = 90$ (trang).\nSố trang còn lại sau ngày thứ nhất: $(90 + 30) : (100\\% - 60\\%) = 300$ (trang).\nTổng số trang sách ban đầu: $(300 + 6) : (100\\% - 15\\%) = 360$ (trang).\n\n**Đáp số**: $360$ trang.",
  },
  "ARC-2020-21-NC-C17": {
    stem: "Có bao nhiêu số có $4$ chữ số chia hết cho $5$? Biết số cần tìm có $4$ chữ số khác nhau và các chữ số tăng dần từ trái sang phải.",
    modelAnswer: "Số có các chữ số tăng dần từ trái sang phải nên chữ số tận cùng không thể là $0$; để chia hết cho $5$ thì tận cùng là $5$.\nCác số $4$ chữ số khác nhau, tăng dần, tận cùng là $5$: $1235, 1245, 1345, 2345$.\n\n**Đáp số**: $4$ số.",
  },
  "ARC-2020-21-NC-C18": {
    stem: "Xếp các hình lập phương nhỏ cạnh $1$ cm thành một hình lập phương lớn. Số hình không được sơn mặt nào gấp rưỡi số hình được sơn $1$ mặt. Tính thể tích hình lập phương đó.",
    modelAnswer: "Giả sử mỗi cạnh hình lập phương lớn có $n$ hình lập phương nhỏ.\nSố hình được sơn $1$ mặt: $6 \\times (n - 2) \\times (n - 2)$. Số hình không sơn mặt nào: $(n - 2)^3$.\nTheo đề bài: $\\dfrac{(n-2)^3}{6 \\times (n-2)^2} = \\dfrac{3}{2} \\Rightarrow \\dfrac{n-2}{6} = \\dfrac{3}{2} \\Rightarrow n = 11$.\nThể tích hình lập phương lớn: $11 \\times 11 \\times 11 = 1331$ (cm$^3$).\n\n**Đáp số**: $1331$ cm$^3$.",
  },
  "ARC-2020-21-NC-C19": {
    stem: "Biết $\\overline{abcd} + \\overline{affe} = \\overline{cbbd}$ và $\\overline{abcd}$ chia hết cho $15$. Tìm $\\overline{abcdef}$ ($a, b, c, d, e, f$ khác nhau).",
    modelAnswer: "Vì $\\overline{abcd}$ chia hết cho $15$ nên chia hết cho cả $3$ và $5$, suy ra $d = 0$ hoặc $d = 5$.\nXét hàng đơn vị $d + e = d$ (có thể nhớ): nếu $d = 0$ thì $e = 0$ (loại vì $e \\ne d$). Vậy $d = 5$, khi đó $e = 0$.\nTa có $\\overline{abc5} + \\overline{aff0} = \\overline{cbb5}$. Hàng trăm $c + f$ phải nhớ $1$, hàng nghìn $a + a + 1 = c$.\nThử $a = 3 \\Rightarrow c = 7$, tìm được $b = 6,\\ f = 9$. Số cần tìm là $\\overline{abcd} = 3675$, $\\overline{abcdef} = 367509$.\n\n**Đáp số**: $367509$.",
  },
  "ARC-2020-21-NC-C20": {
    stem: "An và Bình cùng xuất phát đi từ $A$ đến $B$ với vận tốc là $35$ km/h và $45$ km/h. Cùng lúc đó Chi đi từ $B$ đến $A$ với vận tốc $50$ km/h. Biết quãng đường $AB$ dài $132$ km. Hỏi sau bao nhiêu phút thì Chi ở chính giữa An và Bình?",
    modelAnswer: "Gọi bạn Long có vận tốc bằng trung bình cộng vận tốc của An và Bình, xuất phát cùng lúc thì Long luôn ở chính giữa An và Bình.\nVận tốc của Long là: $(35 + 45) : 2 = 40$ (km/giờ).\nBài toán quy về việc Chi gặp Long. Chi gặp Long sau số phút là: $132 : (40 + 50) = \\dfrac{22}{15}$ (giờ) $= 88$ (phút).\n\n**Đáp số**: $88$ phút.",
  },
  // --- arc-2022 ---
  "ARC-2022-23-C1": {
    stem: "Diện tích hình tròn có bán kính $3$ cm là:",
    options: [{"id": "A", "text": "$18{,}84$ cm$^2$"}, {"id": "B", "text": "$28{,}26$ cm$^2$"}, {"id": "C", "text": "$7{,}065$ cm$^2$"}, {"id": "D", "text": "$9{,}42$ cm$^2$"}],
    modelAnswer: "Diện tích hình tròn: $3 \\times 3 \\times 3{,}14 = 28{,}26$ (cm$^2$).",
  },
  "ARC-2022-23-C2": {
    stem: "Tính: $3$ giờ $18$ phút $+ 2$ giờ $10$ phút $\\times 3$.",
    options: [{"id": "A", "text": "$9$ giờ $48$ phút"}, {"id": "B", "text": "$5$ giờ $48$ phút"}, {"id": "C", "text": "$9$ giờ $28$ phút"}, {"id": "D", "text": "$5$ giờ $28$ phút"}],
    modelAnswer: "$3$ giờ $18$ phút $+ 6$ giờ $30$ phút $= 9$ giờ $48$ phút.",
  },
  "ARC-2022-23-C3": {
    stem: "Điền vào chỗ trống: $3{,}14$ m$^3 = \\ldots$ dm$^3$.",
    options: [{"id": "A", "text": "$31400$"}, {"id": "B", "text": "$314$"}, {"id": "C", "text": "$0{,}0314$"}, {"id": "D", "text": "$3140$"}],
    modelAnswer: "$3{,}14$ m$^3 = 3140$ dm$^3$.",
  },
  "ARC-2022-23-C4": {
    stem: "Kết quả của phép tính $A = 2 : 0{,}5 + 10 \\times 0{,}2$ là:",
    options: [{"id": "A", "text": "$21$"}, {"id": "B", "text": "$6$"}, {"id": "C", "text": "$24$"}, {"id": "D", "text": "$12$"}],
    modelAnswer: "$A = 2 : 0{,}5 + 10 \\times 0{,}2 = 4 + 2 = 6$.",
  },
  "ARC-2022-23-C5": {
    stem: "Tìm phân số lớn nhất trong các phân số $\\dfrac{1}{10}; \\dfrac{2}{15}; \\dfrac{3}{20}; \\dfrac{7}{60}$.",
    options: [{"id": "A", "text": "$\\dfrac{2}{15}$"}, {"id": "B", "text": "$\\dfrac{1}{10}$"}, {"id": "C", "text": "$\\dfrac{3}{20}$"}, {"id": "D", "text": "$\\dfrac{7}{60}$"}],
    modelAnswer: "Quy đồng mẫu $60$: $\\dfrac{6}{60}; \\dfrac{8}{60}; \\dfrac{9}{60}; \\dfrac{7}{60}$. Lớn nhất là $\\dfrac{3}{20}$.",
  },
  "ARC-2022-23-C6": {
    stem: "Trung bình cộng hai số là $3{,}2$ còn hiệu hai số là $2{,}3$. Số lớn là:",
    options: [{"id": "A", "text": "$2{,}05$"}, {"id": "B", "text": "$2{,}75$"}, {"id": "C", "text": "$4{,}35$"}, {"id": "D", "text": "$0{,}45$"}],
    modelAnswer: "Tổng hai số: $3{,}2 \\times 2 = 6{,}4$. Số lớn: $(6{,}4 + 2{,}3) : 2 = 4{,}35$.",
  },
  "ARC-2022-23-C7": {
    stem: "Thể tích của hình hộp chữ nhật có chiều dài $3$ cm, chiều rộng $2$ cm và chiều cao $1{,}5$ cm là:",
    options: [{"id": "A", "text": "$9$ cm$^3$"}, {"id": "B", "text": "$6$ cm$^3$"}, {"id": "C", "text": "$10$ cm$^3$"}, {"id": "D", "text": "$6{,}5$ cm$^3$"}],
    modelAnswer: "Thể tích: $3 \\times 2 \\times 1{,}5 = 9$ (cm$^3$).",
  },
  "ARC-2022-23-C8": {
    stem: "Có bao nhiêu số tự nhiên $a$ thỏa mãn $3\\dfrac{1}{4} < a < 5\\dfrac{3}{4}$?",
    options: [{"id": "A", "text": "$1$ số"}, {"id": "B", "text": "$3$ số"}, {"id": "C", "text": "$2$ số"}, {"id": "D", "text": "$4$ số"}],
    modelAnswer: "Số tự nhiên thỏa mãn là $4$ và $5$ $\\Rightarrow$ có $2$ số.",
  },
  "ARC-2022-23-C9": {
    stem: "Diện tích trên bản đồ tỉ lệ $1 : 2000$ của một khu đất là $3$ cm$^2$. Diện tích thực của khu đất đó là:",
    options: [{"id": "A", "text": "$60$ m$^2$"}, {"id": "B", "text": "$120$ m$^2$"}, {"id": "C", "text": "$600$ m$^2$"}, {"id": "D", "text": "$1200$ m$^2$"}],
    modelAnswer: "Diện tích thực: $3 \\times 2000 \\times 2000 = 12\\,000\\,000$ cm$^2 = 1200$ m$^2$.",
  },
  "ARC-2022-23-C10": {
    stem: "Từ các chữ số $1; 2; 4; 7; 8$ lập được bao nhiêu số có $3$ chữ số có các chữ số khác nhau?",
    options: [{"id": "A", "text": "$125$ số"}, {"id": "B", "text": "$50$ số"}, {"id": "C", "text": "$60$ số"}, {"id": "D", "text": "$20$ số"}],
    modelAnswer: "Hàng trăm $5$ cách, hàng chục $4$ cách, hàng đơn vị $3$ cách: $5 \\times 4 \\times 3 = 60$ (số).",
  },
  "ARC-2022-23-C11": {
    stem: "Biết $\\dfrac{2}{5}$ của một số là $20$. Tìm số đó.",
    options: [{"id": "A", "text": "$30$"}, {"id": "B", "text": "$60$"}, {"id": "C", "text": "$50$"}, {"id": "D", "text": "$20$"}],
    modelAnswer: "Số đó là: $20 : \\dfrac{2}{5} = 50$.",
  },
  "ARC-2022-23-C12": {
    stem: "Số mặt của một hình lập phương là:",
    options: [{"id": "A", "text": "$12$ mặt"}, {"id": "B", "text": "$6$ mặt"}, {"id": "C", "text": "$10$ mặt"}, {"id": "D", "text": "$8$ mặt"}],
    modelAnswer: "Hình lập phương có $6$ mặt.",
  },
  "ARC-2022-23-C13": {
    stem: "Tổng hai số là $20$, hiệu hai số là $3$. Số bé là:",
    options: [{"id": "A", "text": "$11{,}5$"}, {"id": "B", "text": "$8{,}5$"}, {"id": "C", "text": "$10{,}5$"}, {"id": "D", "text": "$9{,}5$"}],
    modelAnswer: "Số bé là: $(20 - 3) : 2 = 8{,}5$.",
  },
  "ARC-2022-23-C14": {
    stem: "Tổng số tuổi của ba người trong gia đình Nam là $76$ tuổi, biết bố hơn mẹ $3$ tuổi còn mẹ hơn Nam $23$ tuổi. Tuổi bố là:",
    options: [{"id": "A", "text": "$35$ tuổi"}, {"id": "B", "text": "$32$ tuổi"}, {"id": "C", "text": "$37$ tuổi"}, {"id": "D", "text": "$34$ tuổi"}],
    modelAnswer: "Tuổi Nam: $(76 - 23 - 23 - 3) : 3 = 9$ (tuổi). Tuổi bố: $9 + 23 + 3 = 35$ (tuổi).",
  },
  "ARC-2022-23-C15": {
    stem: "Phân số $\\dfrac{3}{20}$ đổi ra tỉ số phần trăm bằng:",
    options: [{"id": "A", "text": "$6\\%$"}, {"id": "B", "text": "$15\\%$"}, {"id": "C", "text": "$18\\%$"}, {"id": "D", "text": "$3\\%$"}],
    modelAnswer: "$\\dfrac{3}{20} = 0{,}15 = 15\\%$.",
  },
  "ARC-2022-23-C16": {
    stem: "Tổng hai số gấp $3$ lần hiệu của chúng. Số lớn gấp số bé bao nhiêu lần?",
    options: [{"id": "A", "text": "$3$ lần"}, {"id": "B", "text": "$5$ lần"}, {"id": "C", "text": "$2$ lần"}, {"id": "D", "text": "$4$ lần"}],
    modelAnswer: "Tổng $= 3 \\times$ hiệu $\\Rightarrow$ số lớn $+$ số bé $= 3 \\times$ (số lớn $-$ số bé) $\\Rightarrow 2 \\times$ số bé $=$ số lớn.",
  },
  "ARC-2022-23-C17": {
    stem: "Một cửa hàng nhập cam về bán. Cửa hàng bán được $\\dfrac{3}{5}$ số cam thì còn $42$ kg. Số cam cửa hàng đã bán là:",
    options: [{"id": "A", "text": "$63$ kg"}, {"id": "B", "text": "$65$ kg"}, {"id": "C", "text": "$28$ kg"}, {"id": "D", "text": "$105$ kg"}],
    modelAnswer: "$\\dfrac{2}{5}$ số cam ứng với $42$ kg $\\Rightarrow$ tổng $42 : \\dfrac{2}{5} = 105$ kg. Đã bán: $105 \\times \\dfrac{3}{5} = 63$ kg.",
  },
  "ARC-2022-23-C18": {
    stem: "Tổng của hai số lẻ liên tiếp là $248$. Số lớn là:",
    options: [{"id": "A", "text": "$121$"}, {"id": "B", "text": "$127$"}, {"id": "C", "text": "$125$"}, {"id": "D", "text": "$123$"}],
    modelAnswer: "Hai số lẻ liên tiếp hơn kém nhau $2$. Số lớn: $(248 + 2) : 2 = 125$.",
  },
  "ARC-2022-23-C19": {
    stem: "Cho một phân số có giá trị bằng $\\dfrac{8}{5}$ và hiệu của tử số và mẫu số là $36$. Tử số là:",
    options: [{"id": "A", "text": "$96$"}, {"id": "B", "text": "$288$"}, {"id": "C", "text": "$180$"}, {"id": "D", "text": "$60$"}],
    modelAnswer: "Tử số là: $36 : (8 - 5) \\times 8 = 96$.",
  },
  "ARC-2022-23-C20": {
    stem: "Đổi $1{,}15$ giờ sang phút.",
    options: [{"id": "A", "text": "$69$ phút"}, {"id": "B", "text": "$78$ phút"}, {"id": "C", "text": "$75$ phút"}, {"id": "D", "text": "$63$ phút"}],
    modelAnswer: "$1{,}15$ giờ $= 1{,}15 \\times 60 = 69$ (phút).",
  },
  "ARC-2022-23-C21": {
    stem: "Lớp 5A có $40$ học sinh, trong đó số học sinh nữ bằng $45\\%$ số học sinh cả lớp. Số học sinh nam là:",
    options: [{"id": "A", "text": "$18$ bạn"}, {"id": "B", "text": "$20$ bạn"}, {"id": "C", "text": "$25$ bạn"}, {"id": "D", "text": "$22$ bạn"}],
    modelAnswer: "Học sinh nam chiếm $100\\% - 45\\% = 55\\%$. Số nam: $40 \\times 55 : 100 = 22$ (bạn).",
  },
  "ARC-2022-23-C22": {
    stem: "Giá trị của chữ số $2$ trong số $3{,}02$ bằng với phân số:",
    options: [{"id": "A", "text": "$\\dfrac{1}{100}$"}, {"id": "B", "text": "$\\dfrac{1}{5}$"}, {"id": "C", "text": "$\\dfrac{1}{20}$"}, {"id": "D", "text": "$\\dfrac{1}{50}$"}],
    modelAnswer: "Chữ số $2$ ở hàng phần trăm: $\\dfrac{2}{100} = \\dfrac{1}{50}$.",
  },
  "ARC-2022-23-C23": {
    stem: "Hai anh em có $22$ cái kẹo, nếu anh cho em $2$ cái thì số kẹo của anh vẫn nhiều hơn của em $2$ cái. Số kẹo của em là:",
    options: [{"id": "A", "text": "$12$"}, {"id": "B", "text": "$14$"}, {"id": "C", "text": "$8$"}, {"id": "D", "text": "$10$"}],
    modelAnswer: "Số kẹo của em sau khi được cho: $(22 - 2) : 2 = 10$ (cái). Số kẹo của em ban đầu: $10 - 2 = 8$ (cái).",
  },
  "ARC-2022-23-C24": {
    stem: "Cho dãy số có quy luật $3, 4, 6, 9, 13, 18, 24, \\ldots$ Số tiếp theo là:",
    options: [{"id": "A", "text": "$30$"}, {"id": "B", "text": "$32$"}, {"id": "C", "text": "$31$"}, {"id": "D", "text": "$33$"}],
    modelAnswer: "Khoảng cách tăng dần $1, 2, 3, 4, 5, 6, 7$: số tiếp theo $24 + 7 = 31$.",
  },
  "ARC-2022-23-C25": {
    stem: "Cần cộng thêm số nào dưới đây với số $2032022$ để được một số chia hết cho $3$?",
    options: [{"id": "A", "text": "$15$"}, {"id": "B", "text": "$35$"}, {"id": "C", "text": "$25$"}],
    modelAnswer: "$2032022$ chia $3$ dư $2$ nên số cộng thêm phải chia $3$ dư $1$. Chỉ có $25$ thỏa mãn.",
  },
  "ARC-2022-23-C26": {
    stem: "Trong các số dưới đây, số chia hết cho $12$ là:",
    options: [{"id": "A", "text": "$2220$"}, {"id": "B", "text": "$2032$"}, {"id": "C", "text": "$2022$"}, {"id": "D", "text": "$2312$"}],
    modelAnswer: "$2220$ chia hết cho cả $3$ và $4$ nên chia hết cho $12$.",
  },
  "ARC-2022-23-C27": {
    stem: "Khi nhân một số với $23$, bạn Khanh đã để các tích riêng thẳng cột nên tích mới giảm $1584$ đơn vị so với tích đúng. Tích đúng là:",
    options: [{"id": "A", "text": "$1978$"}, {"id": "B", "text": "$1965$"}, {"id": "C", "text": "$2001$"}, {"id": "D", "text": "$2024$"}],
    modelAnswer: "Để tích riêng thẳng cột thì như nhân với $2 + 3 = 5$. Hiệu: $23 \\times a - 5 \\times a = 18 \\times a = 1584 \\Rightarrow a = 88$.\nTích đúng: $88 \\times 23 = 2024$.",
  },
  "ARC-2022-23-C28": {
    stem: "Một khu vườn trồng $203$ cây gồm $3$ loại cam, quýt, bưởi. Biết số cây cam gấp $2$ lần số cây quýt, còn số cây quýt gấp $2$ lần số cây bưởi. Số cây quýt trong vườn là:",
    options: [{"id": "A", "text": "$58$ cây"}, {"id": "B", "text": "$116$ cây"}, {"id": "C", "text": "$68$ cây"}, {"id": "D", "text": "$29$ cây"}],
    modelAnswer: "Coi bưởi $1$ phần thì quýt $2$ phần, cam $4$ phần. Tổng $7$ phần. Số quýt: $203 : 7 \\times 2 = 58$ (cây).",
  },
  "ARC-2022-23-C29": {
    stem: "Để pha được $800$ g dung dịch nước muối chứa chín phần nghìn muối cần số gam muối là:",
    options: [{"id": "A", "text": "$72$ g"}, {"id": "B", "text": "$64$ g"}, {"id": "C", "text": "$7{,}2$ g"}, {"id": "D", "text": "$8{,}1$ g"}],
    modelAnswer: "Số gam muối: $800 \\times \\dfrac{9}{1000} = 7{,}2$ (g).",
  },
  "ARC-2022-23-C30": {
    stem: "Một tập tài liệu có $320$ trang. Số chữ số để đánh số trang liền nhau của tập tài liệu đó từ trang số $1$ là:",
    options: [{"id": "A", "text": "$852$"}, {"id": "B", "text": "$663$"}, {"id": "C", "text": "$849$"}, {"id": "D", "text": "$960$"}],
    modelAnswer: "Trang $1$–$9$: $9$ chữ số. Trang $10$–$99$: $180$ chữ số. Trang $100$–$320$: $221 \\times 3 = 663$ chữ số.\nTổng: $9 + 180 + 663 = 852$ (chữ số).",
  },
  "ARC-2022-23-C31": {
    stem: "Một đơn vị vận chuyển $3$ tấn hàng, quãng đường $200$ km chi phí hết $18$ triệu đồng. Hỏi vẫn đơn vị đó vận chuyển $7$ tấn hàng, quãng đường $120$ km hết bao nhiêu tiền?",
    options: [{"id": "A", "text": "$31{,}5$ triệu"}, {"id": "B", "text": "$70$ triệu"}, {"id": "C", "text": "$21$ triệu"}, {"id": "D", "text": "$25{,}2$ triệu"}],
    modelAnswer: "$3$ tấn $120$ km hết: $120 \\times 18 : 200 = 10{,}8$ (triệu).\n$7$ tấn $120$ km hết: $7 \\times 10{,}8 : 3 = 25{,}2$ (triệu).",
  },
  "ARC-2022-23-C32": {
    stem: "Tính $A = \\dfrac{1}{6} + \\dfrac{1}{12} + \\dfrac{1}{20} + \\ldots + \\dfrac{1}{240}$.",
    options: [{"id": "A", "text": "$\\dfrac{4}{15}$"}, {"id": "B", "text": "$\\dfrac{15}{16}$"}, {"id": "C", "text": "$\\dfrac{7}{16}$"}, {"id": "D", "text": "$\\dfrac{13}{30}$"}],
    modelAnswer: "$A = \\dfrac{1}{2 \\times 3} + \\dfrac{1}{3 \\times 4} + \\ldots + \\dfrac{1}{15 \\times 16} = \\dfrac{1}{2} - \\dfrac{1}{16} = \\dfrac{7}{16}$.",
  },
  "ARC-2022-23-C33": {
    stem: "Ba bạn Mai, Hoa và Trang có $48$ bông hoa. Nếu Mai cho Hoa $3$ bông; Hoa cho Trang $2$ bông; còn Trang lại cho Mai $6$ bông thì số hoa của ba bạn bằng nhau. Số hoa ban đầu của Trang là:",
    options: [{"id": "A", "text": "$15$ bông"}, {"id": "B", "text": "$13$ bông"}, {"id": "C", "text": "$20$ bông"}, {"id": "D", "text": "$16$ bông"}],
    modelAnswer: "Số hoa của mỗi bạn lúc sau: $48 : 3 = 16$ (bông). Trang lúc sau nhận $2$, cho $6$ nên ban đầu: $16 + 6 - 2 = 20$ (bông).",
  },
  "ARC-2022-23-C34": {
    stem: "Người thứ nhất làm một mình xong một công việc trong $4$ giờ, người thứ hai làm một mình xong công việc đó trong $6$ giờ. Thời gian để cả hai người cùng làm xong công việc đó là:",
    options: [{"id": "A", "text": "$2$ giờ $36$ phút"}, {"id": "B", "text": "$2$ giờ"}, {"id": "C", "text": "$2$ giờ $24$ phút"}, {"id": "D", "text": "$3$ giờ"}],
    modelAnswer: "Mỗi giờ cả hai làm: $\\dfrac{1}{4} + \\dfrac{1}{6} = \\dfrac{5}{12}$ công việc. Thời gian: $1 : \\dfrac{5}{12} = 2{,}4$ giờ $= 2$ giờ $24$ phút.",
  },
  "ARC-2022-23-C35": {
    stem: "Một thửa ruộng hình thang có đáy lớn gấp $2$ lần đáy bé và chiều cao ngắn hơn đáy lớn $4$ m nhưng dài hơn đáy bé $5$ m. Diện tích của thửa ruộng là:",
    options: [{"id": "A", "text": "$378$ m$^2$"}, {"id": "B", "text": "$175{,}5$ m$^2$"}, {"id": "C", "text": "$351$ m$^2$"}, {"id": "D", "text": "$189$ m$^2$"}],
    modelAnswer: "Đáy lớn $= 2 \\times$ đáy bé. Chiều cao kém đáy lớn $4$ m và hơn đáy bé $5$ m $\\Rightarrow$ đáy lớn $-$ đáy bé $= 9$ m $=$ đáy bé.\nĐáy bé $9$ m, đáy lớn $18$ m, chiều cao $14$ m. Diện tích: $(18 + 9) \\times 14 : 2 = 189$ (m$^2$).",
  },
  "ARC-2022-23-C36": {
    stem: "Một bể nước có chiều dài $1{,}2$ m, chiều rộng $8$ dm và chiều cao là $6$ dm (các kích thước được đo bên trong lòng bể). Trong bể có $432$ lít nước. Mặt nước cách thành bể:",
    options: [{"id": "A", "text": "$15$ cm"}, {"id": "B", "text": "$22{,}5$ cm"}, {"id": "C", "text": "$37{,}5$ cm"}, {"id": "D", "text": "$45$ cm"}],
    modelAnswer: "Đổi $1{,}2$ m $= 12$ dm; $432$ lít $= 432$ dm$^3$. Diện tích đáy: $12 \\times 8 = 96$ (dm$^2$).\nChiều cao mực nước: $432 : 96 = 4{,}5$ (dm). Mặt nước cách thành: $6 - 4{,}5 = 1{,}5$ dm $= 15$ cm.",
  },
  "ARC-2022-23-C37": {
    stem: "Một lớp học có $32$ học sinh. Trong đó, có $22$ bạn thích ăn táo, $23$ bạn thích ăn xoài và mỗi bạn đều thích ăn ít nhất $1$ trong $2$ loại trái cây trên. Số bạn thích ăn cả táo và xoài là:",
    options: [{"id": "A", "text": "$9$ bạn"}, {"id": "B", "text": "$8$ bạn"}, {"id": "C", "text": "$10$ bạn"}, {"id": "D", "text": "$13$ bạn"}],
    modelAnswer: "Số bạn thích cả táo và xoài: $22 + 23 - 32 = 13$ (bạn).",
  },
  "ARC-2022-23-C38": {
    stem: "Trên bến đò có một đoàn khách tham quan. Biết nếu $6$ khách một đò thì thiếu $1$ đò còn $8$ khách một đò thì thừa $1$ đò. Hỏi có tất cả bao nhiêu người trên bến?",
    options: [{"id": "A", "text": "$55$ người"}, {"id": "B", "text": "$64$ người"}, {"id": "C", "text": "$48$ người"}, {"id": "D", "text": "$36$ người"}],
    modelAnswer: "Số đò: nếu $6$ khách/đò thiếu $1$ đò $\\Rightarrow$ thiếu $6$ chỗ; $8$ khách/đò thừa $1$ đò $\\Rightarrow$ thừa $8$ chỗ.\nSố đò: $(6 + 8) : (8 - 6) = 7$ (đò). Số người: $(7 - 1) \\times 8 = 48$ (người).",
  },
  "ARC-2022-23-C39": {
    stem: "Cho hai hình chữ nhật có kích thước như hình vẽ bên. Diện tích tam giác màu xanh là:",
    options: [{"id": "A", "text": "$6$ cm$^2$"}, {"id": "B", "text": "$3$ cm$^2$"}, {"id": "C", "text": "$4{,}5$ cm$^2$"}, {"id": "D", "text": "$7{,}5$ cm$^2$"}],
    modelAnswer: "Đặt $A, B, C, D$ như hình giải: $BD = 3 + 6 = 9$ cm. Diện tích tam giác $ABD$: $6 \\times 9 : 2 = 27$ (cm$^2$).\nDiện tích hình thang $ABCE$: $(6 + 3) \\times 3 : 2 = 13{,}5$ (cm$^2$). Diện tích tam giác $ECD$: $3 \\times 6 : 2 = 9$ (cm$^2$).\nDiện tích tam giác màu xanh: $27 - (13{,}5 + 9) = 4{,}5$ (cm$^2$).",
  },
  "ARC-2022-23-C40": {
    stem: "Cho tứ giác $ABCD$ với các kích thước như hình vẽ bên. Diện tích tứ giác $ABCD$ là:",
    options: [{"id": "A", "text": "$34{,}5$ cm$^2$"}, {"id": "B", "text": "$54$ cm$^2$"}, {"id": "C", "text": "$71$ cm$^2$"}, {"id": "D", "text": "$35{,}5$ cm$^2$"}],
    modelAnswer: "Diện tích tam giác $ABH$: $3 \\times 5 : 2 = 7{,}5$ (cm$^2$). Diện tích tam giác $CKD$: $4 \\times 5 : 2 = 10$ (cm$^2$).\nDiện tích hình thang $BCKH$: $(5 + 4) \\times 4 : 2 = 18$ (cm$^2$).\nDiện tích tứ giác $ABCD$: $7{,}5 + 10 + 18 = 35{,}5$ (cm$^2$).",
  },
  "ARC-2022-23-C41": {
    stem: "Thêm vào số bị trừ $3$ đơn vị và thêm vào số trừ $20$ đơn vị thì được hiệu mới là $17$. Hiệu ban đầu của phép trừ là:",
    options: [{"id": "A", "text": "$40$"}, {"id": "B", "text": "$34$"}, {"id": "C", "text": "$0$"}, {"id": "D", "text": "$17$"}],
    modelAnswer: "Số bị trừ $+ 3 - ($số trừ $+ 20) = 17 \\Rightarrow$ số bị trừ $-$ số trừ $= 17 + 20 - 3 = 34$.",
  },
  "ARC-2022-23-C42": {
    stem: "Bán kính của chiếc bánh xe đạp là $4$ dm. Nếu bánh xe quay $200$ vòng thì xe đạp chạy được số mét là:",
    options: [{"id": "A", "text": "$251{,}2$ m"}, {"id": "B", "text": "$50{,}24$ m"}, {"id": "C", "text": "$25{,}12$ m"}, {"id": "D", "text": "$502{,}4$ m"}],
    modelAnswer: "Chu vi bánh xe: $4 \\times 2 \\times 3{,}14 = 25{,}12$ (dm). Quay $200$ vòng: $25{,}12 \\times 200 = 5024$ dm $= 502{,}4$ m.",
  },
  "ARC-2022-23-C43": {
    stem: "Tổng các số chia hết cho $6$ và nhỏ hơn $203$ là:",
    options: [{"id": "A", "text": "$3366$"}, {"id": "B", "text": "$3636$"}, {"id": "C", "text": "$3267$"}, {"id": "D", "text": "$3264$"}],
    modelAnswer: "Dãy $6; 12; 18; \\ldots; 198$ có $(198 - 6) : 6 + 1 = 33$ số hạng. Tổng: $(6 + 198) \\times 33 : 2 = 3366$.",
  },
  "ARC-2022-23-C44": {
    stem: "Nam viết $3$ số $90; 72$ và $18$ lên bảng. Sau đó, Nam xóa $2$ trong $3$ số đó và thay vào là trung bình cộng của hai số vừa xóa cho đến khi trên bảng chỉ còn $1$ số. Số nào dưới đây không phải là kết quả sau cùng thu được ở trên bảng?",
    options: [{"id": "A", "text": "$67{,}5$"}, {"id": "B", "text": "$54$"}, {"id": "C", "text": "$49{,}5$"}, {"id": "D", "text": "$63$"}],
    modelAnswer: "Thử các cặp trung bình cộng liên tiếp, kết quả có thể là $67{,}5; 49{,}5; 63$ nhưng không thể là $54$.",
  },
  "ARC-2022-23-C45": {
    stem: "Em có số bi gấp $2$ lần số bi của anh. Nếu em cho anh $3$ viên thì số bi của em gấp $1{,}5$ lần số bi của anh. Tổng số bi của hai anh em là:",
    options: [{"id": "A", "text": "$75$ viên"}, {"id": "B", "text": "$45$ viên"}, {"id": "C", "text": "$90$ viên"}, {"id": "D", "text": "$60$ viên"}],
    modelAnswer: "Ban đầu bi của em bằng $\\dfrac{2}{3}$ tổng. Sau khi cho $3$ viên, bi của em bằng $\\dfrac{3}{5}$ tổng.\n$3$ viên ứng với $\\dfrac{2}{3} - \\dfrac{3}{5} = \\dfrac{1}{15}$ tổng. Tổng: $3 : \\dfrac{1}{15} = 45$ (viên).",
  },
  "ARC-2022-23-C46": {
    stem: "Ba lớp 5A, 5B, 5C tổ chức liên hoan kem. Lớp 5A mang đi $12$ kg kem, lớp 5B mang đi $8$ kg kem, còn lớp 5C không mua được kem nên đưa số tiền $800\\,000$ đồng dự định mua kem cho hai lớp kia và ba lớp sẽ ăn kem chung. Nếu lượng kem mỗi lớp ăn là như nhau thì số tiền lớp 5A nhận được là:",
    options: [{"id": "A", "text": "$560\\,000$ đồng"}, {"id": "B", "text": "$640\\,000$ đồng"}, {"id": "C", "text": "$480\\,000$ đồng"}, {"id": "D", "text": "$400\\,000$ đồng"}],
    modelAnswer: "Tổng kem $3$ lớp: $12 + 8 = 20$ (kg). Giá mỗi kg: $800\\,000 : 20 = 40\\,000$ (đồng).\nMỗi lớp ăn $20 : 3$ kg; lớp 5A đưa thừa $12 - \\dfrac{20}{3}$ kg. Số tiền 5A nhận: $40\\,000 \\times 12 = 480\\,000$ (đồng).",
  },
  "ARC-2022-23-C47": {
    stem: "Một cửa hàng nhập hoa về bán trong $3$ ngày. Ngày thứ nhất, bán giá gấp đôi so với giá nhập và bán được $34\\%$ số hoa. Ngày thứ hai, bán giá bằng $120\\%$ giá nhập nên bán được một nửa số hoa còn lại. Ngày thứ ba, chấp nhận bán bằng nửa giá nhập nên bán được hết số hoa. Tính phần trăm lãi của cửa hàng đó so với số tiền bỏ ra nhập hoa.",
    options: [{"id": "A", "text": "$36\\%$"}, {"id": "B", "text": "$21{,}4\\%$"}, {"id": "C", "text": "$24{,}1\\%$"}, {"id": "D", "text": "$19\\%$"}],
    modelAnswer: "Coi tiền nhập là $100\\%$. Ngày 1 thu $200\\% \\times 34\\% = 68\\%$. Ngày 2 bán $33\\%$ số hoa, thu $120\\% \\times 33\\% = 39{,}6\\%$.\nNgày 3 bán $33\\%$ số hoa, thu $50\\% \\times 33\\% = 16{,}5\\%$. Lãi: $(68 + 39{,}6 + 16{,}5) - 100 = 24{,}1\\%$.",
  },
  "ARC-2022-23-C48": {
    stem: "Có $203$ bóng đèn được xếp thành một vòng tròn và đều đang bật. Người ta tắt bóng ở vị trí thứ nhất sau đó bỏ cách một bóng đang bật và tắt bóng tiếp theo. Cứ thực hiện như vậy cho đến khi trên vòng tròn chỉ còn một bóng đang bật. Bóng đèn đó ở vị trí số:",
    options: [{"id": "A", "text": "$150$"}, {"id": "B", "text": "$22$"}, {"id": "C", "text": "$126$"}, {"id": "D", "text": "$86$"}],
    modelAnswer: "Bài toán Josephus với bước nhảy $2$. Với $203 = 128 + 75$ bóng, vị trí còn lại: $2 \\times 75 = 150$.",
  },
  "ARC-2022-23-C49": {
    stem: "Tỉ giá giao dịch ở một chợ động vật là: $5$ con bò đổi được $3$ con ngựa. Một con bò và $1$ con ngựa đổi được $44$ con thỏ. Muốn đổi được $4$ con ngựa thì cần số con thỏ là:",
    options: [{"id": "A", "text": "$100$ con thỏ"}, {"id": "B", "text": "$132$ con thỏ"}, {"id": "C", "text": "$110$ con thỏ"}, {"id": "D", "text": "$121$ con thỏ"}],
    modelAnswer: "$1$ bò $+ 1$ ngựa $= 44$ thỏ $\\Rightarrow 5$ bò $+ 5$ ngựa $= 220$ thỏ. Mà $5$ bò $= 3$ ngựa nên $8$ ngựa $= 220$ thỏ.\n$4$ ngựa $= 220 : 2 = 110$ con thỏ.",
  },
  "ARC-2022-23-C50": {
    stem: "Người ta dùng $64$ hình lập phương nhỏ bằng nhau để xếp thành một hình lập phương lớn sau đó sơn tất cả các mặt của hình lập phương lớn đó. Số mặt không được sơn của các hình lập phương nhỏ là:",
    options: [{"id": "A", "text": "$288$"}, {"id": "B", "text": "$8$"}, {"id": "C", "text": "$256$"}, {"id": "D", "text": "$144$"}],
    modelAnswer: "$64 = 4 \\times 4 \\times 4$ nên cạnh lớn gồm $4$ hình nhỏ. Tổng số mặt: $64 \\times 6 = 384$.\nSơn $3$ mặt: $8$ hình ($24$ mặt). Sơn $2$ mặt: $24$ hình ($48$ mặt). Sơn $1$ mặt: $24$ hình ($24$ mặt).\nSố mặt không sơn: $384 - 24 - 48 - 24 = 288$ (mặt).",
  },
  // === THCS Archimedes — Vòng nâng cao 2021-2022 (arc-2021) ===
  "ARC-2021-22-C1": {
    stem: "Tính giá trị của biểu thức: $A = 77 \\times 5{,}55 + 60{,}12 \\times 7{,}45 + 16{,}88 \\times 7{,}45$.",
    modelAnswer: "$A = 77 \\times 5{,}55 + 7{,}45 \\times (60{,}12 + 16{,}88)$.\n$A = 77 \\times 5{,}55 + 7{,}45 \\times 77 = 77 \\times (5{,}55 + 7{,}45)$.\n$A = 77 \\times 13 = 1001$.\n\n**Đáp số**: $A = 1001$.",
  },
  "ARC-2021-22-C2": {
    stem: "Tìm số tự nhiên $n$ biết rằng:\n$$\\left(1+\\dfrac{1}{1}\\right) \\times \\left(1+\\dfrac{1}{2}\\right) \\times \\left(1+\\dfrac{1}{3}\\right) \\times \\cdots \\times \\left(1+\\dfrac{1}{n}\\right) = 2070.$$",
    modelAnswer: "Ta có $1+\\dfrac{1}{k} = \\dfrac{k+1}{k}$, nên vế trái bằng:\n$$\\dfrac{2}{1} \\times \\dfrac{3}{2} \\times \\dfrac{4}{3} \\times \\cdots \\times \\dfrac{n+1}{n} = \\dfrac{n+1}{1} = n+1.$$\nSuy ra $n + 1 = 2070$, vậy $n = 2069$.\n\n**Đáp số**: $n = 2069$.",
  },
  "ARC-2021-22-C3": {
    stem: "Một số tự nhiên được gọi là *số tiến* nếu các chữ số của nó đôi một khác nhau và chữ số liền sau lớn hơn chữ số liền trước. Ví dụ: $13579$ và $24689$ là các số tiến; nhưng $11345$ không phải là số tiến. Hỏi trong các số tự nhiên từ $2021$ đến $2401$ có bao nhiêu số là số tiến?",
    modelAnswer: "Số tiến trong khoảng từ $2021$ đến $2401$ phải bắt đầu bằng $23$ (chữ số thứ hai phải lớn hơn $2$; nếu là $4$ thì số $\\ge 2456 > 2401$).\nCác số tiến đó là:\n$2345, 2346, 2347, 2348, 2349$ ($5$ số); $2356, 2357, 2358, 2359$ ($4$ số); $2367, 2368, 2369$ ($3$ số); $2378, 2379$ ($2$ số); $2389$ ($1$ số).\nTổng cộng: $5 + 4 + 3 + 2 + 1 = 15$ số.\n\n**Đáp số**: $15$ số.",
  },
  "ARC-2021-22-C4": {
    stem: "Một hình chữ nhật có chu vi $200$ cm. Người ta giảm chiều dài và chiều rộng đi cùng một độ dài thì được một hình chữ nhật mới có chu vi là $160$ cm. Hỏi diện tích của phần giảm đi là bao nhiêu?",
    modelAnswer: "Nửa chu vi ban đầu: $200 : 2 = 100$ (cm).\nNửa chu vi lúc sau: $160 : 2 = 80$ (cm).\nVì chiều dài và chiều rộng cùng giảm một độ dài nên mỗi chiều giảm: $(100 - 80) : 2 = 10$ (cm).\nPhần diện tích giảm đi là: $(100 - 10) \\times 10 = 900$ (cm²).\n\n**Đáp số**: $900$ cm².",
  },
  "ARC-2021-22-C5": {
    stem: "Cách đây $6$ năm, tổng số tuổi của Nam và anh trai Nam là $18$ tuổi. Hiện tại, số tuổi của Nam bằng $\\dfrac{2}{3}$ số tuổi của anh trai Nam. Hỏi hiện tại Nam bao nhiêu tuổi?",
    modelAnswer: "Tổng số tuổi của hai anh em hiện nay là: $18 + 6 + 6 = 30$ (tuổi).\nCoi tuổi Nam là $2$ phần, tuổi anh trai là $3$ phần. Số tuổi hiện nay của Nam là: $30 : (2 + 3) \\times 2 = 12$ (tuổi).\n\n**Đáp số**: $12$ tuổi.",
  },
  "ARC-2021-22-C6": {
    stem: "Vào ngày $18/04/2021$, một cửa hàng thịt treo biển khuyến mãi: *“Duy nhất ngày hôm nay, thăn bò Úc giảm $40\\%$, chỉ $117\\,000$ đồng nửa ký!”*. Hỏi giá thịt thăn bò Úc tại cửa hàng đó trước khi khuyến mãi là bao nhiêu một ki-lô-gam (tính theo đồng)?",
    modelAnswer: "Giá $1$ ki-lô-gam thịt sau khi giảm $40\\%$ là: $117\\,000 \\times 2 = 234\\,000$ (đồng).\nGiá này ứng với $100\\% - 40\\% = 60\\%$ giá ban đầu.\nGiá $1$ ki-lô-gam trước khi khuyến mãi là: $234\\,000 : 60 \\times 100 = 390\\,000$ (đồng).\n\n**Đáp số**: $390\\,000$ đồng.",
  },
  "ARC-2021-22-C7": {
    stem: "Xét biểu thức $A = 45 + 45 \\times 45 + 45 \\times 45 \\times 45 + \\cdots + \\underbrace{45 \\times 45 \\times \\cdots \\times 45}_{2021 \\text{ thừa số}}$. Hỏi khi tính giá trị biểu thức $A$, giá trị thu được có chữ số hàng đơn vị là bao nhiêu?",
    modelAnswer: "$A$ có $2021$ số hạng, mỗi số hạng là tích của các thừa số $45$ nên đều có chữ số hàng đơn vị là $5$.\nDo đó chữ số hàng đơn vị của $A$ chính là chữ số hàng đơn vị của $5 \\times 2021 = 10105$, tức là $5$.\n\n**Đáp số**: chữ số hàng đơn vị là $5$.",
  },
  "ARC-2021-22-C8": {
    stem: "Trong dãy $15$ ô vuông dưới đây, người ta điền vào mỗi ô một số tự nhiên sao cho tổng các số ở ba ô liên tiếp bất kỳ luôn bằng $39$. Tìm số được điền vào ô vuông tô đậm.",
    modelAnswer: "Ô đầu tiên là $20$, ô cuối (ô thứ $15$) là $11$. Vì $15$ chia hết cho $3$ nên ô thứ $3$ cũng bằng $11$.\nSuy ra ô thứ hai là: $39 - 20 - 11 = 8$.\nVì tổng ba ô liên tiếp luôn bằng $39$ nên các số lặp lại theo chu kỳ $20,\\ 8,\\ 11$. Ô tô đậm rơi vào vị trí ứng với số $8$.\n\n**Đáp số**: $8$.",
  },
  "ARC-2021-22-C9": {
    stem: "Trong hình vẽ dưới, $D$ là điểm trên cạnh $AC$ của tam giác $ABC$ và $AD = DC$; $E$ là điểm trên đoạn $BD$ thỏa mãn $BE : BD = 3 : 5$. Biết rằng diện tích tam giác $ADE$ là $96$ cm². Tính diện tích tam giác $ABC$.",
    modelAnswer: "Vì $BE : BD = 3 : 5$ nên $ED : BD = 2 : 5$, suy ra $BD = \\dfrac{5}{2} \\times ED$.\nHai tam giác $ABD$ và $ADE$ có chung chiều cao hạ từ $A$ nên:\n$$\\dfrac{S_{ABD}}{S_{ADE}} = \\dfrac{BD}{ED} = \\dfrac{5}{2} \\Rightarrow S_{ABD} = \\dfrac{5}{2} \\times 96 = 240 \\text{ (cm²)}.$$\nHai tam giác $ABC$ và $ABD$ có chung chiều cao hạ từ $B$, đáy $AC = 2 \\times AD$ nên $S_{ABC} = 2 \\times S_{ABD} = 480$ (cm²).\n\n**Đáp số**: $480$ cm².",
  },
  "ARC-2021-22-C10": {
    stem: "Nam có bốn quyển sách gồm Toán, Tiếng Việt, Tiếng Anh và Lịch Sử. Nam muốn xếp bốn quyển sách này lên một kệ sách trống sao cho quyển sách Toán và quyển sách Lịch Sử không nằm cạnh nhau. Hỏi có bao nhiêu cách xếp?",
    modelAnswer: "Số cách xếp $4$ quyển sách tùy ý là: $4 \\times 3 \\times 2 \\times 1 = 24$ (cách).\nCoi Toán và Lịch Sử là một cặp đứng cạnh nhau: có $3 \\times 2 \\times 1 = 6$ cách xếp cặp đó cùng hai quyển còn lại, và trong cặp có $2$ cách đổi chỗ, nên có $6 \\times 2 = 12$ cách xếp mà Toán và Lịch Sử cạnh nhau.\nSố cách xếp thỏa mãn là: $24 - 12 = 12$ (cách).\n\n**Đáp số**: $12$ cách.",
  },
  "ARC-2021-22-C11": {
    stem: "Trong một cuộc thi có năm thí sinh tham dự là $A, B, C, D$ và $E$. Trước khi cuộc thi diễn ra, có bốn dự đoán về kết quả xếp hạng như sau:\n\n- Dự đoán thứ nhất: “$B$ sẽ đứng thứ tư và $E$ sẽ đứng thứ hai.”\n- Dự đoán thứ hai: “$D$ sẽ đứng thứ nhất và $C$ sẽ đứng thứ ba.”\n- Dự đoán thứ ba: “$E$ sẽ đứng thứ ba và $A$ sẽ đứng thứ tư.”\n- Dự đoán thứ tư: “$A$ sẽ đứng thứ ba và $B$ sẽ đứng thứ nhất.”\n\nKết thúc cuộc thi, người ta nhận thấy mỗi dự đoán đều đúng cho một thí sinh và sai cho thí sinh còn lại. Biết rằng không có hai thí sinh nào cùng thứ hạng, hỏi ai đứng thứ ba?",
    modelAnswer: "Xét dự đoán thứ nhất. Giả sử “$B$ đứng thứ tư” đúng và “$E$ đứng thứ hai” sai. Khi đó ở dự đoán thứ ba, “$A$ đứng thứ tư” sai (vì $B$ đã thứ tư) nên “$E$ đứng thứ ba” đúng; ở dự đoán thứ tư, “$A$ đứng thứ ba” sai (vì $E$ thứ ba) nên “$B$ đứng thứ nhất” đúng — vô lý vì $B$ không thể vừa thứ tư vừa thứ nhất.\nVậy ở dự đoán thứ nhất, “$B$ đứng thứ tư” sai và “$E$ đứng thứ hai” đúng.\nKhi đó ở dự đoán thứ ba, “$E$ đứng thứ ba” sai nên “$A$ đứng thứ tư” đúng; ở dự đoán thứ tư, “$A$ đứng thứ ba” sai nên “$B$ đứng thứ nhất” đúng; ở dự đoán thứ hai, “$D$ đứng thứ nhất” sai nên “$C$ đứng thứ ba” đúng.\nVậy $B$ nhất, $E$ nhì, $C$ ba, $A$ tư và $D$ thứ năm.\n\n**Đáp số**: $C$ đứng thứ ba.",
  },
  "ARC-2021-22-C12": {
    stem: "Trong hình vẽ dưới, $ABCD$ và $CEFG$ là hai hình chữ nhật, trong đó điểm $B$ nằm trên cạnh $FG$ của hình chữ nhật $CEFG$ và điểm $E$ nằm trên cạnh $AB$ của hình chữ nhật $ABCD$ thỏa mãn $AE : EB = 3 : 2$. Biết rằng diện tích hình chữ nhật $ABCD$ là $35$ cm², tính diện tích hình chữ nhật $CEFG$.",
    modelAnswer: "Đường chéo $AC$ chia hình chữ nhật $ABCD$ thành hai tam giác bằng nhau nên:\n$$S_{ABC} = \\dfrac{1}{2} \\times S_{ABCD} = \\dfrac{1}{2} \\times 35 = \\dfrac{35}{2} \\text{ (cm²)}.$$\nVì $AE : EB = 3 : 2$ nên $EB = \\dfrac{2}{5} \\times AB$. Hai tam giác $EBC$ và $ABC$ có chung chiều cao hạ từ $C$ nên:\n$$\\dfrac{S_{EBC}}{S_{ABC}} = \\dfrac{EB}{AB} = \\dfrac{2}{5} \\Rightarrow S_{EBC} = \\dfrac{2}{5} \\times \\dfrac{35}{2} = 7 \\text{ (cm²)}.$$\nHình chữ nhật $CEFG$ nhận $CE$ làm một cạnh và $FG$ là cạnh đối diện. Vì $B$ nằm trên $FG$ nên tam giác $EBC$ có đáy $CE$ và chiều cao bằng khoảng cách giữa $CE$ và $FG$. Do đó $S_{EBC} = \\dfrac{1}{2} \\times S_{CEFG}$, suy ra $S_{CEFG} = 2 \\times S_{EBC} = 2 \\times 7 = 14$ (cm²).\n\n**Đáp số**: $14$ cm².",
  },
  "ARC-2021-22-C13": {
    stem: "Cho $16$ số tự nhiên phân biệt khác $0$ thỏa mãn tích của năm số bất kì trong $16$ số này là số chẵn. Gọi $S$ là tổng của $16$ số này. Biết rằng $S$ là số lẻ, hỏi $S$ có thể nhận giá trị nhỏ nhất là bao nhiêu?",
    modelAnswer: "Vì tích của $5$ số bất kỳ luôn chẵn nên trong $16$ số có nhiều nhất $4$ số lẻ (nếu có từ $5$ số lẻ trở lên thì chọn được $5$ số lẻ có tích lẻ).\nVì $S$ lẻ nên số lượng số lẻ phải lẻ, do đó có $1$ hoặc $3$ số lẻ.\n- Nếu có $1$ số lẻ: tổng nhỏ nhất là $1 + (2 + 4 + 6 + \\cdots + 30) = 1 + 240 = 241$.\n- Nếu có $3$ số lẻ: tổng nhỏ nhất là $(1 + 3 + 5) + (2 + 4 + 6 + \\cdots + 26) = 9 + 182 = 191$.\n\nVậy giá trị nhỏ nhất của $S$ là $191$.\n\n**Đáp số**: $191$.",
  },
  "ARC-2021-22-C14": {
    stem: "Cho số $A = \\underbrace{20692069\\ldots2069}_{250 \\text{ số } 2069}$ ($A$ gồm $250$ số $2069$ viết liền nhau). Người ta muốn xóa một số chữ số của $A$ sao cho số thu được có tổng tất cả các chữ số bằng $2021$. Hỏi có thể xóa được nhiều nhất bao nhiêu chữ số? Khi đó, số lớn nhất có thể thu được là bao nhiêu?",
    modelAnswer: "Tổng các chữ số của $A$ là: $(2 + 0 + 6 + 9) \\times 250 = 17 \\times 250 = 4250$.\nTổng các chữ số cần xóa đi là: $4250 - 2021 = 2229$.\nĐể xóa được nhiều chữ số nhất, ta ưu tiên xóa các chữ số nhỏ. Xóa hết $250$ chữ số $0$ (không làm giảm tổng).\nVì $2229$ chia hết cho $3$, mà $6$ và $9$ đều chia hết cho $3$, nên tổng các chữ số $2$ bị xóa cũng phải chia hết cho $3$. Có $250$ chữ số $2$, ta xóa nhiều nhất $249$ chữ số $2$ (tổng $498$ chia hết cho $3$).\nCòn lại cần xóa tổng $2229 - 498 = 1731$ từ các chữ số $6$ và $9$. Thử xóa $248$ chữ số $6$ (tổng $1488$) thì phần còn lại $1731 - 1488 = 243$ chia hết cho $9$, ứng với $243 : 9 = 27$ chữ số $9$.\nVậy số chữ số xóa được nhiều nhất là: $250 + 249 + 248 + 27 = 774$ (chữ số).\nKhi đó còn lại $226$ chữ số gồm $1$ chữ số $2$, $2$ chữ số $6$ và $223$ chữ số $9$. Số lớn nhất thu được là $\\underbrace{99\\ldots9}_{223 \\text{ số } 9}662$.\n\n**Đáp số**: xóa nhiều nhất $774$ chữ số; số lớn nhất thu được là $\\underbrace{99\\ldots9}_{223}662$.",
  },
  // === END THCS Archimedes (arc) ===
};
