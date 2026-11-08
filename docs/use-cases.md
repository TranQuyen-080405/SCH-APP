# Use case — Personal Task Management

Đặc tả chức năng để code API và giao diện. Luồng màn hình nằm ở `docs/user-flow.md`. Cột database nằm ở `docs/erd.md`.

## Tác nhân

| Tác nhân | Là ai |
| --- | --- |
| Khách | Chưa có session |
| User | Đã đăng nhập, cookie session còn hiệu lực |

Mỗi user chỉ thấy và sửa task của mình.

## Quy tắc nghiệp vụ

| ID | Quy tắc |
| --- | --- |
| BR-01 | Email đăng ký không trùng, so sánh không phân biệt hoa thường |
| BR-02 | Email đúng dạng có một `@`, phần local và domain không rỗng, tối đa 254 ký tự. App lưu chữ thường |
| BR-03 | Mật khẩu từ 8 đến 128 ký tự. Lưu hash Argon2id, không lưu plaintext |
| BR-04 | Đăng ký phải gửi lại đúng mật khẩu ở trường xác nhận |
| BR-05 | Tiêu đề sau khi trim dài từ 1 đến 200 ký tự |
| BR-06 | Mô tả tối đa 2000 ký tự. Bỏ trống thì lưu `""` |
| BR-07 | `status` chỉ `todo`, `doing`, `done`. Thiếu khi tạo thì `todo` |
| BR-08 | `priority` nhận `low`, `high`, `null`. Thiếu khi tạo thì `null` (không gắn ưu tiên) |
| BR-09 | `deadline` là ngày lịch hợp lệ `YYYY-MM-DD`, hoặc bỏ trống thành NULL. `2026-02-31` là không hợp lệ |
| BR-10 | Khách không được gọi API task |
| BR-11 | User chỉ đọc, sửa, xóa task có `user_id` trùng session. Task của người khác trả 404 |
| BR-12 | `user_id` lấy từ session. Body có gửi `userId` thì bỏ qua |
| BR-13 | Đăng nhập sai email hoặc sai mật khẩu cùng một thông báo |
| BR-14 | Filter `status`, `sort`, `order` sai whitelist thì 400 |
| BR-15 | `sort` whitelist: `created_at`, `deadline`. `order`: `asc`, `desc` |
| BR-16 | Lần đầu vào `done` thì ghi `completed_at`. Sửa việc đã `done` không đổi mốc đó. Mở lại thì xóa mốc. Hoàn thành lại thì ghi mốc mới. Client gửi `completedAt` thì bỏ qua |
| BR-17 | `outcome_note` và `outcome_rating` tùy chọn, chỉ ghi khi việc đang hoặc vừa thành `done`. Mở lại không xóa ghi chú. Rating chỉ `good`, `met`, `improve` hoặc NULL. Note tối đa 2000, trim xong rỗng thì NULL |
| BR-18 | Tổng quan chỉ tính task của session. Ngày theo Asia/Ho_Chi_Minh (UTC+7). Quá hạn khi hạn nhỏ hơn ngày đó và việc chưa `done`. Không hạn thì không quá hạn. Tỷ lệ là số `done` hiện tại / tổng việc; chưa có việc thì `null` |

## Hợp đồng lỗi

Mọi lỗi JSON:

```json
{ "error": "Câu tiếng Việt để hiện trên UI" }
```

| HTTP | Khi nào | `error` |
| --- | --- | --- |
| 400 | Sai input, query không thuộc whitelist | Đúng một câu trong bảng lỗi 400 của `docs/api-contract.md` |
| 401 | Chưa đăng nhập, hoặc sai thông tin đăng nhập | `Chưa đăng nhập` hoặc `Email hoặc mật khẩu không đúng` |
| 403 | Có `Origin` nhưng không khớp `CLIENT_ORIGIN` | `Nguồn request không hợp lệ` |
| 404 | Không có task của user này với id đó | `Không tìm thấy task` |
| 409 | Email đã tồn tại | `Email đã được đăng ký` |

## UC-01 Đăng ký

- Tác nhân: Khách
- Tiền điều kiện: không
- Hậu điều kiện khi thành công: một dòng `users`, chưa có session

Luồng chính:

1. Khách mở `/register`, nhập email, mật khẩu, xác nhận mật khẩu.
2. Gửi `POST /api/auth/register`.
3. Service chuẩn hóa email về chữ thường, kiểm tra BR-01 đến BR-04.
4. Hash mật khẩu Argon2id, insert user.
5. Trả 201. UI báo đã tạo tài khoản và chuyển `/login`.

Luồng thay thế:

- Email trùng: 409, ở lại form.
- Thiếu trường, email sai, mật khẩu ngắn, xác nhận lệch: 400, ở lại form.

```http
POST /api/auth/register
Content-Type: application/json

{ "email": "a@b.com", "password": "matkhau1", "passwordConfirm": "matkhau1" }
```

```json
201
{ "user": { "id": 1, "email": "a@b.com" } }
```

Không trả `password_hash`. Không `Set-Cookie`.

Tiêu chí: TC02 email trùng bị từ chối. Email hợp lệ tạo được user (TC01).

## UC-02 Đăng nhập

- Tác nhân: Khách
- Hậu điều kiện khi thành công: session giữ `userId`, cookie HttpOnly

Luồng chính:

1. Khách gửi email và mật khẩu.
2. Tìm user theo email chữ thường. Không có user, hoặc `verify` hash thất bại: 401 với BR-13.
3. `req.session.userId = user.id`.
4. Trả 200 và cookie. UI chuyển `/`.

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "a@b.com", "password": "matkhau1" }
```

```json
200
{ "user": { "id": 1, "email": "a@b.com" } }
```

Tiêu chí: TC03 sai mật khẩu bị từ chối, không có cookie.

## UC-03 Xem user hiện tại

- Tác nhân: Khách hoặc User
- Dùng khi app vừa mở, để biết nên vào Dashboard hay Login

```http
GET /api/auth/me
```

Đã đăng nhập:

```json
200
{ "user": { "id": 1, "email": "a@b.com" } }
```

Chưa đăng nhập: 401 `{ "error": "Chưa đăng nhập" }`.

## UC-04 Đăng xuất

- Tác nhân: User

1. `POST /api/auth/logout`.
2. Hủy session, xóa cookie.
3. UI chuyển `/login`.

Thành công: `204` không body. Gọi khi chưa đăng nhập cũng `204`, để nút đăng xuất không kẹt.

## UC-05 Tạo task

- Tác nhân: User
- Tiền điều kiện: đã đăng nhập (BR-10)

```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Viết ERD",
  "description": "Hai bảng",
  "deadline": "2026-11-10",
  "priority": "high",
  "status": "todo"
}
```

`description`, `deadline`, `priority`, `status` được phép thiếu. Thiếu thì áp default của BR-06, BR-07, BR-08, deadline NULL.

```json
201
{
  "task": {
    "id": 15,
    "title": "Viết ERD",
    "description": "Hai bảng",
    "deadline": "2026-11-10",
    "priority": "high",
    "status": "todo",
    "createdAt": "2026-11-04T04:00:00.000Z"
  }
}
```

Thiếu tiêu đề hoặc tiêu đề toàn dấu cách: 400 (TC04). JSON không gửi `userId`.

## UC-06 Xem danh sách, lọc, sắp xếp

- Tác nhân: User

```http
GET /api/tasks?status=doing&sort=deadline&order=asc
```

Bỏ `status` nghĩa là lấy mọi trạng thái của user hiện tại.

```json
200
{ "tasks": [ { "id": 15, "title": "Viết ERD", "description": "", "deadline": null, "priority": null, "status": "todo", "createdAt": "2026-11-04T04:00:00.000Z" } ] }
```

Thứ tự và NULL deadline theo `docs/erd.md`.

Tiêu chí: TC06 lọc đúng trạng thái. TC07 deadline đúng thứ tự. Danh sách không chứa task của user khác.

## UC-07 Sửa task

- Tác nhân: User
- Áp cho sửa nội dung và đổi trạng thái. Cùng endpoint.

Body là các trường muốn đổi. Trường không gửi thì giữ nguyên. Gửi `deadline: null` để xóa hạn.

```http
PATCH /api/tasks/15
Content-Type: application/json

{ "status": "doing" }
```

```json
200
{ "task": { "id": 15, "title": "Viết ERD", "description": "", "deadline": null, "priority": null, "status": "doing", "createdAt": "2026-11-04T04:00:00.000Z" } }
```

Đường đi trên server, đúng thứ tự lớp:

```text
PATCH /api/tasks/15
  -> checkOrigin
  -> requireAuth
  -> taskController.update
  -> taskService.update
  -> taskRepository.update  (WHERE id AND user_id)
  -> SQLite
