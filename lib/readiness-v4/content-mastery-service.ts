import { prisma } from "../prisma";
import { resolveGlobalAssignments } from "./assignment-service";
import { getReadinessV4Flags } from "./feature-flags";
import { DIFFICULTY_BANDS, cellKey, type DifficultyBand, type MasteryCell } from "./types";

export interface EffectiveContentMasteryView {
  contentTopic: string;
  score: number | null;
  total: number;
  correct: number;
  status: "unverified" | "estimated" | "legacy";
  source: "v4" | "legacy-fallback";
  analyticalTopics: string[];
  masterySnapshotId: string | null;
}

export interface EffectiveAnalyticalMasteryView {
  analyticalTopic: string;
  score: number | null;
  total: number;
  correct: number;
  status: "unverified" | "estimated" | "unavailable";
  source: "v4" | "unavailable";
  contentTopic: string | null;
  masterySnapshotId: string | null;
}

function legacyView(contentTopic: string, score: number | undefined): EffectiveContentMasteryView {
  return {
    contentTopic,
    score: typeof score === "number" ? score : null,
    total: 0,
    correct: 0,
    status: "legacy",
    source: "legacy-fallback",
    analyticalTopics: [],
    masterySnapshotId: null,
  };
}

function parseCells(value: string): Record<string, MasteryCell> {
  try {
    return JSON.parse(value) as Record<string, MasteryCell>;
  } catch {
    return {};
  }
}

export async function loadActiveMasteryContext(userId: string) {
  const flags = await getReadinessV4Flags();
  if (!flags.readEnabled) return null;
  const assignments = await resolveGlobalAssignments();
  const profileVersionIds = Object.values(assignments.profileVersionIds);
  if (!assignments.policyVersionId || !profileVersionIds.length) return null;
  const readinessSnapshot = await prisma.readinessSnapshot.findFirst({
    where: {
      userId,
      subject: "math",
      policyVersionId: assignments.policyVersionId,
      profileVersionId: { in: profileVersionIds },
    },
    orderBy: { computedAt: "desc" },
    select: { masterySnapshotId: true },
  });
  if (!readinessSnapshot) return null;
  const [masterySnapshot, policy] = await Promise.all([
    prisma.masterySnapshot.findUnique({ where: { id: readinessSnapshot.masterySnapshotId } }),
    prisma.readinessPolicyVersion.findUnique({ where: { id: assignments.policyVersionId } }),
  ]);
  return masterySnapshot && policy ? { masterySnapshot, policy } : null;
}

export interface EffectiveAnalyticalMasteryCellView {
  analyticalTopic: string;
  band: DifficultyBand;
  score: number | null;
  total: number;
  correct: number;
  status: "unverified" | "estimated" | "unavailable";
  source: "v4" | "unavailable";
  masterySnapshotId: string | null;
}

export async function getEffectiveAnalyticalMasteryCellsV4(
  userId: string,
  analyticalTopicIds: string[],
): Promise<Record<string, EffectiveAnalyticalMasteryCellView>> {
  const context = await loadActiveMasteryContext(userId);
  const keys = analyticalTopicIds.flatMap((topic) =>
    DIFFICULTY_BANDS.map((band) => cellKey(topic, band)),
  );
  if (!context) {
    return Object.fromEntries(keys.map((key) => {
      const [analyticalTopic, band] = key.split("::") as [string, DifficultyBand];
      return [key, {
        analyticalTopic,
        band,
        score: null,
        total: 0,
        correct: 0,
        status: "unavailable",
        source: "unavailable",
        masterySnapshotId: null,
      } satisfies EffectiveAnalyticalMasteryCellView];
    }));
  }

  const cells = parseCells(context.masterySnapshot.cellsJson);
  return Object.fromEntries(keys.map((key) => {
    const [analyticalTopic, band] = key.split("::") as [string, DifficultyBand];
    const cell = cells[key];
    return [key, {
      analyticalTopic,
      band,
      score: cell && cell.total > 0 ? cell.mastery : null,
      total: cell?.total ?? 0,
      correct: cell?.correct ?? 0,
      status: cell && cell.total > 0 ? "estimated" : "unverified",
      source: "v4",
      masterySnapshotId: context.masterySnapshot.id,
    } satisfies EffectiveAnalyticalMasteryCellView];
  }));
}

