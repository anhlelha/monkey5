import { prisma } from "../../lib/prisma";
import { MATH_TAXONOMY_VERSION } from "../../lib/readiness-v4/types";

const mappings: Array<{ taxonomyTopic: string; contentTopic: string; priority: number }> = [
  { taxonomyTopic: "counting_combinatorics", contentTopic: "log", priority: 100 },
  { taxonomyTopic: "data_probability", contentTopic: "xs", priority: 100 },
  { taxonomyTopic: "frac_decimal", contentTopic: "phan", priority: 100 },
  { taxonomyTopic: "logic_strategy", contentTopic: "log", priority: 100 },
  { taxonomyTopic: "measurement", contentTopic: "do", priority: 100 },
  { taxonomyTopic: "motion", contentTopic: "cd", priority: 100 },
  { taxonomyTopic: "num_div", contentTopic: "soh", priority: 100 },
  { taxonomyTopic: "plane_geometry", contentTopic: "hinh", priority: 100 },
  { taxonomyTopic: "ratio_percent", contentTopic: "phan", priority: 100 },
  { taxonomyTopic: "ratio_percent", contentTopic: "ti", priority: 90 },
  { taxonomyTopic: "sequence_pattern", contentTopic: "soh", priority: 100 },
  { taxonomyTopic: "sequence_pattern", contentTopic: "log", priority: 90 },
  { taxonomyTopic: "solid_geometry", contentTopic: "hinh", priority: 100 },
  { taxonomyTopic: "time_calendar", contentTopic: "tg", priority: 100 },
  { taxonomyTopic: "work_rate", contentTopic: "ti", priority: 100 },
];

async function main(): Promise<void> {
  await prisma.contentTaxonomyMapping.updateMany({
    where: {
      subject: "math",
      taxonomyVersion: { not: MATH_TAXONOMY_VERSION },
      taxonomyTopic: { in: [...new Set(mappings.map((mapping) => mapping.taxonomyTopic))] },
      enabled: true,
    },
    data: { enabled: false },
  });
  for (const mapping of mappings) {
    await prisma.contentTaxonomyMapping.upsert({
      where: {
        subject_taxonomyVersion_taxonomyTopic_contentTopic: {
          subject: "math",
          taxonomyVersion: MATH_TAXONOMY_VERSION,
          taxonomyTopic: mapping.taxonomyTopic,
          contentTopic: mapping.contentTopic,
        },
      },
      create: {
        subject: "math",
        taxonomyVersion: MATH_TAXONOMY_VERSION,
        ...mapping,
      },
      update: { priority: mapping.priority },
    });
  }
  console.log(JSON.stringify({ mappings: mappings.length, taxonomyTopics: new Set(mappings.map((row) => row.taxonomyTopic)).size }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
