import { after, afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";

const bootFile = path.join(os.tmpdir(), `ptm-api-boot-${process.pid}.db`);
process.env.DATABASE_PATH = bootFile;

const { default: app } = await import("../src/app.js");
const { closeDb, getDb } = await import("../src/db/connection.js");
const { findByEmail } = await import("../src/repositories/userRepository.js");

const PASSWORD = "matkhau12";
let file = bootFile;

function tempFile() {
  return path.join(os.tmpdir(), `ptm-api-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
}

function removeFile(target) {
  closeDb();
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(target + suffix, { force: true });
}

function register(email) {
  return request(app).post("/api/auth/register").send({
    email,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
  });
}

async function login(email) {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email, password: PASSWORD });
  assert.equal(res.status, 200);
  return agent;
}

describe("api", { concurrency: false }, () => {
  beforeEach(() => {
    removeFile(file);
    file = tempFile();
    process.env.DATABASE_PATH = file;
  });

  afterEach(() => {
    removeFile(file);
  });

  after(() => {
    removeFile(bootFile);
  });

  test("TC01 đăng ký hợp lệ không có cookie", async () => {
    const res = await register("a@b.com");
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, "a@b.com");
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.headers["set-cookie"], undefined);
    assert.equal(findByEmail("a@b.com").email, "a@b.com");
  });

  test("TC02 email trùng", async () => {
    await register("a@b.com");
    const res = await register("a@b.com");
    assert.equal(res.status, 409);
    assert.equal(res.body.error, "Email đã được đăng ký");
  });

  test("TC03 sai mật khẩu không có cookie", async () => {
    await register("a@b.com");
    const res = await request(app).post("/api/auth/login").send({ email: "a@b.com", password: "matkhau13" });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, "Email hoặc mật khẩu không đúng");
    assert.equal(res.headers["set-cookie"], undefined);
  });

  test("TC04 thiếu tiêu đề", async () => {
    await register("a@b.com");
    const agent = await login("a@b.com");
    const res = await agent.post("/api/tasks").send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Tiêu đề không được để trống");
  });

  test("TC05 todo doing done", async () => {
    await register("a@b.com");
    const agent = await login("a@b.com");
    const created = await agent.post("/api/tasks").send({ title: "Việc" });
    assert.equal(created.body.task.status, "todo");
    assert.equal(created.body.task.completedAt, null);
    const doing = await agent.patch(`/api/tasks/${created.body.task.id}`).send({ status: "doing" });
    assert.equal(doing.status, 200);
    assert.equal(doing.body.task.status, "doing");
    assert.equal(doing.body.task.completedAt, null);
    const done = await agent.patch(`/api/tasks/${created.body.task.id}`).send({ status: "done" });
    assert.equal(done.status, 200);
    assert.equal(done.body.task.status, "done");
    assert.equal(typeof done.body.task.completedAt, "string");
  });

  test("TC06 lọc doing của đúng user", async () => {
    await register("a@b.com");
    await register("b@b.com");
    const a = await login("a@b.com");
    const b = await login("b@b.com");
    await a.post("/api/tasks").send({ title: "A-todo", status: "todo" });
    await a.post("/api/tasks").send({ title: "A-doing", status: "doing" });
    await b.post("/api/tasks").send({ title: "B-doing", status: "doing" });
    const res = await a.get("/api/tasks?status=doing");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.tasks.map((task) => task.title), ["A-doing"]);
  });

  test("TC07 deadline tăng dần, không hạn ở cuối", async () => {
    await register("a@b.com");
    const agent = await login("a@b.com");
    await agent.post("/api/tasks").send({ title: "không hạn" });
    await agent.post("/api/tasks").send({ title: "muộn", deadline: "2026-12-01" });
    await agent.post("/api/tasks").send({ title: "sớm", deadline: "2026-01-01" });
    const res = await agent.get("/api/tasks?sort=deadline&order=asc");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.tasks.map((task) => task.title), ["sớm", "muộn", "không hạn"]);
  });

  test("TC08 user A không sửa hoặc xóa task của B", async () => {
    await register("b@b.com");
    const b = await login("b@b.com");
    const created = await b.post("/api/tasks").send({ title: "Của B" });
    const id = created.body.task.id;
    await register("a@b.com");
    const a = await login("a@b.com");
    const patched = await a.patch(`/api/tasks/${id}`).send({ title: "Hack" });
    assert.equal(patched.status, 404);
    assert.equal(patched.body.error, "Không tìm thấy task");
    const deleted = await a.delete(`/api/tasks/${id}`);
    assert.equal(deleted.status, 404);
    const still = await b.get("/api/tasks");
    assert.equal(still.body.tasks[0].title, "Của B");
    assert.equal(still.body.tasks[0].status, "todo");
  });

  test("TC09 khách gọi API task", async () => {
    const get = await request(app).get("/api/tasks");
    const post = await request(app).post("/api/tasks").send({ title: "Việc" });
    const patched = await request(app).patch("/api/tasks/nope").send({ title: "Việc" });
    const deleted = await request(app).delete("/api/tasks/1");
    assert.deepEqual(
      [get.status, post.status, patched.status, deleted.status],
      [401, 401, 401, 401],
    );
    assert.equal(get.body.error, "Chưa đăng nhập");
  });

  test("TC10 xóa task của mình", async () => {
    await register("a@b.com");
    const agent = await login("a@b.com");
    const created = await agent.post("/api/tasks").send({ title: "Xóa" });
    const id = created.body.task.id;
    const deleted = await agent.delete(`/api/tasks/${id}`);
    assert.equal(deleted.status, 204);
    const list = await agent.get("/api/tasks");
    assert.deepEqual(list.body.tasks, []);
  });

  test("AC-OWN list của A không có task của B", async () => {
    await register("a@b.com");
    await register("b@b.com");
    const a = await login("a@b.com");
    const b = await login("b@b.com");
    await a.post("/api/tasks").send({ title: "A1" });
    await b.post("/api/tasks").send({ title: "B1" });
    const res = await a.get("/api/tasks");
    assert.deepEqual(res.body.tasks.map((task) => task.title), ["A1"]);
  });

  test("AC-PART PATCH status giữ title", async () => {
    await register("a@b.com");
    const agent = await login("a@b.com");
    const created = await agent.post("/api/tasks").send({ title: "Giữ nguyên" });
    const res = await agent.patch(`/api/tasks/${created.body.task.id}`).send({ status: "doing" });
    assert.equal(res.status, 200);
    assert.equal(res.body.task.status, "doing");
    assert.equal(res.body.task.title, "Giữ nguyên");
  });

  test("AC-DEF POST chỉ title", async () => {
    await register("a@b.com");
    const agent = await login("a@b.com");
    const res = await agent.post("/api/tasks").send({ title: "Mua sữa" });
    assert.equal(res.status, 201);
    assert.equal(res.body.task.description, "");
    assert.equal(res.body.task.deadline, null);
    assert.equal(res.body.task.priority, null);
    assert.equal(res.body.task.status, "todo");
    assert.equal(res.body.task.completedAt, null);
    assert.equal(res.body.task.outcomeNote, null);
    assert.equal(res.body.task.outcomeRating, null);
    assert.equal("userId" in res.body.task, false);
  });

  test("priority is optional, clears to null, rejects medium and preserves ownership", async () => {
    await register("priority@b.com");
    await register("other-priority@b.com");
    const agent = await login("priority@b.com");
    const other = await login("other-priority@b.com");
    const created = await agent.post("/api/tasks").send({ title: "No tag" });
    const id = created.body.task.id;
    assert.equal(created.body.task.priority, null);
    for (const priority of ["low", "high", null]) {
      const saved = await agent.patch(`/api/tasks/${id}`).send({ priority });
      assert.equal(saved.status, 200);
      assert.equal(saved.body.task.priority, priority);
      assert.equal((await agent.patch(`/api/tasks/${id}`).send({ title: "Keep tag" })).body.task.priority, priority);
    }
    for (const priority of ["medium", "", false, 1]) {
      assert.equal((await agent.post("/api/tasks").send({ title: "Invalid", priority })).status, 400);
      assert.equal((await agent.patch(`/api/tasks/${id}`).send({ priority })).status, 400);
    }
    assert.equal((await agent.get("/api/tasks?priority=medium")).status, 400);
    assert.equal((await other.patch(`/api/tasks/${id}`).send({ priority: "high" })).status, 404);
  });

  test("AC-IGN body userId bị bỏ qua", async () => {
    const registeredB = await register("b@b.com");
    await register("a@b.com");
    const a = await login("a@b.com");
    const created = await a.post("/api/tasks").send({ title: "Của A", userId: registeredB.body.user.id });
    assert.equal(created.status, 201);
    const b = await login("b@b.com");
    assert.deepEqual((await a.get("/api/tasks")).body.tasks.map((task) => task.title), ["Của A"]);
    assert.deepEqual((await b.get("/api/tasks")).body.tasks, []);
  });

  test("AC-QUERY sort=id", async () => {
    await register("a@b.com");
    const agent = await login("a@b.com");
    const res = await agent.get("/api/tasks?sort=id");
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Cột sắp xếp không hợp lệ");
  });

  test("body không phải JSON", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .set("Content-Type", "application/json")
      .send("{");
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Body không phải JSON");
  });

  test("login đúng có cookie sid HttpOnly, logout rồi me 401", async () => {
    await register("a@b.com");
    const agent = request.agent(app);
    const logged = await agent.post("/api/auth/login").send({ email: "a@b.com", password: PASSWORD });
    assert.equal(logged.status, 200);
    assert.match(logged.headers["set-cookie"].join(";"), /sid=/);
    assert.match(logged.headers["set-cookie"].join(";"), /HttpOnly/i);
    const me = await agent.get("/api/auth/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, "a@b.com");
    const out = await agent.post("/api/auth/logout");
    assert.equal(out.status, 204);
    const again = await agent.get("/api/auth/me");
    assert.equal(again.status, 401);
    assert.equal(again.body.error, "Chưa đăng nhập");
  });

  test("Origin lạ thì 403", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://evil.example")
      .send({ email: "a@b.com", password: PASSWORD });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "Nguồn request không hợp lệ");
  });

  test("dashboard khách 401, period sai 400, rỗng không bịa tỷ lệ", async () => {
    const guest = await request(app).get("/api/dashboard");
    assert.equal(guest.status, 401);
    assert.equal(guest.body.error, "Chưa đăng nhập");
    await register("dash@b.com");
    const agent = await login("dash@b.com");
    const ok = await agent.get("/api/dashboard");
    assert.equal(ok.status, 200);
    assert.equal(ok.body.dashboard.completed, 0);
    assert.equal(ok.body.dashboard.completion.rate, null);
    assert.equal(ok.body.dashboard.trend.length, 7);
    assert.ok(ok.body.dashboard.trend.every((day) => day.count === 0));
    assert.deepEqual(ok.body.dashboard.recentCompleted, []);
  });

  test("ghi chú chỉ thuộc chủ, từ chối nội dung trống", async () => {
    const guest = await request(app).get("/api/notes");
    assert.equal(guest.status, 401);
    await register("n1@b.com");
    await register("n2@b.com");
    const a = await login("n1@b.com");
    const b = await login("n2@b.com");
    const empty = await a.post("/api/notes").send({ title: "   ", content: "  " });
    assert.equal(empty.status, 400);
    assert.equal(empty.body.error, "Cần có tiêu đề hoặc nội dung");
    const created = await a.post("/api/notes").send({ title: "Ý tưởng", content: "Viết nhanh", notedOn: "2026-11-04" });
    assert.equal(created.status, 201);
    assert.equal(created.body.note.notedOn, "2026-11-04");
    const badDay = await a.post("/api/notes").send({ title: "Sai ngày", notedOn: "2026-02-31" });
    assert.equal(badDay.status, 400);
    assert.equal(badDay.body.error, "Ngày ghi chú không hợp lệ");
    const id = created.body.note.id;
    const patched = await b.patch(`/api/notes/${id}`).send({ content: "hack" });
    assert.equal(patched.status, 404);
    const dated = await a.patch(`/api/notes/${id}`).send({ notedOn: "2026-10-02" });
    assert.equal(dated.status, 200);
    assert.equal(dated.body.note.notedOn, "2026-10-02");
    await a.post("/api/notes").send({ title: "Mới hơn", notedOn: "2026-11-01" });
    const listed = await a.get("/api/notes");
    assert.equal(listed.body.notes.length, 2);
    assert.deepEqual(
      listed.body.notes.map((note) => note.title),
      ["Mới hơn", "Ý tưởng"],
    );
    const newerId = listed.body.notes[0].id;
    const removed = await a.delete(`/api/notes/${id}`);
    assert.equal(removed.status, 204);
    const left = await a.get("/api/notes");
    assert.equal(left.body.notes.length, 1);
    assert.equal(left.body.notes[0].title, "Mới hơn");
    const removedNewer = await a.delete(`/api/notes/${newerId}`);
    assert.equal(removedNewer.status, 204);
    const afterDelete = await a.get("/api/notes");
    assert.deepEqual(afterDelete.body.notes, []);
  });

  test("ghi nhận kết quả tùy chọn, mở lại giữ ghi chú, dashboard cách ly", async () => {
    await register("a@b.com");
    await register("b@b.com");
    const a = await login("a@b.com");
    const b = await login("b@b.com");
    const created = await a.post("/api/tasks").send({ title: "Việc A" });
    const id = created.body.task.id;
    const done = await a.patch(`/api/tasks/${id}`).send({
      status: "done",
      completedAt: "2000-01-01T00:00:00.000Z",
    });
    assert.equal(done.status, 200);
    assert.equal(done.body.task.outcomeNote, null);
    assert.notEqual(done.body.task.completedAt, "2000-01-01T00:00:00.000Z");
    const stamped = done.body.task.completedAt;
    const bad = await a.patch(`/api/tasks/${id}`).send({ outcomeRating: "great" });
    assert.equal(bad.status, 400);
    assert.equal(bad.body.error, "Tự đánh giá không hợp lệ");
    const noted = await a.patch(`/api/tasks/${id}`).send({
      outcomeNote: "Kết quả thật",
      outcomeRating: "good",
    });
    assert.equal(noted.body.task.outcomeNote, "Kết quả thật");
    assert.equal(noted.body.task.outcomeRating, "good");
    assert.equal(noted.body.task.completedAt, stamped);
    const stolen = await b.patch(`/api/tasks/${id}`).send({ outcomeNote: "Hack" });
    assert.equal(stolen.status, 404);
    const reopened = await a.patch(`/api/tasks/${id}`).send({ status: "todo" });
    assert.equal(reopened.body.task.completedAt, null);
    assert.equal(reopened.body.task.outcomeNote, "Kết quả thật");
    const again = await a.patch(`/api/tasks/${id}`).send({ status: "done" });
    assert.equal(typeof again.body.task.completedAt, "string");
    assert.equal(again.body.task.outcomeNote, "Kết quả thật");
    const dashA = await a.get("/api/dashboard");
    const dashB = await b.get("/api/dashboard");
    assert.equal(dashA.status, 200);
    assert.equal(dashA.body.dashboard.trend.length, 7);
    assert.ok(dashA.body.dashboard.completed >= 1);
    assert.equal(dashB.body.dashboard.completed, 0);
    assert.equal(dashB.body.dashboard.completion.total, 0);
    const listed = await a.get("/api/tasks?status=done");
    assert.equal(listed.body.tasks[0].outcomeNote, "Kết quả thật");
    assert.equal(listed.body.tasks[0].outcomeRating, "good");
  });

  test("sort completed_at đưa task không có mốc xuống cuối", async () => {
    await register("a@b.com");
    const agent = await login("a@b.com");
    const older = await agent.post("/api/tasks").send({ title: "cũ", status: "done" });
    const newer = await agent.post("/api/tasks").send({ title: "mới", status: "done" });
    const legacy = await agent.post("/api/tasks").send({ title: "không mốc", status: "done" });
    const db = getDb();
    db.prepare("UPDATE tasks SET completed_at = ? WHERE id = ?").run("2026-11-01T00:00:00.000Z", older.body.task.id);
    db.prepare("UPDATE tasks SET completed_at = ? WHERE id = ?").run("2026-11-03T00:00:00.000Z", newer.body.task.id);
    db.prepare("UPDATE tasks SET completed_at = NULL WHERE id = ?").run(legacy.body.task.id);
    const dashboard = await agent.get("/api/dashboard");
    assert.deepEqual(dashboard.body.dashboard.recentCompleted.map((task) => task.title), ["mới", "cũ", "không mốc"]);
    assert.deepEqual(Object.keys(dashboard.body.dashboard).sort(), ["completed", "completion", "doing", "overdue", "recentCompleted", "trend"]);
    for (const sort of ["completed_at", "priority", "title"]) {
      assert.equal((await agent.get(`/api/tasks?sort=${sort}`)).status, 400);
    }
  });
});
