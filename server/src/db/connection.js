import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const schema = fs
  .readFileSync(new URL("./schema.sql", import.meta.url), "utf8")
  .replace(/\r\n/g, "\n");
const MIGRATION_MARK = "\n-- migrate-then\n";
const mark = schema.indexOf(MIGRATION_MARK);
const initialSchema = mark === -1 ? schema : schema.slice(0, mark);
const afterMigration =
  mark === -1 ? "" : schema.slice(mark + MIGRATION_MARK.length);

let db;

function noteDayFromCreated(createdAt) {
  const parsed = createdAt ? new Date(createdAt) : null;
  const base = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
  return new Date(base.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function ensureNoteDate(database) {
  const table = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notes'",
    )
    .get();
  if (!table) return;
  const names = new Set(
    database
      .prepare("PRAGMA table_info(notes)")
      .all()
      .map((column) => column.name),
  );
  if (!names.has("color")) {
    database.exec(
      "ALTER TABLE notes ADD COLUMN color INTEGER NOT NULL DEFAULT 0 CHECK (color IN (0, 1, 2, 3))",
    );
    database.exec("UPDATE notes SET color = id % 4");
  }
  for (const column of ["position_x", "position_y"]) {
    if (!names.has(column)) {
      database.exec(
        `ALTER TABLE notes ADD COLUMN ${column} INTEGER CHECK (${column} IS NULL OR ${column} BETWEEN 0 AND 20000)`,
      );
    }
  }
  if (!names.has("noted_on")) {
    database.exec("ALTER TABLE notes ADD COLUMN noted_on TEXT");
  }
  const missing = database
    .prepare(
      "SELECT id, created_at FROM notes WHERE noted_on IS NULL OR noted_on = ''",
    )
    .all();
  const update = database.prepare("UPDATE notes SET noted_on = ? WHERE id = ?");
  for (const row of missing)
    update.run(noteDayFromCreated(row.created_at), row.id);
}

function ensureTaskColumns(database) {
  const names = new Set(
    database
      .prepare("PRAGMA table_info(tasks)")
      .all()
      .map((column) => column.name),
  );
  if (!names.has("project_id")) {
    database.exec(
      "ALTER TABLE tasks ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL",
    );
  }
  if (!names.has("completed_at")) {
    database.exec("ALTER TABLE tasks ADD COLUMN completed_at TEXT");
  }
  if (!names.has("outcome_note")) {
    database.exec(
      "ALTER TABLE tasks ADD COLUMN outcome_note TEXT CHECK (outcome_note IS NULL OR length(outcome_note) <= 2000)",
    );
  }
  if (!names.has("outcome_rating")) {
    database.exec(
      "ALTER TABLE tasks ADD COLUMN outcome_rating TEXT CHECK (outcome_rating IS NULL OR outcome_rating IN ('good', 'met', 'improve'))",
    );
  }
}

function migratePriority(database) {
  const priority = database.prepare("PRAGMA table_info(tasks)").all().find((column) => column.name === "priority");
  const { sql } = database.prepare("SELECT sql FROM sqlite_master WHERE name = 'tasks'").get();
  if (!priority.notnull && !sql.includes("'medium'")) return;
  // Rebuild atomically: SQLite cannot drop NOT NULL or change a CHECK with ALTER COLUMN.
  const taskDdl = initialSchema.match(/CREATE TABLE IF NOT EXISTS tasks \([\s\S]*?\n\);/)[0];
  const columns = database.prepare("PRAGMA table_info(tasks)").all().map((column) => column.name);
  const values = columns.map((name) => name === "priority"
    ? "CASE WHEN priority = 'medium' THEN NULL ELSE priority END"
    : `"${name}"`);
  database.transaction(() => {
    database.exec(taskDdl.replace("IF NOT EXISTS tasks", "tasks_next"));
    database.exec(`INSERT INTO tasks_next (${columns.map((name) => `"${name}"`).join(", ")})
      SELECT ${values.join(", ")} FROM tasks`);
    database.exec("DROP TABLE tasks; ALTER TABLE tasks_next RENAME TO tasks");
  })();
}

function openDatabase(file) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const database = new Database(file);
  try {
    database.pragma("foreign_keys = ON");
    database.transaction(() => {
      database.exec(initialSchema);
      ensureTaskColumns(database);
      ensureNoteDate(database);
      migratePriority(database);
      if (afterMigration.trim()) database.exec(afterMigration);
    })();
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

export function getDb() {
  if (db) return db;
  const file = process.env.DATABASE_PATH;
  if (!file) throw new Error("Thiếu DATABASE_PATH");
  try {
    db = openDatabase(file);
  } catch (err) {
    // shortcut: đĩa image trên Vercel có thể không ghi được; /tmp mất khi instance tắt.
    const storageError = ["EACCES", "EROFS", "SQLITE_CANTOPEN", "SQLITE_READONLY"].some((code) => err.code?.startsWith(code));
    if ((!process.env.VERCEL && !process.env.VERCEL_ENV) || !storageError) throw err;
    console.error(err);
    db = openDatabase("/tmp/app.db");
  }
  return db;
}

export function closeDb() {
  if (!db) return;
  db.close();
  db = null;
}
