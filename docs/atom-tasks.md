# Atom task

Làm theo thứ tự mã. Mỗi task xong khi mục "Xong khi" đúng, rồi đánh dấu ở `docs/checklist.md`.

Phiên bản gói, cổng, cookie, hash: `docs/tech-stack.md`. Cột và SQL: `docs/erd.md`. Request và mã HTTP: `docs/use-cases.md`, `docs/api-contract.md`. File: `docs/folder-structure.md`.

## AT-01 — Git ignore và env mẫu

- Phụ thuộc: không
- File: `.gitignore`, `server/.env.example`

Việc:

1. Ignore `node_modules/`, `dist/`, `.env`, `server/data/*.db`, `server/data/*.db-*`.
2. Viết `.env.example` đúng bốn biến trong `docs/tech-stack.md`.
3. Copy thành `server/.env` trên máy và đặt `SESSION_SECRET` một chuỗi dài bất kỳ. Không commit file này.

Xong khi: `git status` không thấy `.env` và không thấy file database.

## AT-02 — Khởi tạo server

- Phụ thuộc: AT-01
- File: `server/package.json`

Việc:

1. `npm init` trong `server/`.
2. Cài đúng lệnh trong `docs/tech-stack.md`, gồm `supertest` ở devDependency.
3. `"type": "module"`, `"engines": { "node": ">=26.13.0" }`.
4. Script `"start": "node --env-file=.env src/server.js"` và `"test": "node --env-file=.env --test"`.

Xong khi: `npm ls express better-sqlite3 @node-rs/argon2 express-session` in đúng version đã chốt, không có gói thừa.

## AT-03 — Khởi tạo client

- Phụ thuộc: AT-01
- File: `client/package.json`, scaffold Vite

Việc:

1. Tạo app Vite template React trong `client/`.
2. Cài đúng version React, React DOM, Vite, plugin React, `react-router` như `docs/tech-stack.md`.
3. Thêm `"engines"` giống server.
4. Xóa màn mẫu của Vite (counter, logo) để `App` còn chỗ trống cho route.

Xong khi: `npm ls react vite react-router` đúng version, `npm run dev` mở được cổng 5173.

## AT-04 — Hai process nói chuyện được

- Phụ thuộc: AT-02, AT-03
- File: `client/vite.config.js`, `server/src/app.js`, `server/src/server.js`, `server/src/errors.js`, `server/src/middleware/errorHandler.js`

Việc:

1. Proxy Vite `/api` → `http://localhost:3000`, cổng client 5173.
2. `server.js` nghe `PORT` (không có thì 3000; trên Vercel thì 80). Thiếu `SESSION_SECRET` thì mọi response là 500 `Thiếu SESSION_SECRET`, không `process.exit`. Chỉ file này gọi `listen`.
3. `app.js` bật `express.json()` và `export` app. Không gọi `listen`. Supertest import app từ đây, không chiếm cổng 3000.
4. `HttpError` và error handler: lỗi có `status` thì trả status đó kèm `{ "error": message }`. Body không parse được thành JSON thì 400 `{ "error": "Body không phải JSON" }`. Lỗi khác trả 500 `{ "error": "Lỗi máy chủ" }`.
5. Tạm thời thêm `GET /api/health` trả `{ "ok": true }` để thử proxy. Xóa route này ở AT-12 khi auth đã có đường thử thật.
6. Lệnh chạy đứng trong thư mục `server/`, vì `DATABASE_PATH` là đường dẫn tương đối.

Xong khi: mở `http://localhost:5173/api/health` thấy `{ "ok": true }` do Express trả, đi qua proxy. `app.js` không gọi `listen`.

## AT-05 — SQLite và schema

- Phụ thuộc: AT-04
- File: `server/src/db/connection.js`, `server/src/db/schema.sql`

Việc:

1. Copy DDL từ `docs/erd.md` vào `schema.sql`.
2. Mở `DATABASE_PATH`, tạo thư mục `data/` nếu chưa có.
3. `db.pragma("foreign_keys = ON")` rồi `db.exec` nội dung schema.
4. Gọi hàm này lúc `app` khởi động.

Xong khi: chạy server một lần thì có `server/data/app.db`. Mở file, `PRAGMA foreign_keys` trên connection đang dùng là `1`. Insert task với `user_id` không tồn tại thì SQLite từ chối.

## AT-06 — UserRepository

- Phụ thuộc: AT-05
- File: `server/src/repositories/userRepository.js`

Việc:

