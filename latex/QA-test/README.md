# Báo cáo QA

Biên dịch `report.tex` bằng pdfLaTeX với bộ font tiếng Việt VnTeX; chạy hai lần để cập nhật mục lục.

- `chapters/`: kế hoạch, kết quả chức năng và các bảng số liệu hiệu năng.
- `evidence/`: log test tự động.
- `../../performance-test/`: kịch bản Locust và hướng dẫn chạy lại.

Chạy lại test chức năng từ thư mục gốc (không dùng secret hoặc database thật):

```powershell
$env:SESSION_SECRET = 'qa-isolated-local-test-secret'
$env:CLIENT_ORIGIN = 'http://localhost:5173'
Push-Location server
node --test --test-reporter=tap
Pop-Location
Push-Location client
node --test --test-reporter=tap
npm run build
Pop-Location
```

Các test backend tự tạo SQLite tạm và dọn sau khi chạy. Log mới nhất tại `evidence/20261109-refactor/`: 63 test backend, 12 test frontend, không fail/skip. Log ngày 08/11 ở thư mục evidence gốc giữ làm lịch sử.

Kết quả performance được lọc từ JSON/CSV thực tế bằng `performance-test/summarize.py`. Giữ nguyên thư mục raw report ghi trong chương kết quả để đối chiếu. Không dùng số đo localhost làm SLA production.

Bốn mức tải ngày 08/11 thuộc source trước refactor. Đợt 09/11 mới chạy smoke 20 users/20 giây, 200 request, 0 lỗi; chưa dùng để chốt năng lực hệ thống mới.

Sau cập nhật khung ghi chú: 14/14 test frontend đạt. Kiểm tra kéo thả bằng chuột và cảm ứng Chrome mô phỏng tại `evidence/20261109-note-slots/`; chạy lại sau build bằng Python có Playwright: `python client/test/notes.browser.py`.
