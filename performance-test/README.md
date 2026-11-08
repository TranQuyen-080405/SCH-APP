# Kiểm thử hiệu năng

Chạy từ thư mục gốc repo trên Windows (Python 3.11+, Node.js đúng version của source):

```powershell
uv venv --python 3.11 performance-test/.venv
uv pip install --python performance-test/.venv/Scripts/python.exe -r performance-test/requirements.txt
npm --prefix server ci
npm --prefix client ci
npm --prefix client run build
.\performance-test\.venv\Scripts\python.exe performance-test/run.py
```

Mặc định: 100/300/500/1.000 users; tăng 10 users/giây; đợi toàn bộ đăng nhập thành công, warm-up 30 giây rồi **đo riêng 300 giây**. Mỗi mức chạy trên process và SQLite mới; không dùng database thật. Một tài khoản có 20 task, 3 project, 5 note. Mỗi virtual user giữ cookie session riêng, nghỉ ngẫu nhiên 1–3 giây giữa các hành động.

Sau 300 giây, chờ tối đa 5 giây cho request dở dang kết thúc. Thống kê cuối giữ các request này; thời gian thực tế nằm trong `summary.json` và cột Giây của báo cáo QA.

Trọng số hành động: danh sách task 6, lọc task 3, dashboard 3, project 2, note 2, hồ sơ 1, sửa task 2, tạo–xóa task 1. Hành động tạo–xóa phát sinh hai request. Kiểm tra HTTP status và JSON; ID động gộp vào tên endpoint. Đăng nhập nằm trong giai đoạn chuẩn bị, không đưa vào kết quả tải ổn định. Đây không phải benchmark đăng nhập, tốc độ tải trang hay trình duyệt.

Chạy ngắn để kiểm tra kịch bản:

```powershell
.\performance-test\.venv\Scripts\python.exe performance-test/run.py --users 5 --seconds 10 --warmup 2 --spawn-rate 5 --label smoke
```

Kết quả tại `performance-test/reports/<thời-gian>-<nhãn>/`:

- `environment.json`, `summary.json`: môi trường và số liệu tổng hợp.
- `users-*/report.html`, `locust_*.csv`, `locust.log`: báo cáo Locust, từng endpoint, lỗi và lịch sử.
- `users-*/resources.csv`: CPU/RAM Node và máy chủ, lấy mẫu mỗi giây.
- `users-*/database.json`: số truy vấn, latency trung bình/P50/P95/P99, truy vấn chậm từ 100 ms.
- `users-*/config.json`, `measurement-*.json`: cấu hình và mốc đo để đối chiếu; CSV history có cả ramp-up/warm-up, chỉ lọc giữa hai mốc này khi phân tích tải ổn định.

Lọc bốn mức tải đã chạy đủ 5 phút vào phần hiệu năng của báo cáo QA:

```powershell
.\performance-test\.venv\Scripts\python.exe performance-test/summarize.py performance-test/reports/<thư-mục-lần-chạy>
```

CPU Node tính theo một logical CPU (100% = một lõi; có thể vượt 100% khi nhiều luồng). RAM là RSS. Disk/Network I/O là bộ đếm **toàn máy**, gồm ứng dụng khác; NIC trên Windows có thể không ghi nhận localhost. Không suy ra băng thông API từ NIC. SQLite có một kết nối dùng chung, không có pool/process riêng. Thời gian query đo `get/all/run`, gồm binding và trả kết quả; không gồm prepare hay thời gian chờ HTTP. Instrumentation chỉ ở launcher benchmark, có thêm overhead. Không đổi schema, PRAGMA hoặc mã nguồn production để tăng số đo.

Máy sinh tải và server cùng máy: kết quả dùng so sánh các mức tải trong môi trường này, chưa xác định năng lực production hoặc SLA. Không đo container khi Docker daemon chưa chạy. Không có ngưỡng nghiệm thu hiệu năng được chốt trước.

Tham chiếu: [Locust: viết kịch bản](https://docs.locust.io/en/stable/writing-a-locustfile.html), [xuất HTML/CSV](https://docs.locust.io/en/2.45.0/configuration.html), [psutil](https://psutil.io/), [better-sqlite3](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md).

Phiên bản hợp đồng 09/11/2026 dùng priority low/high/null và một API dashboard 7 ngày. Các thư mục report 08/11 là số liệu trước refactor, giữ nguyên để đối chiếu; không coi là benchmark của bản mới.
