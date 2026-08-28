import Link from "next/link";
import { Bar, Pill } from "@/components/ui";
import type { EffectiveReadinessView } from "@/lib/readiness-v4/read-service";
import { presentReadiness } from "@/lib/readiness-v4/presentation";

interface Props {
  school: { id: string; short: string; name: string; tone: string; minutes: number };
  view: EffectiveReadinessView;
  isTarget: boolean;
  href: string;
}

export function ReadinessSchoolCard({ school, view, isTarget, href }: Props) {
  const presentation = presentReadiness(view);

  return (
    <Link href={href} className={`school-card ${school.tone}`}>
      <div className="row between">
        <div>
          <div className="eyebrow" style={{ fontSize: 10 }}>{school.short}</div>
          <div className="name">{school.name}</div>
        </div>
        {isTarget && <Pill tone={school.tone}><span className="dot" />Mục tiêu</Pill>}
      </div>
      {view.score === null ? (
        <div style={{ margin: "18px 0", minHeight: 47 }}>
          <b style={{ fontSize: 14 }}>Chưa đủ dữ liệu để đánh giá</b>
        </div>
      ) : (
        <>
          <div className="pct"><span className="num">{Math.round(view.score)}</span><span className="sym">/100</span></div>
          <Bar value={view.score} tone={school.tone} tall />
        </>
      )}
      {view.source === "v4" && view.schoolMastery !== null && view.evidence !== null && (
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
          Mastery {Math.round(view.schoolMastery * 100)}% · Độ phủ {Math.round(view.evidence * 100)}%
        </div>
      )}
      <div className="row between" style={{ marginTop: 8, gap: 8 }}>
        <Pill tone={presentation.tone}>{presentation.statusLabel}</Pill>
        <span className="muted" style={{ fontSize: 11.5 }}>{school.minutes} phút</span>
      </div>
      <div className="row between" style={{ marginTop: 6, gap: 8 }}>
        <span className="muted" style={{ fontSize: 10.5 }}>{presentation.sourceLabel}</span>
        <span className="muted" style={{ fontSize: 10.5 }}>{presentation.freshnessLabel}</span>
      </div>
      {presentation.reason && (
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>{presentation.reason}</div>
      )}
    </Link>
  );
}
