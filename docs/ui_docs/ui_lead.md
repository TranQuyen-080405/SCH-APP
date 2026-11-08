> Bản thiết kế/lộ trình lịch sử. Hợp đồng hiện tại: `docs/api-contract.md`, `docs/erd.md` và source sau refactor 09/11/2026; không triển khai lại tính năng đã bỏ theo ví dụ cũ.

# UI/UX DESIGN PROMPT — PERSONAL TASK MANAGEMENT

File này là brief thiết kế gốc. Phần để dựng giao diện đã tách ra các file dưới. Khi brief và file dựng lệch nhau, làm theo file dựng. Dữ liệu và HTTP vẫn theo `docs/api-contract.md`.

| Tài liệu | Dùng để |
| --- | --- |
| [design-system.md](design-system.md) | Màu, chữ, breakpoint, nhãn tiếng Việt ↔ giá trị API |
| [screens.md](screens.md) | Bố cục Đăng nhập, Đăng ký, Dashboard laptop và mobile |
| [components.md](components.md) | File React và việc của từng component |
| [ux-states.md](ux-states.md) | Rỗng, tải, lỗi, toast, quá hạn |
| [ui-tasks.md](ui-tasks.md) | Thứ tự làm, UT-01 đến UT-10 |

---

## 1. Mục tiêu thiết kế

Thiết kế giao diện responsive cho một website quản lý công việc cá nhân (Personal Task Management).

Ứng dụng dành cho người dùng phổ thông muốn ghi lại, theo dõi và hoàn thành công việc hằng ngày.

**Nguyên tắc cốt lõi:**
- **User-first:** Người dùng mở website là biết phải làm gì, không cần hướng dẫn.
- **Minimalism:** Chỉ hiển thị những thành phần có mục đích sử dụng thực tế.
- **Clarity:** Phân cấp thông tin rõ ràng, dễ đọc, dễ nhận biết trạng thái.
- **Efficiency:** Giảm số lần nhấp chuột và số bước để hoàn thành một thao tác.
- **Consistency:** Component, màu sắc, khoảng cách và cách tương tác phải nhất quán.
- **Responsive:** Laptop và mobile có bố cục được tối ưu riêng, không đơn thuần thu nhỏ giao diện desktop.

Không tạo giao diện giống trang quản trị doanh nghiệp, dashboard phân tích hay phần mềm quản lý dự án phức tạp.

## 2. Visual Style & Vibe

**Vibe:** Clean, calm, friendly, lightweight, modern productivity app.

Cảm giác khi sử dụng:
- Gọn gàng, dễ chịu, không gây áp lực.
- Hiện đại nhưng gần gũi, không quá thiên về kỹ thuật.
- Tập trung vào công việc thay vì yếu tố trang trí.
- Có đủ khoảng trắng để dễ quan sát, nhưng không lãng phí không gian.

**Design System:**
- Background: Light neutral `#F8FAFC`.
- Surface: White `#FFFFFF`.
- Primary: Blue `#2563EB`.
- Text chính: Slate `#0F172A`.
- Text phụ: Slate `#64748B`.
- Border: `#E2E8F0`.
- Font: Inter hoặc system sans-serif hỗ trợ tốt tiếng Việt.
- Border radius: 8–12px.
- Shadow: Rất nhẹ, chỉ sử dụng khi cần phân biệt lớp giao diện.
- Spacing: Hệ thống 8px.
- Icon: Lucide, đơn giản, nhất quán.

Màu trạng thái:
- Todo: Neutral gray.
- Doing: Blue.
- Done: Green.
- Overdue: Red, chỉ dùng khi công việc quá hạn và chưa hoàn thành.

Màu độ ưu tiên:
- Low: Gray.
- Medium: Amber.
- High: Red.

Không chỉ dùng màu sắc để truyền đạt thông tin; phải có text label.

