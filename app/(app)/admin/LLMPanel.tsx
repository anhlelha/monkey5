"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { saveLLMSettingsAction, testLLMConnection } from "./actions";
import { PROVIDER_META, DEFAULT_GRADING_PROMPT } from "@/lib/llm/providers";
import type { LLMProvider } from "@/lib/llm/types";
import type { PublicLLMSettings } from "@/lib/llm-settings";

interface Props {
  initial: PublicLLMSettings;
}

export function LLMPanel({ initial }: Props) {
  const [enabled, setEnabled] = useState<boolean>(initial.enabled);
  const [provider, setProvider] = useState<LLMProvider>(initial.provider);
  const [model, setModel] = useState<string>(initial.model);
  const [customModel, setCustomModel] = useState<boolean>(false);
  const [gradingPrompt, setGradingPrompt] = useState<string>(initial.gradingPrompt);
  const [methodWeight, setMethodWeight] = useState<number>(initial.methodWeight);
  const [answerWeight, setAnswerWeight] = useState<number>(initial.answerWeight);
  const [guessCredit, setGuessCredit] = useState<number>(initial.guessCredit);
  const [maxTokens, setMaxTokens] = useState<number>(initial.maxTokens);

  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [latestSettings, setLatestSettings] = useState<PublicLLMSettings>(initial);

  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const [testPending, startTestTransition] = useTransition();
  const [testStatus, setTestStatus] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  const handleProviderChange = (p: LLMProvider) => {
    setProvider(p);
    const firstModel = PROVIDER_META[p].models[0].id;
    setModel(firstModel);
    setCustomModel(false);
  };

  const isModelInList = (p: LLMProvider, m: string) =>
    PROVIDER_META[p].models.some((opt) => opt.id === m);

  const handleModelSelectChange = (value: string) => {
    if (value === "__custom__") {
      setCustomModel(true);
      setModel("");
    } else {
      setCustomModel(false);
      setModel(value);
    }
  };

  const selectValue = customModel || !isModelInList(provider, model) ? "__custom__" : model;

  const onTestConnection = () => {
    setTestStatus(null);
    startTestTransition(async () => {
      try {
        const result = await testLLMConnection({
          provider,
          model,
          apiKey: apiKeyInput || undefined,
        });
        setTestStatus({ tone: result.ok ? "ok" : "err", msg: result.message });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Không thể kiểm tra kết nối.";
        setTestStatus({ tone: "err", msg });
      }
    });
  };

  const onSave = () => {
    setStatus(null);
    const payload: {
      enabled: boolean;
      provider: LLMProvider;
      model: string;
      apiKey?: string;
      gradingPrompt: string;
      methodWeight: number;
      answerWeight: number;
      guessCredit: number;
      maxTokens: number;
    } = {
      enabled,
      provider,
      model,
      gradingPrompt,
      methodWeight,
      answerWeight,
      guessCredit,
      maxTokens,
    };
    if (apiKeyInput.trim() !== "") {
      payload.apiKey = apiKeyInput.trim();
    }
    startTransition(async () => {
      try {
        const updated = await saveLLMSettingsAction(payload);
        setLatestSettings(updated);
        setApiKeyInput("");
        setStatus({ tone: "ok", msg: "Đã lưu cài đặt AI." });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Không thể lưu cài đặt.";
        setStatus({ tone: "err", msg });
      }
    });
  };

  const { hasStoredKey, hasEnvKey } = latestSettings;
  const envVar = PROVIDER_META[provider].envVar;

  return (
    <div className="col" style={{ gap: 16 }}>
      {/* Card 1 — Toggle */}
      <Card
        title="Chấm tự luận bằng AI"
        sub="Bật để AI tự động chấm các câu hỏi tự luận khi học sinh nộp bài."
      >
        <div className="col" style={{ gap: 14, maxWidth: 560 }}>
          <label className="row" style={{ gap: 8, alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>
              <b>Bật chấm tự luận bằng AI</b>
              <span style={{ display: "block", color: "var(--muted)", fontSize: 12 }}>
                Khi tắt, câu tự luận không được chấm tự động (0 điểm cho tới khi admin chấm lại).
              </span>
            </span>
          </label>
        </div>
      </Card>

      {/* Card 2 — Provider/model (left) + API key & tokens (right), 2-col */}
      <Card
        title="Nhà cung cấp, mô hình & API key"
        sub="Chọn nhà cung cấp AI, mô hình dùng để chấm và khóa API."
      >
        <div className="row" style={{ gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Column 1 — provider + model */}
          <div className="col" style={{ flex: "1 1 280px", minWidth: 260, gap: 14 }}>
            <div className="field">
              <label>Nhà cung cấp</label>
              <div className="chip-group" style={{ flexWrap: "wrap" }}>
                {(Object.values(PROVIDER_META) as (typeof PROVIDER_META)[LLMProvider][]).map((meta) => (
                  <button
                    key={meta.id}
                    type="button"
                    className={"chip" + (provider === meta.id ? " active" : "")}
                    onClick={() => handleProviderChange(meta.id)}
                    disabled={pending}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Mô hình</label>
              <select
                className="input mono"
                value={selectValue}
                onChange={(e) => handleModelSelectChange(e.target.value)}
                disabled={pending}
              >
                {PROVIDER_META[provider].models.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
                <option value="__custom__">Tùy chỉnh (nhập thủ công)…</option>
              </select>
              {(customModel || !isModelInList(provider, model)) && (
                <input
                  className="input mono"
                  style={{ marginTop: 8 }}
                  type="text"
                  placeholder="Nhập model id thủ công, ví dụ: claude-3-7-sonnet-20250219"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={pending}
                />
              )}
            </div>

            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {PROVIDER_META[provider].keyHint}
            </div>
          </div>

          {/* Column 2 — API key + max tokens + test */}
          <div className="col" style={{ flex: "1 1 280px", minWidth: 260, gap: 14 }}>
            <div className="field">
              <label>API key</label>
              <input
                className="input mono"
                type="password"
                placeholder={hasStoredKey ? "••••••••  (đã lưu)" : "Nhập API key…"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                disabled={pending}
              />
            </div>

            <div style={{ fontSize: 13 }}>
              {hasStoredKey ? (
                <span style={{ color: "var(--success)" }}>
                  Đã lưu một API key. Để trống để giữ nguyên, hoặc nhập key mới để thay.
                </span>
              ) : hasEnvKey ? (
                <span style={{ color: "var(--muted)" }}>
                  Chưa lưu key trong CSDL — đang dùng biến môi trường{" "}
                  <code>{PROVIDER_META[provider].envVar}</code> trên server.
                </span>
              ) : (
                <span style={{ color: "var(--danger)" }}>
                  Chưa có API key. Nhập key hoặc đặt biến môi trường{" "}
                  <code>{envVar}</code> để bật chấm AI.
                </span>
              )}
            </div>

            <div className="field" style={{ maxWidth: 200 }}>
              <label>Số token tối đa</label>
              <input
                className="input mono"
                type="number"
                min={256}
                max={8192}
                style={{ width: 120 }}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                disabled={pending}
              />
            </div>

            <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="btn"
                type="button"
                onClick={onTestConnection}
                disabled={testPending || pending}
              >
                <Icon name="sparkle" /> {testPending ? "Đang kiểm tra…" : "Kiểm tra kết nối"}
              </button>
              {testStatus ? (
                <span
                  style={{
                    color: testStatus.tone === "ok" ? "var(--success)" : "var(--danger)",
                    fontSize: 13,
                  }}
                >
                  {testStatus.msg}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Card 3 — Scoring weights */}
      <Card
        title="Cách chấm điểm"
        sub="Thiết lập trọng số điểm cho cách làm và đáp số."
      >
        <div className="col" style={{ gap: 14, maxWidth: 560 }}>
          <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="field" style={{ minWidth: 160 }}>
              <label>Điểm cho cách làm đúng (%)</label>
              <input
                className="input mono"
                type="number"
                min={0}
                max={100}
                style={{ width: 120 }}
                value={methodWeight}
                onChange={(e) => setMethodWeight(Number(e.target.value))}
                disabled={pending}
              />
            </div>
            <div className="field" style={{ minWidth: 160 }}>
              <label>Điểm cho đáp số đúng (%)</label>
              <input
                className="input mono"
                type="number"
                min={0}
                max={100}
                style={{ width: 120 }}
                value={answerWeight}
                onChange={(e) => setAnswerWeight(Number(e.target.value))}
                disabled={pending}
              />
            </div>
            <div className="field" style={{ minWidth: 160 }}>
              <label>Điểm khi đoán mò ra đáp số (%)</label>
              <input
                className="input mono"
                type="number"
                min={0}
                max={100}
                style={{ width: 120 }}
                value={guessCredit}
                onChange={(e) => setGuessCredit(Number(e.target.value))}
                disabled={pending}
              />
            </div>
          </div>

          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Áp dụng khi học sinh ra đúng đáp số nhưng cách làm sai hoặc không trình bày.
          </div>

          <div
            style={{
              background: "var(--accent-soft)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--accent-ink)",
            }}
          >
            Cách làm đúng hoàn chỉnh + đáp số đúng = 100% điểm. Cách làm đúng nhưng đáp số sai ≈{" "}
            <b>{methodWeight}%</b>. Đoán mò ra đáp số = <b>{guessCredit}%</b>.
          </div>
        </div>
      </Card>

      {/* Card 4 — Grading prompt */}
      <Card
        title="Prompt chấm bài"
        sub="Hướng dẫn cách AI chấm. AI luôn được cung cấp đề bài, đáp số đúng và bài làm của học sinh."
      >
        <div className="col" style={{ gap: 14 }}>
          <textarea
            className="input"
            rows={12}
            style={{ fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.5 }}
            value={gradingPrompt}
            onChange={(e) => setGradingPrompt(e.target.value)}
            disabled={pending}
          />
          <div>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setGradingPrompt(DEFAULT_GRADING_PROMPT)}
              disabled={pending}
            >
              <Icon name="refresh" /> Khôi phục mặc định
            </button>
          </div>
        </div>
      </Card>

      {/* Footer save row */}
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <button
          className="btn primary"
          type="button"
          onClick={onSave}
          disabled={pending}
        >
          <Icon name="check" /> {pending ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
        {status ? (
          <span
            style={{
              color: status.tone === "ok" ? "var(--success)" : "var(--danger)",
              fontSize: 13,
            }}
          >
            {status.msg}
          </span>
        ) : null}
      </div>
    </div>
  );
}
