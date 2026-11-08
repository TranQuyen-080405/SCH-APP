> Bản thiết kế/lộ trình lịch sử. Hợp đồng hiện tại: `docs/api-contract.md`, `docs/erd.md` và source sau refactor 09/11/2026; không triển khai lại tính năng đã bỏ theo ví dụ cũ.

# MULTI-AGENT IMPLEMENTATION PROMPT — PERSONAL PRODUCTIVITY TRACKER

## 1. Mission

Continue developing the existing Personal Task Management web application.

The current application already focuses on authentication, task CRUD, task statuses, filtering, sorting, and responsive design.

**New objective:** Extend it into a lightweight Personal Productivity Tracker that helps users:

1. Manage their daily tasks.
2. Understand what they have accomplished.
3. Review their productivity over time.
4. Record the actual outcome and perceived effectiveness of completed tasks.

Use **TickTick's task management, Notes, and Summary experience** as UX inspiration, but do not copy its full feature set or visual identity.

This is an incremental product improvement, **not a full redesign or rebuild**.

The existing UI specification remains valid except where this prompt explicitly extends it, particularly the previous restriction against adding a Dashboard.

## 2. Product Philosophy

Design for ordinary users, not administrators or project managers.

Prioritize:

- **Useful over decorative:** Every element must serve an actual user need.
- **Clarity over density:** Important information is immediately understandable.
- **Action over analytics:** Tracking productivity must not interfere with completing tasks.
- **Reflection over gamification:** Let users evaluate their work instead of assigning artificial productivity scores.
- **Simplicity over complexity:** Implement the smallest complete solution that solves the problem.
- **Consistency:** Preserve the existing visual language, components, spacing, and interaction patterns.

Do not add gamification, AI-generated insights, complex goal systems, time tracking, collaboration, or unnecessary visualizations.

---

# 3. Feature A — Navigation & Information Architecture

Introduce two primary views:

**1. Công việc (Tasks)**

The existing task management screen.

**2. Tổng quan (Overview)**

A new dashboard for productivity tracking and completed-work reflection.

### Desktop

- Keep the existing application header.
- Add two clear navigation items: "Công việc" and "Tổng quan".
- Preserve the account/logout control.
- Use a centered content container.
- Do not introduce a full sidebar for only two views.
- Use a subtle but unmistakable active state.

### Mobile

- Keep a compact header.
- Place a two-option navigation control near the top.
- Make switching between Tasks and Overview easy with one tap.
- Avoid nested menus or horizontal page scrolling.
- Keep the Add Task action accessible on the Tasks view.

Navigation must be predictable and consistent across both screen sizes.

---

# 4. Feature B — Productivity Dashboard

## Dashboard Structure

The dashboard should answer:

- How much work have I completed?
- What still requires attention?
- How has my completion activity changed?
- What were the results of my completed work?

### Component 1 — Overview Header

**Position:** Top of Dashboard content.

**Content:**
- Title: "Tổng quan".
- Period selector: "7 ngày" / "30 ngày".

Do not add lengthy motivational messages, greetings, or decorative subtitles.

The period selector must clearly affect period-based metrics and charts without unnecessarily changing current-state metrics.

### Component 2 — Summary Metrics

**Position:** Directly below the Dashboard header.

Display four concise metric cards:

**Card A — Đã hoàn thành**
- Number of tasks completed in the selected period.
- Derived from actual completion timestamps.

**Card B — Đang làm**
- Current number of tasks with Doing status.

**Card C — Quá hạn**
- Current number of unfinished tasks whose deadline has passed.

**Card D — Tỷ lệ hoàn thành**
- Number of currently Done tasks divided by total current tasks.
- Explicitly represent this as the current overall completion rate, not a period-specific productivity score.
- Handle the zero-task case without misleading percentages.

Each metric card contains:
- A short label.
- One prominent numerical value.
- Optional brief clarification only when necessary.

Avoid decorative icons, redundant text, artificial trends, or comparisons without historical data.

**Desktop:** Responsive metric grid.

**Mobile:** Two-column grid where readable; otherwise adapt to the available width.

### Component 3 — Completion Trend

**Position:** Below metric cards.

**Purpose:** Show task completion activity over time.

**Visualization:**
- Simple daily bar chart.
- Last 7 or 30 days.
- X-axis: Date.
- Y-axis: Number of tasks completed.

Requirements:
- Real data only.
- Clear labels and accessible values.
- No unnecessary animation.
- Do not use a complex charting library if a simpler implementation is sufficient.
- Adapt date labels and chart density for mobile.
- Show a useful empty state if no completed tasks exist.

Do not use a pie chart, progress rings, heatmap, or multiple charts that merely repeat the same information.

