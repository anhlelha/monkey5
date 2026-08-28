import type { ReadinessReasonCode, ReadinessStatus } from "./types";
import type { EffectiveReadinessView, ReadinessFreshnessState } from "./read-service";

export const READINESS_STATUS_COPY: Record<ReadinessStatus, string> = {
  unverified: "Chưa đủ dữ liệu để đánh giá",
  not_ready: "Chưa sẵn sàng",
  preparing: "Đang chuẩn bị",
  near_ready: "Gần sẵn sàng",
  evidence_limited: "Điểm tổng đã đạt nhưng chưa đủ bằng chứng",
  ready: "Sẵn sàng",
  strong_ready: "Sẵn sàng cao",
};

export const READINESS_REASON_COPY: Record<ReadinessReasonCode, string> = {
  NO_VERIFIED_EVIDENCE: "Chưa có đủ bài làm được đánh giá theo yêu cầu của trường.",
  SCORE_BELOW_READY_THRESHOLD: "Chỉ số sẵn sàng hiện chưa đạt ngưỡng Sẵn sàng.",
  OVERALL_EVIDENCE_BELOW_GATE: "Con cần làm thêm bài đúng các mảng trường này thường hỏi.",
  ADVANCED_EVIDENCE_BELOW_GATE: "Chưa có đủ kết quả ở nhóm bài nâng cao mà trường thường sử dụng để phân hóa.",
  CRITICAL_TOPIC_MASTERY_BELOW_GATE: "Một chuyên đề trọng yếu hiện chưa đạt mức làm chủ yêu cầu.",
  CRITICAL_TOPIC_EVIDENCE_BELOW_GATE: "Chưa có đủ bài làm để kết luận chắc chắn về một chuyên đề trọng yếu.",
};

export const READINESS_FRESHNESS_COPY: Record<ReadinessFreshnessState, string> = {
  current: "Dữ liệu hiện hành",
  computing: "Đang cập nhật sau bài làm mới",
  stale: "Có bài làm mới; chỉ số đang được tính lại",
  unavailable: "Chưa có dữ liệu khả dụng",
};

export type ReadinessTone = "green" | "amber" | "red" | "";

export interface ReadinessPresentation {
  statusLabel: string;
  tone: ReadinessTone;
  scoreLabel: string;
  reason: string | null;
  freshnessLabel: string;
  sourceLabel: string;
}

export function presentReadiness(view: EffectiveReadinessView): ReadinessPresentation {
  const statusLabel = view.status === "legacy"
    ? "Chỉ số theo hệ cũ"
    : READINESS_STATUS_COPY[view.status];
  const tone: ReadinessTone = view.status === "ready" || view.status === "strong_ready"
    ? "green"
    : view.status === "preparing" || view.status === "near_ready" || view.status === "evidence_limited"
      ? "amber"
      : view.status === "unverified" || view.status === "legacy"
        ? ""
        : "red";
  return {
    statusLabel,
    tone,
    scoreLabel: view.score === null ? "Chưa đủ dữ liệu" : `${Math.round(view.score)} / 100`,
    reason: view.source === "v4" && view.reasonCodes[0]
      ? READINESS_REASON_COPY[view.reasonCodes[0]]
      : null,
    freshnessLabel: READINESS_FRESHNESS_COPY[view.freshnessState],
    sourceLabel: view.source === "v4" ? "Readiness V4" : "Hệ cũ (fallback)",
  };
}
