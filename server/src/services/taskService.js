import { HttpError } from "../errors.js";
import * as taskRepository from "../repositories/taskRepository.js";

const STATUSES = new Set(["todo", "doing", "done"]);
const PRIORITIES = new Set(["low", "medium", "high"]);
const RATINGS = new Set(["good", "met", "improve"]);
const SORTS = new Set(["created_at", "deadline", "priority", "title", "completed_at"]);
const PERIOD_DAYS = { "7d": 7, "30d": 30 };
// Ngày của tổng quan và mốc quá hạn: Asia/Ho_Chi_Minh, không DST, lệch cố định +07.
const OFFSET_MS = 7 * 60 * 60 * 1000;

function asObject(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  return {};
}

function parseTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new HttpError(400, "Tiêu đề không được để trống");
  }
  const value = title.trim();
  if (value.length > 200) {
    throw new HttpError(400, "Tiêu đề không được dài quá 200 ký tự");
  }
  return value;
}

function parseDescription(description) {
  if (typeof description !== "string") {
    throw new HttpError(400, "Mô tả không hợp lệ");
  }
  if (description.length > 2000) {
    throw new HttpError(400, "Mô tả không được dài quá 2000 ký tự");
  }
  return description;
}

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function parseDeadline(deadline) {
  if (deadline === null) return null;
  if (!isCalendarDate(deadline)) {
    throw new HttpError(400, "Deadline không phải ngày hợp lệ");
  }
  return deadline;
}

function parsePriority(priority) {
  if (!PRIORITIES.has(priority)) {
    throw new HttpError(400, "Độ ưu tiên không hợp lệ");
  }
  return priority;
}

function parseStatus(status) {
  if (!STATUSES.has(status)) {
    throw new HttpError(400, "Trạng thái không hợp lệ");
  }
  return status;
}

function parseOutcomeNote(note) {
  if (note === null) return null;
  if (typeof note !== "string") {
    throw new HttpError(400, "Ghi chú kết quả không hợp lệ");
  }
  if (note.length > 2000) {
    throw new HttpError(400, "Ghi chú kết quả không được dài quá 2000 ký tự");
  }
  const trimmed = note.trim();
  return trimmed === "" ? null : trimmed;
}

function parseOutcomeRating(rating) {
  if (rating === null) return null;
  if (!RATINGS.has(rating)) {
    throw new HttpError(400, "Tự đánh giá không hợp lệ");
  }
  return rating;
}

