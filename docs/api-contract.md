# API contract — Personal Task Management

Hợp đồng HTTP để code route và để Postman bám theo. Chức năng nằm ở `docs/use-cases.md`. Cột database nằm ở `docs/erd.md`. Cookie, proxy và cổng nằm ở `docs/tech-stack.md`.

Không thêm endpoint ngoài danh mục dưới. Không thêm trường ngoài các bảng field.

## Base URL

Khi dev, trình duyệt đứng ở origin Vite `http://localhost:5173`. Client gọi đường dẫn tương đối `/api/...`. Proxy Vite chuyển sang Express. Không gọi `http://localhost:3000` từ trang ở cổng 5173: cookie sẽ lệch origin.

Express nghe cổng 3000. Postman và supertest gọi thẳng `http://localhost:3000/api/...`.

| Việc | Giá trị |
| --- | --- |
| Gọi từ UI | `/api/...` |
| Express | cổng `3000` (`PORT`) |
| Body JSON | `Content-Type: application/json` |
| Cookie session | tên `sid` |

Request có body thì gửi JSON. Response có body thì JSON. `204` không có body; client không parse JSON.

## Quy ước

JSON trên API dùng camelCase: `createdAt`, `passwordConfirm`. Cột SQLite dùng snake_case. File này chỉ khóa tên trường trên request và response.

Mọi lỗi:

```json
{ "error": "Câu tiếng Việt để hiện trên UI" }
```

Ba dạng thành công có body:

```json
{ "user": { "id": 1, "email": "a@b.com" } }
```

```json
{ "task": { "id": 15, "title": "Viết ERD", "description": "", "deadline": null, "priority": null, "status": "todo", "createdAt": "2026-11-04T04:00:00.000Z" } }
```

```json
{ "tasks": [] }
```

Không trả `password`, `passwordHash`, `password_hash`. Object task không có `userId` và không có `updatedAt`.

`400` là sai input hoặc query ngoài whitelist. Mỗi response chỉ một câu `error`. Kiểm tra theo thứ tự trong bảng dưới và trả câu của lỗi đầu tiên. Không trả mảng lỗi.

## Câu lỗi 400

| Trường | Khi nào | `error` |
| --- | --- | --- |
| `email` | Thiếu, không phải string, hoặc trim xong rỗng | `Email không được để trống` |
| `email` | Không đúng một `@`, phần local hoặc domain rỗng, hoặc dài hơn 254 ký tự | `Email không đúng định dạng` |
| `password` | Thiếu hoặc không phải string | `Mật khẩu không được để trống` |
| `password` | Ngắn hơn 8 hoặc dài hơn 128 ký tự | `Mật khẩu phải từ 8 đến 128 ký tự` |
| `passwordConfirm` | Thiếu hoặc không phải string | `Xác nhận mật khẩu không được để trống` |
| `passwordConfirm` | Khác `password` | `Xác nhận mật khẩu không khớp` |
| `title` | Thiếu, không phải string, hoặc trim xong rỗng | `Tiêu đề không được để trống` |
| `title` | Sau trim dài hơn 200 ký tự | `Tiêu đề không được dài quá 200 ký tự` |
| `description` | Có mặt nhưng không phải string | `Mô tả không hợp lệ` |
| `description` | Dài hơn 2000 ký tự | `Mô tả không được dài quá 2000 ký tự` |
| `deadline` | Có mặt, khác `null`, và không phải ngày lịch `YYYY-MM-DD` | `Deadline không phải ngày hợp lệ` |
| `status` | Có mặt trong body, hoặc query `status` không thuộc `todo`, `doing`, `done` | `Trạng thái không hợp lệ` |
| `priority` | Body khác `null`, `low`, `high`; query khác `low`, `high` | `Độ ưu tiên không hợp lệ` |
| `sort` | Có mặt nhưng không thuộc `created_at`, `deadline` | `Cột sắp xếp không hợp lệ` |
| `outcomeNote` | Có mặt nhưng không phải string | `Ghi chú kết quả không hợp lệ` |
| `outcomeNote` | Dài hơn 2000 ký tự | `Ghi chú kết quả không được dài quá 2000 ký tự` |
| `outcomeRating` | Có mặt, khác `null`, và không thuộc `good`, `met`, `improve` | `Tự đánh giá không hợp lệ` |
| `outcomeNote`, `outcomeRating` | Gửi lên khi việc sau cập nhật không phải `done` | `Chỉ ghi nhận kết quả khi công việc đã hoàn thành` |
| `order` | Có mặt nhưng không thuộc `asc`, `desc` | `Chiều sắp xếp không hợp lệ` |
| `:id` | Không phải số nguyên dương | `Id không hợp lệ` |

