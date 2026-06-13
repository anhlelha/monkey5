import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SCHOOLS } from "@/lib/static";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Card, Pill } from "@/components/ui";

export default async function RecentResults() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const attempts = await prisma.attempt.findMany({
    where: { userId: session.user.id, submitted: true },
    include: { exam: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Trang chính", href: "/home" }, "Kết quả gần đây"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Kết quả gần đây</h2>
            <p>Bấm vào một bài để xem lại đáp án và hỏi AI từng câu.</p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <Card>
            <div className="empty">
              Con chưa làm đề nào.
              <div style={{ marginTop: 12 }}>
                <Link href="/library" className="btn primary">
                  <Icon name="library" /> Chọn đề mẫu
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            {attempts.map((a) => {
              const s = SCHOOLS.find((x) => x.id === a.exam.school);
              return (
                <Link key={a.id} href={`/exam/${a.examId}/results/${a.id}`} className="exam-row">
                  <div className={"badge " + (s?.tone ?? "")} style={s ? undefined : { background: "var(--accent)" }}>
                    {s?.short ?? "MIX"}
                  </div>
                  <div>
                    <div className="row" style={{ gap: 8, alignItems: "center" }}>
                      <span className="title">{a.exam.title ?? a.exam.year}</span>
                      <Pill tone={a.score >= 70 ? "green" : a.score >= 50 ? "amber" : "red"}>{a.score}%</Pill>
                    </div>
                    <div className="meta">
                      {a.exam.qcount} câu · {a.exam.minutes} phút · {new Date(a.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div style={{ width: 140 }}>
                    <Bar value={a.score} tone={a.score >= 70 ? "" : a.score >= 50 ? "ltv" : "ntt"} />
                  </div>
                  <div className="stat">
                    <div className="eyebrow" style={{ fontSize: 10 }}>Điểm</div>
                    <b className="mono">{a.earned}/{a.total}</b>
                  </div>
                  <button className="btn sm ghost">
                    Xem <Icon name="chevR" size={11} />
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
