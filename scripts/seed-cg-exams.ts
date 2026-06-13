import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

// A dictionary of correct answers, units, and model answers (explanations)
// extracted directly from the verified PDF solution guidelines.
interface QuestionEnrichment {
  correct: string;
  unit?: string;
  placeholder?: string;
  modelAnswer: string;
  stem?: string;
  options?: { id: string; text: string }[];
  figure?: string;
}

const ENRICHMENT_MAP: Record<string, QuestionEnrichment> = {
  // --- YEAR 2019-2020 ---
  "CG-2019-20-C1": {
    correct: "5",
    stem: "Tìm số tự nhiên $x$, biết: $\\frac{134247}{1000} < 134,2x7 < \\frac{134267}{1000}$.",
    modelAnswer: "Ta có: 134247/1000 = 134,247 và 134267/1000 = 134,267. Từ đó ta được: 134,247 < 134,2x7 < 134,267. Do đó chữ số x chỉ có thể bằng 5."
  },
  "CG-2019-20-C2": {
    correct: "55",
    modelAnswer: "Quy luật: Kể từ số hạng thứ ba, mỗi số hạng của dãy bằng tổng hai số hạng đứng liền trước nó. Ta tìm được:\n- Số hạng thứ 6 là: 13 + 21 = 34\n- Số hạng thứ 7 là: 21 + 34 = 55."
  },
  "CG-2019-20-C3": {
    correct: "2020",
    stem: "Tính giá trị biểu thức: $101 \\times 34 + 10,1 \\times 130 + 1,01 \\times 2700$.",
    modelAnswer: "Biến đổi biểu thức:\n101 × 34 + 10,1 × 130 - 1,01 × 2700\n= 101 × 34 + 101 × 13 - 101 × 27\n= 101 × (34 + 13 - 27)\n= 101 × 20 = 2020."
  },
  "CG-2019-20-C4": {
    correct: "5",
    stem: "Tìm chữ số tận cùng của tích sau: $11 \\times 13 \\times 15 \\times 17 \\times 19 \\times \\dots \\times 2019$.",
    modelAnswer: "Các thừa số trong tích đều là số lẻ và tích chứa thừa số 15 (tận cùng bằng 5). Một số lẻ nhân với một số tận cùng là 5 thì tích luôn có chữ số tận cùng là 5."
  },
  "CG-2019-20-C5": {
    correct: "198",
    unit: "viên",
    modelAnswer: "Vì nếu xếp mỗi hộp 2 viên hoặc 9 viên thì đủ nên số viên bi là số chia hết cho 2 và 9 (bội của 18).\nSố bi chia 5 dư 3 và chia hết cho 2 nên số bi tận cùng là 8. Bội của 18 trong khoảng từ 110 đến 250 và tận cùng bằng 8 là 198 (vì 198 = 18 × 11)."
  },
  "CG-2019-20-C6": {
    correct: "16",
    unit: "tuổi",
    stem: "Cách đây 4 năm tổng số tuổi 2 chị em là 28 tuổi. Hiện nay tuổi em bằng $\\frac{4}{5}$ tuổi chị. Tính tuổi em hiện nay.",
    modelAnswer: "Tổng số tuổi của hai chị em hiện nay là: 28 + 4 × 2 = 36 (tuổi).\nTuổi em hiện nay là: 36 : (4 + 5) × 4 = 16 (tuổi)."
  },
  "CG-2019-20-C7": {
    correct: "0,2424",
    unit: "ha",
    modelAnswer: "Chiều dài mới bằng: 100% + 50% = 150% chiều dài ban đầu.\nChiều rộng mới bằng: 100% - 20% = 80% chiều rộng ban đầu.\nDiện tích mới bằng: 150% × 80% = 120% diện tích ban đầu.\nDiện tích mảnh đất mới là: 2020 × 120% = 2424 m².\nĐổi: 2424 m² = 0,2424 ha."
  },
  "CG-2019-20-C8": {
    correct: "27",
    unit: "quả",
    stem: "Cho một số bóng xanh và vàng. Số bóng vàng bằng $\\frac{1}{3}$ bóng xanh. Nếu thêm 6 bóng vàng thì bóng vàng bằng $\\frac{5}{9}$ bóng xanh. Tính số bóng xanh.",
    modelAnswer: "Thêm 6 quả bóng vàng tương ứng với số phần bóng xanh là: 5/9 - 1/3 = 2/9 (số bóng xanh).\nSố bóng xanh là: 6 : 2/9 = 27 (quả)."
  },
  "CG-2019-20-B1": {
    correct: "100",
    unit: "km",
    placeholder: "Trình bày lời giải...",
    stem: "Nam dự định đi từ A đến B với vận tốc 40 km/giờ. Đi $\\frac{1}{2}$ quãng đường AB thì Nam nghỉ 15 phút. Để đến B đúng giờ thì Nam phải tăng vận tốc lên thành 50 km/giờ. Tính quãng đường AB.",
    modelAnswer: "Xét trên nửa quãng đường AB sau:\nTỉ số vận tốc dự định so với vận tốc thực tế là: 40 : 50 = 4/5.\nTrên cùng quãng đường, thời gian tỷ lệ nghịch với vận tốc nên tỉ số thời gian dự định so với thực tế là 5/4.\nThời gian thực tế đi nửa quãng đường sau ít hơn dự định là 15 phút = 0,25 giờ.\nThời gian thực tế đi nửa quãng đường sau là: 0,25 : (5 - 4) × 4 = 1 (giờ).\nQuãng đường AB dài là: 50 × 1 × 2 = 100 (km)."
  },
  "CG-2019-20-B2": {
    correct: "1/2",
    placeholder: "Trình bày lời giải...",
    stem: "Cho hình tam giác ABC. Lấy điểm M trên AB và N trên AC sao cho $AM = BM$ và $2NC = NA$.\na) Tính tỉ số diện tích ANM và BMNC.\nb) Cho MN cắt BC ở D. So sánh BC với CD.",
    modelAnswer: "a) Nối B với N.\nXét tam giác AMN và tam giác ABN có chung chiều cao hạ từ N xuống AB, đáy AM = BM => S_AMN = 1/2 S_ABN.\nXét tam giác ABN và tam giác ABC có chung chiều cao hạ từ B xuống AC, đáy AN = 2/3 AC (do 2NC = NA) => S_ABN = 2/3 S_ABC.\nDo đó S_AMN = 1/2 × 2/3 × S_ABC = 1/3 S_ABC.\nDiện tích tứ giác BMNC là: S_ABC - S_AMN = 2/3 S_ABC.\nTỉ số diện tích ANM và BMNC là: 1/3 : 2/3 = 1/2.\n\nb) Nối A với D.\nChứng minh được diện tích tam giác BNC bằng diện tích tam giác DNC (S_BNC = S_DNC).\nMà hai tam giác này có chung chiều cao hạ từ N xuống BD nên đáy BC = CD."
  },

  // --- YEAR 2020-2021 ---
  "CG-2020-21-C1": {
    correct: "132,8",
    stem: "Tính: $13,28 \\times 9,9 + 13,28 \\times 0,1$.",
    modelAnswer: "Tính nhanh: 13,28 × 9,9 + 13,28 × 0,1 = 13,28 × (9,9 + 0,1) = 13,28 × 10 = 132,8."
  },
  "CG-2020-21-C2": {
    correct: "32",
    unit: "phút",
    modelAnswer: "Thời gian Cường đến nơi là: 8 giờ 40 phút + 12 phút = 8 giờ 52 phút.\nHùng phải đợi Cường trong khoảng thời gian là: 8 giờ 52 phút - 8 giờ 20 phút = 32 phút."
  },
  "CG-2020-21-C3": {
    correct: "12,5",
    stem: "32% của một số là 6,4. Hỏi $\\frac{5}{8}$ số đó là bao nhiêu?",
    modelAnswer: "Số đó là: 6,4 : 32 × 100 = 20.\nGiá trị 5/8 của số đó là: 20 × 5/8 = 12,5."
  },
  "CG-2020-21-C4": {
    correct: "216",
    unit: "cm³",
    modelAnswer: "Diện tích toàn phần của hình lập phương lớn hơn diện tích xung quanh đúng bằng 2 lần diện tích một mặt.\nDiện tích một mặt của hình lập phương là: 72 : 2 = 36 cm².\nVì 36 = 6 × 6 nên độ dài cạnh hình lập phương là 6 cm.\nThể tích của hình lập phương đó là: 6 × 6 × 6 = 216 cm³."
  },
  "CG-2020-21-C5": {
    correct: "10",
    unit: "em",
    figure: "cg-2020-c5",
    modelAnswer: "Số học sinh thích bơi lội chiếm tỉ lệ là: 100% - (50% + 12% + 18%) = 20% tổng số học sinh.\nSố học sinh thích bơi lội là: 50 × 20% = 10 (học sinh)."
  },
  "CG-2020-21-C6": {
    correct: "1992",
    stem: "Hai số có hiệu là 1554. Tổng của hai số là $\\overline{2x3y}$ chia hết cho 2, 5, 9. Hỏi số lớn là số nào?",
    modelAnswer: "Tổng của hai số là 2x3y chia hết cho 2 và 5 nên y = 0.\nSố 2x30 chia hết cho 9 nên (2 + x + 3 + 0) chia hết cho 9 => (5 + x) chia hết cho 9 => x = 4.\nTổng hai số là 2430. Số lớn là: (2430 + 1554) : 2 = 1992."
  },
  "CG-2020-21-C7": {
    correct: "70,5",
    unit: "km",
    modelAnswer: "Thời gian đi trước khi sửa xe: 14 giờ 45 phút - 14 giờ = 45 phút = 0,75 giờ.\nQuãng đường đi trước khi sửa xe: 30 × 0,75 = 22,5 km.\nThời gian đi sau khi sửa xe: 16 giờ 12 phút - 15 phút - 14 giờ 45 phút = 1 giờ 12 phút = 1,2 giờ.\nQuãng đường đi sau khi sửa xe: 40 × 1,2 = 48 km.\nQuãng đường AB dài là: 22,5 + 48 = 70,5 km."
  },
  "CG-2020-21-C8": {
    correct: "10",
    unit: "cm²",
    stem: "Cho tam giác $ABC$. Trên cạnh $AB$, $AC$ lấy các điểm $Q$, $K$ sao cho $BQ = \\frac{1}{6} \\times AB$ và $AK = \\frac{1}{3} \\times AC$. Biết diện tích tứ giác $KQBC$ là $26\\text{ cm}^2$, tính diện tích tam giác $AKQ$.",
    figure: "cg-2020-c8",
    modelAnswer: "Nối C với Q.\nS_ACQ = 5/6 S_ABC (chung chiều cao hạ từ C, đáy AQ = 5/6 AB).\nS_AKQ = 1/3 S_ACQ (chung chiều cao hạ từ Q, đáy AK = 1/3 AC).\nSuy ra S_AKQ = 1/3 × 5/6 × S_ABC = 5/18 S_ABC.\nDiện tích tứ giác KQBC bằng: S_ABC - S_AKQ = 13/18 S_ABC.\nBiết S_KQBC = 26 cm² => S_ABC = 26 : 13/18 = 36 cm².\nDiện tích tam giác AKQ là: 36 × 5/18 = 10 cm²."
  },
  "CG-2020-21-B1": {
    correct: "280",
    unit: "quyển",
    placeholder: "Trình bày lời giải...",
    stem: "Một giá sách có ba tầng, chứa tất cả 700 quyển sách. Số sách ngăn 1 bằng $40\\%$ tổng số sách.\na) Tính số sách ngăn 1.\nb) Nếu chuyển một nửa số sách từ ngăn 3 xuống ngăn 2 thì số sách ngăn 3 bằng $\\frac{2}{5}$ số sách ngăn 2. Tính số sách mỗi ngăn lúc đầu.",
    modelAnswer: "a) Số sách ngăn 1 là: 700 × 40% = 280 (quyển).\n\nb) Tổng số sách ngăn 2 và 3 ban đầu là: 700 - 280 = 420 (quyển).\nKhi chuyển một nửa số sách ngăn 3 xuống ngăn 2 thì tổng số sách 2 ngăn không đổi.\nSau khi chuyển, số sách ngăn 3 bằng 2/5 số sách ngăn 2 => Ngăn 3 chiếm 2 phần, ngăn 2 chiếm 5 phần.\nSố sách ngăn 3 lúc sau là: 420 : (2 + 5) × 2 = 120 (quyển).\nSố sách ngăn 3 lúc đầu là: 120 × 2 = 240 (quyển).\nSố sách ngăn 2 lúc đầu là: 420 - 240 = 180 (quyển).\n\nĐáp số: a) 280 quyển; b) Ngăn 2: 180 quyển; Ngăn 3: 240 quyển."
  },
  "CG-2020-21-B2": {
    correct: "6/11",
    placeholder: "Trình bày lời giải...",
    stem: "Nam viết lên bảng 3 số 1, 2, 3. Sau đó, Nam xóa đi 2 số a, b và thay bằng 1 số là $c = \\frac{a+b}{a \\times b + 1}$. Nam tiếp tục xóa cho đến khi chỉ còn 1 số.\na) Hỏi số đó là số nào? Vì sao?\nb) Nam cũng chơi trò chơi đó với 5 số là 1, 2, 3, 4, 5. Xong Nam nhận xét lần chơi nào cũng ra số cuối cùng giống nhau. Hỏi Nam nhận xét đúng hay sai? Vì sao?",
    modelAnswer: "a) Nếu xóa 1, 2 thì thay bằng 1×2/(1+2) = 2/3. Tiếp tục xóa 2/3 và 3 thì được (2/3 × 3) / (2/3 + 3) = 2 / (11/3) = 6/11.\nSố còn lại cuối cùng thu được luôn là 6/11 (không phụ thuộc vào thứ tự xóa).\n\nb) Nam nhận xét đúng. Vì quy tắc tính toán c = (a×b)/(a+b) tương đương với 1/c = 1/a + 1/b (nghịch đảo tổng các nghịch đảo). Phép toán này có tính chất giao hoán và kết hợp.\nDo đó, với 5 số 1, 2, 3, 4, 5 số cuối cùng thu được luôn bằng:\n1 / (1/1 + 1/2 + 1/3 + 1/4 + 1/5) = 1 / (137/60) = 60/137."
  },

  // --- YEAR 2021-2022 ---
  "CG-2021-22-C1": {
    correct: "8,4",
    stem: "Tính giá trị biểu thức: $4,2 \\times \\frac{23}{9} + 4,2 \\times \\frac{5}{9}$.",
    modelAnswer: "Tính nhanh: 4,2 × 23/9 - 4,2 × 5/9 = 4,2 × (23/9 - 5/9) = 4,2 × 18/9 = 4,2 × 2 = 8,4."
  },
  "CG-2021-22-C2": {
    correct: "400",
    unit: "lần",
    modelAnswer: "Đổi: 3 ha = 30 000 m².\nSố lần gấp là: 30 000 : 75 = 400 (lần)."
  },
  "CG-2021-22-C3": {
    correct: "9",
    unit: "xe",
    modelAnswer: "Mỗi xe ô tô chở được số tấn vải thiều là: 20 : 5 = 4 (tấn).\nĐể chở 36 tấn vải thiều thì cần số xe là: 36 : 4 = 9 (xe)."
  },
  "CG-2021-22-C4": {
    correct: "5",
    unit: "giờ",
    modelAnswer: "Thể tích lòng bể là: 3 × 2 × 1,5 = 9 m³ = 9000 dm³ = 9000 lít.\nThời gian để vòi nước đó chảy đầy bể là: 9000 : 30 = 300 phút = 5 giờ."
  },
  "CG-2021-22-C5": {
    correct: "19,5",
    unit: "lít",
    modelAnswer: "Số lượng dầu đã dùng là: 32,5 × 40% = 13 (lít).\nLượng dầu còn lại trong can là: 32,5 - 13 = 19,5 (lít)."
  },
  "CG-2021-22-C6": {
    correct: "37",
    modelAnswer: "Quy luật dãy số: Hiệu hai số hạng liên tiếp tăng dần là các số lẻ liên tiếp (+1, +3, +5, +7, +9, +11,...).\nSố hạng tiếp theo của dãy là: 26 + 11 = 37."
  },
  "CG-2021-22-C7": {
    correct: "140",
    unit: "chai",
    stem: "Một cửa hàng có 400 chai nước rửa tay và cồn sát khuẩn. Cửa hàng đó bán đi 20 chai nước rửa tay và 50 chai cồn thì còn lại số chai nước rửa tay bằng $\\frac{4}{7}$ số chai cồn. Hỏi lúc đầu cửa hàng đó có bao nhiêu chai nước rửa tay?",
    modelAnswer: "Sau khi bán đi, tổng số chai còn lại là: 400 - 20 - 50 = 330 chai.\nVì số chai nước rửa tay còn lại bằng 4/7 số chai cồn nên nước rửa tay chiếm 4 phần, cồn chiếm 7 phần.\nSố chai nước rửa tay còn lại là: 330 : (4 + 7) × 4 = 120 chai.\nSố chai nước rửa tay lúc đầu là: 120 + 20 = 140 (chai)."
  },
  "CG-2021-22-C8": {
    correct: "8",
    unit: "cm²",
    stem: "Cho hình thang $ABCD$ có $AB = \\frac{2}{3} \\times CD$. Trên $AD$ lấy điểm $E$ sao cho $AE$ gấp $2$ lần $ED$. Tính diện tích tam giác $ABE$, biết diện tích hình thang $ABCD$ là $30\\text{ cm}^2$.",
    modelAnswer: "Nối B với D. S_ABD / S_BDC = AB / CD = 2/3 (chung chiều cao hình thang).\nMà S_ABD + S_BDC = S_ABCD = 30 cm² => S_ABD = 30 : (2 + 3) × 2 = 12 cm².\nXét tam giác ABE và tam giác ABD có chung chiều cao từ B xuống AD, đáy AE = 2/3 AD (do AE = 2ED).\nSuy ra S_ABE = 2/3 S_ABD = 2/3 × 12 = 8 cm²."
  },
  "CG-2021-22-B1": {
    correct: "150",
    unit: "km",
    placeholder: "Trình bày lời giải...",
    modelAnswer: "a) Tổng thời gian từ lúc đi đến lúc về: 14 giờ 15 phút - 7 giờ 15 phút = 7 giờ.\nKhông tính thời gian nghỉ 1,5 giờ, tổng thời gian đi và về là: 7 giờ - 1,5 giờ = 5,5 giờ (hay 5 giờ 30 phút).\n\nb) Tỉ số vận tốc lúc đi so với lúc về của ô tô là: 60 : 50 = 6/5.\nTrên cùng quãng đường, thời gian tỷ lệ nghịch với vận tốc nên tỉ số thời gian đi so với về là 5/6.\nThời gian ô tô đi từ A đến B là: 5,5 : (5 + 6) × 5 = 2,5 (giờ).\nQuãng đường AB dài là: 60 × 2,5 = 150 (km).\n\nĐáp số: a) 5 giờ 30 phút; b) 150km."
  },
  "CG-2021-22-B2": {
    correct: "Không",
    placeholder: "Trình bày lời giải...",
    modelAnswer: "a) Ta hoàn thành các ô trống dựa trên việc thay đổi số bi ở mỗi lượt chơi (chọn 2 hộp lấy 1 bi cho vào hộp còn lại):\n- Ban đầu: A: 8, B: 15, C: 10\n- Lượt 1: A: 7, B: 14, C: 12 (lấy từ A, B bỏ vào C)\n- Lượt 2: A: 9, B: 13, C: 11 (lấy từ B, C bỏ vào A)\n- Lượt 3: A: 8, B: 12, C: 13 (lấy từ A, B bỏ vào C)\n- Lượt 4: A: 10, B: 11, C: 12 (lấy từ B, C bỏ vào A)\n\nb) Chứng minh:\nSố bi ban đầu ở 3 hộp khi chia cho 3 có số dư lần lượt là 2 (8 chia 3 dư 2), 0 (15 chia 3 dư 0), 1 (10 chia 3 dư 1) => Số dư luôn khác nhau.\nQua mỗi lượt chơi lấy 1 bi từ 2 hộp bỏ vào hộp còn lại, số dư khi chia cho 3 của cả 3 hộp sẽ thay đổi nhưng tính chất số dư ở mỗi hộp khác nhau vẫn được bảo toàn (số dư của các hộp không thể bằng nhau).\nDo đó, yêu cầu sau cùng để được 3 hộp có số bi bằng nhau (cùng là 11 viên - cùng số dư chia cho 3 là 2) là không thực hiện được."
  },

  // --- YEAR 2022-2023 ---
  "CG-2022-23-C1": {
    correct: "B",
    stem: "Tính: $3,5 \\times \\frac{1}{4} + 1,5 \\times \\frac{1}{4}$.",
    options: [
      { id: "A", text: "$0$" },
      { id: "B", text: "$\\frac{1}{2}$" },
      { id: "C", text: "$\\frac{5}{4}$" },
      { id: "D", text: "$\\frac{1}{8}$" }
    ],
    modelAnswer: "Tính nhanh: 3,5 × 1/4 - 1,5 × 1/4 = (3,5 - 1,5) × 1/4 = 2 × 1/4 = 1/2.\nĐối chiếu với các phương án lựa chọn, chọn đáp án B."
  },
  "CG-2022-23-C2": {
    correct: "C",
    stem: "$0,2\\text{ m}^3$ gấp $25\\text{ dm}^3$ số lần là:",
    modelAnswer: "Đổi: 0,2 m³ = 200 dm³.\n0,2 m³ gấp 25 dm³ số lần là: 200 : 25 = 8 (lần).\nĐối chiếu các phương án, chọn C."
  },
  "CG-2022-23-C3": {
    correct: "D",
    stem: "Một ô tô đi với vận tốc $60\\text{ km/h}$, tính quãng đường ô tô đi được trong 12 phút.",
    modelAnswer: "Đổi: 12 phút = 1/5 giờ.\nQuãng đường ô tô đi được là: 60 × 1/5 = 12 (km).\nĐối chiếu các phương án, chọn D."
  },
  "CG-2022-23-C4": {
    correct: "A",
    stem: "Một hình hộp chữ nhật có chiều dài là $12\\text{ cm}$, chiều rộng là $8\\text{ cm}$. Một hình lập phương có cạnh bằng trung bình cộng ba kích thước của hình hộp chữ nhật và có diện tích toàn phần là $486\\text{ cm}^2$. Tìm chiều cao của hình hộp chữ nhật.",
    modelAnswer: "Diện tích một mặt hình lập phương là: 486 : 6 = 81 cm².\nCạnh hình lập phương là: 9 cm (do 9 × 9 = 81).\nTổng 3 kích thước của hình hộp chữ nhật là: 9 × 3 = 27 cm.\nChiều cao của hình hộp chữ nhật là: 27 - 12 - 8 = 7 (cm).\nĐối chiếu các phương án, chọn A."
  },
  "CG-2022-23-C5": {
    correct: "2,89",
    stem: "Tìm $x$, biết: $15,23 - 5 \\times x = 0,78$.",
    modelAnswer: "Ta có: 15,23 - 5 × x = 0,78 => 5 × x = 14,45 => x = 14,45 : 5 = 2,89."
  },
  "CG-2022-23-C6": {
    correct: "225",
    unit: "học sinh",
    stem: "Tổng số học sinh khối 5 của một trường tiểu học là một số có ba chữ số và chữ số hàng trăm là 2. Biết khi xếp học sinh thành 10 hàng thì dư 5 học sinh và xếp thành 9 hàng thì không dư (số có dạng $\\overline{2ab}$). Hỏi số học sinh khối 5 là bao nhiêu?",
    modelAnswer: "Số học sinh có dạng 2ab.\nXếp 10 hàng dư 5 học sinh nên chữ số tận cùng b = 5. Số có dạng 2a5.\nXếp 9 hàng không dư nên 2a5 chia hết cho 9 => (2 + a + 5) chia hết cho 9 => (7 + a) chia hết cho 9 => a = 2.\nVậy số học sinh khối 5 là 225 học sinh."
  },
  "CG-2022-23-C7": {
    correct: "10",
    unit: "tuổi",
    stem: "Tuổi anh bằng $\\frac{5}{4}$ tuổi em. Biết hai lần tuổi anh cộng với tuổi em là 28 tuổi. Tính số tuổi của anh.",
    modelAnswer: "Coi tuổi của anh là 5 phần thì tuổi em là 4 phần.\nKhi đó 2 lần tuổi anh tương đương với 10 phần.\nTổng tuổi anh (2 lần) và tuổi em là 10 + 4 = 14 (phần) tương ứng với 28 tuổi.\nGiá trị 1 phần là: 28 : 14 = 2 (tuổi).\nTuổi anh hiện nay là: 2 × 5 = 10 (tuổi)."
  },
  "CG-2022-23-C8": {
    correct: "51,2",
    unit: "cm²",
    stem: "Cho hình thang $ABCD$ có hai đáy $AB, CD$. Hai đường chéo $AC$ và $BD$ cắt nhau tại $O$. Biết diện tích tam giác $OAD$ là $11\\text{ cm}^2$, diện tích tam giác $OAB$ là $5\\text{ cm}^2$. Tính diện tích hình thang $ABCD$.",
    figure: "cg-2022-c8",
    modelAnswer: "Ta có S_CAB = S_DAB = S_OAB + S_OAD = 5 + 11 = 16 cm².\nS_OBC = S_CAB - S_OAB = 16 - 5 = 11 cm².\nXét hai tam giác AOB and AOD có chung chiều cao từ A xuống BD nên S_AOB / S_AOD = OB / OD = 5 / 11.\nTương tự, S_OBC / S_ODC = OB / OD = 5 / 11 => S_ODC = 11 : 5 × 11 = 24,2 cm².\nDiện tích hình thang ABCD là: 16 + 11 + 24,2 = 51,2 cm²."
  },
  "CG-2022-23-B1": {
    correct: "88",
    unit: "học sinh",
    placeholder: "Trình bày lời giải...",
    modelAnswer: "a) Số học sinh đạt giải nhất là: 120 × 10% = 12 (học sinh).\n\nb) Tổng số học sinh đạt 3 giải còn lại (nhì, ba, khuyến khích) là: 120 - 12 = 108 (học sinh).\nSố học sinh giải nhì bằng 1/5 tổng ba giải còn lại => Số giải nhì chiếm 1/6 tổng số học sinh đạt giải.\nSố học sinh giải nhì là: 120 × 1/6 = 20 (học sinh).\nTổng số học sinh đạt giải ba và khuyến khích là: 120 - 12 - 20 = 88 (học sinh)."
  },
  "CG-2022-23-B2": {
    correct: "332; 240",
    placeholder: "Trình bày lời giải...",
    stem: "Trong kì thi chọn HSG có hai môn thi là Toán và Tiếng Anh. Biết $\\frac{1}{10}$ số học sinh giỏi Tiếng Anh bằng $\\frac{6}{83}$ số học sinh giỏi Toán. Số học sinh giỏi Toán hơn số học sinh giỏi Tiếng Anh là một số có hai chữ số, chia cho 5 và 9 đều dư 2. Tính số học sinh giỏi Toán, số học sinh giỏi Tiếng Anh.",
    modelAnswer: "Hiệu số học sinh giỏi Toán và Anh chia cho 5 và 9 đều dư 2. Số có hai chữ số thỏa mãn điều kiện này là 47 hoặc 92.\nTỉ số giữa học sinh Anh và Toán là: 6/83 : 1/10 = 60/83.\nHiệu số phần bằng nhau: 83 - 60 = 23 (phần).\nHiệu số học sinh giỏi phải chia hết cho 23. Trong hai số 47 và 92, chỉ có 92 chia hết cho 23 (92 : 23 = 4).\nDo đó hiệu số học sinh giỏi hai môn là 92 học sinh.\nSố học sinh giỏi Toán: 4 × 83 = 332 (học sinh).\nSố học sinh giỏi Tiếng Anh: 4 × 60 = 240 (học sinh)."
  },

  // --- YEAR 2023-2024 ---
  "CG-2023-24-C1": {
    correct: "C",
    stem: "Tìm $x$ sao cho: $\\frac{12}{5} < \\overline{x,2} < \\frac{13}{4}$.",
    modelAnswer: "Ta có: 12/5 = 2,4 và 13/4 = 3,25. Ta có: 2,4 < x,2 < 3,25. Suy ra chữ số x chỉ có thể bằng 3. Chọn C."
  },
  "CG-2023-24-C2": {
    correct: "A",
    modelAnswer: "Đổi: 0,5 giờ = 30 phút.\nThời gian An đến trường là: 6 giờ 45 phút + 10 phút + 30 phút = 7 giờ 25 phút. Chọn A."
  },
  "CG-2023-24-C3": {
    correct: "D",
    modelAnswer: "Thời gian 1 công nhân hoàn thành công việc: 30 × 10 = 300 (ngày).\nThời gian 20 công nhân hoàn thành công việc: 300 : 20 = 15 (ngày). Chọn D."
  },
  "CG-2023-24-C4": {
    correct: "C",
    stem: "Phòng học có dạng hình hộp chữ nhật chiều dài $7\\text{ m}$, chiều rộng $4,5\\text{ m}$, chiều cao $3\\text{ m}$. Người ta muốn sơn toàn bộ trần nhà và 4 bức tường. Biết tổng diện tích các cửa là $7,5\\text{ m}^2$. Tính diện tích cần sơn.",
    modelAnswer: "Diện tích xung quanh phòng học là: 2 × (7 + 4,5) × 3 = 69 m².\nDiện tích trần nhà là: 7 × 4,5 = 31,5 m².\nDiện tích cần sơn là: 69 + 31,5 - 7,5 = 93 m². Chọn C."
  },
  "CG-2023-24-C5": {
    correct: "5274",
    stem: "Cho $A = \\overline{52xy}$. Biết $A$ chia hết cho 2 và 9; chia 5 dư 4. Tìm $A$.",
    modelAnswer: "A = 52xy chia hết cho 2 và chia 5 dư 4 nên y = 4. Ta có số 52x4.\nSố 52x4 chia hết cho 9 nên (5 + 2 + x + 4) = (11 + x) chia hết cho 9 => x = 7.\nVậy A = 5274."
  },
  "CG-2023-24-C6": {
    correct: "30",
    unit: "tấn",
    stem: "Tổng số gạo kho I và kho II là 46 tấn. Biết 15 lần số gạo kho I bằng 8 lần số gạo kho II. Hỏi kho II chứa bao nhiêu tấn gạo?",
    modelAnswer: "Ta có tỉ số gạo giữa kho I và kho II là 8/15.\nSố gạo ở kho II là: 46 : (8 + 15) × 15 = 30 (tấn)."
  },
  "CG-2023-24-C7": {
    correct: "28%",
    figure: "cg-2023-c7",
    modelAnswer: "Dựa vào biểu đồ hình cột:\n- Số học sinh thích cam và chuối: 4 + 3 = 7 em\n- Số học sinh thích táo và xoài: 15 + 10 = 25 em\nTỉ số phần trăm là: 7 : 25 × 100 = 28%."
  },
  "CG-2023-24-C8": {
    correct: "56,52",
    unit: "cm²",
    stem: "Cho hình vuông $ABCD$. Vẽ nửa đường tròn đường kính $AB$ và $\\frac{1}{4}$ đường tròn bán kính $AB$. Tính diện tích phần tô đậm, biết chu vi đường tròn đường kính $AB$ là $37,68\\text{ cm}$.",
    figure: "cg-2023-c8",
    modelAnswer: "Đường kính AB là: 37,68 : 3,14 = 12 cm.\nDiện tích nửa hình tròn đường kính AB là: (12 : 2) × (12 : 2) × 3,14 : 2 = 56,52 cm².\nDiện tích 1/4 hình tròn bán kính AB là: 12 × 12 × 3,14 : 4 = 113,04 cm².\nDiện tích phần tô đậm là: 113,04 - 56,52 = 56,52 cm²."
  },
  "CG-2023-24-B1": {
    correct: "8,8",
    unit: "km",
    placeholder: "Trình bày lời giải...",
    stem: "Cho đoạn đường AD có 1 đoạn lên dốc, 1 đoạn xuống dốc, 1 đoạn bằng phẳng. Trong đó $AB = BC$, $CD = 4\\text{ km}$ (AB là đoạn lên dốc, BC là đoạn xuống dốc, CD là đoạn bằng phẳng). Vận tốc lên dốc $4\\text{ km/giờ}$, xuống dốc $6\\text{ km/giờ}$, đường bằng $5\\text{ km/giờ}$.\na) Tính thời gian đi đoạn CD.\nb) Tính độ dài AD, biết người đó đi từ A lúc 5 giờ và đến D lúc 6 giờ 48 phút.",
    modelAnswer: "a) Thời gian đi đoạn CD là: 4 : 5 = 0,8 (giờ) = 48 phút.\n\nb) Thời gian đi hai đoạn AB và BC là: 1 giờ 48 phút - 48 phút = 1 giờ.\nTỉ số vận tốc lên dốc so với xuống dốc là: 4/6 = 2/3.\nDo quãng đường AB = BC nên tỉ số thời gian lên dốc so với xuống dốc là 3/2.\nThời gian đi lên dốc AB là: 1 : (3 + 2) × 3 = 0,6 (giờ).\nĐoạn đường AB = BC dài: 4 × 0,6 = 2,4 (km).\nĐộ dài đoạn đường AD là: 2,4 + 2,4 + 4 = 8,8 (km)."
  },
  "CG-2023-24-B2": {
    correct: "1, 3, 4, 6, 7",
    placeholder: "Trình bày lời giải...",
    modelAnswer: "a) Một bộ 5 số tự nhiên thỏa mãn yêu cầu là: 1, 3, 4, 6, 7.\n\nb) Chứng minh:\nGiả sử cả 5 số đều không chia hết cho 3 => Các số này chỉ chia 3 dư 1 hoặc dư 2.\n- Nếu có 3 số cùng số dư khi chia cho 3 đứng cạnh nhau, tổng của chúng chia hết cho 3 (vô lý).\n- Nếu các số dư được xếp xen kẽ, ta luôn tìm được 2 hoặc 3 số liên tiếp có tổng chia hết cho 3.\nDo đó, trong vòng tròn 5 số luôn phải có ít nhất 1 số chia hết cho 3."
  },

  // --- YEAR 2024-2025 ---
  "CG-2024-25-C1": {
    correct: "2,75",
    stem: "Viết hỗn số $2\\frac{3}{4}$ dưới dạng số thập phân.",
    modelAnswer: "Ta có: 2 và 3/4 = 2 + 0,75 = 2,75."
  },
  "CG-2024-25-C2": {
    correct: "2,0015",
    unit: "ha",
    stem: "$2\\text{ ha } 15\\text{ m}^2 = \\dots\\text{ ha}$.",
    modelAnswer: "Ta có: 2 ha 15 m² = 2 + 15/10000 = 2,0015 ha."
  },
  "CG-2024-25-C3": {
    correct: "37,5",
    unit: "km",
    modelAnswer: "Vận tốc của người đó là: 1875 : 3 = 625 m/phút.\nĐổi: 1 giờ = 60 phút.\nTrong 1 giờ người đó đi được: 625 × 60 = 37 500 m = 37,5 km."
  },
  "CG-2024-25-C4": {
    correct: "480",
    unit: "cm³",
    stem: "Một hình hộp chữ nhật, chu vi đáy là $36\\text{ cm}$, chiều rộng là $8\\text{ cm}$, biết chiều cao bằng $\\frac{3}{4}$ chiều rộng. Tính thể tích của hình hộp chữ nhật đó.",
    modelAnswer: "Chiều dài của hình hộp chữ nhật là: 36 : 2 - 8 = 10 (cm).\nChiều cao của hình hộp chữ nhật là: 8 × 3/4 = 6 (cm).\nThể tích hình hộp chữ nhật là: 10 × 8 × 6 = 480 cm³."
  },
  "CG-2024-25-C5": {
    correct: "210",
    unit: "người",
    figure: "cg-2024-c5",
    modelAnswer: "Tỉ lệ phần trăm người thích bánh cuốn: 100% - (25% + 43% + 18%) = 14%.\nSố người thích ăn bánh cuốn là: 1500 × 14% = 210 (người)."
  },
  "CG-2024-25-C6": {
    correct: "8 giờ 15 phút",
    modelAnswer: "Quãng đường đi trong 30 phút đầu: 50 × 0,5 = 25 (km).\nQuãng đường còn lại: 95 - 25 = 70 (km).\nThời gian đi quãng đường còn lại là: 70 : 40 = 1,75 giờ = 1 giờ 45 phút.\nNgười đó đến nơi lúc: 6 giờ + 30 phút + 1 giờ 45 phút = 8 giờ 15 phút."
  },
  "CG-2024-25-C7": {
    correct: "254",
    unit: "cm²",
    figure: "cg-2024-c7",
    modelAnswer: "Diện tích hình chữ nhật ngang: 30 × 5 = 150 cm².\nDiện tích hình chữ nhật đứng: 18 × 8 = 144 cm².\nDiện tích giao nhau: 8 × 5 = 40 cm².\nDiện tích phần tô đậm là: 150 + 144 - 40 = 254 cm²."
  },
  "CG-2024-25-C8": {
    correct: "39",
    unit: "tuổi",
    stem: "Năm nay tuổi hai bố con là 50 tuổi. 3 năm trước, tuổi con bằng $\\frac{2}{9}$ tuổi bố. Hiện nay tuổi bố là bao nhiêu?",
    modelAnswer: "Tổng số tuổi bố và con 3 năm trước là: 50 - 3 - 3 = 44 (tuổi).\nTuổi bố 3 năm trước là: 44 : (2 + 9) × 9 = 36 (tuổi).\nTuổi bố hiện nay là: 36 + 3 = 39 (tuổi)."
  },
  "CG-2024-25-B1": {
    correct: "80",
    unit: "trang",
    placeholder: "Trình bày lời giải...",
    modelAnswer: "a) Ngày thứ nhất Liên đọc được: 375 : 5 = 75 (trang).\n\nb) Số trang còn lại sau ngày thứ nhất: 375 - 75 = 300 (trang).\nĐổi: 1,5 = 3/2.\nGọi số trang ngày 4 đọc là 4 phần. Số trang ngày 3 đọc là 4 × 1.5 = 6 phần. Số trang ngày 2 đọc là: 6 × 5/6 = 5 phần.\nTổng số phần của cả ba ngày còn lại là: 5 + 6 + 4 = 15 phần.\nSố trang đọc trong ngày thứ tư là: 300 : 15 × 4 = 80 (trang).\n\nĐáp số: a) 75 trang; b) 80 trang."
  },
  "CG-2024-25-B2": {
    correct: "a = 1, b = 5 hoặc a = 2, b = 3",
    placeholder: "Trình bày lời giải...",
    stem: "Cho 2 số tự nhiên a và b ($a < b$).\na) Ta có phép tính: $a \\times b \\times (a + b) = 30$. Tìm các số a và b.\nb) $a \\times b \\times (a + b) = 20242025$ được không? Giải thích vì sao.",
    modelAnswer: "a) Ta phân tích 30 thành tích của 3 số tự nhiên (a, b, a+b):\n30 = 1 × 2 × 15 = 1 × 3 × 10 = 1 × 5 × 6 = 2 × 3 × 5.\nXét điều kiện a < b < a+b, ta tìm được hai cặp thỏa mãn:\n- a = 1, b = 5 (a+b = 6)\n- a = 2, b = 3 (a+b = 5)\nVậy a = 1, b = 5 hoặc a = 2, b = 3.\n\nb) Tích a × b × (a + b) luôn là số chẵn vì nếu a, b cùng lẻ thì tổng của chúng (a+b) chẵn. Nếu có ít nhất một số chẵn thì hiển nhiên tích chẵn.\nSố 20242025 là số lẻ, do đó phép tính không thể thực hiện được."
  },

  // --- YEAR 2025-2026 ---
  "CG-2025-26-C1": {
    correct: "5",
    unit: "tấn",
    modelAnswer: "Vì chữ số ở hàng phần mười là 6 > 5 nên ta làm tròn lên số tự nhiên gần nhất là 5. Đáp số: 5 tấn."
  },
  "CG-2025-26-C2": {
    correct: "15011",
    unit: "cm³",
    stem: "Tính: $15\\text{ dm}^3 + 11\\text{ cm}^3 = \\dots\\text{ cm}^3$?",
    modelAnswer: "Đổi: 15 dm³ = 15 000 cm³.\nTính: 15 000 cm³ + 11 cm³ = 15 011 cm³."
  },
  "CG-2025-26-C3": {
    correct: "4",
    unit: "cm",
    stem: "Quãng đường từ nhà A đến B dài 800 m. Trên bản đồ có tỉ lệ $1 : 20000$, quãng đường đó dài bao nhiêu?",
    modelAnswer: "Đổi: 800 m = 80 000 cm.\nTrên bản đồ tỉ lệ 1 : 20000, quãng đường đó dài là: 80 000 : 20 000 = 4 (cm)."
  },
  "CG-2025-26-C4": {
    correct: "864",
    unit: "cm²",
    modelAnswer: "Diện tích toàn phần của hình lập phương là: 12 × 12 × 6 = 864 cm²."
  },
  "CG-2025-26-C5": {
    correct: "2/7",
    stem: "Tung cùng lúc hai đồng xu cân đối và đồng chất được kết quả: 2 mặt sấp xuất hiện 10 lần; 2 mặt ngửa xuất hiện 8 lần; 1 ngửa 1 sấp xuất hiện 17 lần. Tính tỉ số giữa số lần xuất hiện 2 mặt sấp với tổng số lần tung là $10 : 35 = \\frac{2}{7}$.",
    modelAnswer: "Tổng số lần tung là: 10 + 8 + 17 = 35 (lần).\nTỉ số giữa số lần xuất hiện 2 mặt sấp với tổng số lần tung là: 10 : 35 = 2/7."
  },
  "CG-2025-26-C6": {
    correct: "15",
    unit: "phút",
    modelAnswer: "Thời gian đi quãng đường 45 km là: 45 : 30 = 1,5 giờ = 1 giờ 30 phút.\nThời gian đi quãng đường 16 km là: 16 : 32 = 0,5 giờ = 30 phút.\nTổng thời gian đi hai đoạn đường (không tính nghỉ) là: 1,5 + 0,5 = 2 giờ.\nThời gian di chuyển thực tế từ 7 giờ đến 9 giờ 15 phút là 2 giờ 15 phút.\nThời gian nghỉ của người đó là: 2 giờ 15 phút - 2 giờ = 15 phút."
  },
  "CG-2025-26-C7": {
    correct: "20",
    unit: "viên",
    stem: "Nam có một số bi xanh và đỏ, biết số bi xanh ít hơn số bi đỏ là 12 viên. Việt cho Nam 4 viên bi xanh thì tỉ số giữa bi xanh và đỏ bây giờ là $\\frac{3}{5}$. Hãy tính số bi đỏ.",
    modelAnswer: "Sau khi Việt cho Nam 4 viên bi xanh, hiệu số bi đỏ và xanh lúc này là: 12 - 4 = 8 (viên).\nCoi số bi xanh lúc sau là 3 phần thì số bi đỏ là 5 phần.\nHiệu số phần bằng nhau: 5 - 3 = 2 phần.\nSố bi đỏ là: 8 : 2 × 5 = 20 (viên). (Lưu ý: Số bi đỏ lúc đầu và lúc sau không đổi)."
  },
  "CG-2025-26-C8": {
    correct: "30",
    unit: "cm",
    stem: "Cho một hình thang có diện tích $100\\text{ cm}^2$. Người ta mở rộng đáy lớn thêm $5\\text{ cm}$ thì phần diện tích tăng thêm bằng $\\frac{1}{5}$ diện tích hình thang ban đầu. Tính tổng độ dài 2 đáy sau khi mở rộng.",
    modelAnswer: "Diện tích tăng thêm là: 100 : 5 = 20 cm².\nChiều cao của hình thang là: 20 × 2 : 5 = 8 cm.\nTổng độ dài hai đáy ban đầu: 100 × 2 : 8 = 25 cm.\nTổng độ dài hai đáy sau khi mở rộng: 25 + 5 = 30 cm."
  },
  "CG-2025-26-B1": {
    correct: "180",
    unit: "phần",
    placeholder: "Trình bày lời giải...",
    stem: "Nhân dịp 1/6, một tổ chức thiện nguyện chuẩn bị một số phần quà phát cho 4 khu phố: Khu A 50 phần; Khu B $80\\%$ số quà của khu A. Sau đó khu C được $\\frac{5}{9}$ số quà còn lại và 5 phần. Cuối cùng khu D được $\\frac{4}{5}$ số quà còn lại và 7 phần thì vừa hết.\na) Tính tổng số phần quà của cả 2 khu A và B.\nb) Tính số phần quà tổ chức đã chuẩn bị.",
    modelAnswer: "a) Khu phố B nhận được số quà là: 50 × 80% = 40 (phần quà).\nTổng số phần quà của cả hai khu A và B nhận được: 50 + 40 = 90 (phần quà).\n\nb) Quy đồng và tính ngược từ cuối:\nKhu D nhận được 4/5 số quà còn lại và 7 phần thì hết => 7 phần chính là 1/5 số quà còn lại sau khu C => Số quà còn lại sau khu C là: 7 × 5 = 35 phần.\nTrước đó khu C được 5/9 số quà còn lại và 5 phần => 35 + 5 = 40 phần chính là 4/9 số quà còn lại sau khu A, B => Số quà còn lại sau khu A, B là: 40 : 4 × 9 = 90 phần.\nTổng số quà ban đầu là: 90 + 90 = 180 (phần quà)."
  },
  "CG-2025-26-B2": {
    correct: "66",
    unit: "thẻ",
    placeholder: "Trình bày lời giải...",
    modelAnswer: "a) Số thẻ trong bộ bài ứng với các số từ 2 đến 16 có số lượng là 1; 2; 3; ...; 15 thẻ.\nTổng số thẻ trong bộ bài là: 1 + 2 + 3 + ... + 15 = 120 (thẻ).\n\nb) Để tìm số thẻ tối thiểu cần lấy để chắc chắn có 6 thẻ cùng số, ta xét trường hợp xấu nhất (chưa rút ra được 6 thẻ nào cùng số):\n- Rút hết tất cả các thẻ của các nhóm số có ít hơn 6 thẻ (nhóm thẻ 2, 3, 4, 5, 6): 1 + 2 + 3 + 4 + 5 = 15 thẻ.\n- Rút tối đa 5 thẻ ở mỗi nhóm còn lại từ số 7 đến 16 (có 10 nhóm): 10 × 5 = 50 thẻ.\nTổng số thẻ tối đa bốc ra mà vẫn chưa có 6 thẻ cùng số là: 15 + 50 = 65 thẻ.\nĐể chắc chắn có 6 thẻ cùng số, ta chỉ cần bốc thêm 1 thẻ nữa.\nSố thẻ cần bốc ít nhất là: 65 + 1 = 66 thẻ."
  }
};

