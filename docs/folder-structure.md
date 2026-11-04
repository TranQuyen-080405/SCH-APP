# Folder structure — Personal Task Management

Repo hiện tại là `schedule_app/`. Lộ trình ghi tên `task-management/`; đó là tên logic, không đổi tên thư mục.

Chỉ tạo file khi tới atom task tương ứng. Mỗi file một trách nhiệm.

```text
schedule_app/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── ProtectedRoute.jsx
│       │   ├── AppHeader.jsx
│       │   ├── StatusTabs.jsx
│       │   ├── SortSelect.jsx
│       │   ├── TaskList.jsx
│       │   ├── TaskItem.jsx
│       │   ├── StatusSelect.jsx
│       │   ├── PriorityBadge.jsx
│       │   ├── TaskForm.jsx
│       │   ├── ConfirmDialog.jsx
│       │   ├── EmptyState.jsx
│       │   ├── FormField.jsx
│       │   ├── Toast.jsx
│       │   ├── ViewNav.jsx
│       │   ├── OverviewPanel.jsx
│       │   └── ReflectionForm.jsx
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   └── DashboardPage.jsx
│       └── services/
│           ├── api.js
│           ├── authApi.js
│           └── taskApi.js
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── data/                    gitignore *.db
│   │   └── app.db
│   ├── src/
│   │   ├── server.js
│   │   ├── app.js
│   │   ├── errors.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── taskController.js
│   │   │   └── dashboardController.js
│   │   ├── services/
│   │   │   ├── password.js
│   │   │   ├── authService.js
│   │   │   └── taskService.js
│   │   ├── repositories/
│   │   │   ├── userRepository.js
│   │   │   └── taskRepository.js
│   │   ├── middleware/
│   │   │   ├── requireAuth.js
│   │   │   ├── checkOrigin.js
│   │   │   └── errorHandler.js
│   │   └── db/
│   │       ├── connection.js
│   │       └── schema.sql
│   └── test/
│       └── api.test.js
├── docs/
│   ├── plan.md
│   ├── erd.md
│   ├── user-flow.md
│   ├── use-cases.md
│   ├── api-contract.md
│   ├── tech-stack.md
│   ├── checklist.md
│   ├── atom-tasks.md
│   ├── folder-structure.md
│   └── ui_docs/
│       ├── ui_lead.md
│       ├── design-system.md
│       ├── screens.md
│       ├── components.md
│       ├── ux-states.md
│       └── ui-tasks.md
├── .gitignore
└── README.md
```

## File nào làm gì

### Client

| File | Việc |
| --- | --- |
| `vite.config.js` | Cổng 5173, proxy `/api` → `http://localhost:3000` |
| `main.jsx` | `BrowserRouter` bọc `App` |
| `App.jsx` | Khai báo route `/`, `/login`, `/register`, và route lạ |
| `index.css` | Token Tailwind. Không viết CSS riêng cho từng component |
| `services/api.js` | `fetch` JSON tới `/api`, đọc `{ error }`, nếu 401 thì báo cho app biết session đã mất |
| `services/authApi.js` | `register`, `login`, `logout`, `me` |
| `services/taskApi.js` | `list`, `create`, `update`, `remove`, `getDashboard`, `listRecentDone` |
| `components/ProtectedRoute.jsx` | Gọi `me`. 401 thì `<Navigate to="/login" />`. Đang tải thì hiện "Đang tải..." |
| `pages/RegisterPage.jsx` | Form UC-01, thành công thì sang `/login` |
| `pages/LoginPage.jsx` | Form UC-02, thành công thì sang `/` |
| `pages/DashboardPage.jsx` | Giữ tab, sắp xếp, form, dialog; gọi lại list sau mỗi lần ghi |
| Các component UI | Việc từng file nằm ở `docs/ui_docs/components.md` |

### Server

| File | Việc |
| --- | --- |
| `server.js` | Đọc env, thiếu `SESSION_SECRET` thì thoát, `app.listen(PORT)` |
| `app.js` | `express.json()`, session, gắn router, error handler cuối cùng |
| `errors.js` | `HttpError(status, message)` để service ném ra |
| `db/connection.js` | Mở SQLite, `pragma('foreign_keys', 'ON')`, chạy `schema.sql` |
| `db/schema.sql` | DDL trong `docs/erd.md` |
| `repositories/userRepository.js` | `create`, `findByEmail`, `findById` |
| `repositories/taskRepository.js` | `create`, `list`, `update`, `delete` — mọi hàm nhận `userId` |
| `services/password.js` | `hashPassword`, `verifyPassword` đúng tham số ở `docs/tech-stack.md` |
| `services/authService.js` | Đăng ký, đăng nhập. Không đụng `req` |
| `services/taskService.js` | Validate BR-05 đến BR-09, BR-14, BR-15. Không thấy task thì 404 |
| `controllers/authController.js` | Gọi auth service, ghi `req.session.userId`, trả JSON |
| `controllers/taskController.js` | Lấy `req.session.userId`, gọi task service |
| `routes/authRoutes.js` | Bốn route auth |
| `routes/taskRoutes.js` | CRUD task, có `checkOrigin` và `requireAuth` |
| `routes/dashboardRoutes.js` | `GET /api/dashboard`, có `requireAuth` |
| `controllers/dashboardController.js` | Lấy `req.session.userId`, gọi `taskService.dashboard` |
| `middleware/requireAuth.js` | Không có `session.userId` thì 401 |
| `middleware/checkOrigin.js` | Origin lạ trên POST/PATCH/DELETE thì 403 |
| `middleware/errorHandler.js` | `HttpError` ra đúng status. Lỗi lạ ra 500 `{ "error": "Lỗi máy chủ" }` và log ở server |
| `test/api.test.js` | TC01–TC10 |

`data/` do server tạo lúc chạy. Không commit file `.db`.

## Hướng phụ thuộc

```text
routes -> controllers -> services -> repositories -> db/connection
                middleware đứng trước controller
client pages -> components -> services/*Api -> api.js -> /api
```

Repository không import service. Service không import Express. Component không viết câu SQL và không kiểm tra `user_id`.

## File không tạo

Không tạo `models/`, `utils/` gom chung, lớp DTO, file config abstraction, Kanban, hay store Redux. Một hàm dùng một nơi thì để ngay file đó.
