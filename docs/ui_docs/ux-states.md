# Trạng thái giao diện — Personal Task Management

## Danh sách

| Tình huống | Hiện |
| --- | --- |
| Đang chờ session lúc mở app | "Đang tải..." giữa trang |
| Đang tải task | Ba hàng skeleton. Toolbar không nhảy |
| Chưa có task, tab Tất cả | "Chưa có công việc nào." và "Thêm công việc đầu tiên để bắt đầu." |
| Tab hoặc kết quả sắp xếp ra rỗng | "Không có công việc phù hợp." |
| `GET /api/tasks` lỗi | "Không thể tải công việc" và nút "Thử lại" |
| Mạng đứt, fetch reject | "Không kết nối được máy chủ." và nút "Thử lại" |
| 401 ở bất kỳ API nào | Xóa phiên trên UI, về `/login` |

Skeleton không làm nhấp cả trang. Đổi tab không xóa khung toolbar.

## Toast

Chỉ sau khi server trả thành công.

| Việc | Câu |
| --- | --- |
| Tạo task | Đã thêm công việc |
| Sửa task từ form | Đã lưu công việc |
| Xóa task | Đã xóa công việc |

Đổi trạng thái trên hàng không toast, vì dropdown đã hiện giá trị mới. Đổi tab hoặc sắp xếp không toast.

## Lỗi gắn vào ô

API trả một câu `error`. UI đặt câu đó dưới đúng ô nếu câu thuộc bảng này. Còn lại hiện một dòng trên đầu form, không phải stack trace.

| Câu từ API | Ô |
| --- | --- |
| Email không được để trống | Email |
| Email không đúng định dạng | Email |
| Mật khẩu không được để trống | Mật khẩu |
| Mật khẩu phải từ 8 đến 128 ký tự | Mật khẩu |
| Xác nhận mật khẩu không được để trống | Xác nhận mật khẩu |
| Xác nhận mật khẩu không khớp | Xác nhận mật khẩu |
| Tiêu đề không được để trống | Tiêu đề |
| Tiêu đề không được dài quá 200 ký tự | Tiêu đề |
| Mô tả không hợp lệ | Mô tả |
| Mô tả không được dài quá 2000 ký tự | Mô tả |
| Deadline không phải ngày hợp lệ | Hạn hoàn thành |
| Trạng thái không hợp lệ | Trạng thái |
| Độ ưu tiên không hợp lệ | Độ ưu tiên |

Đăng nhập sai: dòng trên form, nguyên câu `Email hoặc mật khẩu không đúng`. Không gắn vào ô mật khẩu.

Trước khi gọi API, chặn gửi nếu tiêu đề trim xong rỗng, hoặc xác nhận mật khẩu khác mật khẩu. Dùng đúng câu trong bảng trên. Server vẫn là chỗ quyết định cuối.

Lỗi thì không xóa chữ người dùng đã gõ. Nút submit mở lại.

## Xóa và trạng thái

Hủy dialog xóa thì không gọi API. Đang xóa thì khóa cả hai nút dialog.

Đổi trạng thái: khóa riêng dropdown của hàng đó đến khi `list` xong. Hàng khác vẫn bấm được.

## Tổng quan

| Tình huống | Hiện |
| --- | --- |
| Đang tải | Skeleton bốn ô và một khối. Không điền số 0 giả |
| `GET /api/dashboard` lỗi | "Không thể tải tổng quan" và nút "Thử lại" |
| Mạng đứt | "Không kết nối được máy chủ." và nút "Thử lại" |
| Chưa có việc | Tỷ lệ "—", chú thích "Chưa có công việc" |
| Không có việc hoàn thành trong kỳ | "Chưa có việc hoàn thành trong khoảng này." |
| Chưa có việc hoàn thành | "Chưa có công việc hoàn thành." ở mục gần đây |

Lưu ghi chú thành công: toast "Đã lưu ghi chú".

## Quá hạn

Chỉ là cách hiện ngày, tính trên client theo `design-system.md`. Không có status `overdue` và không gửi thêm field.