// Maps category names from the JSON lookups to target topic IDs in the database schema.
const CATEGORY_MAP: Record<string, string> = {
  "Số học & Số tự nhiên": "soh",
  "Hình học": "hinh",
  "Phân số, Tỉ số & %": "phan",
  "Chuyển động": "cd",
  "Suy luận logic": "log",
  "Đo lường & Đổi đơn vị": "do",
  "Biểu đồ, Thống kê & Xác suất": "xs",
  "Toán tuổi": "tuoi",
  "Đại lượng tỉ lệ & Bản đồ": "ti",
  "Thời gian (giờ - phút)": "tg"
};

async function main() {
  console.log("=== Seeding Cầu Giấy Official Exams & Questions ===");

  // Read JSON file
  const rawData = fs.readFileSync("de_thi_lop6_4truong.json", "utf8");
  const data = JSON.parse(rawData);

  const problems = data.problems || [];
  const cgProblems = problems.filter((p: any) => p.school_code === "CG");
  
  if (cgProblems.length === 0) {
    console.error("No questions found for CG in the JSON file!");
    return;
  }

  // 1. Group questions by year to create exams
  const problemsByYear: Record<string, any[]> = {};
  cgProblems.forEach((p: any) => {
    if (!problemsByYear[p.year]) {
      problemsByYear[p.year] = [];
    }
    problemsByYear[p.year].push(p);
  });

  const mcqRegex = /^(.*?)\s+A\.\s*(.*?)\s+B\.\s*(.*?)\s+C\.\s*(.*?)\s+D\.\s*(.*)$/;

  for (const year of Object.keys(problemsByYear).sort()) {
    const list = problemsByYear[year];
    
    // Sort questions by their question_code to ensure C1-C8 (Phần 1/2) are ordered 1-8 and B1-B2 (Tự luận) are ordered 9-10
    list.sort((a, b) => {
      const codeA = a.question_code;
      const codeB = b.question_code;
      const isA_B = codeA.startsWith("B");
      const isB_B = codeB.startsWith("B");

      if (isA_B && !isB_B) return 1;
      if (!isA_B && isB_B) return -1;
      return codeA.localeCompare(codeB, undefined, { numeric: true });
    });


    // Construct Exam ID (e.g. "cg-2019" for "2019-20")
    const startYear = year.split("-")[0];
    const examId = `cg-${startYear}`;
    const displayYear = list[0].year_full || year;

    console.log(`\n→ Processing Exam: ${examId} (${displayYear}) - ${list.length} questions`);

    // Upsert Exam record
    await prisma.exam.upsert({
      where: { id: examId },
      create: {
        id: examId,
        school: "cg",
        kind: "official",
        year: displayYear,
        title: `Đề thi vào lớp 6 — THCS Cầu Giấy`,
        intro: "Học sinh làm bài trên giấy nháp, sau đó điền đáp án/lời giải vào ô trả lời. Không sử dụng máy tính.",
        minutes: 45,
        qcount: list.length,
        generated: false,
        note: `Đề thi chính thức Cầu Giấy năm học ${displayYear}`
      },
      update: {
        school: "cg",
        kind: "official",
        year: displayYear,
        title: `Đề thi vào lớp 6 — THCS Cầu Giấy`,
        intro: "Học sinh làm bài trên giấy nháp, sau đó điền đáp án/lời giải vào ô trả lời. Không sử dụng máy tính.",
        minutes: 45,
        qcount: list.length,
        generated: false,
        note: `Đề thi chính thức Cầu Giấy năm học ${displayYear}`
      }
    });

    // Delete existing questions for this exam to ensure clean seed
    await prisma.question.deleteMany({
      where: { examId }
    });

    // Create Question records
    for (let index = 0; index < list.length; index++) {
      const q = list[index];
      const qNum = index + 1; // 1-indexed

      // Get enrichment data (correct, unit, modelAnswer) from the map
      const enrichment = ENRICHMENT_MAP[q.id];
      if (!enrichment) {
        console.warn(`WARNING: Missing enrichment data for question ${q.id}`);
      }

      // Determine topic
      const topicId = CATEGORY_MAP[q.category_name] || "soh";

      // Setup points (1 for fill/mcq, 2 for essay/tự luận)
      const isEssay = q.is_essay || q.format_code === "Tự luận";
      const points = isEssay ? 2 : 1;

      let type = isEssay ? "essay" : (q.format_code === "TN" ? "mcq" : "fill");
      let stem = q.content_full || "";
      let optionsJson = "[]";

      // If multiple choice, parse options
      if (type === "mcq") {
        const match = stem.match(mcqRegex);
        if (match) {
          stem = match[1].trim();
          const options = [
            { id: "A", text: match[2].trim() },
            { id: "B", text: match[3].trim() },
            { id: "C", text: match[4].trim() },
            { id: "D", text: match[5].trim() }
          ];
          optionsJson = JSON.stringify(options);
        } else {
          // If options can't be parsed (like in 2025-26), fallback to "fill"
          type = "fill";
        }
      }

      // Apply enrichments
      if (enrichment?.stem) {
        stem = enrichment.stem;
      }
      if (enrichment?.options) {
        optionsJson = JSON.stringify(enrichment.options);
      }
      const figure = enrichment?.figure || null;

      await prisma.question.create({
        data: {
          id: q.id,
          examId,
          num: qNum,
          type,
          topic: topicId,
          grade: q.grade_code,
          points,
          stem,
          unit: enrichment?.unit || null,
          placeholder: enrichment?.placeholder || (type === "essay" ? "Trình bày lời giải..." : "Đáp số..."),
          correct: enrichment?.correct || null,
          options: optionsJson,
          modelAnswer: enrichment?.modelAnswer || null,
          figure
        }
      });
    }
  }

  console.log("\n✓ Cầu Giấy seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