1. `create({ email, passwordHash })` insert và trả `{ id, email, createdAt }`.
2. `findByEmail(email)` trả cả `passwordHash` cho service so khớp, hoặc `null`.
3. `findById(id)` trả `{ id, email, createdAt }` hoặc `null`. Không có `passwordHash`.
4. Câu lệnh dùng placeholder `?`.

Xong khi: gọi repository từ một script tạm tạo được user và tìm lại theo email. Xóa script tạm.

## AT-07 — TaskRepository

- Phụ thuộc: AT-05
- File: `server/src/repositories/taskRepository.js`

Việc:

1. `create({ userId, title, description, deadline, priority, status })`.
2. `list({ userId, status, sort, order })`. `status` null thì không thêm điều kiện. `sort` và `order` đã được service kiểm whitelist; repository map tên cột, không nối thẳng chuỗi client vào SQL.
3. Không cung cấp sort priority. Sắp `deadline` với `deadline IS NULL` đứng trước để hạn trống ở cuối.
4. `update({ userId, id, fields })` chỉ cập nhật trường có trong `fields`, `WHERE id = ? AND user_id = ?`. Không có dòng thì trả `null`.
5. `delete({ userId, id })` cùng điều kiện, trả `true`/`false`.

Xong khi: tạo hai user, mỗi người một task. `list` của user A không có task của B. `delete` của A với id của B trả `false` và dòng B vẫn còn.

## AT-08 — Đổi tên cột ở biên repository

- Phụ thuộc: AT-06, AT-07

Việc:

1. Một hàm map trong mỗi repository: `created_at` → `createdAt`, `password_hash` → `passwordHash` chỉ ở `findByEmail`.
2. Object task trả ra không có `userId`.

Xong khi: không còn object task nào lộ `user_id` hoặc `password_hash` ra khỏi repository, trừ `passwordHash` của `findByEmail`.

## AT-09 — Hash mật khẩu

- Phụ thuộc: AT-02
- File: `server/src/services/password.js`

Việc:

1. Copy đúng `hashPassword` và `verifyPassword` trong `docs/tech-stack.md`.
2. Thuật toán `Algorithm.Argon2id`, `memoryCost` 19456, `timeCost` 2, `parallelism` 1.

Xong khi: hash một chuỗi, `verify` đúng mật khẩu ra `true`, sai một ký tự ra `false`. Chuỗi hash không chứa mật khẩu gốc.

## AT-10 — Đăng ký

- Phụ thuộc: AT-06, AT-08, AT-09
- File: `server/src/services/authService.js`, `server/src/controllers/authController.js`, `server/src/routes/authRoutes.js`, gắn router trong `app.js`

Việc:

1. Chuẩn hóa email: trim + chữ thường.
2. Kiểm tra BR-02, BR-03, BR-04. Sai thì `throw new HttpError(400, message)` với đúng câu trong bảng lỗi 400 của `docs/api-contract.md`. Một response chỉ một câu, theo thứ tự email, mật khẩu, xác nhận.
3. Email đã có thì 409 `Email đã được đăng ký`. Bắt luôn lỗi unique của SQLite để khỏi trùng khi hai request song song.
4. Lưu hash, trả user không có hash.
5. `POST /api/auth/register` trả 201. Không ghi session.

Xong khi: TC01 và TC02 đúng khi gọi bằng Postman hoặc supertest. Response không có `passwordHash`.

## AT-11 — Đăng nhập và cookie

- Phụ thuộc: AT-10
- File: thêm session trong `server/src/app.js`, method login trong auth service và controller

Việc:

1. `express-session` với các thuộc tính cookie trong `docs/tech-stack.md`. `SESSION_SECRET` lấy từ env. `resave: false`, `saveUninitialized: false`.
2. Login tìm email, `verifyPassword`. Thất bại thì 401 `Email hoặc mật khẩu không đúng`, không phân biệt thiếu user hay sai mật khẩu.
3. Thành công: `req.session.userId = user.id`, trả 200 `{ user }`.
4. `secure` để `false` khi không phải HTTPS.

Xong khi: TC03 không có `Set-Cookie`. Đăng nhập đúng thì response có `Set-Cookie` chứa `HttpOnly` và tên `sid`.

## AT-12 — Logout và me

- Phụ thuộc: AT-11

Việc:

1. `GET /api/auth/me`: có `session.userId` thì tìm user và trả `{ user }`. Không có, hoặc id không còn trong database, thì 401 `Chưa đăng nhập`.
2. `POST /api/auth/logout`: `session.destroy`, xóa cookie `sid`, trả 204 kể cả khi không có session.
3. Xóa `GET /api/health` đã thêm ở AT-04.

Xong khi: login rồi gọi `me` ra đúng email. Logout rồi gọi `me` ra 401.

