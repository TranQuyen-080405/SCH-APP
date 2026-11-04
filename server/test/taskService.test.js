import { after, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { closeDb, getDb } from "../src/db/connection.js";
import * as userRepository from "../src/repositories/userRepository.js";
import * as taskService from "../src/services/taskService.js";

const dbFile = path.join(os.tmpdir(), `ptm-task-svc-${process.pid}.db`);
process.env.DATABASE_PATH = dbFile;

async function httpError(fn) {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  throw new Error("expected throw");
}

describe("task service validation", { concurrency: false }, () => {
  test("tiêu đề trống", async () => {
    const err = await httpError(() => taskService.create(1, { title: "   " }));
    assert.deepEqual([err.status, err.message], [400, "Tiêu đề không được để trống"]);
  });

  test("tiêu đề dài hơn 200", async () => {
    const err = await httpError(() => taskService.create(1, { title: "a".repeat(201) }));
    assert.deepEqual([err.status, err.message], [400, "Tiêu đề không được dài quá 200 ký tự"]);
  });

  test("deadline 2026-02-31", async () => {
    const err = await httpError(() => taskService.create(1, { title: "Việc", deadline: "2026-02-31" }));
    assert.deepEqual([err.status, err.message], [400, "Deadline không phải ngày hợp lệ"]);
  });

  test("status sai", async () => {
    const err = await httpError(() => taskService.create(1, { title: "Việc", status: "open" }));
    assert.deepEqual([err.status, err.message], [400, "Trạng thái không hợp lệ"]);
  });

  test("priority sai", async () => {
    const err = await httpError(() => taskService.create(1, { title: "Việc", priority: "urgent" }));
    assert.deepEqual([err.status, err.message], [400, "Độ ưu tiên không hợp lệ"]);
  });

  test("ghi chú và đánh giá sai", async () => {
    const rating = await httpError(() =>
      taskService.create(1, { title: "Việc", status: "done", outcomeRating: "great" }),
    );
    assert.deepEqual([rating.status, rating.message], [400, "Tự đánh giá không hợp lệ"]);
    const note = await httpError(() =>
      taskService.create(1, { title: "Việc", status: "done", outcomeNote: "a".repeat(2001) }),
    );
    assert.deepEqual([note.status, note.message], [400, "Ghi chú kết quả không được dài quá 2000 ký tự"]);
    const early = await httpError(() => taskService.create(1, { title: "Việc", outcomeNote: "sớm" }));
    assert.deepEqual([early.status, early.message], [400, "Chỉ ghi nhận kết quả khi công việc đã hoàn thành"]);
  });

  test("period sai", async () => {
    const err = await httpError(() => taskService.dashboard(1, { period: "1d" }));
    assert.deepEqual([err.status, err.message], [400, "Khoảng thời gian không hợp lệ"]);
  });

  test("hoàn thành không bắt buộc ghi chú, mở lại giữ ghi chú", async () => {
    const owner = userRepository.create({ email: "own@b.com", passwordHash: "x" });
    const other = userRepository.create({ email: "oth@b.com", passwordHash: "x" });
    const created = taskService.create(owner.id, { title: "Việc" });
    assert.equal(created.completedAt, null);
    assert.equal(created.outcomeNote, null);

    const done = taskService.update(owner.id, String(created.id), {
      status: "done",
      completedAt: "2000-01-01T00:00:00.000Z",
    });
    assert.equal(done.status, "done");
    assert.equal(done.outcomeNote, null);
    assert.notEqual(done.completedAt, "2000-01-01T00:00:00.000Z");
    assert.match(done.completedAt, /^\d{4}-\d{2}-\d{2}T/);

    const kept = taskService.update(owner.id, String(created.id), { title: "Đổi tên" });
    assert.equal(kept.title, "Đổi tên");
    assert.equal(kept.completedAt, done.completedAt);

    const noted = taskService.update(owner.id, String(created.id), {
      outcomeNote: "  Làm xong phần A  ",
      outcomeRating: "met",
    });
    assert.equal(noted.outcomeNote, "Làm xong phần A");
    assert.equal(noted.outcomeRating, "met");
    assert.equal(noted.completedAt, done.completedAt);

    const reopened = taskService.update(owner.id, String(created.id), { status: "todo" });
    assert.equal(reopened.completedAt, null);
    assert.equal(reopened.outcomeNote, "Làm xong phần A");
    assert.equal(reopened.outcomeRating, "met");

    const blocked = await httpError(() =>
      taskService.update(owner.id, String(created.id), { outcomeRating: "good" }),
    );
    assert.equal(blocked.status, 400);
    assert.equal(blocked.message, "Chỉ ghi nhận kết quả khi công việc đã hoàn thành");

    const redone = taskService.update(owner.id, String(created.id), { status: "done" });
    assert.equal(typeof redone.completedAt, "string");
    assert.equal(redone.outcomeNote, "Làm xong phần A");
    assert.equal(redone.outcomeRating, "met");

    const foreign = await httpError(() =>
      taskService.update(other.id, String(created.id), { outcomeNote: "Hack" }),
    );
    assert.equal(foreign.status, 404);
    const still = taskService.list(owner.id, { status: "done" })[0];
    assert.equal(still.outcomeNote, "Làm xong phần A");
  });

  test("dashboard đếm theo +07 và không bịa khi rỗng", () => {
    const now = new Date("2026-11-04T02:00:00.000Z");
    const empty = userRepository.create({ email: "empty@b.com", passwordHash: "x" });
    const blank = taskService.dashboard(empty.id, {}, now);
    assert.equal(blank.period, "7d");
    assert.equal(blank.completed, 0);
    assert.equal(blank.doing, 0);
    assert.equal(blank.overdue, 0);
    assert.deepEqual(blank.completion, { done: 0, total: 0, rate: null });
    assert.deepEqual(
      blank.trend.map((day) => day.date),
      ["2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"],
    );
    assert.ok(blank.trend.every((day) => day.count === 0));
    assert.equal(blank.completedLast7Days, 0);
    assert.equal(blank.doingCount, 0);
    assert.equal(blank.overdueCount, 0);
    assert.equal(blank.completionRate, null);
    assert.equal(blank.dailyCompletions.length, 7);
    assert.deepEqual(blank.recentCompleted, []);

    const owner = userRepository.create({ email: "stats@b.com", passwordHash: "x" });
    const other = userRepository.create({ email: "stats-b@b.com", passwordHash: "x" });
    const insert = getDb().prepare(
      `INSERT INTO tasks (user_id, title, deadline, status, completed_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    insert.run(owner.id, "mốc hôm nay", "2026-11-01", "done", "2026-11-03T17:00:00.000Z");
    insert.run(owner.id, "hôm qua", null, "done", "2026-11-03T16:59:59.000Z");
    insert.run(owner.id, "đầu 7 ngày", null, "done", "2026-10-28T17:00:00.000Z");
    insert.run(owner.id, "ngoài 7 trong 30", null, "done", "2026-10-28T16:59:59.000Z");
    insert.run(owner.id, "ngoài 30", null, "done", "2026-10-05T16:59:59.000Z");
    insert.run(owner.id, "done không mốc", "2026-11-01", "done", null);
    insert.run(owner.id, "doing quá hạn", "2026-11-03", "doing", null);
    insert.run(owner.id, "doing đúng hạn", "2026-11-04", "doing", null);
    insert.run(owner.id, "todo không hạn", null, "todo", null);
    insert.run(owner.id, "todo quá hạn", "2026-11-03", "todo", null);
    insert.run(other.id, "của người khác", "2026-11-01", "done", "2026-11-04T01:00:00.000Z");

    const week = taskService.dashboard(owner.id, { period: "7d" }, now);
    assert.equal(week.completed, 3);
    assert.equal(week.doing, 2);
    assert.equal(week.overdue, 2);
    assert.deepEqual(week.completion, { done: 6, total: 10, rate: 0.6 });
    assert.equal(week.trend.at(-1).count, 1);
    assert.equal(week.trend.find((day) => day.date === "2026-11-03").count, 1);
    assert.equal(week.trend.find((day) => day.date === "2026-10-29").count, 1);
    assert.equal(week.completedLast7Days, 3);
    assert.equal(week.doingCount, 2);
    assert.equal(week.overdueCount, 2);
    assert.equal(week.completionRate, 60);
    assert.equal(week.dailyCompletions.at(-1).count, 1);
    assert.equal(week.recentCompleted.length, 5);
    assert.equal(week.recentCompleted[0].title, "mốc hôm nay");

    const month = taskService.dashboard(owner.id, { period: "30d" }, now);
    assert.equal(month.trend.length, 30);
    assert.equal(month.trend[0].date, "2026-10-06");
    assert.equal(month.completed, 4);
    assert.equal(month.doing, week.doing);
    assert.equal(month.overdue, week.overdue);
    assert.equal(month.completion.rate, week.completion.rate);

    const foreign = taskService.dashboard(other.id, { period: "7d" }, now);
    assert.equal(foreign.completed, 1);
    assert.equal(foreign.completion.total, 1);
    assert.equal(foreign.overdue, 0);
    assert.equal(foreign.recentCompleted.length, 1);
    assert.equal(foreign.completionRate, 100);
  });

  after(() => {
    closeDb();
    for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(dbFile + suffix, { force: true });
  });
});
