---
name: ptm-docs-router
description: >-
  Định tuyến việc làm app Personal Task Management (schedule_app) tới đúng
  file trong docs/, rồi chỉ triển khai phần tài liệu và người dùng yêu cầu
  (Ponytail: ít code mới nhất). Use when the user asks to build, implement,
  fix, or continue this task-management app, or mentions AT-, UT-, API, UI,
  auth, task, database, schema, đăng ký, đăng nhập, session, cookie, SQLite,
  Tailwind, dashboard, or TC01–TC10.
---

# Router tài liệu — Personal Task Management

Skill này chỉ chọn file. Không chép đặc tả vào đây.

Không đọc cả `docs/`. Bảng dưới là mục lục. Khớp prompt với **một hàng hẹp nhất**, mở đúng file của hàng đó, và chỉ heading được ghi. Không mở thêm file cho chắc. Hai hàng cùng khớp thì lấy hàng cụ thể hơn (`AT-xx` / `UT-xx` thắng hàng chủ đề).

## Khi file lệch nhau

1. Đặc tả để code thắng `docs/plan.md` và `docs/ui_docs/ui_lead.md`. Không code theo bảng schema/API cũ trong `plan.md`. Không code theo `ui_lead.md` khi đã có file tách (`design-system.md`, `screens.md`, `components.md`, `ux-states.md`, `ui-tasks.md`).
2. HTTP thắng UI. Request, response, câu `error`, cookie `sid`, `Origin`, mã status: `docs/api-contract.md`.
3. Layout và copy: `docs/ui_docs/`. `docs/user-flow.md` chỉ là đường đi (đăng ký không tự đăng nhập). Lệch chữ hoặc bố cục thì ui docs thắng.

## Bảng chọn file

| Ý / từ khóa | Đọc, theo thứ tự | Không đọc |
| --- | --- | --- |
| Schema, migration, DDL, repository, SQL, khóa ngoại, lọc/sắp trong SQL | `docs/erd.md` (`DDL`, `Quy tắc truy vấn`) rồi `docs/folder-structure.md` (repository, `db/`) | Mọi file `docs/ui_docs/`, `plan.md`, `user-flow.md` |
| Đăng ký, đăng nhập, đăng xuất, session, cookie, mật khẩu, Argon2, UC-01–UC-04 | `docs/api-contract.md` (4 endpoint auth, `Câu lỗi 400`, `Session và Origin`) rồi `docs/tech-stack.md` (Argon2id, cookie `sid`) rồi `docs/use-cases.md` (UC-01–UC-04) | `screens.md`, `components.md`, `ux-states.md` trừ khi đang dựng form. `plan.md`, `ui_lead.md` |
| CRUD task, lọc, sắp xếp trên server, UC-05–UC-10 | `docs/api-contract.md` (4 endpoint `/api/tasks`) rồi `docs/erd.md` (`Quy tắc truy vấn`) rồi `docs/use-cases.md` (UC-05–UC-10) | `docs/ui_docs/`, `plan.md`, `user-flow.md` |
| Test TC01–TC10 | `docs/checklist.md` (`Test phải xanh`) rồi `docs/api-contract.md` rồi `docs/atom-tasks.md` chỉ `AT-25` (`DATABASE_PATH` tạm, import `app`, không `listen`) | `docs/ui_docs/`, `plan.md`, các AT khác |
| UI nhìn thấy: Tailwind, component, copy, responsive, modal, dialog | `docs/ui_docs/design-system.md` rồi **một** file ở bảng UI dưới. `docs/api-contract.md` chỉ endpoint và field màn đó gửi | `plan.md`, `ui_lead.md`. `user-flow.md` không dùng cho layout/copy |
| Làm AT-xx | Heading `AT-xx` trong `docs/atom-tasks.md`, rồi chỉ file task đó nêu. AT-19–AT-24 trỏ UT: mở đúng UT, không mở cả `ui-tasks.md` | Các AT khác, `plan.md`, `ui_lead.md` |
| Làm UT-xx | Heading `UT-xx` trong `docs/ui_docs/ui-tasks.md`, rồi file UI task đó nêu | `plan.md`, `ui_lead.md`, AT không được task nêu |
| Giai đoạn, milestone, lý do, lý thuyết | `docs/plan.md` (mục tiêu và giai đoạn) | Không triển khai từ schema/API trong file này. Không mở file đặc tả nếu chưa chuyển sang làm việc |
| Đường đi, điều hướng | `docs/user-flow.md` | `screens.md` khi chỉ hỏi đường đi |
| Tiến độ, checkbox | `docs/checklist.md` (`Tiến độ`, `Theo nhóm việc`) | Cả `atom-tasks.md` nếu chỉ hỏi xong chưa |
| Cây file, lớp route → controller → service → repository | `docs/folder-structure.md` (`File nào làm gì`, `Hướng phụ thuộc`, `File không tạo`) | Hành vi component không nằm ở cây file; lấy `components.md`. Không có `TaskFilters.jsx` |
| Version, env, cổng, lệnh cài, lệnh chạy | `docs/tech-stack.md` (`Bảng chọn`, `Biến môi trường`, `Auth — tham số đã chốt`). Chạy từ `server/` | Không thêm thư viện ngoài bảng. Không đọc `plan.md` |
| Tính năng ngoài tài liệu (Kanban, bảng mới, quên/đổi mật khẩu, nhãn, bình luận, chia sẻ) | Đối chiếu `docs/use-cases.md` mục `Việc nằm ngoài use case` và `docs/ui_docs/design-system.md` mục `Không đưa vào giao diện` | Dừng. Nói ngoài phạm vi. Không bịa endpoint, bảng, hay màn hình |

