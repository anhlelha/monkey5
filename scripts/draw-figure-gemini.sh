#!/usr/bin/env bash
# draw-figure-gemini.sh
#
# Delegate figure SVG generation to Gemini CLI.
#
# Pipeline:
#   1. Render the requested PDF page to PNG (via ImageMagick).
#   2. Optionally crop to the figure region.
#   3. Call `gemini` headless with the PNG + a strict prompt that returns ONLY
#      a <svg>…</svg> block following Monkey5 style conventions.
#   4. Validate output and write to scripts/.gemini-figure-out/<figure-id>.svg.
#
# The caller (Claude slash command) is responsible for:
#   - Reviewing the SVG visually.
#   - Inserting it into components/ExamFigure.tsx as a new `case` block.
#   - Registering the figure ID in IMPLEMENTED_FIGURES + override map.
#
# Usage:
#   scripts/draw-figure-gemini.sh \
#     --pdf "public/ref_exam/<TenPdf>.pdf" \
#     --page 22 \
#     --figure-id ltv-2020-c20 \
#     --description "Tam giác ABC với cevian, M là trung điểm BC, …"
#
# Optional:
#   --crop WxH+X+Y      ImageMagick crop spec (px @ density 200), tránh
#                       Gemini đọc nhầm watermark / câu kế bên.
#   --model NAME        Default: gemini-2.5-flash
#   --keep-png          Giữ PNG sau khi xong (mặc định xoá)
#   --out-dir DIR       Default: scripts/.gemini-figure-out

set -euo pipefail

PDF=""
PAGE=""
FIGURE_ID=""
DESCRIPTION=""
CROP=""
MODEL="gemini-2.5-flash-lite"   # free tier 1500 RPD; đổi --model nếu muốn 3.5/2.5-flash
KEEP_PNG=0
OUT_DIR="scripts/.gemini-figure-out"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pdf) PDF="$2"; shift 2;;
    --page) PAGE="$2"; shift 2;;
    --figure-id) FIGURE_ID="$2"; shift 2;;
    --description) DESCRIPTION="$2"; shift 2;;
    --crop) CROP="$2"; shift 2;;
    --model) MODEL="$2"; shift 2;;
    --keep-png) KEEP_PNG=1; shift;;
    --out-dir) OUT_DIR="$2"; shift 2;;
    -h|--help) sed -n '1,40p' "$0"; exit 0;;
    *) echo "Unknown arg: $1" >&2; exit 2;;
  esac
done

for var in PDF PAGE FIGURE_ID DESCRIPTION; do
  if [[ -z "${!var}" ]]; then
    echo "ERROR: missing --${var,,}" >&2
    exit 2
  fi
done

if ! command -v gemini >/dev/null 2>&1; then
  if [[ -x "$HOME/.npm-global/bin/gemini" ]]; then
    export PATH="$HOME/.npm-global/bin:$PATH"
  else
    echo "ERROR: 'gemini' not in PATH. Install: npm i -g @google/gemini-cli" >&2
    exit 3
  fi
fi

# Prefer poppler's pdftoppm (faster, no Ghostscript needed). Fall back to
# ImageMagick if pdftoppm not present.
PDFTOPPM=""
MAGICK=""
if command -v pdftoppm >/dev/null 2>&1; then
  PDFTOPPM="$(command -v pdftoppm)"
elif [[ -x "/opt/homebrew/bin/pdftoppm" ]]; then
  PDFTOPPM="/opt/homebrew/bin/pdftoppm"
fi
if [[ -z "$PDFTOPPM" ]]; then
  if [[ -x "/opt/homebrew/bin/magick" ]]; then
    MAGICK="/opt/homebrew/bin/magick"
  elif command -v magick >/dev/null 2>&1; then
    MAGICK="$(command -v magick)"
  else
    echo "ERROR: cần 'pdftoppm' (brew install poppler) HOẶC 'magick' + 'gs' (brew install imagemagick ghostscript)." >&2
    exit 3
  fi
fi

mkdir -p "$OUT_DIR"
PNG_TMP="$OUT_DIR/$FIGURE_ID.src.png"
SVG_OUT="$OUT_DIR/$FIGURE_ID.svg"

echo "→ Render PDF p.$PAGE -> $PNG_TMP"
if [[ -n "$PDFTOPPM" ]]; then
  # pdftoppm 1-indexed; output goes to <prefix>-NN.png
  TMP_PREFIX="$OUT_DIR/$FIGURE_ID.src"
  "$PDFTOPPM" -png -r 200 -f "$PAGE" -l "$PAGE" "$PDF" "$TMP_PREFIX"
  GENERATED="$(ls -t "${TMP_PREFIX}"-*.png 2>/dev/null | head -n1 || true)"
  if [[ -z "$GENERATED" || ! -f "$GENERATED" ]]; then
    echo "ERROR: pdftoppm không sinh file PNG." >&2
    exit 3
  fi
  mv "$GENERATED" "$PNG_TMP"
else
  # ImageMagick path (legacy)
  "$MAGICK" -density 200 "${PDF}[$((PAGE - 1))]" -background white -alpha remove "$PNG_TMP"
fi

if [[ -n "$CROP" ]]; then
  echo "→ Crop $CROP"
  if [[ -x "/opt/homebrew/bin/magick" ]] || command -v magick >/dev/null 2>&1; then
    MAGICK_BIN="${MAGICK:-$(command -v magick)}"
    "$MAGICK_BIN" "$PNG_TMP" -crop "$CROP" +repage "$PNG_TMP"
  else
    echo "⚠ Bỏ qua crop: cần 'magick' để cắt ảnh." >&2
  fi
