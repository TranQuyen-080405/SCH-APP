
# Lộ trình xây dựng Mini Project: Personal Task Management Website

File này giữ mục tiêu, lý do chọn kiến trúc và thứ tự giai đoạn. Phần đặc tả để viết code đã tách ra các file dưới. Khi hai chỗ lệch nhau, làm theo file đặc tả.

| Tài liệu | Dùng để |
| --- | --- |
| [erd.md](erd.md) | Bảng, cột, DDL, cách lọc và sắp xếp |
| [user-flow.md](user-flow.md) | Ba màn hình và đường đi của người dùng |
| [ui_docs/ui_lead.md](ui_docs/ui_lead.md) | Giao diện: token, bố cục, component, trạng thái |
| [use-cases.md](use-cases.md) | Use case và quy tắc nghiệp vụ |
| [api-contract.md](api-contract.md) | Hợp đồng HTTP để code API và Postman |
| [tech-stack.md](tech-stack.md) | Version đã chốt và việc của từng công nghệ |
| [folder-structure.md](folder-structure.md) | Cây thư mục và trách nhiệm từng file |
| [atom-tasks.md](atom-tasks.md) | Việc nhỏ theo thứ tự, làm từ AT-01 |
| [checklist.md](checklist.md) | Tiến độ, test case, mốc commit |
| [../.cursor/skills/ptm-docs-router/SKILL.md](../.cursor/skills/ptm-docs-router/SKILL.md) | Agent chỉ mở file khớp prompt; không đọc cả `docs/` |

---

Mục tiêu: Xây dựng một website quản lý công việc cá nhân, đồng thời thể hiện được kiến thức về phát triển phần mềm, thiết kế hệ thống, design pattern, database và quy trình làm việc của một developer.

Định hướng của project:

Đơn giản: Chỉ triển khai đúng các chức năng đề bài.

Có nền tảng lý thuyết: Mỗi thành phần được xây dựng dựa trên một kiến thức hoặc nguyên lý cụ thể.

Có kiến trúc rõ ràng: Dễ đọc, dễ bảo trì, không thiết kế quá mức cần thiết.

Có tiến trình phát triển: Đi từ phân tích yêu cầu → thiết kế → coding → testing → documentation.

Có sản phẩm hoàn chỉnh: Website chạy được, README rõ ràng, video demo 1–2 phút.

1. Lựa chọn kiến trúc và Design Pattern
Kiến trúc đề xuất

Phù hợp mini project
3-Layer Architecture + Repository Pattern
Sử dụng mô hình Client–Server với REST API, backend tổ chức theo các lớp có trách nhiệm riêng.
Frontend — Presentation

React: giao diện, form, hiển thị task, tương tác

HTTP / REST API / JSON

Backend — Express.js

Controller

Nhận request, kiểm tra input, trả response

Service

Xử lý nghiệp vụ, kiểm tra quyền sở hữu task

Repository

Truy vấn và cập nhật dữ liệu

Database — SQLite

Users, Tasks

Đây là kiến trúc đủ để thể hiện sự phân chia trách nhiệm (Separation of Concerns) nhưng không cần áp dụng Microservices, CQRS, Event-Driven hay các pattern phức tạp.

2. Nền tảng lý thuyết cần học và áp dụng
Không cần học quá nhiều lý thuyết. Chỉ chọn những kiến thức thực sự được sử dụng trong project.

Nhóm kiến thức

Lý thuyết cần nắm

Áp dụng

Software Engineering

SDLC, Requirement Analysis

Phân tích yêu cầu và lập kế hoạch

Software Architecture

Client–Server, Layered Architecture

Tổ chức frontend và backend

Design Pattern

Repository Pattern

Tách logic truy vấn database

Design Principles

SRP, KISS, DRY, YAGNI

Giữ code gọn, dễ bảo trì

Web Development

HTTP, REST API, JSON

Giao tiếp frontend–backend

Database

Relational Database, ERD, CRUD

Lưu Users và Tasks

Authentication

Password Hashing, Session

Đăng nhập và xác thực

Authorization

Resource Ownership

Người dùng chỉ quản lý task của mình

Frontend

Component-Based Design, State Management

Xây dựng giao diện React

Testing

Unit Test, Integration Test, Black-box Test

Kiểm tra chức năng

5 nội dung quan trọng nhất cần thể hiện trong project:

SDLC: Biết cách triển khai một phần mềm theo quy trình.

Layered Architecture: Biết cách phân chia trách nhiệm giữa các lớp.

Repository Pattern: Biết áp dụng một design pattern vào thực tế.

REST API + Database: Biết xây dựng CRUD và quản lý dữ liệu.

Authentication + Authorization: Biết xử lý nhiều tài khoản độc lập và bảo vệ dữ liệu.

Không cần áp dụng tất cả các nguyên lý SOLID hoặc cố gắng sử dụng nhiều design pattern.

3. Công nghệ lựa chọn
Thành phần

Công nghệ

Lý do

Frontend

React + Vite

Dễ xây UI theo component

Backend

Node.js + Express.js

Nhẹ, dễ tổ chức REST API

Database

SQLite

