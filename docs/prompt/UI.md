# MULTI-AGENT — RESOLVE UI SPECIFICATION CONFLICT & CONTINUE IMPLEMENTATION

## 1. Authorization & Objective

You are explicitly authorized to update the existing UI specifications and implement the new Personal Productivity Workspace.

The existing three-screen specification is no longer the final product scope.

**Do not preserve the old UI structure when it conflicts with the new specification. Preserve existing working functionality, authentication, APIs, and reusable components.**

The new UI specification takes precedence over conflicting legacy constraints.

Do not stop again solely because the previous design documents restrict navigation, page count, sidebar, calendar, or notes.

## 2. Update Documentation First

Inspect and update these files:

- `docs/prompt/UI.md`
- `design-system.md`
- `screens.md`

Resolve their conflicts before modifying application code.

### 2.1. UI.md

Preserve the valid existing sections covering:

- UX principles.
- Design tokens.
- Desktop/mobile navigation.
- Task management.
- Calendar.
- Existing Notes specifications.

Complete the truncated Notes section and add the missing Overview, data contracts, responsive rules, and acceptance criteria using the requirements below.

Do not leave incomplete sections.

### 2.2. design-system.md

Keep the clean visual language, but update layout constraints:

- Font: Inter, system sans-serif fallback.
- Background: `#F8FAFC`.
- Surface: `#FFFFFF`.
- Primary: `#2563EB`.
- Primary text: `#0F172A`.
- Secondary text: `#475569`.
- Border: `#E2E8F0`.
- Border radius: 10px cards, 8px inputs.
- Base spacing: 8px.
- Input/button height: 44px.
- Desktop sidebar: 224px.
- Tablet navigation rail: 64px.
- Mobile bottom navigation: approximately 64px plus safe area.
- Desktop content max-width: 1120px.
- Responsive breakpoints: 768px and 1024px.

Use simple borders, minimal shadows, consistent typography, and Lucide icons.

Remove rules that prohibit navigation expansion, sidebar navigation, Calendar, Notes, or Overview.

### 2.3. screens.md

Replace the old three-screen restriction.

The application now has six screens:

1. Login — `/login`.
2. Register — `/register`.
3. Tasks — `/tasks`.
4. Calendar — `/calendar`.
5. Notes — `/notes`.
6. Overview — `/overview`.

The authenticated root route `/` redirects to `/tasks`. Preserve login redirects for unauthenticated users.

Task forms, note editors, and confirmations are dialogs/full-screen mobile forms, not separate primary navigation pages.

Update all screen definitions and interactions accordingly.

---

# 3. Final Information Architecture

Exactly four authenticated navigation items:

| Page | Route | Main Purpose |
|---|---|---|
| Công việc | /tasks | Create and manage tasks |
| Lịch | /calendar | Track tasks by deadline |
| Ghi chú | /notes | Capture independent notes |
| Tổng quan | /overview | Review progress and completed work |

### Desktop

- Left sidebar, width 224px.
- Four navigation links.
- Account/logout control at the bottom.
- Main content to the right.
- No duplicate top navigation.

### Tablet

- Compact navigation rail, width 64px.
- Accessible tooltips.
- Content adapts to available width.

### Mobile

- Top page header.
- Four-item bottom navigation with icons and labels.
- No sidebar or hamburger navigation.
- Primary actions remain accessible above bottom navigation.
- No horizontal page overflow.

---

# 4. Tasks — Preserve and Refine

Keep existing functionality:

- Task CRUD.
- Title, description, deadline, priority.
- Todo / Doing / Done.
- Filter and sort.
- Completion reflection.

Layout:

- Single-column task list.
- Desktop: compact rows.
- Mobile: readable cards.
- One prominent Add Task action.
- Status can be changed directly.
- Reflection is optional after task completion.

Do not implement Kanban, drag-and-drop, team assignments, or subtasks.

---

# 5. Calendar — Month View Only

Route: `/calendar`.

Implement a simple deadline calendar.

### Desktop

- Month grid with seven columns.
- Previous/next month controls.
- "Hôm nay" button.
- Selected-day task panel, approximately 300px wide at 1200px+.
- Each day displays up to two task titles and `+N công việc` for overflow.

### Mobile

