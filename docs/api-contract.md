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
{ "task": { "id": 15, "title": "Viết ERD", "description": "", "deadline": null, "priority": "medium", "status": "todo", "createdAt": "2026-11-04T04:00:00.000Z" } }
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
| `priority` | Có mặt nhưng không thuộc `low`, `medium`, `high` | `Độ ưu tiên không hợp lệ` |
| `sort` | Có mặt nhưng không thuộc `created_at`, `deadline`, `priority`, `title`, `completed_at` | `Cột sắp xếp không hợp lệ` |
| `outcomeNote` | Có mặt nhưng không phải string | `Ghi chú kết quả không hợp lệ` |
| `outcomeNote` | Dài hơn 2000 ký tự | `Ghi chú kết quả không được dài quá 2000 ký tự` |
| `outcomeRating` | Có mặt, khác `null`, và không thuộc `good`, `met`, `improve` | `Tự đánh giá không hợp lệ` |
| `outcomeNote`, `outcomeRating` | Gửi lên khi việc sau cập nhật không phải `done` | `Chỉ ghi nhận kết quả khi công việc đã hoàn thành` |
| `period` | Có mặt nhưng không phải `7d` hoặc `30d` | `Khoảng thời gian không hợp lệ` |
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

| Trường | Kiểu | Ý nghĩa |
| --- | --- | --- |
| `id` | number | Khóa chính, số nguyên |
| `title` | string | Đã trim, 1–200 ký tự |
| `description` | string | Tối đa 2000 ký tự. Trống là `""`, không phải `null` |
| `deadline` | string hoặc `null` | `YYYY-MM-DD`, hoặc `null` nếu không hạn |
| `priority` | string | `low`, `medium`, `high` |
| `status` | string | `todo`, `doing`, `done` |
| `createdAt` | string | Thời điểm tạo, UTC ISO-8601. Ví dụ `2026-11-04T04:00:00.000Z` |
| `completedAt` | string hoặc `null` | UTC ISO-8601 lúc vào `done`. `null` nếu chưa hoàn thành hoặc đã mở lại. Server tự ghi, client không đặt được |
| `outcomeNote` | string hoặc `null` | Ghi chú kết quả. Không có thì `null`, không phải `""` |
| `outcomeRating` | string hoặc `null` | `good`, `met`, `improve`, hoặc `null`. Tự đánh giá của user |

## Trường task trên request

| Trường | POST | PATCH | Ràng buộc khi có mặt |
| --- | --- | --- | --- |
| `title` | bắt buộc | tùy chọn | string, trim xong dài 1–200. Toàn dấu cách là 400 |
| `description` | tùy chọn | tùy chọn | string, tối đa 2000. Thiếu lúc tạo thì `""` |
| `deadline` | tùy chọn | tùy chọn | `YYYY-MM-DD` là ngày lịch có thật, hoặc `null`. `2026-02-31` là 400. Thiếu lúc tạo thì `null`. `null` lúc sửa thì xóa hạn |
| `priority` | tùy chọn | tùy chọn | `low`, `medium`, `high`. Thiếu lúc tạo thì `medium` |
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
      "priority": "medium",
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
| `sort` | `created_at` | `created_at`, `deadline`, `priority`, `title`, `completed_at` |
| `order` | `desc` | `asc`, `desc` |

`sort` dùng tên cột snake_case. `createdAt` không nằm trong whitelist.

Mặc định lần đầu, khớp Dashboard: không lọc status, `sort=created_at`, `order=desc`.

`priority` sắp theo mức, không theo chữ cái: `low` < `medium` < `high`. `order=asc` ra low, medium, high. `order=desc` ra high, medium, low.

`deadline` null luôn đứng cuối, cả `asc` lẫn `desc`. `asc`: ngày sớm trước, ngày muộn sau, null cuối. `desc`: ngày muộn trước, ngày sớm sau, null cuối.

`sort=title` sắp theo giá trị `title`.

`sort=completed_at`: task có `completed_at` null luôn đứng cuối, cả `asc` lẫn `desc`. `desc` là mốc mới trước. Thanh công cụ không hiện lựa chọn này; màn Tổng quan dùng để lấy việc hoàn thành gần đây.

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
    "priority": "medium",
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
    "priority": "medium",
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

Số liệu của user trong session. Không nhận user id từ client. Không body. Không kiểm tra `Origin`.

`period` thiếu thì `7d`. `period` có mặt mà khác `7d` hoặc `30d`: 400 `{ "error": "Khoảng thời gian không hợp lệ" }`. Không session: 401.

Ngày của kỳ, cột biểu đồ, và mốc quá hạn tính theo Asia/Ho_Chi_Minh (UTC+7, không đổi giờ mùa). `7d` là hôm nay và 6 ngày trước, tính cả hai đầu. `30d` là hôm nay và 29 ngày trước.

```http
GET /api/dashboard?period=7d
Cookie: sid=<session>
```

```json
200
{
  "dashboard": {
    "period": "7d",
    "completed": 1,
    "doing": 2,
    "overdue": 1,
    "completion": { "done": 3, "total": 6, "rate": 0.5 },
    "trend": [
      { "date": "2026-10-29", "count": 0 },
      { "date": "2026-11-04", "count": 1 }
    ]
  }
}
```

`trend` có đúng 7 hoặc 30 phần tử, mỗi ngày một dòng kể cả ngày `count` bằng 0. `date` là `YYYY-MM-DD` theo UTC+7. Ví dụ trên rút gọn các ngày ở giữa.

| Trường | Ý nghĩa |
| --- | --- |
| `completed` | Số việc `done` có `completed_at` rơi vào kỳ. Bằng tổng `trend.count` |
| `doing` | Số việc `doing` hiện tại. Không phụ thuộc `period` |
| `overdue` | Việc chưa `done`, có `deadline`, và `deadline` nhỏ hơn hôm nay theo UTC+7. Đúng ngày hôm nay chưa quá hạn. Không hạn thì không tính |
| `completion.done` / `total` | Mọi việc hiện tại của user. `rate` là `done / total`, hoặc `null` khi `total` là 0 |
| `trend` | Số việc hoàn thành mỗi ngày theo `completed_at` mới nhất, không phải nhật ký sự kiện |

Việc `done` mà `completed_at` là null vẫn nằm trong `completion`, không nằm trong `completed` hay `trend`. Đổi kỳ không đổi `doing`, `overdue`, `completion`.

Việc hoàn thành gần đây không nằm trong payload này. Client gọi `GET /api/tasks?status=done&sort=completed_at&order=desc`.

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
