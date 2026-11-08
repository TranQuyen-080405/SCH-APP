# Component hiện tại — 09/11/2026

Nguồn: client/src. App khai báo 6 route: login, register, tasks, calendar, notes, overview; `/` chuyển sang tasks.

- ProtectedRoute kiểm tra phiên; AppShell chứa điều hướng, ProjectProvider và NotesProvider.
- TasksPage giữ lọc/query/thêm nhanh; CalendarPage giữ tháng/ngày; OverviewPage mở editor dùng chung.
- useTaskEditor điều phối TaskForm, ReflectionForm, ConfirmDialog, Toast; cập nhật task và số việc của dự án.
- TaskItem và lịch dùng chung PriorityBadge: low/high, null không render tag. TaskForm mặc định không gắn ưu tiên.
- Không còn StatusTabs: trạng thái nằm trong bộ lọc TasksPage/TaskSidebar và StatusSelect trên mỗi việc.
- OverviewPanel chỉ gọi getDashboard() một lần; response đã có 5 việc gần đây và thống kê 7 ngày.
- ProjectContext, ProjectForm, TaskSidebar dùng chung CRUD dự án.
- NotesContext giữ dữ liệu/editor/giấy nổi. NotesPage, NoteBoard, NoteCard, NoteEditor hiển thị và sửa dữ liệu từ listNotes; không GET chi tiết.
- NoteBoard giữ khung trống khi lấy giấy ra, đánh dấu ô nhận khi kéo. NotesContext xử lý khớp ô, lưu position và hoàn tác nếu API lỗi; ô có giấy không nhận chồng.
- Logic dates, taskViews, noteLayout có test; form và priority badge có kiểm tra React SSR qua Vite.

## File component đang dùng

- `AppShell.jsx`
- `ConfirmDialog.jsx`
- `EmptyState.jsx`
- `FormField.jsx`
- `NoteBoard.jsx`
- `NoteCard.jsx`
- `NoteEditor.jsx`
- `NotesContext.jsx`
- `OverviewPanel.jsx`
- `PriorityBadge.jsx`
- `ProjectContext.jsx`
- `ProjectForm.jsx`
- `ProtectedRoute.jsx`
- `ReflectionForm.jsx`
- `Select.jsx`
- `SortSelect.jsx`
- `StatusSelect.jsx`
- `TaskForm.jsx`
- `TaskItem.jsx`
- `TaskList.jsx`
- `TaskSidebar.jsx`
- `Toast.jsx`

Select là control chung cho tất cả dropdown; SortSelect/StatusSelect chỉ cung cấp options và màu trạng thái. FormField truyền id/name/aria lỗi vào Select. Không có native select trong src.
