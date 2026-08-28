import { prisma } from "../prisma";
import { policyFromRow } from "./policy-repository";
import { rankReadinessRecommendations, type ReadinessRecommendation } from "./recommendation-engine";
import { computeReadinessV4 } from "./readiness-engine";
import { profileFromRow } from "./snapshot-service";
import type { MasteryV4Result } from "./types";

export interface LinkedReadinessRecommendation extends ReadinessRecommendation {
  contentTopic: string | null;
  deepLink: string | null;
}

function parse<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

export async function getSnapshotRecommendations(
  readinessSnapshotId: string,
  limit = 3,
  school?: string,
): Promise<LinkedReadinessRecommendation[]> {
  const snapshot = await prisma.readinessSnapshot.findUniqueOrThrow({ where: { id: readinessSnapshotId } });
  const [masteryRow, profileRow, policyRow] = await Promise.all([
    prisma.masterySnapshot.findUniqueOrThrow({ where: { id: snapshot.masterySnapshotId } }),
    prisma.schoolProfileVersion.findUniqueOrThrow({ where: { id: snapshot.profileVersionId } }),
    prisma.readinessPolicyVersion.findUniqueOrThrow({ where: { id: snapshot.policyVersionId } }),
  ]);
  const mastery: MasteryV4Result = {
    cells: parse(masteryRow.cellsJson, {}),
    cognitiveSummary: parse(masteryRow.cognitiveSummaryJson, {}),
    coverageSummary: parse(masteryRow.coverageSummaryJson, { answeredFacts: 0, assessedFacts: 0, unverifiedCellCount: 0 }),
  };
  const result = computeReadinessV4(mastery, profileFromRow(profileRow), policyFromRow(policyRow));
  const ranked = rankReadinessRecommendations(result, { limit });
  const mappings = await prisma.contentTaxonomyMapping.findMany({
    where: {
      subject: "math",
      taxonomyVersion: profileRow.taxonomyVersion,
      taxonomyTopic: { in: ranked.map((row) => row.topic) },
      enabled: true,
    },
    orderBy: { priority: "desc" },
  });
  const mappingByTopic = new Map<string, string>();
  for (const mapping of mappings) if (!mappingByTopic.has(mapping.taxonomyTopic)) mappingByTopic.set(mapping.taxonomyTopic, mapping.contentTopic);
  return ranked.map((row) => {
    const contentTopic = mappingByTopic.get(row.topic) ?? null;
    const params = new URLSearchParams({ band: row.band });
    if (school) params.set("school", school);
    return {
      ...row,
      contentTopic,
      deepLink: `/topics/${row.topic}?${params.toString()}`,
    };
  });
}
