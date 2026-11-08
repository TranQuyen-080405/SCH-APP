PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  color TEXT NOT NULL DEFAULT '#5dcfb8',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  deadline TEXT CHECK (
    deadline IS NULL
    OR deadline GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  priority TEXT CHECK (priority IN ('low', 'high')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  completed_at TEXT,
  outcome_note TEXT CHECK (outcome_note IS NULL OR length(outcome_note) <= 2000),
  outcome_rating TEXT CHECK (
    outcome_rating IS NULL OR outcome_rating IN ('good', 'met', 'improve')
  ),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  color INTEGER NOT NULL DEFAULT 0 CHECK (color IN (0, 1, 2, 3)),
  position_x INTEGER CHECK (position_x IS NULL OR position_x BETWEEN 0 AND 20000),
  position_y INTEGER CHECK (position_y IS NULL OR position_y BETWEEN 0 AND 20000),
  title TEXT NOT NULL DEFAULT '' CHECK (length(title) <= 120),
  content TEXT NOT NULL DEFAULT '' CHECK (length(content) <= 10000),
  noted_on TEXT CHECK (
    noted_on IS NULL
    OR noted_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index chạy sau ALTER trên database cũ. CREATE INDEX trước khi có cột sẽ lỗi.
-- migrate-then
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_notes_user_updated;
CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks (user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks (user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_project ON tasks (user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_day ON notes (user_id, noted_on DESC, id DESC);
