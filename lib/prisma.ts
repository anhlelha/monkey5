import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

const testDatabaseUrl = process.env.READINESS_TEST_DATABASE_URL;
// Next dev keeps globalThis across hot reloads. After `prisma generate` adds a
// model, that global can still contain an older client whose delegate is
// missing (for example `prisma.practiceSetItem === undefined`). Include a
// schema marker and datasource in the cache key, and validate the newest
// delegate before reusing the client.
const prismaCacheKey = `${testDatabaseUrl ?? "default"}:practice-v4-1`;
const cachedClientIsCurrent =
  globalForPrisma.prismaCacheKey === prismaCacheKey &&
  typeof globalForPrisma.prisma?.practiceSetItem?.findMany === "function";

export const prisma =
  (cachedClientIsCurrent ? globalForPrisma.prisma : undefined) ??
  new PrismaClient({
    ...(testDatabaseUrl ? { datasources: { db: { url: testDatabaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaCacheKey = prismaCacheKey;
}
