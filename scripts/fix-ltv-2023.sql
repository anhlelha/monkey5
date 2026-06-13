-- Fix data sai lệch PDF vs DB cho ltv-2023 (năm học 2023-2024). Giữ nguyên title.

-- Q1: hỗn số "5 3/4" và phân số "57/4" bị vỡ
UPDATE Question
SET stem = 'Tìm số tự nhiên $a$, biết: $2 \times a - 5\dfrac{3}{4} = \dfrac{57}{4}$.'
WHERE examId = 'ltv-2023' AND num = 1;

-- Q2: stem mất "2/3", leak "5760dm³"; correct sai 2 → 5760
UPDATE Question
SET stem = 'Tính thể tích bể nước có chiều dài là 2,4m; chiều rộng bằng $\dfrac{2}{3}$ chiều dài và chiều cao là 15dm.',
    correct = '5760',
    unit = 'dm³'
WHERE examId = 'ltv-2023' AND num = 2;

-- Q5: stem phân số vỡ và lặp, correct là rác
UPDATE Question
SET stem = 'Sắp xếp các phân số sau theo thứ tự từ bé đến lớn: $\dfrac{5}{8}; \dfrac{11}{12}; \dfrac{7}{8}; \dfrac{10}{9}$.',
    correct = '5/8; 7/8; 11/12; 10/9'
WHERE examId = 'ltv-2023' AND num = 5;

-- Q6: stem có rác kết câu 5 dính vào
UPDATE Question
SET stem = 'Tìm các số chia hết cho 2 và 5 trong các số sau: 35; 120; 68; 250; 222.'
WHERE examId = 'ltv-2023' AND num = 6;

-- Q9: gán figure (text stem đã OK)
UPDATE Question
SET figure = 'ltv-2023-c9'
WHERE examId = 'ltv-2023' AND num = 9;

-- Q10: stem leak "2 tấn", correct sai 72 → 2 tấn
UPDATE Question
SET stem = 'Nhà bác An thu hoạch được một số thóc, $60\%$ số thóc thu hoạch được bằng 1 tấn 200 kg. Tính số thóc nhà bác An đã thu hoạch được.',
    correct = '2',
    unit = 'tấn'
WHERE examId = 'ltv-2023' AND num = 10;

-- Q13: correct có format space lạ, unit trống
UPDATE Question
SET correct = '113,04',
    unit = 'cm2'
WHERE examId = 'ltv-2023' AND num = 13;

-- Q14: dấu phẩy thập phân tách bậy
UPDATE Question
SET stem = 'Tính: $1{,}2 + 1{,}5 + 1{,}8 + \ldots + 4{,}5 + 4{,}8$.'
WHERE examId = 'ltv-2023' AND num = 14;

-- Q16: stem leak "37 bông hoa" + correct là phần cuối stem
UPDATE Question
SET stem = 'Lớp 5B phát động phong trào "Hoa việc tốt". Bạn Linh quyên góp 2 quyển sách và 3 quyển vở được 16 bông hoa việc tốt. Bạn Trang góp 10 quyển vở có được số bông hoa điểm tốt bằng bạn Việt góp 4 quyển sách. Hỏi Nam góp 5 quyển sách và 6 quyển vở thì được bao nhiêu bông hoa việc tốt?',
    correct = '37',
    unit = 'bông hoa'
WHERE examId = 'ltv-2023' AND num = 16;

-- Q17: stem chèn cả lời giải, correct sai (1 → 6,88 cm²)
UPDATE Question
SET stem = 'Cho hình vuông như sau. Tính diện tích phần tô màu nằm ngoài hình tròn biết đường chéo $AC = 8$ cm.',
    correct = '6,88',
    unit = 'cm2',
    figure = 'ltv-2023-c17'
WHERE examId = 'ltv-2023' AND num = 17;

-- Q18: stem mất "2/5" + "1/3"; leak "80 cây" và lẫn câu 19; correct sai 75 → 80
UPDATE Question
SET stem = 'Lớp 5A trồng cây 3 ngày. Ngày thứ nhất trồng được $\dfrac{2}{5}$ tổng số cây. Ngày thứ hai trồng được 28 cây. Ngày thứ ba trồng được $\dfrac{1}{3}$ số cây đã trồng. Hỏi lớp 5A trồng được tất cả bao nhiêu cây?',
    correct = '80',
    unit = 'cây'
WHERE examId = 'ltv-2023' AND num = 18;

-- Q19: stem thiếu chú thích (giữ nguyên trạng thái que diêm)
UPDATE Question
SET stem = 'Dùng 7 que diêm thì xếp được tối đa bao nhiêu hình tam giác (phải giữ nguyên trạng thái từng que diêm)?'
WHERE examId = 'ltv-2023' AND num = 19;

-- Q20: stem rối + correct là rác "AD 3"; thêm figure
UPDATE Question
SET stem = 'Cho hình chữ nhật ABCD có M là trung điểm AB và điểm N nằm trên cạnh AD. Tính tỉ số $\dfrac{AN}{AD}$ để $S_{CMN} = \dfrac{1}{3} \times S_{ABCD}$.',
    correct = 'AN/AD = 1/3',
    figure = 'ltv-2023-c20'
WHERE examId = 'ltv-2023' AND num = 20;

-- Bonus: gán figure cho ltv-2024 Q14/Q17/Q20 (SVG đã có sẵn nhưng DB chưa link)
UPDATE Question SET figure = 'ltv-2024-c14' WHERE examId = 'ltv-2024' AND num = 14;
UPDATE Question SET figure = 'ltv-2024-c17' WHERE examId = 'ltv-2024' AND num = 17;
UPDATE Question SET figure = 'ltv-2024-c20' WHERE examId = 'ltv-2024' AND num = 20;

-- Bonus: gán figure cho ltv-2025 Q5 và Q12 (SVG có sẵn)
UPDATE Question SET figure = 'ltv-2025-c5' WHERE examId = 'ltv-2025' AND num = 5;
UPDATE Question SET figure = 'ltv-2025-c12' WHERE examId = 'ltv-2025' AND num = 12;
