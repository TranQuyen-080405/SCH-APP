import { HttpError } from "../errors.js";
import * as noteRepository from "../repositories/noteRepository.js";
import { parseId } from "./taskService.js";

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  return {};
}

function parseTitle(title) {
  if (typeof title !== "string") throw new HttpError(400, "Tiêu đề ghi chú không hợp lệ");
  if (title.length > 120) throw new HttpError(400, "Tiêu đề không được dài quá 120 ký tự");
  return title.trim();
}

function parseContent(content) {
  if (typeof content !== "string") throw new HttpError(400, "Nội dung ghi chú không hợp lệ");
  if (content.length > 10000) throw new HttpError(400, "Nội dung không được dài quá 10000 ký tự");
  return content.trim();
}

function assertText(title, content) {
  if (title === "" && content === "") {
    throw new HttpError(400, "Cần có tiêu đề hoặc nội dung");
  }
}

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function todayIso(now = new Date()) {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function parseNotedOn(value) {
  if (!isCalendarDate(value)) throw new HttpError(400, "Ngày ghi chú không hợp lệ");
  return value;
}

export function list(userId) {
  return noteRepository.list(userId);
}

export function get(userId, idRaw) {
  const note = noteRepository.findOwned({ userId, id: parseId(idRaw) });
  if (!note) throw new HttpError(404, "Không tìm thấy ghi chú");
  return note;
}

export function create(userId, body) {
  const raw = asObject(body);
  const title = Object.hasOwn(raw, "title") ? parseTitle(raw.title) : "";
  const content = Object.hasOwn(raw, "content") ? parseContent(raw.content) : "";
  const notedOn = Object.hasOwn(raw, "notedOn") ? parseNotedOn(raw.notedOn) : todayIso();
  assertText(title, content);
  return noteRepository.create({ userId, title, content, notedOn });
}

export function update(userId, idRaw, body) {
  const id = parseId(idRaw);
  const current = noteRepository.findOwned({ userId, id });
  if (!current) throw new HttpError(404, "Không tìm thấy ghi chú");
  const raw = asObject(body);
  const title = Object.hasOwn(raw, "title") ? parseTitle(raw.title) : current.title;
  const content = Object.hasOwn(raw, "content") ? parseContent(raw.content) : current.content;
  const notedOn = Object.hasOwn(raw, "notedOn") ? parseNotedOn(raw.notedOn) : current.notedOn;
  assertText(title, content);
  if (!Object.hasOwn(raw, "title") && !Object.hasOwn(raw, "content") && !Object.hasOwn(raw, "notedOn")) {
    return current;
  }
  const note = noteRepository.update({ userId, id, title, content, notedOn });
  if (!note) throw new HttpError(404, "Không tìm thấy ghi chú");
  return note;
}

export function remove(userId, idRaw) {
  if (!noteRepository.deleteByOwner({ userId, id: parseId(idRaw) })) {
    throw new HttpError(404, "Không tìm thấy ghi chú");
  }
}