## AT-13 — Chặn khách và chặn origin lạ

- Phụ thuộc: AT-12
- File: `server/src/middleware/requireAuth.js`, `server/src/middleware/checkOrigin.js`

Việc:

1. `requireAuth`: không có `session.userId` thì 401 `Chưa đăng nhập`.
2. `checkOrigin`: với POST, PATCH, DELETE, nếu có header `Origin` và khác `CLIENT_ORIGIN` thì 403. Không có header thì đi tiếp.
3. Gắn `checkOrigin` cho route ghi của auth và, ở AT-14, cho route task.

Xong khi: request task chưa có cookie trả 401 (có thể tạm một route task rỗng để thử, rồi thay bằng AT-14). `POST /api/auth/login` với `Origin: https://evil.example` trả 403.

## AT-14 — CRUD task

- Phụ thuộc: AT-07, AT-13
- File: `server/src/services/taskService.js`, `server/src/controllers/taskController.js`, `server/src/routes/taskRoutes.js`

Việc:

1. Service nhận `userId` là đối số, không đọc từ body.
2. Tạo: trim title, áp default BR-06, BR-07, BR-08, deadline trống thành `null`. Sai quy tắc thì 400 với câu trong bảng lỗi 400.
3. Sửa: chỉ validate trường được gửi. `deadline: null` xóa hạn. Không tìm thấy dòng của user thì 404 `Không tìm thấy task`.
4. Xóa: không xóa được thì 404. Xóa được thì controller trả 204.
5. `:id` không phải số nguyên dương thì 400 `{ "error": "Id không hợp lệ" }`.
6. Route: `checkOrigin` rồi `requireAuth` rồi controller. Tạo trả 201, sửa trả 200, body `{ task }`.

Xong khi: TC04, TC05, TC08, TC09, TC10 đúng. Sửa task của user khác không đổi dữ liệu.

## AT-15 — Lọc và sắp xếp

- Phụ thuộc: AT-14

Việc:

1. Đọc `status`, `sort`, `order` từ query.
2. Thiếu `sort` thì `created_at`. Thiếu `order` thì `desc`. Thiếu `status` thì lấy tất cả.
3. Giá trị ngoài whitelist thì 400 với câu `Trạng thái không hợp lệ`, `Cột sắp xếp không hợp lệ`, hoặc `Chiều sắp xếp không hợp lệ`. Không bỏ qua im lặng.
4. Nhờ repository sắp đúng cách đã viết ở AT-07.

Xong khi: TC06 và TC07 đúng. `GET /api/tasks?sort=id` trả 400. Priority tùy chọn low/high/null; chỉ giữ sort created_at và deadline trên API.

## AT-16 — HTTP client

- Phụ thuộc: AT-03
- File: `client/src/services/api.js`

Việc:

1. `request(path, { method, body })` gọi `fetch` với `Content-Type: application/json` khi có body.
2. 204 trả `null`.
3. Body lỗi đọc `error`. Không có thì dùng câu "Không kết nối được máy chủ." khi fetch reject.
4. 401 gọi một callback `onUnauthorized` do `App` đăng ký, để chuyển `/login`.

Xong khi: hàm này là chỗ duy nhất gọi `fetch`. `authApi` và `taskApi` chưa cần xong ở task này nhưng không có file nào khác tự `fetch`.

## AT-17 — authApi và taskApi

- Phụ thuộc: AT-16
- File: `client/src/services/authApi.js`, `client/src/services/taskApi.js`

Việc:

1. `register`, `login`, `logout`, `me`.
2. `list({ status, sort, order })` ghép query string, bỏ param rỗng.
3. `create`, `update(id, fields)`, `remove(id)`.

Xong khi: mỗi hàm trỏ đúng method và path trong `docs/use-cases.md`.

## AT-18 — Router

- Phụ thuộc: AT-17
- File: `client/src/main.jsx`, `client/src/App.jsx`, `client/src/components/ProtectedRoute.jsx`

Việc:

1. Import `BrowserRouter`, `Routes`, `Route`, `Navigate` từ `"react-router"`.
2. `/login`, `/register` là trang khách. Đã có user thì `<Navigate to="/" />`.
3. `/` bọc `ProtectedRoute`: gọi `me`, đang tải thì "Đang tải...", 401 thì về `/login`.
4. Route không khớp: khách về `/login`, user về `/`.

Xong khi: gõ `/` khi chưa login thì thấy login. Gõ `/login` khi đã login thì về dashboard.

## AT-19 — Trang đăng ký

