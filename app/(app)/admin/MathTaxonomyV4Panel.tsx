"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Card, Pill } from "@/components/ui";
import { Icon } from "@/components/Icon";
import {
  saveMathTaxonomyMapping,
  type MathTaxonomyAdminData,
} from "./actions";

function sameValues(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function stateTone(value: number): "green" | "" {
  if (value === 0) return "";
  return "green";
}

export function MathTaxonomyV4Panel({ data }: { data: MathTaxonomyAdminData }) {
  const initialMappings = useMemo(
    () => Object.fromEntries(data.topics.map((topic) => [topic.id, topic.mappedContentTopics])),
    [data.topics],
  );
  const [mappings, setMappings] = useState<Record<string, string[]>>(initialMappings);
  const [savedMappings, setSavedMappings] = useState<Record<string, string[]>>(initialMappings);
  const [savingTopic, setSavingTopic] = useState<string | null>(null);
  const [message, setMessage] = useState<{ topic: string; text: string; error?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const unresolved = data.total.missing + data.total.stale + data.total.conflict;
  const usable = data.total.current + data.total.inherited;

  const toggleMapping = (taxonomyTopic: string, contentTopic: string) => {
    setMappings((current) => {
      const selected = current[taxonomyTopic] ?? [];
      const next = selected.includes(contentTopic)
        ? selected.filter((id) => id !== contentTopic)
        : [...selected, contentTopic];
      return { ...current, [taxonomyTopic]: next };
    });
    setMessage(null);
  };

  const saveMapping = (taxonomyTopic: string) => {
    setSavingTopic(taxonomyTopic);
    setMessage(null);
    startTransition(async () => {
      try {
        await saveMathTaxonomyMapping({
          taxonomyTopic,
          contentTopics: mappings[taxonomyTopic] ?? [],
        });
        setSavedMappings((current) => ({
          ...current,
          [taxonomyTopic]: [...(mappings[taxonomyTopic] ?? [])],
        }));
        setMessage({ topic: taxonomyTopic, text: "Đã lưu mapping V4" });
      } catch (error) {
        setMessage({
          topic: taxonomyTopic,
          text: error instanceof Error ? error.message : "Không thể lưu mapping",
          error: true,
        });
      } finally {
        setSavingTopic(null);
      }
    });
  };

  return (
    <div className="col" style={{ gap: 20 }}>
      <div className="row between" style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <Pill tone="green">Readiness V4</Pill>
            <Pill>13 analytical topic</Pill>
            <Pill>{data.taxonomyVersion}</Pill>
          </div>
          <h3 style={{ margin: 0, fontSize: 18 }}>Taxonomy chuyên đề Toán V4</h3>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 12.5 }}>
            Taxonomy đã được dùng bởi assessment, Mastery và bộ chọn bài luyện V4. ID và cấu trúc được khóa theo phiên bản.
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link className="btn" href="/admin?tab=bank&subject=math">
            <Icon name="book" /> Mở ngân hàng câu hỏi
          </Link>
          <Link className="btn" href="/admin?tab=readiness&subject=math">
            <Icon name="trend" /> Điều hành V4
          </Link>
        </div>
      </div>

      <div className="grid cols-5">
        {[
          ["Câu trong scope", data.total.total, ""],
          ["Assessment dùng được", usable, "green"],
          ["Current / Inherited", `${data.total.current} / ${data.total.inherited}`, "accent"],
          ["Chưa xử lý", unresolved, unresolved > 0 ? "amber" : "green"],
          ["Run đã duyệt", data.approvedRunCount, "solid"],
        ].map(([label, value, tone]) => (
          <Card key={String(label)} tight>
            <div className="eyebrow">{label}</div>
            <div className="kpi" style={{ fontSize: 23, marginTop: 6 }}>
              <Pill tone={String(tone)}>{value}</Pill>
            </div>
          </Card>
        ))}
      </div>

      <Card
        title="Coverage theo analytical topic và độ khó"
        sub={`Chỉ tính assessment Current/Inherited của ${data.taxonomyVersion}; Missing/Stale/Conflict được giữ ở KPI tổng vì chưa thể gán an toàn vào topic.`}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Analytical topic</th>
                <th style={{ textAlign: "right" }}>D1</th>
                <th style={{ textAlign: "right" }}>D2</th>
                <th style={{ textAlign: "right" }}>D3</th>
                <th style={{ textAlign: "right" }}>D4</th>
                <th style={{ textAlign: "right" }}>D5</th>
                <th style={{ textAlign: "right" }}>Current</th>
                <th style={{ textAlign: "right" }}>Inherited</th>
                <th style={{ textAlign: "right" }}>Dùng được</th>
              </tr>
            </thead>
            <tbody>
              {data.topics.map((topic) => (
                <tr key={topic.id}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        display: "grid",
                        placeItems: "center",
                        background: `color-mix(in oklch, ${topic.color}, white 84%)`,
                        color: topic.color,
                        fontWeight: 750,
                      }}>
                        {topic.icon}
                      </div>
                      <div>
                        <b style={{ fontSize: 12.5 }}>{topic.name}</b>
                        <div className="mono muted" style={{ fontSize: 10.5, marginTop: 2 }}>{topic.id}</div>
                      </div>
                    </div>
                  </td>
                  {([1, 2, 3, 4, 5] as const).map((band) => (
                    <td key={band} className="mono" style={{ textAlign: "right" }}>{topic.byDifficulty[band]}</td>
                  ))}
                  <td style={{ textAlign: "right" }}><Pill tone={stateTone(topic.current)}>{topic.current}</Pill></td>
                  <td style={{ textAlign: "right" }}><Pill tone={topic.inherited > 0 ? "accent" : ""}>{topic.inherited}</Pill></td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 750 }}>{topic.usable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Mapping content topic → analytical taxonomy"
        sub="Mapping chỉ dùng để chiếu dữ liệu/gợi ý giữa kho nội dung cũ và V4; không thay đổi assessment đã duyệt. Thứ tự lựa chọn xác định priority."
      >
        <div className="grid cols-2" style={{ gap: 12 }}>
          {data.topics.map((topic) => {
            const selected = mappings[topic.id] ?? [];
            const dirty = !sameValues(selected, savedMappings[topic.id] ?? []);
            return (
              <div key={topic.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                <div className="row between" style={{ gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <b style={{ fontSize: 12.5 }}>{topic.name}</b>
                    <div className="mono muted" style={{ fontSize: 10.5, marginTop: 2 }}>{topic.id}</div>
                  </div>
                  <button
                    type="button"
                    className="btn sm primary"
                    disabled={!dirty || pending}
                    onClick={() => saveMapping(topic.id)}
                  >
                    <Icon name="check" size={12} /> {savingTopic === topic.id ? "Đang lưu…" : "Lưu"}
                  </button>
                </div>
                <div className="row" style={{ gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                  {data.contentTopics.map((contentTopic) => {
                    const checked = selected.includes(contentTopic.id);
                    return (
                      <label
                        key={contentTopic.id}
                        className="pill"
                        style={{ cursor: "pointer", background: checked ? "var(--accent-soft)" : undefined }}
                        title={contentTopic.name}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMapping(topic.id, contentTopic.id)}
                          style={{ margin: 0 }}
                        />
                        {contentTopic.short}
                      </label>
                    );
                  })}
                </div>
                {selected.length === 0 && (
                  <div style={{ marginTop: 9 }}><Pill tone="amber">Chưa có content mapping</Pill></div>
                )}
                {message?.topic === topic.id && (
                  <div style={{ marginTop: 9 }}>
                    <Pill tone={message.error ? "red" : "green"}>{message.text}</Pill>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)", fontSize: 12.5 }}>
        <b>Quy tắc phiên bản:</b> Không thêm, xóa hoặc đổi ID trực tiếp trong taxonomy đang hoạt động. Thay đổi cấu trúc phải tạo taxonomy version mới, đánh giá lại ngân hàng và kích hoạt qua Readiness V4 control plane.
        {data.latestApprovedAt && <span className="muted"> · Run gần nhất được duyệt {new Date(data.latestApprovedAt).toLocaleString("vi-VN")}</span>}
      </div>
    </div>
  );
}
