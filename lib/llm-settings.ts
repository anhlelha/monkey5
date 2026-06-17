// Persistence + resolution for the AI essay-grading config (LLMSetting singleton).

import { prisma } from "@/lib/prisma";
import { DEFAULT_GRADING_PROMPT, DEFAULT_MODEL, PROVIDER_META } from "@/lib/llm/providers";
import { isLLMProvider, type LLMProvider, type ResolvedLLMSettings } from "@/lib/llm/types";

const SINGLETON_ID = "singleton";

export interface LLMSettingsRow {
  enabled: boolean;
  provider: LLMProvider;
  model: string;
  apiKey: string | null;
  gradingPrompt: string | null;
  methodWeight: number;
  answerWeight: number;
  guessCredit: number;
  maxTokens: number;
}

/** Shape sent to the admin client — the raw key is never exposed. */
export interface PublicLLMSettings {
  enabled: boolean;
  provider: LLMProvider;
  model: string;
  gradingPrompt: string;
  methodWeight: number;
  answerWeight: number;
  guessCredit: number;
  maxTokens: number;
  /** True if a key is stored in the DB. */
  hasStoredKey: boolean;
  /** True if the provider's env var is set (fallback key). */
  hasEnvKey: boolean;
}

const DEFAULTS: LLMSettingsRow = {
  enabled: false,
  provider: "anthropic",
  model: "claude-opus-4-8",
  apiKey: null,
  gradingPrompt: null,
  methodWeight: 70,
  answerWeight: 30,
  guessCredit: 20,
  maxTokens: 1024,
};

async function readRow(): Promise<LLMSettingsRow> {
  const row = await prisma.lLMSetting.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return { ...DEFAULTS };
  return {
    enabled: row.enabled,
    provider: isLLMProvider(row.provider) ? row.provider : DEFAULTS.provider,
    model: row.model,
    apiKey: row.apiKey,
    gradingPrompt: row.gradingPrompt,
    methodWeight: row.methodWeight,
    answerWeight: row.answerWeight,
    guessCredit: row.guessCredit,
    maxTokens: row.maxTokens,
  };
}

function envKeyFor(provider: LLMProvider): string {
  return (process.env[PROVIDER_META[provider].envVar] ?? "").trim();
}

/** Admin view: settings with key presence flags but never the key itself. */
export async function getPublicLLMSettings(): Promise<PublicLLMSettings> {
  const row = await readRow();
  return {
    enabled: row.enabled,
    provider: row.provider,
    model: row.model,
    gradingPrompt: row.gradingPrompt ?? DEFAULT_GRADING_PROMPT,
    methodWeight: row.methodWeight,
    answerWeight: row.answerWeight,
    guessCredit: row.guessCredit,
    maxTokens: row.maxTokens,
    hasStoredKey: Boolean(row.apiKey && row.apiKey.length > 0),
    hasEnvKey: envKeyFor(row.provider).length > 0,
  };
}

export interface SaveLLMInput {
  enabled: boolean;
  provider: LLMProvider;
  model: string;
  /** undefined → keep existing key; "" → clear stored key; string → set new key. */
  apiKey?: string;
  gradingPrompt: string;
  methodWeight: number;
  answerWeight: number;
  guessCredit: number;
  maxTokens: number;
}

export async function saveLLMSettings(input: SaveLLMInput): Promise<PublicLLMSettings> {
  // gradingPrompt equal to the built-in default is stored as null (stay in sync
  // with future default changes); a custom prompt is stored verbatim.
  const promptToStore =
    input.gradingPrompt.trim() === DEFAULT_GRADING_PROMPT.trim() || input.gradingPrompt.trim() === ""
      ? null
      : input.gradingPrompt;

  const base = {
    enabled: input.enabled,
    provider: input.provider,
    model: input.model.trim() || DEFAULT_MODEL[input.provider],
    gradingPrompt: promptToStore,
    methodWeight: input.methodWeight,
    answerWeight: input.answerWeight,
    guessCredit: input.guessCredit,
    maxTokens: input.maxTokens,
  };

  // Only touch apiKey when the caller explicitly provided one.
  const keyPatch =
    input.apiKey === undefined ? {} : { apiKey: input.apiKey.trim() === "" ? null : input.apiKey.trim() };

  await prisma.lLMSetting.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...base, ...keyPatch },
    update: { ...base, ...keyPatch },
  });

  return getPublicLLMSettings();
}

/** True when AI grading is on and a usable key exists (db or env). */
export async function isLLMGradingEnabled(): Promise<boolean> {
  const row = await readRow();
  if (!row.enabled) return false;
  const key = (row.apiKey?.trim() || envKeyFor(row.provider)).trim();
  return key.length > 0;
}

/**
 * Resolve the full settings the grader needs, with the API key pulled from the
 * DB first, then the provider's env var. Returns null when disabled or keyless.
 */
export async function getResolvedLLMSettings(): Promise<ResolvedLLMSettings | null> {
  const row = await readRow();
  if (!row.enabled) return null;
  const apiKey = (row.apiKey?.trim() || envKeyFor(row.provider)).trim();
  if (!apiKey) return null;
  return {
    enabled: true,
    provider: row.provider,
    model: row.model || DEFAULT_MODEL[row.provider],
    apiKey,
    gradingPrompt: row.gradingPrompt ?? DEFAULT_GRADING_PROMPT,
    methodWeight: row.methodWeight,
    answerWeight: row.answerWeight,
    guessCredit: row.guessCredit,
    maxTokens: row.maxTokens,
  };
}

/**
 * Resolve settings for a one-off test/regrade using an explicit provider/model/
 * key override (e.g. the admin's "test connection" form before saving).
 */
export async function resolveForTest(override: {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
}): Promise<ResolvedLLMSettings | null> {
  const row = await readRow();
  const apiKey = (
    (override.apiKey && override.apiKey.trim()) ||
    row.apiKey?.trim() ||
    envKeyFor(override.provider)
  ).trim();
  if (!apiKey) return null;
  return {
    enabled: true,
    provider: override.provider,
    model: override.model.trim() || DEFAULT_MODEL[override.provider],
    apiKey,
    gradingPrompt: row.gradingPrompt ?? DEFAULT_GRADING_PROMPT,
    methodWeight: row.methodWeight,
    answerWeight: row.answerWeight,
    guessCredit: row.guessCredit,
    maxTokens: row.maxTokens,
  };
}
