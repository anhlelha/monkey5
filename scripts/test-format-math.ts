function formatMathText(text: string): string {
  // Normalize double spaces
  text = text.replace(/\s+/g, " ");

  // 1. Subscripts like S_ABC or V_ABCD
  text = text.replace(/\b([SV])_([A-Z]{2,})\b/g, "$$$1_{$2}$");
  
  // 2. Fractions like 1/2, 3/14 (excluding dates like 1/6)
  text = text.replace(/(?<!ngày\s+|tháng\s+)\b(\d+)\/(\d+)\b/gi, "$$\\frac{$1}{$2}$");

  // 3. Ratio like 1:20000 or 4:7 (digits only)
  text = text.replace(/(?<!\$)\b(\d+)\s*:\s*(\d+)\b(?!\$)/g, "$$$1:$2$$");

  // 4. Standalone percentages like 20% or 12,5% (only if not already wrapped in $)
  text = text.replace(/(?<!\$)\b(\d+(?:[.,]\d+)?)\s*%(?!\$)/g, "$$$1\\%$$");

  // 5. Match math equations/expressions (operators: +, -, ×, ÷, =, <, >)
  const equationRegex = /\b[a-zA-Z\d]+(?:[.,][a-zA-Z\d]+)?(?:\s*[+\-×÷=<>\s]*[+\-×÷=<>]+\s*[a-zA-Z\d]+(?:[.,][a-zA-Z\d]+)?)+\b/gi;
  
  text = text.replace(equationRegex, (match) => {
    // Skip if it contains no math operators or digits
    if (!/[0-9+\-×÷=<>]/g.test(match)) return match;
    // Skip if it's already wrapped in $
    if (match.startsWith("$") && match.endsWith("$")) return match;
    
    // Format variables nicely (e.g. AB -> \text{AB})
    let formatted = match
      .replace(/\b([A-Z]{2,})\b/g, "\\text{$1}")
      .replace(/\b([xyab])\b/g, "$1");
      
    return `$${formatted}$`;
  });

  // 6. Format math variables in simple contexts:
  // e.g. "Tìm x" or "Tìm số tự nhiên a"
  text = text.replace(/\b(tìm\s+)([xyab])\b/gi, "$1$$$2$$");

  return text;
}

const samples = [
  "Một lớp học có 32 học sinh, trong đó số học sinh nam chiếm 3/8 số học sinh của lớp. Hỏi lớp đó có bao nhiêu học sinh nữ?",
  "An viết một số bằng 3/14 của số M nhưng do sơ suất nên An đã viết 3/4 của số M. Biết hiệu của số mới và số cũ bằng 150.",
  "Biết AB = 0,6dm, BC = 4cm. Tính diện tích phần tô đậm.",
  "Một thửa ruộng hình chữ nhật có chu vi là 140m. Tính diện tích S_ABCD.",
  "Tỉ số phần trạng người thích bánh cuốn: 100% - (25% + 43% + 18%) = 14%.",
  "Tìm x, biết x + 3,5 = 10.",
  "Thể tích của bể nước đó là: 12 × 5 × 2,2 = 132 m3.",
  "Trên bản đồ có tỉ lệ 1:20000, quãng đường dài 4cm."
];

samples.forEach(s => {
  console.log("Original:", s);
  console.log("Formatted:", formatMathText(s));
  console.log("-----------------------------------");
});
