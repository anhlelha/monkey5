# Vietnamese (Tiếng Việt) Subject — Design

Third subject after Math + English, added by mirroring the English module.
`subject="vietnamese"` throughout. Source taxonomy + difficulty radar: the
"So sánh đề thi Tiếng Việt vào lớp 6" dashboard (Cầu Giấy · Nguyễn Tất Thành ·
Lương Thế Vinh), 10 nhóm chuyên đề + 6-factor độ khó.

## A. Where the code lives

| Concern | File |
|---|---|
| Taxonomy (5 skills, 10 topics, 6 factors, NB/TH/VD levels) | `lib/subjects.ts` (`VIETNAMESE_*`, `SUBJECT_META.vietnamese`, `SUBJECT_LEVELS.vietnamese`) |
| 6-factor difficulty per school | `lib/school-profiles.ts` → `buildVietnameseProfile` (branch on `subject==="vietnamese"`) |
| AI văn grading (5 criteria) | `lib/llm/grade-vietnamese.ts`; rubric/weights in `lib/llm/providers.ts` (`VN_WRITING_*`); branch in `lib/grading/essay-attempt.ts` (`kind:"vietnamese"`) |
| fill grading | reuses `text_set` matcher (`lib/grading/matchers/english/text.ts`) — case/punct-insensitive, **diacritic-preserving** |
| Pages | `app/(app)/vietnamese/{page,topics/page,practice/page,library/page,library/VietnameseLibraryView}.tsx` |
| Topic-set spawn | `lib/spawn-exam.ts` → `spawnVietnameseTopicSet` (ids prefixed `vnset-`) |
| Nav | `components/Sidebar.tsx` (`VIETNAMESE_ITEMS`, `isVietnameseContext`, 3rd subject pill) |
| Content (real exams) | `scripts/vn-exams/*.json` (committed) → `scripts/seed-vietnamese.ts` |
| Import skill | `.claude/commands/exam-import-vn.md` (`/exam-import-vn`) |

No Prisma migration needed: `Exam/Question/Topic.subject` is a free string,
`SchoolProfile` is keyed `[school, subject]`, `Passage` + `EssayGrade.kind/criteria`
are subject-generic.

## B. Taxonomy — 5 skills over 10 topics

- **tungu** (Từ ngữ): `vn-vocab`, `vn-wordform`
- **nguphap** (Ngữ pháp & câu): `vn-syntax`, `vn-senttype`, `vn-cohesion`
- **tuturct** (Tu từ & Chính tả): `vn-rhetoric`, `vn-spelling`
- **dochieu** (Đọc hiểu & cảm thụ): `vn-reading`
- **viet** (Viết): `vn-makesent`, `vn-writing`

Levels = cognitive tiers **NB** (Nhận biết) / **TH** (Thông hiểu) / **VD** (Vận dụng);
band weights {NB 0.3, TH 0.45, VD 0.25}; default `TH`.

## C. 6-factor difficulty radar (weights)

litComprehension .25 · productiveWriting .25 · breadth .20 · higherOrder .15 ·
timePressure .10 · trickiness .05. Auto-computed in `buildVietnameseProfile`
from topics + tags (`camthu`→litComprehension, `vandung`→higherOrder,
`bay`→trickiness, `vn-writing`→productiveWriting, distinct topics→breadth,
questions/minute→timePressure). Data-driven `[Inference]` — may differ from the
dashboard's hand-set estimates.

## D. Question types & grading

- **mcq**: `correct` = letter A/B/C/D (exact option-id match).
- **fill**: `correct` + `accept[]` → `text_set` schema (preserves Vietnamese diacritics; ⚠ never rely on the math `matchExact` fallback — it strips dấu).
- **essay** (đặt câu / cảm thụ / viết đoạn-bài / phân tích): `correct:null`,
  đáp án mẫu → `modelAnswer` (AI key). Graded by `gradeVietnameseSafe` on 5
  criteria: noidung 35 · camthu 25 · dienden 20 · chinhta 10 · sangtao 10
  (defaults). Stored `EssayGrade.kind="vietnamese"`. **Admin-editable** in
  `/admin?tab=llm` → card "Chấm bài viết Tiếng Việt (Văn)" (prompt + 5 trọng số),
  lưu vào `LLMSetting.vnWritingPrompt`/`vnWritingWeights`; null → code defaults
  (`VN_WRITING_*` in `lib/llm/providers.ts`).

## E. Content (real exams, v1)

9 đề thật transcribed into `scripts/vn-exams/` (91 câu): CG 2021/2022/2023/2025,
NTT 2020-21/2021-22/2022-23/2023-24, LTV 2022. Schools reuse ids `cg`/`ntt`/`ltv`
(distinct from math via `SchoolProfile.subject`). **Not original demo content —
real transcriptions** (CG bộ đề theo trí nhớ HS + bổ sung TN per the source note).
