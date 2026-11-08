import assert from "node:assert/strict";
import { test } from "node:test";
import request from "supertest";
import app from "../src/app.js";

test("CORS permits credentialed JSON requests only from CLIENT_ORIGIN", async () => {
  const origin = process.env.CLIENT_ORIGIN;
  assert.ok(origin);
  const allowed = await request(app)
    .options("/api/tasks")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "PATCH")
    .set("Access-Control-Request-Headers", "content-type");
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers["access-control-allow-origin"], origin);
  assert.equal(allowed.headers["access-control-allow-credentials"], "true");
  assert.match(allowed.headers["access-control-allow-methods"], /PATCH/);
  assert.equal(allowed.headers["access-control-allow-headers"], "Content-Type");
  assert.match(allowed.headers.vary, /Origin/);

  const denied = await request(app).options("/api/tasks").set("Origin", "https://untrusted.example");
  assert.equal(denied.headers["access-control-allow-origin"], undefined);
  const actual = await request(app).get("/api/tasks").set("Origin", origin);
  assert.equal(actual.status, 401);
  assert.equal(actual.headers["access-control-allow-origin"], origin);
});
