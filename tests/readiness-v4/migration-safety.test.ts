import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assertSafeMigrationFiles, looksLikeProductionTarget, validateMigrationSql, verifyBackup } from "../../lib/readiness-v4/migration-safety";

test("migration safety rejects destructive SQL", () => {
  const findings = validateMigrationSql("unsafe.sql", "DROP TABLE User;");
  assert.equal(findings.some((finding) => finding.severity === "error"), true);
});

test("migration safety allows additive ALTER TABLE ADD COLUMN", () => {
  const findings = validateMigrationSql("additive.sql", 'ALTER TABLE "AppSetting" ADD COLUMN "readinessV4ReadEnabled" BOOLEAN NOT NULL DEFAULT false;');
  assert.equal(findings.some((finding) => finding.severity === "error"), false);
});

test("production-like targets are rejected", () => {
  assert.equal(looksLikeProductionTarget("production"), true);
  assert.equal(looksLikeProductionTarget("/tmp/monkey5-local.db"), false);
});

test("backup verification compares exact file hashes", () => {
  const directory = mkdtempSync(join(tmpdir(), "monkey5-safety-"));
  const original = join(directory, "original.db");
  const backup = join(directory, "backup.db");
  writeFileSync(original, "database-content");
  writeFileSync(backup, "database-content");
  assert.equal(verifyBackup(original, backup).ok, true);
  writeFileSync(backup, "changed-content");
  assert.equal(verifyBackup(original, backup).ok, false);
});

test("checked-in migration files pass the safety inventory", () => {
  const directory = join(process.cwd(), "prisma", "migrations");
  const findings = assertSafeMigrationFiles([
    join(directory, "20260825000000_schema_baseline", "migration.sql"),
    join(directory, "20260826000000_readiness_v4_additive", "migration.sql"),
  ]);
  assert.equal(findings.some((finding) => finding.severity === "error"), false);
});
