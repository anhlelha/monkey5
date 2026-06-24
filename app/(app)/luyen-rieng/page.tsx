import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Card } from "@/components/ui";

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
          <div className="col" style={{ gap: 10 }}>
            {exams.map((e) => {
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
                            style={{
                              color: (best ?? 0) >= 70 ? "var(--success)" : "var(--ink)",
                            }}
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
