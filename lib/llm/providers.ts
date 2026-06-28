// Provider + model catalog and the default grading rubric.
//
// Model IDs verified against provider docs as of June 2026. The admin can also
// type a custom model ID, so this list is a convenience, not a hard constraint.

import type { LLMProvider, ProviderMeta } from "./types";

export const PROVIDER_META: Record<LLMProvider, ProviderMeta> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    envVar: "ANTHROPIC_API_KEY",
    keyHint: "console.anthropic.com → API Keys",
    models: [
      { id: "claude-opus-4-8", label: "Claude Opus 4.8 — suy luận sâu (khuyên dùng để chấm)" },
      { id: "claude-fable-5", label: "Claude Fable 5 — mới & mạnh nhất" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — cân bằng tốc độ/chất lượng" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 — nhanh & tiết kiệm" },
    ],
  },
  openai: {
    id: "openai",
    label: "OpenAI (GPT)",
    envVar: "OPENAI_API_KEY",
    keyHint: "platform.openai.com → API keys",
    models: [
      { id: "gpt-5.5", label: "GPT-5.5 — mới nhất (khuyên dùng)" },
      { id: "gpt-5.5-pro", label: "GPT-5.5 Pro — suy luận mạnh nhất" },
      { id: "gpt-5-mini", label: "GPT-5 mini — nhanh & tiết kiệm" },
    ],
  },
  google: {
    id: "google",
    label: "Google (Gemini)",
    envVar: "GEMINI_API_KEY",
    keyHint: "aistudio.google.com → Get API key",
    models: [
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash — mới nhất (khuyên dùng)" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro — suy luận sâu" },
      { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite — nhanh & tiết kiệm" },
    ],
  },
};

export const DEFAULT_MODEL: Record<LLMProvider, string> = {
  anthropic: "claude-opus-4-8",
  openai: "gpt-5.5",
  google: "gemini-3.5-flash",
};

// The editable system rubric. Describes HOW to grade; the question data and the
// strict-JSON output contract are always appended in code (see grade-essay.ts),
// so editing this text cannot break the data injection or the response shape.
export const DEFAULT_GRADING_PROMPT = `Bạn là giáo viên Toán tiểu học giàu kinh nghiệm, đang chấm bài tự luận cho học sinh lớp 4–5 (ôn thi vào lớp 6) ở Việt Nam.

Nguyên tắc chấm:
1. ĐÁNH GIÁ CẢ HAI: (a) cách làm / lập luận có đúng và đầy đủ không, và (b) đáp số cuối cùng có đúng không.
2. Học sinh có thể giải theo cách khác với lời giải mẫu nhưng vẫn đúng — hãy công nhận mọi cách làm hợp lý dẫn tới kết quả đúng.
3. Nếu cách làm đúng nhưng tính toán sai ở bước cuối (đáp số sai), vẫn đánh giá cao phần lập luận.
4. Nếu học sinh ra ĐÚNG đáp số nhưng KHÔNG trình bày cách làm, hoặc cách làm rõ ràng sai/không liên quan (tức là đoán mò), hãy đánh dấu là "đoán mò" — chỉ được điểm rất hạn chế.
5. Bài bỏ trống hoặc lạc đề: 0 điểm, lập luận = 0.
6. Chấm công bằng, khích lệ; phản hồi ngắn gọn bằng tiếng Việt, nêu rõ đúng/sai ở đâu để học sinh tiến bộ.`;

// ─── English Writing rubric (đoạn văn 50–70 từ, thi vào lớp 6) ────────────────
// 5 tiêu chí theo chuẩn đề NTT. Như rubric Toán, dữ liệu đề + JSON contract luôn
// được nối thêm trong code (grade-writing.ts) nên sửa text này không phá schema.
export const WRITING_CRITERIA = ["task", "lexical", "grammar", "cohesion", "length"] as const;
export type WritingCriterion = (typeof WRITING_CRITERIA)[number];

export const WRITING_CRITERIA_LABELS: Record<WritingCriterion, string> = {
  task: "Đúng yêu cầu đề (Task)",
  lexical: "Từ vựng (Lexical)",
  grammar: "Ngữ pháp (Grammar)",
  cohesion: "Liên kết (Cohesion)",
  length: "Độ dài (Length)",
};