```

Tiêu chí: TC05 `todo` → `doing` → `done` thành công. TC08 user A sửa task của B nhận 404, dữ liệu B không đổi.

## UC-08 Xóa task

- Tác nhân: User

```http
DELETE /api/tasks/15
```

Xóa đúng task của mình: `204` (TC10). Task của người khác hoặc id không tồn tại: 404 (TC08). UI hỏi xác nhận trước khi gọi.

## UC-09 Từ chối khách

- Tác nhân: Khách

`GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id` không có session: 401 `{ "error": "Chưa đăng nhập" }` (TC09).

UI nhận 401 ở bất kỳ API nào thì về `/login`.

## UC-10 Cô lập dữ liệu

- Tác nhân: User A và User B, cùng lúc có task riêng

| Việc của A | Kết quả |
| --- | --- |
| `GET /api/tasks` | Chỉ task của A |
| `GET` không có endpoint lấy một task theo id công khai | Không làm endpoint này |
| `PATCH` hoặc `DELETE /api/tasks/{id của B}` | 404, task B còn nguyên |
| Gửi `userId` của B trong body tạo task | Bị bỏ qua, task thuộc A |

Kiểm tra sở hữu nằm ở Service và điều kiện `user_id` ở Repository. Controller không tin id user do client gửi.

## UC-11 Tổng quan và ghi nhận kết quả

- Tác nhân: User

Đổi việc sang Hoàn thành không bắt buộc ghi chú. Sau đó có thể bỏ qua hoặc gửi `outcomeNote` / `outcomeRating`. Xem và sửa lại từ form việc đã hoàn thành, hoặc từ màn Tổng quan.

`GET /api/dashboard` thống kê cố định 7 ngày, trả cả 5 việc hoàn thành gần đây. Không có session: 401. Không nhận user id từ client.

`completed` và `trend` đếm việc `done` có `completed_at` trong kỳ. `doing`, `overdue`, `completion` là trạng thái hiện tại, không đổi theo kỳ. Việc `done` không có `completed_at` vẫn tính vào tỷ lệ, không tính vào biểu đồ.

## UC-12 Chia công việc theo dự án

- Tác nhân: User

Tạo dự án với tên 1–80 ký tự và màu; sửa tên/màu hoặc xóa từ màn dự án. Sidebar hiển thị các dự án của user cùng số việc chưa hoàn thành. Chọn dự án để xem riêng hoặc chọn Tất cả để xem danh sách nhóm theo dự án.

Thêm/sửa task chọn dự án của mình hoặc Chưa chia dự án. Thanh nhập nhanh thêm vào dự án đang chọn khi nhấn Enter. Các bộ lọc trạng thái, độ ưu tiên, thời hạn và tìm tiêu đề/mô tả kết hợp với dự án.

`/api/projects` cần session; ghi cần Origin hợp lệ. Dự án và task đều lọc theo chủ sở hữu. Không được gán task sang dự án của người khác. Xóa dự án cần xác nhận và giữ mọi task, chuyển về Chưa chia dự án. Dữ liệu task cũ không có dự án vẫn hiện đầy đủ.

## UC-13 Sắp xếp giấy ghi chú

User tạo/sửa ghi chú chọn một trong bốn màu giấy. Kéo thanh đầu hoặc dùng phím mũi tên để đưa giấy ra lớp nổi. Menu chỉ giữ Sửa/Xóa. Giấy nổi giữ vị trí trên màn hình khi đổi mục hoặc cuộn trang; có thể sửa nội dung/màu và xác nhận xóa tại đó. Nút X cất giấy về bảng Ghi chú, không xóa nội dung và không chuyển trang hiện tại. Tải lại hoặc đăng xuất cũng cất về bảng; dữ liệu và vị trí bảng cũ vẫn giữ. Danh sách ghi chú dọc được bỏ. Không tách giấy thành cửa sổ ngoài trình duyệt.

## Việc nằm ngoài use case

Không có quên mật khẩu, sửa email, đổi mật khẩu, chia sẻ task, nhãn, bình luận, kéo-thả Kanban, phân trang, điểm năng suất tự động, streak, theo dõi giờ, hay mục tiêu.
