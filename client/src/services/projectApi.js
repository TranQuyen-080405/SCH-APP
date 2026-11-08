import { request } from "./api.js";

export const listProjects = () => request("/api/projects");
export const createProject = (body) =>
  request("/api/projects", { method: "POST", body });
export const updateProject = (id, body) =>
  request(`/api/projects/${id}`, { method: "PATCH", body });
export const deleteProject = (id) =>
  request(`/api/projects/${id}`, { method: "DELETE" });
