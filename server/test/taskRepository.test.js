import { after, afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { closeDb, getDb } from "../src/db/connection.js";
import * as taskRepository from "../src/repositories/taskRepository.js";
import * as userRepository from "../src/repositories/userRepository.js";

let file = path.join(os.tmpdir(), `ptm-repo-${process.pid}-init.db`);
process.env.DATABASE_PATH = file;

function tempFile() {
  return path.join(os.tmpdir(), `ptm-repo-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
}

function removeFile(target) {
  closeDb();
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(target + suffix, { force: true });
}

function user(email) {
  return userRepository.create({ email, passwordHash: "hash" });
}

function task(userId, overrides = {}) {
  return taskRepository.create({
    userId,
    title: "Việc",
    description: "",
    deadline: null,
    priority: "medium",
    status: "todo",
    ...overrides,
  });
}

describe("task repository", { concurrency: false }, () => {
  beforeEach(() => {
    removeFile(file);
    file = tempFile();
    process.env.DATABASE_PATH = file;
  });

  afterEach(() => {
    removeFile(file);
  });

  after(() => {
    removeFile(path.join(os.tmpdir(), `ptm-repo-${process.pid}-init.db`));
  });

  test("list chỉ có task của user", () => {
    const a = user("a@b.com");
    const b = user("b@b.com");
    task(a.id, { title: "A" });
    task(b.id, { title: "B" });
    const rows = taskRepository.list({ userId: a.id, status: null, sort: "created_at", order: "desc" });
    assert.deepEqual(rows.map((row) => row.title), ["A"]);
    assert.equal("userId" in rows[0], false);
  });

  test("lọc status", () => {
    const a = user("a@b.com");
    task(a.id, { title: "Todo", status: "todo" });
    task(a.id, { title: "Doing", status: "doing" });
    const rows = taskRepository.list({ userId: a.id, status: "doing", sort: "created_at", order: "desc" });
    assert.deepEqual(rows.map((row) => row.title), ["Doing"]);
  });

  test("deadline tăng dần, null ở cuối", () => {
    const a = user("a@b.com");
    task(a.id, { title: "không hạn", deadline: null });
    task(a.id, { title: "muộn", deadline: "2026-12-01" });
    task(a.id, { title: "sớm", deadline: "2026-01-01" });
    const rows = taskRepository.list({ userId: a.id, status: null, sort: "deadline", order: "asc" });
    assert.deepEqual(rows.map((row) => row.title), ["sớm", "muộn", "không hạn"]);
  });

  test("priority low < medium < high", () => {
    const a = user("a@b.com");
    task(a.id, { title: "high", priority: "high" });
    task(a.id, { title: "low", priority: "low" });
    task(a.id, { title: "medium", priority: "medium" });
    const rows = taskRepository.list({ userId: a.id, status: null, sort: "priority", order: "asc" });
    assert.deepEqual(rows.map((row) => row.title), ["low", "medium", "high"]);
  });

  test("update và delete của user khác không đổi dòng", () => {
    const a = user("a@b.com");
    const b = user("b@b.com");
    const owned = task(b.id, { title: "Của B", status: "todo" });
    assert.equal(
      taskRepository.update({ userId: a.id, id: owned.id, fields: { title: "Hack", status: "done" } }),
      null,
    );
    assert.equal(taskRepository.delete({ userId: a.id, id: owned.id }), false);
    const still = taskRepository.list({ userId: b.id, status: null, sort: "created_at", order: "desc" });
    assert.equal(still.length, 1);
    assert.equal(still[0].title, "Của B");
    assert.equal(still[0].status, "todo");
  });

  test("list là một câu SQL", () => {
    const a = user("a@b.com");
    task(a.id, { title: "A", status: "todo" });
    const db = getDb();
    const prepare = db.prepare.bind(db);
    const exec = db.exec.bind(db);
    let calls = 0;
    db.prepare = (sql) => {
      calls += 1;
      return prepare(sql);
    };
    db.exec = (sql) => {
      calls += 1;
      return exec(sql);
    };
    try {
      taskRepository.list({ userId: a.id, status: "todo", sort: "deadline", order: "asc" });
      assert.equal(calls, 1);
    } finally {
      db.prepare = prepare;
      db.exec = exec;
    }
  });

  // shortcut: ngưỡng 200ms cho 200 dòng trên máy dev, nâng ngưỡng hoặc số dòng khi máy chậm làm test đỏ oan
  test("list lọc 200 task dưới 200ms", () => {
    const a = user("a@b.com");
    for (let i = 0; i < 200; i += 1) {
      task(a.id, { title: `T${i}`, status: i % 2 === 0 ? "todo" : "doing" });
    }
    const start = performance.now();
    const rows = taskRepository.list({ userId: a.id, status: "todo", sort: "created_at", order: "desc" });
    const elapsed = performance.now() - start;
    assert.equal(rows.length, 100);
    assert.ok(elapsed < 200, `list ${elapsed}ms`);
  });
});
