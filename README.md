# SCHE-APP

Ứng dụng quản lý công việc cá nhân: đăng ký, đăng nhập, danh sách việc, và một màn tổng quan để xem việc đã xong.

Màn **Công việc** dùng danh sách theo dự án giống Focus To-Do. Bấm **Thêm dự án**, chọn màu và tên; chọn dự án rồi nhập việc ở thanh thêm nhanh, nhấn Enter để lưu. Có thể chọn/chuyển dự án trong form sửa công việc. Việc cũ nằm ở **Chưa chia dự án**; xóa dự án giữ lại toàn bộ việc. Bộ lọc hỗ trợ trạng thái, độ ưu tiên, thời hạn và tìm trong tiêu đề/mô tả.

## Chạy

Runtime là Node.js >=26.13.0, theo `docs/tech-stack.md`. Trên Windows có nvm, chọn phiên bản trước khi chạy:

```powershell
nvm install 26.13.0
nvm use 26.13.0
node --version
```

Nếu `npm start` thoát ngay trên Node 20, nguyên nhân có thể là thư viện SQLite yêu cầu Node >=22. Server kiểm tra phiên bản trước khi nạp SQLite và báo lệnh đổi Node.

Trong `server/`:

```bash
npm install
npm start
```

Trong `client/`:

```bash
npm install
npm run dev
```

Mở http://localhost:5173. API lắng nghe cổng 3000. Vite proxy `/api` để cookie đi cùng origin.

## Một server

Trang và API cùng một process, cổng 3000. `CLIENT_ORIGIN` phải đúng URL trên thanh địa chỉ.

```bash
export SESSION_SECRET=mot-chuoi-dai-bat-ky
export CLIENT_ORIGIN=http://localhost:3000
docker compose up -d --build
```

Mở máy từ xa thì đổi origin thành địa chỉ đó, ví dụ `http://203.0.113.10:3000`, rồi `docker compose up -d`. Database nằm trong volume `app-data`.

Trên Vercel, Root Directory để `.`, framework Container. `vercel.json` gộp client và server thành một container. Không bấm Import single project. Trong project, đặt `SESSION_SECRET` và `CLIENT_ORIGIN` đúng URL Vercel cấp, ví dụ `https://sch-app.vercel.app`. Không đặt `PORT` trừ khi muốn đổi cổng router; mặc định process nghe cổng 80. Deploy lại sau khi thêm biến môi trường.

Test API, trong `server/`:

```bash
npm test
```

## Tổng quan và ghi nhận kết quả

Bốn mục điều hướng: **Công việc**, **Lịch biểu**, **Ghi chú**, **Tổng quan**.

`GET /api/dashboard` trả thống kê cố định 7 ngày và tối đa 5 việc hoàn thành gần đây của user trong session, bằng một request. Ngày của kỳ, biểu đồ, và mốc quá hạn dùng múi Asia/Ho_Chi_Minh (UTC+7, không đổi giờ mùa). Hạn đúng ngày hôm nay chưa quá hạn. Việc không có hạn không tính quá hạn.

`completed_at` được ghi khi việc chuyển sang Hoàn thành, không đổi khi sửa một việc đã xong, và bị xóa khi mở lại. Hoàn thành lại thì ghi mốc mới. Việc đã Hoàn thành từ trước khi có cột này giữ `completed_at` null, không bị gán ngày giả.

Ghi chú kết quả và tự đánh giá (`good`, `met`, `improve`) là tùy chọn. Hoàn thành việc không bắt buộc điền. Mở lại việc không xóa ghi chú. Tự đánh giá là lựa chọn của người dùng, không phải điểm do hệ thống tính.

Tỷ lệ hoàn thành là số việc đang Hoàn thành chia cho tổng việc hiện tại. Chưa có việc thì `rate` là `null` và giao diện hiện "—".

## Refactor 09/11/2026

Ưu tiên công việc chỉ gồm `low`, `high` hoặc `null` (không gắn tag). Tạo mới mặc định `null`; sửa có thể xóa ưu tiên bằng `null`. Migration đổi `medium` cũ thành `null`, giữ nguyên dữ liệu và khóa ngoại.

Đã bỏ `StatusTabs`, API `GET /api/notes/:id`, sort API `priority/title/completed_at`, thống kê 30 ngày và các trường dashboard trùng lặp. Danh sách ghi chú đã chứa dữ liệu để mở editor; tổng quan nhận đủ dữ liệu qua một API.

Có 6 index theo truy vấn thực tế; dùng chung validation cho auth/task/project/note. Bộ test migration kiểm tra giữ dữ liệu, chạy lại, khóa ngoại và rollback khi lỗi. Bản sao database trước khi chuyển nằm trong `server/data/backups/` và không được đưa vào Git.

Các báo cáo tải ngày 08/11 là kết quả **trước refactor**, chưa đại diện cho phiên bản mới. Kịch bản Locust đã cập nhật; xem `performance-test/README.md` để chạy lại.