### Chọn một file UI

Chỉ mở file khớp việc, cùng `design-system.md`.

| Việc nhìn | File |
| --- | --- |
| Token, breakpoint dưới 768 và từ 768, nhãn tiếng Việt ↔ enum, quá hạn, sort trên UI (Hạn gần nhất / Hạn xa nhất / Mới tạo) | `docs/ui_docs/design-system.md` |
| Login, register, dashboard, form modal và form full màn, chữ dialog xóa | `docs/ui_docs/screens.md` |
| File React và props | `docs/ui_docs/components.md` |
| Rỗng, đang tải, lỗi, toast, câu `error` gắn ô nào | `docs/ui_docs/ux-states.md` |

## Ponytail

Senior lười: code tốt nhất là code không viết. Giải hết việc bằng ít code mới nhất. Kết reply bằng một hoặc hai dòng: phần đã bỏ qua hoặc chưa kiểm, và rủi ro người dùng phải biết.

Trước khi viết: đọc task và code nó đụng. Liệt kê mọi chỗ thay đổi phải tới (caller, test, fixture, config, export). Kiểm tra cái thay đổi làm hỏng với người dùng (mất hoặc lộ dữ liệu, caller ngừng chạy). Đó là scope. Feature thừa không thuộc scope.

Đổi nhỏ nhất mà chạy hết việc — lấy lựa chọn đầu tiên đủ:

1. Có cần tồn tại không? Bỏ feature, option, độ linh hoạt không ai xin, và nêu chúng trong một dòng. Yêu cầu mơ hồ thì bản nhỏ nhất làm đúng việc lõi.
2. Đã có trong codebase (helper, component, service, pattern)? Dùng đúng cách code xung quanh đang dùng.
3. Thư viện chuẩn hoặc tính năng nền tảng? Dùng, trừ khi project đã có của riêng. Component của project thắng widget native.
4. Dependency đã cài? Dùng. Không thêm dependency cho vài dòng.
5. Một dòng người đọc hiểu ngay? Viết một dòng.
6. Không thì: lượng code tối thiểu chạy được.

- Lười ở cách giải, không lười ở phạm vi thay đổi: làm hết phần task cần, kể cả caller, test và fixture mà thay đổi làm gãy.
- Không abstraction, wrapper, đổi kiểu, option, config, boilerplate, hay code "để sau" không ai xin. Giữ giá trị đúng dạng nền tảng đã đưa. Xóa hơn thêm. Giữ lớp, interface và quy ước sẵn có.
- Diff ngắn nhất thắng sau khi đã biết mọi chỗ phải đụng. Một dòng phải giải mã thì không phải ngắn.
- Comment chỉ cái why mà code không hiện, một dòng.
- Sửa bug: trước khi sửa, grep mọi caller của hàm đụng, rồi sửa nguyên nhân một lần ở code dùng chung.
- Code chuyển đi hoặc gộp vào giữ nguyên xử lý lỗi và validation.
- Hai cách cùng kích thước: lấy cách đúng ở edge case.
- Logic không tầm thường mới (nhánh, vòng lặp, parser, tiền hoặc bảo mật, hoặc cả script/app mới) để lại một test nhỏ hoặc self-check bằng assert. Đổi tầm thường thì không cần.
- Đường tắt có giới hạn đã biết thì comment đúng dạng: `shortcut: <giới hạn>, <khi nào nâng cấp>`.

Không được cắt: validation ở biên tin cậy, xử lý lỗi chống mất dữ liệu, bảo mật, accessibility, hiệu chỉnh phần cứng thật, và bất cứ thứ người dùng đã xin.

## Thứ tự

1. Khớp bảng, đọc đúng file và đúng mục.
2. Ponytail: chỉ làm những gì các file đó và người dùng yêu cầu. Không thêm feature.
3. Reply triển khai bắt buộc kết bằng 1–2 dòng: phần bỏ qua hoặc chưa kiểm, và rủi ro.