Không cần thiết lập database server

Database Access

better-sqlite3

Viết SQL trực tiếp, học được CRUD

Authentication

Session + Cookie

Phù hợp web app đơn giản

Password

Argon2id

Hash mật khẩu an toàn

API Testing

Postman

Kiểm tra các API

Version Control

Git + GitHub

Quản lý tiến trình phát triển

Vite hỗ trợ template React, còn Express cung cấp router và middleware phù hợp cho backend nhỏ. 

Vite
+1

4. Quy trình phát triển — Step by Step
Development Roadmap

8 giai đoạn

1

Requirement Analysis

Phân tích chức năng, giới hạn phạm vi

Deliverable: Requirement Specification

2

System Design

Thiết kế kiến trúc, database, API, UI

Deliverable: ERD + API Contract + Wireframe

3

Project Setup

Khởi tạo repository, frontend và backend

Deliverable: Project Structure

4

Backend Implementation

Xây database, authentication, task CRUD

Deliverable: REST API hoạt động

5

Frontend Implementation

Xây giao diện và kết nối API

Deliverable: Website sử dụng được

6

Integration & Testing

Kiểm tra chức năng và xử lý lỗi

Deliverable: Test Cases + Results

7

Refactoring

Rà soát code và kiến trúc

Deliverable: Clean Code

8

Documentation & Demo

Hoàn thành README và video

Deliverable: Sản phẩm bàn giao

Step 1 — Requirement Analysis
Lý thuyết: Software Requirements Engineering, Functional/Non-functional Requirements, Use Case.

Xác định các chức năng:

Module

Use Case

Authentication

Register, Login, Logout

Task Management

Create, Read, Update, Delete

Task Status

Todo, Doing, Done

Task Query

Filter, Sort

User Isolation

Chỉ truy cập task của mình

Quy tắc nghiệp vụ (Business Rules):

Email đăng ký không được trùng.

Tiêu đề task không được để trống.

Status chỉ nhận todo, doing, done.

Priority nhận low, medium, high.

Deadline là ngày hợp lệ, có thể để trống.

Người dùng chưa đăng nhập không được quản lý task.

Mỗi user chỉ được xem và chỉnh sửa task thuộc sở hữu của mình.

Deliverable: requirements.md chứa chức năng, quy tắc và acceptance criteria.

Step 2 — System Design
Lý thuyết: Layered Architecture, ERD, REST API Design, UI Wireframe.

2.1. Database Design

Chỉ cần hai bảng chính:

users

id (PK)

email (UNIQUE)

password_hash

created_at

tasks

id (PK)

user_id (FK)

title

description

deadline

priority

status

created_at

users (1)

tasks (N)

Quan hệ One-to-Many: một user có nhiều tasks.
Cần khai báo foreign key và bật kiểm tra ràng buộc trên kết nối SQLite. 

sqlite.org

2.2. API Design

Method

Endpoint

Chức năng

POST

/api/auth/register

Đăng ký

POST

/api/auth/login

Đăng nhập

POST

/api/auth/logout

Đăng xuất

GET

/api/auth/me

Lấy user hiện tại

GET

/api/tasks

Danh sách task

POST

/api/tasks

Tạo task

PATCH

/api/tasks/:id

Sửa task/trạng thái

DELETE

/api/tasks/:id

Xóa task

Filter và sort sử dụng query parameters, ví dụ:

GET /api/tasks?status=doing&sort=deadline&order=asc

Các HTTP methods nên sử dụng đúng ngữ nghĩa chuẩn. 

MDN

2.3. UI Wireframe

Chỉ thiết kế ba màn hình: Register, Login và Task Dashboard. Dashboard có danh sách task, nút thêm task, bộ lọc, sắp xếp và form chỉnh sửa. Không cần Kanban kéo-thả.

Deliverable: ERD, api-spec.md, UI Wireframe.

Step 3 — Project Setup
Lý thuyết: Modular Design, Separation of Concerns, Git Workflow.

Cấu trúc source code đề xuất:

task-management/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       │   ├── authApi.js
│       │   └── taskApi.js
│       └── App.jsx
├── server/
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── middleware/
│       ├── db/
│       └── app.js
├── docs/
│   ├── requirements.md
│   ├── api-spec.md
│   └── test-cases.md
├── .gitignore
└── README.md
Tổ chức theo module auth và task bên trong các thư mục trên. Chỉ tách file khi có trách nhiệm rõ ràng.

Deliverable: Repository GitHub, frontend và backend khởi động được.

Step 4 — Backend Implementation
Lý thuyết: REST, Repository Pattern, Dependency Separation, Authentication, Authorization.

Triển khai theo thứ tự:

Kết nối SQLite và khởi tạo các bảng.

Xây TaskRepository để thực hiện truy vấn SQL.

Xây TaskService để kiểm tra business rules.

Xây TaskController và routes cho CRUD.

Xây đăng ký, đăng nhập, đăng xuất.

Thêm middleware xác thực và kiểm tra quyền sở hữu task.

Ví dụ khi cập nhật task:

PATCH /api/tasks/15
        ↓
requireAuth
        ↓
