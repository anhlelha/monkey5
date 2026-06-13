-- Fix data sai lệch giữa PDF "Tổng hợp đề thi … Lương Thế Vinh" và DB cho ltv-2025
-- Year 2025-2026. Giữ nguyên title theo yêu cầu user.

-- Q1: bổ sung biểu thức bị mất khi parse
UPDATE Question
SET stem = 'Tính giá trị biểu thức: $\dfrac{5}{6} + 3{,}4 + \dfrac{19}{6} - 2{,}4$.'
WHERE examId = 'ltv-2025' AND num = 1;

-- Q2: đáp án đầy đủ là cặp 2 số chẵn liên tiếp
UPDATE Question
SET correct = '100 và 102'
WHERE examId = 'ltv-2025' AND num = 2;

-- Q4: tỉ số phân số 1/5
UPDATE Question
SET correct = '1/5'
WHERE examId = 'ltv-2025' AND num = 4;

-- Q5: bổ sung mô tả 3 hình tam giác (figure bị mất khi parse PDF)
UPDATE Question
SET stem = 'Cho 3 tam giác dưới đây có quy luật giống nhau, tìm số thích hợp thay thế dấu "?".' || char(10) ||
           '- Tam giác 1: đỉnh = 2, ô giữa = 15, hai ô đáy = 6 và 4.' || char(10) ||
           '- Tam giác 2: đỉnh = 3, ô giữa = 18, hai ô đáy = 5 và 7.' || char(10) ||
           '- Tam giác 3: đỉnh = 6, ô giữa = ?, hai ô đáy = 8 và 10.'
WHERE examId = 'ltv-2025' AND num = 5;

-- Q7: đáp án đúng là 32 (800 cm² ÷ 25 cm²), không phải 85
UPDATE Question
SET correct = '32', unit = 'hình'
WHERE examId = 'ltv-2025' AND num = 7;

-- Q10: stem bị lẫn đáp án "6 ngày" + correct sai (86 → 6)
UPDATE Question
SET stem = 'Có một công việc 12 người hoàn thành trong 9 ngày. Hỏi nếu có 18 người thì hoàn thành trong bao nhiêu ngày? (Biết năng suất làm việc của mỗi người là như nhau)',
    correct = '6',
    unit = 'ngày'
WHERE examId = 'ltv-2025' AND num = 10;

-- Q11: stem các phân số bị vỡ + đáp án sai (11 → 7/9)
UPDATE Question
SET stem = 'Cho dãy số: $\dfrac{1}{3}; \dfrac{3}{5}; \dfrac{5}{7}; \ldots; \dfrac{9}{11}$. Tìm số ở dấu "…".',
    correct = '7/9'
WHERE examId = 'ltv-2025' AND num = 11;
