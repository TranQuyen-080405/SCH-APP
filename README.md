# Việc của tôi

Ứng dụng quản lý công việc cá nhân: đăng ký, đăng nhập, danh sách việc, và một màn tổng quan để xem việc đã xong.

## Chạy

Runtime mục tiêu là Node.js 26, theo `docs/tech-stack.md`.

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

Test API, trong `server/`:

```bash
npm test
```

## Tổng quan và ghi nhận kết quả

Hai mục trên header: **Công việc** và **Tổng quan**.

`GET /api/dashboard?period=7d` hoặc `30d` chỉ trả số của user trong session. Ngày của kỳ, biểu đồ, và mốc quá hạn dùng múi Asia/Ho_Chi_Minh (UTC+7, không đổi giờ mùa). Hạn đúng ngày hôm nay chưa quá hạn. Việc không có hạn không tính quá hạn.

`completed_at` được ghi khi việc chuyển sang Hoàn thành, không đổi khi sửa một việc đã xong, và bị xóa khi mở lại. Hoàn thành lại thì ghi mốc mới. Việc đã Hoàn thành từ trước khi có cột này giữ `completed_at` null, không bị gán ngày giả.

Ghi chú kết quả và tự đánh giá (`good`, `met`, `improve`) là tùy chọn. Hoàn thành việc không bắt buộc điền. Mở lại việc không xóa ghi chú. Tự đánh giá là lựa chọn của người dùng, không phải điểm do hệ thống tính.

Tỷ lệ hoàn thành là số việc đang Hoàn thành chia cho tổng việc hiện tại. Chưa có việc thì `rate` là `null` và giao diện hiện "—".
