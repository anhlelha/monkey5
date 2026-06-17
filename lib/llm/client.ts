// Dependency-free REST clients for the three providers. Each returns the raw
// text completion; callers parse JSON out of it via extractJson().

import type { LLMProvider } from "./types";

const DEFAULT_TIMEOUT_MS = 45_000;

export interface LLMCallArgs {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs?: number;
}

/** A provider/network error with a user-safe message. */
export class LLMError extends Error {}

async function withTimeout(timeoutMs: number): Promise<{ signal: AbortSignal; done: () => void }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "Hết thời gian chờ phản hồi từ AI.";
    return error.message;
  }
  return "Lỗi không xác định khi gọi AI.";
}

/** Call the selected provider and return the raw text response. */
export async function callLLM(args: LLMCallArgs): Promise<string> {
  const { provider, apiKey } = args;
  if (!apiKey) throw new LLMError("Thiếu API key cho nhà cung cấp đã chọn.");
  switch (provider) {
    case "anthropic":
      return callAnthropic(args);
    case "openai":
      return callOpenAI(args);
    case "google":
      return callGoogle(args);
    default: {
      const _exhaustive: never = provider;
      void _exhaustive;
      throw new LLMError("Nhà cung cấp không hợp lệ.");
    }
  }
}

async function callAnthropic(args: LLMCallArgs): Promise<string> {
  const { signal, done } = await withTimeout(args.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": args.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: args.model,
        max_tokens: args.maxTokens,
        system: args.system,
        messages: [{ role: "user", content: args.user }],
      }),
      signal,
    });
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      error?: { message?: string };
    };
    if (!res.ok) throw new LLMError(data.error?.message ?? `Anthropic API lỗi ${res.status}`);
    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!text) throw new LLMError("Anthropic trả về nội dung rỗng.");
    return text;
  } catch (error: unknown) {
    throw error instanceof LLMError ? error : new LLMError(getErrorMessage(error));
  } finally {
    done();
  }
}

async function callOpenAI(args: LLMCallArgs): Promise<string> {
  const { signal, done } = await withTimeout(args.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${args.apiKey}`,
      },
      // No temperature: newer reasoning models only accept the default.
      // max_completion_tokens (not max_tokens) is required by the GPT-5 family.
      body: JSON.stringify({
        model: args.model,
        max_completion_tokens: args.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
      }),
      signal,
    });
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    if (!res.ok) throw new LLMError(data.error?.message ?? `OpenAI API lỗi ${res.status}`);
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new LLMError("OpenAI trả về nội dung rỗng.");
    return text;
  } catch (error: unknown) {
    throw error instanceof LLMError ? error : new LLMError(getErrorMessage(error));
  } finally {
    done();
  }
}

async function callGoogle(args: LLMCallArgs): Promise<string> {
  const { signal, done } = await withTimeout(args.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(args.model)}:generateContent?key=${encodeURIComponent(args.apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: args.system }] },
        contents: [{ role: "user", parts: [{ text: args.user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: args.maxTokens,
        },
      }),
      signal,
    });
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };
    if (!res.ok) throw new LLMError(data.error?.message ?? `Gemini API lỗi ${res.status}`);
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
    if (!text) throw new LLMError("Gemini trả về nội dung rỗng.");
    return text;
  } catch (error: unknown) {
    throw error instanceof LLMError ? error : new LLMError(getErrorMessage(error));
  } finally {
    done();
  }
}

/** Pull the first JSON object out of a model response (handles ``` fences). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new LLMError("AI không trả về JSON hợp lệ.");
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new LLMError("Không phân tích được JSON từ phản hồi AI.");
  }
}
