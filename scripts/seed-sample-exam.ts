/**
 * Seed script for the sample reference CG exam.
 * Source: public/sample_exam/de_thu_nghiem_CG.md
 * Exam ID: cg-2025-ref
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXAM_ID = "cg-2025-ref";

const questions = [
  // ─── PHẦN A: Trắc nghiệm (4 câu MCQ) ───────────────────────────────────────
  {
    num: 1,
    type: "mcq" as const,
    topic: "soh",
    grade: "L5",
    points: 1,
    stem: "Kết quả của phép tính: $2{,}5 \\times 3{,}7 + 2{,}5 \\times 6{,}3$ là",
    options: [
      { id: "A", text: "25" },
      { id: "B", text: "2,5" },
      { id: "C", text: "250" },
      { id: "D", text: "26,5" },
    ],
    correct: "A",
    unit: null,
    placeholder: null,
    modelAnswer:
      "Tính nhanh: $2{,}5 \\times 3{,}7 + 2{,}5 \\times 6{,}3 = 2{,}5 \\times (3{,}7 + 6{,}3) = 2{,}5 \\times 10 = 25$. Chọn A.",
    figure: null,
  },
  {
    num: 2,
    type: "mcq" as const,
    topic: "do",
    grade: "L5",
    points: 1,
    stem: "Đổi: $3\\ \\text{m}^3\\ 45\\ \\text{dm}^3 = \\ldots\\ \\text{dm}^3$",
    options: [
      { id: "A", text: "345" },
      { id: "B", text: "3 045" },
      { id: "C", text: "3 450" },
      { id: "D", text: "30 045" },
    ],
    correct: "B",
    unit: null,
    placeholder: null,
    modelAnswer:
      "Vì $1\\ \\text{m}^3 = 1000\\ \\text{dm}^3$, nên $3\\ \\text{m}^3\\ 45\\ \\text{dm}^3 = 3000 + 45 = 3045\\ \\text{dm}^3$. Chọn B.",
    figure: null,
  },
  {
    num: 3,
    type: "mcq" as const,
    topic: "ti",
    grade: "L5",
    points: 1,
    stem: "Một mảnh đất hình chữ nhật trên bản đồ tỉ lệ $1 : 500$ có chiều dài $6\\ \\text{cm}$ và chiều rộng $4\\ \\text{cm}$. Diện tích thực tế của mảnh đất đó là",
    options: [
      { id: "A", text: "$24\\ \\text{m}^2$" },
      { id: "B", text: "$60\\ \\text{m}^2$" },
      { id: "C", text: "$600\\ \\text{m}^2$" },
      { id: "D", text: "$6000\\ \\text{m}^2$" },
    ],
    correct: "C",
    unit: null,
    placeholder: null,
    modelAnswer:
      "Chiều dài thực: $6 \\times 500 = 3000\\ \\text{cm} = 30\\ \\text{m}$.\nChiều rộng thực: $4 \\times 500 = 2000\\ \\text{cm} = 20\\ \\text{m}$.\nDiện tích: $30 \\times 20 = 600\\ \\text{m}^2$. Chọn C.",
    figure: null,
  },
  {
    num: 4,
    type: "mcq" as const,
    topic: "xs",
    grade: "NC",
    points: 1,
    stem: "Tung cùng lúc 3 đồng xu cân đối được kết quả: 3 mặt sấp xuất hiện 12 lần; 3 mặt ngửa xuất hiện 8 lần; còn lại là các trường hợp khác. Biết tổng số lần tung là 40. Tỉ số giữa số lần xuất hiện 3 mặt sấp với tổng số lần tung là",
    options: [
      { id: "A", text: "$\\dfrac{12}{40}$" },
      { id: "B", text: "$\\dfrac{3}{10}$" },
      { id: "C", text: "$\\dfrac{12}{28}$" },
      { id: "D", text: "$\\dfrac{3}{40}$" },
    ],
    correct: "B",
    unit: null,
    placeholder: null,
    modelAnswer:
      "Tỉ số cần tìm là: $\\dfrac{12}{40} = \\dfrac{3}{10}$. Chọn B.",
    figure: null,
  },

  // ─── PHẦN B: Điền đáp số (4 câu) ───────────────────────────────────────────
  {
    num: 5,
    type: "fill" as const,
    topic: "soh",
    grade: "L4",
    points: 1,
    stem: "Tổng số học sinh khối 5 của một trường tiểu học là một số có ba chữ số chia hết cho cả 2, 5 và 9. Biết chữ số hàng trăm bằng 4. Tìm số học sinh khối 5 của trường đó.",
    options: [],
    correct: "450",
    unit: "học sinh",
    placeholder: "Đáp số...",
    modelAnswer:
      "Chia hết cho 2 và 5 nên chữ số tận cùng là 0. Số có dạng $4\_0$.\nChia hết cho 9 nên $(4 + \\_ + 0)$ chia hết cho 9, suy ra $\\_ = 5$.\nVậy số học sinh là $\\mathbf{450}$.",
    figure: null,
  },
  {
    num: 6,
    type: "fill" as const,
    topic: "cd",
    grade: "L5",
    points: 1,
    stem: "Một người đi xe máy từ A lúc 6 giờ 30 phút với vận tốc 36 km/giờ. Đi được 1 giờ thì dừng nghỉ 20 phút, sau đó tiếp tục đi với vận tốc 48 km/giờ và đến B lúc 9 giờ 50 phút. Tính độ dài quãng đường AB.",
    options: [],
    correct: "132",
    unit: "km",
    placeholder: "Đáp số...",
    modelAnswer:
      "Tổng thời gian: 9 giờ 50 phút − 6 giờ 30 phút = 3 giờ 20 phút.\nTrừ thời gian nghỉ: 3 giờ 20 phút − 20 phút = 3 giờ (thời gian đi thực).\nQuãng đường 1 giờ đầu: $36 \\times 1 = 36$ km.\nThời gian đi sau nghỉ: $3 - 1 = 2$ giờ → quãng đường: $48 \\times 2 = 96$ km.\nAB = $36 + 96 = \\mathbf{132}$ km.",
    figure: null,
  },
  {
    num: 7,
    type: "fill" as const,
    topic: "tuoi",
    grade: "L4",
    points: 1,
    stem: "Tuổi mẹ năm nay gấp 4 lần tuổi con. Biết tổng số tuổi của hai mẹ con hiện nay là 45 tuổi. Tính tuổi con hiện nay.",
    options: [],
    correct: "9",
    unit: "tuổi",
    placeholder: "Đáp số...",
    modelAnswer:
      "Coi tuổi con là 1 phần, tuổi mẹ là 4 phần, tổng là 5 phần.\n1 phần = $45 : 5 = 9$.\nTuổi con hiện nay: $\\mathbf{9}$ tuổi.",
    figure: null,
  },
  {
    num: 8,
    type: "fill" as const,
    topic: "hinh",
    grade: "NC",
    points: 1,
    stem: "Cho hình thang $ABCD$ có hai đáy $AB$ và $CD$. Hai đường chéo $AC$ và $BD$ cắt nhau tại $O$. Biết diện tích tam giác $OAB$ bằng $9\\ \\text{cm}^2$ và diện tích tam giác $OBC$ bằng $15\\ \\text{cm}^2$. Tính diện tích hình thang $ABCD$.",
    options: [],
    correct: "64",
    unit: "cm²",
    placeholder: "Đáp số...",
    modelAnswer:
      "Vì hai tam giác $OAB$ và $OBC$ chung chiều cao từ $B$ nên $\\dfrac{S_{OAB}}{S_{OBC}} = \\dfrac{OA}{OC} = \\dfrac{9}{15} = \\dfrac{3}{5}$.\nDo $AB \\parallel CD$, suy ra $\\dfrac{AB}{CD} = \\dfrac{OA}{OC} = \\dfrac{3}{5}$.\nHai tam giác $OAB$ và $OCD$ đồng dạng tỉ số $\\dfrac{3}{5}$ nên $\\dfrac{S_{OAB}}{S_{OCD}} = \\left(\\dfrac{3}{5}\\right)^2 = \\dfrac{9}{25}$.\nSuy ra $S_{OCD} = 9 \\times \\dfrac{25}{9} = 25\\ \\text{cm}^2$.\nVì $S_{OAD} = S_{OBC} = 15\\ \\text{cm}^2$ (tính chất hình thang).\nDiện tích hình thang $ABCD = 9 + 15 + 15 + 25 = \\mathbf{64}\\ \\text{cm}^2$.",
    figure: null,
  },

  // ─── PHẦN C: Tự luận (2 bài) ────────────────────────────────────────────────
  {
    num: 9,
    type: "essay" as const,
    topic: "phan",
    grade: "L5",
    points: 2,
    stem: "Một cửa hàng nhập về một số chiếc áo. Buổi sáng cửa hàng bán được $\\dfrac{2}{5}$ số áo nhập về. Buổi chiều cửa hàng bán được $\\dfrac{3}{4}$ số áo còn lại sau buổi sáng thì còn lại đúng 30 chiếc áo.\na) Tính số áo cửa hàng đã nhập về ban đầu.\nb) Buổi sáng cửa hàng bán được bao nhiêu chiếc áo?",
    options: [],
    correct: "200",
    unit: null,
    placeholder: "Trình bày lời giải...",
    modelAnswer:
      "a) Sau buổi sáng còn lại: $1 - \\dfrac{2}{5} = \\dfrac{3}{5}$ số áo.\nBuổi chiều bán $\\dfrac{3}{4}$ số áo còn lại → còn lại sau buổi chiều = $\\dfrac{1}{4}$ số áo còn lại sau sáng.\nPhân số biểu thị 30 chiếc: $\\dfrac{3}{5} \\times \\dfrac{1}{4} = \\dfrac{3}{20}$ tổng số áo.\nSố áo nhập về: $30 : \\dfrac{3}{20} = \\mathbf{200}$ chiếc.\n\nb) Số áo bán buổi sáng: $200 \\times \\dfrac{2}{5} = \\mathbf{80}$ chiếc.",
    figure: null,
  },
  {
    num: 10,
    type: "essay" as const,
    topic: "log",
    grade: "L4+5",
    points: 2,
    stem: "Trong một hộp có 15 viên bi xanh, 12 viên bi đỏ và 18 viên bi vàng. Không nhìn vào hộp, bạn An lấy ngẫu nhiên ra một số viên bi.\na) Hỏi An cần lấy ít nhất bao nhiêu viên bi để chắc chắn có đủ cả 3 màu?\nb) Hỏi An cần lấy ít nhất bao nhiêu viên bi để chắc chắn có ít nhất 5 viên bi cùng màu?",
    options: [],
    correct: "34",
    unit: null,
    placeholder: "Trình bày lời giải...",
    modelAnswer:
      "a) Trường hợp xấu nhất: An lấy hết 2 màu đông nhất trước khi có màu thứ 3.\nLấy hết 18 vàng + 15 xanh = 33 viên mà vẫn chưa có màu đỏ.\nCần thêm 1 viên → **Đáp số: 34 viên**.\n\nb) Trường hợp xấu nhất: An lấy được 4 viên mỗi màu, tổng $4 \\times 3 = 12$ viên mà vẫn chưa có 5 viên nào cùng màu.\nCần thêm 1 viên nữa → **Đáp số: 13 viên**.",
    figure: null,
  },
];

async function main() {
  console.log("=== Seeding sample reference exam: cg-2025-ref ===");

  // Upsert Exam
  await prisma.exam.upsert({
    where: { id: EXAM_ID },
    create: {
      id: EXAM_ID,
      school: "cg",
      kind: "reference",
      year: "2025-2026",
      title: "Đề thi tham khảo — THCS Cầu Giấy",
      intro:
        "Đề tham khảo mô phỏng phong cách & cấu trúc Cầu Giấy (10 câu / 45 phút). KHÔNG phải đề chính thức của trường.",
      minutes: 45,
      qcount: questions.length,
      generated: false,
      note: "Đề tự tạo mô phỏng phong cách Cầu Giấy 2019-2026",
    },
    update: {
      school: "cg",
      kind: "reference",
      year: "2025-2026",
      title: "Đề thi tham khảo — THCS Cầu Giấy",
      intro:
        "Đề tham khảo mô phỏng phong cách & cấu trúc Cầu Giấy (10 câu / 45 phút). KHÔNG phải đề chính thức của trường.",
      minutes: 45,
      qcount: questions.length,
      generated: false,
      note: "Đề tự tạo mô phỏng phong cách Cầu Giấy 2019-2026",
    },
  });

  // Clear existing questions for this exam
  await prisma.question.deleteMany({ where: { examId: EXAM_ID } });

  // Insert questions
  for (const q of questions) {
    await prisma.question.create({
      data: {
        examId: EXAM_ID,
        num: q.num,
        type: q.type,
        topic: q.topic,
        grade: q.grade,
        points: q.points,
        stem: q.stem,
        options: JSON.stringify(q.options),
        correct: q.correct,
        unit: q.unit,
        placeholder: q.placeholder,
        modelAnswer: q.modelAnswer,
        figure: q.figure,
      },
    });
    console.log(`  ✓ Câu ${q.num} (${q.type}) – ${q.grade}`);
  }

  console.log(`\n✓ Done! Seeded ${questions.length} questions into exam '${EXAM_ID}'.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
