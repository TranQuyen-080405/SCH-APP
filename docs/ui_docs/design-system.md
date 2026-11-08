# Design system — Personal Task Management

Nguồn: `docs/ui_docs/ui_lead.md`. File này khóa token và quy tắc nhìn. Bố cục màn hình nằm ở `screens.md`. Component nằm ở `components.md`.

Khi chữ hoặc layout lệch với `docs/user-flow.md`, phần giao diện làm theo thư mục `docs/ui_docs`. Dữ liệu và HTTP vẫn làm theo `docs/api-contract.md`.

## Cảm giác

Ứng dụng ghi việc hằng ngày: gọn, nhẹ, tĩnh. Người mở trang biết bước tiếp theo mà không cần hướng dẫn.

Cả bốn trang dùng cùng phong cách Focus To-Do của Công việc: khung toàn cửa sổ, sidebar trắng, nền xám nhạt, điểm nhấn coral và khối nội dung gọn. Không tách theme hoặc khung theo route. Ghi chú giữ giấy Sticky Notes pastel vàng/xanh lá/hồng/xanh dương trong vùng nội dung và editor. Toàn bộ giao diện dùng Lora như Lịch biểu. Không thêm gradient trang trí, glass, neon hay animation trang trí.

Đầu sidebar chỉ hiện chữ SCHE-APP màu coral, cùng font Lora, thay icon thương hiệu và ô tìm kiếm. Trên mobile chữ thương hiệu nằm ở header. Các mục điều hướng chỉ hiển thị icon, có `aria-label`, tooltip và trạng thái đang chọn. Tên dự án vẫn hiện để phân biệt dữ liệu. Không hiện lời giới thiệu dưới tiêu đề trang, thẻ quảng bá Lên kế hoạch hay các câu động viên trên số liệu; giữ nhãn dữ liệu, hướng dẫn trường cần thiết, trạng thái rỗng và thông báo lỗi.

## Token

Một font chung Lora, fallback Georgia/Times New Roman/serif, hỗ trợ tiếng Việt. Cả `font-sans` (token font mặc định hiện có) và `font-display` trỏ tới cùng font này; nội dung, nút, input, dialog và tiêu đề thống nhất font với Lịch biểu.

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| frame | `#F7F7FA` | Nền ứng dụng |
| canvas | `#F7F7FA` | Nền nội dung |
| surface | `#FFFFFF` | Sidebar, card, modal, input |
| paper | `#FFFFFF` | Nền giấy trắng |
| primary | `#CF3E4D` | Nút chính, icon, trạng thái Đang làm |
| primary-hover | `#B83341` | Hover nút chính |
| ink | `#3F4756` | Chữ chính, tab và hàng điều hướng đang chọn |
| muted | `#687281` | Chữ phụ, mô tả |
| line | `#EDEDF2` | Viền, đường chia |
| peach | `#F7E0D7` | Ô Công việc, cảnh báo nhẹ |
| sage | `#E6ECDF` | Hoàn thành, thẻ lịch |
| stone | `#EAE6DE` | Ô Tổng quan, màu trung tính |
| danger | `#D04250` | Quá hạn, nút Xóa, ưu tiên Cao |
| success | `#486C49` | Trạng thái Hoàn thành |

Bán kính chung: input/nút `6px`, card/modal `8px`. Khung trang không bo góc hoặc cách mép trên desktop.

Token ở `@theme` dùng chung cho Công việc, Lịch biểu, Ghi chú, Tổng quan và các dialog. Không ghi đè màu riêng cho Công việc. Tiêu đề việc 14px, chữ phụ 11–12px. Màu dự án là chấm màu đi cùng tên, không thay thế nhãn.

Modal, menu, toast dùng một lớp bóng nhẹ. Hàng task là khối trắng trên nền xám. Sticky Notes là ngoại lệ của nội dung: viền mỏng, góc 3px, bóng giấy nhẹ và tam giác gấp nhỏ ở góc dưới; màu giấy và thanh đầu dùng chung giữa danh sách, thẻ và editor. Nút chính của editor vẫn dùng coral và cùng bán kính control. Không dùng ảnh hoặc thư viện mới.

Khoảng cách theo bội số của 8: 8, 16, 24, 32. Ngoại lệ 4px chỉ cho khe giữa icon và chữ.

