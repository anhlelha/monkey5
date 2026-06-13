import fs from "fs";

function searchContext(file: string, query: string, nLines = 30) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  
  console.log(`\n--- Searching for "${query}" in ${file} ---`);
  let foundCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(query.toLowerCase())) {
      foundCount++;
      console.log(`Match ${foundCount} at line ${i + 1}:`);
      console.log(lines.slice(i, i + nLines).map((l, idx) => `${i + 1 + idx}: ${l}`).join("\n"));
    }
  }
  if (foundCount === 0) {
    console.log("Not found.");
  }
}

const ltvMissing = [
  "Cho ba hình tròn: hình tròn thứ nhất có bán kính bằng 5m", // C15, 2011-12
  "Cho ba khối đồng hình lập phương", // C5, 2013-14
  "Gọi A là diện tích hình tròn có bán kính 10m", // C14, 2013-14
  "Một hình chữ nhật có diện tích 60", // C19, 2013-14
  "Lúc 6 giờ sáng một xe máy", // C9, 2014-15
  "Xếp các hình lập phương nhỏ cạnh 1cm thành một khối hình hộp chữ nhật có chiều", // C19, 2014-15
  "Trên một khối gỗ hình lập phương cạnh 20cm", // C2, 2018-19
  "x + 3,5 = 6,72 + 3, 28", // C5, 2018-19
  "Cho hình vẽ bên. Biết AB = 0,6", // C15, 2020-21
  "Một trường bán trú dự trữ gạo đủ cho 480 học sinh ăn trong 25 ngày", // C9, 2021-22
  "kích thước đo ở trong lòng bể là: dài 2 m, rộng", // C10, 2022-23
  "Có hai cái hộp giống nhau, trong đó hộp A đựng một cái bánh", // C13, 2022-23
  "Dùng 7 que diêm thì xếp được tối đa", // C19, 2023-24
  "Tìm 4 số tự nhiên chẵn liên tiếp có trung bình cộng bằng 27", // C6, 2024-25
  "Mua 3m vải phải trả 45 000", // C9, 2024-25
  "An trả lời 15 câu hỏi, trả lời đúng được 4 điểm", // C3, 2025-26
  "Một bể nước hình hộp chữ nhật có chiều dài là 12m, chiều rộng là 5m, chiều cao 2" // C9, 2025-26
];

const nttMissing = [
  "rời Hà Nội lúc  6 giờ sáng", // C5, 2018-19
  "Nam gặp biểu tượng nào?", // C1, 2019-20
  "Cửa hàng bán một chiếc quạt điện giá 1800000", // C7, 2022-23
  "chữ số hàng đơn vị ít hơn chữ số hàng chục" // C9, 2025-26
];

console.log("=== LTV MISSING ===");
ltvMissing.forEach(q => searchContext("ref_exam/LTV_exam_text.txt", q, 15));

console.log("=== NTT MISSING ===");
nttMissing.forEach(q => searchContext("ref_exam/NTT_exam_text.txt", q, 15));