Body không parse được thành JSON: `400` `{ "error": "Body không phải JSON" }`. Error handler map lỗi parse của Express sang câu này, không trả 500.

Đăng ký kiểm tra `email`, rồi `password`, rồi `passwordConfirm`. Đăng nhập chỉ 400 khi `email` hoặc `password` thiếu hoặc không phải string. Email sai dạng lúc đăng nhập không trả 400. Không có user hoặc sai mật khẩu vẫn là 401 `Email hoặc mật khẩu không đúng`.

Tạo và sửa task kiểm tra `title`, `description`, `deadline`, `priority`, rồi `status`. Query danh sách kiểm tra `status`, `sort`, rồi `order`. `:id` kiểm tra sau khi đã có session.

## Session và Origin

Session chỉ giữ `userId`. Cookie:

| Thuộc tính | Giá trị |
| --- | --- |
| name | `sid` |
| httpOnly | true |
| sameSite | `lax` |
| secure | `false` trên HTTP localhost. `true` chỉ khi site chạy HTTPS |
| path | `/` |
| maxAge | 7 ngày |

`POST`, `PATCH`, `DELETE`: nếu header `Origin` có mặt và khác `CLIENT_ORIGIN` thì `403` `{ "error": "Nguồn request không hợp lệ" }`. Không có header `Origin` thì cho qua, để Postman và supertest gọi được. Dev, `CLIENT_ORIGIN` là `http://localhost:5173`. So khớp đúng chuỗi.

`GET` không kiểm tra `Origin`.

Route task ghi theo thứ tự: `checkOrigin`, rồi `requireAuth`, rồi controller. Origin sai thì 403 kể cả khi chưa đăng nhập. Origin hợp lệ hoặc vắng, mà không có session, thì 401, chưa xét body hay `:id`.

| Method và path | Session | Kiểm tra Origin |
| --- | --- | --- |
| `POST /api/auth/register` | không | có |
| `POST /api/auth/login` | không | có |
| `POST /api/auth/logout` | không | có |
| `GET /api/auth/me` | cần để 200; không có thì 401 | không |
| `GET /api/tasks` | cần | không |
| `GET /api/dashboard` | cần | không |
| `POST /api/tasks` | cần | có |
| `PATCH /api/tasks/:id` | cần | có |
| `DELETE /api/tasks/:id` | cần | có |

Client không gửi `userId`. Body có `userId` thì server bỏ qua. Chủ task là `userId` trong session.

## Danh mục

| Method | Path | Auth | Thành công |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | không | 201 `{ "user" }`, không `Set-Cookie` |
| POST | `/api/auth/login` | không | 200 `{ "user" }` và `Set-Cookie: sid` |
| POST | `/api/auth/logout` | không | 204, xóa cookie `sid` |
| GET | `/api/auth/me` | xem bảng trên | 200 `{ "user" }` |
| GET | `/api/tasks` | có | 200 `{ "tasks" }` |
| GET | `/api/dashboard` | có | 200 `{ "dashboard" }` |
| POST | `/api/tasks` | có | 201 `{ "task" }` |
| PATCH | `/api/tasks/:id` | có | 200 `{ "task" }` |
| DELETE | `/api/tasks/:id` | có | 204 |

## User trên response

Dùng cho register, login, me.

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `id` | number | Khóa chính, số nguyên |
| `email` | string | Đã chữ thường |

Không có trường khác.

## Task trên response

Bổ sung theo yêu cầu chia dự án: task có `projectId` là số nguyên dương hoặc `null`. POST/PATCH nhận `projectId` dạng number/null; chỉ gán được dự án thuộc user trong session. Thiếu khi tạo là `null`, thiếu khi sửa giữ nguyên. Giá trị sai dạng trả 400 `Dự án không hợp lệ`; id không thuộc user hoặc không tồn tại trả 404 `Không tìm thấy dự án`.

GET `/api/tasks` nhận thêm `projectId=<id>` để lọc dự án, `projectId=none` để lấy việc chưa chia dự án, và `priority=low|high`. Các bộ lọc kết hợp với status và sort hiện có; id dự án phải thuộc người dùng.

## Dự án — bổ sung theo yêu cầu người dùng

