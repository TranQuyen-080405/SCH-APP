# Cơ sở dữ liệu — cập nhật 09/11/2026

## Cấu trúc và quan hệ

SQLite có 4 bảng, 31 cột và 4 khóa ngoại. `users` sở hữu `projects`, `tasks`, `notes` qua `user_id`.
Task có `project_id` tùy chọn. Xóa user dùng CASCADE; xóa project dùng SET NULL để giữ task.
Session nằm trong MemoryStore, không có bảng session.

## DDL

Nguồn chính xác là `server/src/db/schema.sql`:

```sql
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
```

## Migration

Khi mở database, chạy schema/migration trong transaction. Database cũ được bổ sung cột trước khi tạo index.
Bảng tasks cũ được dựng lại để bỏ NOT NULL/default medium: `medium` chuyển thành NULL; low/high và mọi dữ liệu khác giữ nguyên.
Migration chạy lại không thay đổi dữ liệu. Lỗi ràng buộc rollback, không chuyển sang database rỗng trên Vercel.
Fallback `/tmp/app.db` chỉ dành cho lỗi truy cập lưu trữ. Sao lưu database trước khi triển khai.

## Quy tắc truy vấn

- CRUD luôn lấy userId từ session; sửa/xóa dùng `WHERE id = ? AND user_id = ?`. Không thuộc chủ trả 404.
- Priority là low/high/NULL; API query chỉ lọc low/high. Không truyền query priority lấy tất cả.
- Lọc task kết hợp status, priority, projectId; projectId=none lấy việc chưa chia dự án.
- Gán project phải xác minh cùng chủ trong Service; FK không kiểm tra quyền sở hữu.
- Sort API chỉ created_at/deadline, order asc/desc. Hạn NULL đứng cuối; id làm khóa phụ để thứ tự ổn định.
- Dashboard cố định 7 ngày UTC+7, trả cả 5 việc hoàn thành gần đây trong một response.
- Ghi chú sắp noted_on DESC, id DESC. Vị trí bảng và màu giấy được lưu; trạng thái nổi chỉ ở client.
- 6 index khai báo: tasks(user_id,created_at DESC,id DESC), tasks(user_id,status), tasks(user_id,completed_at), tasks(user_id,project_id), projects(user_id), notes(user_id,noted_on DESC,id DESC).
- Bỏ idx_tasks_user_id vì các index ghép đã có tiền tố user_id; thay idx_notes_user_updated vì UI không sắp theo updated_at.
- Ngày thực tế, quyền sở hữu, nội dung ghi chú và định dạng màu dự án được Service kiểm tra thêm ngoài CHECK.
