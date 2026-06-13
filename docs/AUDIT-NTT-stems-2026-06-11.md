# NTT Stems Audit — 2026-06-11

Audit of question stems for all 12 NTT exam years against
`public/ref_exam/Tổng hợp đề thi chính thức vào lớp 6 trường THCS&THPT Nguyễn Tất Thành.pdf`.

## Root-cause fixes (apply to all years)

### 1. Empty essay stems — FIXED
`scripts/seed-all-exams.ts` matched parsed-JSON questions by
`pq.num === q.num`. In metadata, essays have a sequential `num` across the
whole exam (e.g., B1 = num 11), but in `smart_parsed_exams.json` essays are
re-numbered from 1 per section. The join silently dropped every essay stem.

Now matches by exact `pq.id === q.id` first, with the old num-based join as
fallback. **Effect**: 15 essay stems re-populated across NTT 2018-19, 2019-20,
2020-21, 2022-23, 2025-26 (and other schools benefit too — verify before
shipping).

### 2. Per-question point prefix — FIXED
NTT 2024-25 stems all started with `(0,5 điểm)` / `(0,75 điểm)` / `(2 điểm)`.
Added strip pattern to `WATERMARK_PATTERNS_SEED`. **Effect**: 12 stems
cleaned in one pass; pattern also defends future imports.

## Per-question fixes applied

Added to `MANUAL_OVERRIDES` in `scripts/exam-overrides.ts`:

| Question | Issue | Source |
|---|---|---|
| NTT-2022-23-C2 | Truncated to "Hà lấy" | PDF page 15 |
| NTT-2022-23-C6 | Missing fraction 25/41 | PDF page 15 |
| NTT-2022-23-C7 | Answer "1 500 000 đồng" bled into stem | PDF page 15 |
| NTT-2023-24-C2 | Missing fraction 3/5 | PDF page 17 |
| NTT-2023-24-C3 | Missing fraction 2/3 | PDF page 17 |
| NTT-2023-24-C6 | Answer "250 000" bled | PDF page 18 |
| NTT-2023-24-C9 | Missing fraction 5/4 | PDF page 18 |
| NTT-2025-26-C5 | Missing fraction 2/5 | PDF page 22 |
| NTT-2025-26-C7 | Trailing "25cm 5cm 20cm" figure-label bleed; rectangle vs square wording | PDF page 22 |
| NTT-2025-26-C8 | Truncated to "Từ một miếng gỗ có dạng" | PDF page 22 |
| NTT-2025-26-C10 | Answer "240 000 đồng" bled | PDF page 23 |
| NTT-2025-26-C11 | Missing fraction 4/7 | PDF page 23 |

## Batch 2 (added 2026-06-11) — older years cleared

The remaining 19 issues across NTT 2008-09 / 2009-10 / 2010-11 / 2018-19 /
2019-20 / 2020-21 were all restored from PDF pages 3-14 and overridden in
`MANUAL_OVERRIDES`. Coverage:

- **NTT 2008-09**: B2 (product LaTeX), B3 (tile dimensions + price + 2/3 fraction).
- **NTT 2009-10**: B5 (full stem restored with two fractions).
- **NTT 2010-11**: B1 (1/3 and 2/5 tỉ số).
- **NTT 2018-19**: C5, C7, C8, C9, C10 (answer-bleed cleared); B1 (2/5, 1/3, 3/4 fractions restored).
- **NTT 2019-20**: C5 (3/14, 3/4), C6, C7, C8 (2/3), C9 (answer-bleed cleared); B1 (1/3, 6/11).
- **NTT 2020-21**: C3, C4 (1/4, 3/5), C6, C7 (1/2, 2/3), C8 (1/2, 2/3 coefficients), C9; B1 (1/5, 5/11).

## Known unrecoverable

- **NTT-2019-20-C1** — the source PDF itself prints only a placeholder
  ("Là 1 bài về giao thông có hình vẽ. Câu hỏi là Nam gặp biểu tượng nào?").
  Real stem is not in this compilation; correct answer override already set
  to "Siêu thị".
- **NTT-2023-24-B1** — does not exist in this exam year. The 2023-24 PDF
  uses `Câu 9 (2,0 điểm)` for the first essay and `Bài 2` for the second,
  so metadata only carries C9 + B2 (no B1). Confirmed correct.

## Files changed

- `scripts/seed-all-exams.ts` — fix join logic, add point-prefix strip pattern.
- `scripts/exam-overrides.ts` — 12 new stem overrides.
- `prisma/dev.db` — re-seeded.
- `prisma/dev.db.bak-ntt-audit-<ts>` — backup created.

## How to continue

1. Read remaining PDF pages (3-7 for old years, 8-14 for 2018-2020).
2. For each remaining issue above, add a stem override to
   `MANUAL_OVERRIDES` in `scripts/exam-overrides.ts` with pre-formatted
   LaTeX (`$\frac{a}{b}$`, `$x\\%$`, etc.).
3. Re-run `npx tsx scripts/build-exams-metadata.ts && npx tsx scripts/seed-all-exams.ts`.
4. Sanity check with a Prisma dump (delete after).