- `GET /api/projects`: 200 `{ projects }`, chỉ dự án của user. Mỗi dự án có `id`, `name`, `color`, `createdAt`, `taskCount` (số việc chưa hoàn thành).
- `POST /api/projects`: body `{ name, color? }`, 201 `{ project }`. Tên trim dài 1–80 ký tự, màu `#RRGGBB`, mặc định `#5dcfb8`.
- `PATCH /api/projects/:id`: body có thể chứa `name`, `color`; 200 `{ project }`.
- `DELETE /api/projects/:id`: 204. Giữ toàn bộ công việc, chuyển `projectId` của chúng về `null`.
- Tất cả endpoint cần session; ghi kiểm tra Origin như task. Id sai dạng trả 400. Dự án không tồn tại hoặc thuộc người khác trả cùng 404 `Không tìm thấy dự án`.
- Lỗi trường: 400 `Tên dự án phải từ 1 đến 80 ký tự`, `Màu dự án không hợp lệ`.

## Các trường task

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `id` | number | Khóa chính, số nguyên |
| `title` | string | Đã trim, 1–200 ký tự |
| `projectId` | number hoặc `null` | Dự án của user; `null` là chưa chia dự án |
| `description` | string | Tối đa 2000 ký tự. Trống là `""`, không phải `null` |
| `deadline` | string hoặc `null` | `YYYY-MM-DD`, hoặc `null` nếu không hạn |
| `priority` | string hoặc null | `low`, `high`, hoặc `null` (không gắn ưu tiên) |
| `status` | string | `todo`, `doing`, `done` |
| `createdAt` | string | Thời điểm tạo, UTC ISO-8601. Ví dụ `2026-11-04T04:00:00.000Z` |
| `completedAt` | string hoặc `null` | UTC ISO-8601 lúc vào `done`. `null` nếu chưa hoàn thành hoặc đã mở lại. Server tự ghi, client không đặt được |
| `outcomeNote` | string hoặc `null` | Ghi chú kết quả. Không có thì `null`, không phải `""` |
| `outcomeRating` | string hoặc `null` | `good`, `met`, `improve`, hoặc `null`. Tự đánh giá của user |

## Trường task trên request

| Trường | POST | PATCH | Ràng buộc khi có mặt |
| --- | --- | --- | --- |
| `title` | bắt buộc | tùy chọn | string, trim xong dài 1–200. Toàn dấu cách là 400 |
| `projectId` | tùy chọn | tùy chọn | number nguyên dương thuộc user hoặc `null`. Thiếu lúc tạo là `null`, thiếu khi sửa giữ nguyên |
| `description` | tùy chọn | tùy chọn | string, tối đa 2000. Thiếu lúc tạo thì `""` |
| `deadline` | tùy chọn | tùy chọn | `YYYY-MM-DD` là ngày lịch có thật, hoặc `null`. `2026-02-31` là 400. Thiếu lúc tạo thì `null`. `null` lúc sửa thì xóa hạn |
| `priority` | tùy chọn | tùy chọn | `low`, `high`, hoặc `null`. Thiếu lúc tạo thì `null`; PATCH thiếu trường giữ nguyên |
| `status` | tùy chọn | tùy chọn | `todo`, `doing`, `done`. Thiếu lúc tạo thì `todo` |
| `outcomeNote` | tùy chọn | tùy chọn | string tối đa 2000, hoặc `null`. Trim xong rỗng thì lưu `null`. Chỉ khi status sau ghi là `done`. Thiếu thì `null` lúc tạo, giữ nguyên lúc sửa |
| `outcomeRating` | tùy chọn | tùy chọn | `good`, `met`, `improve`, hoặc `null`. Chỉ khi status sau ghi là `done` |
| `completedAt` | bỏ qua | bỏ qua | Server tự ghi khi status vào hoặc rời `done` |
| `userId` | bỏ qua | bỏ qua | Không đổi chủ task |

PATCH chỉ xét trường được gửi. Trường không có trong JSON giữ nguyên. `{}` không đổi dữ liệu; task của đúng user vẫn 200.

## Tham số `:id`

`:id` phải là số nguyên dương (`1`, `15`). `0`, số âm, số thập phân, chuỗi không phải số: 400. Kiểm tra này chạy sau `requireAuth`. Chưa đăng nhập thì 401, kể cả khi `:id` sai.

Id đúng dạng nhưng không có task của user trong session: 404 `{ "error": "Không tìm thấy task" }`. Task của user khác cùng một câu 404. Không cho client biết id đó có tồn tại hay không.

