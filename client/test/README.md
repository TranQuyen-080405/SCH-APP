# Kiểm tra frontend

Từ thư mục `client`: `npm test` chạy test logic và render React SSR; `npm run build` kiểm tra bản production.

Kiểm tra tương tác dropdown bằng Chrome desktop và cảm ứng mô phỏng, từ thư mục gốc repo:

```powershell
uv pip install --python performance-test/.venv/Scripts/python.exe -r client/test/requirements-browser.txt
npm --prefix client run build
.\performance-test\.venv\Scripts\python.exe client/test/select.browser.py
```

Cần Chrome đã cài trên máy. Script khởi động backend riêng với SQLite tạm, kiểm tra lọc/dự án/sắp xếp/trạng thái/form/tự đánh giá, keyboard/touch, vị trí popup và lỗi JavaScript. Không dùng database hoặc server đang chạy của người dùng. Kết quả và ảnh ở `latex/QA-test/evidence/20261109-selects/`.
