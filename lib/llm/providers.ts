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