taskController.update()
        ↓
taskService.update()
        ↓
taskRepository.update()
        ↓
SQLite
Điểm quan trọng: Khi sửa hoặc xóa task, backend phải kiểm tra user_id của task có trùng với user đăng nhập không. Không được tin user_id do frontend gửi.

Mật khẩu phải được hash bằng thuật toán chuyên dụng như Argon2id, không lưu plaintext. Session nên dùng cookie HttpOnly, Secure khi triển khai HTTPS, cấu hình SameSite phù hợp và bảo vệ các request thay đổi dữ liệu khỏi CSRF. 

OWASP Cheat Sheet Series
+1

Deliverable: Toàn bộ REST API hoạt động và được kiểm tra bằng Postman.

Step 5 — Frontend Implementation
Lý thuyết: Component-Based Architecture, React State, Event Handling, HTTP Client.

Triển khai:

Trang Register và Login.

Trang Dashboard hiển thị task.

Component TaskForm dùng chung cho thêm và sửa.

Component TaskItem hiển thị nội dung và trạng thái.

Filter, Sort và thao tác cập nhật status.

Loading, thông báo lỗi và trạng thái danh sách rỗng.

Frontend chỉ quản lý giao diện và gọi API. Không chứa logic phân quyền hoặc truy vấn database trực tiếp.

Deliverable: Website có thể sử dụng từ đầu đến cuối.

Step 6 — Integration & Testing
Lý thuyết: Test Case Design, Equivalence Partitioning, Boundary Value Analysis.

ID

Test case

Expected result

TC01

Đăng ký email hợp lệ

Tạo user

TC02

Đăng ký email trùng

Báo lỗi

TC03

Đăng nhập sai mật khẩu

Từ chối

TC04

Tạo task thiếu tiêu đề

Báo lỗi

TC05

Chuyển Todo → Doing → Done

Cập nhật thành công

TC06

Lọc theo trạng thái

Trả đúng task

TC07

Sắp xếp theo deadline

Đúng thứ tự

TC08

User A truy cập task của B

Từ chối/không tìm thấy

TC09

Chưa đăng nhập gọi API task

HTTP 401

TC10

Xóa task của chính mình

Xóa thành công

Chỉ cần kiểm thử chức năng và một vài API quan trọng; không cần performance testing hoặc hệ thống automation phức tạp.

Deliverable: Test case và kết quả kiểm thử.

Step 7 — Refactoring
Lý thuyết: Clean Code, DRY, SRP, KISS.

Rà soát việc đặt tên hàm, loại bỏ logic lặp lại, đảm bảo mỗi lớp làm đúng trách nhiệm. Kiểm tra lại error handling, input validation và không đưa secret vào Git.

Không tái cấu trúc chỉ để thêm pattern.

Step 8 — Documentation & Demo
Lý thuyết: Technical Documentation, Software Delivery.

README cần có mục tiêu, tính năng, công nghệ, kiến trúc, cách cài đặt/chạy và tài khoản thử nghiệm nếu cần.

Video demo 1–2 phút: đăng ký → đăng nhập → thêm task → sửa task → đổi trạng thái → lọc/sắp xếp → đăng xuất.

5. Cách thể hiện tiến trình phát triển chuyên nghiệp bằng Git
Một mini project vẫn nên có các milestone và commit rõ ràng, thay vì code xong toàn bộ rồi commit một lần.

Milestone

Ví dụ commit

M1 — Setup

chore: initialize client and server

M2 — Database

feat: create user and task schema

M3 — Authentication

feat: implement user authentication

M4 — Task CRUD

feat: implement task CRUD APIs

M5 — Frontend

feat: build task dashboard

M6 — Integration

feat: connect frontend with APIs

M7 — Testing

test: add authentication and task tests

M8 — Delivery

docs: add README and demo guide

6. Checklist quản lý tiến độ
Project Progress

0/10 hoàn thành


Viết requirements và business rules

Vẽ ERD, API Contract và UI Wireframe

Khởi tạo Git repository, React và Express

Thiết lập database và Repository Pattern

Xây dựng Authentication và Authorization

Xây dựng API CRUD, Filter và Sort

Xây dựng frontend và kết nối API

Kiểm thử chức năng và dữ liệu nhiều user

Refactor, kiểm tra cấu trúc code

Viết README và quay video demo
7. Khi nào project được xem là hoàn thành?
Project đạt yêu cầu khi có đủ bốn kết quả:

Tiêu chí

Điều kiện

Functional

Các chức năng đề bài chạy đúng

Architecture

Controller, Service, Repository phân chia rõ ràng

Quality

Có validation, bảo vệ dữ liệu từng user, các test case đạt

Delivery

Có Git history, README, video demo

Kết luận: Với mini project này, giá trị cần chứng minh không phải là sử dụng nhiều framework hoặc design pattern, mà là biết phân tích yêu cầu, thiết kế có chủ đích, triển khai đúng kiến trúc, kiểm thử và bàn giao một ứng dụng hoàn chỉnh. Đây cũng là nền tảng có thể tiếp tục áp dụng cho các dự án phần mềm lớn hơn.