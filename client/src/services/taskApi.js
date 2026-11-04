import { request } from "./api.js";

const SORTS = {
  due_asc: ["deadline", "asc"],
  due_desc: ["deadline", "desc"],
  newest: ["created_at", "desc"],
};

export function listTasks(status, sortKey) {
  const params = new URLSearchParams();
  if (status === "todo" || status === "doing" || status === "done") {
    params.set("status", status);
  }
  const [sort, order] = SORTS[sortKey] || SORTS.newest;
  params.set("sort", sort);
  params.set("order", order);
  return request(`/api/tasks?${params.toString()}`);
}

export function createTask(body) {
  return request("/api/tasks", { method: "POST", body });
}

export function updateTask(id, body) {
  return request(`/api/tasks/${id}`, { method: "PATCH", body });
}

export function deleteTask(id) {
  return request(`/api/tasks/${id}`, { method: "DELETE" });
}

export function getDashboard(period) {
  return request(`/api/dashboard?period=${encodeURIComponent(period)}`);
}

export function listRecentDone() {
  return request("/api/tasks?status=done&sort=completed_at&order=desc");
}