export async function getEffectiveAnalyticalMasteryV4(
  userId: string,
  analyticalTopicIds: string[],
): Promise<Record<string, EffectiveAnalyticalMasteryView>> {
  const context = await loadActiveMasteryContext(userId);
  const unavailable = () => Object.fromEntries(analyticalTopicIds.map((topic) => [topic, {
    analyticalTopic: topic,
    score: null,
    total: 0,
    correct: 0,
    status: "unavailable",
    source: "unavailable",
    contentTopic: null,
    masterySnapshotId: null,
  } satisfies EffectiveAnalyticalMasteryView]));
  if (!context) return unavailable();

  const mappings = await prisma.contentTaxonomyMapping.findMany({
    where: {
      subject: "math",
      taxonomyVersion: context.masterySnapshot.taxonomyVersion,
      taxonomyTopic: { in: analyticalTopicIds },
      enabled: true,
    },
    orderBy: [{ taxonomyTopic: "asc" }, { priority: "desc" }, { contentTopic: "asc" }],
  });
  const contentTopicByAnalytical = new Map<string, string>();
  for (const mapping of mappings) {
    if (!contentTopicByAnalytical.has(mapping.taxonomyTopic)) {
      contentTopicByAnalytical.set(mapping.taxonomyTopic, mapping.contentTopic);
    }
  }

  const aggregates = new Map<string, { correct: number; total: number }>();
  for (const cell of Object.values(parseCells(context.masterySnapshot.cellsJson))) {
    if (!analyticalTopicIds.includes(cell.topic)) continue;
    const aggregate = aggregates.get(cell.topic) ?? { correct: 0, total: 0 };
    aggregate.correct += cell.correct;
    aggregate.total += cell.total;
    aggregates.set(cell.topic, aggregate);
  }

  return Object.fromEntries(analyticalTopicIds.map((analyticalTopic) => {
    const aggregate = aggregates.get(analyticalTopic) ?? { correct: 0, total: 0 };
    const score = aggregate.total > 0
      ? (aggregate.correct + context.policy.priorStrength * context.policy.priorMastery) /
        (aggregate.total + context.policy.priorStrength)
      : null;
    return [analyticalTopic, {
      analyticalTopic,
      score,
      total: aggregate.total,
      correct: aggregate.correct,
      status: aggregate.total > 0 ? "estimated" : "unverified",
      source: "v4",
      contentTopic: contentTopicByAnalytical.get(analyticalTopic) ?? null,
      masterySnapshotId: context.masterySnapshot.id,
    } satisfies EffectiveAnalyticalMasteryView];
  }));
}

/**
 * Project the active 13-topic analytical mastery snapshot onto the existing
 * 10-topic content navigation. Only the highest-priority mapping for each
 * analytical topic is used, preventing one fact from being counted twice.
 */
export async function getEffectiveContentMasteryV4(
  userId: string,
  contentTopicIds: string[],
  legacyMastery: Record<string, number>,
): Promise<Record<string, EffectiveContentMasteryView>> {
  const fallback = () => Object.fromEntries(
    contentTopicIds.map((topic) => [topic, legacyView(topic, legacyMastery[topic])]),
  );
  const context = await loadActiveMasteryContext(userId);
  if (!context) return fallback();
  const { masterySnapshot, policy } = context;
  const mappings = await prisma.contentTaxonomyMapping.findMany({
    where: { subject: "math", enabled: true, contentTopic: { in: contentTopicIds } },
    orderBy: [{ taxonomyTopic: "asc" }, { priority: "desc" }, { contentTopic: "asc" }],
  });

  const primaryContentByAnalytical = new Map<string, string>();
  for (const mapping of mappings) {
    if (mapping.taxonomyVersion !== masterySnapshot.taxonomyVersion) continue;
    if (!primaryContentByAnalytical.has(mapping.taxonomyTopic)) {
      primaryContentByAnalytical.set(mapping.taxonomyTopic, mapping.contentTopic);
    }
  }

  const aggregates = new Map<string, {
    correct: number;
    total: number;
    analyticalTopics: Set<string>;
  }>();
  for (const cell of Object.values(parseCells(masterySnapshot.cellsJson))) {
    const contentTopic = primaryContentByAnalytical.get(cell.topic);
    if (!contentTopic) continue;
    const aggregate = aggregates.get(contentTopic) ?? {
      correct: 0,
      total: 0,
      analyticalTopics: new Set<string>(),
    };
    aggregate.correct += cell.correct;
    aggregate.total += cell.total;
    aggregate.analyticalTopics.add(cell.topic);
    aggregates.set(contentTopic, aggregate);
  }

  return Object.fromEntries(contentTopicIds.map((contentTopic) => {
    const aggregate = aggregates.get(contentTopic);
    const total = aggregate?.total ?? 0;
    const correct = aggregate?.correct ?? 0;
    const score = total > 0
      ? (correct + policy.priorStrength * policy.priorMastery) / (total + policy.priorStrength)
      : null;
    return [contentTopic, {
      contentTopic,
      score,
      total,
      correct,
      status: total > 0 ? "estimated" : "unverified",
      source: "v4",
      analyticalTopics: [...(aggregate?.analyticalTopics ?? [])].sort(),
      masterySnapshotId: masterySnapshot.id,
    } satisfies EffectiveContentMasteryView];
  }));
}