### Component 4 — Recently Completed Tasks

**Position:** Below the trend chart.

**Title:** "Đã hoàn thành gần đây".

Display a concise list of recently completed tasks.

Each item shows:
- Task title.
- Completion date.
- Optional self-assessment.
- Short reflection preview if available.

Actions:
- Open completed task details.
- Add or edit reflection.
- "Xem tất cả" navigates to the existing Tasks view filtered by Done.

Do not build a separate complex history-management module.

---

# 5. Feature C — Completion Reflection

## Goal

Allow users to evaluate the actual results of their work through self-written notes.

This is a personal reflection feature, not automatic productivity assessment.

**Crucial UX principle: Completing a task must never require filling in a reflection.**

### Component 1 — Completion Interaction

When a user changes a task to Done:

1. Update the task status.
2. Record its completion timestamp.
3. Immediately reflect the successful state in the UI.
4. Offer a subtle optional action: "Ghi nhận kết quả".

The user can ignore this action and continue working.

Avoid mandatory popups, multi-step completion flows, or unnecessary confirmation dialogs.

The same reflection action must remain accessible later from completed task details.

### Component 2 — Reflection Form

**Title:** "Kết quả công việc".

Fields:

**A. Tự đánh giá**
An optional single-select field:

- Tốt
- Đạt yêu cầu
- Cần cải thiện

These represent the user's own evaluation. They must never be presented as an objective, automatically calculated measurement.

**B. Ghi chú kết quả**
An optional multiline textarea.

Placeholder:

"Bạn đã làm được gì? Có điều gì cần cải thiện?"

The user can freely record the outcome, difficulties, lessons learned, or other observations.

**Actions:**
- "Lưu ghi chú".
- "Hủy".

No additional required fields.

### Component 3 — Reflection Display

Show saved reflections inside the completed task's detail view.

Include:
- Self-assessment, if provided.
- Actual written note, if provided.
- Ability to edit the reflection.

Do not display blank fields or "Chưa đánh giá" badges on every task.

### Desktop UX

Use the existing task detail/editing interaction pattern, extending it with a reflection section only for completed tasks.

### Mobile UX

Use a readable full-screen form or the application's existing mobile task form pattern.

Avoid deeply nested dialogs, tiny textareas, or complex rich-text editors.

---

# 6. Feature D — Data Model & Backend

Inspect the existing database schema and backend architecture before making changes.

Preserve the current architecture and patterns where appropriate.

Extend the Task entity with the minimum required fields:

- `completed_at`: nullable timestamp.
- `outcome_note`: nullable text.
- `outcome_rating`: nullable enum-like value (`good`, `met`, `improve`).

Use a lightweight database migration. Preserve all existing users and tasks.

### Business Rules

1. When a task first enters Done, set `completed_at` to the completion time.
2. Editing an already completed task must not overwrite `completed_at`.
3. When a task is reopened, clear `completed_at` so it is no longer counted as completed.
4. Preserve user-written reflection when reopening a task; never silently delete it.
5. When the task is completed again, record a new completion timestamp.
6. A task can be completed without a rating or note.
7. Only the task owner can access or change its reflection.
8. Validate note length and allowed rating values.
9. Use consistent timestamps and clearly defined date/timezone handling.
10. Historical completion charts represent the latest stored completion state, not an event audit log.

### Dashboard Data

Provide a minimal authenticated Dashboard API, for example:

`GET /api/dashboard?period=7d`

Support `7d` and `30d`.

It should provide enough data for:
- Completed tasks in selected period.
- Current Doing count.
- Current overdue count.
- Current overall completion ratio.
- Daily completion counts.

Reuse or extend the existing tasks endpoint for recently completed tasks.

Do not fetch all users' data, and do not trust a user ID supplied by the client.

### Statistical Accuracy

- Completed counts use `completed_at`.
- The deadline date itself is not overdue until that date has passed.
- Done tasks are excluded from overdue counts.
- Tasks without deadlines are excluded from overdue counts.
- Tasks without a completion timestamp must not be assigned an invented completion date.
- Period boundaries and daily groupings must use consistent timezone rules.
- Distinguish user self-assessment from automatically calculated statistics.

Avoid introducing an analytics database, event bus, background job, or reporting microservice.

---

# 7. Multi-Agent Execution Strategy

Use specialized agents only when the available environment supports them and their responsibilities are independent enough to benefit from parallel execution.

## Agent 1 — Coordinator / Architect

Responsibilities:
- Inspect the existing codebase.
- Identify current features, architecture, dependencies, and project conventions.
- Detect existing reusable components.
- Prepare a minimal implementation plan.
- Establish data contracts and acceptance criteria.
- Assign clear file ownership to other agents.
- Resolve conflicts and integration decisions.

