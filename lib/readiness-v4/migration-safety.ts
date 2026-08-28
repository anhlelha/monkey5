import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";

const DESTRUCTIVE_SQL = /\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM|UPDATE\s+\w+\s+SET|PRAGMA\s+writable_schema)\b/i;
const SAFE_ALTER = /^\s*ALTER\s+TABLE\s+[^;]+\s+ADD\s+COLUMN\b/im;

export interface MigrationSafetyFinding {
  file: string;
  severity: "error" | "warning";
  message: string;
}

export function validateMigrationSql(file: string, sql: string): MigrationSafetyFinding[] {
  const findings: MigrationSafetyFinding[] = [];
  if (DESTRUCTIVE_SQL.test(sql)) {
    findings.push({ file, severity: "error", message: "Migration contains destructive SQL; require explicit reviewed rollback plan." });
  }
  for (const statement of sql.split(";")) {
    if (/\bALTER\s+TABLE\b/i.test(statement) && !SAFE_ALTER.test(statement)) {
      findings.push({ file, severity: "error", message: "ALTER TABLE statement is not an ADD COLUMN operation." });
    }
  }
  if (!/CREATE\s+(?:TABLE|INDEX|TRIGGER)/i.test(sql)) {
    findings.push({ file, severity: "warning", message: "Migration has no CREATE TABLE/INDEX/TRIGGER statement; review expected scope." });
  }
  return findings;
}

export function assertSafeMigrationFiles(files: string[]): MigrationSafetyFinding[] {
  return files.flatMap((file) => {
    if (!existsSync(file) || !statSync(file).isFile()) return [{ file, severity: "error", message: "Migration file is missing." }];
    return validateMigrationSql(file, readFileSync(file, "utf8"));
  });
}

export function looksLikeProductionTarget(value: string): boolean {
  return /(?:production|prod|live|primary)/i.test(value);
}

export function sha256File(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

export function verifyBackup(original: string, backup: string): { ok: boolean; originalHash: string; backupHash: string } {
  const originalHash = sha256File(original);
  const backupHash = sha256File(backup);
  return { ok: originalHash === backupHash, originalHash, backupHash };
}

export function assertSqliteDatabaseFile(file: string): void {
  if (!existsSync(file)) throw new Error(`SQLite database does not exist: ${file}`);
  if (!statSync(file).isFile()) throw new Error(`SQLite database path is not a file: ${file}`);
}
