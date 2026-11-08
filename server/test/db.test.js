import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { closeDb, getDb } from "../src/db/connection.js";

const currentSchema = fs.readFileSync(new URL("../src/db/schema.sql", import.meta.url), "utf8");

const file = path.join(
  os.tmpdir(),
  `ptm-schema-${process.pid}-${Date.now()}.db`,
);
process.env.DATABASE_PATH = file;

describe("schema", { concurrency: false }, () => {
  after(() => {
    closeDb();
    for (const suffix of ["", "-wal", "-shm"])
      fs.rmSync(file + suffix, { force: true });
  });

  test("có index theo truy vấn UI, loại index dư", () => {
    const db = getDb();
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((row) => row.name);
    assert.ok(names.includes("idx_tasks_user_created"));
    assert.ok(names.includes("idx_notes_user_day"));
    assert.ok(!names.includes("idx_tasks_user_id"));
    assert.ok(!names.includes("idx_notes_user_updated"));
    assert.ok(names.includes("idx_tasks_user_status"));
    assert.ok(names.includes("idx_tasks_user_completed"));
    assert.equal(db.pragma("foreign_keys", { simple: true }), 1);
  });

  test("migration giữ task cũ và thêm cột", () => {
    closeDb();
    const legacy = path.join(
      os.tmpdir(),
      `ptm-legacy-${process.pid}-${Date.now()}.db`,
    );
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
    sqlite
      .prepare(
        "INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'hash')",
      )
      .run();
    sqlite
      .prepare(
        "INSERT INTO tasks (user_id, title, status) VALUES (1, 'Cũ', 'done')",
      )
      .run();
    sqlite.close();
    const previous = process.env.DATABASE_PATH;
    process.env.DATABASE_PATH = legacy;
    try {
      const db = getDb();
      const names = db
        .prepare("PRAGMA table_info(tasks)")
        .all()
        .map((column) => column.name);
      assert.ok(names.includes("completed_at"));
      assert.ok(names.includes("outcome_note"));
      assert.ok(names.includes("outcome_rating"));
      assert.ok(names.includes("project_id"));
      assert.equal(
        db.prepare("SELECT project_id FROM tasks").get().project_id,
        null,
      );
      const project = db
        .prepare(
          "INSERT INTO projects (user_id, name) VALUES (1, 'Dự án mới') RETURNING id",
        )
        .get();
      db.prepare("UPDATE tasks SET project_id = ?").run(project.id);
      db.prepare("DELETE FROM projects WHERE id = ?").run(project.id);
      assert.equal(
        db.prepare("SELECT project_id FROM tasks").get().project_id,
        null,
      );
      const row = db
        .prepare(
          "SELECT title, status, completed_at, outcome_note, outcome_rating FROM tasks",
        )
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
      for (const suffix of ["", "-wal", "-shm"])
        fs.rmSync(legacy + suffix, { force: true });
    }
  });

  test("migration keeps legacy note text and colors; later opens preserve chosen color and position", () => {
    closeDb();
    const legacy = path.join(
      os.tmpdir(),
      `ptm-note-legacy-${process.pid}-${Date.now()}.db`,
    );
    const sqlite = new Database(legacy);
    sqlite.exec(`
      CREATE TABLE notes (
        id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL,
        title TEXT NOT NULL, content TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      INSERT INTO notes VALUES
        (1, 1, 'Ghi chú cũ', 'Giữ nguyên nội dung', '2026-11-08T01:00:00.000Z', '2026-11-08T01:00:00.000Z'),
        (4, 1, 'Màu vàng', '', '2026-11-08T01:00:00.000Z', '2026-11-08T01:00:00.000Z');
    `);
    sqlite.close();
    const previous = process.env.DATABASE_PATH;
    process.env.DATABASE_PATH = legacy;
    try {
      const db = getDb();
      const note = db.prepare("SELECT * FROM notes WHERE id = 1").get();
      assert.equal(note.title, "Ghi chú cũ");
      assert.equal(note.content, "Giữ nguyên nội dung");
      assert.equal(note.noted_on, "2026-11-08");
      assert.equal(note.color, 1);
      assert.equal(note.position_x, null);
      assert.equal(note.position_y, null);
      assert.equal(note.updated_at, "2026-11-08T01:00:00.000Z");
      assert.equal(
        db.prepare("SELECT color FROM notes WHERE id = 4").get().color,
        0,
      );
      db.prepare(
        "UPDATE notes SET color = 3, position_x = 150, position_y = 400 WHERE id = 1",
      ).run();
      closeDb();
      const saved = getDb()
        .prepare("SELECT color, position_x, position_y FROM notes WHERE id = 1")
        .get();
      assert.deepEqual(saved, { color: 3, position_x: 150, position_y: 400 });
    } finally {
      closeDb();
      process.env.DATABASE_PATH = previous;
      for (const suffix of ["", "-wal", "-shm"])
        fs.rmSync(legacy + suffix, { force: true });
    }
  });

  test("priority migration preserves all records and relations; repeat opens are idempotent", () => {
    closeDb();
    const legacy = path.join(os.tmpdir(), `ptm-priority-${process.pid}-${Date.now()}.db`);
    const sqlite = new Database(legacy);
    sqlite.exec(currentSchema.replace("priority TEXT CHECK (priority IN ('low', 'high'))",
      "priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'))"));
    sqlite.exec(`INSERT INTO users (id,email,password_hash) VALUES (1,'migration@test.local','hash');
      INSERT INTO projects (id,user_id,name) VALUES (5,1,'Project');
      INSERT INTO tasks (id,user_id,project_id,title,priority,status,completed_at,outcome_note,outcome_rating)
      VALUES (10,1,5,'Keep task','medium','done','2026-11-08T01:00:00.000Z','Keep outcome','met'),
             (11,1,5,'High task','high','todo',NULL,NULL,NULL),
             (12,1,NULL,'Low task','low','doing',NULL,NULL,NULL);
      INSERT INTO notes (id,user_id,title,content,noted_on,color,position_x,position_y)
      VALUES (20,1,'Keep note','Text','2026-11-08',3,120,350);`);
    const before = sqlite.prepare("SELECT * FROM tasks ORDER BY id").all();
    const noteBefore = sqlite.prepare("SELECT * FROM notes").all();
    sqlite.close();
    const previous = process.env.DATABASE_PATH;
    process.env.DATABASE_PATH = legacy;
    try {
      const db = getDb();
      assert.deepEqual(db.prepare("SELECT * FROM tasks ORDER BY id").all(),
        before.map((task) => ({ ...task, priority: task.priority === "medium" ? null : task.priority })));
      assert.deepEqual(db.prepare("SELECT * FROM notes").all(), noteBefore);
      assert.deepEqual(db.pragma("foreign_key_check"), []);
      assert.equal(db.prepare("PRAGMA table_info(tasks)").all().find((c) => c.name === "priority").notnull, 0);
      assert.throws(() => db.prepare("UPDATE tasks SET priority = 'medium' WHERE id = 10").run(), /CHECK/);
      closeDb();
      const reopened = getDb();
      assert.equal(reopened.prepare("SELECT priority FROM tasks WHERE id = 10").get().priority, null);
      reopened.prepare("DELETE FROM projects WHERE id = 5").run();
      assert.ok(reopened.prepare("SELECT project_id FROM tasks").all().every((row) => row.project_id === null));
      reopened.prepare("DELETE FROM users WHERE id = 1").run();
      assert.equal(reopened.prepare("SELECT COUNT(*) AS n FROM tasks").get().n, 0);
      assert.equal(reopened.prepare("SELECT COUNT(*) AS n FROM notes").get().n, 0);
    } finally {
      closeDb();
      process.env.DATABASE_PATH = previous;
      fs.rmSync(legacy, { force: true });
    }
  });

  test("failed priority migration rolls back without dropping existing data", () => {
    closeDb();
    const legacy = path.join(os.tmpdir(), `ptm-priority-rollback-${process.pid}-${Date.now()}.db`);
    const sqlite = new Database(legacy);
    sqlite.exec(currentSchema.replace("priority TEXT CHECK (priority IN ('low', 'high'))", "priority TEXT NOT NULL"));
    sqlite.exec(`INSERT INTO users (id,email,password_hash) VALUES (1,'rollback@test.local','hash');
      INSERT INTO tasks (user_id,title,priority) VALUES (1,'Keep invalid legacy row','urgent');`);
    sqlite.close();
    const previous = process.env.DATABASE_PATH;
    const previousVercel = process.env.VERCEL;
    process.env.VERCEL = "1";
    process.env.DATABASE_PATH = legacy;
    try {
      assert.throws(() => getDb(), /CHECK/);
      const original = new Database(legacy);
      assert.equal(original.prepare("SELECT title,priority FROM tasks").get().priority, "urgent");
      assert.equal(original.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'tasks_next'").get().n, 0);
      original.close();
    } finally {
      closeDb();
      process.env.DATABASE_PATH = previous;
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
      fs.rmSync(legacy, { force: true });
    }
  });
});
