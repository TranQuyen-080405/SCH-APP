import { HttpError } from "../errors.js";
import { asObject, parseId } from "../validation.js";
import * as projects from "../repositories/projectRepository.js";

function parseName(value) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 80)
    throw new HttpError(400, "Tên dự án phải từ 1 đến 80 ký tự");
  return value.trim();
}

function parseColor(value) {
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value))
    throw new HttpError(400, "Màu dự án không hợp lệ");
  return value.toLowerCase();
}

export function list(userId) {
  return projects.list(userId);
}

export function create(userId, body) {
  const raw = asObject(body);
  return projects.create(
    userId,
    parseName(raw.name),
    Object.hasOwn(raw, "color") ? parseColor(raw.color) : "#5dcfb8",
  );
}

export function update(userId, idRaw, body) {
  const id = parseId(idRaw);
  if (!projects.findOwned(userId, id))
    throw new HttpError(404, "Không tìm thấy dự án");
  const raw = asObject(body);
  const fields = {};
  if (Object.hasOwn(raw, "name")) fields.name = parseName(raw.name);
  if (Object.hasOwn(raw, "color")) fields.color = parseColor(raw.color);
  return projects.update(userId, id, fields);
}

export function remove(userId, idRaw) {
  if (!projects.remove(userId, parseId(idRaw)))
    throw new HttpError(404, "Không tìm thấy dự án");
}
