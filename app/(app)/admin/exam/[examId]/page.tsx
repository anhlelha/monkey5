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
import { MATH_ANALYTICAL_TOPICS } from "@/lib/readiness-v4/analytical-topics";
import { questionContentHash } from "@/lib/readiness-v4/hashing";
import { MATH_TAXONOMY_VERSION } from "@/lib/readiness-v4/types";
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

type V4AssessmentState = "current" | "inherited" | "stale" | "missing";

interface V4AssessmentView {
  state: V4AssessmentState;
  topicPrimary?: string;
  topicSecondary?: string[];
  difficultyBand?: number;
  cognitiveLevel?: string;
  reasoningType?: string;
  confidence?: number;
  model?: string;
  sourceRunId?: string;
  taxonomyVersion?: string;
  assessedAt?: Date;
}

const ANALYTICAL_TOPIC_BY_ID = new Map(MATH_ANALYTICAL_TOPICS.map((topic) => [topic.id, topic]));

const COGNITIVE_LABELS: Record<string, string> = {
  co_ban: "Cơ bản",
  van_dung: "Vận dụng",
  nang_cao: "Nâng cao",
  chuyen_sau: "Chuyên sâu",
};

const REASONING_LABELS: Record<string, string> = {
  direct: "Trực tiếp",
  multi_step: "Nhiều bước",
  non_routine: "Phi chuẩn",
  proof_or_modeling: "Chứng minh / mô hình",
};

