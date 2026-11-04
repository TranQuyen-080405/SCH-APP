import { afterEach, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { closeDb } from "../src/db/connection.js";
import * as authService from "../src/services/authService.js";
import * as userRepository from "../src/repositories/userRepository.js";

const PASSWORD = "matkhau12";
let file = path.join(os.tmpdir(), `ptm-auth-${process.pid}-init.db`);
process.env.DATABASE_PATH = file;

function tempFile() {
  return path.join(os.tmpdir(), `ptm-auth-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`);
}

function removeFile(target) {
  closeDb();
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(target + suffix, { force: true });
}

async function httpError(fn) {
  try {
    await fn();
  } catch (err) {
    return err;
  }
  throw new Error("expected throw");
}

describe("auth service", { concurrency: false }, () => {
  beforeEach(() => {
    removeFile(file);
    file = tempFile();
    process.env.DATABASE_PATH = file;
  });

  afterEach(() => {
    removeFile(file);
  });

  test("email trống", async () => {
    const err = await httpError(() =>
      authService.register({ email: "  ", password: PASSWORD, passwordConfirm: PASSWORD }),
    );
    assert.deepEqual([err.status, err.message], [400, "Email không được để trống"]);
  });

  test("email sai định dạng", async () => {
    const err = await httpError(() =>
      authService.register({ email: "khong-co-dau", password: PASSWORD, passwordConfirm: PASSWORD }),
    );
    assert.deepEqual([err.status, err.message], [400, "Email không đúng định dạng"]);
  });

  test("mật khẩu sai độ dài", async () => {
    const err = await httpError(() =>
      authService.register({ email: "a@b.com", password: "1234567", passwordConfirm: "1234567" }),
    );
    assert.deepEqual([err.status, err.message], [400, "Mật khẩu phải từ 8 đến 128 ký tự"]);
  });

  test("xác nhận mật khẩu không khớp", async () => {
    const err = await httpError(() =>
      authService.register({ email: "a@b.com", password: PASSWORD, passwordConfirm: "matkhau13" }),
    );
    assert.deepEqual([err.status, err.message], [400, "Xác nhận mật khẩu không khớp"]);
  });

  test("email trùng 409", async () => {
    await authService.register({ email: "A@B.COM", password: PASSWORD, passwordConfirm: PASSWORD });
    const err = await httpError(() =>
      authService.register({ email: "a@b.com", password: PASSWORD, passwordConfirm: PASSWORD }),
    );
    assert.deepEqual([err.status, err.message], [409, "Email đã được đăng ký"]);
  });

  test("login không có email và sai mật khẩu cùng một câu 401", async () => {
    const unknown = await httpError(() => authService.login({ email: "missing@b.com", password: PASSWORD }));
    await authService.register({ email: "a@b.com", password: PASSWORD, passwordConfirm: PASSWORD });
    const wrong = await httpError(() => authService.login({ email: "a@b.com", password: "matkhau13" }));
    assert.deepEqual(
      [unknown.status, unknown.message, wrong.status, wrong.message],
      [401, "Email hoặc mật khẩu không đúng", 401, "Email hoặc mật khẩu không đúng"],
    );
  });

  test("đăng ký không trả hash, findById không có hash", async () => {
    const user = await authService.register({ email: "A@B.COM", password: PASSWORD, passwordConfirm: PASSWORD });
    assert.equal(user.passwordHash, undefined);
    assert.equal(user.email, "a@b.com");
    const stored = userRepository.findByEmail("a@b.com");
    assert.equal(typeof stored.passwordHash, "string");
    assert.equal(userRepository.findById(user.id).passwordHash, undefined);
  });
});
