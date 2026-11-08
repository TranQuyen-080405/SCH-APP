import { HttpError } from "../errors.js";
import * as noteRepository from "../repositories/noteRepository.js";
import { asObject, isCalendarDate, parseId } from "../validation.js";

function parseTitle(title) {
  if (typeof title !== "string")
    throw new HttpError(400, "Tiêu đề ghi chú không hợp lệ");
  if (title.length > 120)
    throw new HttpError(400, "Tiêu đề không được dài quá 120 ký tự");
  return title.trim();
}

function parseContent(content) {
  if (typeof content !== "string")
    throw new HttpError(400, "Nội dung ghi chú không hợp lệ");
  if (content.length > 10000)
    throw new HttpError(400, "Nội dung không được dài quá 10000 ký tự");
  return content.trim();
}

function assertText(title, content) {
  if (title === "" && content === "") {
    throw new HttpError(400, "Cần có tiêu đề hoặc nội dung");
  }
}

function todayIso(now = new Date()) {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function parseNotedOn(value) {
  if (!isCalendarDate(value))
    throw new HttpError(400, "Ngày ghi chú không hợp lệ");
  return value;
}

function parseColor(value) {
  if (!Number.isInteger(value) || value < 0 || value > 3) {
    throw new HttpError(400, "Màu ghi chú không hợp lệ");
  }
  return value;
}

function parsePosition(value) {
  if (value === null) return null;
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![value.x, value.y].every(
      (coordinate) =>
        Number.isInteger(coordinate) && coordinate >= 0 && coordinate <= 20000,
    )
  ) {
    throw new HttpError(400, "Vị trí ghi chú không hợp lệ");
  }
  return { x: value.x, y: value.y };
}

export function list(userId) {
  return noteRepository.list(userId);
}

export function create(userId, body) {
  const raw = asObject(body);
  const title = Object.hasOwn(raw, "title") ? parseTitle(raw.title) : "";
  const content = Object.hasOwn(raw, "content")
    ? parseContent(raw.content)
    : "";
  const notedOn = Object.hasOwn(raw, "notedOn")
    ? parseNotedOn(raw.notedOn)
    : todayIso();
  const color = Object.hasOwn(raw, "color") ? parseColor(raw.color) : 0;
  const position = Object.hasOwn(raw, "position")
    ? parsePosition(raw.position)
    : null;
  assertText(title, content);
  return noteRepository.create({
    userId,
    title,
    content,
    notedOn,
    color,
    position,
  });
}

export function update(userId, idRaw, body) {
  const id = parseId(idRaw);
  const current = noteRepository.findOwned({ userId, id });
  if (!current) throw new HttpError(404, "Không tìm thấy ghi chú");
  const raw = asObject(body);
  const title = Object.hasOwn(raw, "title")
    ? parseTitle(raw.title)
    : current.title;
  const content = Object.hasOwn(raw, "content")
    ? parseContent(raw.content)
    : current.content;
  const notedOn = Object.hasOwn(raw, "notedOn")
    ? parseNotedOn(raw.notedOn)
    : current.notedOn;
  const color = Object.hasOwn(raw, "color")
    ? parseColor(raw.color)
    : current.color;
  const position = Object.hasOwn(raw, "position")
    ? parsePosition(raw.position)
    : current.position;
  assertText(title, content);
  if (
    !["title", "content", "notedOn", "color", "position"].some((field) =>
      Object.hasOwn(raw, field),
    )
  ) {
    return current;
  }
  const note = noteRepository.update({
    userId,
    id,
    title,
    content,
    notedOn,
    color,
    position,
  });
  if (!note) throw new HttpError(404, "Không tìm thấy ghi chú");
  return note;
}

export function remove(userId, idRaw) {
  if (!noteRepository.deleteByOwner({ userId, id: parseId(idRaw) })) {
    throw new HttpError(404, "Không tìm thấy ghi chú");
  }
}