## POST /api/auth/register

Đăng ký. Không tạo session. Không `Set-Cookie`.

Header: `Content-Type: application/json`. `Origin` nếu có thì phải khớp `CLIENT_ORIGIN`.

Không query.

| Trường | Bắt buộc | Kiểu | Ràng buộc |
| --- | --- | --- | --- |
| `email` | có | string | Trim, tối đa 254 ký tự, đúng một `@`, phần local và domain không rỗng. Lưu và trả về chữ thường |
| `password` | có | string | 8–128 ký tự |
| `passwordConfirm` | có | string | Trùng `password` |

```http
POST /api/auth/register
Content-Type: application/json

{ "email": "a@b.com", "password": "matkhau1", "passwordConfirm": "matkhau1" }
```

```json
201
{ "user": { "id": 1, "email": "a@b.com" } }
```

`A@B.COM` lưu thành `a@b.com`. Response trả email đã chữ thường.

| Tình huống | HTTP | `error` |
| --- | --- | --- |
| Thiếu trường, email sai dạng, mật khẩu ngoài 8–128, xác nhận lệch | 400 | câu trong bảng lỗi 400 |
| Email đã tồn tại, kể cả hai request trùng email cùng lúc | 409 | `Email đã được đăng ký` |
| `Origin` có và không khớp | 403 | `Nguồn request không hợp lệ` |

## POST /api/auth/login

Đăng nhập. Thành công thì ghi session và gửi cookie `sid`.

Header: `Content-Type: application/json`. `Origin` nếu có thì phải khớp `CLIENT_ORIGIN`.

Không query.

| Trường | Bắt buộc | Kiểu | Ràng buộc |
| --- | --- | --- | --- |
| `email` | có | string | Tìm user theo email chữ thường |
| `password` | có | string | So với hash Argon2id |

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "a@b.com", "password": "matkhau1" }
```

```http
200
Content-Type: application/json
Set-Cookie: sid=<session>; Path=/; HttpOnly; SameSite=Lax

{ "user": { "id": 1, "email": "a@b.com" } }
```

| Tình huống | HTTP | `error` |
| --- | --- | --- |
| Thiếu `email` hoặc `password`, hoặc không phải string | 400 | câu trong bảng lỗi 400 |
| Không có user, hoặc sai mật khẩu | 401 | `Email hoặc mật khẩu không đúng` |
| `Origin` có và không khớp | 403 | `Nguồn request không hợp lệ` |

401 không có `Set-Cookie`. Không nói email nào đã tồn tại.

## POST /api/auth/logout

Hủy session và xóa cookie `sid`.

Header: `Origin` nếu có thì phải khớp `CLIENT_ORIGIN`. Không body.

```http
POST /api/auth/logout
```

Thành công: `204`, không body. Chưa đăng nhập cũng `204`.

`Origin` có và không khớp: 403 `{ "error": "Nguồn request không hợp lệ" }`.

## GET /api/auth/me

Đọc user của session. App gọi lúc mở để chọn Dashboard hoặc Login.

Không body. Không query. Không kiểm tra `Origin`.

```http
GET /api/auth/me
Cookie: sid=<session>
```

```json
200
{ "user": { "id": 1, "email": "a@b.com" } }
```

Không có session, hoặc `userId` trong session không còn user: 401 `{ "error": "Chưa đăng nhập" }`.

## GET /api/tasks

Danh sách task của user trong session. Không có task của user khác. Hết session: 401 `{ "error": "Chưa đăng nhập" }`.

Không body. Không kiểm tra `Origin`.

```http
GET /api/tasks?status=doing&sort=deadline&order=asc
Cookie: sid=<session>
```

```json
200
{
  "tasks": [
    {
      "id": 15,
      "title": "Viết ERD",
      "description": "",
      "deadline": null,
      "priority": null,
      "status": "todo",
      "createdAt": "2026-11-04T04:00:00.000Z"
    }
  ]
}
```

Không có dòng nào: 200 `{ "tasks": [] }`.

### Query

Thiếu param thì dùng mặc định. Param có mặt mà sai whitelist thì 400. Không bỏ qua rồi trả danh sách.

| Param | Thiếu thì | Whitelist |
| --- | --- | --- |
| `status` | mọi trạng thái của user hiện tại | `todo`, `doing`, `done` |
| `sort` | `created_at` | `created_at`, `deadline` |
| `order` | `desc` | `asc`, `desc` |

`sort` dùng tên cột snake_case. `createdAt` không nằm trong whitelist.

Mặc định lần đầu, khớp Dashboard: không lọc status, `sort=created_at`, `order=desc`.


`deadline` null luôn đứng cuối, cả `asc` lẫn `desc`. `asc`: ngày sớm trước, ngày muộn sau, null cuối. `desc`: ngày muộn trước, ngày sớm sau, null cuối.

`sort=title` sắp theo giá trị `title`.


Ví dụ 400: `GET /api/tasks?sort=id`, `GET /api/tasks?order=up`, `GET /api/tasks?status=open`.

## POST /api/tasks

Tạo task cho user trong session.

Header: `Content-Type: application/json`, cookie `sid`. `Origin` nếu có thì phải khớp `CLIENT_ORIGIN`.

Không query. Trường theo bảng request ở trên.

```http
POST /api/tasks
Content-Type: application/json
Cookie: sid=<session>