- Phụ thuộc: AT-18, AT-10
- File: làm UT-01 đến UT-03 trong `docs/ui_docs/ui-tasks.md` cho phần đăng ký

Xong khi: đăng ký user mới trên UI xong thì đang ở trang login, thấy câu tài khoản đã tạo, và chưa vào được dashboard nếu chưa gửi login.

## AT-20 — Trang đăng nhập

- Phụ thuộc: AT-18, AT-11
- File: UT-03 cho phần đăng nhập

Xong khi: đúng mật khẩu thì vào dashboard, sai thì ở lại login và thấy câu 401.

## AT-21 — Khung Dashboard

- Phụ thuộc: AT-18
- File: UT-04 và phần danh sách của UT-06

Xong khi: user không có task thấy câu rỗng của `docs/ui_docs/ux-states.md`. User có task thấy đúng các task của mình.

## AT-22 — Form thêm và sửa

- Phụ thuộc: AT-21, AT-14
- File: UT-07

Xong khi: thêm task thiếu tiêu đề thấy lỗi dưới ô tiêu đề. Thêm đủ thì task xuất hiện. Sửa tiêu đề thì list đổi theo.

## AT-23 — Đổi trạng thái và xóa

- Phụ thuộc: AT-22
- File: UT-06 cho trạng thái, UT-08 cho dialog xóa

Xong khi: đổi đủ ba trạng thái trên UI, không hộp xác nhận. Xóa mất task. Bấm Hủy thì task còn.

## AT-24 — Lọc và sắp xếp trên UI

- Phụ thuộc: AT-21, AT-15
- File: UT-05, rồi UT-09 và UT-10

Xong khi: tab Đang làm chỉ còn task doing. Sắp "Hạn gần nhất" khớp TC07 trên UI.

## AT-25 — Test API

- Phụ thuộc: AT-15
- File: `server/test/api.test.js`

Việc:

1. Dùng `node:test` và supertest. Import app từ `app.js`, không gọi `listen`.
2. `npm test` nạp `server/.env`, nên `DATABASE_PATH` đang trỏ `./data/app.db`. Mỗi test gán `DATABASE_PATH` tới một file tạm trước khi import app, rồi xóa file đó. Không để test ghi vào database dev.
3. Bật `SESSION_SECRET` trong lệnh test. `CLIENT_ORIGIN` trỏ origin test không gửi, nên request không có `Origin` phải đi qua.
4. Viết TC01 đến TC10 đúng bảng trong `docs/checklist.md`.
5. TC08 tạo hai agent supertest, hai user, A đụng id task của B.
6. TC07 tạo ít nhất ba task: hạn sớm, hạn muộn, không hạn.

Xong khi: `npm test` trong `server/` xanh cả mười case.

## AT-26 — Kiểm thử tay hai user

- Phụ thuộc: AT-24, AT-25

Việc:

1. Chạy client và server.
2. Đăng ký hai email. Đăng nhập từng người, mỗi người tạo một task tiêu đề khác nhau.
3. Xác nhận dashboard không hiện task của người kia.
4. Thử lọc, sắp xếp, đổi status, sửa, xóa.
5. Đăng xuất, bấm Back, không còn thấy danh sách.

Xong khi: năm bước trên đúng. Lỗi nào thấy thì sửa rồi làm lại bước đó.

## AT-27 — Rà cấu trúc

- Phụ thuộc: AT-26

Việc:

1. Repository không import Express hay service. Service không đọc `req`.
2. Không còn SQL ngoài thư mục `repositories/` và `db/`.
3. Không còn mật khẩu, `SESSION_SECRET`, file `.db` trong git.
4. Xóa code thử, route health nếu còn, và hàm không được gọi.
5. Tên hàm nói đúng việc: `list`, `create`, `update`, `delete`, `requireAuth`.

Xong khi: đọc lại cây thư mục khớp `docs/folder-structure.md`. Không thêm pattern mới.

## AT-28 — README và kịch bản demo

- Phụ thuộc: AT-27
- File: `README.md`

Việc:

1. README gồm: mục tiêu, tính năng, công nghệ kèm version, sơ đồ lớp Controller → Service → Repository, cách cài Node 26.13.0, cách chạy hai process, tài khoản để trống vì người xem tự đăng ký.
2. Một mục "Demo" ghi đúng lời thoại 1–2 phút: đăng ký → đăng nhập → thêm task → sửa task → đổi trạng thái → lọc → sắp xếp → đăng xuất.
3. Quay video theo mục đó khi bàn giao.

Xong khi: người khác làm theo README chạy được app từ máy sạch có Node 26.13.0, không cần hỏi thêm cổng hay lệnh.