Tiêu đề các trang cùng Lora 32px trên mobile, 44px từ 768px, nét thường. Tiêu đề task 14px. Chữ phụ 12–14px. Ghi chú hiện tiêu đề, nội dung và ngày trực tiếp trên tờ giấy màu.

Icon từ `lucide-react`, cỡ 18–20px. Điều hướng dùng `ListTodo`, `CalendarDays`, `NotebookPen`, `ChartNoAxesColumn`.

## Màu có nghĩa

Luôn kèm chữ. Không để màu là tín hiệu duy nhất.

| Ý | Nền | Chữ |
| --- | --- | --- |
| Cần làm | `#F3E7CF` | `#826021` |
| Đang làm | `#FFF0F1` | `#CC4E59` |
| Hoàn thành | `#E6ECDF` | `#486C49` |
| Quá hạn | không tô nền | `#D04250` |
| Ưu tiên Thấp | `#EAE6DE` | `#68665F` |
| Ưu tiên Cao | `#F7E0D7` | `#A04537` |

## Nhãn ↔ giá trị API

UI nói tiếng Việt. Request gửi giá trị API.

| Trên UI | Gửi API |
| --- | --- |
| Cần làm | `todo` |
| Đang làm | `doing` |
| Hoàn thành | `done` |
| Thấp | `low` |
| Không gắn ưu tiên | `null` |
| Cao | `high` |
| Tất cả | không gửi `status` |
| Hạn gần nhất | `sort=deadline&order=asc` |
| Hạn xa nhất | `sort=deadline&order=desc` |
| Mới tạo | `sort=created_at&order=desc` |
| Tốt | `good` |
| Đạt yêu cầu | `met` |
| Cần cải thiện | `improve` |
| 7 ngày | 7 ngày cố định |
| Tổng quan | Cố định 7 ngày, không có bộ chọn kỳ |


Sau đăng nhập vào `/tasks`. Mặc định Tất cả, sắp xếp Mới tạo, danh sách nhóm theo dự án. Lọc trạng thái, độ ưu tiên và dự án lưu trong query `status`, `priority`, `projectId` và gửi tới API. `projectId=none` lấy việc chưa chia dự án. `when=today|week|overdue` và `q` tìm trong tiêu đề/mô tả trên dữ liệu đã tải. Lọc và sắp xếp giữ nguyên khi mở rồi đóng form trong cùng phiên trang.

## Ngày

`deadline` từ API là `YYYY-MM-DD`. Hiện `dd/mm/yyyy`, ví dụ `10/11/2026`.

Quá hạn khi `deadline` nhỏ hơn ngày hôm nay theo lịch máy người dùng, và `status` khác `done`. Việc Đang làm vẫn có thể quá hạn. Không có deadline thì không hiện dòng ngày và không gọi là quá hạn.

## Breakpoint

| Bề rộng | Bố cục |
| --- | --- |
| dưới 768px | Không sidebar. Header 64px. Thanh dưới bốn icon, cao khoảng 64px cộng safe area. Form full màn |
| 768–1023px | Khung toàn cửa sổ, rail icon 72px. Header 64px. Panel phụ xếp dưới nội dung chính |
| từ 1024px | Khung toàn cửa sổ, sidebar trắng 272px. Header 64px. Nội dung padding ngang 28–36px |

Bốn mục: Công việc `/tasks`, Lịch `/calendar`, Ghi chú `/notes`, Tổng quan `/overview`. `/` chuyển tới `/tasks`.

Cả bốn trang dùng cùng sidebar và vị trí nội dung. Bộ lọc lối tắt và điều hướng chỉ hiện icon; danh sách dự án giữ tên/màu/số việc. Đánh dấu route chính đang mở bằng `NavLink`; lối tắt công việc và dự án chỉ đánh dấu đang chọn khi ở `/tasks`. Từ các trang khác, chọn dự án hoặc lối tắt dẫn tới `/tasks` với bộ lọc tương ứng. Mobile Công việc có bộ lọc dự án cùng nút thêm ở một hàng, phạm vi cùng sắp xếp ở hàng tiếp theo.

Trang không cuộn ngang. Riêng hàng tab trên mobile được cuộn ngang trong chính hàng đó.

