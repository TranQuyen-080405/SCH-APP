import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/services/password.js";

test("hash rồi verify đúng, sai một ký tự, và hash không chứa mật khẩu", async () => {
  const hashed = await hashPassword("matkhau12");
  assert.equal(await verifyPassword(hashed, "matkhau12"), true);
  assert.equal(await verifyPassword(hashed, "matkhau13"), false);
  assert.equal(hashed.includes("matkhau12"), false);
});
