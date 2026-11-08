# Màn hình — Personal Task Management

Sáu màn: Đăng nhập `/login`, Đăng ký `/register`, Công việc `/tasks`, Lịch `/calendar`, Ghi chú `/notes`, Tổng quan `/overview`.

`/` của người đã đăng nhập chuyển tới `/tasks`. Chưa đăng nhập thì về `/login`.

Token và breakpoint nằm ở `design-system.md`. Form task, form ghi chú và hộp xác nhận là dialog hoặc form full màn, không phải mục điều hướng.

## Khung sau đăng nhập

Cả bốn trang dùng cùng khung Focus To-Do toàn cửa sổ, nền xám nhạt, sidebar trắng 272px từ 1024px, header trắng có viền dưới cao 64px, nội dung cùng padding. Sidebar có chữ SCHE-APP màu coral, font Lora, không có icon thương hiệu hoặc ô tìm kiếm; lối tắt chỉ có icon, danh sách dự án giữ tên/màu/số việc và bốn liên kết chính chỉ có icon. Không có nút đăng xuất ở đáy sidebar. Header có icon mở lịch và menu tài khoản; Đăng xuất nằm trong menu tài khoản. Chuyển trang không thay đổi chiều rộng sidebar hay vị trí header/nội dung.

Từ Lịch biểu, Ghi chú và Tổng quan, chọn dự án hoặc lối tắt đều dẫn tới danh sách Công việc tương ứng. Chỉ route chính đang mở có `aria-current=page`; lối tắt/dự án không đánh dấu đang chọn khi ở trang khác. Mọi icon điều hướng có tooltip và `aria-label`.

Tablet 768–1023px: rail icon 72px, có tooltip và tên truy cập.

Mobile dưới 768px: header 64px hiện chữ SCHE-APP màu coral, font Lora và tài khoản. Thanh dưới cố định bốn mục chỉ có icon, kèm tooltip và tên truy cập. Không hamburger. Nội dung không chui xuống thanh dưới.

Toàn bộ nội dung và control dùng Lora như Lịch biểu; tiêu đề trang 32px/44px. Không có câu giới thiệu dưới tiêu đề hoặc lời động viên trên thẻ số liệu.

## Đăng nhập và đăng ký

Giữ form hiện có. Đăng nhập xong vào `/`. Đăng ký xong sang `/login` với câu "Tài khoản đã được tạo. Đăng nhập để tiếp tục." Không tự đăng nhập.

## Công việc

Tiêu đề theo bộ lọc hoặc tên dự án. Nút "Thêm công việc" (mobile: "Thêm việc") mở form đầy đủ. Bốn số liệu thật của danh sách đang hiển thị: Cần làm, Đang làm, Quá hạn, Hoàn thành. Bỏ bảng cột theo ngày cũ.

Sidebar có SCHE-APP, Tất cả công việc, Hôm nay, Ưu tiên cao/thấp, Đã hoàn thành, Chưa chia dự án và danh sách dự án. Mỗi dự án có chấm màu, tên và số việc chưa hoàn thành trên toàn dự án. Có nút Thêm dự án. Khi chọn dự án, cạnh tiêu đề có nút Sửa/Xóa dự án.

Thanh công cụ có phạm vi (Tất cả, Hôm nay, 7 ngày tới, Quá hạn, ưu tiên cao/thấp, ba trạng thái), dự án và sắp xếp (Hạn gần nhất, Hạn xa nhất, Mới tạo). Mặc định Tất cả/Mới tạo. Tìm tiêu đề và mô tả trên danh sách đã tải. Mobile có cùng bộ lọc và ô tìm trong nội dung.

Hôm nay lọc theo hạn đúng hôm nay; 7 ngày tới gồm hôm nay và sáu ngày sau; Quá hạn loại trừ việc hoàn thành và không hạn. Bộ lọc kết hợp với dự án, trạng thái, ưu tiên và tìm kiếm.

