# Component — Personal Task Management

Mỗi file một việc. Không tạo component dùng chung nếu chỉ một chỗ gọi.

Cây file client, thay cho danh sách cũ trong `docs/folder-structure.md`:

```text
client/src/
├── index.css
├── main.jsx
├── App.jsx
├── components/
│   ├── ProtectedRoute.jsx
│   ├── AppHeader.jsx
│   ├── StatusTabs.jsx
│   ├── SortSelect.jsx
│   ├── TaskList.jsx
│   ├── TaskItem.jsx
│   ├── StatusSelect.jsx
│   ├── PriorityBadge.jsx
│   ├── TaskForm.jsx
│   ├── ConfirmDialog.jsx
│   ├── EmptyState.jsx
│   ├── FormField.jsx
│   └── Toast.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── DashboardPage.jsx
└── services/
    ├── api.js
    ├── authApi.js
    └── taskApi.js
```

Không còn `TaskFilters.jsx`.

## Ai giữ state

`DashboardPage` giữ tab, kiểu sắp xếp, task đang sửa, form đang mở, dialog xóa, và câu toast. Gọi `list` lại sau thêm, sửa, xóa, đổi trạng thái. Đổi tab hoặc sắp xếp cũng gọi `list` ngay, không tải lại cả trang.

`LoginPage` và `RegisterPage` giữ field của form đó. Không đưa task vào context toàn app.

## FormField

Bọc label, control, và một dòng lỗi. Dùng cho auth và form task.

Props: `label`, `name`, `error`, `children` hoặc `type`. Ô mật khẩu nhận thêm nút Eye / EyeOff. Tên truy cập: "Hiện mật khẩu", "Ẩn mật khẩu".

Lỗi hiện dưới đúng ô. Cách gắn câu API vào ô nằm ở `ux-states.md`.

## AppHeader

Props: `email`, `onLogout`.

Hiện "Việc của tôi" và nút email. Bấm nút thì menu có một mục "Đăng xuất". Không có ảnh đại diện vì API không trả ảnh. Email dài thì cắt với ellipsis, vẫn đọc được đầy đủ bằng thuộc tính title.

## StatusTabs

Props: `value` (`all` | `todo` | `doing` | `done`), `onChange`.

Bốn tab đúng chữ trong `screens.md`. Tab chọn có nền primary nhạt và chữ primary. `all` nghĩa là không gửi query `status`.

## SortSelect

Props: `value` (`due_asc` | `due_desc` | `newest`), `onChange`.

Nhãn nút là "Sắp xếp". Ba lựa chọn map sang query trong `design-system.md`. Mặc định `newest`.

## PriorityBadge

Props: `priority`. Chỉ hiện badge chữ Thấp, Trung bình, hoặc Cao. Màu theo `design-system.md`.

## StatusSelect

Props: `value`, `onChange`, `disabled`.

Ba lựa chọn Cần làm, Đang làm, Hoàn thành. Đổi là gọi ngay `onChange`, không mở form. `disabled` khi request của hàng đó đang chạy.

## TaskItem

Props: `task`, `onEdit`, `onDelete`, `onStatus`.

Laptop: hàng ngang như `screens.md`. Mobile: card, menu MoreHorizontal có Sửa và Xóa, status nằm hàng cuối.

Tiêu đề và mô tả kẹp hai dòng (`line-clamp-2`). Mô tả rỗng thì không render khối mô tả. Không deadline thì không render ngày.

Nút sửa tên truy cập "Sửa công việc". Nút xóa "Xóa công việc".

## TaskList

Props: `tasks`, các callback của item, `status` đang tải hoặc lỗi.

Đang tải lần đầu hoặc khi đổi bộ lọc: ba hàng skeleton, toolbar vẫn nằm yên. Có lỗi: nhường cho EmptyState kiểu lỗi. Có dữ liệu: map `TaskItem`. Rỗng: `EmptyState`.

## TaskForm

Props: `mode` (`create` | `edit`), `initial`, `submitting`, `error`, `onSubmit`, `onClose`.

Dùng chung cho thêm và sửa. Laptop là dialog. Dưới 768px là full screen. Field và nút theo `screens.md`.

`onSubmit` nhận object camelCase đúng `docs/api-contract.md`: `title`, `description`, `deadline`, `priority`, `status`.

## ConfirmDialog

Props: `open`, `title`, `body`, `confirmLabel`, `busy`, `onConfirm`, `onClose`.

Dùng cho xóa. Nút xác nhận dùng màu danger. Escape và Hủy gọi `onClose` khi không `busy`.

## EmptyState

Props: `variant` (`empty` | `filtered` | `error`), `onRetry` khi `error`.

Chữ nằm ở `ux-states.md`. Không vẽ illustration. Không thêm nút tạo thứ hai; nút thêm của toolbar hoặc nút nổi vẫn ở trên trang.

## Toast

Props: `message`, `onDone`.

Một dòng, tự mất sau 3 giây, có thể bấm X để tắt sớm. `role="status"`. Dashboard chỉ hiện một toast tại một thời điểm.

## ProtectedRoute

Giữ như `docs/atom-tasks.md`: gọi `me`, 401 thì về `/login`. Lúc chờ session: một dòng "Đang tải..." giữa trang, không skeleton danh sách.

## Việc component không làm

Không gọi `fetch` ngoài `services/`. Không gửi `userId`. Không tự lọc task của người khác. Không lưu danh sách để sửa tại chỗ sau khi server đã trả về; trang gọi `list` lại.
