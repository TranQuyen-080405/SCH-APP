import { getDb } from "../db/connection.js";

const COLUMNS = "id, name, color, created_at";
function mapProject(row) {
  return row
    ? {
        id: row.id,
        name: row.name,
        color: row.color,
        createdAt: row.created_at,
        taskCount: Number(row.task_count || 0),
      }
    : null;
}

export function list(userId) {
  return getDb()
    .prepare(
      `
    SELECT p.id, p.name, p.color, p.created_at,
      COUNT(CASE WHEN t.status != 'done' THEN 1 END) AS task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id AND t.user_id = p.user_id
    WHERE p.user_id = ?
    GROUP BY p.id
    ORDER BY p.created_at, p.id
  `,
    )
    .all(userId)
    .map(mapProject);
}

export function findOwned(userId, id) {
  return mapProject(
    getDb()
      .prepare(
        `SELECT ${COLUMNS},
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = projects.id AND t.user_id = projects.user_id AND t.status != 'done') AS task_count
    FROM projects WHERE user_id = ? AND id = ?`,
      )
      .get(userId, id),
  );
}

export function create(userId, name, color) {
  return mapProject(
    getDb()
      .prepare(
        `INSERT INTO projects (user_id, name, color) VALUES (?, ?, ?) RETURNING ${COLUMNS}`,
      )
      .get(userId, name, color),
  );
}

export function update(userId, id, fields) {
  const columns = ["name", "color"].filter((key) => Object.hasOwn(fields, key));
  if (columns.length > 0) {
    const sets = columns.map((key) => `${key} = ?`).join(", ");
    getDb()
      .prepare(`UPDATE projects SET ${sets} WHERE user_id = ? AND id = ?`)
      .run(...columns.map((key) => fields[key]), userId, id);
  }
  return findOwned(userId, id);
}

export function remove(userId, id) {
  return (
    getDb()
      .prepare("DELETE FROM projects WHERE user_id = ? AND id = ?")
      .run(userId, id).changes > 0
  );
}
