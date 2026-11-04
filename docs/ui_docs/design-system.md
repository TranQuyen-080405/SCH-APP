# Design system — Personal Task Management

Nguồn: `docs/ui_docs/ui_lead.md`. File này khóa token và quy tắc nhìn. Bố cục màn hình nằm ở `screens.md`. Component nằm ở `components.md`.

Khi chữ hoặc layout lệch với `docs/user-flow.md`, phần giao diện làm theo thư mục `docs/ui_docs`. Dữ liệu và HTTP vẫn làm theo `docs/api-contract.md`.

## Cảm giác

Ứng dụng ghi việc hằng ngày: gọn, nhẹ, tĩnh. Người mở trang biết bước tiếp theo mà không cần hướng dẫn.

Không làm trang quản trị hay phần mềm quản lý dự án. Màn Tổng quan là ngoại lệ hẹp: bốn số, một biểu đồ cột theo ngày, và ghi chú người dùng tự viết. Không gradient, glass, 3D, neon, animation trang trí.

## Token

Font Inter, fallback sans hệ thống, hỗ trợ tiếng Việt.

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| canvas | `#F8FAFC` | Nền trang |
| surface | `#FFFFFF` | Card, modal, input |
| primary | `#2563EB` | Nút chính, tab đang chọn, trạng thái Đang làm |
| primary-hover | `#1D4ED8` | Hover nút chính |
| ink | `#0F172A` | Chữ chính, tiêu đề task |
| muted | `#475569` | Chữ phụ, mô tả |
| line | `#E2E8F0` | Viền, đường chia |
| danger | `#B91C1C` | Quá hạn, nút Xóa, ưu tiên Cao |
| success | `#166534` | Trạng thái Hoàn thành |
| warning | `#92400E` | Ưu tiên Trung bình |

Bán kính: input và nút `8px`, card và modal `10px`.

Đổ bóng chỉ trên modal, menu, toast: một lớp rất nhẹ. Hàng task dùng viền, không dùng bóng.

Khoảng cách theo bội số của 8: 8, 16, 24, 32. Ngoại lệ 4px chỉ cho khe giữa icon và chữ.

Chữ thân 16px trên mobile, 14px cho metadata. Không nhỏ hơn 14px. Tiêu đề task 16px, đậm vừa.

Icon từ `lucide-react`, cỡ 18–20px. Điều hướng dùng `ListTodo`, `CalendarDays`, `NotebookPen`, `ChartNoAxesColumn`.

## Màu có nghĩa

Luôn kèm chữ. Không để màu là tín hiệu duy nhất.

| Ý | Nền | Chữ |
| --- | --- | --- |
| Cần làm | `#F1F5F9` | `#475569` |
| Đang làm | `#DBEAFE` | `#1D4ED8` |
| Hoàn thành | `#DCFCE7` | `#166534` |
| Quá hạn | không tô nền | `#B91C1C` |
| Ưu tiên Thấp | `#F1F5F9` | `#475569` |
| Ưu tiên Trung bình | `#FEF3C7` | `#92400E` |
| Ưu tiên Cao | `#FEE2E2` | `#B91C1C` |

## Nhãn ↔ giá trị API

UI nói tiếng Việt. Request gửi giá trị API.

| Trên UI | Gửi API |
| --- | --- |
| Cần làm | `todo` |
| Đang làm | `doing` |
| Hoàn thành | `done` |
| Thấp | `low` |
| Trung bình | `medium` |
| Cao | `high` |
| Tất cả | không gửi `status` |
| Hạn gần nhất | `sort=deadline&order=asc` |
| Hạn xa nhất | `sort=deadline&order=desc` |
| Mới tạo | `sort=created_at&order=desc` |
| Tốt | `good` |
| Đạt yêu cầu | `met` |
| Cần cải thiện | `improve` |
| 7 ngày | `period=7d` |
| 30 ngày | `period=30d` |

API còn nhận sắp theo `priority` và `title`. Thanh công cụ không hiện hai lựa chọn đó.

Sau đăng nhập vào `/tasks`. Mặc định tab Tất cả, sắp xếp Mới tạo. Lọc và sắp xếp giữ nguyên khi mở rồi đóng form trong cùng phiên trang.

## Ngày

`deadline` từ API là `YYYY-MM-DD`. Hiện `dd/mm/yyyy`, ví dụ `10/11/2026`.

Quá hạn khi `deadline` nhỏ hơn ngày hôm nay theo lịch máy người dùng, và `status` khác `done`. Việc Đang làm vẫn có thể quá hạn. Không có deadline thì không hiện dòng ngày và không gọi là quá hạn.

## Breakpoint

| Bề rộng | Bố cục |
| --- | --- |
| dưới 768px | Không sidebar. Header 56px. Thanh dưới bốn mục, cao khoảng 64px cộng safe area. Form full màn. Nút thêm nổi phía trên thanh dưới |
| 768–1023px | Rail icon 64px, tooltip. Panel phụ xếp dưới nội dung chính |
| từ 1024px | Sidebar trái 224px. Nội dung tối đa 1120px, padding ngang 32px |

Bốn mục: Công việc `/tasks`, Lịch `/calendar`, Ghi chú `/notes`, Tổng quan `/overview`. `/` chuyển tới `/tasks`.

Trang không cuộn ngang. Riêng hàng tab trên mobile được cuộn ngang trong chính hàng đó.

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

Kanban, kéo-thả, giao việc, bình luận, tệp đính kèm, nhãn, thư mục ghi chú, việc con, chuông, tìm kiếm, streak, lịch theo giờ, tuần, năm, đồng bộ lịch, sự kiện lặp. Biểu đồ Tổng quan chỉ bảy cột số việc hoàn thành theo ngày.

Mỗi khối phải phục vụ một thao tác: xem, lọc, sắp xếp, thêm, sửa, đổi trạng thái, xóa, đăng nhập, đăng ký, đăng xuất.
