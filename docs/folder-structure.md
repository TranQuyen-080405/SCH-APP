# Cấu trúc source hiện tại — 09/11/2026

## Hướng phụ thuộc

Client: App → ProtectedRoute/AppShell → pages → components/hooks → services/*Api → request → HTTP.
Server: routes → middleware → controllers → services → repositories → db/connection.
`server/src/validation.js` dùng chung asObject, parseId, isCalendarDate; các service không phụ thuộc lẫn nhau để lấy validation.

## File nào làm gì

- TasksPage: tìm kiếm, lọc, nhóm theo dự án, thêm nhanh; useTaskEditor dùng chung cho Tasks/Calendar/Overview.
- TaskForm, PriorityBadge: chỉ low/high và không gắn ưu tiên; không còn StatusTabs.
- OverviewPanel: một getDashboard() cho số liệu, biểu đồ 7 ngày và 5 việc gần đây.
- ProjectContext: CRUD dự án và số việc chưa xong; TaskSidebar hiển thị bộ lọc/dự án.
- NotesContext: CRUD ghi chú và giấy nổi xuyên route; NoteBoard/NoteCard/NoteEditor dựng UI.
- taskViews, dates, noteLayout: logic trình bày và ngày; có test frontend.
- app.js: CORS, session, 5 router, frontend build, error handler. server.js: khởi động và seed.
- db/connection: transaction schema/migration, ưu tiên nullable, index đúng truy vấn, đóng kết nối khi lỗi.
- Không có GET chi tiết ghi chú: UI dùng dữ liệu GET danh sách. Các helper chỉ dùng bởi test hoặc bảo đảm auth vẫn được giữ.

## Danh sách file nguồn

```text
client/src/App.jsx
client/src/components/AppShell.jsx
client/src/components/ConfirmDialog.jsx
client/src/components/EmptyState.jsx
client/src/components/FormField.jsx
client/src/components/NoteBoard.jsx
client/src/components/NoteCard.jsx
client/src/components/NoteEditor.jsx
client/src/components/NotesContext.jsx
client/src/components/OverviewPanel.jsx
client/src/components/PriorityBadge.jsx
client/src/components/ProjectContext.jsx
client/src/components/ProjectForm.jsx
client/src/components/ProtectedRoute.jsx
client/src/components/ReflectionForm.jsx
client/src/components/SortSelect.jsx
client/src/components/StatusSelect.jsx
client/src/components/TaskForm.jsx
client/src/components/TaskItem.jsx
client/src/components/TaskList.jsx
client/src/components/TaskSidebar.jsx
client/src/components/Toast.jsx
client/src/dates.js
client/src/hooks/useTaskEditor.jsx
client/src/index.css
client/src/main.jsx
client/src/noteLayout.js
client/src/pages/CalendarPage.jsx
client/src/pages/LoginPage.jsx
client/src/pages/NotesPage.jsx
client/src/pages/OverviewPage.jsx
client/src/pages/RegisterPage.jsx
client/src/pages/TasksPage.jsx
client/src/services/api.js
client/src/services/authApi.js
client/src/services/noteApi.js
client/src/services/projectApi.js
client/src/services/taskApi.js
client/src/taskViews.js
server/src/app.js
server/src/controllers/authController.js
server/src/controllers/dashboardController.js
server/src/controllers/noteController.js
server/src/controllers/projectController.js
server/src/controllers/taskController.js
server/src/db/connection.js
server/src/db/schema.sql
server/src/db/seedDemo.js
server/src/errors.js
server/src/middleware/checkOrigin.js
server/src/middleware/errorHandler.js
server/src/middleware/requireAuth.js
server/src/repositories/noteRepository.js
server/src/repositories/projectRepository.js
server/src/repositories/taskRepository.js
server/src/repositories/userRepository.js
server/src/routes/authRoutes.js
server/src/routes/dashboardRoutes.js
server/src/routes/noteRoutes.js
server/src/routes/projectRoutes.js
server/src/routes/taskRoutes.js
server/src/server.js
server/src/services/authService.js
server/src/services/noteService.js
server/src/services/password.js
server/src/services/projectService.js
server/src/services/taskService.js
server/src/validation.js
```
