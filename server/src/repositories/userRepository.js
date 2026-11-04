import { getDb } from "../db/connection.js";

function mapUser(row, withHash) {
  if (!row) return null;
  const user = { id: row.id, email: row.email, createdAt: row.created_at };
  if (withHash) user.passwordHash = row.password_hash;
  return user;
}

export function create({ email, passwordHash }) {
  const row = getDb()
    .prepare(
      "INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email, password_hash, created_at",
    )
    .get(email, passwordHash);
  return mapUser(row, false);
}

export function findByEmail(email) {
  const row = getDb()
    .prepare("SELECT id, email, password_hash, created_at FROM users WHERE email = ?")
    .get(email);
  return mapUser(row, true);
}

export function findById(id) {
  const row = getDb()
    .prepare("SELECT id, email, created_at FROM users WHERE id = ?")
    .get(id);
  return mapUser(row, false);
}
