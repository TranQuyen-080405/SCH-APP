import { HttpError } from "../errors.js";
import * as userRepository from "../repositories/userRepository.js";
import { hashPassword, verifyPassword } from "./password.js";

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  return {};
}

function normalizeEmail(email) {
  if (typeof email !== "string" || email.trim() === "") {
    throw new HttpError(400, "Email không được để trống");
  }
  const value = email.trim().toLowerCase();
  const at = value.indexOf("@");
  if (value.length > 254 || at <= 0 || at !== value.lastIndexOf("@") || at === value.length - 1) {
    throw new HttpError(400, "Email không đúng định dạng");
  }
  return value;
}

function assertPassword(password) {
  if (typeof password !== "string") {
    throw new HttpError(400, "Mật khẩu không được để trống");
  }
  if (password.length < 8 || password.length > 128) {
    throw new HttpError(400, "Mật khẩu phải từ 8 đến 128 ký tự");
  }
}

function assertConfirm(password, passwordConfirm) {
  if (typeof passwordConfirm !== "string") {
    throw new HttpError(400, "Xác nhận mật khẩu không được để trống");
  }
  if (passwordConfirm !== password) {
    throw new HttpError(400, "Xác nhận mật khẩu không khớp");
  }
}

export async function register(body) {
  const raw = asObject(body);
  const email = normalizeEmail(raw.email);
  assertPassword(raw.password);
  assertConfirm(raw.password, raw.passwordConfirm);
  if (userRepository.findByEmail(email)) {
    throw new HttpError(409, "Email đã được đăng ký");
  }
  const passwordHash = await hashPassword(raw.password);
  try {
    const user = userRepository.create({ email, passwordHash });
    return { id: user.id, email: user.email };
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new HttpError(409, "Email đã được đăng ký");
    }
    throw err;
  }
}

export async function login(body) {
  const raw = asObject(body);
  if (typeof raw.email !== "string") {
    throw new HttpError(400, "Email không được để trống");
  }
  if (typeof raw.password !== "string") {
    throw new HttpError(400, "Mật khẩu không được để trống");
  }
  const user = userRepository.findByEmail(raw.email.trim().toLowerCase());
  if (!user || !(await verifyPassword(user.passwordHash, raw.password))) {
    throw new HttpError(401, "Email hoặc mật khẩu không đúng");
  }
  return { id: user.id, email: user.email };
}

export function me(userId) {
  if (!userId) throw new HttpError(401, "Chưa đăng nhập");
  const user = userRepository.findById(userId);
  if (!user) throw new HttpError(401, "Chưa đăng nhập");
  return { id: user.id, email: user.email };
}
