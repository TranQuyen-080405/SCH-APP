import { after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const file = path.join(os.tmpdir(), `ptm-seed-${process.pid}-${Date.now()}.db`);
process.env.DATABASE_PATH = file;

const { closeDb, getDb } = await import("../src/db/connection.js");
const { DEMO_NOTE_COUNT, DEMO_TASK_COUNT, seedDemo } = await import("../src/db/seedDemo.js");
const { verifyPassword } = await import("../src/services/password.js");

after(() => {
  closeDb();
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(file + suffix, { force: true });
});

test("seed tài khoản thử một lần, chạy lại không trùng", async () => {
  const db = getDb();
  await seedDemo(db);
  await seedDemo(db);

  const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get("user@example.com");
  assert.ok(user);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users WHERE email = ?").get("user@example.com").n, 1);
  assert.equal(await verifyPassword(user.password_hash, "12345678"), true);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE user_id = ?").get(user.id).n, DEMO_TASK_COUNT);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM notes WHERE user_id = ?").get(user.id).n, DEMO_NOTE_COUNT);

  const novemberDays = db
    .prepare(
      "SELECT COUNT(DISTINCT deadline) AS n FROM tasks WHERE user_id = ? AND deadline LIKE '2026-11-%'",
    )
    .get(user.id).n;
  assert.ok(novemberDays >= 5);

  const noteDays = db
    .prepare("SELECT COUNT(DISTINCT noted_on) AS n FROM notes WHERE user_id = ?")
    .get(user.id).n;
  assert.ok(noteDays >= 6);

  const recentDone = db
    .prepare(
      `SELECT COUNT(*) AS n FROM tasks
       WHERE user_id = ? AND status = 'done'
         AND completed_at >= '2026-10-28T17:00:00.000Z'
         AND completed_at < '2026-11-04T17:00:00.000Z'`,
    )
    .get(user.id).n;
  assert.ok(recentDone >= 4);

  const overdue = db
    .prepare(
      `SELECT COUNT(*) AS n FROM tasks
       WHERE user_id = ? AND status != 'done' AND deadline < '2026-11-04'`,
    )
    .get(user.id).n;
  assert.ok(overdue >= 3);
});