Thanh thêm nhanh lưu khi nhấn Enter vào dự án đang chọn; điền trước ưu tiên, Đang làm nếu đang lọc trạng thái này, và hạn hôm nay nếu lọc Hôm nay/7 ngày tới. Không hiện ở danh sách đang tải, Hoàn thành hoặc Quá hạn. Nếu lỗi thì giữ nội dung để sửa hoặc thử lại.

Danh sách chia theo tên/màu dự án; việc cũ hoặc không chọn dự án nằm ở Chưa chia dự án. Chỉ hiện nhóm có việc. Mỗi hàng có nút tròn hoàn thành/mở lại, tiêu đề mở form sửa, cờ ưu tiên, dấu có mô tả, hạn và cảnh báo quá hạn, chọn trạng thái và menu Sửa/Xóa. Trên mobile trạng thái và hạn xuống hàng để không tràn ngang.

Form thêm/sửa: modal 520px từ 768px, full màn bên dưới. Trường tiêu đề, mô tả, dự án (mặc định Chưa chia dự án hoặc dự án đang chọn), hạn, độ ưu tiên (mặc định Trung bình), trạng thái (mặc định Cần làm). Nút "Thêm công việc" hoặc "Lưu thay đổi", và "Hủy".

Form dự án có tên tối đa 80 ký tự và sáu màu. Xóa dự án hỏi xác nhận, nêu rõ giữ các công việc và chuyển chúng về Chưa chia dự án. Chỉ dự án thuộc tài khoản hiện tại xuất hiện trong sidebar và form.

Đổi sang Hoàn thành không bắt buộc ghi chú. Hiện "Đã hoàn thành." với "Ghi nhận kết quả" và "Bỏ qua".

Xóa hỏi: "Xóa công việc?" / "Công việc này sẽ bị xóa và không thể khôi phục."

## Lịch

Chỉ tháng, thứ bắt đầu từ thứ hai. Tiêu đề "Lịch", nhãn "Tháng M, YYYY", nút tháng trước, tháng sau, "Hôm nay".

Từ 1280px: lưới tháng và panel ngày đang chọn rộng 270px. Ô ngày hiện tối đa hai tiêu đề, phần dư là "+N công việc". Dưới 1280px panel nằm dưới lưới. Dưới 768px ô chỉ có số ngày và số việc; danh sách việc của ngày nằm dưới lưới. Checkbox Cần làm / Đang làm / Hoàn thành lọc cả lưới và panel; từng ô tick dùng màu ochre / coral / xanh lá tương ứng, đi cùng nhãn trạng thái, không có chấm màu riêng. Ngày ở tháng liền kề chỉ để tham chiếu.

Việc hiện theo hạn. Không hạn thì không vào lịch. Việc hoàn thành vẫn hiện. Việc chưa xong quá hạn có dấu nguy hiểm kèm chữ. Bấm ngày thì chọn ngày. Bấm việc mở form việc. "Thêm công việc" trong panel điền sẵn hạn của ngày đang chọn. "Hôm nay" về tháng hiện tại và chọn ngày hôm nay.

## Ghi chú

Tiêu đề "Ghi chú", một nút "Ghi chú mới" mở editor. Bỏ ba ô thao tác và toàn bộ kiểu bìa sổ cũ.

Khung dùng cùng theme Công việc; nút Ghi chú mới và Lưu ghi chú dùng coral. Bỏ danh sách xem nhanh dọc bên trái. Bảng giấy dùng toàn bộ chiều rộng nội dung.

Mỗi thẻ là một tờ Sticky Note rộng tối đa 300px, cao 320px, có bốn màu pastel. Bấm nội dung mở editor. Thanh đầu có tay cầm kéo, ngày và menu Sửa/Xóa. Kéo bằng chuột/cảm ứng từ 4px trở lên đưa giấy ra lớp nổi phía trên ứng dụng. Bấm thanh đầu mà không kéo thì giấy ở nguyên trên bảng. Giấy nổi vẫn hiện khi chuyển giữa Công việc, Lịch biểu, Ghi chú, Tổng quan và khi cuộn trang; không mở cửa sổ ngoài trình duyệt. Giấy đang chọn nằm trên cùng. Phím mũi tên dịch 10px, giữ Shift dịch 50px; thao tác này cũng đưa giấy ra lớp nổi. Menu chỉ có Sửa và Xóa, bỏ bốn nút dịch hướng. Escape hoặc pointer cancel hủy lần kéo hiện tại.