Tránh gradient, glassmorphism, hiệu ứng 3D, màu neon và animation không cần thiết.

## 3. Các màn hình cần thiết

Chỉ xây dựng ba loại màn hình:
1. Login.
2. Register.
3. Task Dashboard (bao gồm các thao tác thêm, sửa, xóa và quản lý task).

Không tạo landing page, analytics page, calendar page, profile page hoặc settings page nếu không phục vụ yêu cầu đề bài.

---

# 4. LAPTOP UI — TASK DASHBOARD

**Target:** Laptop và desktop, chiều rộng từ 1024px trở lên.

**Layout:** Một trang chính, nội dung nằm giữa, max-width khoảng 1000–1100px.

Không dùng sidebar vì ứng dụng chỉ có một chức năng chính là quản lý công việc.

### Component A — Top Navigation

**Vị trí:** Trên cùng, trải ngang toàn bộ chiều rộng.

**Thành phần:**
- Bên trái: Tên ứng dụng ngắn gọn, ví dụ "Việc của tôi".
- Bên phải: Avatar hoặc nút tài khoản mở menu có tùy chọn "Đăng xuất".

**Mục đích:** Xác định ứng dụng và cung cấp thao tác quản lý phiên đăng nhập.

**Vibe:** Nhẹ, đơn giản, chiều cao khoảng 64px, có đường phân cách mảnh.

Không thêm navigation menu, notification bell, search bar hoặc các nút không có chức năng thực tế.

### Component B — Task Toolbar

**Vị trí:** Ngay dưới top navigation, phía trên danh sách task.

**Thành phần:**
- Bên trái: Bộ lọc trạng thái dạng tab:
  - Tất cả
  - Cần làm
  - Đang làm
  - Hoàn thành
- Bên phải: Dropdown "Sắp xếp" và nút primary "+ Thêm công việc".

**Mục đích:**
- Chuyển nhanh giữa các nhóm công việc.
- Sắp xếp theo deadline hoặc thời điểm tạo.
- Tạo công việc mới trong một thao tác.

**Behavior:**
- Tab được chọn phải có active state rõ ràng.
- Dropdown sort có các lựa chọn: "Hạn gần nhất", "Hạn xa nhất", "Mới tạo".
- Chỉ một nút tạo task chính trên màn hình.
- Khi thay đổi filter hoặc sort, danh sách cập nhật ngay mà không tải lại toàn trang.

Không thêm nút Filter riêng nếu các tab đã thực hiện chức năng lọc.

### Component C — Task List

**Vị trí:** Khu vực nội dung chính, ngay dưới toolbar.

**Layout:** Danh sách một cột gồm các task row/card, không dùng Kanban board.

Mỗi task hiển thị:

**1. Task Title**
- Thông tin nổi bật nhất.
- Font medium/semibold.
- Tối đa hai dòng trước khi rút gọn.

**2. Description**
- Text phụ bên dưới title.
- Chỉ hiện khi có mô tả.
- Tối đa hai dòng, không chiếm quá nhiều diện tích.

**3. Deadline**
- Ngày hết hạn, hiển thị dễ đọc.
- Nếu quá hạn và chưa hoàn thành, hiển thị "Quá hạn".
- Nếu không có deadline, không hiển thị dòng thông tin rỗng.

**4. Priority**
- Compact badge: Thấp / Trung bình / Cao.
- Dễ nhận biết nhưng không cạnh tranh với tiêu đề.

**5. Status**
- Dropdown nhỏ: Cần làm / Đang làm / Hoàn thành.
- Có thể thay đổi trực tiếp ngay tại task mà không cần mở trang chỉnh sửa.

**6. Task Actions**
- Nút sửa (pencil icon).
- Nút xóa (trash icon).
- Có tooltip và accessible label.

**Bố cục desktop:**
- Bên trái: Title và Description.
- Phía dưới title hoặc vùng metadata: Deadline và Priority.
- Bên phải: Status và hai action icons.

