import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeMastery, BASELINE_MASTERY } from "@/lib/mastery";
import { VIETNAMESE_TOPICS, VIETNAMESE_SKILLS } from "@/lib/subjects";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Bar, Pill } from "@/components/ui";

// Vietnamese topic practice — mirrors the english /topics grid, grouped by the 5 skills.
export default async function VietnameseTopicsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");

  const mastery = await computeMastery(session.user.id, "vietnamese");

  return (
    <div className="main">
      <TopBar crumbs={[{ label: "Tiếng Việt", href: "/vietnamese" }, "Luyện chuyên đề"]} />
      <div className="content">
        <div className="page-head">
          <div>
            <h2>Luyện theo 10 chuyên đề Tiếng Việt</h2>
            <p>5 kỹ năng — Từ ngữ, Ngữ pháp &amp; câu, Tu từ &amp; Chính tả, Đọc hiểu, Viết. Phần trăm là mức thành thạo ước tính từ các bài đã làm.</p>
          </div>
        </div>

        {VIETNAMESE_SKILLS.map((skill) => {
          const ts = VIETNAMESE_TOPICS.filter((t) => t.skill === skill.id);
          return (
            <div key={skill.id} style={{ marginBottom: 20 }}>
              <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                <span className="dot" style={{ background: skill.color, width: 10, height: 10, borderRadius: 99, display: "inline-block" }} />
                <b>{skill.name}</b>
              </div>
              <div className="grid cols-4" style={{ gap: 14 }}>
                {ts.map((t) => {
                  const v = mastery.topicMastery[t.id] ?? BASELINE_MASTERY;
                  const pct = Math.round(v * 100);
                  return (
                    <Link key={t.id} href={`/vietnamese/practice?topic=${t.id}`} className="topic-card">
                      <div className="row between">
                        <div className="ico" style={{ background: `color-mix(in oklch, ${t.color}, white 86%)`, color: t.color, fontWeight: 700 }}>
                          {t.ico}
                        </div>
                        <Pill tone={pct >= 70 ? "green" : pct >= 55 ? "amber" : "red"}>{pct}%</Pill>
                      </div>
                      <div className="name">{t.name}</div>
                      <Bar value={pct} tone={pct >= 70 ? "" : pct >= 55 ? "ltv" : "ntt"} />
                      <div className="row" style={{ justifyContent: "flex-end", gap: 4, fontSize: 12, color: "var(--accent-ink)", fontWeight: 600, marginTop: 6 }}>
                        Luyện <Icon name="chevR" size={11} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
