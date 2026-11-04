import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
const MIGRATION_MARK = "\n-- migrate-then\n";
const mark = schema.indexOf(MIGRATION_MARK);
const initialSchema = mark === -1 ? schema : schema.slice(0, mark);
const afterMigration = mark === -1 ? "" : schema.slice(mark + MIGRATION_MARK.length);

let db;

function noteDayFromCreated(createdAt) {
  const parsed = createdAt ? new Date(createdAt) : null;
  const base = parsed && !Number.isNaN(parsed.getTime()) ? parsed : new Date();
  return new Date(base.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function ensureNoteDate(database) {
  const table = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'notes'").get();
  if (!table) return;
  const names = new Set(database.prepare("PRAGMA table_info(notes)").all().map((column) => column.name));
  if (!names.has("noted_on")) {
    database.exec("ALTER TABLE notes ADD COLUMN noted_on TEXT");
  }
  const missing = database.prepare("SELECT id, created_at FROM notes WHERE noted_on IS NULL OR noted_on = ''").all();
  const update = database.prepare("UPDATE notes SET noted_on = ? WHERE id = ?");
  for (const row of missing) update.run(noteDayFromCreated(row.created_at), row.id);
}

function ensureTaskColumns(database) {
  const names = new Set(database.prepare("PRAGMA table_info(tasks)").all().map((column) => column.name));
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

export function getDb() {
  if (db) return db;
  const file = process.env.DATABASE_PATH;
  if (!file) throw new Error("Thiếu DATABASE_PATH");
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  db = new Database(file);
  db.pragma("foreign_keys = ON");
  db.exec(initialSchema);
  ensureTaskColumns(db);
  ensureNoteDate(db);
  if (afterMigration.trim()) db.exec(afterMigration);
  return db;
}

export function closeDb() {
  if (!db) return;
  db.close();
  db = null;
}