Mỗi giấy nổi có nút X "Đưa về Ghi chú". Đóng chỉ cất giấy về bảng Ghi chú, giữ nguyên nội dung/màu/vị trí bảng và trang hiện tại; thao tác X không gọi DELETE. Không hiện bản sao của giấy trên bảng khi giấy đang nổi. Có thể sửa và xác nhận xóa từ lớp nổi ở bất kỳ mục nào; dialog nằm trên lớp nổi. Khi mọi giấy đều nổi, trang Ghi chú hiện trạng thái này thay vì báo chưa có ghi chú.

Lớp nổi thuộc `NotesProvider` trong khung ứng dụng, không thuộc riêng route `/notes`. Tọa độ nổi tính theo viewport, giới hạn để nút X luôn thấy được và chừa thanh điều hướng dưới trên mobile; màn hình thấp thì giấy giảm chiều cao. Trạng thái nổi giữ khi chuyển mục trong phiên, tải lại hoặc đăng xuất thì giấy trở về bảng. Tạo/sửa nội dung và màu vẫn lưu server; kéo hoặc cất giấy không sửa dữ liệu. Vị trí bảng đã lưu trước đó vẫn được đọc; giấy chưa có vị trí được xếp tự động. Bảng tự tăng chiều cao và có cuộn ngang bên trong khi cần; trang không cuộn ngang.

Editor là cửa sổ giấy rộng 560px từ 768px, full màn bên dưới. Có chọn Màu giấy: vàng, xanh lá, hồng, xanh dương; đổi màu xem trước ngay trong editor. Tạo mới mặc định vàng; sửa giữ màu hiện có. Màu được lưu trên server, không còn phụ thuộc id. Thanh đầu có tên thao tác và nút đóng. Tiêu đề và vùng viết dùng nền trong suốt; ngày nằm ở chân cùng nút "Lưu ghi chú" / "Hủy". Tiêu đề tối đa 120 ký tự, không bắt buộc; nội dung thuần tối đa 10000 ký tự, phải có tiêu đề hoặc nội dung khác khoảng trắng. Đóng khi còn thay đổi, kể cả chỉ đổi màu, thì hỏi trước. Giữ validation và xác nhận xóa, không đổi định dạng lưu nội dung.

Rỗng: "Chưa có ghi chú nào." Xóa hỏi xác nhận.

Ghi chú này không phải ghi nhận kết quả của công việc.

## Tổng quan

Tiêu đề "Tổng quan". Không nút thêm việc.

Bốn ô: "Đã xong (7 ngày)", "Đang làm", "Quá hạn", "Tỷ lệ hoàn thành". Tỷ lệ kèm "Toàn bộ công việc". Chưa có việc thì tỷ lệ là "—".

Các số liệu dùng cùng thanh thống kê với Công việc: nền trắng, góc 8px, số coral 26px, nhãn 11px, hai cột trên mobile và bốn cột từ 640px. Các biểu đồ và danh sách dùng khối trắng trên nền xám chung.

"Hoàn thành trong 7 ngày": bảy cột, dùng `dashboard.trend` từ API kỳ 7d. Không có việc hoàn thành trong kỳ thì hiện số 0 và một câu trống. Biểu đồ tròn phân bổ ba trạng thái; thẻ thời hạn đếm việc chưa hoàn thành đã quá hạn / chưa quá hạn, có ghi rõ việc không hạn được tính vào nhóm chưa quá hạn.

"Hoàn thành gần đây": gọi danh sách việc hoàn thành sắp theo `completed_at`, lấy tối đa năm việc; hiện ngày hoàn thành, tự đánh giá và ghi chú nếu có. Bấm việc mở form. "Xem tất cả" sang `/tasks?status=done` với tab Hoàn thành.
