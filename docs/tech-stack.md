# Công nghệ, phiên bản, việc làm

Chốt theo npm registry ngày 2026-11-04. Cài đúng các version dưới đây. Không lấy `latest` lúc cài, không thêm thư viện ngoài bảng.

Runtime: Node.js 26.13.0 LTS (Lithium, kèm npm 11.20.0). Ghi `"engines": { "node": ">=26.13.0" }` trong cả hai `package.json`.

## Bảng chọn

| Việc | Công nghệ | Version | Việc làm trong app này |
| --- | --- | --- | --- |
| Chạy backend | Node.js | 26.13.0 LTS | Chạy Express, mở file SQLite, đọc `.env` bằng `node --env-file=.env` |
| HTTP API | express | 5.3.0 | Router `/api/auth` và `/api/tasks`, JSON body, chuyển lỗi từ async handler xuống error middleware |
| Database | SQLite qua better-sqlite3 | 13.0.3 | Một file `server/data/app.db`. Không cài database server. Gọi SQL đồng bộ trong Repository |
| Hash mật khẩu | @node-rs/argon2 | 2.2.2 | Argon2id cho đăng ký và kiểm tra đăng nhập. Có bản build sẵn cho Windows |
| Phiên đăng nhập | express-session | 1.19.0 | Cookie HttpOnly tên `sid`. Session chỉ giữ `userId`. MemoryStore |
| Giao diện | react, react-dom | 19.3.1 | Component trang và form. State local, không Redux |
| Style UI | tailwindcss, @tailwindcss/vite | 4.3.4 | Token và layout trong `docs/ui_docs`. Không viết CSS từng component |
| Icon | lucide-react | 1.67.0 | Plus, Pencil, Trash2, X, Eye, EyeOff, MoreHorizontal |
| Router UI | react-router | 8.5.1 | Ba route `/login`, `/register`, `/`. Import từ `"react-router"` |
| Dev server UI | vite | 8.3.5 | Phục vụ React, proxy `/api` sang port 3000 để cookie cùng origin |
| Plugin Vite | @vitejs/plugin-react | 6.2.1 | Biên JSX |
| Test API | node:test (có sẵn) + supertest | supertest 7.3.1 | TC01–TC10, giữ cookie bằng supertest agent |
| Gọi API tay | Postman | bản desktop hiện tại | Kiểm tra cookie và status trước khi viết test |
| Mã nguồn | Git | bản đang cài | Commit theo milestone trong `docs/plan.md` |

## Lệnh cài

Trong `server/`:

```bash
npm install express@5.3.0 better-sqlite3@13.0.3 @node-rs/argon2@2.2.2 express-session@1.19.0
npm install --save-dev supertest@7.3.1
```

Trong `client/`, sau khi tạo app Vite React:

```bash
npm install react@19.3.1 react-dom@19.3.1 react-router@8.5.1 lucide-react@1.67.0
npm install --save-dev vite@8.3.5 @vitejs/plugin-react@6.2.1 tailwindcss@4.3.4 @tailwindcss/vite@4.3.4
```

## Biến môi trường

`server/.env` không commit. `server/.env.example` thì có:

```env
PORT=3000
SESSION_SECRET=replace-with-a-long-random-string
CLIENT_ORIGIN=http://localhost:5173
DATABASE_PATH=./data/app.db
```

Thiếu `SESSION_SECRET` thì mọi request trả 500 `Thiếu SESSION_SECRET`. Process vẫn nghe cổng, để host không biến lần khởi động thành lỗi nền tảng.

Image Docker không ghim `PORT`. Máy local và Compose đặt `PORT=3000`. Vercel không đặt `PORT` thì process nghe cổng 80, đúng cổng router của container.

Chạy server từ thư mục `server/`. `DATABASE_PATH=./data/app.db` là đường dẫn tương đối theo thư mục đang đứng:

```bash
node --env-file=.env src/server.js
```

Không thêm gói `dotenv`. Node 26 đọc `--env-file` sẵn.

### Deploy client và server riêng

