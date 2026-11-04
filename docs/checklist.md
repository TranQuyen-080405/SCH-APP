# Checklist

Đánh dấu khi atom task tương ứng xong. Chi tiết từng việc nằm ở `docs/atom-tasks.md`.

Thiết kế để build: xong. Code: server API và client đã nối được trên máy dev.

## Tiến độ

- [x] 1. Viết yêu cầu và quy tắc nghiệp vụ — `docs/use-cases.md`
- [x] 2. ERD, hợp đồng API, luồng UI — `docs/erd.md`, `docs/api-contract.md`, `docs/use-cases.md`, `docs/user-flow.md`
- [x] 3. Khởi tạo client React và server Express — AT-01 → AT-04
- [x] 4. Database và Repository — AT-05 → AT-08
- [x] 5. Authentication và authorization — AT-09 → AT-13
- [x] 6. API CRUD, lọc, sắp xếp — AT-14 → AT-15
- [x] 7. Frontend nối API — AT-16 → AT-24
- [ ] 8. Kiểm thử chức năng và hai user — AT-25 → AT-26
- [ ] 9. Rà soát cấu trúc code — AT-27
- [ ] 10. README và video demo — AT-28

5/8 hạng mục code. Hai hạng mục tài liệu đã xong.

## Theo nhóm việc

### Nền

- [x] AT-01 `.gitignore` và `server/.env.example`
- [x] AT-02 Server cài đúng version, `engines` Node 26
- [x] AT-03 Client Vite React cài đúng version
- [x] AT-04 Proxy `/api`, Express trả JSON, hai process chạy được

### Dữ liệu

- [x] AT-05 Mở SQLite, bật foreign key, chạy schema
- [x] AT-06 `UserRepository`
- [x] AT-07 `TaskRepository` luôn kèm `user_id`
- [x] AT-08 Map snake_case sang camelCase, không trả hash

### Auth

- [x] AT-09 Argon2id đúng tham số
- [x] AT-10 Đăng ký, không tự đăng nhập, 409 khi trùng email
- [x] AT-11 Đăng nhập, cookie `sid` HttpOnly, sai mật khẩu 401 chung một câu
- [x] AT-12 Logout và `GET /api/auth/me`
- [x] AT-13 `requireAuth` và kiểm tra `Origin`

### Task API

- [x] AT-14 Validate task, tạo, sửa một phần, xóa
- [x] AT-15 Lọc status, sắp xếp whitelist, deadline NULL ở cuối, priority theo mức

### UI

- [x] AT-16 `api.js` đọc `{ error }`, 401 thì về login
- [x] AT-17 `authApi` và `taskApi`
- [x] AT-18 Ba route và `ProtectedRoute`
- [x] AT-19 Trang đăng ký
- [x] AT-20 Trang đăng nhập
- [x] AT-21 Dashboard tải danh sách: đang tải, rỗng, lỗi
- [x] AT-22 `TaskForm` dùng chung thêm và sửa
- [x] AT-23 `TaskItem`: sửa, xóa có xác nhận, đổi status
- [x] AT-24 Filter và sort gọi lại API

### Tổng quan năng suất

- [x] Migration `completed_at`, `outcome_note`, `outcome_rating`, giữ task cũ
- [x] Hoàn thành ghi mốc, mở lại xóa mốc và giữ ghi chú
- [x] `GET /api/dashboard?period=7d|30d` theo session, ngày tính theo UTC+7
- [x] UI Công việc / Tổng quan, biểu đồ cột, ghi nhận kết quả tùy chọn

### Chất lượng và bàn giao

- [x] AT-25 `server/test/api.test.js` đủ TC01–TC10
- [ ] AT-26 Bấm tay hai tài khoản trên UI
- [ ] AT-27 Rà lớp, secret, câu SQL
- [ ] AT-28 README và kịch bản video 1–2 phút

## Test phải xanh

| ID | Việc | Kết quả |
| --- | --- | --- |
| TC01 | Đăng ký email hợp lệ | 201, có user, không có cookie session |
| TC02 | Đăng ký email trùng | 409 |
| TC03 | Đăng nhập sai mật khẩu | 401, không có cookie |
| TC04 | Tạo task thiếu tiêu đề | 400 |
| TC05 | Todo → Doing → Done | 200, status đổi đúng |
| TC06 | Lọc `status=doing` | Chỉ task doing của user đó |
| TC07 | Sắp `deadline` tăng dần | Đúng thứ tự, task không hạn ở cuối |
| TC08 | User A sửa hoặc xóa task của B | 404, task B còn nguyên |
| TC09 | Khách gọi API task | 401 |
| TC10 | Xóa task của mình | 204, lần list sau không còn |

## Xong toàn project khi

- Chức năng trên chạy đúng trên UI.
- Controller, service, repository tách đúng file trong `docs/folder-structure.md`.
- Có validation, task cách ly theo user, TC01–TC10 đạt.
- Có lịch sử commit theo milestone, README, video demo.

## Commit gợi ý khi xong từng mốc

Không commit dồn một lần lúc cuối.

| Sau khi xong | Message |
| --- | --- |
| AT-04 | `chore: initialize client and server` |
| AT-08 | `feat: create user and task schema` |
| AT-13 | `feat: implement user authentication` |
| AT-15 | `feat: implement task CRUD APIs` |
| AT-24 | `feat: build task dashboard` |
| AT-26 | `test: add authentication and task tests` |
| AT-28 | `docs: add README and demo guide` |
