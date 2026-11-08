import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";

const file = path.join(
  os.tmpdir(),
  `ptm-projects-${process.pid}-${Date.now()}.db`,
);
process.env.DATABASE_PATH = file;
const { default: app } = await import("../src/app.js");
const { closeDb, getDb } = await import("../src/db/connection.js");
let alice;
let bob;

function clear() {
  closeDb();
  for (const suffix of ["", "-wal", "-shm"])
    fs.rmSync(file + suffix, { force: true });
}
async function account(email) {
  const agent = request.agent(app);
  assert.equal(
    (
      await agent
        .post("/api/auth/register")
        .send({ email, password: "password12", passwordConfirm: "password12" })
    ).status,
    201,
  );
  assert.equal(
    (
      await agent
        .post("/api/auth/login")
        .send({ email, password: "password12" })
    ).status,
    200,
  );
  return agent;
}
async function project(agent = alice, name = "Học tập") {
  const response = await agent
    .post("/api/projects")
    .send({ name, color: "#56bde3" });
  assert.equal(response.status, 201);
  return response.body.project;
}
beforeEach(async () => {
  clear();
  alice = await account("alice@example.com");
  bob = await account("bob@example.com");
});
after(clear);

test("projects require authentication and protect write origins", async () => {
  for (const method of ["get", "post", "patch", "delete"]) {
    assert.equal(
      (
        await request(app)
          [method](
            method === "get" || method === "post"
              ? "/api/projects"
              : "/api/projects/1",
          )
          .send({ name: "Test" })
      ).status,
      401,
    );
  }
  assert.equal(
    (
      await alice
        .post("/api/projects")
        .set("Origin", "https://invalid.example")
        .send({ name: "Test" })
    ).status,
    403,
  );
});

test("project CRUD is scoped to owner and counts only unfinished tasks", async () => {
  const a = await project();
  await project(bob, "Riêng Bob");
  const task = await alice
    .post("/api/tasks")
    .send({ title: "Bài tập", projectId: a.id });
  assert.equal(task.body.task.projectId, a.id);
  let list = await alice.get("/api/projects");
  assert.deepEqual(
    list.body.projects.map((item) => item.name),
    ["Học tập"],
  );
  assert.equal(list.body.projects[0].taskCount, 1);
  const edited = await alice
    .patch(`/api/projects/${a.id}`)
    .send({ name: "Tên mới", color: "#AA55CC", userId: 2 });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.project.color, "#aa55cc");
  assert.equal(edited.body.project.taskCount, 1);
  for (const method of ["patch", "delete"])
    assert.equal(
      (await bob[method](`/api/projects/${a.id}`).send({ name: "Chiếm dự án" }))
        .status,
      404,
    );
  await alice.patch(`/api/tasks/${task.body.task.id}`).send({ status: "done" });
  list = await alice.get("/api/projects");
  assert.equal(list.body.projects[0].taskCount, 0);
});

test("project fields and IDs reject malformed input", async () => {
  for (const name of ["", "  ", "x".repeat(81), 1, null])
    assert.equal(
      (await alice.post("/api/projects").send({ name })).status,
      400,
    );
  for (const color of ["red", "#fff", "#xxxxxx", null, {}])
    assert.equal(
      (await alice.post("/api/projects").send({ name: "Test", color })).status,
      400,
    );
  for (const id of ["0", "-1", "1.5", "abc"])
    assert.equal((await alice.delete(`/api/projects/${id}`)).status, 400);
  assert.deepEqual((await alice.get("/api/projects")).body.projects, []);
});

test("task assignment rejects other users' projects and preserves existing assignment on status updates", async () => {
  const a = await project();
  const b = await project(bob);
  for (const projectId of [0, -1, 1.5, "1", {}, Number.MAX_SAFE_INTEGER + 1])
    assert.equal(
      (await alice.post("/api/tasks").send({ title: "Invalid", projectId }))
        .status,
      400,
    );
  assert.equal(
    (
      await alice
        .post("/api/tasks")
        .send({ title: "Not mine", projectId: b.id })
    ).status,
    404,
  );
  const created = (
    await alice.post("/api/tasks").send({ title: "Bài tập", projectId: a.id })
  ).body.task;
  assert.equal(
    (await alice.patch(`/api/tasks/${created.id}`).send({ projectId: b.id }))
      .status,
    404,
  );
  assert.equal(
    (await alice.patch(`/api/tasks/${created.id}`).send({ status: "doing" }))
      .body.task.projectId,
    a.id,
  );
  assert.equal(
    (await alice.patch(`/api/tasks/${created.id}`).send({ projectId: null }))
      .body.task.projectId,
    null,
  );
  assert.equal(
    (await bob.patch(`/api/tasks/${created.id}`).send({ projectId: b.id }))
      .status,
    404,
  );
});

test("project, priority and status filters combine without leaking other users' tasks", async () => {
  const a = await project();
  await alice
    .post("/api/tasks")
    .send({ title: "Cao", projectId: a.id, priority: "high" });
  await alice
    .post("/api/tasks")
    .send({ title: "Thấp", projectId: a.id, priority: "low" });
  await alice.post("/api/tasks").send({ title: "Chưa chia" });
  await bob.post("/api/tasks").send({ title: "Riêng Bob" });
  assert.deepEqual(
    (
      await alice.get(`/api/tasks?projectId=${a.id}&priority=high&status=todo`)
    ).body.tasks.map((task) => task.title),
    ["Cao"],
  );
  assert.deepEqual(
    (await alice.get("/api/tasks?projectId=none")).body.tasks.map(
      (task) => task.title,
    ),
    ["Chưa chia"],
  );
  assert.equal((await bob.get(`/api/tasks?projectId=${a.id}`)).status, 404);
  assert.equal((await alice.get("/api/tasks?priority=invalid")).status, 400);
  assert.equal((await alice.get("/api/tasks?projectId=invalid")).status, 400);
});

test("deleting a project preserves tasks and unassigns them", async () => {
  const a = await project();
  const created = (
    await alice
      .post("/api/tasks")
      .send({ title: "Giữ lại", projectId: a.id, status: "doing" })
  ).body.task;
  assert.equal((await alice.delete(`/api/projects/${a.id}`)).status, 204);
  const tasks = (await alice.get("/api/tasks?projectId=none")).body.tasks;
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].id, created.id);
  assert.equal(tasks[0].title, "Giữ lại");
  assert.equal(tasks[0].status, "doing");
  assert.equal(tasks[0].projectId, null);
  assert.equal(getDb().prepare("PRAGMA foreign_key_check").get(), undefined);
});