{
  "title": "Viết ERD",
  "description": "Hai bảng",
  "deadline": "2026-11-10",
  "priority": "high",
  "status": "todo"
}
```

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

Chỉ gửi tiêu đề thì default áp vào response:

```json
{ "title": "Mua sữa" }
```

```json
201
{
  "task": {
    "id": 16,
    "title": "Mua sữa",
    "description": "",
    "deadline": null,
    "priority": null,
    "status": "todo",
    "createdAt": "2026-11-04T04:00:00.000Z"
  }
}
```

| Tình huống | HTTP | `error` |
| --- | --- | --- |
| Chưa đăng nhập | 401 | `Chưa đăng nhập` |
| `Origin` có và không khớp | 403 | `Nguồn request không hợp lệ` |
| Thiếu tiêu đề, tiêu đề toàn dấu cách, hoặc trường khác sai quy tắc | 400 | câu trong bảng lỗi 400 |

`{ "title": "Việc của tôi", "userId": 2 }` tạo task của user đang đăng nhập, không phải user 2.

## PATCH /api/tasks/:id

Sửa một phần, kể cả đổi mỗi `status`. Cùng endpoint.

Header: `Content-Type: application/json`, cookie `sid`. `Origin` nếu có thì phải khớp `CLIENT_ORIGIN`.

Không query. `:id` theo mục tham số ở trên.

```http
PATCH /api/tasks/15
Content-Type: application/json
Cookie: sid=<session>

