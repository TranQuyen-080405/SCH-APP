import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";

const file = path.join(
  os.tmpdir(),
  `ptm-notes-${process.pid}-${Date.now()}.db`,
);
process.env.DATABASE_PATH = file;
const { default: app } = await import("../src/app.js");
const { closeDb } = await import("../src/db/connection.js");
let alice;

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
beforeEach(async () => {
  clear();
  alice = await account("alice@example.com");
});
after(clear);

test("note color and position persist; partial moves preserve text, date and color", async () => {
  const created = await alice
    .post("/api/notes")
    .send({
      title: "Ý tưởng",
      content: "Nội dung",
      notedOn: "2026-11-08",
      color: 2,
    });
  assert.equal(created.status, 201);
  assert.equal(created.body.note.color, 2);
  assert.equal(created.body.note.position, null);
  const id = created.body.note.id;
  const moved = await alice
    .patch(`/api/notes/${id}`)
    .send({ position: { x: 120, y: 350 } });
  assert.equal(moved.status, 200);
  assert.deepEqual(moved.body.note.position, { x: 120, y: 350 });
  for (const field of ["title", "content", "notedOn", "color", "createdAt"])
    assert.deepEqual(moved.body.note[field], created.body.note[field]);
  const edited = await alice
    .patch(`/api/notes/${id}`)
    .send({ content: "Đã sửa", color: 3 });
  assert.equal(edited.status, 200);
  assert.deepEqual(edited.body.note.position, { x: 120, y: 350 });
  assert.equal((await alice.get("/api/notes")).body.notes[0].color, 3);
  closeDb();
  assert.deepEqual((await alice.get("/api/notes")).body.notes.find((note) => note.id === id).position, {
    x: 120,
    y: 350,
  });
  const reset = await alice.patch(`/api/notes/${id}`).send({ position: null });
  assert.equal(reset.body.note.position, null);
  assert.equal(reset.body.note.content, "Đã sửa");
});

test("note defaults and color/position validation reject malformed values without changing data", async () => {
  const created = await alice.post("/api/notes").send({ title: "Ghi chú" });
  assert.equal(created.body.note.color, 0);
  const id = created.body.note.id;
  for (const color of [-1, 4, "2", null, 1.5, true]) {
    const response = await alice.patch(`/api/notes/${id}`).send({ color });
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Màu ghi chú không hợp lệ");
    assert.equal(
      (await alice.post("/api/notes").send({ title: "Sai", color })).status,
      400,
    );
  }
  for (const position of [
    {},
    [],
    "0,0",
    { x: 1 },
    { x: -1, y: 0 },
    { x: 0.1, y: 2 },
    { x: 0, y: 20001 },
    { x: "0", y: 0 },
  ]) {
    const response = await alice.patch(`/api/notes/${id}`).send({ position });
    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Vị trí ghi chú không hợp lệ");
    assert.equal(
      (await alice.post("/api/notes").send({ title: "Sai", position })).status,
      400,
    );
  }
  assert.deepEqual(
    (await alice.get("/api/notes")).body.notes.find((note) => note.id === id),
    created.body.note,
  );
});

test("moving and recoloring notes require the owner, authentication and a valid origin", async () => {
  const bob = await account("bob@example.com");
  const note = (
    await alice.post("/api/notes").send({ title: "Riêng tư", color: 1 })
  ).body.note;
  const body = { color: 2, position: { x: 50, y: 60 } };
  assert.equal(
    (await request(app).patch(`/api/notes/${note.id}`).send(body)).status,
    401,
  );
  assert.equal(
    (await bob.patch(`/api/notes/${note.id}`).send(body)).status,
    404,
  );
  assert.equal(
    (
      await alice
        .patch(`/api/notes/${note.id}`)
        .set("Origin", "https://invalid.example")
        .send(body)
    ).status,
    403,
  );
  assert.deepEqual((await alice.get("/api/notes")).body.notes.find((item) => item.id === note.id), note);
  assert.deepEqual((await bob.get("/api/notes")).body.notes, []);
});

test("removed note detail route returns JSON 404; list still opens the full note", async () => {
  const created = await alice.post("/api/notes").send({ title: "From list", content: "Full content" });
  const id = created.body.note.id;
  const oldDetail = await alice.get(`/api/notes/${id}`);
  assert.equal(oldDetail.status, 404);
  assert.deepEqual(oldDetail.body, { error: "Không tìm thấy API" });
  assert.deepEqual((await alice.get("/api/notes")).body.notes.find((note) => note.id === id), created.body.note);
});
