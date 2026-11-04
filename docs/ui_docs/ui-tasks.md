# Việc dựng UI

Làm sau khi API task đã chạy (AT-15) và client đã gọi được API (AT-16 đến AT-18). Chi tiết nhìn nằm ở các file cùng thư mục. Đánh dấu AT-19 đến AT-24 trong `docs/checklist.md` khi nhóm việc tương ứng xong.

## UT-01 — Token

- Phụ thuộc: AT-03
- File: `client/src/index.css`, `client/vite.config.js`, `client/package.json`

Việc:

1. Cài `tailwindcss@4.3.4`, `@tailwindcss/vite@4.3.4`, `lucide-react@1.67.0` đúng lệnh trong `docs/tech-stack.md`.
2. Gắn plugin Tailwind cạnh plugin React. Giữ proxy `/api`.
3. Khai báo màu, font và bán kính trong `index.css` đúng `design-system.md`.

Xong khi: một trang nền `#F8FAFC`, một nút primary `#2563EB`, chữ tiếng Việt không vỡ dấu.

## UT-02 — Ô nhập

- Phụ thuộc: UT-01
- File: `client/src/components/FormField.jsx`

Việc:

1. Label, control, dòng lỗi.
2. Mật khẩu có nút hiện và ẩn, tên truy cập đúng `components.md`.

Xong khi: bấm nút thì đổi type input giữa `password` và `text`, và đọc được bằng tên truy cập.

## UT-03 — Đăng nhập và đăng ký

- Phụ thuộc: UT-02, AT-18, AT-10, AT-11
- File: `LoginPage.jsx`, `RegisterPage.jsx`

Việc:

1. Dựng đúng `screens.md` cho bề rộng dưới 768px và từ 768px.
2. Đăng ký thành công sang `/login` với câu "Tài khoản đã được tạo. Đăng nhập để tiếp tục."
3. Lỗi gắn ô theo `ux-states.md`. Nút có trạng thái đang gửi.

Xong khi: đăng ký rồi đăng nhập vào được Dashboard. Sai mật khẩu ở lại form và thấy câu 401.

## UT-04 — Khung Dashboard

- Phụ thuộc: UT-01, AT-18
- File: `DashboardPage.jsx`, `AppHeader.jsx`, `ProtectedRoute.jsx`

Việc:

1. Header "Việc của tôi", nút email, menu "Đăng xuất".
2. Cột giữa tối đa 1100px từ 768px.
3. Chờ session thì "Đang tải...".

Xong khi: đăng xuất về `/login`. Email dài bị cắt, không làm vỡ header.

## UT-05 — Lọc và sắp xếp

- Phụ thuộc: UT-04, AT-17
- File: `StatusTabs.jsx`, `SortSelect.jsx`

Việc:

1. Bốn tab và ba kiểu sắp xếp, map query đúng `design-system.md`.
2. Mặc định Tất cả và Mới tạo.
3. Đổi là gọi `list` ngay. Giữ lựa chọn sau khi thêm, sửa, xóa.
4. Laptop: nút "+ Thêm công việc" trên toolbar. Mobile: nút nổi, không thêm nút thứ hai trên header.

Xong khi: tab Đang làm chỉ còn task `doing`. "Hạn gần nhất" ra thứ tự deadline tăng dần, task không hạn ở cuối.

## UT-06 — Danh sách task

- Phụ thuộc: UT-05
- File: `TaskList.jsx`, `TaskItem.jsx`, `PriorityBadge.jsx`, `StatusSelect.jsx`, `EmptyState.jsx`

Việc:

1. Hàng ngang từ 768px, card dọc dưới 768px, đúng `screens.md`.
2. Badge ưu tiên, ngày `dd/mm/yyyy`, cụm "Quá hạn" khi đủ điều kiện.
3. Dropdown trạng thái gọi `update` chỉ với `{ status }`, rồi `list` lại. Không hỏi xác nhận.
4. Menu "…" trên mobile có Sửa và Xóa.
5. Skeleton, hai kiểu rỗng, và lỗi có nút "Thử lại" theo `ux-states.md`.

Xong khi: task không mô tả và không hạn không hiện dòng trống. Quá hạn hiện chữ đỏ kèm ngày. Đổi đủ ba trạng thái.

## UT-07 — Form

- Phụ thuộc: UT-06, AT-14
- File: `TaskForm.jsx`

Việc:

1. Modal 520px từ 768px. Dưới 768px là form đầy màn, có nút quay lại.
2. Thêm thì mặc định Cần làm và Trung bình. Sửa thì điền sẵn.
3. Escape, X, Hủy đóng form khi không đang lưu.
4. Thành công thì đóng, tải lại list, toast đúng câu. Thất bại thì giữ dữ liệu và hiện lỗi.

Xong khi: thiếu tiêu đề thấy "Tiêu đề không được để trống" dưới ô tiêu đề. Thêm và sửa đều xuất hiện trên danh sách.

## UT-08 — Xóa

- Phụ thuộc: UT-06
- File: `ConfirmDialog.jsx`

Việc:

1. Đúng hai câu trong `screens.md`.
2. Hủy không gọi API. Xóa thành công thì toast "Đã xóa công việc".

Xong khi: bấm Hủy hoặc Escape thì task còn. Bấm Xóa thì task mất.

## UT-09 — Toast

- Phụ thuộc: UT-07
- File: `Toast.jsx`

Việc:

1. Một toast, tự tắt sau 3 giây, đóng được bằng X.
2. Không toast khi đổi tab, sắp xếp, hoặc đổi trạng thái trên hàng.

Xong khi: tạo, sửa từ form, và xóa mỗi việc ra đúng một câu.

## UT-10 — Rà hai bề rộng

- Phụ thuộc: UT-03 đến UT-09

Việc:

1. Xem 375px và 1280px.
2. Không cuộn ngang trang. Tab mobile cuộn trong hàng tab.
3. Nút nổi không che hàng cuối. Focus thấy trên input và nút. Icon bấm được có tên.

Xong khi: cả hai bề rộng làm được đủ vòng đăng ký, đăng nhập, thêm, sửa, đổi trạng thái, lọc, sắp xếp, xóa, đăng xuất.