{ "status": "doing" }
```

```json
200
{
  "task": {
    "id": 15,
    "title": "Viết ERD",
    "description": "",
    "deadline": null,
    "priority": null,
    "status": "doing",
    "createdAt": "2026-11-04T04:00:00.000Z"
  }
}
```

Xóa hạn: `{ "deadline": null }`. Response có `"deadline": null`. Các trường không gửi giữ nguyên.

Lần đầu `{ "status": "done" }` thì response có `completedAt` là thời điểm đó. Sửa tiêu đề hoặc ghi chú khi đang `done` không đổi `completedAt`. `{ "status": "todo" }` hoặc `"doing"` khi đang `done` thì `completedAt` thành `null`, `outcomeNote` và `outcomeRating` giữ nguyên. Hoàn thành lại thì `completedAt` là mốc mới.

Ghi chú: `{ "outcomeNote": "Đã nộp báo cáo", "outcomeRating": "met" }`. Gửi khi việc không ở `done`: 400. `outcomeNote` toàn dấu cách lưu `null`. `outcomeRating: null` xóa đánh giá.

| Tình huống | HTTP | `error` |
| --- | --- | --- |
| Chưa đăng nhập | 401 | `Chưa đăng nhập` |
| `Origin` có và không khớp | 403 | `Nguồn request không hợp lệ` |
| `:id` không phải số nguyên dương, hoặc trường gửi lên sai quy tắc | 400 | câu trong bảng lỗi 400 |
| Không có task của user này với id đó | 404 | `Không tìm thấy task` |

## GET /api/dashboard

Cần session. Không có query nghiệp vụ; thống kê cố định 7 ngày (hôm nay và 6 ngày trước, UTC+7).
Trả `200 { dashboard }` với đúng 6 trường:

- `completed`: số việc hoàn thành trong 7 ngày, theo `completed_at`.
- `doing`, `overdue`: số việc đang làm, số việc chưa xong có hạn trước hôm nay.
- `completion: { done, total, rate }`: toàn bộ công việc; `rate` là 0–1 hoặc `null` khi chưa có việc.
- `trend`: 7 phần tử `{ date, count }`, có cả ngày không phát sinh.
- `recentCompleted`: tối đa 5 task hoàn thành, mốc mới nhất trước; task chưa có mốc đứng cuối.

Client gọi một API này để dựng toàn bộ màn Tổng quan. Không có chế độ 30 ngày hoặc các trường alias thống kê cũ.

## DELETE /api/tasks/:id

Xóa một task của user trong session.

Header: cookie `sid`. `Origin` nếu có thì phải khớp `CLIENT_ORIGIN`. Không body. Không query.

```http
DELETE /api/tasks/15
Cookie: sid=<session>
```

Xóa được: `204`, không body.

| Tình huống | HTTP | `error` |
| --- | --- | --- |
| Chưa đăng nhập | 401 | `Chưa đăng nhập` |
| `Origin` có và không khớp | 403 | `Nguồn request không hợp lệ` |
| `:id` không phải số nguyên dương | 400 | `Id không hợp lệ` |
| Không có task của user này với id đó | 404 | `Không tìm thấy task` |

## Ghi chú — màu giấy và vị trí

Các endpoint ghi chú hiện có cần session, ghi kiểm tra Origin như task: `GET /api/notes` trả `{ notes }`; `POST /api/notes` trả 201 `{ note }`; `PATCH /api/notes/:id` trả 200 `{ note }`; `DELETE /api/notes/:id` trả 204. Không thấy ghi chú của user thì 404 `Không tìm thấy ghi chú`.

Response note gồm `id`, `title`, `content`, `notedOn`, `createdAt`, `updatedAt`, thêm `color` và `position`. Tiêu đề tối đa 120, nội dung tối đa 10000 ký tự; phải có ít nhất một trường khác khoảng trắng. `notedOn` là ngày hợp lệ `YYYY-MM-DD`, mặc định hôm nay UTC+7 khi tạo.

`color` là number nguyên: 0 vàng, 1 xanh lá, 2 hồng, 3 xanh dương. POST thiếu màu thì mặc định 0; PATCH thiếu thì giữ nguyên. Ngoài bốn số này trả 400 `Màu ghi chú không hợp lệ`.

`position` là `null` (chưa đặt vị trí, UI xếp tự động) hoặc `{ x, y }`, mỗi tọa độ là number nguyên từ 0 đến 20000 pixel trên bảng giấy. POST thiếu thì null; PATCH thiếu thì giữ nguyên. Dạng sai hoặc thiếu một tọa độ trả 400 `Vị trí ghi chú không hợp lệ`. PATCH `{ position: { x: 120, y: 350 } }` giữ nguyên nội dung, ngày và màu; sửa nội dung/màu giữ vị trí. Chỉ cập nhật ghi chú thuộc user trong session.

Theo UI lớp nổi mới, thao tác kéo/cất giấy chỉ thay đổi trạng thái client trong phiên, không PATCH vị trí bảng và không DELETE. Không thêm field hoặc endpoint cho trạng thái nổi; vị trí bảng đã lưu và API hiện có vẫn giữ nguyên.

## Mã HTTP

| HTTP | Khi nào | `error` |
| --- | --- | --- |
| 200 | Login, me, danh sách, sửa task | không, có body thành công |
| 201 | Đăng ký, tạo task | không, có body thành công |
| 204 | Logout, xóa task | không body |
| 400 | Sai input, `:id` sai, query ngoài whitelist, body không phải JSON | câu trong bảng lỗi 400, hoặc `Body không phải JSON` |
| 401 | Chưa đăng nhập | `Chưa đăng nhập` |
| 401 | Sai email hoặc sai mật khẩu lúc login | `Email hoặc mật khẩu không đúng` |
| 403 | `POST` / `PATCH` / `DELETE` có `Origin` khác `CLIENT_ORIGIN` | `Nguồn request không hợp lệ` |
| 404 | Không có task của user này với id đó | `Không tìm thấy task` |
| 409 | Email đăng ký đã tồn tại | `Email đã được đăng ký` |
| 500 | Lỗi không phải `HttpError` | `Lỗi máy chủ` |

## Không làm

- Không có `GET /api/tasks/:id`.
- Không phân trang. Không `page`, `limit`, `offset`.
- Không quên mật khẩu, sửa email, đổi mật khẩu.
- Không chia sẻ task, nhãn, bình luận, Kanban.
