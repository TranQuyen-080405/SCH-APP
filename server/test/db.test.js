import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { closeDb, getDb } from "../src/db/connection.js";

const file = path.join(os.tmpdir(), `ptm-schema-${process.pid}-${Date.now()}.db`);
process.env.DATABASE_PATH = file;

describe("schema", { concurrency: false }, () => {
  after(() => {
    closeDb();
    for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(file + suffix, { force: true });
  });

  test("có index user và user_status", () => {
    const db = getDb();
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((row) => row.name);
    assert.ok(names.includes("idx_tasks_user_id"));
    assert.ok(names.includes("idx_tasks_user_status"));
    assert.ok(names.includes("idx_tasks_user_completed"));
    assert.equal(db.pragma("foreign_keys", { simple: true }), 1);
  });

  test("migration giữ task cũ và thêm cột", () => {
    closeDb();
    const legacy = path.join(os.tmpdir(), `ptm-legacy-${process.pid}-${Date.now()}.db`);
    const sqlite = new Database(legacy);
    sqlite.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL
      );
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        deadline TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'todo',
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    sqlite.prepare("INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'hash')").run();
    sqlite.prepare("INSERT INTO tasks (user_id, title, status) VALUES (1, 'Cũ', 'done')").run();
    sqlite.close();
    const previous = process.env.DATABASE_PATH;
    process.env.DATABASE_PATH = legacy;
    try {
      const db = getDb();
      const names = db.prepare("PRAGMA table_info(tasks)").all().map((column) => column.name);
      assert.ok(names.includes("completed_at"));
      assert.ok(names.includes("outcome_note"));
      assert.ok(names.includes("outcome_rating"));
      const row = db
        .prepare("SELECT title, status, completed_at, outcome_note, outcome_rating FROM tasks")
        .get();
      assert.equal(row.title, "Cũ");
      assert.equal(row.status, "done");
      assert.equal(row.completed_at, null);
      assert.equal(row.outcome_note, null);
      assert.equal(row.outcome_rating, null);
      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
        .all()
        .map((item) => item.name);
      assert.ok(indexes.includes("idx_tasks_user_completed"));
    } finally {
      closeDb();
      process.env.DATABASE_PATH = previous;
      for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(legacy + suffix, { force: true });
    }
  });
});
