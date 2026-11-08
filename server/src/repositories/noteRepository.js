import { getDb } from "../db/connection.js";

const COLUMNS =
  "id, title, content, noted_on, color, position_x, position_y, created_at, updated_at";

function mapNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    notedOn: row.noted_on,
    color: row.color,
    position:
      row.position_x === null || row.position_y === null
        ? null
        : { x: row.position_x, y: row.position_y },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function create({ userId, title, content, notedOn, color, position }) {
  return mapNote(
    getDb()
      .prepare(
        `INSERT INTO notes (user_id, title, content, noted_on, color, position_x, position_y)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING ${COLUMNS}`,
      )
      .get(
        userId,
        title,
        content,
        notedOn,
        color,
        position?.x ?? null,
        position?.y ?? null,
      ),
  );
}

export function findOwned({ userId, id }) {
  return mapNote(
    getDb()
      .prepare(`SELECT ${COLUMNS} FROM notes WHERE id = ? AND user_id = ?`)
      .get(id, userId),
  );
}

export function list(userId) {
  return getDb()
    .prepare(
      `SELECT ${COLUMNS} FROM notes WHERE user_id = ? ORDER BY noted_on DESC, id DESC`,
    )
    .all(userId)
    .map(mapNote);
}

export function update({
  userId,
  id,
  title,
  content,
  notedOn,
  color,
  position,
}) {
  return mapNote(
    getDb()
      .prepare(
        `UPDATE notes
         SET title = ?, content = ?, noted_on = ?, color = ?, position_x = ?, position_y = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND user_id = ?
         RETURNING ${COLUMNS}`,
      )
      .get(
        title,
        content,
        notedOn,
        color,
        position?.x ?? null,
        position?.y ?? null,
        id,
        userId,
      ),
  );
}

export function deleteByOwner({ userId, id }) {
  const info = getDb()
    .prepare("DELETE FROM notes WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return info.changes > 0;
}