**Vibe:** Mỗi task là một hàng dễ quét bằng mắt, padding vừa đủ, separator hoặc border nhẹ, hover state tinh tế.

Không hiển thị ID, ngày tạo, người tạo, số lượng bình luận hoặc các metadata không có ích cho người dùng.

### Component D — Create / Edit Task

**Vị trí:** Modal nằm giữa màn hình, chiều rộng khoảng 480–560px.

**Các trường:**
- Tiêu đề — text input, bắt buộc.
- Mô tả — textarea, không bắt buộc.
- Hạn hoàn thành — date picker, không bắt buộc.
- Độ ưu tiên — select Thấp / Trung bình / Cao.
- Trạng thái — select Cần làm / Đang làm / Hoàn thành.

**Thao tác:**
- Primary: "Thêm công việc" hoặc "Lưu thay đổi".
- Secondary: "Hủy".
- Nút X đóng modal.

**Behavior:**
- Thêm mới: mặc định trạng thái "Cần làm", độ ưu tiên "Trung bình".
- Chỉnh sửa: điền sẵn dữ liệu hiện tại.
- Báo lỗi ngay cạnh trường không hợp lệ.
- Giữ lại dữ liệu form nếu lưu thất bại.
- Lưu thành công thì cập nhật danh sách.
- Có trạng thái đang lưu để tránh nhấn gửi nhiều lần.

Không chia form thành nhiều bước. Không có trường dữ liệu ngoài yêu cầu.

### Component E — Delete Confirmation

**Vị trí:** Dialog nhỏ chính giữa màn hình.

**Nội dung:**
- "Xóa công việc?"
- "Công việc này sẽ bị xóa và không thể khôi phục."

**Actions:**
- "Hủy"
- "Xóa" — destructive button.

Không dùng xác nhận khi chỉ chuyển trạng thái công việc.

---

# 5. MOBILE UI — TASK DASHBOARD

**Target:** Mobile width 320–767px, tối ưu trước cho màn hình khoảng 375–430px.

**Nguyên tắc:** Ưu tiên một tay sử dụng, thông tin vừa đủ, không phải zoom hoặc cuộn ngang trang.

### Component A — Mobile Header

**Vị trí:** Trên cùng.

**Thành phần:**
- Bên trái: "Việc của tôi".
- Bên phải: Nút tài khoản dẫn đến "Đăng xuất".

**Vibe:** Compact, chiều cao khoảng 56px.

Không đưa desktop navigation vào mobile dưới dạng hamburger menu vì ứng dụng không có nhiều mục điều hướng.

### Component B — Mobile Filter & Sort

**Vị trí:** Ngay dưới header.

**Thành phần:**
- Hàng đầu: Tab lọc trạng thái.
- Hàng tiếp theo: Dropdown sắp xếp gọn, căn phải.

**Behavior:**
- Tab có thể cuộn ngang trong phạm vi chính thanh tab nếu không đủ chỗ.
- Không cho toàn bộ trang cuộn ngang.
- Tab đang chọn luôn rõ ràng.
- Ghi nhớ filter và sort khi người dùng thêm hoặc sửa task trong cùng phiên sử dụng trang.

### Component C — Mobile Task Card

**Vị trí:** Danh sách dọc chiếm chiều rộng khả dụng.

**Bố cục từng card:**

Hàng 1:
- Bên trái: Task title.
- Bên phải: Action menu "…" gồm "Sửa", "Xóa".

Hàng 2:
- Description nếu có, tối đa hai dòng.

Hàng 3:
- Deadline và Priority, dạng metadata nhỏ gọn.

Hàng 4:
- Status selector dễ chạm.

**Behavior:**
- Các vùng tương tác có kích thước tối thiểu khoảng 44×44px.
- Không để các nút nhỏ sát nhau gây chạm nhầm.
- Không bắt người dùng vuốt card để tìm nút sửa/xóa.
- Không yêu cầu kéo-thả.
- Status có thể đổi trực tiếp trên card.

