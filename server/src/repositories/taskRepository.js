import { getDb } from "../db/connection.js";

const COLUMNS =
  "id, title, description, deadline, priority, status, created_at, completed_at, outcome_note, outcome_rating";

function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    deadline: row.deadline,
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    outcomeNote: row.outcome_note,
    outcomeRating: row.outcome_rating,
  };
}

function orderSql(sort, order) {
  const dir = order === "asc" ? "ASC" : "DESC";
  if (sort === "created_at") return `created_at ${dir}`;
  if (sort === "title") return `title ${dir}`;
  if (sort === "deadline") return `deadline IS NULL, deadline ${dir}`;
  if (sort === "completed_at") return `completed_at IS NULL, completed_at ${dir}`;
  if (sort === "priority") {
    return `CASE priority WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END ${dir}`;
  }
  throw new Error("Cột sắp xếp không hợp lệ");
}

export function create({
  userId,
  title,
  description,
  deadline,
  priority,
  status,
  completedAt = null,
  outcomeNote = null,
  outcomeRating = null,
}) {
  const row = getDb()
    .prepare(
      `INSERT INTO tasks (
         user_id, title, description, deadline, priority, status, completed_at, outcome_note, outcome_rating
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING ${COLUMNS}`,
    )
    .get(userId, title, description, deadline, priority, status, completedAt, outcomeNote, outcomeRating);
  return mapTask(row);
}

export function findOwned({ userId, id }) {
  return mapTask(
    getDb().prepare(`SELECT ${COLUMNS} FROM tasks WHERE id = ? AND user_id = ?`).get(id, userId),
  );
}

export function list({ userId, status, sort, order }) {
  const params = [userId];
  let where = "user_id = ?";
  if (status != null) {
    where += " AND status = ?";
    params.push(status);
  }
  const rows = getDb()
    .prepare(`SELECT ${COLUMNS} FROM tasks WHERE ${where} ORDER BY ${orderSql(sort, order)}`)
    .all(...params);
  return rows.map(mapTask);
}

export function update({ userId, id, fields }) {
  const sets = [];
  const params = [];
  for (const [key, column] of [
    ["title", "title"],
    ["description", "description"],
    ["deadline", "deadline"],
    ["priority", "priority"],
    ["status", "status"],
    ["completedAt", "completed_at"],
    ["outcomeNote", "outcome_note"],
    ["outcomeRating", "outcome_rating"],
  ]) {
    if (Object.hasOwn(fields, key)) {
      sets.push(`${column} = ?`);
      params.push(fields[key]);
    }
  }
  const db = getDb();
  if (sets.length === 0) {
    return mapTask(
      db.prepare(`SELECT ${COLUMNS} FROM tasks WHERE id = ? AND user_id = ?`).get(id, userId),
    );
  }
  return mapTask(
    db
      .prepare(
        `UPDATE tasks SET ${sets.join(", ")} WHERE id = ? AND user_id = ? RETURNING ${COLUMNS}`,
      )
      .get(...params, id, userId),
  );
}

export function counts({ userId, today }) {
  const row = getDb()
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END), 0) AS done,
         COALESCE(SUM(CASE WHEN status = 'doing' THEN 1 ELSE 0 END), 0) AS doing,
         COALESCE(SUM(
           CASE
             WHEN status != 'done' AND deadline IS NOT NULL AND deadline < ? THEN 1
             ELSE 0
           END
         ), 0) AS overdue
       FROM tasks
       WHERE user_id = ?`,
    )
    .get(today, userId);
  return {
    total: Number(row.total),
    done: Number(row.done),
    doing: Number(row.doing),
    overdue: Number(row.overdue),
  };
}

export function recentCompleted({ userId, limit }) {
  return getDb()
    .prepare(
      `SELECT ${COLUMNS} FROM tasks
       WHERE user_id = ? AND status = 'done' AND completed_at IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT ?`,
    )
    .all(userId, limit)
    .map(mapTask);
}

export function completedBetween({ userId, start, end }) {
  return getDb()
    .prepare(
      `SELECT completed_at FROM tasks
       WHERE user_id = ? AND status = 'done' AND completed_at IS NOT NULL
         AND completed_at >= ? AND completed_at < ?`,
    )
    .all(userId, start, end);
}

function deleteByOwner({ userId, id }) {
  const info = getDb().prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, userId);
  return info.changes > 0;
}

export { deleteByOwner as delete };