function parseStringArray(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function humanize(value: string | undefined, labels: Record<string, string>): string {
  if (!value) return "—";
  return labels[value] ?? value.replaceAll("_", " ");
}

function confidencePercent(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  const percent = value <= 1 ? value * 100 : value;
  return Math.round(Math.max(0, Math.min(100, percent)));
}

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

  // V4 assessments are additive: select only rows from approved runs in the
  // active math taxonomy. A cloned question may inherit its source assessment,
  // but only while its assessment-relevant content hash still matches.
  const approvedRuns = exam.subject === "math"
    ? await prisma.assessmentRun.findMany({
        where: {
          subject: "math",
          taxonomyVersion: MATH_TAXONOMY_VERSION,
          status: "approved",
        },
        orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
      })
    : [];
  const runRank = new Map(approvedRuns.map((run, index) => [run.id, index]));
  const assessmentQuestionIds = [
    ...new Set(
      exam.questions.flatMap((question) =>
        question.sourceQuestionId ? [question.id, question.sourceQuestionId] : [question.id],
      ),
    ),
  ];
  const assessmentRows = approvedRuns.length > 0 && assessmentQuestionIds.length > 0
    ? await prisma.questionAssessment.findMany({
        where: {
          questionId: { in: assessmentQuestionIds },
          taxonomyVersion: MATH_TAXONOMY_VERSION,
          sourceRunId: { in: approvedRuns.map((run) => run.id) },
        },
      })
    : [];
  assessmentRows.sort(
    (left, right) =>
      (runRank.get(left.sourceRunId) ?? Number.MAX_SAFE_INTEGER) -
      (runRank.get(right.sourceRunId) ?? Number.MAX_SAFE_INTEGER),
  );
  const assessmentByCanonicalQuestionId = new Map<string, (typeof assessmentRows)[number]>();
  for (const assessment of assessmentRows) {
    if (!assessmentByCanonicalQuestionId.has(assessment.questionId)) {
      assessmentByCanonicalQuestionId.set(assessment.questionId, assessment);
    }
  }

  const v4AssessmentByQuestionId = new Map<string, V4AssessmentView>();
  for (const question of exam.questions) {
    const direct = assessmentByCanonicalQuestionId.get(question.id);
    const inherited = question.sourceQuestionId
      ? assessmentByCanonicalQuestionId.get(question.sourceQuestionId)
      : undefined;
    const assessment = direct ?? inherited;
    if (!assessment) {
      v4AssessmentByQuestionId.set(question.id, { state: "missing" });
      continue;
    }
    const isFresh = questionContentHash(question) === assessment.questionContentHash;
    v4AssessmentByQuestionId.set(question.id, {
      state: isFresh ? (direct ? "current" : "inherited") : "stale",
      topicPrimary: assessment.topicPrimary,
      topicSecondary: parseStringArray(assessment.topicSecondaryJson),
      difficultyBand: assessment.difficultyBand,
      cognitiveLevel: assessment.cognitiveLevel,
      reasoningType: assessment.reasoningType,
      confidence: assessment.confidence,
      model: assessment.model,
      sourceRunId: assessment.sourceRunId,
      taxonomyVersion: assessment.taxonomyVersion,
      assessedAt: assessment.assessedAt,
    });
  }

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
  const v4Views = [...v4AssessmentByQuestionId.values()];
  const v4CurrentCount = v4Views.filter((view) => view.state === "current" || view.state === "inherited").length;
  const v4StaleCount = v4Views.filter((view) => view.state === "stale").length;
  const v4MissingCount = v4Views.filter((view) => view.state === "missing").length;
  const v4RunIds = [...new Set(v4Views.map((view) => view.sourceRunId).filter((id): id is string => Boolean(id)))];

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

        {exam.subject === "math" && (
          <div
            style={{
              background: v4CurrentCount === questions.length
                ? "oklch(0.97 0.02 145)"
                : "oklch(0.97 0.025 80)",
              border: `1px solid ${v4CurrentCount === questions.length ? "oklch(0.85 0.05 145)" : "oklch(0.84 0.08 80)"}`,
              borderRadius: 14,
              padding: "16px 22px",
              marginBottom: 24,
            }}
          >
            <div className="row between" style={{ gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="row" style={{ gap: 8, marginBottom: 5 }}>
                  <Pill tone="green">Readiness V4</Pill>
                  <b style={{ fontSize: 14 }}>Assessment coverage: {v4CurrentCount}/{questions.length} câu hợp lệ</b>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Taxonomy 13 topic: <code>{MATH_TAXONOMY_VERSION}</code>
                  {v4RunIds.length > 0 ? ` · ${v4RunIds.length} approved run` : " · chưa có approved run phù hợp"}
                </div>
              </div>
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                <Pill tone="green">Hợp lệ {v4CurrentCount}</Pill>
                {v4StaleCount > 0 && <Pill tone="red">Lỗi thời {v4StaleCount}</Pill>}
                {v4MissingCount > 0 && <Pill tone="amber">Chưa đánh giá {v4MissingCount}</Pill>}
              </div>
            </div>
          </div>
        )}

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
            const v4 = v4AssessmentByQuestionId.get(q.id);
            const v4Topic = v4?.topicPrimary ? ANALYTICAL_TOPIC_BY_ID.get(v4.topicPrimary) : undefined;
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
                    {v4 && v4.state !== "missing" ? (
                      <>
                        <Pill tone="green">V4 · {v4Topic?.name ?? v4.topicPrimary}</Pill>
                        <Pill tone={(v4.difficultyBand ?? 0) >= 4 ? "red" : v4.difficultyBand === 3 ? "amber" : ""}>
                          D{v4.difficultyBand}
                        </Pill>
                        <Pill>{humanize(v4.cognitiveLevel, COGNITIVE_LABELS)}</Pill>
                        <Pill>{humanize(v4.reasoningType, REASONING_LABELS)}</Pill>
                        <Pill>{confidencePercent(v4.confidence)}% tin cậy</Pill>
                        <Pill tone={v4.state === "stale" ? "red" : "green"}>
                          {v4.state === "stale" ? "V4 lỗi thời" : v4.state === "inherited" ? "V4 kế thừa" : "V4 hiện hành"}
                        </Pill>
                      </>
                    ) : (
                      <Pill tone="amber">Chưa có assessment V4</Pill>
                    )}
                    {q.source && (
                      <Pill tone={q.source.startsWith("Trích đề") ? "cg" : ""}>
                        <Icon name="school" size={11} /> {q.source}
                      </Pill>
                    )}
                  </div>

                  <div className="muted" style={{ fontSize: 11, marginBottom: 8, paddingRight: 110 }}>
                    Legacy: <span style={{ color: topic.color }}>{topic.short}</span> · {q.grade}
                    {v4?.sourceRunId && (
                      <> · Run <code>{v4.sourceRunId}</code> · Model <code>{v4.model}</code></>
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
