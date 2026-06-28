"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { saveLLMSettingsAction, testLLMConnection } from "./actions";
import {
  PROVIDER_META,
  DEFAULT_GRADING_PROMPT,
  DEFAULT_WRITING_PROMPT,
  DEFAULT_WRITING_WEIGHTS,
  WRITING_CRITERIA,
  WRITING_CRITERIA_LABELS,
  VN_WRITING_PROMPT,
  VN_WRITING_WEIGHTS,
  VN_WRITING_CRITERIA,
  VN_WRITING_CRITERIA_LABELS,
} from "@/lib/llm/providers";
import type { LLMProvider } from "@/lib/llm/types";
import type { PublicLLMSettings } from "@/lib/llm-settings";

type WritingWeights = Record<string, number>;

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

  // English Writing rubric (đoạn văn).
  const [writingPrompt, setWritingPrompt] = useState<string>(initial.writingPrompt ?? DEFAULT_WRITING_PROMPT);
  const [writingWeights, setWritingWeights] = useState<WritingWeights>(
    initial.writingWeights && Object.keys(initial.writingWeights).length > 0
      ? { ...DEFAULT_WRITING_WEIGHTS, ...initial.writingWeights }
      : { ...DEFAULT_WRITING_WEIGHTS },
  );
  const writingTotal = WRITING_CRITERIA.reduce((sum, c) => sum + (writingWeights[c] ?? 0), 0);

  // Vietnamese văn rubric (đặt câu / cảm thụ / viết đoạn-bài).
  const [vnWritingPrompt, setVnWritingPrompt] = useState<string>(initial.vnWritingPrompt ?? VN_WRITING_PROMPT);
  const [vnWritingWeights, setVnWritingWeights] = useState<WritingWeights>(
    initial.vnWritingWeights && Object.keys(initial.vnWritingWeights).length > 0
      ? { ...VN_WRITING_WEIGHTS, ...initial.vnWritingWeights }
      : { ...VN_WRITING_WEIGHTS },
  );
  const vnWritingTotal = VN_WRITING_CRITERIA.reduce((sum, c) => sum + (vnWritingWeights[c] ?? 0), 0);

  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [latestSettings, setLatestSettings] = useState<PublicLLMSettings>(initial);

  // Sub-tab within the AI LLMs panel: general connection vs per-subject rubric.
  type LLMSection = "chung" | "toan" | "vietnamese" | "english";
  const [section, setSection] = useState<LLMSection>("chung");
  const SECTIONS: { id: LLMSection; label: string }[] = [
    { id: "chung", label: "Cài đặt chung" },
    { id: "toan", label: "Toán" },
    { id: "vietnamese", label: "Tiếng Việt" },
    { id: "english", label: "Tiếng Anh" },
  ];

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
      writingPrompt: string;
      writingWeights: WritingWeights;
      vnWritingPrompt: string;
      vnWritingWeights: WritingWeights;
    } = {
      enabled,
      provider,
      model,
      gradingPrompt,
      methodWeight,
      answerWeight,
      guessCredit,
      maxTokens,
      writingPrompt,
      writingWeights: {
        task: writingWeights.task ?? 0,
        lexical: writingWeights.lexical ?? 0,
        grammar: writingWeights.grammar ?? 0,
        cohesion: writingWeights.cohesion ?? 0,
        length: writingWeights.length ?? 0,
      },
      vnWritingPrompt,
      vnWritingWeights: {
        noidung: vnWritingWeights.noidung ?? 0,
        camthu: vnWritingWeights.camthu ?? 0,
        dienden: vnWritingWeights.dienden ?? 0,
        chinhta: vnWritingWeights.chinhta ?? 0,
        sangtao: vnWritingWeights.sangtao ?? 0,
      },
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
  const keyTyped = apiKeyInput.trim() !== "";

  return (
    <div className="col" style={{ gap: 16 }}>
      {/* Sub-tab bar — Cài đặt chung / Toán / Tiếng Việt / Tiếng Anh */}
      <div className="chip-group" style={{ flexWrap: "wrap" }}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={"chip" + (section === s.id ? " active" : "")}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "chung" && (
        <>
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
              {keyTyped ? (
                <span style={{ color: "var(--accent-ink)" }}>
                  Đã nhập key mới — bấm “Lưu thay đổi” bên dưới để áp dụng.
                </span>
              ) : hasStoredKey ? (
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

        </>
      )}

      {section === "toan" && (
        <>
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

        </>
      )}

      {section === "english" && (
        <>
      {/* Card 5 — English Writing rubric */}
      <Card
        title="Chấm bài viết Tiếng Anh (Writing)"
        sub="Dùng cho câu viết đoạn (essay) môn Tiếng Anh. AI chấm theo 5 tiêu chí; điểm được tính từ trọng số bên dưới."
      >
        <div className="col" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            {WRITING_CRITERIA.map((c) => (
              <div key={c} className="field" style={{ minWidth: 130 }}>
                <label>{WRITING_CRITERIA_LABELS[c]} (%)</label>
                <input
                  className="input mono"
                  type="number"
                  min={0}
                  max={100}
                  style={{ width: 110 }}
                  value={writingWeights[c] ?? 0}
                  onChange={(e) => setWritingWeights((w) => ({ ...w, [c]: Number(e.target.value) }))}
                  disabled={pending}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              background: writingTotal === 100 ? "var(--accent-soft)" : "var(--warn-soft)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: writingTotal === 100 ? "var(--accent-ink)" : "oklch(0.4 0.1 70)",
            }}
          >
            Tổng trọng số hiện tại: <b>{writingTotal}%</b>
            {writingTotal === 100
              ? " — hợp lệ."
              : " — nên bằng 100% (điểm vẫn được chuẩn hoá theo tổng nếu khác 100)."}
          </div>

          <div className="field">
            <label>Prompt chấm bài viết</label>
            <textarea
              className="input"
              rows={10}
              style={{ fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.5 }}
              value={writingPrompt}
              onChange={(e) => setWritingPrompt(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setWritingPrompt(DEFAULT_WRITING_PROMPT)}
              disabled={pending}
            >
              <Icon name="refresh" /> Khôi phục prompt mặc định
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setWritingWeights({ ...DEFAULT_WRITING_WEIGHTS })}
              disabled={pending}
            >
              <Icon name="refresh" /> Khôi phục trọng số mặc định
            </button>
          </div>
        </div>
      </Card>

        </>
      )}

      {section === "vietnamese" && (
        <>
      {/* Card 6 — Vietnamese văn rubric */}
      <Card
        title="Chấm bài viết Tiếng Việt (Văn)"
        sub="Dùng cho câu tự luận (đặt câu / cảm thụ / viết đoạn-bài) môn Tiếng Việt. AI chấm theo 5 tiêu chí; điểm tính từ trọng số bên dưới. Đáp án mẫu (modelAnswer) được nối thêm tự động khi chấm."
      >
        <div className="col" style={{ gap: 16 }}>
          <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            {VN_WRITING_CRITERIA.map((c) => (
              <div key={c} className="field" style={{ minWidth: 130 }}>
                <label>{VN_WRITING_CRITERIA_LABELS[c]} (%)</label>
                <input
                  className="input mono"
                  type="number"
                  min={0}
                  max={100}
                  style={{ width: 110 }}
                  value={vnWritingWeights[c] ?? 0}
                  onChange={(e) => setVnWritingWeights((w) => ({ ...w, [c]: Number(e.target.value) }))}
                  disabled={pending}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              background: vnWritingTotal === 100 ? "var(--accent-soft)" : "var(--warn-soft)",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: vnWritingTotal === 100 ? "var(--accent-ink)" : "oklch(0.4 0.1 70)",
            }}
          >
            Tổng trọng số hiện tại: <b>{vnWritingTotal}%</b>
            {vnWritingTotal === 100
              ? " — hợp lệ."
              : " — nên bằng 100% (điểm vẫn được chuẩn hoá theo tổng nếu khác 100)."}
          </div>

          <div className="field">
            <label>Prompt chấm bài viết (Tiếng Việt)</label>
            <textarea
              className="input"
              rows={10}
              style={{ fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.5 }}
              value={vnWritingPrompt}
              onChange={(e) => setVnWritingPrompt(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setVnWritingPrompt(VN_WRITING_PROMPT)}
              disabled={pending}
            >
              <Icon name="refresh" /> Khôi phục prompt mặc định
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setVnWritingWeights({ ...VN_WRITING_WEIGHTS })}
              disabled={pending}
            >
              <Icon name="refresh" /> Khôi phục trọng số mặc định
            </button>
          </div>
        </div>
      </Card>

        </>
      )}

      {/* Footer save row (shared — saves all sections at once) */}
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
