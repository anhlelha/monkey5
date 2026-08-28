import { Card } from "@/components/ui";
import type { EffectiveReadinessView } from "@/lib/readiness-v4/read-service";
import { ReadinessSchoolCard } from "./ReadinessSchoolCard";

interface SchoolSummary {
  id: string;
  short: string;
  name: string;
  tone: string;
  minutes: number;
}

interface Props {
  schools: SchoolSummary[];
  readiness: Record<string, EffectiveReadinessView>;
  targetIds?: string[];
  title?: string;
  subtitle?: string;
}

export function ReadinessUserSummary({
  schools,
  readiness,
  targetIds = [],
  title = "Readiness theo trường mục tiêu",
  subtitle = "Readiness là chỉ số sẵn sàng theo từng trường, không phải xác suất đỗ.",
}: Props) {
  const views = schools.map((school) => readiness[school.id]).filter(Boolean);
  const v4Count = views.filter((view) => view.source === "v4").length;
  const staleCount = views.filter((view) => view.freshnessState === "stale" || view.freshnessState === "computing").length;
  const fallbackCount = views.filter((view) => view.source === "legacy-fallback").length;

  return (
    <Card title={title} sub={subtitle}>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <span className="muted" style={{ fontSize: 12 }}>
          {v4Count > 0 ? `${v4Count}/${views.length} trường đang dùng snapshot V4` : "Chưa có snapshot V4 khả dụng"}
        </span>
        {staleCount > 0 && <span className="muted" style={{ fontSize: 12 }}>· {staleCount} đang cập nhật</span>}
        {fallbackCount > 0 && <span className="muted" style={{ fontSize: 12 }}>· {fallbackCount} fallback hệ cũ</span>}
      </div>
      <div className="grid cols-4" style={{ gap: 12 }}>
        {schools.map((school) => {
          const view = readiness[school.id];
          if (!view) return null;
          return (
            <ReadinessSchoolCard
              key={school.id}
              school={school}
              view={view}
              isTarget={targetIds.includes(school.id)}
              href={`/library?school=${school.id}`}
            />
          );
        })}
      </div>
      {views.length > 0 && (
        <div className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
          {views.some((view) => view.source === "v4")
            ? "Snapshot V4 gồm Mastery theo blueprint trường, Evidence, gate và thời điểm tính gần nhất."
            : "Các thẻ đang hiển thị dữ liệu hệ cũ; Readiness V4 sẽ xuất hiện sau khi snapshot đúng policy/profile được tạo."}
        </div>
      )}
    </Card>
  );
}
