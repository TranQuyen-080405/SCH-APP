# Màn hình — Personal Task Management

Sáu màn: Đăng nhập `/login`, Đăng ký `/register`, Công việc `/tasks`, Lịch `/calendar`, Ghi chú `/notes`, Tổng quan `/overview`.

`/` của người đã đăng nhập chuyển tới `/tasks`. Chưa đăng nhập thì về `/login`.

Token và breakpoint nằm ở `design-system.md`. Form task, form ghi chú và hộp xác nhận là dialog hoặc form full màn, không phải mục điều hướng.

## Khung sau đăng nhập

Desktop từ 1024px: sidebar trái 224px, tiêu đề "Việc của tôi", bốn mục dọc, đăng xuất ở đáy. Không thêm thanh trên lặp lại bốn mục.

Tablet 768–1023px: rail icon 64px, có tooltip và tên truy cập.

Mobile dưới 768px: header 56px hiện tên trang và tài khoản. Thanh dưới cố định bốn mục, icon kèm nhãn. Không hamburger. Nội dung không chui xuống thanh dưới.

## Đăng nhập và đăng ký

Giữ form hiện có. Đăng nhập xong vào `/`. Đăng ký xong sang `/login` với câu "Tài khoản đã được tạo. Đăng nhập để tiếp tục." Không tự đăng nhập.

## Công việc

Một cột. Desktop: tiêu đề "Công việc" và một nút "Thêm công việc". Mobile: nút nổi "Thêm việc" phía trên thanh dưới, không lặp nút đó trên header.

Bốn tab: Tất cả, Cần làm, Đang làm, Hoàn thành. Sắp xếp: Hạn gần nhất, Hạn xa nhất, Mới tạo. Mặc định Tất cả và Mới tạo.

Hàng desktop: tiêu đề, mô tả tối đa hai dòng, hạn và ưu tiên, chọn trạng thái, sửa, xóa. Card mobile: tiêu đề và menu Sửa/Xóa, mô tả, hạn và ưu tiên, chọn trạng thái.

Form thêm/sửa: modal 520px từ 768px, full màn bên dưới. Trường tiêu đề, mô tả, hạn, độ ưu tiên (mặc định Trung bình), trạng thái (mặc định Cần làm). Nút "Thêm công việc" hoặc "Lưu thay đổi", và "Hủy".

Đổi sang Hoàn thành không bắt buộc ghi chú. Hiện "Đã hoàn thành." với "Ghi nhận kết quả" và "Bỏ qua".

Xóa hỏi: "Xóa công việc?" / "Công việc này sẽ bị xóa và không thể khôi phục."

## Lịch

Chỉ tháng, thứ bắt đầu từ thứ hai. Tiêu đề "Lịch", nhãn "Tháng M, YYYY", nút tháng trước, tháng sau, "Hôm nay".

Từ 1200px: lưới tháng và panel ngày đang chọn rộng khoảng 300px. Ô ngày hiện tối đa hai tiêu đề, phần dư là "+N công việc". Dưới 1200px panel nằm dưới lưới. Dưới 768px ô chỉ có số ngày và số việc, không nhét tiêu đề; danh sách việc của ngày nằm dưới lưới.

Việc hiện theo hạn. Không hạn thì không vào lịch. Việc hoàn thành vẫn hiện. Việc chưa xong quá hạn có dấu nguy hiểm kèm chữ. Bấm ngày thì chọn ngày. Bấm việc mở form việc. "Thêm công việc" trong panel điền sẵn hạn của ngày đang chọn. "Hôm nay" về tháng hiện tại và chọn ngày hôm nay.

## Ghi chú

Tiêu đề "Ghi chú". Một ô "Viết ghi chú..." mở editor. Không thêm nút tạo thứ hai.

Lưới: một cột dưới 768px, hai cột từ 768px, ba cột từ 1200px. Thẻ tối thiểu khoảng 160px, nền trắng, viền, bán kính 10px, padding 16px. Hiện tiêu đề nếu có, nội dung tối đa bốn dòng, ngày sửa, menu Sửa/Xóa. Sắp theo lần sửa mới nhất.

Editor: modal 560px từ 768px, full màn bên dưới. Tiêu đề tối đa 120 ký tự, không bắt buộc. Nội dung thuần tối đa 10000 ký tự. Phải có tiêu đề hoặc nội dung khác khoảng trắng. Nút "Lưu ghi chú" và "Hủy". Đóng khi còn chữ chưa lưu thì hỏi trước.

Rỗng: "Chưa có ghi chú nào." Xóa hỏi xác nhận.

Ghi chú này không phải ghi nhận kết quả của công việc.

## Tổng quan

Tiêu đề "Tổng quan". Không nút thêm việc.

Bốn ô: "Đã xong (7 ngày)", "Đang làm", "Quá hạn", "Tỷ lệ hoàn thành". Tỷ lệ kèm "Toàn bộ công việc". Chưa có việc thì tỷ lệ là "—".

"Hoàn thành trong 7 ngày": bảy cột. Không có việc hoàn thành trong kỳ thì một câu trống.

"Hoàn thành gần đây": tối đa năm việc, ngày hoàn thành, tự đánh giá và ghi chú nếu có. Bấm việc mở form. "Xem tất cả" sang `/tasks` với tab Hoàn thành.
