/**
 * Seed the first personalized remedial set ("Bài thầy giao") for student mika.
 *
 * Source content: public/ref_exam/4B0/LuyenTap-ChuyenDe.md (9 weak-skill groups),
 * derived from the per-question analysis in BaoCao-DanhGia.md.
 *
 * Model (see docs/REMEDIAL-SETS-DESIGN.md):
 *   - Each "bài nhỏ" = one private Exam (ownerUserId = mika), shown at /luyen-rieng.
 *   - Deterministic exam id `rmd-<userId>-<key>` → upsert (NOT delete) keeps the
 *     Exam row + any Attempt history across re-seeds. Questions are replaced.
 *   - Each question keeps a real `topic` id (1 of the 10 system chuyên đề) so it
 *     still feeds mastery/readiness like a normal exam question.
 *
 * Idempotent. Resolves the owner by email (creates a minimal User if mika has
 * not signed in yet — safe because auth.ts sets allowDangerousEmailAccountLinking).
 *
 *   npx tsx scripts/seed-remedial-mika.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Owner email can be overridden via CLI for local preview, e.g.
//   npx tsx scripts/seed-remedial-mika.ts user-demo@local
// Default target is mika.
const OWNER_EMAIL = (process.argv[2] || "mikayeubo@gmail.com").toLowerCase();
const OWNER_NAME = OWNER_EMAIL === "mikayeubo@gmail.com" ? "Mika" : OWNER_EMAIL.split("@")[0];
const SOURCE_TAG = "4b0-remedial-mika";

type Grade = "L4" | "L5" | "NC";

interface RQ {
  type: "fill" | "mcq" | "essay";
  topic: string; // system topic id: phan|soh|hinh|do|ti|xs|tuoi|log|...
  grade: Grade;
  stem: string;
  options?: string[]; // mcq only, in display order
  correct: string; // mcq → letter "A".."D"; fill → value; essay → đáp số
  unit?: string;
  num?: number; // optional numeric answerSchema
  set?: number[]; // optional numeric_set answerSchema (unordered)
  modelAnswer?: string;
}

interface Bai {
  key: string;
  title: string;
  minutes: number;
  questions: RQ[];
}

// Helper: mcq option letters
const L = ["A", "B", "C", "D"] as const;

const BAI: Bai[] = [
  // ─── 1. Phân số: rút gọn · quy đồng · so sánh (phan) ───────────────────────
  {
    key: "phan-coban",
    title: "Phân số — rút gọn, quy đồng & so sánh",
    minutes: 30,
    questions: [
      { type: "fill", topic: "phan", grade: "L4", stem: "Rút gọn phân số $\\dfrac{36}{48}$ về tối giản. (Viết dạng a/b)", correct: "3/4", modelAnswer: "Chia cả tử và mẫu cho 12: $\\dfrac{36}{48}=\\dfrac{3}{4}$." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Rút gọn phân số $\\dfrac{60}{100}$ về tối giản. (Viết dạng a/b)", correct: "3/5", modelAnswer: "Chia cho 20: $\\dfrac{60}{100}=\\dfrac{3}{5}$." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Rút gọn phân số $\\dfrac{65}{117}$ về tối giản. (Viết dạng a/b)", correct: "5/9", modelAnswer: "Chia cho 13: $\\dfrac{65}{117}=\\dfrac{5}{9}$." },
      { type: "mcq", topic: "phan", grade: "L4", stem: "Phân số nào dưới đây ĐÃ tối giản?", options: ["13/39", "17/77", "63/24", "102/46"], correct: "B", modelAnswer: "$\\dfrac{13}{39}=\\dfrac13,\\ \\dfrac{63}{24}=\\dfrac{21}{8},\\ \\dfrac{102}{46}=\\dfrac{51}{23}$ — chỉ $\\dfrac{17}{77}$ không rút gọn thêm được." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Quy đồng mẫu số $\\dfrac{4}{7}$ và $\\dfrac{5}{6}$ với mẫu chung 42: $\\dfrac{4}{7}=\\dfrac{a}{42}$. Vậy a = ...", correct: "24", num: 24, modelAnswer: "$42:7=6$, nên $a=4\\times6=24$." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Viết $\\dfrac{5}{14}$ thành phân số có mẫu số 42: $\\dfrac{5}{14}=\\dfrac{a}{42}$. Vậy a = ...", correct: "15", num: 15, modelAnswer: "$42:14=3$, nên $a=5\\times3=15$." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Quy đồng mẫu số $\\dfrac{5}{6}$ về mẫu 42: $\\dfrac{5}{6}=\\dfrac{a}{42}$. Vậy a = ...", correct: "35", num: 35, modelAnswer: "$42:6=7$, nên $a=5\\times7=35$." },
      { type: "mcq", topic: "phan", grade: "L4", stem: "Điền dấu thích hợp: $\\dfrac{2}{3}\\ \\dots\\ \\dfrac{5}{6}$", options: ["<", ">", "="], correct: "A", modelAnswer: "$\\dfrac23=\\dfrac46<\\dfrac56$." },
      { type: "mcq", topic: "phan", grade: "L4", stem: "Phân số nào NHỎ HƠN $\\dfrac{2}{3}$?", options: ["4/5", "5/6", "4/8", "6/6"], correct: "C", modelAnswer: "$\\dfrac48=\\dfrac12<\\dfrac23$; các phân số khác đều $\\ge\\dfrac23$." },
      { type: "mcq", topic: "phan", grade: "L4", stem: "Dãy nào được sắp xếp từ BÉ đến LỚN?", options: ["3/8; 1/2; 3/5; 3/4", "1/2; 3/8; 3/5; 3/4", "3/8; 3/5; 1/2; 3/4", "3/4; 3/5; 1/2; 3/8"], correct: "A", modelAnswer: "$\\dfrac38<\\dfrac12<\\dfrac35<\\dfrac34$." },
      { type: "mcq", topic: "phan", grade: "L4", stem: "Khẳng định nào ĐÚNG?", options: ["1/3 + 1/3 < 1/2", "1/4 + 1/4 + 1/4 < 3/4", "1/6 + 1/6 + 1/6 < 2/3"], correct: "C", modelAnswer: "$\\dfrac16\\times3=\\dfrac12<\\dfrac23$. Hai ý kia: $\\dfrac23\\not<\\dfrac12$ và $\\dfrac34\\not<\\dfrac34$." },
      { type: "mcq", topic: "phan", grade: "L4", stem: "Trời mưa $\\dfrac14$ inch thứ Ba, $\\dfrac13$ thứ Tư, $\\dfrac16$ thứ Năm, $\\dfrac18$ thứ Sáu. Hôm nào mưa ÍT NHẤT?", options: ["Thứ Sáu", "Thứ Ba", "Thứ Tư", "Thứ Năm"], correct: "A", modelAnswer: "Cùng tử 1, mẫu lớn nhất ($\\dfrac18$) thì nhỏ nhất → thứ Sáu." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Viết số 7 dưới dạng phân số có mẫu số là 4. (Viết dạng a/b)", correct: "28/4", modelAnswer: "$7=\\dfrac{7\\times4}{4}=\\dfrac{28}{4}$." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Tìm phân số có tổng tử số và mẫu số bằng 20, tử số lớn hơn mẫu số 6 đơn vị. (Viết dạng a/b)", correct: "13/7", modelAnswer: "Bài toán tổng–hiệu: tử $=(20+6):2=13$, mẫu $=13-6=7$ → $\\dfrac{13}{7}$." },
    ],
  },

  // ─── 2. Dãy & tổng phân số đặc biệt (phan) ─────────────────────────────────
  {
    key: "phan-day",
    title: "Dãy & tổng phân số đặc biệt",
    minutes: 25,
    questions: [
      { type: "fill", topic: "phan", grade: "NC", stem: "Tính $A=\\dfrac{1}{1\\times2}+\\dfrac{1}{2\\times3}+\\dfrac{1}{3\\times4}+\\dots+\\dfrac{1}{9\\times10}$. (Viết dạng a/b)", correct: "9/10", modelAnswer: "Mỗi số hạng $=\\dfrac1n-\\dfrac1{n+1}$ → $A=1-\\dfrac1{10}=\\dfrac{9}{10}$." },
      { type: "fill", topic: "phan", grade: "NC", stem: "Tính $A=\\dfrac{2}{3\\times5}+\\dfrac{2}{5\\times7}+\\dots+\\dfrac{2}{17\\times19}$. (Viết dạng a/b)", correct: "16/57", modelAnswer: "$\\dfrac{2}{(2k-1)(2k+1)}=\\dfrac1{2k-1}-\\dfrac1{2k+1}$ → $A=\\dfrac13-\\dfrac1{19}=\\dfrac{16}{57}$." },
      { type: "fill", topic: "phan", grade: "NC", stem: "Tính $B=\\dfrac{1}{3\\times5}+\\dfrac{1}{5\\times7}+\\dots+\\dfrac{1}{97\\times99}$. (Viết dạng a/b)", correct: "16/99", modelAnswer: "$B=\\dfrac12\\left(\\dfrac13-\\dfrac1{99}\\right)=\\dfrac12\\times\\dfrac{32}{99}=\\dfrac{16}{99}$." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Tính $\\dfrac12+\\dfrac14+\\dfrac18+\\dfrac1{16}+\\dfrac1{32}$. (Viết dạng a/b)", correct: "31/32", modelAnswer: "$=1-\\dfrac1{32}=\\dfrac{31}{32}$." },
      { type: "fill", topic: "phan", grade: "NC", stem: "Tính $S=\\dfrac12+\\dfrac14+\\dfrac18+\\dots+\\dfrac1{512}$. (Viết dạng a/b)", correct: "511/512", modelAnswer: "$=1-\\dfrac1{512}=\\dfrac{511}{512}$." },
      { type: "fill", topic: "phan", grade: "L4", stem: "Tính $\\dfrac13+\\dfrac19+\\dfrac1{27}+\\dfrac1{81}$. (Viết dạng a/b)", correct: "40/81", modelAnswer: "$=\\dfrac{27+9+3+1}{81}=\\dfrac{40}{81}$." },
      { type: "fill", topic: "phan", grade: "NC", stem: "Tính $A=\\dfrac{32\\times33+17}{32\\times32+49}$.", correct: "1", num: 1, modelAnswer: "Tử $=32\\times32+32+17=32\\times32+49=$ mẫu → $A=1$." },
      { type: "fill", topic: "phan", grade: "NC", stem: "Tính $A=\\dfrac{27\\times27-1}{27\\times26+26}$.", correct: "1", num: 1, modelAnswer: "Tử $=729-1=728$; mẫu $=26\\times(27+1)=26\\times28=728$ → $A=1$." },
      { type: "mcq", topic: "phan", grade: "NC", stem: "So sánh $A=\\dfrac{25\\times25}{26\\times24}$ với $B=1$. Dấu của $A\\ \\dots\\ B$ là:", options: ["<", ">", "="], correct: "B", modelAnswer: "$25\\times25=625>26\\times24=624$ → $A>1$." },
      { type: "fill", topic: "phan", grade: "NC", stem: "Tìm x: $\\dfrac{1}{2\\times3}+\\dfrac{1}{3\\times4}+\\dots+\\dfrac{1}{x\\times(x+1)}=\\dfrac{7}{15}$. Vậy x = ...", correct: "29", num: 29, modelAnswer: "Tổng $=\\dfrac12-\\dfrac1{x+1}=\\dfrac7{15}$ → $\\dfrac1{x+1}=\\dfrac1{30}$ → $x=29$." },
    ],
  },

  // ─── 3. Toán lời văn nhiều bước & suy luận (tuoi/log/soh) ──────────────────
  {
    key: "loivan",
    title: "Toán lời văn & suy luận",
    minutes: 30,
    questions: [
      { type: "fill", topic: "tuoi", grade: "NC", stem: "Hiện nay tuổi mẹ gấp 4 lần tuổi con. Sau 5 năm nữa tuổi mẹ gấp 3 lần tuổi con. Hỏi mẹ hơn con bao nhiêu tuổi?", correct: "30", num: 30, unit: "tuổi", modelAnswer: "Con $a$, mẹ $4a$. Sau 5 năm: $4a+5=3(a+5)$ → $a=10$. Hiệu $=3a=30$." },
      { type: "fill", topic: "tuoi", grade: "L4", stem: "Bố hơn con 28 tuổi. 3 năm nữa tổng số tuổi hai bố con là 50. Hỏi hiện nay con bao nhiêu tuổi?", correct: "8", num: 8, unit: "tuổi", modelAnswer: "Tổng hiện nay $=50-6=44$. Con $=(44-28):2=8$ (bố 36)." },
      { type: "fill", topic: "tuoi", grade: "NC", stem: "Hiện nay con 8 tuổi, tuổi bố gấp 5 lần tuổi con. Hỏi sau bao nhiêu năm nữa tuổi con bằng $\\dfrac13$ tuổi bố?", correct: "8", num: 8, unit: "năm", modelAnswer: "Hiệu $=40-8=32$ (không đổi). Khi con $=\\dfrac13$ bố: hiệu $=2$ lần con → con $=16$ → sau $16-8=8$ năm." },
      { type: "fill", topic: "log", grade: "L4", stem: "Có 30 con gà và mèo, đếm được tất cả 90 chân. Hỏi có bao nhiêu con mèo?", correct: "15", num: 15, unit: "con", modelAnswer: "Giả sử 30 gà → 60 chân, thiếu 30; mỗi mèo hơn 2 chân → mèo $=30:2=15$." },
      { type: "fill", topic: "log", grade: "NC", stem: "Một bếp mua 200 con vừa ếch vừa cua, tổng 1400 chân (cua 10 chân, ếch 4 chân). Hỏi mua bao nhiêu con cua?", correct: "100", num: 100, unit: "con", modelAnswer: "Giả sử 200 ếch → 800 chân, thiếu 600; mỗi cua hơn 6 chân → cua $=600:6=100$." },
      { type: "fill", topic: "log", grade: "L4", stem: "Vừa gà vừa chó có 36 con, đếm được 100 chân. Hỏi có bao nhiêu con chó?", correct: "14", num: 14, unit: "con", modelAnswer: "Giả sử 36 gà → 72 chân, thiếu 28; mỗi chó hơn 2 chân → chó $=28:2=14$." },
      { type: "fill", topic: "soh", grade: "L4", stem: "Mua 5 quyển vở và 3 hộp bút hết 56 000đ. Mua 5 quyển vở và 6 hộp bút hết 92 000đ. Hỏi 1 hộp bút giá bao nhiêu đồng?", correct: "12000", num: 12000, unit: "đồng", modelAnswer: "Hiệu 2 lần mua: 3 hộp bút $=92000-56000=36000$ → 1 hộp $=12000$đ." },
      { type: "fill", topic: "soh", grade: "L4", stem: "Cô Ceri mua 5 táo và 2 lê hết 12 đô. Cô Sandy mua 2 táo và 2 lê hết 6 đô. Hỏi 1 quả táo giá bao nhiêu đô?", correct: "2", num: 2, unit: "đô", modelAnswer: "Hiệu: 3 táo $=12-6=6$ đô → 1 táo $=2$ đô." },
      { type: "mcq", topic: "log", grade: "NC", stem: "Biết các quả táo nặng bằng nhau, các quả lê nặng bằng nhau. \"2 quả táo nặng hơn 3 quả lê\" và \"3 quả táo nặng hơn 4 quả lê\". Chỉ MỘT câu đúng. Câu của bạn nào đúng?", options: ["Phúc (2 táo > 3 lê)", "Dũng (3 táo > 4 lê)"], correct: "B", modelAnswer: "Nếu \"2 táo > 3 lê\" đúng thì suy ra \"3 táo > 4 lê\" cũng đúng (mâu thuẫn 'chỉ một đúng') → câu Dũng đúng." },
      { type: "fill", topic: "log", grade: "NC", stem: "Đội tuyển: 8 bạn giỏi Toán, 10 giỏi Tiếng Việt, 12 giỏi Tiếng Anh; 1 giỏi cả Toán–Anh, 2 giỏi cả Toán–Việt, 1 giỏi cả Việt–Anh, 1 giỏi cả 3 môn. Hỏi đội có tất cả bao nhiêu bạn?", correct: "27", num: 27, unit: "bạn", modelAnswer: "Bù trừ: $8+10+12-(1+2+1)+1=27$." },
      { type: "fill", topic: "soh", grade: "NC", stem: "Tổng hai số lẻ là 100, giữa chúng có đúng 7 số chẵn. Tìm số lẻ lớn.", correct: "57", num: 57, modelAnswer: "Giữa hai số lẻ có 7 số chẵn → hiệu $=14$. Số lớn $=(100+14):2=57$." },
      { type: "fill", topic: "soh", grade: "L4", stem: "Hai số chẵn có tổng 180, giữa chúng có đúng 5 số chẵn khác. Tìm số chẵn bé.", correct: "84", num: 84, modelAnswer: "Giữa có 5 số chẵn → hiệu $=2\\times6=12$. Số bé $=(180-12):2=84$." },
    ],
  },

  // ─── 4. Hình bình hành & hình thoi (hinh) ──────────────────────────────────
  {
    key: "hinh-bhthoi",
    title: "Hình bình hành & hình thoi",
    minutes: 15,
    questions: [
      { type: "fill", topic: "hinh", grade: "NC", stem: "Hình bình hành có diện tích 100 m², cạnh đáy gấp 4 lần chiều cao. Tính chiều cao.", correct: "5", num: 5, unit: "m", modelAnswer: "$S=$ đáy $\\times$ cao $=4\\times$cao$\\times$cao$=100$ → cao$^2=25$ → cao $=5$ m." },
      { type: "fill", topic: "hinh", grade: "L4", stem: "Hình thoi có hai đường chéo là hai số chẵn liên tiếp, tổng 30 cm. Tính diện tích.", correct: "112", num: 112, unit: "cm2", modelAnswer: "Hai đường chéo 14 và 16. $S=\\dfrac{14\\times16}{2}=112$ cm²." },
      { type: "fill", topic: "hinh", grade: "L4", stem: "Hình thoi có tổng hai đường chéo 33 cm, hiệu 3 cm. Tính diện tích.", correct: "135", num: 135, unit: "cm2", modelAnswer: "Hai đường chéo 18 và 15. $S=\\dfrac{18\\times15}{2}=135$ cm²." },
      { type: "fill", topic: "hinh", grade: "L4", stem: "Hình bình hành đáy 8 dm, cao 3 dm. Một hình thoi có diện tích bằng nó và một đường chéo 6 dm. Tính đường chéo còn lại.", correct: "8", num: 8, unit: "dm", modelAnswer: "$S=8\\times3=24$. $\\dfrac{6\\times d}{2}=24$ → $d=8$ dm." },
      { type: "fill", topic: "hinh", grade: "L4", stem: "Hình bình hành có diện tích 30 dm², cạnh đáy 50 cm. Tính chiều cao (theo dm).", correct: "6", num: 6, unit: "dm", modelAnswer: "Đổi 50 cm $=5$ dm. Cao $=30:5=6$ dm." },
    ],
  },

  // ─── 5. Đổi đơn vị đo (do) ──────────────────────────────────────────────────
  {
    key: "doluong",
    title: "Đổi đơn vị đo",
    minutes: 15,
    questions: [
      { type: "fill", topic: "do", grade: "L4", stem: "5 tấn + 50 tạ + 55 kg = ... kg", correct: "10055", num: 10055, unit: "kg", modelAnswer: "$5000+5000+55=10055$ kg." },
      { type: "fill", topic: "do", grade: "L4", stem: "Diện tích viên gạch vuông cạnh 50 cm là ... mm².", correct: "250000", num: 250000, unit: "mm2", modelAnswer: "$50$ cm $=500$ mm; $500\\times500=250000$ mm²." },
      { type: "fill", topic: "do", grade: "NC", stem: "2 m² + 2 dm² + 2 cm² = ... mm²", correct: "2020200", num: 2020200, modelAnswer: "$2000000+20000+200=2020200$ mm²." },
      { type: "mcq", topic: "do", grade: "L4", stem: "Điền dấu: 8 cm² 25 mm² ... 317 mm² + 508 mm²", options: ["<", ">", "="], correct: "C", modelAnswer: "$8$ cm² $25$ mm² $=825$ mm²; $317+508=825$ → dấu =." },
      { type: "fill", topic: "do", grade: "L4", stem: "30 thế kỉ + $\\dfrac14$ thế kỉ = ... năm", correct: "3025", num: 3025, unit: "năm", modelAnswer: "$3000+25=3025$ năm." },
    ],
  },

  // ─── 6. Đại lượng tỉ lệ / rút về đơn vị (ti) ────────────────────────────────
  {
    key: "tile",
    title: "Tỉ lệ & rút về đơn vị",
    minutes: 10,
    questions: [
      { type: "fill", topic: "ti", grade: "L4", stem: "3 xe tải chở được 15 tấn. Hỏi 6 xe như thế chở được nhiều nhất bao nhiêu tấn?", correct: "30", num: 30, unit: "tấn", modelAnswer: "1 xe $=15:3=5$ tấn → 6 xe $=30$ tấn." },
      { type: "fill", topic: "ti", grade: "L4", stem: "5 xe chở được 4500 kg. Hỏi thêm 3 xe nữa thì chở thêm được bao nhiêu kg?", correct: "2700", num: 2700, unit: "kg", modelAnswer: "1 xe $=4500:5=900$ kg → 3 xe $=2700$ kg." },
      { type: "fill", topic: "ti", grade: "NC", stem: "2 ngày, 8 người sửa được 64 m đường. Hỏi 5 ngày, 9 người sửa được bao nhiêu m? (năng suất như nhau)", correct: "180", num: 180, unit: "m", modelAnswer: "1 ngày 1 người $=64:(2\\times8)=4$ m → $4\\times5\\times9=180$ m." },
    ],
  },

  // ─── 7. Đếm số · tổ hợp · Dirichlet (xs/soh) ────────────────────────────────
  {
    key: "demso",
    title: "Đếm số, tổ hợp & suy luận chắc chắn",
    minutes: 15,
    questions: [
      { type: "fill", topic: "soh", grade: "L4", stem: "Từ các chữ số 0; 4; 5; 6 lập được bao nhiêu số LẺ có 4 chữ số khác nhau?", correct: "4", num: 4, unit: "số", modelAnswer: "Số lẻ → tận cùng 5. Hàng nghìn 2 cách (4 hoặc 6), hai vị trí còn lại $2\\times1$ → $2\\times2\\times1=4$ số." },
      { type: "fill", topic: "soh", grade: "NC", stem: "Có bao nhiêu số có 3 chữ số mà trong mỗi số chỉ có ĐÚNG MỘT chữ số 3?", correct: "225", num: 225, unit: "số", modelAnswer: "Xét vị trí chứa chữ số 3, các vị trí khác $\\ne3$ (hàng trăm $\\ne0$). Tổng cộng 225 số." },
      { type: "fill", topic: "xs", grade: "NC", stem: "Lan có 12 bi xanh, 15 đỏ, 6 vàng, 2 trắng. Cần bốc ít nhất bao nhiêu viên để CHẮC CHẮN đủ 4 màu?", correct: "34", num: 34, unit: "viên", modelAnswer: "Xấu nhất bốc hết 3 màu nhiều nhất: $15+12+6=33$, thêm 1 → 34 viên." },
      { type: "fill", topic: "xs", grade: "NC", stem: "Hộp có 20 bi vàng, 18 xanh, 26 đỏ. Bốc ít nhất bao nhiêu viên để CHẮC CHẮN đủ 3 màu?", correct: "47", num: 47, unit: "viên", modelAnswer: "Xấu nhất: $26+20=46$ rồi thêm 1 → 47 viên." },
      { type: "fill", topic: "xs", grade: "NC", stem: "Dãy 1; 2; 3; …; 29. Lấy ít nhất bao nhiêu số để CHẮC CHẮN có 2 số mà tích là số chẵn?", correct: "16", num: 16, unit: "số", modelAnswer: "Có 15 số lẻ. Xấu nhất lấy hết 15 số lẻ rồi thêm 1 số chẵn → 16 số (để có ít nhất 1 số chẵn)." },
    ],
  },

  // ─── 8. Làm tròn & ước lượng (soh) ──────────────────────────────────────────
  {
    key: "lamtron",
    title: "Làm tròn & ước lượng",
    minutes: 12,
    questions: [
      { type: "fill", topic: "soh", grade: "L4", stem: "Làm tròn số 37 492 đến hàng nghìn.", correct: "37000", num: 37000, modelAnswer: "Chữ số hàng trăm là 4 $<5$ → làm tròn xuống: 37 000." },
      { type: "fill", topic: "soh", grade: "L4", stem: "Làm tròn số 4 159 000 đến hàng trăm nghìn.", correct: "4200000", num: 4200000, modelAnswer: "Chữ số hàng chục nghìn là 5 → làm tròn lên: 4 200 000." },
      { type: "fill", topic: "soh", grade: "L4", stem: "Ước lượng kết quả 78 960 + 1 980 đến hàng chục nghìn (chỉ điền số chục nghìn).", correct: "8", num: 8, unit: "chục nghìn", modelAnswer: "$78960+1980=80940\\approx80000$ → 8 chục nghìn." },
      { type: "fill", topic: "soh", grade: "L4", stem: "Ước lượng kết quả 50 268 − 21 052 đến hàng nghìn (chỉ điền số nghìn).", correct: "29", num: 29, unit: "nghìn", modelAnswer: "$50268-21052=29216\\approx29000$ → 29 nghìn." },
      { type: "fill", topic: "soh", grade: "NC", stem: "Số lẻ lớn nhất có 4 chữ số khác nhau, làm tròn đến hàng nghìn thì được số nào?", correct: "10000", num: 10000, modelAnswer: "Số đó là 9875; làm tròn nghìn → 10 000." },
    ],
  },

  // ─── 9. Mẹo: chữ số 0 của n! & chữ số tận cùng (soh) ────────────────────────
  {
    key: "tancung",
    title: "Mẹo: chữ số 0 của n! & chữ số tận cùng",
    minutes: 12,
    questions: [
      { type: "fill", topic: "soh", grade: "NC", stem: "Cho A = 1 × 2 × 3 × … × 10. Hỏi A có bao nhiêu chữ số 0 tận cùng?", correct: "2", num: 2, unit: "chữ số", modelAnswer: "Số chữ số 0 = số thừa số 5: $[10:5]=2$." },
      { type: "fill", topic: "soh", grade: "NC", stem: "Cho A = 1 × 2 × 3 × … × 75. Hỏi A có bao nhiêu chữ số 0 tận cùng?", correct: "18", num: 18, unit: "chữ số", modelAnswer: "$[75:5]+[75:25]=15+3=18$ chữ số 0." },
      { type: "fill", topic: "soh", grade: "NC", stem: "B = 3 × 9 × 13 × 19 × 23 × … × 193 × 199. Tìm chữ số hàng đơn vị của B.", correct: "5", num: 5, modelAnswer: "Tích các số lẻ và có thừa số tận cùng 5 → tận cùng là 5." },
      { type: "fill", topic: "soh", grade: "NC", stem: "A = 7 × 17 × 27 × … × 2017. Tìm chữ số tận cùng của A.", correct: "9", num: 9, modelAnswer: "Có 202 thừa số đều tận cùng 7; chu kỳ $7,9,3,1$. $202:4$ dư 2 → tận cùng $7\\times7=49$ → 9." },
      { type: "fill", topic: "soh", grade: "NC", stem: "A = 32 × 44 × 75 × 69 − 21 × 49 × 65 × 55. Tìm chữ số hàng đơn vị của A.", correct: "0", num: 0, modelAnswer: "Mỗi tích đều có thừa số 5 và số chẵn → tận cùng 0. $0-0=0$." },
    ],
  },

  // ─── 10. Bài toán năng suất — rút về đơn vị (tỉ lệ kép) (ti) ────────────────
  {
    key: "nangsuat",
    title: "Bài toán năng suất — rút về đơn vị",
    minutes: 20,
    questions: [
      { type: "fill", topic: "ti", grade: "NC", stem: "Trong 3 ngày, 6 công nhân dệt được 90 tấm vải. Hỏi trong 5 ngày, 8 công nhân dệt được bao nhiêu tấm vải? (năng suất mỗi người như nhau)", correct: "200", num: 200, unit: "tấm", modelAnswer: "Năng suất 1 người trong 1 ngày: $90:3:6=5$ (tấm). Trong 5 ngày, 8 công nhân dệt được: $5\\times8\\times5=200$ (tấm)." },
      { type: "fill", topic: "ti", grade: "NC", stem: "Trong 4 ngày, 5 bạn học sinh gấp được 200 chiếc thuyền giấy. Hỏi trong 6 ngày, 7 bạn gấp được bao nhiêu chiếc thuyền? (năng suất mỗi bạn như nhau)", correct: "420", num: 420, unit: "chiếc", modelAnswer: "Năng suất 1 bạn trong 1 ngày: $200:4:5=10$ (chiếc). Trong 6 ngày, 7 bạn gấp được: $10\\times7\\times6=420$ (chiếc)." },
      { type: "fill", topic: "ti", grade: "NC", stem: "Trong 2 ngày, 4 chú thợ xây được 48 m tường. Hỏi trong 7 ngày, 6 chú thợ xây được bao nhiêu mét tường? (năng suất mỗi người như nhau)", correct: "252", num: 252, unit: "m", modelAnswer: "Năng suất 1 người trong 1 ngày: $48:2:4=6$ (m). Trong 7 ngày, 6 chú thợ xây được: $6\\times6\\times7=252$ (m)." },
      { type: "fill", topic: "ti", grade: "NC", stem: "Trong 3 ngày, 4 máy cày cày được 96 ha ruộng. Hỏi trong 6 ngày, 5 máy cày cày được bao nhiêu ha? (năng suất mỗi máy như nhau)", correct: "240", num: 240, unit: "ha", modelAnswer: "Năng suất 1 máy trong 1 ngày: $96:3:4=8$ (ha). Trong 6 ngày, 5 máy cày được: $8\\times5\\times6=240$ (ha)." },
      { type: "fill", topic: "ti", grade: "NC", stem: "Trong 5 ngày, 3 công nhân lắp được 75 chiếc quạt. Hỏi trong 8 ngày, 6 công nhân lắp được bao nhiêu chiếc quạt? (năng suất mỗi người như nhau)", correct: "240", num: 240, unit: "chiếc", modelAnswer: "Năng suất 1 người trong 1 ngày: $75:5:3=5$ (chiếc). Trong 8 ngày, 6 công nhân lắp được: $5\\times6\\times8=240$ (chiếc)." },
    ],
  },
];

function schemaFor(q: RQ): string | null {
  if (typeof q.num === "number") return JSON.stringify({ kind: "numeric", value: q.num });
  if (q.set) return JSON.stringify({ kind: "numeric_set", values: q.set, ordered: false });
  return null;
}

async function main() {
  // 1. Resolve owner (create minimal User if mika hasn't signed in yet).
  let owner = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!owner) {
    owner = await prisma.user.create({
      data: { email: OWNER_EMAIL, name: OWNER_NAME, role: "student", grade: "Lớp 4" },
    });
    console.log(`  created User for ${OWNER_EMAIL} (id=${owner.id})`);
  } else {
    console.log(`  owner ${OWNER_EMAIL} (id=${owner.id})`);
  }

  console.log(`=== Seeding ${BAI.length} remedial sets for ${OWNER_EMAIL} ===`);

  let pos = 0;
  for (const bai of BAI) {
    pos += 1;
    const examId = `rmd-${owner.id}-${bai.key}`;

    // Upsert the Exam row (NOT delete) so Attempt history survives re-seeds.
    await prisma.exam.upsert({
      where: { id: examId },
      update: {
        title: bai.title,
        minutes: bai.minutes,
        qcount: bai.questions.length,
        position: pos,
        active: true,
        archivedAt: null,
      },
      create: {
        id: examId,
        school: "mix",
        kind: "reference",
        year: "Bài luyện riêng",
        title: bai.title,
        intro: "Bài luyện được giao riêng. Con làm và điền đáp án vào ô trả lời.",
        minutes: bai.minutes,
        qcount: bai.questions.length,
        generated: false,
        sections: "[]",
        ownerUserId: owner.id,
        position: pos,
        active: true,
      },
    });

    // Update questions IN PLACE, matched by `num`, so Question.id stays stable
    // across re-seeds. Attempt.answers is keyed by Question.id; the old
    // deleteMany+create assigned fresh random CUIDs every run, which orphaned
    // each prior attempt's answers → regrade scored them 0 even though the
    // student answered correctly (see CLAUDE.md grading pitfalls). Matching by
    // num keeps existing rows (and thus existing attempts) gradable; we only
    // create rows for new positions and delete trailing extras.
    const existing = await prisma.question.findMany({
      where: { examId },
      select: { id: true, num: true },
    });
    const byNum = new Map(existing.map((e) => [e.num, e.id]));
    let num = 0;
    for (const q of bai.questions) {
      num += 1;
      const data = {
        num,
        type: q.type,
        topic: q.topic,
        grade: q.grade,
        points: 1,
        stem: q.stem,
        options: q.options ? JSON.stringify(q.options.map((text, i) => ({ id: L[i], text }))) : "[]",
        correct: q.correct,
        answerSchema: schemaFor(q),
        unit: q.unit ?? null,
        placeholder: q.type === "fill" ? "Đáp số..." : null,
        modelAnswer: q.modelAnswer ?? null,
        figure: null,
        source: SOURCE_TAG,
        active: true,
      };
      const existingId = byNum.get(num);
      if (existingId) {
        await prisma.question.update({ where: { id: existingId }, data });
      } else {
        await prisma.question.create({ data: { examId, ...data } });
      }
    }
    // Drop any trailing questions from a previous longer version of this bài.
    await prisma.question.deleteMany({ where: { examId, num: { gt: bai.questions.length } } });
    console.log(`  ✓ [${pos}] ${bai.title} — ${bai.questions.length} câu (${examId})`);
  }

  const total = BAI.reduce((s, b) => s + b.questions.length, 0);
  console.log(`\n✓ Done. ${BAI.length} bài / ${total} câu cho ${OWNER_EMAIL}.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
