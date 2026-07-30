import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Card } from "@/components/ui";
import { SUBJECTS, SUBJECT_META, isSubject, type Subject } from "@/lib/subjects";

// "Bài thầy giao" — private remedial sets assigned to the signed-in student.
// Each card is one Exam owned by the user (ownerUserId). Visibility is enforced
// here (only own sets) and again in the exam runner. See docs/REMEDIAL-SETS-DESIGN.md.
export default async function AssignedSetsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const exams = await prisma.exam.findMany({
    where: { ownerUserId: session.user.id, active: true },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const attempts = await prisma.attempt.groupBy({
    by: ["examId"],
    where: { userId: session.user.id, submitted: true },
    _count: { _all: true },
    _max: { score: true },
  });
  const attemptMap = new Map<string, { count: number; best: number | null }>();
  for (const a of attempts) {
    attemptMap.set(a.examId, { count: a._count._all, best: a._max.score });
  }

  // Group by subject so English/Vietnamese assigned sets don't sit mixed in with
  // the Toán ones. `exam.subject` defaults to "math" for older rows.
  const bySubject = new Map<Subject, typeof exams>();
  for (const e of exams) {
    const subj: Subject = isSubject(e.subject) ? e.subject : "math";
    const list = bySubject.get(subj) ?? [];
    list.push(e);
    bySubject.set(subj, list);
  }

  const renderCard = (e: (typeof exams)[number]) => {
    const a = attemptMap.get(e.id);
    const count = a?.count ?? 0;
    const best = a?.best ?? null;
    return (
      <Link key={e.id} href={`/exam/${e.id}`} className="exam-row">
        <div className="badge" style={{ background: "var(--accent)" }}>
          LUYỆN
        </div>
        <div>
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <span className="title">{e.title ?? "Bài luyện"}</span>
          </div>
          <div className="meta">
            {e.qcount} câu · {e.minutes} phút ·
            {count > 0 ? (
              <>
                {" "}
                <b className="mono">{count}</b> lần làm · cao nhất{" "}
                <b
                  className="mono"
                  style={{ color: (best ?? 0) >= 70 ? "var(--success)" : "var(--ink)" }}
                >
                  {best ?? 0}%
                </b>
              </>
            ) : (
              <span className="muted"> chưa làm</span>
            )}
          </div>
        </div>
        <div className="stat">
          <div className="eyebrow" style={{ fontSize: 10 }}>
            Câu
          </div>
          <b className="mono">{e.qcount}</b>
        </div>
        <button className="btn primary sm">
          {count > 0 ? "Làm lại" : "Bắt đầu"} <Icon name="chevR" size={11} />
        </button>
      </Link>
    );
  };

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Trang chính", href: "/home" }, "Bài thầy giao"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Bài thầy giao</h2>
            <p>Các bài luyện được giao riêng cho con, sắp theo thứ tự nên làm.</p>
          </div>
        </div>

        {exams.length === 0 ? (
          <Card>
            <div className="empty">Hiện chưa có bài luyện nào được giao.</div>
          </Card>
        ) : (
          <div className="col" style={{ gap: 24 }}>
            {SUBJECTS.map((subj) => {
              const list = bySubject.get(subj);
              if (!list || list.length === 0) return null;
              const meta = SUBJECT_META[subj];
              return (
                <div key={subj} className="col" style={{ gap: 10 }}>
                  <div className="row" style={{ gap: 8, alignItems: "center" }}>
                    <span
                      className="badge"
                      style={{ background: meta.color, fontSize: 11 }}
                    >
                      {meta.ico}
                    </span>
                    <h3 style={{ margin: 0, fontSize: 15 }}>{meta.name}</h3>
                    <span className="muted" style={{ fontSize: 12 }}>
                      {list.length} bài
                    </span>
                  </div>
                  {list.map(renderCard)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