Do not rewrite working code unnecessarily.

## Agent 2 — Product UX/UI Designer

Responsibilities:
- Analyze the current user journey.
- Design Desktop and Mobile Dashboard layouts.
- Define reflection interactions and user feedback states.
- Ensure navigation remains lightweight.
- Review visual hierarchy, readability, and touch accessibility.
- Remove redundant text and components.

Deliverable:
- Component specifications.
- Desktop/mobile layout decisions.
- Interaction requirements.
- Empty/loading/error state specifications.

This agent must prioritize usability over visual novelty.

## Agent 3 — Backend & Database Engineer

Responsibilities:
- Implement necessary schema changes.
- Update Task Repository, Service, and Controller.
- Implement reflection persistence.
- Implement Dashboard data aggregation.
- Enforce user ownership.
- Handle completion timestamps and edge cases.
- Add backend tests.

Deliverable:
- Working API and migrations.
- Verified data calculations.

Do not alter unrelated frontend files.

## Agent 4 — Frontend Engineer

Responsibilities:
- Implement primary navigation.
- Build Dashboard UI using reusable components.
- Integrate actual API responses.
- Implement completed-task reflection.
- Maintain desktop/mobile consistency.
- Handle loading, success, error, and empty states.

Deliverable:
- Fully working responsive frontend.

Do not introduce mock data as permanent application behavior.

## Agent 5 — QA / Code Review

Responsibilities:
- Review integrated functionality.
- Check UX consistency across screen sizes.
- Check API integration and data correctness.
- Test authentication and data isolation.
- Identify accessibility issues and redundant UI.
- Verify existing features have not regressed.

Deliverable:
- Concrete issues with reproduction steps.
- Test results.
- Confirmation of acceptance criteria.

---

# 8. Execution Workflow

Follow this order:

**Phase 1 — Codebase Inspection**

Coordinator reads the current project, identifies completed features, and determines the minimum changes required.

**Phase 2 — UX & API Contract**

UX and Backend agents define layouts, interactions, data structures, and API contracts. Independent analysis may run in parallel.

**Phase 3 — Implementation**

Backend implements persistence and API behavior.

Frontend builds the agreed interface and integrates the API once the relevant contracts are stable.

Assign non-overlapping file ownership wherever parallel work is used.

**Phase 4 — Integration**

Verify navigation, state updates, reflection persistence, Dashboard statistics, and error handling.

**Phase 5 — Cross-Agent Review**

QA reviews the integrated result. Any critical functional or UX issue must be assigned back to the responsible implementation agent.

**Phase 6 — Final Verification**

Run available build, lint, and tests. Inspect both desktop and mobile layouts where browser tooling is available.

Do not claim tests or visual reviews were performed if they were not actually executed.

---

# 9. Acceptance Criteria

The feature is complete only when:

- Existing Register, Login, Logout, and Task CRUD still work.
- Desktop and mobile users can switch between Tasks and Overview.
- Dashboard displays real user-specific data.
- Completion timestamps are handled correctly.
- A user can complete a task without entering any reflection.
- Completed tasks can have reflections added, edited, and saved.
- Reflection data persists after refreshing the page.
- Dashboard statistics update correctly after task changes.
- Empty data does not produce fabricated statistics.
- Users cannot access other users' tasks or reflections.
- Layout works at 320px, 375px, 768px, and 1280px widths.
- No horizontal page overflow or obstructed controls.
- No duplicated actions, broken navigation, or non-functional buttons.
- No significant regression in existing functionality.

---

# 10. Strict Scope Control

Do not implement:

- AI productivity scoring.
- Automated effectiveness judgments.
- Time tracking or Pomodoro.
- Gamification or streaks.
- Team collaboration.
- Habit tracking.
- Complex calendar interfaces.
- Goal-setting systems.
- AI-generated summaries.
- Multiple analytics dashboards.
- Enterprise reporting tools.
- Unnecessary new dependencies.

Do not introduce additional pages unless they provide a clearly necessary interaction.

Use the current stack, project conventions, and architectural patterns.

---

# 11. Final Deliverables

1. Updated responsive UI.
2. Working Dashboard integrated with real data.
3. Completion reflection feature.
4. Minimal database migration.
5. Updated API implementation.
6. Relevant tests.
7. Updated README or concise technical documentation.
8. Final implementation report.

The final report must include:
- Features completed.
- Files changed.
- Tests actually executed.
- Remaining limitations, if any.

**Final instruction:**

Do not restart the project or redesign functioning components without justification. Build on the existing implementation, favor minimal maintainable changes, and deliver working functionality rather than stopping at architecture proposals.

The application should help people manage their work, see their progress, and understand their own results — without making the experience more complicated.

