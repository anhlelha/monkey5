import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hydrateUser } from "@/lib/user-data";
import { SCHOOLS, DEFAULT_TOPICS, MIX_SCHOOL } from "@/lib/static";
import { TopBar } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import { Pill } from "@/components/ui";
import { BackButton } from "@/components/BackButton";
import { MathText } from "@/components/MathText";
import { ExamFigure } from "@/components/ExamFigure";
import { getExamSectionHeader } from "@/lib/exam";
import type { ExamQuestion, SectionHeader } from "@/lib/exam";

interface Props {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ from?: string }>;
}

const parseOptions = (raw: string): { id: string; text: string }[] => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const ANSWER_LABELS: Record<string, string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

export default async function AdminExamPreviewPage({ params, searchParams }: Props) {
  const { examId } = await params;
  const { from } = await searchParams;
  const backToList = from ? `/admin?${from}` : "/admin?tab=exams";
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/signin");
  const user = hydrateUser(dbUser);
  if (user.role !== "admin") redirect("/home");

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: { orderBy: { num: "asc" } } },
  });

  if (!exam) notFound();

  const school = SCHOOLS.find((s) => s.id === exam.school) ?? MIX_SCHOOL;

  // English/Vietnamese reading questions reference a shared Passage by passageId.
  const passageIds = [
    ...new Set(exam.questions.map((q) => q.passageId).filter((x): x is string => Boolean(x))),
  ];
  const passages = passageIds.length
    ? await prisma.passage.findMany({ where: { id: { in: passageIds } } })
    : [];
  const passageById = new Map(passages.map((p) => [p.id, p]));

  const questions: ExamQuestion[] = exam.questions.map((q) => {
    const p = q.passageId ? passageById.get(q.passageId) : null;
    return {
      id: q.id,
      num: q.num,
      type: q.type as ExamQuestion["type"],
      subject: q.subject,
      topic: q.topic,
      skill: q.skill,
      grade: q.grade,
      points: q.points,
      stem: q.stem,
      unit: q.unit,
      placeholder: q.placeholder,
      correct: q.correct,
      options: parseOptions(q.options),
      modelAnswer: q.modelAnswer,
      figure: q.figure,
      passageId: q.passageId,
      passage: p ? { title: p.title, body: p.body, kind: p.kind } : null,
      source: q.source,
      answerSchema: q.answerSchema,
    };
  });

  let parsedSections: SectionHeader[] = [];
  try {
    parsedSections = JSON.parse(exam.sections || "[]");
  } catch {}

  const topics = await prisma.topic.findMany({ orderBy: { position: "asc" } });
  const TOPICS = (topics.length > 0 ? topics : DEFAULT_TOPICS).map((t) => ({
    id: t.id,
    short: t.short,
    color: t.color,
  }));

  const examTitle =
    exam.kind === "official"
      ? `Đề thi ${school.short} · ${exam.year}`
      : exam.title ?? `Đề thi · ${exam.year}`;

  const mcqCount = questions.filter((q) => q.type === "mcq").length;
  const fillCount = questions.filter((q) => q.type === "fill").length;
  const essayCount = questions.filter((q) => q.type === "essay").length;

  return (
    <div className="main">
      <TopBar
        crumbs={[
          { label: "Quản trị", href: "/admin?tab=overview" },
          { label: "Đề bài", href: backToList },
          examTitle,
        ]}
        actions={<BackButton fallback={backToList} />}
      />

      <div className="content" style={{ maxWidth: 860, paddingBottom: 60 }}>
        {/* Header */}
        <div
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 24,
          }}
        >
          <div className="row between" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div className="row" style={{ gap: 10 }}>
              <Pill tone={exam.kind === "official" ? "solid" : exam.kind === "reference" ? "amber" : "green"}>
                {exam.kind === "official" ? "Chính thức" : exam.kind === "reference" ? "Tham khảo" : "Trộn"}
              </Pill>
              <Pill tone={school.tone}>{school.short}</Pill>
            </div>
            <span className="muted" style={{ fontSize: 12 }}>ID: <code>{exam.id}</code></span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{examTitle}</h2>
          {exam.note && (
            <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{exam.note}</p>
          )}

          <div className="row" style={{ gap: 20, flexWrap: "wrap", marginTop: 8 }}>
            {[
              { label: "Thời gian", value: `${exam.minutes} phút`, icon: "clock" },
              { label: "Tổng câu", value: `${questions.length} câu`, icon: "grid" },
              mcqCount > 0 && { label: "Trắc nghiệm", value: `${mcqCount} câu`, icon: "check" },
              fillCount > 0 && { label: "Điền vào", value: `${fillCount} câu`, icon: "pencil" },
              essayCount > 0 && { label: "Tự luận", value: `${essayCount} câu`, icon: "book" },
            ]
              .filter(Boolean)
              .map((item: any, i) => (
                <div key={i} className="row" style={{ gap: 6, fontSize: 13 }}>
                  <Icon name={item.icon} size={13} />
                  <span className="muted">{item.label}:</span>
                  <b>{item.value}</b>
                </div>
              ))}
          </div>

          {exam.intro && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "var(--surface-2)",
                borderRadius: 8,
                fontSize: 13,
                color: "var(--ink-muted)",
                fontStyle: "italic",
              }}
            >
              {exam.intro}
            </div>
          )}
        </div>

        {/* Answer key summary */}
        <div
          style={{
            background: "oklch(0.97 0.02 145)",
            border: "1px solid oklch(0.85 0.05 145)",
            borderRadius: 14,
            padding: "18px 22px",
            marginBottom: 24,
          }}
        >
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <Icon name="check" size={15} />
            <b style={{ fontSize: 14 }}>Bảng đáp án nhanh</b>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: 6,
            }}
          >
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  background: "white",
                  border: "1px solid oklch(0.88 0.05 145)",
                  borderRadius: 8,
                  padding: "6px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 13,
                }}
              >
                <span className="muted">Câu {q.num}</span>
                <b
                  style={{
                    color:
                      q.type === "essay"
                        ? "var(--ink-muted)"
                        : "var(--success)",
                    fontSize: 13,
                  }}
                >
                  {q.type === "essay" ? "TL" : (q.correct ?? "—")}
                </b>
              </div>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="col" style={{ gap: 16 }}>
          {questions.map((q, idx) => {
            const sectionHeader = getExamSectionHeader(parsedSections, q.num);
            const topic = TOPICS.find((t) => t.id === q.topic) ?? {
              id: q.topic,
              short: q.topic,
              color: "var(--ink-muted)",
            };
            // Reading passages are shared across a group — show once, on the first question of the group.
            const showPassage =
              q.passage && questions[idx - 1]?.passageId !== q.passageId;

            return (
              <div key={q.id}>
                {sectionHeader && (
                  <div
                    style={{
                      padding: "10px 16px",
                      background: "var(--surface-2)",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 13,
                      marginBottom: 8,
                      borderLeft: "3px solid var(--accent)",
                    }}
                  >
                    {sectionHeader}
                  </div>
                )}

                {showPassage && q.passage && (
                  <div className="q-passage" style={{ marginBottom: 8 }}>
                    {q.passage.title && <div className="q-passage-title">{q.passage.title}</div>}
                    <div className="q-passage-body">
                      {q.passage.body.split(/\n+/).map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    background: "var(--surface-1)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "18px 22px",
                    position: "relative",
                  }}
                >
                  {/* Correct answer badge — top right */}
                  <div
                    style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {q.type !== "essay" && (
                      <span
                        style={{
                          background: "var(--success-soft)",
                          color: "var(--success)",
                          border: "1px solid var(--success)",
                          borderRadius: 20,
                          padding: "2px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        ✓ {q.correct}
                        {q.unit ? ` ${q.unit}` : ""}
                      </span>
                    )}
                    {q.type === "essay" && (
                      <Pill tone="solid">Tự luận · {q.points}đ</Pill>
                    )}
                  </div>

                  {/* Question number + tags */}
                  <div className="row" style={{ gap: 8, marginBottom: 8, flexWrap: "wrap", paddingRight: 110 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: "var(--accent)",
                      }}
                    >
                      Câu {q.num}.
                    </span>
                    <Pill style={{ borderColor: topic.color }}>
                      <span className="dot" style={{ background: topic.color }} />
                      {topic.short}
                    </Pill>
                    <Pill
                      tone={
                        q.grade === "NC"
                          ? "red"
                          : q.grade === "L4+5"
                          ? "amber"
                          : ""
                      }
                    >
                      {q.grade}
                    </Pill>
                    {q.source && (
                      <Pill tone={q.source.startsWith("Trích đề") ? "cg" : ""}>
                        <Icon name="school" size={11} /> {q.source}
                      </Pill>
                    )}
                  </div>

                  {/* Stem */}
                  <div style={{ fontSize: 14, lineHeight: 1.65, paddingRight: 110 }}>
                    <MathText text={q.stem} />
                  </div>

                  {/* Figure */}
                  {q.figure && (
                    <div style={{ marginTop: 10 }}>
                      <ExamFigure figure={q.figure} />
                    </div>
                  )}

                  {/* MCQ options */}
                  {q.type === "mcq" && q.options.length > 0 && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px 16px",
                        marginTop: 12,
                      }}
                    >
                      {q.options.map((o) => {
                        const isCorrect = o.id === q.correct;
                        return (
                          <div
                            key={o.id}
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "flex-start",
                              padding: "6px 10px",
                              borderRadius: 8,
                              background: isCorrect
                                ? "var(--success-soft)"
                                : "var(--surface-2)",
                              border: `1px solid ${isCorrect ? "var(--success)" : "var(--border)"}`,
                              fontSize: 13,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 700,
                                color: isCorrect
                                  ? "var(--success)"
                                  : "var(--ink-muted)",
                                minWidth: 18,
                              }}
                            >
                              {o.id}.
                            </span>
                            <span style={{ flex: 1 }}>
                              <MathText text={o.text} />
                            </span>
                            {isCorrect && (
                              <Icon name="check" size={13} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill answer hint */}
                  {q.type === "fill" && (
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13,
                      }}
                    >
                      <span className="muted">Đáp án đúng:</span>
                      <b
                        className="mono"
                        style={{
                          color: "var(--success)",
                          fontSize: 15,
                          background: "var(--success-soft)",
                          padding: "2px 10px",
                          borderRadius: 6,
                          border: "1px solid var(--success)",
                        }}
                      >
                        {q.correct}
                      </b>
                      {q.unit && <span className="muted">{q.unit}</span>}
                    </div>
                  )}

                  {/* Model answer / lời giải mẫu — hiển thị cho mọi loại
                      câu có modelAnswer (mcq / fill / essay). Trước đây bị
                      gate "type === essay" → admin không thấy lời giải cho
                      ~600 câu fill, mặc dù học sinh đã thấy ở ResultsView. */}
                  {q.modelAnswer && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        background: "var(--surface-2)",
                        borderRadius: 8,
                        borderLeft: "3px solid var(--success)",
                        fontSize: 13,
                      }}
                    >
                      <div className="eyebrow" style={{ marginBottom: 4 }}>
                        {q.type === "essay" ? "Đáp số / lời giải mẫu" : "Lời giải"}
                      </div>
                      <MathText text={q.modelAnswer} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
