import assert from "node:assert/strict";
import test from "node:test";
import {
  groupTasksByProject,
  matchesTaskPeriod,
  shiftDay,
} from "../src/taskViews.js";

test("date shifting handles leap days and year boundaries", () => {
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
  assert.equal(shiftDay("2028-02-28", 1), "2028-02-29");
  assert.equal(shiftDay("2026-03-01", -1), "2026-02-28");
});

test("project groups preserve every task, including legacy unassigned and a project awaiting refresh", () => {
  const tasks = [
    { id: 1, projectId: 2 },
    { id: 2, projectId: 1, status: "done" },
    { id: 3, projectId: null },
    { id: 4 },
    { id: 5, projectId: 9 },
  ];
  const projects = [
    { id: 1, name: "Công việc", color: "#55ccaa" },
    { id: 2, name: "Học tập", color: "#ffaa55" },
    { id: 3, name: "Rỗng" },
  ];
  const groups = groupTasksByProject(tasks, projects);
  assert.deepEqual(
    groups.map((group) => [group.id, group.tasks.map((task) => task.id)]),
    [
      [1, [2]],
      [2, [1]],
      [null, [3, 4]],
      [9, [5]],
    ],
  );
  assert.equal(
    groups.find((group) => group.id === null).name,
    "Chưa chia dự án",
  );
  assert.equal(
    new Set(groups.flatMap((group) => group.tasks.map((task) => task.id))).size,
    tasks.length,
  );
  assert.deepEqual(groupTasksByProject([], projects), []);
});
test("seven day shortcut includes today and six following days only", () => {
  for (const deadline of ["2026-11-08", "2026-11-14"])
    assert.equal(matchesTaskPeriod({ deadline }, "week", "2026-11-08"), true);
  for (const deadline of [null, "2026-11-07", "2026-11-15"])
    assert.equal(matchesTaskPeriod({ deadline }, "week", "2026-11-08"), false);
});

test("overdue shortcut excludes completed tasks, today, and tasks without deadlines", () => {
  assert.equal(
    matchesTaskPeriod(
      { deadline: "2026-11-07", status: "doing" },
      "overdue",
      "2026-11-08",
    ),
    true,
  );
  for (const task of [
    { deadline: "2026-11-07", status: "done" },
    { deadline: "2026-11-08", status: "todo" },
    { deadline: null, status: "todo" },
  ])
    assert.equal(matchesTaskPeriod(task, "overdue", "2026-11-08"), false);
  assert.equal(
    matchesTaskPeriod({ deadline: "2026-11-08" }, "today", "2026-11-08"),
    true,
  );
  assert.equal(
    matchesTaskPeriod({ deadline: null }, "all", "2026-11-08"),
    true,
  );
});