fi

PROMPT_FILE="$OUT_DIR/$FIGURE_ID.prompt.txt"
cat > "$PROMPT_FILE" <<EOF
Bạn là trợ lý chuyển hình minh hoạ trong đề toán tiểu học thành SVG cho ứng
dụng web Monkey5.

NHIỆM VỤ: Nhìn hình đính kèm và sinh ra MỘT KHỐI SVG duy nhất.

BỐI CẢNH: $DESCRIPTION

YÊU CẦU NGHIÊM NGẶT:
1. Output CHỈ chứa khối <svg>…</svg>, không có markdown fence, không giải
   thích, không comment thêm bên ngoài thẻ SVG.
2. Bọc gì cũng được nhưng phần SVG phải:
   - Có thuộc tính \`viewBox="0 0 W H"\` rõ ràng (chọn W, H phù hợp tỉ lệ hình).
   - Không có thuộc tính width/height tuyệt đối ở phần tử gốc (sẽ wrap bên ngoài).
3. Style chuẩn Monkey5:
   - Đường kẻ: \`stroke="var(--ink)"\`, \`strokeWidth="1.5"\`, \`fill="none"\`
     (trừ vùng tô có yêu cầu).
   - Điểm/đỉnh được đánh dấu: \`<circle r="4" fill="orange" stroke="orange"/>\`.
   - Chữ nhãn: \`<text fill="var(--ink)" fontSize="16" fontStyle="italic" fontFamily="Times,serif">…</text>\`.
   - KHÔNG dùng \`fill="black"\`, \`stroke="black"\`, hex màu cứng; chỉ dùng
     \`var(--ink)\`, \`orange\`, \`white\`.
4. Nếu hình có ký hiệu đoạn bằng nhau (gạch ngang nhỏ giữa cạnh), vẽ chúng
   bằng \`<line>\` ngắn vuông góc với cạnh.
5. Nếu là grid ô vuông, dùng tọa độ đều bước (vd 30px / ô); đảm bảo đường lưới
   thẳng, không lệch.
6. Nếu hình có vùng cong (cung tròn, bán nguyệt), dùng path \`A rx,ry 0 0 1 x,y\`.
   Nếu có vùng tô cong vượt khung, dùng \`<clipPath>\`.
7. KHÔNG vẽ watermark, số trang, hay text đề bài bao quanh.

ĐẦU RA mẫu (chỉ minh hoạ format, không phải nội dung):
<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
  <line x1="..." y1="..." x2="..." y2="..." stroke="var(--ink)" stroke-width="1.5"/>
  <circle cx="..." cy="..." r="4" fill="orange" stroke="orange"/>
  <text x="..." y="..." fill="var(--ink)" font-size="16" font-style="italic" font-family="Times,serif">A</text>
</svg>

Bắt đầu — chỉ output khối <svg>…</svg>:
EOF

echo "→ Gọi Gemini ($MODEL)"
RAW_OUT="$OUT_DIR/$FIGURE_ID.raw.txt"
# Headless gemini cần trust workspace; nếu đã set ngoài thì giữ nguyên.
export GEMINI_CLI_TRUST_WORKSPACE="${GEMINI_CLI_TRUST_WORKSPACE:-true}"
# Gemini CLI attach file qua "@path" trong prompt (KHÔNG phải qua -i, vì -i là
# interactive mode). Ta append @<png-tmp> vào cuối prompt.
PROMPT_WITH_IMAGE="$(cat "$PROMPT_FILE")

Hình đính kèm: @$PNG_TMP"
# --approval-mode plan: read-only. Block model gọi WebSearch / Shell / Edit …
# (mỗi tool call sẽ là 1 request riêng → đốt quota rất nhanh trên free tier).
if ! gemini -m "$MODEL" --approval-mode plan -p "$PROMPT_WITH_IMAGE" --output-format text > "$RAW_OUT" 2>&1; then
  echo "ERROR: gemini call failed. See $RAW_OUT" >&2
  cat "$RAW_OUT" >&2
  exit 4
fi

# Extract <svg>…</svg> block
python3 - <<PY
import re, sys, pathlib
raw = pathlib.Path("$RAW_OUT").read_text(encoding="utf-8")
m = re.search(r"<svg[\s\S]*?</svg>", raw, re.IGNORECASE)
if not m:
    print("ERROR: no <svg> block found in Gemini output.", file=sys.stderr)
    print("--- raw ---", file=sys.stderr)
    print(raw, file=sys.stderr)
    sys.exit(5)
pathlib.Path("$SVG_OUT").write_text(m.group(0), encoding="utf-8")
print(f"OK: wrote $SVG_OUT ({len(m.group(0))} bytes)")
PY

if [[ "$KEEP_PNG" -ne 1 ]]; then
  rm -f "$PNG_TMP"
fi

echo ""
echo "✓ Done. Next steps for Claude:"
echo "  1. Read $SVG_OUT and review visually."
echo "  2. Add case \"$FIGURE_ID\" to components/ExamFigure.tsx with the SVG."
echo "  3. Add \"$FIGURE_ID\" to IMPLEMENTED_FIGURES in:"
echo "       - app/(app)/admin/qa-constants.ts"
echo "       - scripts/audit-questions.ts"
echo "  4. Add figure: \"$FIGURE_ID\" to the question's override entry."
echo "  5. Run: npx tsc --noEmit"
