-- Fix data sai lệch giữa PDF và DB cho ltv-2024 (năm học 2024-2025).
-- Giữ nguyên title theo yêu cầu user.

-- Q1: phân số bị vỡ
UPDATE Question
SET stem = 'Tính: $\dfrac{3}{7} + \dfrac{8}{5} + \dfrac{4}{7} - \dfrac{48}{30}$.'
WHERE examId = 'ltv-2024' AND num = 1;

-- Q2: hỗn số "2 3/5" và phân số bị vỡ
UPDATE Question
SET stem = 'Tìm số tự nhiên $a$, biết: $2 \times a - 2\dfrac{3}{5} = \dfrac{47}{5}$.'
WHERE examId = 'ltv-2024' AND num = 2;

-- Q4: dấu phẩy thập phân bị tách thành 2 ký tự $$
UPDATE Question
SET stem = 'Tính: $52{,}39 - 28{,}23 - 21{,}77$.'
WHERE examId = 'ltv-2024' AND num = 4;

-- Q5: mất "4/5" + leak "Số lớn: 1105" vào stem + correct chỉ có "Số bé"
UPDATE Question
SET stem = 'Tìm hai số tự nhiên có tổng là 1989 và tỉ số của hai số đó bằng $\dfrac{4}{5}$.',
    correct = 'Số lớn: 1105; Số bé: 884'
WHERE examId = 'ltv-2024' AND num = 5;

-- Q7: stem mất "3/8" + scramble + correct là rác chữ
UPDATE Question
SET stem = 'Một lớp học có 32 học sinh, trong đó số học sinh nam chiếm $\dfrac{3}{8}$ số học sinh của lớp. Hỏi lớp đó có bao nhiêu học sinh nữ?',
    correct = '20',
    unit = 'học sinh nữ'
WHERE examId = 'ltv-2024' AND num = 7;

-- Q9: stem leak "82 500 đồng"
UPDATE Question
SET stem = 'Mua 3m vải phải trả 45 000 đồng. Hỏi nếu mua 8,5m vải cùng loại thì phải trả nhiều hơn bao nhiêu tiền?'
WHERE examId = 'ltv-2024' AND num = 9;

-- Q10: LaTeX vỡ ($ki-l$ô-gam)
UPDATE Question
SET stem = '1 tấn 3 tạ bằng bao nhiêu ki-lô-gam?'
WHERE examId = 'ltv-2024' AND num = 10;

-- Q11: stem mất "3/4", leak "1,2m"; correct sai 3 → 1,2 m
UPDATE Question
SET stem = 'Một bể bơi dạng hình hộp chữ nhật có chiều dài 20,5m, chiều rộng 16,2m. Nếu bể chứa 298,89m³ nước thì mực nước trong bể lên tới $\dfrac{3}{4}$ chiều cao của bể. Hỏi chiều cao của bể là bao nhiêu mét?',
    correct = '1,2',
    unit = 'm'
WHERE examId = 'ltv-2024' AND num = 11;

-- Q12: stem leak "6 công nhân"; correct sai 79 → 6
UPDATE Question
SET stem = 'Để làm xong một đoạn đường trong 12 ngày thì cần 18 công nhân. Hỏi nếu muốn làm xong đoạn đường đó trong 9 ngày thì cần phải bổ sung thêm bao nhiêu công nhân? (Coi năng suất của mỗi công nhân là như nhau)',
    correct = '6',
    unit = 'công nhân'
WHERE examId = 'ltv-2024' AND num = 12;

-- Q13: stem leak "Mẹ 34 tuổi"; correct thiếu vế mẹ
UPDATE Question
SET stem = 'Tính tuổi của mẹ và con hiện nay, biết rằng hai năm trước tuổi mẹ gấp 8 lần tuổi con và hai năm sau tổng số tuổi của hai mẹ con là 44 tuổi.',
    correct = 'Mẹ 34 tuổi; Con 6 tuổi'
WHERE examId = 'ltv-2024' AND num = 13;

-- Q18: stem leak "4100 hoặc"; correct thiếu vế đầu
UPDATE Question
SET stem = 'Tìm số tự nhiên có bốn chữ số, biết rằng nếu xoá chữ số hàng chục và chữ số hàng đơn vị thì được số mới giảm 4059 đơn vị.',
    correct = '4100 hoặc 4099'
WHERE examId = 'ltv-2024' AND num = 18;

-- Q19: stem leak "9 000 đồng" + correct sai 82 → 9000 đồng
UPDATE Question
SET stem = 'Trong ngày Tết sẻ chia, khối lớp 6 trường Lương Thế Vinh đã mở một gian hàng bán xúc xích lấy tiền ủng hộ các bạn có hoàn cảnh khó khăn. Buổi sáng bán với giá 10 000 đồng một cái, buổi chiều hạ giá nên số xúc xích bán được tăng thêm $25\%$ và số tiền thu được tăng thêm $12{,}5\%$ so với buổi sáng. Hỏi sau khi hạ giá, mỗi cái xúc xích có giá bao nhiêu tiền?',
    correct = '9000',
    unit = 'đồng'
WHERE examId = 'ltv-2024' AND num = 19;