Bảng Ghi chú có các khung nét đứt cố định, mỗi khung chứa một giấy; luôn có ô trống để thả. Kéo vào ô trống sẽ khớp khuôn và lưu `position` qua API; kéo ra ngoài các ô đưa giấy lên lớp nổi `z-40` và để lại khung trống. Ô có giấy từ chối thả chồng; lỗi lưu trả giấy về vị trí trước. Bảng cuộn ngang khi thu nhỏ màn hình để giữ vị trí đã xếp. Màu giấy chọn trong editor, lưu cùng ghi chú; bốn màu dùng chung giữa editor và bảng. Hỗ trợ chuột, cảm ứng, phím mũi tên để lấy giấy ra và chọn ô trống bằng bàn phím để cất giấy nổi. Escape hủy kéo; nút X cất vào ô trống, không xóa dữ liệu. Giấy nổi giữ theo viewport khi chuyển route và cuộn trang; resize giữ giấy và nút X trong màn hình, chừa điều hướng mobile. Lớp nền nổi không chặn tương tác; dialog ở `z-50`. Vị trí nổi chỉ giữ trong phiên giao diện, vị trí đã thả vào khung giữ sau tải lại trang.

## Tương tác

- Focus thấy rõ trên input, nút, tab, link.
- Icon bấm được có tên truy cập. Tooltip không thay cho tên đó.
- Vùng chạm tối thiểu 44×44px dưới 768px.
- Dialog đóng bằng Escape, nút X, và nút Hủy.
- Không cần hover mới dùng được chức năng.
- Chuyển trạng thái ngắn 150–200ms. `prefers-reduced-motion: reduce` thì tắt chuyển động.

## Cài đặt

Tailwind CSS 4.3.4 và `@tailwindcss/vite` 4.3.4. `lucide-react` 1.67.0. Chi tiết lệnh nằm ở `docs/tech-stack.md`.

`client/src/index.css` chứa `@import "tailwindcss"` và các token màu ở trên. Không viết một file CSS thủ công song song cho từng component.

## Không đưa vào giao diện

Kanban theo trạng thái, kéo-thả công việc, giao việc, bình luận, tệp đính kèm, nhãn, thư mục ghi chú, việc con, chuông, streak, lịch theo giờ, tuần, năm, đồng bộ lịch, sự kiện lặp, Pomodoro và theo dõi thời gian. Dự án, tìm công việc và bảng giấy ghi chú kéo tự do/chọn màu được bổ sung theo yêu cầu người dùng. Số liệu Công việc và Tổng quan lấy dữ liệu thật, không hiển thị giờ ước lượng giả theo ảnh mẫu.

Mỗi khối phải phục vụ một thao tác: xem, lọc, sắp xếp, thêm, sửa, đổi trạng thái, xóa, đăng nhập, đăng ký, đăng xuất.

## Popup chọn thống nhất

Toàn bộ danh sách chọn dùng `components/Select.jsx`: bộ lọc công việc, dự án, sắp xếp, trạng thái trên task, dự án/ưu tiên/trạng thái trong form và tự đánh giá. Không dùng popup select của hệ điều hành.

Trigger cao 44px, viền line, nền surface, font Lora và mũi tên Lucide. Popup dùng `.dropdown-panel`: nền trắng, góc card 8px, cùng bóng overlay; hàng đang chọn có nền doing-bg, chữ primary và dấu tick. Hàng tối thiểu 44px, tên dài có thể xuống dòng trong popup. Trigger có lỗi dùng viền danger; disabled giảm opacity và khóa thao tác.

Popup định vị fixed bằng portal, tự mở lên/xuống, giới hạn chiều cao 288px và vừa viewport. Trong dialog, portal nằm trong dialog để giữ phạm vi truy cập của modal. Các menu tài khoản/công việc/ghi chú dùng chung vỏ `.dropdown-panel`.

Phím mũi tên, Home/End di chuyển; Enter/Space xác nhận; gõ chữ tìm lựa chọn; Tab/Escape hoặc bấm ngoài đóng popup. Escape khi popup mở không đóng luôn form cha. Giữ role combobox/listbox/option, nhãn trường, aria-selected, aria-expanded và thông báo validation.

Thanh cuộn popup dùng kiểu thin, thumb primary/coral và track canvas, kèm quy tắc WebKit bo tròn; giữ gutter để chiều rộng các lựa chọn không nhảy khi xuất hiện thanh cuộn. Kiểm tra danh sách dự án dài bằng cuộn chuột và Home/End/Enter, không chỉ fixture ngắn.
