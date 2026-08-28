import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { assertSafeMigrationFiles, assertSqliteDatabaseFile, looksLikeProductionTarget, sha256File, verifyBackup } from "../../lib/readiness-v4/migration-safety";

const root = resolve(__dirname, "../..");
const migrationsDir = join(root, "prisma", "migrations");
const defaultDatabase = join(root, "prisma", "dev.db");

type Options = {
  apply: boolean;
  rollbackCheck: boolean;
  database: string;
  backup: string | null;
  backupDir: string;
  target: string;
};

function optionsFromArgv(argv: string[]): Options {
  const value = (name: string): string | null => {
    const prefix = `--${name}=`;
    const arg = argv.find((item) => item.startsWith(prefix));
    return arg ? arg.slice(prefix.length) : null;
  };
  const database = value("database");
  const backup = value("backup");
  const backupDir = value("backup-dir") ?? join(root, ".reports", "migration-backups");
  const target = value("target") ?? "local-dev";
  return {
    apply: argv.includes("--apply"),
    rollbackCheck: argv.includes("--rollback-check"),
    database: database ? (isAbsolute(database) ? database : resolve(root, database)) : defaultDatabase,
    backup: backup ? (isAbsolute(backup) ? backup : resolve(root, backup)) : null,
    backupDir: isAbsolute(backupDir) ? backupDir : resolve(root, backupDir),
    target,
  };
}

function run(command: string, args: string[], options: { allowFailure?: boolean } = {}): string {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    if (options.allowFailure) return error instanceof Error ? error.message : String(error);
    throw error;
  }
}

function sqlite(database: string, sql: string): string {
  return run("sqlite3", [database, sql]);
}

function migrationFiles(): string[] {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(migrationsDir, entry.name, "migration.sql"))
    .filter((file) => existsSync(file))
    .sort();
}

function backupDatabase(database: string, backupDir: string): string {
  mkdirSync(backupDir, { recursive: true });
  sqlite(database, "PRAGMA wal_checkpoint(FULL);");
  const backup = join(backupDir, `dev-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
  copyFileSync(database, backup);
  const verification = verifyBackup(database, backup);
  if (!verification.ok) throw new Error(`Backup verification failed: ${verification.originalHash} != ${verification.backupHash}`);
  console.log(`BACKUP=${backup}`);
  console.log(`BACKUP_SHA256=${verification.backupHash}`);
  return backup;
}

function integrityReport(database: string): { integrity: string; foreignKeys: string; schemaHash: string } {
  const integrity = sqlite(database, "PRAGMA integrity_check;");
  const foreignKeys = sqlite(database, "PRAGMA foreign_key_check;");
  const schema = run("sqlite3", [database, ".schema"]);
  return { integrity, foreignKeys, schemaHash: sha256File(database) + ":schema:" + Buffer.from(schema).toString("base64").slice(0, 32) };
}

function assertCleanDatabase(database: string): void {
  const report = integrityReport(database);
  if (report.integrity !== "ok") throw new Error(`SQLite integrity_check failed: ${report.integrity}`);
  if (report.foreignKeys.trim()) throw new Error(`SQLite foreign_key_check failed: ${report.foreignKeys}`);
  console.log(`INTEGRITY=ok`);
  console.log(`FOREIGN_KEYS=ok`);
  console.log(`SCHEMA_FINGERPRINT=${report.schemaHash}`);
}

function migrationStatus(database: string): void {
  const rows = sqlite(database, "SELECT migration_name || '|' || COALESCE(finished_at, '') || '|' || COALESCE(rolled_back_at, '') FROM _prisma_migrations ORDER BY started_at;");
  console.log(rows ? `MIGRATIONS=\n${rows}` : "MIGRATIONS=table-not-present");
}

function rollbackCheck(database: string, backup: string): void {
  const rehearsal = `${backup}.rollback-rehearsal.db`;
  copyFileSync(backup, rehearsal);
  try {
    console.log(`ROLLBACK_REHEARSAL=${rehearsal}`);
    assertCleanDatabase(rehearsal);
    const applied = sqlite(rehearsal, "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='_prisma_migrations';");
    if (applied !== "1") throw new Error("Rollback rehearsal database has no Prisma migration metadata");
    const migrationDiff = run("npx", ["prisma", "migrate", "diff", "--from-url", `file:${rehearsal}`, "--to-schema-datamodel", "prisma/schema.prisma", "--script"], { allowFailure: true });
    if (migrationDiff && !/empty migration|no difference detected/i.test(migrationDiff)) {
      console.log("ROLLBACK_SCHEMA_DIFF=present");
      console.log(migrationDiff.slice(0, 4000));
    } else {
      console.log("ROLLBACK_SCHEMA_DIFF=none");
    }
  } finally {
    // Keep the rehearsal artifact for manual inspection and release evidence.
  }
}

function main(): void {
  const options = optionsFromArgv(process.argv.slice(2));
  if (looksLikeProductionTarget(options.target) || looksLikeProductionTarget(options.database)) {
    throw new Error("Refusing production-like migration target. Use an explicitly isolated local-dev or release-candidate copy.");
  }
  assertSqliteDatabaseFile(options.database);
  const files = migrationFiles();
  const findings = assertSafeMigrationFiles(files);
  const errors = findings.filter((finding) => finding.severity === "error");
  for (const finding of findings) console.log(`${finding.severity.toUpperCase()} ${finding.file}: ${finding.message}`);
  if (errors.length) throw new Error(`${errors.length} migration safety finding(s) block execution`);
  run("npx", ["prisma", "validate"]);
  assertCleanDatabase(options.database);
  migrationStatus(options.database);

  if (!options.apply) {
    console.log("MODE=dry-run");
    console.log("NEXT=review the output, then pass --apply --target=local-dev to execute migrate deploy");
    if (options.rollbackCheck) rollbackCheck(options.database, options.backup ?? backupDatabase(options.database, options.backupDir));
    return;
  }
  if (options.target !== "local-dev") throw new Error("--apply is restricted to --target=local-dev in this runner");
  const backup = options.backup ?? backupDatabase(options.database, options.backupDir);
  console.log(`APPLYING=local-dev`);
  run("npx", ["prisma", "migrate", "deploy"]);
  assertCleanDatabase(options.database);
  migrationStatus(options.database);
  console.log(`APPLY_COMPLETE=true`);
  console.log(`ROLLBACK_SOURCE=${backup}`);
  if (options.rollbackCheck) rollbackCheck(options.database, backup);
}

main();