**Vibe:** Card nền trắng, bo góc nhẹ, spacing thoáng, text dễ đọc.

### Component D — Mobile Add Task Button

**Vị trí:** Nút floating hoặc bottom-anchored action, cố định gần cạnh dưới màn hình.

**Label:** "+ Thêm công việc".

**Mục đích:** Người dùng có thể tạo task bất cứ lúc nào mà không phải cuộn về đầu trang.

Yêu cầu:
- Không che nội dung task.
- Tôn trọng safe area của điện thoại.
- Có padding cuối danh sách để không bị che hàng cuối.
- Không tạo thêm nút Add Task trùng chức năng ở header.

### Component E — Mobile Task Form

**Vị trí:** Full-screen form thay vì modal nhỏ.

**Layout:**
- Header: nút quay lại và tiêu đề "Thêm công việc" / "Sửa công việc".
- Body: Các input xếp dọc, chiếm toàn bộ chiều rộng có padding.
- Footer: Primary button "Thêm công việc" / "Lưu thay đổi".

**Behavior:**
- Form có thể cuộn dọc.
- Nút lưu không bị bàn phím ảo che.
- Date picker tương thích mobile.
- Lỗi validation hiện sát input.
- Khi lưu thành công, quay về danh sách task.

Không dùng multi-step wizard, drawer lồng nhau hoặc popup phức tạp.

---

# 6. AUTHENTICATION UI

## Login Screen

**Laptop:**
- Form/card ở giữa trang.
- Chiều rộng khoảng 380–420px.
- Background trung tính, không cần hình minh họa.

**Mobile:**
- Form toàn chiều rộng có padding 20–24px.
- Không bắt buộc đặt form trong card.

**Components:**
- Tiêu đề "Đăng nhập".
- Email input.
- Password input với nút hiện/ẩn mật khẩu.
- Primary button "Đăng nhập".
- Link "Chưa có tài khoản? Đăng ký".

**Behavior:**
- Validate dữ liệu.
- Thông báo lỗi đăng nhập ngắn, rõ ràng.
- Có trạng thái đang xử lý.
- Đăng nhập thành công chuyển sang Dashboard.

## Register Screen

Giữ nguyên visual style và layout của Login.

**Components:**
- Tiêu đề "Đăng ký".
- Email input.
- Password input.
- Confirm password input.
- Primary button "Tạo tài khoản".
- Link "Đã có tài khoản? Đăng nhập".

Không yêu cầu tên đầy đủ, số điện thoại hoặc thông tin cá nhân không cần thiết.

---

# 7. UX STATES — BẮT BUỘC

### Empty State

Khi chưa có task:
- Thông báo: "Chưa có công việc nào."
- Hướng dẫn ngắn: "Thêm công việc đầu tiên để bắt đầu."

Sử dụng nút tạo task đã có, không sinh thêm nút có cùng chức năng.

Khi bộ lọc không có kết quả:
- "Không có công việc phù hợp."

Không dùng hình minh họa lớn chỉ để lấp khoảng trống.

### Loading State

- Hiển thị skeleton nhẹ cho danh sách.
- Nút lưu có loading state.
- Không làm toàn bộ giao diện nhấp nháy.

### Success State

- Thao tác thành công cập nhật UI ngay sau khi server xác nhận.
- Có thể hiển thị toast ngắn như "Đã lưu công việc".
- Không cần toast cho mọi lần chuyển filter.

### Error State

- Thông báo ngắn, dễ hiểu.
- Không hiển thị raw server errors hoặc stack traces.
- Khi không tải được danh sách, hiển thị "Không thể tải công việc" và nút "Thử lại".
- Khi không đủ quyền truy cập, không hiển thị dữ liệu của người khác.

---

# 8. COMPONENT SYSTEM