- Compact seven-column month grid.
- Show date numbers and small task indicators/counts.
- Below the grid, show tasks for the selected date.
- Do not render full task titles inside small mobile calendar cells.

### Behavior

- Monday is the first weekday.
- Clicking a date selects that date.
- Tasks appear according to their deadline.
- Completed tasks remain visible.
- Overdue unfinished tasks have a subtle warning state.
- Clicking a task opens its existing details.
- Creating a task from Calendar prefills its deadline.
- Calendar updates after task changes.

Use date-only handling for deadlines to prevent timezone-related day shifts.

Do not implement Week View, hourly events, calendar synchronization, or recurring tasks.

---

# 6. Notes — Complete Specification

Route: `/notes`.

Independent notes are separate from task completion reflections.

### Notes Page

Page title: "Ghi chú".

One quick-create control: "Viết ghi chú...".

### Notes Grid

Desktop:
- Three-column responsive grid where enough width exists.
- Two columns at intermediate widths.
- Minimum card height: approximately 160px.

Mobile:
- One-column card list.
- Cards fill available content width.

### NoteCard Component

Show:
- Optional note title.
- Content preview, maximum four lines.
- Last edited date.
- More-actions menu: Sửa / Xóa.

Sort notes by `updated_at` descending.

Use white surfaces, subtle borders, 10px radius, and 16px padding.

Do not assign random colors to cards.

### NoteEditor Component

Desktop:
- Modal, width 560px.

Mobile:
- Full-screen editor.

Fields:
- Tiêu đề — optional.
- Nội dung — plain multiline text.

Validation:
- At least one of title or content must contain non-whitespace text.
- Maximum title length: 120 characters.
- Maximum content length: 10,000 characters.

Actions:
- "Lưu ghi chú".
- "Hủy".

Ask for confirmation before discarding unsaved changes.

### Empty State

Display: "Chưa có ghi chú nào."

Do not add decorative illustrations, note categories, tags, folders, rich-text editing, or attachments.

---

# 7. Notes Data Contract

Use the existing backend architecture and database approach.

Create a `notes` resource.

### Data Schema

- `id`: primary key.
- `user_id`: foreign key to users, required.
- `title`: text, default empty string.
- `content`: text, default empty string.
- `created_at`: timestamp.
- `updated_at`: timestamp.

### REST API

- `GET /api/notes` — list the authenticated user's notes.
- `POST /api/notes` — create a note.
- `GET /api/notes/:id` — get one note.
- `PATCH /api/notes/:id` — update a note.
- `DELETE /api/notes/:id` — delete a note.

All endpoints require authentication.

Enforce note ownership on the backend.

Never trust `user_id` from client input.

Use the existing error response conventions. Preserve database migration safety and existing user data.

---

# 8. Overview — Complete Specification

Route: `/overview`.

The Dashboard provides a concise view of personal progress.

Do not create an enterprise analytics dashboard.

### Section A — Header

Title: "Tổng quan".

No greetings, slogans, or decorative text.

### Section B — Four KPI Cards

Implement exactly four cards:

**1. Đã xong (7 ngày)**

Number of tasks currently Done with `completed_at` within the last seven local calendar days, including today.

**2. Đang làm**

Current number of tasks with Doing status.

**3. Quá hạn**

Current number of unfinished tasks with a deadline before today's local date.

**4. Tỷ lệ hoàn thành**

`(Current Done tasks / Total current tasks) × 100`

Round to the nearest integer.

Label its scope: "Toàn bộ công việc".

When total task count is zero, show "—".

Do not invent trends, comparisons, or productivity scores.

### Section C — Completion Chart

Title: "Hoàn thành trong 7 ngày".

- Simple vertical bar chart.
- Exactly seven daily data points.
- X-axis: dates.
- Y-axis: completed task count.
- Group by local calendar date from `completed_at`.
- Use real data only.
- Display an appropriate empty state for no completed tasks.
- Responsive for mobile.

Do not introduce heatmaps, pie charts, gauges, or additional analytics.

### Section D — Recently Completed

Title: "Hoàn thành gần đây".

Display up to five completed tasks, ordered by `completed_at` descending.

Each item displays:
- Title.
- Completion date.
- Optional self-assessment.
- Optional reflection preview.

Clicking an item opens task details.

One "Xem tất cả" action navigates to `/tasks` with Done filter active.