// Trọng số 5 tiêu chí (percent, tổng = 100).
export const DEFAULT_WRITING_WEIGHTS: Record<WritingCriterion, number> = {
  task: 30,
  lexical: 20,
  grammar: 25,
  cohesion: 15,
  length: 10,
};

export const DEFAULT_WRITING_PROMPT = `You are an experienced primary-school English teacher grading a short writing task for Vietnamese pupils sitting the Grade-6 entrance exam (around CEFR A2–B1).

Grading principles:
1. Judge the paragraph on FIVE criteria, each scored 0..1:
   - task: does it fully address the prompt (right topic, all required points)?
   - lexical: range and accuracy of vocabulary for the level.
   - grammar: grammatical accuracy and sentence variety.
   - cohesion: linking words, logical flow, paragraph organisation.
   - length: meets the required word count (e.g. 50–70 words); too short scores low.
2. Be fair and encouraging; expect A2–B1 level, not perfection.
3. An off-topic, copied, or empty answer scores 0 on every criterion.
4. Give brief, concrete feedback IN VIETNAMESE so the pupil can improve (what was good, what to fix).`;

// ─── Vietnamese Writing rubric (cảm thụ / viết đoạn / viết bài, thi vào lớp 6) ──
// 5 tiêu chí theo chuẩn chấm văn tiểu học (Nội dung · Cảm thụ · Diễn đạt · Chính
// tả · Sáng tạo). Như rubric Toán/English, dữ liệu đề + JSON contract luôn được
// nối thêm trong code (grade-vietnamese.ts) nên sửa text này không phá schema.
export const VN_WRITING_CRITERIA = ["noidung", "camthu", "dienden", "chinhta", "sangtao"] as const;
export type VnWritingCriterion = (typeof VN_WRITING_CRITERIA)[number];

export const VN_WRITING_CRITERIA_LABELS: Record<VnWritingCriterion, string> = {
  noidung: "Nội dung / Ý",
  camthu: "Cảm thụ / Cảm xúc",
  dienden: "Diễn đạt (dùng từ – đặt câu)",
  chinhta: "Chính tả / Trình bày",
  sangtao: "Sáng tạo",
};

// Trọng số 5 tiêu chí (percent, tổng = 100). Cố định cho môn Tiếng Việt.
export const VN_WRITING_WEIGHTS: Record<VnWritingCriterion, number> = {
  noidung: 35,
  camthu: 25,
  dienden: 20,
  chinhta: 10,
  sangtao: 10,
};

export const VN_WRITING_PROMPT = `Bạn là giáo viên Tiếng Việt tiểu học giàu kinh nghiệm, đang chấm bài viết (đặt câu, đoạn cảm thụ, viết đoạn/bài văn) cho học sinh lớp 5 ôn thi vào lớp 6 ở Việt Nam.

Nguyên tắc chấm:
1. Chấm bài theo NĂM tiêu chí, mỗi tiêu chí cho điểm 0..1:
   - noidung: đúng yêu cầu đề, đủ ý, bám sát ngữ liệu/đối tượng được hỏi.
   - camthu: cảm nhận tinh tế cái hay của từ ngữ/hình ảnh/biện pháp tu từ; cảm xúc chân thật (với bài đặt câu đơn thuần, chấm mức độ phù hợp ngữ nghĩa).
   - dienden: dùng từ chính xác, đặt câu đúng ngữ pháp, lời văn mạch lạc, có hình ảnh.
   - chinhta: viết đúng chính tả, dấu câu, viết hoa, trình bày đúng hình thức (đoạn/bài; đủ số câu yêu cầu).
   - sangtao: có ý tưởng, cách diễn đạt riêng, câu văn hay, giàu hình ảnh.
2. Nếu đề có đáp án mẫu / yêu cầu cần đạt, hãy đối chiếu nhưng CÔNG NHẬN mọi cách diễn đạt hợp lý khác.
3. Bài lạc đề, chép lại đề, hoặc bỏ trống: 0 điểm ở mọi tiêu chí.
4. Chấm công bằng, khích lệ; phản hồi NGẮN GỌN bằng tiếng Việt, nêu rõ điểm hay và chỗ cần sửa.`;