Xây dựng các component có thể tái sử dụng:

| Component | Purpose |
|---|---|
| AppHeader | Tên app, tài khoản, đăng xuất |
| StatusTabs | Lọc task theo trạng thái |
| SortSelect | Sắp xếp danh sách |
| TaskList | Render danh sách task |
| TaskItem | Hiển thị từng task |
| StatusSelect | Cập nhật trạng thái |
| PriorityBadge | Hiển thị mức ưu tiên |
| TaskForm | Tạo và chỉnh sửa task |
| ConfirmDialog | Xác nhận xóa |
| EmptyState | Hiển thị danh sách rỗng |
| FormField | Input và validation |
| Toast | Phản hồi thao tác |

Không tạo abstraction hoặc component quá tổng quát nếu không có nhu cầu tái sử dụng thực tế.

---

# 9. RESPONSIVE & ACCESSIBILITY RULES

- Desktop: layout tập trung, tối đa khoảng 1100px.
- Tablet: giữ danh sách một cột, giảm khoảng cách hợp lý.
- Mobile: chuyển task row thành card dọc.
- Không có horizontal overflow của trang.
- Font body khoảng 14–16px, không dùng text quá nhỏ.
- Contrast tối thiểu theo WCAG AA cho nội dung thông thường.
- Có keyboard focus state.
- Input luôn có nhãn rõ ràng.
- Interactive icons có accessible name.
- Touch target đủ lớn.
- Dialog có thể đóng bằng Escape trên desktop.
- Không phụ thuộc hover để sử dụng chức năng chính.
- Animation chỉ sử dụng cho phản hồi nhỏ, khoảng 150–200ms, hỗ trợ reduced motion.

---

# 10. STRICT DESIGN CONSTRAINTS

**Không được thêm:**
- Sidebar navigation không cần thiết.
- Dashboard thống kê hoặc biểu đồ.
- Kanban drag-and-drop.
- Team collaboration hoặc assign users.
- Comments, attachments, tags, subtasks.
- Notification center.
- AI features.
- Calendar view.
- Gamification, streak, progress charts.
- Landing page hoặc marketing sections.
- Search nếu chưa có nhu cầu rõ ràng.
- Footer dài và các liên kết giả.
- Placeholder buttons không hoạt động.
- Chữ trang trí, mô tả marketing, tiêu đề lặp lại.
- Các nút hoặc icon không có tác dụng.
- Nội dung demo giả tạo gây hiểu nhầm là dữ liệu thật.

**Quy tắc quan trọng:** Mọi thành phần phải trả lời được ít nhất một câu hỏi: "Người dùng cần nó để làm gì?" Nếu không có câu trả lời rõ ràng, hãy loại bỏ.

---

# 11. EXPECTED OUTPUT

Hãy thiết kế đầy đủ các màn hình:
1. Desktop Login & Register.
2. Mobile Login & Register.
3. Desktop Task Dashboard với danh sách task thực tế.
4. Mobile Task Dashboard với bố cục card.
5. Desktop Create/Edit Modal.
6. Mobile Create/Edit Form.
7. Delete Confirmation Dialog.
8. Empty, Loading và Error States.

Sử dụng nội dung giao diện bằng **tiếng Việt**, ngắn gọn, tự nhiên và nhất quán.

Nếu triển khai thành frontend, hãy xây dựng bằng React và Tailwind CSS với các component tách biệt, responsive thực sự và trạng thái tương tác hoạt động. Không cần tạo backend giả phức tạp; cấu trúc frontend phải dễ kết nối với REST API.

**Mục tiêu cuối cùng:** Một ứng dụng quản lý công việc cá nhân đơn giản, chỉn chu, thân thiện, thao tác nhanh trên laptop và điện thoại; trông như một sản phẩm thực tế dành cho người dùng hằng ngày, không phải một trang dashboard được thiết kế để trình diễn.