### Layout

Desktop:
- Four KPI cards in one row where space allows.
- Full-width chart below.
- Recent completed list below the chart.

Mobile:
- Two-column KPI grid.
- Full-width chart.
- Recent completed list stacked vertically.

---

# 9. Dashboard Data Contract

Use actual authenticated-user data.

Backend endpoint:

`GET /api/dashboard`

Response must provide:

- `completedLast7Days`: integer.
- `doingCount`: integer.
- `overdueCount`: integer.
- `completionRate`: integer or null.
- `dailyCompletions`: array of exactly seven objects with `date` and `count`.
- `recentCompleted`: array of at most five completed-task summaries.

Dashboard calculations must be performed consistently with the database and frontend timezone rules.

Do not include other users' data.

If no dashboard endpoint exists, implement it with the existing Controller → Service → Repository architecture.

If one already exists, extend it without unnecessary duplication.

---

# 10. Shared UX States

Every page must support:

- Loading.
- Empty.
- Error.
- Success.
- Keyboard and touch interactions.

Mandatory rules:

- No permanently mocked application data.
- No non-functional buttons.
- No duplicate primary actions.
- No unnecessary modal stacking.
- Form values persist when submission fails.
- Destructive actions require confirmation.
- Status changes do not require confirmation.
- Important touch targets should be approximately 44×44px or larger.
- Visible keyboard focus.
- Readable contrast.
- Natural Vietnamese UI labels.

Verify at widths:

320px, 375px, 768px, 1024px, and 1440px.

---

# 11. Multi-Agent Delegation

**Coordinator Agent**
- Inspect current codebase.
- Update documentation precedence.
- Define shared contracts.
- Assign file ownership.
- Resolve integration conflicts.

**Design System / UX Agent**
- Update design-system.md and screens.md.
- Implement or refine AppShell and navigation.
- Check typography, component sizing, responsive layout, and UX consistency.

**Frontend Agent**
- Preserve/refine Tasks.
- Implement Calendar.
- Implement Notes.
- Implement Overview.
- Connect real API data.

**Backend Agent**
- Add Notes schema and API.
- Implement Calendar query support if necessary.
- Implement/extend Dashboard aggregation.
- Preserve task completion/reflection behavior.
- Enforce user ownership.

**QA Agent**
- Verify all six screens.
- Test CRUD, calendar, notes, dashboard and authentication.
- Review responsive layout.
- Find redundant components and broken behavior.
- Verify no regression.

Agents may operate in parallel only when their file ownership and dependencies are clear.

Do not allow concurrent uncontrolled edits to the same files.

---

# 12. Required Execution Order

1. Inspect existing documentation and code.
2. Complete `docs/prompt/UI.md`.
3. Update `design-system.md` and `screens.md` to remove conflicting restrictions.
4. Verify the three specifications are consistent.
5. Implement shared navigation and layout.
6. Implement Notes backend and any required Dashboard data changes.
7. Implement Calendar, Notes and Overview frontend.
8. Integrate real APIs.
9. Execute tests and inspect responsive behavior.
10. Fix integration, functional, and UX issues.

After step 4, continue implementation in the same run. Do not stop for another approval solely because the old specifications were previously locked; this prompt explicitly authorizes those changes.

If a genuine technical blocker remains, report its exact file, cause, and the smallest required decision. Otherwise, proceed.

---

# 13. Definition of Done

The work is complete when:

- `UI.md` is complete.
- `design-system.md` and `screens.md` match the new UI.
- Existing Login/Register/Task CRUD work.
- Navigation contains exactly four authenticated sections.
- Calendar displays and filters task deadlines correctly.
- Notes CRUD works and persists.
- Overview displays the four specified KPIs and seven-day chart.
- Existing task reflection functionality remains intact.
- Data is user-isolated.
- UI works across desktop/tablet/mobile.
- No duplicate actions or unnecessary UI elements.
- Build and applicable tests pass, or any remaining failures are accurately documented.

**Final direction:**

The approved target is a lightweight four-section personal productivity workspace.

The former three-screen UI restriction is superseded.

Do not rebuild the application unnecessarily. Keep existing working functionality and the clean visual style, but implement the new information architecture and complete features.

Execute the changes; do not respond with another design proposal unless implementation is technically blocked.