function todayIso(now) {
  return new Date(now.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

function addCalendarDays(isoDate, days) {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function dayStartUtc(isoDate) {
  return new Date(`${isoDate}T00:00:00.000+07:00`).toISOString();
}

function calendarDate(iso) {
  return new Date(new Date(iso).getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

export function parseId(id) {
  if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
    throw new HttpError(400, "Id không hợp lệ");
  }
  const value = Number(id);
  if (!Number.isSafeInteger(value)) {
    throw new HttpError(400, "Id không hợp lệ");
  }
  return value;
}

export function create(userId, body) {
  const raw = asObject(body);
  const title = parseTitle(raw.title);
  const description = Object.hasOwn(raw, "description") ? parseDescription(raw.description) : "";
  const deadline = Object.hasOwn(raw, "deadline") ? parseDeadline(raw.deadline) : null;
  const priority = Object.hasOwn(raw, "priority") ? parsePriority(raw.priority) : "medium";
  const status = Object.hasOwn(raw, "status") ? parseStatus(raw.status) : "todo";
  const hasNote = Object.hasOwn(raw, "outcomeNote");
  const hasRating = Object.hasOwn(raw, "outcomeRating");
  const outcomeNote = hasNote ? parseOutcomeNote(raw.outcomeNote) : null;
  const outcomeRating = hasRating ? parseOutcomeRating(raw.outcomeRating) : null;
  if ((hasNote || hasRating) && status !== "done") {
    throw new HttpError(400, "Chỉ ghi nhận kết quả khi công việc đã hoàn thành");
  }
  return taskRepository.create({
    userId,
    title,
    description,
    deadline,
    priority,
    status,
    completedAt: status === "done" ? new Date().toISOString() : null,
    outcomeNote,
    outcomeRating,
  });
}

export function list(userId, query) {
  const raw = asObject(query);
  let status = null;
  if (raw.status !== undefined) {
    status = parseStatus(raw.status);
  }
  let sort = "created_at";
  if (raw.sort !== undefined) {
    if (!SORTS.has(raw.sort)) throw new HttpError(400, "Cột sắp xếp không hợp lệ");
    sort = raw.sort;
  }
  let order = "desc";
  if (raw.order !== undefined) {
    if (raw.order !== "asc" && raw.order !== "desc") {
      throw new HttpError(400, "Chiều sắp xếp không hợp lệ");
    }
    order = raw.order;
  }
  return taskRepository.list({ userId, status, sort, order });
}

export function update(userId, idRaw, body) {
  const id = parseId(idRaw);
  const raw = asObject(body);
  const fields = {};
  if (Object.hasOwn(raw, "title")) fields.title = parseTitle(raw.title);
  if (Object.hasOwn(raw, "description")) fields.description = parseDescription(raw.description);
  if (Object.hasOwn(raw, "deadline")) fields.deadline = parseDeadline(raw.deadline);
  if (Object.hasOwn(raw, "priority")) fields.priority = parsePriority(raw.priority);
  if (Object.hasOwn(raw, "status")) fields.status = parseStatus(raw.status);
  const hasNote = Object.hasOwn(raw, "outcomeNote");
  const hasRating = Object.hasOwn(raw, "outcomeRating");
  if (hasNote) fields.outcomeNote = parseOutcomeNote(raw.outcomeNote);
  if (hasRating) fields.outcomeRating = parseOutcomeRating(raw.outcomeRating);
  if (Object.hasOwn(fields, "status") || hasNote || hasRating) {
    const current = taskRepository.findOwned({ userId, id });
    if (!current) throw new HttpError(404, "Không tìm thấy task");
    const nextStatus = Object.hasOwn(fields, "status") ? fields.status : current.status;
    if ((hasNote || hasRating) && nextStatus !== "done") {
      throw new HttpError(400, "Chỉ ghi nhận kết quả khi công việc đã hoàn thành");
    }
    if (fields.status === "done" && current.status !== "done") {
      fields.completedAt = new Date().toISOString();
    } else if (Object.hasOwn(fields, "status") && fields.status !== "done" && current.status === "done") {
      fields.completedAt = null;
    }
  }
  const task = taskRepository.update({ userId, id, fields });
  if (!task) throw new HttpError(404, "Không tìm thấy task");
  return task;
}

export function dashboard(userId, query, now = new Date()) {
  const raw = asObject(query);
  const period = raw.period === undefined ? "7d" : raw.period;
  const days = PERIOD_DAYS[period];
  if (!days) throw new HttpError(400, "Khoảng thời gian không hợp lệ");
  const today = todayIso(now);
  const startDate = addCalendarDays(today, -(days - 1));
  const dates = [];
  for (let index = 0; index < days; index += 1) dates.push(addCalendarDays(startDate, index));
  const rows = taskRepository.completedBetween({
    userId,
    start: dayStartUtc(startDate),
    end: dayStartUtc(addCalendarDays(today, 1)),
  });
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  for (const row of rows) {
    const day = calendarDate(row.completed_at);
    if (Object.hasOwn(counts, day)) counts[day] += 1;
  }
  const summary = taskRepository.counts({ userId, today });
  const trend = dates.map((date) => ({ date, count: counts[date] }));
  const weekStart = addCalendarDays(today, -6);
  const weekDates = [];
  for (let index = 0; index < 7; index += 1) weekDates.push(addCalendarDays(weekStart, index));
  const weekRows =
    days === 7
      ? rows
      : taskRepository.completedBetween({
          userId,
          start: dayStartUtc(weekStart),
          end: dayStartUtc(addCalendarDays(today, 1)),
        });
  const weekCounts = Object.fromEntries(weekDates.map((date) => [date, 0]));
  for (const row of weekRows) {
    const day = calendarDate(row.completed_at);
    if (Object.hasOwn(weekCounts, day)) weekCounts[day] += 1;
  }
  const dailyCompletions = weekDates.map((date) => ({ date, count: weekCounts[date] }));
  return {
    period,
    completed: trend.reduce((sum, day) => sum + day.count, 0),
    doing: summary.doing,
    overdue: summary.overdue,
    completion: {
      done: summary.done,
      total: summary.total,
      rate: summary.total === 0 ? null : summary.done / summary.total,
    },
    trend,
    completedLast7Days: dailyCompletions.reduce((sum, day) => sum + day.count, 0),
    doingCount: summary.doing,
    overdueCount: summary.overdue,
    completionRate: summary.total === 0 ? null : Math.round((summary.done / summary.total) * 100),
    dailyCompletions,
    recentCompleted: taskRepository.recentCompleted({ userId, limit: 5 }),
  };
}

export function remove(userId, idRaw) {
  const id = parseId(idRaw);
  if (!taskRepository.delete({ userId, id })) {
    throw new HttpError(404, "Không tìm thấy task");
  }
}
