import { localTodayIso } from "./dates.js";

export function shiftDay(iso, amount) {
  const day = new Date(`${iso}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() + amount);
  return day.toISOString().slice(0, 10);
}

export function matchesTaskPeriod(task, period, today = localTodayIso()) {
  if (period === "today") return task.deadline === today;
  if (period === "week")
    return Boolean(
      task.deadline &&
        task.deadline >= today &&
        task.deadline <= shiftDay(today, 6),
    );
  if (period === "overdue")
    return Boolean(
      task.deadline && task.deadline < today && task.status !== "done",
    );
  return true;
}

export function groupTasksByProject(tasks, projects) {
  const groups = new Map(
    projects.map((project) => [project.id, { ...project, tasks: [] }]),
  );
  for (const task of tasks) {
    const id = task.projectId ?? null;
    if (!groups.has(id))
      groups.set(id, {
        id,
        name: id === null ? "Chưa chia dự án" : "Dự án",
        color: "#a4a7b2",
        tasks: [],
      });
    groups.get(id).tasks.push(task);
  }
  return [...groups.values()].filter((group) => group.tasks.length > 0);
}
