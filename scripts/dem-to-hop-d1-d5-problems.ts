/**
 * Three private Mika practice sets transcribed from:
 * .analysis/math-reassessment-fresh-gpt56sol-20260824T120947Z/
 *   de-dem-to-hop-d1-d5-so-01.html
 *
 * The 20 main questions are kept in source order and split 7-7-6. Questions
 * 13-20 remain essays because the source explicitly requires working.
 */

interface Question {
  type: "fill" | "essay";
  topic: "xs";
  grade: "L5" | "NC";
  stem: string;
  correct: string;
  num?: number;
  unit?: string;
  modelAnswer: string;
}

interface PracticeSet {
  key: string;
  title: string;
  minutes: number;
  questions: Question[];
}

export const DEM_TO_HOP_D1_D5_BAI: PracticeSet[] = [
  {
    key: "dem-to-hop-d1-d5-phan-1",
    title: "Đếm – Tổ hợp D1–D5 · Phần 1",
    minutes: 25,
    questions: [
      { type: "fill", topic: "xs", grade: "L5", stem: "Mika có 3 áo khác nhau và 2 quần khác nhau. Có bao nhiêu cách chọn 1 bộ gồm 1 áo và 1 quần?", correct: "6", num: 6, unit: "cách", modelAnswer: "Mỗi áo ghép được với 2 quần. Có $3\\times2=6$ bộ." },
      { type: "fill", topic: "xs", grade: "L5", stem: "Từ các chữ số 1, 2, 3, 4, lập được bao nhiêu số có hai chữ số khác nhau?", correct: "12", num: 12, unit: "số", modelAnswer: "Chọn hàng chục có 4 cách; hàng đơn vị còn 3 cách. Có $4\\times3=12$ số." },
      { type: "fill", topic: "xs", grade: "L5", stem: "Có 5 loại quả khác nhau. Có bao nhiêu cách chọn 2 loại quả?", correct: "10", num: 10, unit: "cách", modelAnswer: "Liệt kê theo loại quả thứ nhất: $4+3+2+1=10$ cặp; mỗi cặp chỉ tính một lần." },
      { type: "fill", topic: "xs", grade: "L5", stem: "Từ A đến B có 3 con đường; từ B đến C có 4 con đường. Nếu bắt buộc đi qua B, có bao nhiêu cách đi từ A đến C?", correct: "12", num: 12, unit: "cách", modelAnswer: "Chọn một trong 3 đường A–B và một trong 4 đường B–C: $3\\times4=12$ cách." },
      { type: "fill", topic: "xs", grade: "L5", stem: "Từ các chữ số 0, 1, 2, 3, 4, lập được bao nhiêu số chẵn có ba chữ số khác nhau?", correct: "30", num: 30, unit: "số", modelAnswer: "Chữ số cuối là 0, 2 hoặc 4. Cuối là 0 có $4\\times3=12$ số. Cuối là 2 hoặc 4 có $2\\times3\\times3=18$ số. Tổng $12+18=30$ số." },
      { type: "fill", topic: "xs", grade: "L5", stem: "Một nhóm có 7 bạn. Có bao nhiêu cách chọn một đội trưởng và một đội phó?", correct: "42", num: 42, unit: "cách", modelAnswer: "Chọn đội trưởng có 7 cách; sau đó chọn đội phó có 6 cách: $7\\times6=42$ cách." },
      { type: "fill", topic: "xs", grade: "L5", stem: "Có bao nhiêu cách sắp xếp bốn chữ cái M, I, K, A thành một hàng?", correct: "24", num: 24, unit: "cách", modelAnswer: "Lần lượt có 4, 3, 2, 1 cách đặt chữ: $4\\times3\\times2\\times1=24$ cách." },
    ],
  },
  {
    key: "dem-to-hop-d1-d5-phan-2",
    title: "Đếm – Tổ hợp D1–D5 · Phần 2",
    minutes: 30,
    questions: [
      { type: "fill", topic: "xs", grade: "L5", stem: "Một chú kiến đi từ điểm (0,0) đến điểm (3,2). Mỗi bước kiến chỉ đi sang phải 1 đơn vị hoặc đi lên 1 đơn vị. Có bao nhiêu đường đi ngắn nhất?", correct: "10", num: 10, unit: "đường", modelAnswer: "Mỗi đường ngắn nhất gồm 3 bước sang phải và 2 bước đi lên. Chọn 2 trong 5 vị trí cho bước đi lên, được 10 đường." },
      { type: "fill", topic: "xs", grade: "NC", stem: "Từ các chữ số 0, 1, 2, 3, 4, 5, lập được bao nhiêu số có bốn chữ số khác nhau và chia hết cho 5?", correct: "108", num: 108, unit: "số", modelAnswer: "Số chia hết cho 5 có chữ số cuối là 0 hoặc 5. Cuối 0 có $5\\times4\\times3=60$ số. Cuối 5 có $4\\times4\\times3=48$ số. Tổng $60+48=108$ số." },
      { type: "fill", topic: "xs", grade: "NC", stem: "Một nhóm có An, Bình và 6 bạn khác. Có bao nhiêu cách chọn 3 bạn sao cho trong nhóm được chọn có đúng một trong hai bạn An và Bình?", correct: "30", num: 30, unit: "cách", modelAnswer: "Chọn người trong cặp An–Bình có 2 cách. Chọn thêm 2 trong 6 bạn còn lại có 15 cách. Tổng $2\\times15=30$ cách." },
      { type: "fill", topic: "xs", grade: "NC", stem: "Chia 10 chiếc kẹo giống nhau cho 3 bạn, mỗi bạn nhận ít nhất 2 chiếc. Có bao nhiêu cách chia? (Chỉ xét số kẹo mỗi bạn nhận.)", correct: "15", num: 15, unit: "cách", modelAnswer: "Phát trước mỗi bạn 2 chiếc, còn 4 chiếc. Các dạng phân phối là (4,0,0): 3 cách; (3,1,0): 6 cách; (2,2,0): 3 cách; (2,1,1): 3 cách. Tổng $3+6+3+3=15$ cách." },
      { type: "fill", topic: "xs", grade: "NC", stem: "Có 5 quyển sách khác nhau A, B, C, D, E. Có bao nhiêu cách xếp thành một hàng sao cho A và B không đứng cạnh nhau?", correct: "72", num: 72, unit: "cách", modelAnswer: "Có $5!=120$ cách xếp tự do. Nếu A và B cạnh nhau, coi AB/BA là một khối: có $4!\\times2=48$ cách. Vậy có $120-48=72$ cách hợp lệ." },
      { type: "essay", topic: "xs", grade: "NC", stem: "Xếp 4 bạn nam và 3 bạn nữ khác nhau thành một hàng sao cho không có hai bạn nữ nào đứng cạnh nhau. Có bao nhiêu cách xếp? Hãy trình bày cách đếm.", correct: "1440", modelAnswer: "Xếp 4 bạn nam trước có $4!=24$ cách. Khi đó có 5 khe. Chọn 3 khe cho 3 bạn nữ có 10 cách và xếp 3 bạn nữ có $3!=6$ cách. Tổng $24\\times10\\times6=1440$ cách." },
      { type: "essay", topic: "xs", grade: "NC", stem: "Một chú kiến đi từ (0,0) đến (5,4), mỗi bước chỉ đi sang phải hoặc đi lên 1 đơn vị. Có bao nhiêu đường đi ngắn nhất không đi qua điểm (2,2)? Hãy trình bày cách đếm.", correct: "66", modelAnswer: "Tổng số đường ngắn nhất từ (0,0) đến (5,4) là 126. Số đường qua (2,2) là $6\\times10=60$. Vậy có $126-60=66$ đường không qua điểm cấm." },
    ],
  },
  {
    key: "dem-to-hop-d1-d5-phan-3",
    title: "Đếm – Tổ hợp D1–D5 · Phần 3",
    minutes: 35,
    questions: [
      { type: "essay", topic: "xs", grade: "NC", stem: "Chọn 3 số khác nhau từ tập {1,2,3,4,5,6,7,8,9,10}. Có bao nhiêu cách chọn để tổng ba số là một số chẵn? Hãy trình bày cách đếm.", correct: "60", modelAnswer: "Tập có 5 số lẻ và 5 số chẵn. Tổng chẵn khi chọn ba số chẵn (10 cách), hoặc hai số lẻ và một số chẵn ($10\\times5=50$ cách). Tổng $10+50=60$ cách." },
      { type: "essay", topic: "xs", grade: "NC", stem: "Sắp xếp sáu số 1, 2, 3, 4, 5, 6 thành một hàng. Có bao nhiêu cách sắp xếp sao cho 1 đứng trước 2 và đồng thời 3 đứng trước 4? Các số không nhất thiết đứng cạnh nhau. Hãy trình bày cách đếm.", correct: "180", modelAnswer: "Có $6!=720$ cách xếp tự do. Một nửa có 1 đứng trước 2; độc lập với đó, một nửa có 3 đứng trước 4. Vậy có $720:2:2=180$ cách." },
      { type: "essay", topic: "xs", grade: "NC", stem: "Tám bạn khác nhau, trong đó có An và Bình, ngồi quanh một bàn tròn. Hai cách chỉ khác nhau do quay cả bàn được coi là một. Có bao nhiêu cách ngồi để An và Bình không ngồi cạnh nhau? Hãy trình bày cách đếm.", correct: "3600", modelAnswer: "Tổng số cách ngồi là $7!=5040$. Nếu An và Bình cạnh nhau, coi hai bạn là một khối: có $6!\\times2=1440$ cách. Vậy có $5040-1440=3600$ cách hợp lệ." },
      { type: "essay", topic: "xs", grade: "NC", stem: "Có bao nhiêu số nguyên dương không vượt quá 999 mà các chữ số, đọc từ trái sang phải, không giảm? Ví dụ: 147 và 558 thỏa mãn; 321 không thỏa mãn. Hãy trình bày cách đếm.", correct: "219", modelAnswer: "Vì chữ số đầu không thể là 0, mọi chữ số thuộc 1–9. Có 9 số một chữ số, 45 số hai chữ số và 165 số ba chữ số thỏa mãn. Tổng $9+45+165=219$ số." },
      { type: "essay", topic: "xs", grade: "NC", stem: "Trên bảng ô vuông 4×4, chọn 4 ô sao cho mỗi hàng và mỗi cột có đúng một ô được chọn, đồng thời không chọn ô nào trên đường chéo chính. Có bao nhiêu cách chọn? Hãy trình bày cách đếm.", correct: "9", modelAnswer: "Mỗi cách chọn tương ứng với một hoán vị không có điểm cố định của 4 phần tử. Dùng bù trừ: $4!-4\\cdot3!+6\\cdot2!-4\\cdot1!+1=9$ cách." },
      { type: "essay", topic: "xs", grade: "NC", stem: "Mười điểm được đánh dấu tại các đỉnh của một thập giác đều. Có bao nhiêu cách chọn 4 điểm sao cho không có hai điểm được chọn nào kề nhau trên thập giác? Hãy trình bày cách đếm.", correct: "25", modelAnswer: "Chia theo việc có chọn đỉnh 1 hay không. Không chọn đỉnh 1: có 15 cách chọn 4 đỉnh không kề nhau trên dãy 9 đỉnh. Có chọn đỉnh 1: có 10 cách chọn thêm 3 đỉnh trong dãy 3–9. Tổng $15+10=25$ cách." },
    ],
  },
];
