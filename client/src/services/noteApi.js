import { request } from "./api.js";

export function listNotes() {
  return request("/api/notes");
}

export function createNote(body) {
  return request("/api/notes", { method: "POST", body });
}

export function updateNote(id, body) {
  return request(`/api/notes/${id}`, { method: "PATCH", body });
}

export function deleteNote(id) {
  return request(`/api/notes/${id}`, { method: "DELETE" });
}