- Local: `client/.env` để `VITE_API_URL=` trống, tiếp tục dùng proxy Vite. Server dùng `server/.env` như trên; cookie mặc định `lax`, không yêu cầu HTTPS.
- Deploy: dùng `client/.env.production.example` và `server/.env.production.example` làm mẫu nhập Environment Variables cho từng project. Thay URL mẫu bằng domain thật, không có dấu `/` cuối. `VITE_API_URL` chỉ gồm origin backend, không thêm `/api`.
- Client: `VITE_API_URL=https://my-server.vercel.app`. Build/deploy lại client sau khi đổi biến vì Vite nhúng giá trị khi build.
- Server: `CLIENT_ORIGIN=https://my-client.vercel.app`, `SESSION_SECRET` ngẫu nhiên đủ dài, `SESSION_COOKIE_SECURE=true`, `SESSION_COOKIE_SAME_SITE=none`. Không đưa `SESSION_SECRET` vào client. Các biến cookie này ghi đè mặc định localhost khi triển khai khác site qua HTTPS.
- API client gửi `credentials: "include"`; server cho phép CORS đúng `CLIENT_ORIGIN`, hỗ trợ preflight và credentials. Kiểm tra Origin cho request ghi vẫn giữ nguyên. Cookie secure dùng `trust proxy=1`, cần backend nằm sau proxy tin cậy.
- Trình duyệt chặn cookie bên thứ ba có thể ngăn đăng nhập giữa hai site riêng; khi đó dùng domain cùng site hoặc proxy `/api` qua client.
- Đây là cấu hình kết nối, chưa thay đổi cách host SQLite và MemoryStore: cần nơi lưu database bền vững; MemoryStore mất phiên khi restart và không chia sẻ giữa nhiều instance.

## Việc của từng lớp backend

| Lớp | Được làm | Không được làm |
| --- | --- | --- |
| Route | Gắn method, path, middleware | SQL, hash, quy tắc nghiệp vụ |
| Controller | Đọc body/query/params, gọi service, `res.status().json()` | SQL, biết user nào sở hữu task |
| Service | BR-01 đến BR-15, ném lỗi có `status` | Đọc `req`/`res`, viết câu SQL |
| Repository | SQL tham số hóa, map dòng snake_case sang camelCase | Hash mật khẩu, quyết định HTTP status |
| Middleware | Session, `requireAuth`, kiểm tra `Origin`, error handler | Truy vấn task |

Express 5 tự chuyển rejected promise của handler async vào error middleware. Controller để `async` và `throw`. Một error handler duy nhất trả `{ "error": "..." }`.

## Auth — tham số đã chốt

Hash, trong `server/src/services/password.js`:

```js
import { hash, verify, Algorithm } from "@node-rs/argon2";

const options = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export const hashPassword = (plain) => hash(plain, options);
export const verifyPassword = (hashed, plain) => verify(hashed, plain);
```

`memoryCost` 19456 (19 MiB), `timeCost` 2, `parallelism` 1 là mức Argon2id tối thiểu theo OWASP. `verify` nhận hash trước, mật khẩu sau.

Cookie session:

| Thuộc tính | Giá trị |
| --- | --- |
| name | `sid` |
| httpOnly | true |
| sameSite | `lax` |
| secure | `false` khi phát triển bằng HTTP localhost. `true` chỉ khi site chạy HTTPS |
| path | `/` |
| maxAge | 7 ngày |

`secure: true` trên `http://localhost` làm trình duyệt bỏ cookie, đăng nhập xong vẫn như khách.

Store: MemoryStore mặc định của `express-session`. Restart server là mất phiên. Không thêm bảng session.

CSRF, mức của project này:

- Cookie `SameSite=Lax`.
- Request `POST`, `PATCH`, `DELETE`: nếu header `Origin` có mặt và khác `CLIENT_ORIGIN` thì 403.
- Không có header `Origin` thì cho qua, để Postman và supertest gọi được.
- UI chỉ gọi đường dẫn tương đối `/api/...` qua proxy Vite. Không gọi thẳng `http://localhost:3000` từ trang ở cổng 5173.

## Proxy Vite

`client/vite.config.js`:

```js
server: {
  port: 5173,
  proxy: {
    "/api": "http://localhost:3000",
  },
},
```

Trang và API cùng origin `http://localhost:5173`. `fetch("/api/...")` gửi cookie mặc định, không cần `credentials: "include"`.

## JSON

API dùng camelCase: `createdAt`, `passwordConfirm`. Cột SQLite dùng snake_case: `created_at`, `password_hash`. Repository là nơi đổi tên.

Không trả `passwordHash` và không trả `userId` trong object task.

## Cố ý không dùng

| Không thêm | Lý do |
| --- | --- |
| TypeScript, Zod, Joi | Validation viết tay trong service, đủ cho số trường này |
| Redux, React Query | Vài màn, `useState` là đủ |
| Thư viện component có sẵn (MUI, shadcn) | Tự dựng component trong `docs/ui_docs/components.md` |
| Prisma, Knex, ORM | Repository viết SQL để thấy CRUD |
| Passport | Một kiểu đăng nhập email/mật khẩu |
| gói `argon2` (node-gyp) | Dễ gãy lúc cài trên Windows. `@node-rs/argon2` vẫn là Argon2id |
| csrf package | `SameSite` + kiểm tra `Origin` đủ cho phạm vi này |
| Kanban, WebSocket | Ngoài đề |

## Cổng

| Process | Cổng |
| --- | --- |
| Vite client | 5173 |
| Express | 3000 |
